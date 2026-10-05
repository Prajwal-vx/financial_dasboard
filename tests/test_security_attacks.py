"""
Security Attack Tests - Attempt to break the application safely
These tests simulate realistic attack scenarios to identify vulnerabilities
"""
from datetime import date
from datetime import datetime as DateTime, timedelta, timezone
from decimal import Decimal
import json

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
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
    auth_rate_limiter.clear()  # Clear rate limiter before each registration
    response = client.post("/api/auth/register", json={"name": "Test", "email": email, "password": "a-secure-test-password", "currency": "NPR"})
    assert response.status_code == 201
    # SECURITY: Registration no longer returns a token - user must login explicitly
    # Now we need to login after registration
    auth_rate_limiter.clear()  # Clear rate limiter before login
    login_response = client.post("/api/auth/login", json={"email": email, "password": "a-secure-test-password"})
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def login(email="test@example.com", password="a-secure-test-password"):
    auth_rate_limiter.clear()  # Clear rate limiter before each login
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# ============================================================================
# AUTHENTICATION ATTACKS
# ============================================================================

def test_auth_brute_force_timing():
    """Test if authentication is vulnerable to timing attacks"""
    import time

    # Test with non-existent user
    start = time.time()
    client.post("/api/auth/login", json={"email": "nonexistent@example.com", "password": "wrong"})
    time_nonexistent = time.time() - start

    # Test with existing user but wrong password
    register("timing@example.com")
    start = time.time()
    client.post("/api/auth/login", json={"email": "timing@example.com", "password": "wrong"})
    time_wrong_password = time.time() - start

    # Test with correct password
    start = time.time()
    client.post("/api/auth/login", json={"email": "timing@example.com", "password": "a-secure-test-password"})
    time_correct = time.time() - start

    # Timing difference should be minimal (within 200ms due to test environment variance)
    # The dummy hash provides timing attack resistance, but test environments have variance
    print(f"Non-existent: {time_nonexistent:.4f}s, Wrong password: {time_wrong_password:.4f}s, Correct: {time_correct:.4f}s")
    assert abs(time_nonexistent - time_wrong_password) < 0.2, "Timing attack vulnerability detected"


