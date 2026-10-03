import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import SessionToken, User

SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "fin_sight_session")
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${derived.hex()}"


# Precomputed dummy hash for user enumeration timing attack resistance
DUMMY_PASSWORD_HASH = hash_password("timing-attack-protection-dummy-hash")


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, salt_hex, digest_hex = stored.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 310_000)
        return hmac.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def issue_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    try:
        ttl_hours = int(os.getenv("SESSION_TTL_HOURS", "12"))
        if ttl_hours <= 0:
            ttl_hours = 12
    except ValueError:
        ttl_hours = 12
    db.execute(delete(SessionToken).where(
        (SessionToken.user_id == user.id) & (SessionToken.expires_at <= datetime.now(timezone.utc))
    ))
    db.add(SessionToken(
        user_id=user.id,
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=ttl_hours),
    ))
    return token


def resolve_current_user(request: Request, credentials: HTTPAuthorizationCredentials | None, db: Session) -> User:
    raw_token = None
    if credentials is not None:
        raw_token = credentials.credentials
    else:
        raw_token = request.cookies.get(SESSION_COOKIE_NAME)
    if raw_token is None or not raw_token.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to access financial records")
    if len(raw_token) > 256:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired; sign in again")
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    session = db.scalar(select(SessionToken).where(SessionToken.token_hash == token_hash))
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired; sign in again")
    expires_at = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if expires_at <= datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired; sign in again")
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is unavailable")
    return user


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    return resolve_current_user(request, credentials, db)
