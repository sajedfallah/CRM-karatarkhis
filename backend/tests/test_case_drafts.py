from uuid import uuid4
from sqlalchemy import func, select
from app.models.core import AuditLog, Case, CaseAssignment, Organization, OrganizationMembership, User
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
    assert resumed.json()["content"]["planned_assignee_user_id"] is None
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


def test_planned_assignment_is_admin_only_internal_employee_only_and_not_a_case_assignment(client,db,actors,auth_headers):
    headers=auth_headers(actors["admin"].id)
    staff=User(id="USR-STAFF",full_name="Internal Staff",role="internal_employee",is_active=True)
    inactive=User(id="USR-INACTIVE",full_name="Inactive Staff",role="internal_employee",is_active=False)
    db.add_all([staff,inactive]);db.commit()
    listed=client.get("/api/v1/case-drafts/eligible-assignees",headers=headers)
    assert listed.status_code==200
    assert listed.json()==[{"id":"USR-STAFF","full_name":"Internal Staff"}]
    assert client.get("/api/v1/case-drafts/eligible-assignees",headers=auth_headers(actors["manager_a"].id)).status_code==403
    draft=create(client,headers).json();url=f"/api/v1/case-drafts/{draft['id']}"
    payload={"expected_version":1,"content":{"planned_assignee_user_id":staff.id}}
    saved=client.put(url,headers=headers,json=payload)
    assert saved.status_code==200,saved.text
    assert saved.json()["content"]["planned_assignee_user_id"]==staff.id
    readiness=client.get(url+"/readiness?expected_version=2",headers=headers).json()
    assert readiness["planned_assignment_selected"] and not readiness["final_submission_available"]
    assert client.put(url,headers=headers,json={"expected_version":2,"content":{"planned_assignee_user_id":inactive.id}}).status_code==422
    assert client.put(url,headers=headers,json={"expected_version":2,"content":{"planned_assignee_user_id":actors["manager_a"].id}}).status_code==422
    assert db.scalar(select(func.count()).select_from(CaseAssignment))==0
    assert db.scalar(select(func.count()).select_from(Case))==0


def test_planned_assignee_is_scoped_to_the_selected_internal_organization(db,actors):
    from types import SimpleNamespace
    from app.api.v1.drafts import _eligible_assignee_query, _validate_planned_assignee
    first=Organization(id="ORG-INTERNAL-A",type="INTERNAL",name="A",slug="internal-a",status="active")
    second=Organization(id="ORG-INTERNAL-B",type="INTERNAL",name="B",slug="internal-b",status="active")
    staff_a=User(id="USR-STAFF-A",full_name="Staff A",role="internal_employee",is_active=True)
    staff_b=User(id="USR-STAFF-B",full_name="Staff B",role="internal_employee",is_active=True)
    db.add_all([first,second,staff_a,staff_b]);db.flush()
    db.add_all([
        OrganizationMembership(id="MEM-STAFF-A",organization_id=first.id,user_id=staff_a.id,role="internal_employee",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE"),
        OrganizationMembership(id="MEM-STAFF-B",organization_id=second.id,user_id=staff_b.id,role="internal_employee",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE"),
    ])
    db.commit()
    actor=SimpleNamespace(organization_id=first.id)
    assert [row.id for row in db.scalars(_eligible_assignee_query(first.id))]==[staff_a.id]
    _validate_planned_assignee(db,actor,staff_a.id)
    from fastapi import HTTPException
    try:
        _validate_planned_assignee(db,actor,staff_b.id)
    except HTTPException as exc:
        assert exc.status_code==422
    else:
        raise AssertionError("cross-organization assignment was accepted")
