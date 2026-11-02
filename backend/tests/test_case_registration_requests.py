from uuid import uuid4

from sqlalchemy import select

from app.models.case_registration_request import CaseRegistrationRequest
from app.models.core import AuditLog, Case
from app.services.import_requirements import IMPORT_DOCUMENT_LABELS


class MemoryFiles:
    objects = {}
    def __init__(self): pass
    def put(self, key, body, mime): self.objects[key] = (body, mime)
    def get(self, key): return self.objects[key][0]
    def remove_uncommitted(self, key): self.objects.pop(key, None)


def headers(user):
    return {"X-User-ID": user.id}


def test_customer_submission_is_private_then_admin_registers(client, db, actors, auth_headers, monkeypatch):
    import app.api.v1.case_registration_requests as api
    monkeypatch.setattr(api, "PrivateFileStore", MemoryFiles)
    MemoryFiles.objects.clear()
    customer_headers = auth_headers(actors["manager_a"].id)
    admin_headers = auth_headers(actors["admin"].id)
    payload = {"request_id": str(uuid4()), "title": "پرونده آزمایشی", "operation_type": "import",
        "customs": "شهید رجایی", "hs_code": "123456"}
    created = client.post("/api/v1/case-registration-requests", headers=customer_headers, json=payload)
    assert created.status_code == 201, created.text
    request_id = created.json()["id"]
    assert client.get("/api/v1/case-registration-requests", headers=admin_headers).json() == []
    assert client.get("/api/v1/case-registration-requests/mine", headers=auth_headers(actors["manager_b"].id)).json() == []
    assert client.post(f"/api/v1/case-registration-requests/{request_id}/submit", headers=customer_headers).status_code == 422

    for document_type, title in IMPORT_DOCUMENT_LABELS.items():
        uploaded = client.post(f"/api/v1/case-registration-requests/{request_id}/documents", headers=customer_headers,
            data={"upload_id": str(uuid4()), "document_type": document_type, "title": title},
            files={"file": ("document.pdf", b"%PDF-1.4 test", "application/pdf")})
        assert uploaded.status_code == 201, uploaded.text

    submitted = client.post(f"/api/v1/case-registration-requests/{request_id}/submit", headers=customer_headers)
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["status"] == "SUBMITTED"
    assert "object_key" not in str(submitted.json())
    assert client.put(f"/api/v1/case-registration-requests/{request_id}", headers=customer_headers,
        json={"title":"تغییر پس از ارسال","operation_type":"import","customs":"گمرک","hs_code":"123456"}).status_code == 409
    queue = client.get("/api/v1/case-registration-requests", headers=admin_headers)
    assert queue.status_code == 200 and [row["id"] for row in queue.json()] == [request_id]
    assert client.get(f"/api/v1/case-registration-requests/{request_id}", headers=auth_headers(actors["manager_b"].id)).status_code == 404

    registered = client.post(f"/api/v1/case-registration-requests/{request_id}/register", headers=admin_headers)
    assert registered.status_code == 200, registered.text
    case_id = registered.json()["case_id"]
    case = db.get(Case, case_id)
    assert case.customer_id == "CUS-A" and case.operation_type == "import" and case.status == "در انتظار پیش‌نویس اظهارنامه"
    assert client.post(f"/api/v1/case-registration-requests/{request_id}/register", headers=admin_headers).json()["case_id"] == case_id
    assert db.scalar(select(CaseRegistrationRequest).where(CaseRegistrationRequest.id == request_id)).status == "REGISTERED"
    assert db.scalar(select(Case).where(Case.id == case_id))
    assert db.scalar(select(AuditLog).where(AuditLog.entity_id == request_id, AuditLog.action == "approve_and_register"))


def test_export_request_requires_attachment_and_admin_cannot_see_customer_draft(client, actors, auth_headers):
    manager = auth_headers(actors["manager_a"].id)
    admin = auth_headers(actors["admin"].id)
    payload = {"request_id": str(uuid4()), "title": "صادرات آزمایشی", "operation_type": "export",
        "customs": "گمرک آزمایشی", "hs_code": "12345678"}
    row = client.post("/api/v1/case-registration-requests", headers=manager, json=payload).json()
    request_id = row["id"]
    assert client.get("/api/v1/case-registration-requests", headers=admin).json() == []
    assert client.post(f"/api/v1/case-registration-requests/{request_id}/submit", headers=manager).status_code == 422


def test_quota_is_blocked_until_customer_approved_the_declaration(client, db, actors, auth_headers):
    case = Case(id="CASE-QUOTA", customer_id="CUS-A", operation_type="import", customs="گمرک", status="در انتظار اظهارنامه مشتری")
    db.add(case)
    db.commit()
    response = client.post(f"/api/v1/cases/{case.id}/customs-quota-number", headers=auth_headers(actors["admin"].id), json={"number":"QT-123"})
    assert response.status_code == 409
    assert response.json()["detail"] == "customer_declaration_confirmation_required"
    assert db.get(Case, case.id).customs_quota_number is None

