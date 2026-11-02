from datetime import datetime
from zoneinfo import ZoneInfo
from uuid import uuid4
from sqlalchemy import func, select
from app.models.compliance import CorporateDocument, CorporateDocumentVersion, DocumentNotification
from app.models.core import User, Organization, OrganizationMembership
from app.models.auth import PasswordCredential


def local_today():
    return datetime.now(ZoneInfo("Asia/Tehran")).date()


def latest_versions(db):
    latest = select(CorporateDocumentVersion.document_id, func.max(CorporateDocumentVersion.version).label("number")).group_by(CorporateDocumentVersion.document_id).subquery()
    return list(db.execute(select(CorporateDocument, CorporateDocumentVersion).join(CorporateDocumentVersion,
        CorporateDocument.id == CorporateDocumentVersion.document_id).join(latest,
        (latest.c.document_id == CorporateDocument.id) & (latest.c.number == CorporateDocumentVersion.version))))


def validity(version, today=None):
    today = today or local_today()
    if version.expires_on and version.expires_on < today:
        return "EXPIRED"
    if version.starts_on and version.starts_on > today:
        return "NOT_YET_VALID"
    if version.expires_on is None:
        return "UNKNOWN_EXPIRY"
    if (version.expires_on - today).days <= version.remind_days:
        return "EXPIRING_SOON"
    return "VALID"


def scan_expiry(db, today=None):
    """Deterministic, idempotent materialization; no email or external API calls."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    today = today or local_today()
    recipients = list(db.scalars(select(User.id).join(PasswordCredential).join(OrganizationMembership,
        OrganizationMembership.user_id == User.id).join(Organization, Organization.id == OrganizationMembership.organization_id).where(
        User.is_active.is_(True), PasswordCredential.email_verified_at.is_not(None),
        PasswordCredential.verified_email == func.lower(User.email), OrganizationMembership.role == "admin",
        OrganizationMembership.status == "ACTIVE", OrganizationMembership.deactivated_at.is_(None),
        Organization.type == "INTERNAL", Organization.status == "active").distinct()))
    insert = sqlite_insert if db.get_bind().dialect.name == "sqlite" else pg_insert
    for document, version in latest_versions(db):
        if version.expires_on is None:
            continue
        remaining = (version.expires_on - today).days
        if remaining > version.remind_days:
            continue
        threshold = -1 if remaining < 0 else 0 if remaining == 0 else min(7, version.remind_days) if remaining <= min(7, version.remind_days) else version.remind_days
        title = "مدرک منقضی شده است" if remaining < 0 else "مدرک امروز منقضی می‌شود" if remaining == 0 else "مدرک به انقضا نزدیک است"
        for recipient in recipients:
            db.execute(insert(DocumentNotification).values(id="NTF-"+uuid4().hex, recipient_user_id=recipient,
                customer_id=document.customer_id, version_id=version.id, threshold=threshold, title=title)
                .on_conflict_do_nothing(index_elements=["recipient_user_id", "version_id", "threshold"]))
    db.commit()
