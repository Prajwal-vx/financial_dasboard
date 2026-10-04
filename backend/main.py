from contextlib import asynccontextmanager
from collections import deque
from datetime import date, datetime, timezone
from decimal import Decimal
import hashlib
from html.parser import HTMLParser
import json
import math
import os
from pathlib import Path
import re
from threading import Lock
from time import monotonic
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.db import Base, engine, get_db
from backend.ledger import account_balance, create_transaction, get_account_balances
from backend.models import Account, AuditLog, Category, SessionToken, Transaction, User
from backend.schemas import (
    AccountBalanceSummary,
    AccountInput,
    AccountOutput,
    AuthResponse,
    AuthSessionOutput,
    CategoryInput,
    CategoryOutput,
    LoginInput,
    RegisterInput,
    SummaryOutput,
    TransactionInput,
    TransactionOutput,
    UserOutput,
)
from backend.security import (
    DUMMY_PASSWORD_HASH,
    SESSION_COOKIE_NAME,
    bearer,
    get_current_user,
    hash_password,
    issue_session,
    resolve_current_user,
    session_ttl_hours,
    verify_password,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


production = os.getenv("APP_ENV", "development").lower() == "production"
app = FastAPI(
    title="FinSight API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if production else "/docs",
    redoc_url=None if production else "/redoc",
    openapi_url=None if production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent


class AuthRateLimiter:
    def __init__(self, limit: int = 10, window_seconds: int = 60, max_clients: int = 4096):
        self.limit = limit
        self.window_seconds = window_seconds
        self.max_clients = max_clients
        self.attempts: dict[str, deque[float]] = {}
        self.lock = Lock()

    def retry_after(self, client_ip: str) -> int | None:
        now = monotonic()
        cutoff = now - self.window_seconds
        with self.lock:
            attempts = self.attempts.get(client_ip)
            if attempts is None:
                if len(self.attempts) >= self.max_clients:
                    for known_ip, known_attempts in list(self.attempts.items()):
                        while known_attempts and known_attempts[0] <= cutoff:
                            known_attempts.popleft()
                        if not known_attempts:
                            del self.attempts[known_ip]
                    if len(self.attempts) >= self.max_clients:
                        return self.window_seconds
                attempts = self.attempts.setdefault(client_ip, deque())
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= self.limit:
                return max(1, int(attempts[0] + self.window_seconds - now + 0.999))
            attempts.append(now)
            return None

    def clear(self):
        with self.lock:
            self.attempts.clear()


auth_rate_limiter = AuthRateLimiter()
LIVE_MARKET_SOURCE_URL = "https://www.sharesansar.com/live-trading"
LIVE_MARKET_LIMIT = 50
LIVE_MARKET_CACHE_SECONDS = 30
_market_cache_lock = Lock()
_market_cache_assets = None
_market_cache_expires_at = 0.0


class _LiveMarketTableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_market_table = False
        self.current_row = None
        self.current_cell = None
        self.rows = []
        self.page_text = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "table" and attributes.get("id") == "headFixed":
            self.in_market_table = True
        elif self.in_market_table and tag == "tr":
            self.current_row = []
        elif self.in_market_table and tag in {"td", "th"} and self.current_row is not None:
            self.current_cell = []

    def handle_data(self, data):
        self.page_text.append(data)
        if self.current_cell is not None:
            self.current_cell.append(data)

    def handle_endtag(self, tag):
        if not self.in_market_table:
            return
        if tag in {"td", "th"} and self.current_cell is not None:
            self.current_row.append(" ".join("".join(self.current_cell).split()))
            self.current_cell = None
        elif tag == "tr" and self.current_row is not None:
            self.rows.append(self.current_row)
            self.current_row = None
        elif tag == "table":
            self.in_market_table = False


def _market_number(value):
    try:
        number = float(value.replace(",", "").strip())
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def _fetch_live_market_assets():
    global _market_cache_assets, _market_cache_expires_at
    with _market_cache_lock:
        now = monotonic()
        if _market_cache_assets is not None and now < _market_cache_expires_at:
            return _market_cache_assets
        response = httpx.get(LIVE_MARKET_SOURCE_URL, timeout=5,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"})
        if response.status_code != 200:
            raise HTTPException(status_code=503, detail="NEPSE market source unavailable")

        parser = _LiveMarketTableParser()
        parser.feed(response.text)
        fetched_at = datetime.now(timezone.utc).isoformat()
        source_text = " ".join(parser.page_text)
        source_status = re.search(
            r"As of\s*: ?\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(Market Open|Market Closed)",
            source_text, re.IGNORECASE)
        source_timestamp = source_status.group(1) if source_status else None
        market_status = source_status.group(2).title() if source_status else "Status unavailable"
        assets = []
        for row in parser.rows:
            if len(row) < 10 or row[1].strip().upper() == "SYMBOL":
                continue
            symbol = row[1].strip().upper()
            price, change = _market_number(row[2]), _market_number(row[3])
            change_pct, day_high = _market_number(row[4]), _market_number(row[6])
            day_low, volume = _market_number(row[7]), _market_number(row[8])
            if (not re.fullmatch(r"[A-Z0-9.-]{1,20}", symbol) or price is None or price <= 0
                    or change is None or change_pct is None or volume is None or volume < 0):
                continue
            assets.append({
                "id": symbol.lower(), "symbol": symbol, "name": symbol,
                "category": "active", "isIndex": False,
                "priceNPR": round(price, 2), "changePct": round(change_pct, 2),
                "changeNPR": round(change, 2),
                "dayLow": round(day_low if day_low is not None else price, 2),
                "dayHigh": round(day_high if day_high is not None else price, 2),
                "volume": int(volume), "cap": "—", "history": [price],
                "fetchedAt": fetched_at, "sourceTimestamp": source_timestamp,
                "marketStatus": market_status,
            })
        assets.sort(key=lambda asset: asset["volume"], reverse=True)
        if len(assets) < LIVE_MARKET_LIMIT:
            raise HTTPException(status_code=503, detail="NEPSE market source returned fewer than 50 securities")
        _market_cache_assets = assets[:LIVE_MARKET_LIMIT]
        _market_cache_expires_at = monotonic() + LIVE_MARKET_CACHE_SECONDS
        return _market_cache_assets

@app.middleware("http")
async def apply_security_controls(request: Request, call_next):
    # Enforce request body size limit (1MB max for financial endpoints)
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > 1_048_576:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request payload too large"},
                )
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header"})

    if request.method == "POST" and request.url.path in {"/api/auth/login", "/api/auth/register"}:
        client_ip = request.client.host if request.client else "unknown"
        retry_after = auth_rate_limiter.retry_after(client_ip)
        if retry_after is not None:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many authentication attempts. Try again later."},
                headers={"Retry-After": str(retry_after)},
            )
        else:
            response = await call_next(request)
    else:
        response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' https://unpkg.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; "
        "connect-src 'self'; object-src 'none'; base-uri 'self'; "
        "frame-ancestors 'none'; form-action 'self'"
    )
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    else:
        response.headers.setdefault("Cache-Control", "no-cache")
    if production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(WORKSPACE_ROOT / "login.html")


