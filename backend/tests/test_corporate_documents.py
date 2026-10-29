from datetime import date, timedelta
from uuid import uuid4
import pytest
from sqlalchemy import func, select
from app.api.v1 import compliance
from app.models.compliance import CorporateDocument, CorporateDocumentVersion, DocumentNotification
from app.models.core import Organization, OrganizationMembership, User
from app.models.auth import PasswordCredential
from app.services import document_expiry
from app.services.document_expiry import scan_expiry
from app.services.authentication import utc_now

TODAY = date(2030, 1, 1)
PDF = b"%PDF-1.7\nExample test document\n%%EOF"


@pytest.fixture()
def files(monkeypatch, db):
    objects = {}
    class Store:
        def put(self, key, data, mime):
            assert not db.in_transaction(), "external I/O must not hold a DB transaction"
            objects[key] = data
        def get(self, key):
            assert not db.in_transaction()
            return objects[key]
        def remove_uncommitted(self, key):
            objects.pop(key, None)
        def probe(self):
            assert not db.in_transaction()
    monkeypatch.setattr(compliance, "PrivateFileStore", Store)
    monkeypatch.setattr(compliance, "local_today", lambda: TODAY)
    monkeypatch.setattr(document_expiry, "local_today", lambda: TODAY)
    return objects


def upload(client, headers, **changes):
    data = {"upload_id": str(uuid4()), "document_type": "power_of_attorney", "title": "Power of attorney",
        "starts_on": str(TODAY-timedelta(days=90)), "expires_on": str(TODAY+timedelta(days=30)), "remind_days": "30"}
    data.update(changes)
    return client.post("/api/v1/customers/CUS-A/corporate-documents", headers=headers, data=data,
        files={"file": ("attorney.pdf", PDF, "application/pdf")})


def test_private_upload_download_idempotency_and_version_history(client, db, actors, auth_headers, files):
    headers = auth_headers(actors["admin"].id)
    upload_id = str(uuid4())
    first = upload(client, headers, upload_id=upload_id)
    assert first.status_code == 201, first.text
    doc = first.json()
    version = doc["versions"][0]
    assert version["status"] == "EXPIRING_SOON"
    assert "object_key" not in first.text and "sha256" not in first.text
    assert upload(client, headers, upload_id=upload_id).json()["id"] == doc["id"]
    assert len(files) == 1
    assert upload(client, headers, upload_id=upload_id, title="Different").status_code == 409
    second = upload(client, headers, document_id=doc["id"], expires_on=str(TODAY+timedelta(days=365)))
    assert second.status_code == 201
    assert [v["version"] for v in second.json()["versions"]] == [2, 1]
    stored_first = db.get(CorporateDocumentVersion, version["id"])
    assert stored_first.expires_on == TODAY+timedelta(days=30)
    response = client.get(f"/api/v1/customers/CUS-A/corporate-documents/{version['id']}/file", headers=headers)
    assert response.status_code == 200 and response.content == PDF
    assert "attachment" in response.headers["content-disposition"]
    assert "no-store" in response.headers["cache-control"]
    assert client.get(f"/api/v1/customers/CUS-B/corporate-documents/{version['id']}/file", headers=headers).status_code == 404
    assert client.patch("/api/v1/customers/CUS-A/corporate-documents", headers=headers, json={}).status_code == 405


def test_metadata_file_and_role_boundaries(client, actors, auth_headers, files):
    admin = auth_headers(actors["admin"].id)
    customer = auth_headers(actors["manager_a"].id)
    assert upload(client, customer).status_code == 403
    assert client.get("/api/v1/customers/CUS-A/corporate-documents", headers=customer).status_code == 403
    assert client.get("/api/v1/corporate-document-storage/status", headers=customer).status_code == 403
    assert client.get("/api/v1/corporate-document-storage/status", headers=admin).json() == {"ready": True}
    assert upload(client, admin, expires_on="").status_code == 422
    assert upload(client, admin, starts_on="2031-01-01").status_code == 422
    assert upload(client, admin, remind_days="0").status_code == 422
    data = {"upload_id":str(uuid4()),"document_type":"license","title":"License"}
    assert client.post("/api/v1/customers/CUS-A/corporate-documents", headers=admin, data=data,
        files={"file":("file.pdf", b"<html>bad</html>", "application/pdf")}).status_code == 415
    assert client.post("/api/v1/customers/CUS-A/corporate-documents", headers=admin, data=data,
        files={"file":("file.pdf", b"%PDF-"+b"x"*(3*1024*1024), "application/pdf")}).status_code == 413
    assert not files


