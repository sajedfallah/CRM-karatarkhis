import secrets
from datetime import timedelta

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy import select

from app.core.config import get_settings
from app.models.auth import PasswordCredential
from app.models.core import Invitation, Organization, OrganizationMembership, User
from app.services.authentication import token_hash, utc_now
from app.services.invitations import issue_internal_invitation, send_invitation_email

ORIGIN = "https://crm.example.test"


@pytest.fixture()
def enrollment(db):
    settings = get_settings()
    old = (settings.app_env, settings.auth_allowed_origins, settings.admin_bootstrap_email,
           settings.admin_bootstrap_token, settings.auth_public_url, settings.resend_api_key)
    settings.app_env = "staging"
    settings.auth_allowed_origins = [ORIGIN]
    settings.admin_bootstrap_email = "owner@example.test"
    settings.admin_bootstrap_token = SecretStr("b" * 40)
    settings.auth_public_url = ORIGIN
    settings.resend_api_key = SecretStr("test-key-not-a-real-credential")
    org = Organization(id="ORG-TEST", name="Internal", slug="karatarkhis-internal", type="INTERNAL")
    db.add(org); db.commit()
    yield org
    (settings.app_env, settings.auth_allowed_origins, settings.admin_bootstrap_email,
     settings.admin_bootstrap_token, settings.auth_public_url, settings.resend_api_key) = old


def pending(db, org, **changes):
    token = secrets.token_urlsafe(32)
    invitation = Invitation(id="INV-TEST", organization_id=org.id, email="owner@example.test",
        role="admin", scope_type="ORGANIZATION", token_hash=token_hash(token),
        expires_at=utc_now() + timedelta(hours=24), status="pending")
    for field, value in changes.items(): setattr(invitation, field, value)
    db.add(invitation); db.commit()
    return invitation, token


def accept(client, token, origin=ORIGIN):
    return client.post("/api/v1/auth/accept-invitation", headers={"Origin":origin},
        json={"token":token,"password":"A-test-password-with-12-chars","full_name":"Test Admin"})


def test_accept_verifies_email_creates_membership_and_rejects_replay(client, db, enrollment):
    invitation, token = pending(db, enrollment)
    assert accept(client, token).status_code == 200
    user = db.scalar(select(User).where(User.email == invitation.email))
    credential = db.get(PasswordCredential, user.id)
    assert credential.email_verified_at and credential.verified_email == invitation.email
    assert db.scalar(select(OrganizationMembership).where(OrganizationMembership.user_id == user.id)).status == "ACTIVE"
    assert accept(client, token).status_code == 400
    response = client.post("/api/v1/auth/login", headers={"Origin":ORIGIN}, json={"email":invitation.email,"password":"A-test-password-with-12-chars"})
    assert response.status_code == 200


@pytest.mark.parametrize("changes", [
    {"expires_at":utc_now()-timedelta(seconds=1)},
    {"revoked_at":utc_now()}, {"status":"accepted"}, {"role":"customer_manager"}
])
def test_invalid_invites_never_create_credentials(client, db, enrollment, changes):
    _, token = pending(db, enrollment, **changes)
    assert accept(client, token).status_code in {400,403}
    assert db.scalar(select(PasswordCredential)) is None


def test_accept_origin_password_validation_and_existing_user_protection(client, db, enrollment):
    invitation, token = pending(db, enrollment)
    assert accept(client, token, "https://evil.example").status_code == 403
    short = client.post("/api/v1/auth/accept-invitation", headers={"Origin":ORIGIN},
        json={"token":token,"password":"short","full_name":"Admin"})
    assert short.status_code == 422 and token not in short.text
    db.add(User(id="EXISTING", full_name="Existing", email=invitation.email, role="admin")); db.commit()
    assert accept(client, token).status_code == 409
    assert db.scalar(select(PasswordCredential)) is None


def test_bootstrap_requires_staging_and_secret_and_sends_only_once(client, db, enrollment, monkeypatch):
    from app.services import invitations
    captured = []
    monkeypatch.setattr(invitations, "send_invitation_email", lambda row,token: captured.append((row.email,token)) or "message-1")
    assert client.post("/api/v1/auth/bootstrap-admin").status_code == 404
    headers={"X-Bootstrap-Token":"b"*40}
    first=client.post("/api/v1/auth/bootstrap-admin",headers=headers)
    assert first.status_code == 202 and len(captured) == 1
    second=client.post("/api/v1/auth/bootstrap-admin",headers=headers)
    assert second.status_code == 202 and len(captured) == 1
    assert captured[0][1] not in first.text
    assert accept(client,captured[0][1]).status_code == 200
    assert client.post("/api/v1/auth/bootstrap-admin",headers=headers).status_code == 409
    get_settings().app_env="production"
    assert client.post("/api/v1/auth/bootstrap-admin",headers=headers).status_code == 404


def test_resend_request_has_idempotency_and_fragment_token(db, enrollment, monkeypatch):
    invitation, token=pending(db,enrollment)
    def post(url, **kwargs):
        assert url == "https://api.resend.com/emails"
        assert kwargs["headers"]["Idempotency-Key"] == "invitation/"+invitation.id
        assert "/activate#token="+token in kwargs["json"]["text"]
        assert kwargs["json"]["to"] == [invitation.email]
        return httpx.Response(200,json={"id":"message-id"},request=httpx.Request("POST",url))
    monkeypatch.setattr(httpx,"post",post)
    assert send_invitation_email(invitation,token) == "message-id"


def test_provider_failure_revokes_invitation_without_exposing_provider_error(db, enrollment, monkeypatch):
    def post(url, **kwargs):
        return httpx.Response(403,json={"message":"PRIVATE_PROVIDER_DETAIL"},request=httpx.Request("POST",url))
    monkeypatch.setattr(httpx,"post",post)
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as error:
        issue_internal_invitation(db,enrollment,"failure@example.test","admin",None)
    assert error.value.detail == "email_delivery_failed"
    assert db.scalar(select(Invitation)).revoked_at is not None


def test_auth_pages_have_no_third_party_resources_or_fragment_in_response(client):
    response=client.get("/activate#token=private")
    assert response.status_code == 200
    assert "private" not in response.text
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert client.get("/auth-assets/auth.js").status_code == 200
    assert client.get("/auth-assets/unknown").status_code == 404
