"""Opaque, hashed-at-rest sessions. Authorization remains in the domain layer."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import HTTPException, Request
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.auth import AuthSession, LoginThrottle, PasswordCredential
from app.models.core import SecurityEvent, User
from app.services.membership_identity import resolve_membership

COOKIE_NAME = "__Host-krt_session"
password_hasher = PasswordHasher()
_DUMMY_HASH = password_hasher.hash(secrets.token_urlsafe(32))


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def aware(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def hash_password(password: str) -> str:
    if not 12 <= len(password) <= 128:
        raise ValueError("password_length_must_be_12_to_128")
    return password_hasher.hash(password)


def require_origin(request: Request) -> None:
    if request.headers.get("origin") not in get_settings().auth_allowed_origins:
        raise HTTPException(403, "invalid_origin")


def consume_login_attempt(db: Session, identity: str, limit: int) -> None:
    """Atomic DB-backed counter shared by serverless instances."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert

    insert = sqlite_insert if db.get_bind().dialect.name == "sqlite" else pg_insert
    now = utc_now()
    expired = LoginThrottle.window_start <= now - timedelta(minutes=15)
    statement = insert(LoginThrottle).values(key=token_hash(identity), attempts=1, window_start=now)
    statement = statement.on_conflict_do_update(index_elements=[LoginThrottle.key], set_={
        "attempts": case((expired, 1), else_=LoginThrottle.attempts + 1),
        "window_start": case((expired, now), else_=LoginThrottle.window_start),
    }).returning(LoginThrottle.attempts)
    attempts = db.execute(statement).scalar_one()
    db.commit()
    if attempts > limit:
        raise HTTPException(429, "login_rate_limited", headers={"Retry-After": "900"})


def authenticate_password(db: Session, email: str, password: str, request: Request) -> User:
    consume_login_attempt(db, "email:" + email, 10)
    # Never trust client-supplied X-Forwarded-For for the rate-limit key.
    consume_login_attempt(db, "ip:" + (request.client.host if request.client else "unknown"), 60)
    users = db.scalars(select(User).where(func.lower(User.email) == email)).all()
    user = users[0] if len(users) == 1 else None
    credential = db.get(PasswordCredential, user.id) if user else None
    try:
        valid = password_hasher.verify(credential.password_hash if credential else _DUMMY_HASH, password)
    except (VerificationError, InvalidHashError):
        valid = False
    if not valid or not user or not user.is_active or not credential or not credential.email_verified_at or credential.verified_email != email:
        db.add(SecurityEvent(user_id=user.id if user else None, event_type="login_failed"))
        db.commit()
        raise HTTPException(401, "invalid_credentials")
    if password_hasher.check_needs_rehash(credential.password_hash):
        credential.password_hash = hash_password(password)
    return user


def create_session(db: Session, user: User, organization_id: str | None = None) -> tuple[str, str]:
    identity = resolve_membership(db, user, organization_id=organization_id)
    token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=token_hash(token), user_id=user.id, membership_id=identity.membership_id, csrf_hash=token_hash(csrf),
                       expires_at=utc_now() + timedelta(hours=8)))
    db.add(SecurityEvent(user_id=user.id, event_type="login_succeeded"))
    db.commit()
    return token, csrf


def session_user(db: Session, request: Request) -> User | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    if len(token) > 128:
        raise HTTPException(401, "invalid_session")
    session = db.get(AuthSession, token_hash(token))
    if not session or session.revoked_at or aware(session.expires_at) <= utc_now():
        raise HTTPException(401, "invalid_session")
    user = db.get(User, session.user_id)
    credential = db.get(PasswordCredential, session.user_id)
    if not user or not user.is_active or not credential or not credential.email_verified_at or credential.verified_email != (user.email or '').strip().lower():
        raise HTTPException(401, "invalid_session")
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        require_origin(request)
        csrf = request.headers.get("x-csrf-token", "")
        if not secrets.compare_digest(session.csrf_hash, token_hash(csrf)):
            raise HTTPException(403, "invalid_csrf_token")
    return resolve_membership(db, user, membership_id=session.membership_id)