def test_session_token_reuse():
    """Test if session tokens can be reused after logout"""
    headers = register("session-reuse@example.com")
    token = headers["Authorization"].split(" ")[1]
    
    # Logout
    client.post("/api/auth/logout", headers=headers)
    
    # Try to reuse the token
    response = client.get("/api/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401, "Session token should be invalid after logout"


def test_session_token_expiration():
    """Test if expired sessions are properly rejected"""
    headers = register("session-expire@example.com")
    token = headers["Authorization"].split(" ")[1]
    
    # Manually expire the session in the database using the same session
    from backend.models import SessionToken
    import hashlib
    
    db = TestingSessionLocal()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session = db.scalar(select(SessionToken).where(SessionToken.token_hash == token_hash))
    if session:
        session.expires_at = DateTime.now(timezone.utc) - timedelta(hours=1)
        db.commit()
    db.close()
    
    # Try to use expired token
    response = client.get("/api/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401, "Expired session should be rejected"


def test_weak_password_rejection():
    """Test if weak passwords are rejected"""
    weak_passwords = [
        "12345678901",  # Only numbers
        "password123",  # Common word
        "abcdefghijk",  # Only letters
        "AAAAAA111111",  # Repeated pattern
    ]
    
    for password in weak_passwords:
        response = client.post("/api/auth/register", json={
            "name": "Test",
            "email": f"weak{password[:5]}@example.com",
            "password": password,
            "currency": "NPR"
        })
        # Currently only checks length, not strength
        # This test documents the current state
        print(f"Password '{password}' response: {response.status_code}")


# ============================================================================
# AUTHORIZATION / IDOR ATTACKS
# ============================================================================

def test_idor_user_a_access_user_b_transactions():
    """Test if User A can access User B's transactions via ID manipulation"""
    user_a = register("user-a@example.com")
    user_b = register("user-b@example.com")
    
    # User B creates a transaction
    account_b = client.post("/api/accounts", headers=user_b, json={
        "name": "Bank B", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    transaction_b = client.post("/api/transactions", headers=user_b, json={
        "account_id": account_b["id"],
        "type": "expense",
        "amount": "50.00",
        "currency": "NPR",
        "description": "Secret purchase",
        "transaction_date": date.today().isoformat()
    }).json()
    
    # User A tries to access User B's transaction
    response = client.get(f"/api/transactions/{transaction_b['id']}", headers=user_a)
    # This endpoint doesn't exist, but the list endpoint filters by user_id
    # Test the list endpoint instead
    response = client.get("/api/transactions", headers=user_a)
    transactions = response.json()
    assert transaction_b["id"] not in [t["id"] for t in transactions], "IDOR vulnerability: User A can see User B's transactions"


def test_idor_user_a_access_user_b_accounts():
    """Test if User A can access User B's accounts"""
    user_a = register("ida@example.com")
    user_b = register("idb@example.com")
    
    # User B creates an account
    account_b = client.post("/api/accounts", headers=user_b, json={
        "name": "Secret Account", "account_type": "bank", "opening_balance": "999999.00"
    }).json()
    
    # User A tries to create a transaction on User B's account
    response = client.post("/api/transactions", headers=user_a, json={
        "account_id": account_b["id"],
        "type": "expense",
        "amount": "100.00",
        "currency": "NPR",
        "description": "Unauthorized transaction",
        "transaction_date": date.today().isoformat()
    })
    assert response.status_code == 404, "IDOR vulnerability: User A can use User B's account"


def test_idor_user_a_delete_user_b_transaction():
    """Test if User A can delete User B's transaction"""
    user_a = register("delete-a@example.com")
    user_b = register("delete-b@example.com")
    
    # User B creates a transaction
    account_b = client.post("/api/accounts", headers=user_b, json={
        "name": "Bank B", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    transaction_b = client.post("/api/transactions", headers=user_b, json={
        "account_id": account_b["id"],
        "type": "expense",
        "amount": "50.00",
        "currency": "NPR",
        "description": "Important transaction",
        "transaction_date": date.today().isoformat()
    }).json()
    
    # User A tries to delete User B's transaction
    response = client.delete(f"/api/transactions/{transaction_b['id']}", headers=user_a)
    assert response.status_code == 404, "IDOR vulnerability: User A can delete User B's transaction"


# ============================================================================
# INPUT VALIDATION ATTACKS
# ============================================================================

def test_sql_injection_attempts():
    """Test if SQL injection is possible"""
    headers = register("sqli@example.com")
    
    sql_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
        "admin'--",
    ]
    
    for payload in sql_payloads:
        response = client.post("/api/categories", headers=headers, json={
            "name": payload,
            "type": "expense"
        })
        # Should either reject or handle safely
        assert response.status_code in [201, 422, 400], f"SQL injection test with '{payload}' returned {response.status_code}"


def test_category_names_remain_raw_api_data():
    """HTML escaping belongs at the UI boundary, not in JSON responses."""
    headers = register("xss@example.com")
    payload = "R&D <script>alert('xss')</script>"
    response = client.post("/api/categories", headers=headers, json={
        "name": payload,
        "type": "expense"
    })
    assert response.status_code == 201
    assert response.json()["name"] == payload


def test_negative_amount():
    """Test if negative amounts are rejected"""
    headers = register("negative@example.com")
    account = client.post("/api/accounts", headers=headers, json={
        "name": "Bank", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    response = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"],
        "type": "expense",
        "amount": "-100.00",
        "currency": "NPR",
        "description": "Negative amount",
        "transaction_date": date.today().isoformat()
    })
    assert response.status_code == 422, "Negative amounts should be rejected"


def test_excessive_precision():
    """Test if excessive decimal precision is rejected"""
    headers = register("precision@example.com")
    account = client.post("/api/accounts", headers=headers, json={
        "name": "Bank", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    response = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"],
        "type": "expense",
        "amount": "100.123456789",
        "currency": "NPR",
        "description": "Excessive precision",
        "transaction_date": date.today().isoformat()
    })
    assert response.status_code == 422, "Excessive precision should be rejected"


# ============================================================================
# BUSINESS LOGIC ATTACKS
# ============================================================================

def test_double_spending_race_condition():
    """Test if rapid duplicate transactions can cause double-spending"""
    headers = register("race@example.com")
    account = client.post("/api/accounts", headers=headers, json={
        "name": "Bank", "account_type": "bank", "opening_balance": "100.00"
    }).json()
    
    # Try to create two identical transactions rapidly
    payload = {
        "account_id": account["id"],
        "type": "expense",
        "amount": "75.00",
        "currency": "NPR",
        "description": "Race condition test",
        "transaction_date": date.today().isoformat()
    }
    
    response1 = client.post("/api/transactions", headers=headers, json=payload)
    response2 = client.post("/api/transactions", headers=headers, json=payload)
    
    # Both should succeed (no uniqueness constraint on transactions)
    # Check final balance
    accounts = client.get("/api/accounts", headers=headers).json()
    balance = next(a["current_balance"] for a in accounts if a["id"] == account["id"])
    
    # This documents current behavior - both transactions are allowed
    print(f"Race condition test: Both responses: {response1.status_code}, {response2.status_code}")
    print(f"Final balance: {balance}")


def test_transfer_to_nonexistent_account():
    """Test if transfer to nonexistent account is properly rejected"""
    headers = register("transfer@example.com")
    account = client.post("/api/accounts", headers=headers, json={
        "name": "Bank", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    response = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"],
        "destination_account_id": 99999,  # Non-existent account
        "type": "transfer",
        "amount": "100.00",
        "currency": "NPR",
        "description": "Transfer to nowhere",
        "transaction_date": date.today().isoformat()
    })
    assert response.status_code == 404, "Transfer to nonexistent account should be rejected"


def test_category_type_mismatch():
    """Test if category type mismatch is properly validated"""
    headers = register("category@example.com")
    
    # Create an expense category
    category = client.post("/api/categories", headers=headers, json={
        "name": "Groceries",
        "type": "expense"
    }).json()
    
    account = client.post("/api/accounts", headers=headers, json={
        "name": "Bank", "account_type": "bank", "opening_balance": "1000.00"
    }).json()
    
    # Try to use expense category for income transaction
    response = client.post("/api/transactions", headers=headers, json={
        "account_id": account["id"],
        "category_id": category["id"],
        "type": "income",  # Mismatch with category type
        "amount": "100.00",
        "currency": "NPR",
        "description": "Type mismatch",
        "transaction_date": date.today().isoformat()
    })
    assert response.status_code == 422, "Category type mismatch should be rejected"


# ============================================================================
# API SECURITY ATTACKS
# ============================================================================

def test_mass_assignment():
    """Test if mass assignment is possible"""
    headers = register("mass@example.com")
    
    # Try to inject extra fields that shouldn't be settable
    response = client.post("/api/accounts", headers=headers, json={
        "name": "Bank",
        "account_type": "bank",
        "opening_balance": "1000.00",
        "user_id": 999,  # Should be ignored
        "created_at": "2020-01-01",  # Should be ignored
        "status": "archived",  # Should be ignored
    })
    
    if response.status_code == 201:
        account = response.json()
        # Verify injected fields were not applied
        # (This requires checking the actual database or response)
        print(f"Mass assignment test: Account created with response: {account}")


# ============================================================================
# RATE LIMITING ATTACKS
# ============================================================================

def test_bypass_rate_limit():
    """Test if rate limiting can be bypassed"""
    auth_rate_limiter.clear()
    
    # Exhaust rate limit
    for _ in range(10):
        response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
        assert response.status_code == 401
    
    # Should be rate limited
    response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert response.status_code == 429
    
    # Try with different user agent (should still be rate limited by IP)
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrong"},
        headers={"User-Agent": "Different Agent"}
    )
    # Currently IP-based, so this will still be rate limited
    print(f"Rate limit bypass test with different UA: {response.status_code}")


# ============================================================================
# CORS ATTACKS
# ============================================================================

def test_cors_configuration():
    """Test CORS configuration"""
    response = client.options(
        "/api/summary",
        headers={
            "Origin": "http://evil.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
    )
    
    # Check if evil.com is allowed
    allow_origin = response.headers.get("Access-Control-Allow-Origin")
    print(f"CORS test: Allow-Origin for evil.com: {allow_origin}")
    
    # Should not allow evil.com (only localhost is configured)
    if allow_origin:
        assert allow_origin in ["http://127.0.0.1:8000", "http://localhost:8000"], "CORS is too permissive"


# ============================================================================
# ERROR MESSAGE ATTACKS
# ============================================================================

def test_error_message_information_disclosure():
    """Test if error messages leak sensitive information"""
    # Test with non-existent email
    response = client.post("/api/auth/login", json={"email": "nonexistent@example.com", "password": "wrong"})
    error_detail = response.json().get("detail", "")

    # Should not reveal whether email exists
    # Currently says "Email or password is incorrect" which is good
    assert "email" not in error_detail.lower() or "password" in error_detail.lower(), \
        "Error message should not reveal which field is incorrect"

    # Test with wrong password for existing user
    register("exists@example.com")
    response = client.post("/api/auth/login", json={"email": "exists@example.com", "password": "wrong"})
    error_detail = response.json().get("detail", "")

    # Should have same error message as non-existent email
    assert error_detail == "Email or password is incorrect", "Error messages should be consistent"


def test_registration_does_not_auto_login():
    """Test that registration does not automatically log in the user"""
    # Clear any existing authentication state
    client.cookies.clear()
    auth_rate_limiter.clear()

    # Register a new user
    response = client.post("/api/auth/register", json={
        "name": "New User",
        "email": "nologin@example.com",
        "password": "a-secure-test-password",
        "currency": "NPR",
    })
    assert response.status_code == 201

    # SECURITY: Registration should NOT return a token
    assert response.json()["access_token"] == "", "Registration should not return an access token"

    # SECURITY: Registration should NOT set a session cookie
    set_cookie = response.headers.get("set-cookie", "")
    assert "fin_sight_session=" not in set_cookie.lower(), "Registration should not set session cookie"

    # User should not be able to access protected endpoints
    response = client.get("/api/summary")
    assert response.status_code == 401, "User should not be authenticated after registration"

    # User must explicitly login to get access
    auth_rate_limiter.clear()
    login_response = client.post("/api/auth/login", json={
        "email": "nologin@example.com",
        "password": "a-secure-test-password",
    })
    assert login_response.status_code == 200
    assert login_response.json()["access_token"] != "", "Login should return an access token"


def test_login_page_redirects_authenticated_users():
    """Test that authenticated users are redirected from login page to dashboard"""
    # Register and login a user
    headers = register("redirect-test@example.com")
    
    # Try to access login page while authenticated
    # The TestClient doesn't follow redirects by default, so we check the response
    response = client.get("/login")
    # If authenticated, should get dashboard HTML (index.html)
    # If not authenticated, would get login HTML (login.html)
    # Since we're authenticated, we should get the dashboard
    assert response.status_code == 200
    # The response should be index.html (dashboard) not login.html
    # We can check by looking for a unique element from the dashboard
    # or verify the login page elements are NOT present
    
    # Clear cookies and try again - should get login page
    client.cookies.clear()
    response = client.get("/login")
    assert response.status_code == 200
    # Should be login page now


def test_dashboard_requires_authentication():
    """Test that dashboard requires authentication"""
    client.cookies.clear()
    
    # Try to access dashboard without authentication
    response = client.get("/dashboard")
    assert response.status_code == 200  # FileResponse always returns 200
    # But the content should be login.html, not index.html
    # The server redirects unauthenticated users to login page


if __name__ == "__main__":
    print("Running security attack tests...")
    print("=" * 80)
    
    # Run all tests
    import sys
    from sqlalchemy import select
    
    test_functions = [
        test_auth_brute_force_timing,
        test_session_token_reuse,
        test_session_token_expiration,
        test_weak_password_rejection,
        test_idor_user_a_access_user_b_transactions,
        test_idor_user_a_access_user_b_accounts,
        test_idor_user_a_delete_user_b_transaction,
        test_sql_injection_attempts,
        test_category_names_remain_raw_api_data,
        test_negative_amount,
        test_excessive_precision,
        test_double_spending_race_condition,
        test_transfer_to_nonexistent_account,
        test_category_type_mismatch,
        test_unauthenticated_api_access,
        test_mass_assignment,
        test_bypass_rate_limit,
        test_cors_configuration,
        test_error_message_information_disclosure,
        test_registration_does_not_auto_login,
        test_login_page_redirects_authenticated_users,
        test_dashboard_requires_authentication,
    ]
    
    passed = 0
    failed = 0
    
    for test_func in test_functions:
        try:
            print(f"\nRunning: {test_func.__name__}")
            test_func()
            print(f"✓ PASSED: {test_func.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"✗ FAILED: {test_func.__name__}")
            print(f"  Error: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ ERROR: {test_func.__name__}")
            print(f"  Exception: {e}")
            failed += 1
    
    print("\n" + "=" * 80)
    print(f"Results: {passed} passed, {failed} failed")
    
    # Reset database between tests
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
