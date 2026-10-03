from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.db import Base, get_db
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
    response = client.post("/api/auth/register", json={"name": "Test", "email": email, "password": "a-secure-test-password", "currency": "NPR"})
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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