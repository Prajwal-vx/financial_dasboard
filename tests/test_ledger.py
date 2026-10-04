from datetime import date
from datetime import datetime as DateTime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.db import Base, get_db
import backend.main as market_module
import backend.security as security_module
from backend.main import app, auth_rate_limiter


engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def register(email="test@example.com"):
    auth_rate_limiter.clear()  # Clear rate limiter before registration
    response = client.post("/api/auth/register", json={"name": "Test", "email": email, "password": "a-secure-test-password", "currency": "NPR"})
    assert response.status_code == 201
    # SECURITY: Registration no longer returns a token - user must login explicitly
    # Now we need to login after registration
    auth_rate_limiter.clear()  # Clear rate limiter before login
    login_response = client.post("/api/auth/login", json={"email": email, "password": "a-secure-test-password"})
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def test_account_balances_follow_ledger_and_transfer_is_neutral():
    headers = register("ledger@example.com")
    first = client.post("/api/accounts", headers=headers, json={"name": "Bank", "account_type": "bank", "opening_balance": "10000.00"}).json()
    second = client.post("/api/accounts", headers=headers, json={"name": "Wallet", "account_type": "wallet", "opening_balance": "500.00"}).json()
    income = client.post("/api/transactions", headers=headers, json={
        "account_id": first["id"], "type": "income", "amount": "2500.00", "currency": "NPR",
        "description": "Salary", "transaction_date": date.today().isoformat(),
    })
    assert income.status_code == 201
    transfer = client.post("/api/transactions", headers=headers, json={
        "account_id": first["id"], "destination_account_id": second["id"], "type": "transfer",
        "amount": "1000.00", "currency": "NPR", "description": "Cash withdrawal", "transaction_date": date.today().isoformat(),
    })
    assert transfer.status_code == 201
    balances = {account["id"]: Decimal(account["current_balance"]) for account in client.get("/api/accounts", headers=headers).json()}
    assert balances[first["id"]] == Decimal("11500.00")
    assert balances[second["id"]] == Decimal("1500.00")
    assert sum(balances.values()) == Decimal("13000.00")


def test_user_cannot_access_another_users_account():
    owner = register("owner@example.com")
    other = register("other@example.com")
    account = client.post("/api/accounts", headers=owner, json={"name": "Private", "account_type": "bank"}).json()
    response = client.post("/api/transactions", headers=other, json={
        "account_id": account["id"], "type": "expense", "amount": "1.00", "currency": "NPR",
        "description": "Not mine", "transaction_date": date.today().isoformat(),
    })
    assert response.status_code == 404


def test_invalid_and_revoked_sessions_cannot_read_financial_data():
    assert client.get("/api/summary", headers={"Authorization": "Bearer invalid-token"}).status_code == 401
    headers = register("logout@example.com")
    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/summary", headers=headers).status_code == 401


def test_transaction_delete_is_soft_and_recalculates_balance():
    headers = register("delete@example.com")
    account = client.post("/api/accounts", headers=headers, json={"name": "Bank", "account_type": "bank", "opening_balance": "100.00"}).json()
    transaction = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"], "type": "expense", "amount": "25.50", "currency": "NPR",
        "description": "Groceries", "transaction_date": date.today().isoformat(),
    }).json()
    assert client.delete(f"/api/transactions/{transaction['id']}", headers=headers).status_code == 204
    accounts = client.get("/api/accounts", headers=headers).json()
    balance = next(item["current_balance"] for item in accounts if item["id"] == account["id"])
    assert Decimal(balance) == Decimal("100.00")
    assert client.get("/api/transactions", headers=headers).json() == []