@app.get("/login", include_in_schema=False)
def login_page(request: Request, db: Session = Depends(get_db)):
    # SECURITY: If user is already authenticated, redirect to dashboard
    try:
        user = resolve_current_user(request=request, credentials=None, db=db)
        if user:
            return FileResponse(WORKSPACE_ROOT / "index.html")
    except HTTPException:
        pass
    return FileResponse(WORKSPACE_ROOT / "login.html")


@app.get("/dashboard", include_in_schema=False)
def dashboard(request: Request, db: Session = Depends(get_db)):
    # SECURITY: Check if user is authenticated before serving dashboard
    try:
        user = resolve_current_user(request=request, credentials=None, db=db)
        if user:
            return FileResponse(WORKSPACE_ROOT / "index.html")
    except HTTPException:
        pass
    # Not authenticated - redirect to login
    return FileResponse(WORKSPACE_ROOT / "login.html")


@app.get("/styles.css", include_in_schema=False)
def styles():
    return FileResponse(WORKSPACE_ROOT / "styles.css", media_type="text/css")


@app.get("/logo.svg", include_in_schema=False)
def logo():
    return FileResponse(WORKSPACE_ROOT / "logo.svg", media_type="image/svg+xml")


@app.get("/app.js", include_in_schema=False)
def frontend_script():
    return FileResponse(WORKSPACE_ROOT / "app.js", media_type="text/javascript")


@app.get("/login.js", include_in_schema=False)
def login_script():
    return FileResponse(WORKSPACE_ROOT / "login.js", media_type="text/javascript")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/market")
