from uuid import uuid4
from sqlalchemy import func, select
from app.models.core import AuditLog, Case
from app.models.drafts import CaseDraft


def create(client, headers, **extra):
    return client.post("/api/v1/case-drafts", headers=headers, json={"request_id":str(uuid4()),"customer_id":"CUS-A",**extra})


def test_draft_creation_idempotency_and_resume(client, db, actors, auth_headers):
    headers=auth_headers(actors["admin"].id)
    request_id=str(uuid4())
    first=create(client,headers,request_id=request_id)
    assert first.status_code==201,first.text
    draft=first.json()
    assert draft["status"]=="DRAFT" and draft["version"]==1
    assert create(client,headers,request_id=request_id).json()["id"]==draft["id"]
    assert create(client,headers,request_id=request_id,customer_id="CUS-B").status_code==409
    assert db.scalar(select(func.count()).select_from(CaseDraft))==1
    payload={"expected_version":1,"content":{"title":"Example draft","operation_type":"import","customs":"Example customs",
        "product_description":"Example goods","shipment_reference":"TEST-BL","quantity":12,"net_weight":"10.125","gross_weight":"11.500"}}
    saved=client.put(f"/api/v1/case-drafts/{draft['id']}",headers=headers,json=payload)
    assert saved.status_code==200,saved.text
    assert saved.json()["version"]==2
    resumed=client.get(f"/api/v1/case-drafts/{draft['id']}",headers=headers)
    assert resumed.status_code==200
    assert resumed.json()["content"]["gross_weight"]=="11.500"
    assert resumed.json()["content"]["product_description"]=="Example goods"
    assert resumed.json()["content"]["finance_estimate"]=={"description":"","amount":None,"currency":""}
    assert "no-store" in resumed.headers["cache-control"]
    assert client.get("/api/v1/case-drafts",headers=headers).json()[0]["customer_name"]=="Customer A"
    assert db.scalar(select(func.count()).select_from(Case))==0
    assert {row.action for row in db.scalars(select(AuditLog).where(AuditLog.entity_id==draft["id"]))}=={"create","save"}


def test_optimistic_conflict_and_safe_save_replay(client, db, actors, auth_headers):
    headers=auth_headers(actors["admin"].id)
    draft=create(client,headers).json()
    url=f"/api/v1/case-drafts/{draft['id']}"
    first={"expected_version":1,"content":{"title":"First tab"}}
    assert client.put(url,headers=headers,json=first).status_code==200
    assert client.put(url,headers=headers,json=first).json()["version"]==2
    assert client.put(url,headers=headers,json={"expected_version":1,"content":{"title":"Second tab"}}).status_code==409
    assert client.get(url,headers=headers).json()["content"]["title"]=="First tab"
    assert db.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.entity_id==draft["id"],AuditLog.action=="save"))==1


def test_customer_and_invalid_target_boundaries(client, db, actors, auth_headers):
    customer=auth_headers(actors["manager_a"].id)
    admin=auth_headers(actors["admin"].id)
    assert create(client,customer).status_code==403
    draft=create(client,admin).json()
    url=f"/api/v1/case-drafts/{draft['id']}"
    assert client.get("/api/v1/case-drafts",headers=customer).status_code==403
    assert client.get(url,headers=customer).status_code==403
    assert client.put(url,headers=customer,json={"expected_version":1,"content":{}}).status_code==403
    assert create(client,admin,customer_id="MISSING").status_code==404
    actors["manager_a"].customer.is_active=False
    db.commit()
    assert create(client,admin).status_code==409
    assert client.put(url,headers=admin,json={"expected_version":1,"content":{}}).status_code==409


def test_draft_validation_and_no_submission_bypass(client, actors, auth_headers):
    headers=auth_headers(actors["admin"].id)
    draft=create(client,headers).json()
    url=f"/api/v1/case-drafts/{draft['id']}"
    for content in ({"net_weight":"10","gross_weight":"9"},{"quantity":0},{"title":"x"*201},{"status":"SUBMITTED"},{"net_weight":"1.0001"},
        {"export_shipment":{"package_count":0}},{"export_shipment":{"currency":"USDD"}},{"export_shipment":{"total_value":"-1"}},
        {"finance_estimate":{"description":"freight"}},{"finance_estimate":{"description":"freight","amount":"100","currency":"usd"}},
        {"finance_estimate":{"description":"freight","amount":"-1","currency":"USD"}},
        {"finance_estimate":{"description":"freight","amount":"1.001","currency":"USD"}}):
        assert client.put(url,headers=headers,json={"expected_version":1,"content":content}).status_code==422
    assert client.put(url,headers=headers,json={"expected_version":1,"content":{},"customer_id":"CUS-B"}).status_code==422
    assert client.post(url+"/submit",headers=headers,json={}).status_code==404
    assert client.get(url,headers=headers).json()["version"]==1


def test_internal_draft_estimate_is_versioned_and_never_creates_financial_posting(client,db,actors,auth_headers):
    headers=auth_headers(actors["admin"].id)
    draft=create(client,headers).json()
    url=f"/api/v1/case-drafts/{draft['id']}"
    content={"finance_estimate":{"description":"هزینه حمل آزمایشی","amount":"1250000.00","currency":"IRR"}}
    saved=client.put(url,headers=headers,json={"expected_version":1,"content":content})
    assert saved.status_code==200,saved.text
    assert saved.json()["version"]==2
    assert saved.json()["content"]["finance_estimate"]==content["finance_estimate"]
    resumed=client.get(url,headers=headers).json()
    assert resumed["content"]["finance_estimate"]==content["finance_estimate"]
    assert client.get(url,headers=auth_headers(actors["manager_a"].id)).status_code==403
    assert db.scalar(select(func.count()).select_from(Case))==0
    assert {row.action for row in db.scalars(select(AuditLog).where(AuditLog.entity_id==draft["id"]))}=={"create","save"}

