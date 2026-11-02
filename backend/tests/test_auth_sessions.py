from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import get_settings
from app.main import app
from app.models.auth import AuthSession, LoginThrottle, PasswordCredential
from app.models.core import SecurityEvent, Organization, OrganizationMembership
from app.services.authentication import COOKIE_NAME, hash_password, token_hash, utc_now

ORIGIN = "https://crm.example.test"
PASSWORD = "Test-only-correct-password-2026"


@pytest.fixture()
def session_client(client, db, actors):
    settings = get_settings()
    old = (settings.app_env, settings.auth_allowed_origins)
    settings.app_env = "production"
    settings.auth_allowed_origins = [ORIGIN]
    user = actors["manager_a"]
    user.email = "person@example.test"
    db.add(Organization(id="SESSION-ORG", type="CUSTOMER", customer_id="CUS-A", name="Customer A", slug="session-org"))
    db.flush()
    db.add(OrganizationMembership(id="SESSION-MEM", organization_id="SESSION-ORG", user_id=user.id,
        role=user.role, permission_profile=user.permission_profile, status="ACTIVE", is_primary=True))
    db.add(PasswordCredential(user_id=user.id, password_hash=hash_password(PASSWORD),
                              verified_email=user.email, email_verified_at=utc_now()))
    db.commit()
    with TestClient(app, base_url=ORIGIN) as https_client:
        yield https_client, user
    settings.app_env, settings.auth_allowed_origins = old


def login(client, **overrides):
    return client.post("/api/v1/auth/login", headers={"Origin": ORIGIN},
                       json={"email": " Person@Example.Test ", "password": PASSWORD, **overrides})


def test_production_header_impersonation_denied(session_client):
    client, _ = session_client
    assert client.get("/api/v1/users/me", headers={"X-User-ID": "USR-ADMIN"}).status_code == 401


def test_login_stores_only_hashes_and_sets_hardened_cookie(session_client, db):
    client, user = session_client
    response = login(client)
    assert response.status_code == 200, response.text
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "Secure" in cookie and "SameSite=strict" in cookie
    assert "Domain=" not in cookie
    raw = client.cookies.get(COOKIE_NAME)
    session = db.scalar(select(AuthSession))
    assert session.token_hash == token_hash(raw) and session.token_hash != raw
    assert session.csrf_hash != response.json()["csrf_token"]
    assert client.get("/api/v1/users/me").status_code == 200
    assert db.scalar(select(SecurityEvent).where(SecurityEvent.event_type == "login_succeeded"))


def test_csrf_origin_logout_and_replay(session_client):
    client, _ = session_client
    response = login(client)
    raw = client.cookies.get(COOKIE_NAME)
    csrf = response.json()["csrf_token"]
    assert client.post("/api/v1/auth/logout", headers={"Origin": ORIGIN}).status_code == 403
    assert client.post("/api/v1/auth/logout", headers={"Origin": "https://evil.example", "X-CSRF-Token": csrf}).status_code == 403
    assert client.post("/api/v1/auth/logout", headers={"Origin": ORIGIN, "X-CSRF-Token": csrf}).status_code == 204
    assert client.get("/api/v1/users/me", headers={"Cookie": f"{COOKIE_NAME}={raw}"}).status_code == 401


@pytest.mark.parametrize("condition", ["inactive", "unverified", "expired", "email_changed"])
def test_session_is_rechecked_on_every_request(session_client, db, condition):
    client, user = session_client
    assert login(client).status_code == 200
    if condition == "inactive":
        user.is_active = False
    elif condition == "unverified":
        db.get(PasswordCredential, user.id).email_verified_at = None
    elif condition == "email_changed":
        user.email = "different@example.test"
    else:
        db.scalar(select(AuthSession)).expires_at = utc_now() - timedelta(seconds=1)
    db.commit()
    assert client.get("/api/v1/users/me").status_code == 401


def test_cookie_identity_does_not_fall_back_to_admin_header(session_client):
    client, _ = session_client
    assert login(client).status_code == 200
    response = client.get("/api/v1/cases", headers={"X-User-ID": "USR-ADMIN"})
    assert response.status_code == 200
    assert client.get("/api/v1/users/me").json()["id"] == "USR-A"


def test_invalid_cookie_cannot_fall_back_to_development_identity(client, actors):
    response = client.get("/api/v1/users/me", headers={"Cookie": f"{COOKIE_NAME}=invalid", "X-User-ID": actors["admin"].id})
    assert response.status_code == 401


def test_unverified_password_login_and_wrong_password_share_generic_failure(session_client, db):
    client, user = session_client
    db.get(PasswordCredential, user.id).email_verified_at = None
    db.commit()
    a = login(client)
    b = login(client, password="wrong")
    c = login(client, email="missing@example.test")
    assert a.status_code == b.status_code == c.status_code == 401
    assert a.json() == b.json() == c.json() == {"detail": "invalid_credentials"}


def test_account_login_limit_is_persistent_and_hashed(session_client, db):
    client, _ = session_client
    for _ in range(10):
        assert login(client, password="wrong").status_code == 401
    assert login(client).status_code == 429
    throttle = db.get(LoginThrottle, token_hash("email:person@example.test"))
    assert throttle.attempts == 11
    assert "person" not in throttle.key


def test_login_rejects_cross_origin_and_validation_does_not_echo_password(session_client):
    client, _ = session_client
    secret = "s" * 129
    response = login(client, password=secret)
    assert response.status_code == 422 and secret not in response.text
    assert client.post("/api/v1/auth/login", headers={"Origin": "https://evil.example"},
                       json={"email": "person@example.test", "password": PASSWORD}).status_code == 403
