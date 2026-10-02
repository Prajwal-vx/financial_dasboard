from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
import hashlib
import json
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.db import Base, engine, get_db
from backend.ledger import account_balance, create_transaction
from backend.models import Account, AuditLog, Category, SessionToken, Transaction, User
from backend.schemas import AccountInput, AccountOutput, LoginInput, RegisterInput, TransactionInput, TransactionOutput
from backend.security import bearer, get_current_user, hash_password, issue_session, verify_password


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="FinSight API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(WORKSPACE_ROOT / "index.html")


@app.get("/styles.css", include_in_schema=False)
def styles():
    return FileResponse(WORKSPACE_ROOT / "styles.css", media_type="text/css")


@app.get("/app.js", include_in_schema=False)
def frontend_script():
    return FileResponse(WORKSPACE_ROOT / "app.js", media_type="text/javascript")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterInput, db: Session = Depends(get_db)):
    user = User(name=payload.name.strip(), email=payload.email.lower(), password_hash=hash_password(payload.password), currency=payload.currency)
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
        db.add(Account(user_id=user.id, name="Cash", account_type="cash", currency=payload.currency, opening_balance=Decimal("0.00")))
        token = issue_session(db, user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email, "currency": user.currency}}


@app.post("/api/auth/login")
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    token = issue_session(db, user)
    db.commit()
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email, "currency": user.currency}}


@app.post("/api/auth/logout", status_code=204)
def logout(
    user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(credentials.credentials.encode()).hexdigest()
    session = db.scalar(select(SessionToken).where(SessionToken.user_id == user.id, SessionToken.token_hash == token_hash))
    if session:
        db.delete(session)
        db.commit()


@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "currency": user.currency}


@app.get("/api/categories")
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.name)).all()


@app.get("/api/accounts", response_model=list[AccountOutput])
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.scalars(select(Account).where(Account.user_id == user.id, Account.status == "active").order_by(Account.id)).all()
    return [account_output(db, account) for account in accounts]


@app.post("/api/accounts", response_model=AccountOutput, status_code=201)
def add_account(payload: AccountInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.currency != user.currency:
        raise HTTPException(status_code=422, detail=f"Accounts must use your workspace currency ({user.currency})")
    account = Account(user_id=user.id, **payload.model_dump())
    db.add(account)
    db.commit()
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
    transaction = db.scalar(select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
    ))
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction was not found")
    old_value = {"amount": str(transaction.amount), "type": transaction.type, "description": transaction.description}
    transaction.deleted_at = datetime.now(timezone.utc)
    db.add(AuditLog(
        user_id=user.id,
        action="transaction.deleted",
        entity_type="transaction",
        entity_id=transaction.id,
        old_value=json.dumps(old_value),
    ))
    db.commit()


@app.get("/api/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.scalars(select(Account).where(Account.user_id == user.id, Account.status == "active")).all()
    balances = [{"account_id": account.id, "balance": account_balance(db, account), "currency": account.currency} for account in accounts]
    month_start = date.today().replace(day=1)
    totals = db.execute(select(
        Transaction.type,
        func.coalesce(func.sum(Transaction.amount), 0),
    ).where(
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
        Transaction.status == "posted",
        Transaction.transaction_date >= month_start,
        Transaction.type.in_(["income", "expense"]),
    ).group_by(Transaction.type)).all()
    monthly = {kind: Decimal(amount or 0) for kind, amount in totals}
    return {
        "accounts": balances,
        "account_balance": sum((item["balance"] for item in balances), Decimal("0.00")),
        "monthly_income": monthly.get("income", Decimal("0.00")),
        "monthly_expense": monthly.get("expense", Decimal("0.00")),
        "as_of": datetime.now(timezone.utc).isoformat(),
    }