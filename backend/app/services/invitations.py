"""Email-verified internal enrollment. Customer enrollment is a later slice."""
import secrets
from datetime import timedelta
from urllib.parse import urlparse
from uuid import uuid4
from types import SimpleNamespace

import httpx
from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.auth import PasswordCredential
from app.models.core import Invitation, Organization, OrganizationMembership, Permission, SecurityEvent, User
from app.services.authentication import aware, hash_password, token_hash, utc_now


def send_invitation_email(invitation: Invitation, token: str) -> str:
    settings = get_settings()
    origin = (settings.auth_public_url or "").rstrip("/")
    url = urlparse(origin)
    if not settings.resend_api_key or url.scheme != "https" or not url.netloc or url.path or url.query or url.fragment:
        raise HTTPException(503, "email_delivery_not_configured")
    link = origin + "/activate#token=" + token
    try:
        response = httpx.post("https://api.resend.com/emails", timeout=20,
            headers={"Authorization": "Bearer " + settings.resend_api_key.get_secret_value(),
                     "Idempotency-Key": "invitation/" + invitation.id},
            json={"from": settings.email_from, "to": [invitation.email],
                  "subject": "دعوت به کاراترخیص — فعال‌سازی حساب",
                  "text": "برای تأیید ایمیل و تعیین رمز حساب کاراترخیص، لینک زیر را باز کنید.\n"
                          "این لینک یک‌بارمصرف است و پس از ۲۴ ساعت منقضی می‌شود.\n\n" + link +
                          "\n\nاگر این دعوت را انتظار نداشتید، آن را نادیده بگیرید."})
        response.raise_for_status()
        message_id = response.json().get("id")
        if not message_id:
            raise ValueError("missing_message_id")
        return message_id
    except (httpx.HTTPError, ValueError) as exc:
        # Provider errors can contain credentials or recipient details; do not echo them.
        raise HTTPException(502, "email_delivery_failed") from None


def issue_internal_invitation(db: Session, organization: Organization, email: str, role: str, actor_id: str | None):
    email = email.strip().lower()
    if organization.type != "INTERNAL" or organization.status.lower() != "active" or role not in {"admin", "internal_employee"}:
        raise HTTPException(403, "invitation_scope_not_allowed")
    existing = db.scalars(select(User).where(func.lower(User.email) == email)).all()
    if existing:
        raise HTTPException(409, "existing_account_requires_sign_in")
    pending = db.scalar(select(Invitation).where(Invitation.email == email,
        Invitation.organization_id == organization.id, Invitation.status == "pending",
        Invitation.revoked_at.is_(None), Invitation.expires_at > utc_now()))
    if pending:
        return {"id": pending.id, "status": "pending", "duplicate": True}
    token = secrets.token_urlsafe(32)
    invitation = Invitation(id="INV-" + uuid4().hex, organization_id=organization.id,
        email=email, role=role, scope_type="ORGANIZATION", invited_by=actor_id,
        token_hash=token_hash(token), expires_at=utc_now() + timedelta(hours=24), status="pending")
    db.add(invitation)
    db.add(SecurityEvent(user_id=actor_id, organization_id=organization.id, event_type="invitation_created"))
    delivery = SimpleNamespace(id=invitation.id, email=invitation.email)
    db.commit()  # No external HTTP call inside the database transaction.
    try:
        message_id = send_invitation_email(delivery, token)
    except HTTPException:
        invitation.status = "delivery_failed"
        invitation.revoked_at = utc_now()
        db.commit()
        raise
    db.add(SecurityEvent(user_id=actor_id, organization_id=organization.id, event_type="invitation_email_accepted"))
    db.commit()
    return {"id": invitation.id, "status": "pending", "message_id": message_id}


def accept_invitation(db: Session, token: str, password: str, full_name: str):
    invitation = db.scalar(select(Invitation).where(Invitation.token_hash == token_hash(token)).with_for_update())
    if not invitation or invitation.status != "pending" or invitation.revoked_at or aware(invitation.expires_at) <= utc_now():
        raise HTTPException(400, "invalid_or_expired_invitation")
    organization = db.get(Organization, invitation.organization_id)
    if not organization or organization.type != "INTERNAL" or organization.status.lower() != "active" or invitation.role not in {"admin", "internal_employee"}:
        raise HTTPException(403, "invitation_scope_not_allowed")
    if db.scalar(select(User.id).where(func.lower(User.email) == invitation.email.lower())):
        raise HTTPException(409, "existing_account_requires_sign_in")
    # Conditional claim also protects SQLite and concurrent token reuse.
    claimed = db.execute(update(Invitation).where(Invitation.id == invitation.id,
        Invitation.status == "pending", Invitation.accepted_at.is_(None), Invitation.revoked_at.is_(None))
        .values(status="accepted", accepted_at=utc_now()))
    if claimed.rowcount != 1:
        raise HTTPException(400, "invalid_or_expired_invitation")
    user = User(id="USR-" + uuid4().hex, full_name=full_name, email=invitation.email,
        role=invitation.role, permission_profile="مدیریتی" if invitation.role == "admin" else "عملیاتی", is_active=True)
    db.add(user)
    db.flush()
    db.add(PasswordCredential(user_id=user.id, password_hash=hash_password(password),
                              verified_email=invitation.email, email_verified_at=utc_now()))
    db.add(OrganizationMembership(id="MEM-" + uuid4().hex, organization_id=organization.id,
        user_id=user.id, role=user.role, permission_profile=user.permission_profile, status="ACTIVE",
        is_primary=True, joined_at=utc_now()))
    if user.role == "internal_employee":
        db.add(Permission(id="PERM-" + uuid4().hex, user_id=user.id, role=user.role,
            scope_type="ASSIGNED", scope_id="OWN_ASSIGNMENTS", profile=user.permission_profile,
            can_view=True, can_create=True, can_edit=True, can_assign=False))
    db.add(SecurityEvent(user_id=user.id, organization_id=organization.id, event_type="invitation_accepted"))
    db.commit()
    return {"ok": True}