def test_summary_counts_posted_flows_but_not_transfers_or_pending_entries():
    headers = register("summary@example.com")
    first = client.post("/api/accounts", headers=headers, json={"name": "Bank", "account_type": "bank", "opening_balance": "100.00"}).json()
    second = client.post("/api/accounts", headers=headers, json={"name": "Wallet", "account_type": "wallet"}).json()
    today = date.today().isoformat()
    for entry in [
        {"account_id": first["id"], "type": "income", "amount": "25.00", "description": "Pay", "status": "posted"},
        {"account_id": first["id"], "type": "expense", "amount": "10.00", "description": "Meal", "status": "posted"},
        {"account_id": first["id"], "type": "expense", "amount": "5.00", "description": "Pending", "status": "pending"},
        {"account_id": first["id"], "destination_account_id": second["id"], "type": "transfer", "amount": "20.00", "description": "Move", "status": "posted"},
    ]:
        result = client.post("/api/transactions", headers=headers, json={**entry, "currency": "NPR", "transaction_date": today})
        assert result.status_code == 201
    result = client.get("/api/summary", headers=headers)
    assert result.status_code == 200
    assert result.json()["month_start"] == date.today().replace(day=1).isoformat()
    assert Decimal(result.json()["account_balance"]) == Decimal("115.00")
    assert Decimal(result.json()["monthly_income"]) == Decimal("25.00")
    assert Decimal(result.json()["monthly_expense"]) == Decimal("10.00")


def test_summary_uses_workspace_timezone_at_month_boundary(monkeypatch):
    headers = register("timezone-summary@example.com")

    class FrozenDateTime(DateTime):
        @classmethod
        def now(cls, tz=None):
            instant = DateTime(2026, 10, 31, 20, 0, tzinfo=timezone.utc)
            return instant.astimezone(tz) if tz else instant.replace(tzinfo=None)

    monkeypatch.setattr(market_module, "ZoneInfo", lambda _name: timezone(timedelta(hours=5, minutes=45)))
    monkeypatch.setattr(market_module, "datetime", FrozenDateTime)
    response = client.get("/api/summary", headers=headers)
    assert response.status_code == 200
    assert response.json()["month_start"] == "2026-11-01"


def test_auth_endpoints_reject_excessive_requests():
    auth_rate_limiter.clear()
    for _ in range(10):
        response = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "not-the-password"})
        assert response.status_code == 401
    response = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "not-the-password"})
    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) > 0
    auth_rate_limiter.clear()


def test_security_headers_protect_api_responses():
    headers = register("headers@example.com")
    response = client.get("/api/summary", headers=headers)
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
    assert response.headers["Cache-Control"] == "no-store"


def test_whitespace_only_names_and_descriptions_are_rejected():
    invalid_registration = client.post("/api/auth/register", json={
        "name": "   ", "email": "blank-name@example.com", "password": "a-secure-test-password",
    })
    assert invalid_registration.status_code == 422

    headers = register("trim-validation@example.com")
    invalid_account = client.post("/api/accounts", headers=headers, json={
        "name": "   ", "account_type": "bank",
    })
    assert invalid_account.status_code == 422

    account = client.get("/api/accounts", headers=headers).json()[0]
    invalid_transaction = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"], "type": "expense", "amount": "1.00", "currency": "NPR",
        "description": "   ", "transaction_date": date.today().isoformat(),
    })
    assert invalid_transaction.status_code == 422


def test_invalid_date_range_and_negative_transaction_id():
    headers = register("range-test@example.com")
    # start_date > end_date returns 422
    response = client.get("/api/transactions?start_date=2026-12-01&end_date=2026-11-01", headers=headers)
    assert response.status_code == 422

    # negative transaction_id returns 404
    response = client.delete("/api/transactions/-1", headers=headers)
    assert response.status_code == 404


def test_auth_inputs_are_trimmed_and_normalized():
    response = client.post("/api/auth/register", json={
        "name": "  Jane Doe  ",
        "email": "  JANE@EXAMPLE.COM  ",
        "password": "a-secure-test-password",
        "currency": " npr ",
    })
    assert response.status_code == 201
    payload = response.json()
    assert payload["user"]["email"] == "jane@example.com"
    assert payload["user"]["currency"] == "NPR"

    login = client.post("/api/auth/login", json={
        "email": "  jane@example.com  ",
        "password": "a-secure-test-password",
    })
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "jane@example.com"