def test_storage_failure_does_not_commit_document_metadata(client, db, actors, auth_headers, monkeypatch):
    class FailingStore:
        def put(self, *args):
            raise RuntimeError("PRIVATE_STORAGE_SECRET")
    monkeypatch.setattr(compliance, "PrivateFileStore", FailingStore)
    response = upload(client, auth_headers(actors["admin"].id))
    assert response.status_code == 503 and "PRIVATE_STORAGE_SECRET" not in response.text
    assert db.scalar(select(func.count()).select_from(CorporateDocument)) == 0


@pytest.fixture()
def recipients(db, actors):
    admin = actors["admin"]
    admin.email = "admin@example.test"
    other = User(id="OTHER-ADMIN", full_name="Other", role="admin", email="other@example.test", permission_profile="مدیریتی")
    db.add(other)
    db.add(Organization(id="DOC-ORG", type="INTERNAL", name="Internal", slug="doc-internal"))
    db.flush()
    for user in (admin, other):
        db.add(OrganizationMembership(id="MEM-"+user.id, user_id=user.id, organization_id="DOC-ORG", role="admin",
            status="ACTIVE", permission_profile="مدیریتی", scope_type="ORGANIZATION"))
        db.add(PasswordCredential(user_id=user.id, password_hash="unused", verified_email=user.email, email_verified_at=utc_now()))
    db.commit()
    return admin, other


def test_expiry_thresholds_dedupe_recipient_isolation_and_renewal(client, db, actors, auth_headers, files, recipients):
    admin, other = recipients
    headers = auth_headers(admin.id)
    doc = upload(client, headers).json()
    scan_expiry(db, TODAY)
    scan_expiry(db, TODAY)
    assert db.scalar(select(func.count()).select_from(DocumentNotification)) == 2
    own = client.get("/api/v1/notifications", headers=headers).json()
    assert len(own) == 1 and own[0]["read_at"] is None
    foreign = db.scalar(select(DocumentNotification).where(DocumentNotification.recipient_user_id == other.id))
    assert client.patch(f"/api/v1/notifications/{foreign.id}/read", headers=headers).status_code == 404
    assert client.patch(f"/api/v1/notifications/{own[0]['id']}/read", headers=headers).status_code == 204
    assert client.get("/api/v1/notifications", headers=auth_headers(actors["manager_a"].id)).status_code == 403
    for offset in (23,30,31):
        scan_expiry(db, TODAY+timedelta(days=offset))
    assert db.scalar(select(func.count()).select_from(DocumentNotification)) == 8
    assert upload(client, headers, document_id=doc["id"], expires_on=str(TODAY+timedelta(days=365))).status_code == 201
    assert client.get("/api/v1/notifications", headers=headers).json() == []
    assert db.scalar(select(func.count()).select_from(DocumentNotification)) == 8


def test_validity_future_unknown_and_expired():
    from types import SimpleNamespace
    def value(start, end):
        return document_expiry.validity(SimpleNamespace(starts_on=start, expires_on=end, remind_days=30), TODAY)
    assert value(TODAY, TODAY-timedelta(days=1)) == "EXPIRED"
    assert value(TODAY+timedelta(days=1), TODAY+timedelta(days=365)) == "NOT_YET_VALID"
    assert value(None, None) == "UNKNOWN_EXPIRY"
    assert value(TODAY, TODAY+timedelta(days=31)) == "VALID"
