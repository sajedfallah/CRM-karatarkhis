from uuid import uuid4
from app.models.case_registration_request import CaseRegistrationRequest
from app.models.core import Case
from app.services.import_requirements import IMPORT_DOCUMENT_LABELS


def test_admin_correction_delete_restore_and_registered_case_reuse(client, db, actors, auth_headers):
    owner = auth_headers(actors["manager_a"].id)
    admin = auth_headers(actors["admin"].id)
    payload = dict(title="Correction test", operation_type="import", customs="Test", hs_code="123456")
    created = client.post("/api/v1/case-registration-requests", headers=owner,
        json={**payload, "request_id":str(uuid4())})
    assert created.status_code == 201
    rid = created.json()["id"]
    row = db.get(CaseRegistrationRequest, rid)
    row.documents = [dict(id=kind, document_type=kind, title=title, file_name="test.pdf",
        mime_type="application/pdf", size_bytes=10, uploaded_at="2026-11-02T00:00:00Z")
        for kind,title in IMPORT_DOCUMENT_LABELS.items()]
    row.status = "SUBMITTED"
    db.commit()
    path = "/api/v1/case-registration-requests/"+rid
    action = path+"/admin-action/"
    assert client.post(action+"correction",headers=owner,json={"reason":"test reason"}).status_code == 403
    assert client.post(action+"correction",headers=admin,json={"reason":"Complete documents"}).status_code == 200
    edited = client.put(path,headers=owner,json=payload)
    assert edited.status_code == 200
    assert edited.json()["correction_reason"] == "Complete documents"
    assert client.post(path+"/submit",headers=owner).status_code == 200
    registered = client.post(path+"/register",headers=admin)
    assert registered.status_code == 200, registered.text
    case_id = registered.json()["case_id"]
    assert client.post(action+"correction",headers=admin,json={"reason":"Review again"}).status_code == 200
    assert client.post(path+"/submit",headers=owner).status_code == 200
    assert client.post(path+"/register",headers=admin).json()["case_id"] == case_id
    assert client.post(action+"delete",headers=admin,json={"reason":"Test removal"}).status_code == 200
    assert not any(item["id"] == rid for item in client.get("/api/v1/case-registration-requests/mine",headers=owner).json())
    assert client.get(path,headers=owner).status_code == 404
    assert any(item["id"] == rid for item in client.get("/api/v1/case-registration-requests/admin/deleted",headers=admin).json())
    assert client.post(action+"restore",headers=admin,json={"reason":"Restore test"}).status_code == 200
    case = db.get(Case,case_id)
    case.customs_quota_number = "QT-TEST"
    db.commit()
    assert client.post(action+"correction",headers=admin,json={"reason":"Should block"}).status_code == 409
    assert client.post(action+"delete",headers=admin,json={"reason":"Should block"}).status_code == 409