def test_auth_uses_secure_http_only_session_cookie():
    # SECURITY: Registration no longer sets cookie - must login explicitly
    client.post("/api/auth/register", json={
        "name": "Cookie User",
        "email": "cookie@example.com",
        "password": "a-secure-test-password",
        "currency": "NPR",
    })
    # Now login to get the cookie
    response = client.post("/api/auth/login", json={
        "email": "cookie@example.com",
        "password": "a-secure-test-password",
    })
    assert response.status_code == 200
    set_cookie = response.headers.get("set-cookie", "")
    lowered_cookie = set_cookie.lower()
    assert "httponly" in lowered_cookie
    assert "samesite=lax" in lowered_cookie
    assert "fin_sight_session=" in lowered_cookie

    client.cookies.set("fin_sight_session", response.json()["access_token"])
    cookie_response = client.get("/api/auth/me")
    assert cookie_response.status_code == 200
    assert cookie_response.json()["email"] == "cookie@example.com"


def test_login_cookie_uses_configured_name_and_positive_session_ttl(monkeypatch):
    auth_rate_limiter.clear()
    client.cookies.clear()
    cookie_name = "finsight_test_session"
    monkeypatch.setattr(market_module, "SESSION_COOKIE_NAME", cookie_name)
    monkeypatch.setattr(security_module, "SESSION_COOKIE_NAME", cookie_name)
    monkeypatch.setenv("SESSION_TTL_HOURS", "0")

    registration = client.post("/api/auth/register", json={
        "name": "Cookie Config",
        "email": "cookie-config@example.com",
        "password": "a-secure-test-password",
    })
    assert registration.status_code == 201
    response = client.post("/api/auth/login", json={
        "email": "cookie-config@example.com",
        "password": "a-secure-test-password",
    })

    assert response.status_code == 200
    set_cookie = response.headers["set-cookie"].lower()
    assert f"{cookie_name}=" in set_cookie
    assert "max-age=43200" in set_cookie
    assert client.get("/api/auth/me").status_code == 200

    token = response.json()["access_token"]
    logout = client.post("/api/auth/logout")
    assert logout.status_code == 204
    assert f"{cookie_name}=" in logout.headers["set-cookie"].lower()
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_session_status_reports_auth_state_without_raising_errors():
    client.cookies.clear()
    anonymous_response = client.get("/api/auth/session")
    assert anonymous_response.status_code == 200
    assert anonymous_response.json() == {"authenticated": False, "user": None}

    headers = register("session-status@example.com")
    login_response = client.post("/api/auth/login", headers=headers, json={
        "email": "session-status@example.com",
        "password": "a-secure-test-password",
    })
    assert login_response.status_code == 200
    client.cookies.set("fin_sight_session", login_response.cookies.get("fin_sight_session"))
    authed_response = client.get("/api/auth/session")
    assert authed_response.status_code == 200
    assert authed_response.json()["authenticated"] is True
    assert authed_response.json()["user"]["email"] == "session-status@example.com"


def test_auth_get_requests_fail_with_clear_method_error():
    login_response = client.get("/api/auth/login")
    assert login_response.status_code == 405
    assert login_response.json()["detail"] == "Use POST to sign in"

    register_response = client.get("/api/auth/register")
    assert register_response.status_code == 405
    assert register_response.json()["detail"] == "Use POST to create an account"