def live_market():
    try:
        return _fetch_live_market_assets()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="NEPSE market source unavailable") from error


@app.get("/api/auth/register", include_in_schema=False)
def register_get():
    raise HTTPException(status_code=405, detail="Use POST to create an account")


@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterInput, db: Session = Depends(get_db)):
    user = User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        currency=payload.currency.upper(),
    )
    db.add(user)
    try:
        db.flush()
        categories = [
            ("Income", "income"), ("Housing & Rent", "expense"), ("Food & Groceries", "expense"),
            ("Education & Tuition", "expense"), ("Health & Medical Care", "expense"),
            ("Utilities & Bills", "expense"), ("Transport & Fuel", "expense"),
            ("NEPSE & Investments", "expense"), ("Shopping & Lifestyle", "expense"),
            ("Entertainment & Travel", "expense"), ("Family & Festivals", "expense"),
        ]
        db.add_all([Category(user_id=user.id, name=name, type=kind) for name, kind in categories])
        db.add(Account(user_id=user.id, name="Cash", account_type="cash", currency=payload.currency.upper(), opening_balance=Decimal("0.00")))
        # SECURITY: Do not auto-login after registration for better security
        # User must explicitly log in with their credentials
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    # Return user info but no token - user must login explicitly
    response = JSONResponse(
        content=AuthResponse(
            access_token="",  # Empty token - user must login
            token_type="bearer",
            user=UserOutput(id=user.id, name=user.name, email=user.email, currency=user.currency),
        ).model_dump(mode="json"),
        status_code=201,
    )
    # Do not set session cookie - user must login explicitly
    return response


@app.get("/api/auth/login", include_in_schema=False)
def login_get():
    raise HTTPException(status_code=405, detail="Use POST to sign in")


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    password_ok = verify_password(payload.password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if user is None or not password_ok:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    token = issue_session(db, user)
    db.commit()
    response = JSONResponse(
        content=AuthResponse(
            access_token=token,
            token_type="bearer",
            user=UserOutput(id=user.id, name=user.name, email=user.email, currency=user.currency),
        ).model_dump(mode="json"),
    )
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=production,
        path="/",
        max_age=session_ttl_hours() * 3600,
    )
    return response


@app.post("/api/auth/logout", status_code=204)
def logout(
    request: Request,
    user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    raw_token = credentials.credentials if credentials is not None else request.cookies.get(SESSION_COOKIE_NAME)
    if raw_token is None:
        response = Response(status_code=204)
        response.delete_cookie(key=SESSION_COOKIE_NAME, path="/", samesite="lax", secure=production)
        return response
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    session = db.scalar(select(SessionToken).where(SessionToken.user_id == user.id, SessionToken.token_hash == token_hash))
    if session:
        db.delete(session)
        db.commit()
    response = Response(status_code=204)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/", samesite="lax", secure=production)
    return response


@app.get("/api/auth/session", response_model=AuthSessionOutput)
def session_status(request: Request, db: Session = Depends(get_db)):
    try:
        user = resolve_current_user(request=request, credentials=None, db=db)
    except HTTPException:
        return AuthSessionOutput(authenticated=False, user=None)
    return AuthSessionOutput(
        authenticated=True,
        user=UserOutput(id=user.id, name=user.name, email=user.email, currency=user.currency),
    )


@app.get("/api/auth/me", response_model=UserOutput)
def me(user: User = Depends(get_current_user)):
    return UserOutput(id=user.id, name=user.name, email=user.email, currency=user.currency)


@app.get("/api/categories", response_model=list[CategoryOutput])
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.name)).all()