def test_opening_balance_cent_precision_and_merchant_clean():
    headers = register("precision-test@example.com")
    # Opening balance with more than 2 decimal places is rejected
    res = client.post("/api/accounts", headers=headers, json={
        "name": "Invest", "account_type": "investment", "opening_balance": "100.123"
    })
    assert res.status_code == 422

    # Clean whitespace in institution and merchant
    res = client.post("/api/accounts", headers=headers, json={
        "name": "Invest", "account_type": "investment", "institution": "   ", "opening_balance": "100.00"
    })
    assert res.status_code == 201
    assert res.json()["institution"] is None

    acc_id = res.json()["id"]
    tx = client.post("/api/transactions", headers=headers, json={
        "account_id": acc_id, "type": "expense", "amount": "10.00", "currency": "NPR",
        "description": "Book", "merchant": "   ", "transaction_date": date.today().isoformat()
    })
    assert tx.status_code == 201
    assert tx.json()["merchant"] is None


def test_market_snapshot_endpoint_returns_top_50_by_volume(monkeypatch):
    market_module._market_cache_assets = None
    market_module._market_cache_expires_at = 0
    header = """<div>As of : 2026-10-02 15:00:00 Market Closed</div>
    <table id="headFixed"><thead><tr>
        <th>S.No</th><th>Symbol</th><th>LTP</th><th>Point Change</th><th>% Change</th>
        <th>Open</th><th>High</th><th>Low</th><th>Volume</th><th>Prev. Close</th>
    </tr></thead><tbody>"""
    rows = "".join(
        f"<tr><td>{index + 1}</td><td>TST{index}</td><td>100.00</td><td>1.00</td>"
        f"<td>1.00</td><td>99.00</td><td>101.00</td><td>98.00</td>"
        f"<td>{600 - index}</td><td>99.00</td></tr>"
        for index in range(55)
    )
    monkeypatch.setattr(
        market_module.httpx,
        "get",
        lambda *args, **kwargs: SimpleNamespace(status_code=200, text=header + rows + "</tbody></table>"),
    )
    response = client.get("/api/market")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) == 50
    assert payload[0]["symbol"] == "TST0"
    assert payload[-1]["symbol"] == "TST49"
    assert payload[0]["volume"] > payload[-1]["volume"]
    asset = payload[0]
    assert asset["priceNPR"] == 100.0
    assert asset["changePct"] == 1.0
    assert asset["category"] == "active"
    assert asset["fetchedAt"]
    assert asset["sourceTimestamp"] == "2026-10-02 15:00:00"
    assert asset["marketStatus"] == "Market Closed"


def test_market_snapshot_is_cached_and_untrusted_symbols_are_dropped(monkeypatch):
    market_module._market_cache_assets = None
    market_module._market_cache_expires_at = 0
    header = "<table id='headFixed'><tr><th>S.No</th><th>Symbol</th><th>LTP</th><th>Change</th><th>Change %</th><th>Open</th><th>High</th><th>Low</th><th>Volume</th><th>Prev</th></tr>"
    rows = "".join(
        f"<tr><td>{i}</td><td>{'&lt;img src=x onerror=alert(1)&gt;' if i == 0 else f'SAFE{i}'}</td>"
        "<td>100</td><td>1</td><td>1</td><td>99</td><td>101</td><td>98</td><td>100</td><td>99</td></tr>"
        for i in range(51)
    )
    calls = []
    monkeypatch.setattr(market_module.httpx, "get", lambda *args, **kwargs: (
        calls.append(1) or SimpleNamespace(status_code=200, text=header + rows + "</table>")
    ))
    first = client.get("/api/market")
    second = client.get("/api/market")
    assert first.status_code == second.status_code == 200
    assert len(calls) == 1
    assert all("<" not in asset["symbol"] for asset in first.json())


def test_login_page_scripts_work_with_content_security_policy():
    page = client.get("/")
    assert page.status_code == 200
    assert "/login.js" in page.text
    assert "<script>" not in page.text
    script = client.get("/login.js")
    assert script.status_code == 200
    assert "X-Content-Type-Options" in script.headers


def test_shared_logo_is_served_as_svg():
    response = client.get("/logo.svg")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert "<svg" in response.text