@app.post("/api/categories", response_model=CategoryOutput, status_code=201)
def add_category(payload: CategoryInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.scalar(select(Category).where(
        Category.user_id == user.id,
        func.lower(Category.name) == payload.name.lower(),
        Category.type == payload.type,
    ))
    if existing:
        raise HTTPException(status_code=409, detail="A category with this name and type already exists")
    category = Category(
        user_id=user.id,
        name=payload.name,
        type=payload.type,
        icon=payload.icon,
        color=payload.color,
    )
    db.add(category)
    db.flush()
    db.add(AuditLog(
        user_id=user.id,
        action="category.created",
        entity_type="category",
        entity_id=category.id,
        new_value=json.dumps({"name": category.name, "type": category.type}),
    ))
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(category)
    return category


@app.get("/api/accounts", response_model=list[AccountOutput])
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.scalars(select(Account).where(Account.user_id == user.id, Account.status == "active").order_by(Account.id)).all()
    balances = get_account_balances(db, user.id, accounts)
    return [
        AccountOutput(
            id=account.id,
            name=account.name,
            account_type=account.account_type,
            institution=account.institution,
            currency=account.currency,
            opening_balance=account.opening_balance,
            current_balance=balances[account.id],
        )
        for account in accounts
    ]


@app.post("/api/accounts", response_model=AccountOutput, status_code=201)
def add_account(payload: AccountInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.currency != user.currency:
        raise HTTPException(status_code=422, detail=f"Accounts must use your workspace currency ({user.currency})")
    existing = db.scalar(select(Account).where(
        Account.user_id == user.id,
        func.lower(Account.name) == payload.name.lower(),
        Account.status == "active",
    ))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this name already exists")
    account = Account(user_id=user.id, **payload.model_dump())
    db.add(account)
    db.flush()
    db.add(AuditLog(
        user_id=user.id,
        action="account.created",
        entity_type="account",
        entity_id=account.id,
        new_value=json.dumps({"name": account.name, "account_type": account.account_type, "opening_balance": str(account.opening_balance)}),
    ))
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)
    return account_output(db, account)


def account_output(db: Session, account: Account) -> AccountOutput:
    return AccountOutput(
        id=account.id,
        name=account.name,
        account_type=account.account_type,
        institution=account.institution,
        currency=account.currency,
        opening_balance=account.opening_balance,
        current_balance=account_balance(db, account),
    )


@app.get("/api/transactions", response_model=list[TransactionOutput])
def list_transactions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    start_date: date | None = None,
    end_date: date | None = None,
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")
    query = select(Transaction).where(Transaction.user_id == user.id, Transaction.deleted_at.is_(None))
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    return db.scalars(query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).offset(offset).limit(limit)).all()


@app.post("/api/transactions", response_model=TransactionOutput, status_code=201)
def add_transaction(payload: TransactionInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_transaction(db, user, payload)


@app.delete("/api/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if transaction_id <= 0:
        raise HTTPException(status_code=404, detail="Transaction was not found")
    transaction = db.scalar(select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
    ))
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction was not found")
    old_value = {
        "amount": str(transaction.amount),
        "type": transaction.type,
        "description": transaction.description,
        "account_id": transaction.account_id,
        "destination_account_id": transaction.destination_account_id,
        "category_id": transaction.category_id,
        "transaction_date": transaction.transaction_date.isoformat(),
    }
    transaction.deleted_at = datetime.now(timezone.utc)
    db.add(AuditLog(
        user_id=user.id,
        action="transaction.deleted",
        entity_type="transaction",
        entity_id=transaction.id,
        old_value=json.dumps(old_value),
    ))
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


@app.get("/api/summary", response_model=SummaryOutput)
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.scalars(select(Account).where(Account.user_id == user.id, Account.status == "active")).all()
    balances_map = get_account_balances(db, user.id, accounts)
    balances = [AccountBalanceSummary(account_id=account.id, balance=balances_map[account.id], currency=account.currency) for account in accounts]
    try:
        user_timezone = ZoneInfo(user.timezone)
    except ZoneInfoNotFoundError:
        user_timezone = timezone.utc
    today = datetime.now(user_timezone).date()
    month_start = today.replace(day=1)
    if month_start.month == 12:
        next_month_start = date(month_start.year + 1, 1, 1)
    else:
        next_month_start = date(month_start.year, month_start.month + 1, 1)
    totals = db.execute(select(
        Transaction.type,
        func.coalesce(func.sum(Transaction.amount), 0),
    ).where(
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
        Transaction.status == "posted",
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < next_month_start,
        Transaction.type.in_(["income", "expense"]),
    ).group_by(Transaction.type)).all()
    monthly = {kind: Decimal(amount) if amount is not None else Decimal("0.00") for kind, amount in totals}
    return SummaryOutput(
        accounts=balances,
        account_balance=sum((item.balance for item in balances), Decimal("0.00")),
        monthly_income=monthly.get("income", Decimal("0.00")),
        monthly_expense=monthly.get("expense", Decimal("0.00")),
        month_start=month_start.isoformat(),
        as_of=datetime.now(timezone.utc).isoformat(),
    )
