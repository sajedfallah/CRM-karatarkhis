from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from starlette.requests import Request

from app.api.deps import get_current_user
from app.main import app
from app.models.auth import AuthSession, PasswordCredential
from app.models.core import AuditLog, Case, CaseAccessGrant, Document, Organization, OrganizationMembership, Permission, Task
from app.services.authentication import COOKIE_NAME, session_user, token_hash, utc_now
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService
from app.services.membership_identity import resolve_membership


@pytest.fixture()
def scope_data(db, actors):
    org=Organization(id="ORG-A",type="CUSTOMER",customer_id="CUS-A",name="A",slug="org-a")
    other=Organization(id="ORG-B",type="CUSTOMER",customer_id="CUS-B",name="B",slug="org-b")
    db.add_all([org,other]);db.flush()
    member=OrganizationMembership(id="MEM-A",organization_id=org.id,user_id=actors["manager_a"].id,
        role="customer_manager",permission_profile="عملیاتی",scope_type="SELECTED_CASES",status="ACTIVE")
    first=Case(id="CASE-A1",customer_id="CUS-A",operation_type="import",customs="Tehran")
    second=Case(id="CASE-A2",customer_id="CUS-A",operation_type="import",customs="Tehran")
    foreign=Case(id="CASE-B",customer_id="CUS-B",operation_type="import",customs="Tehran")
    db.add_all([member,first,second,foreign]);db.flush()
    grant=CaseAccessGrant(id="GRANT-A1",membership_id=member.id,case_id=first.id,access_level="view")
    db.add(grant);db.commit()
    return org,member,first,second,foreign,grant


def test_selected_case_grant_is_required_and_never_bypasses_customer_boundary(db,actors,scope_data):
    org,member,first,second,foreign,grant=scope_data
    identity=resolve_membership(db,actors["manager_a"])
    auth=AuthorizationService(db)
    auth.require_case_action(identity,first,Action.VIEW)
    for case in [second,foreign]:
        with pytest.raises(AuthorizationDenied):auth.require_case_action(identity,case,Action.VIEW)
    with pytest.raises(AuthorizationDenied):auth.require_case_action(identity,first,Action.EDIT)
    grant.access_level="edit";db.commit()
    auth.require_case_action(identity,first,Action.EDIT)
    db.add(CaseAccessGrant(id="BAD-GRANT",membership_id=member.id,case_id=foreign.id,access_level="edit"));db.commit()
    with pytest.raises(AuthorizationDenied):auth.require_case_action(identity,foreign,Action.VIEW)


def test_selected_case_scope_applies_to_lists_tasks_documents_and_creates(client,db,actors,scope_data):
    _,member,first,second,_,grant=scope_data
    identity=resolve_membership(db,actors["manager_a"])
    app.dependency_overrides[get_current_user]=lambda:identity
    db.add_all([
        Task(id="TASK-HIDDEN",relation_type="case",customer_id="CUS-A",case_id=second.id,title="Hidden",assignee_user_id=identity.id),
        Document(id="DOC-HIDDEN",customer_id="CUS-A",case_id=second.id,document_type="invoice",title="Hidden",drive_file_id="hidden",drive_url="https://example.test/hidden"),
    ]);db.commit()
    assert [r["id"] for r in client.get("/api/v1/cases").json()]==[first.id]
    assert client.get("/api/v1/tasks/TASK-HIDDEN").status_code==404
    assert client.get("/api/v1/documents/DOC-HIDDEN").status_code==404
    assert client.post("/api/v1/cases",json={"customer_id":"CUS-A","operation_type":"import","customs":"Tehran"}).status_code==403
    task={"relation_type":"case","case_id":first.id,"title":"Allowed case task"}
    assert client.post("/api/v1/tasks",json=task).status_code==403
    grant.access_level="edit";db.commit()
    assert client.post("/api/v1/tasks",json=task).status_code==201
    assert client.post("/api/v1/tasks",json={"relation_type":"customer","customer_id":"CUS-A","title":"Company task"}).status_code==403


@pytest.mark.parametrize("disabled",["membership","organization","customer"])
def test_live_session_rechecks_membership_org_and_customer(db,actors,scope_data,disabled):
    org,member,*_=scope_data
    user=actors["manager_a"];user.email="session@example.test"
    db.add(PasswordCredential(user_id=user.id,password_hash="unused",verified_email=user.email,email_verified_at=utc_now()))
    token="session-token-test"
    db.add(AuthSession(token_hash=token_hash(token),user_id=user.id,membership_id=member.id,csrf_hash="unused",expires_at=utc_now()+timedelta(hours=1)))
    db.commit()
    request=Request({"type":"http","method":"GET","headers":[(b"cookie",f"{COOKIE_NAME}={token}".encode())]})
    assert session_user(db,request).membership_id==member.id
    if disabled=="membership":member.status="INACTIVE"
    elif disabled=="organization":org.status="inactive"
    else:user.customer.is_active=False
    db.commit()
    with pytest.raises(HTTPException):session_user(db,request)


def test_selected_org_identity_does_not_mutate_global_admin_or_leak_permissions(client,db,actors,scope_data):
    org,_,first,*_=scope_data
    user=actors["admin"]
    member=OrganizationMembership(id="ADMIN-AS-CUSTOMER",organization_id=org.id,user_id=user.id,
        role="customer_employee",permission_profile="محدود",scope_type="ORGANIZATION",status="ACTIVE")
    db.add(member)
    db.add_all([
        Permission(id="P-CUSTOMER",user_id=user.id,role="customer_employee",profile="محدود",scope_type="CUSTOMER",scope_id="CUS-A",can_view=True),
        Permission(id="P-GLOBAL",user_id=user.id,role="admin",profile="مدیریتی",scope_type="GLOBAL",scope_id="*",can_view=True,can_edit=True),
    ]);db.commit()
    identity=resolve_membership(db,user)
    assert identity.role=="customer_employee" and user.role=="admin"
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.get("/api/v1/users").status_code==403
    assert client.get("/api/v1/users/me").json()["role"]=="customer_employee"
    assert [p["id"] for p in client.get("/api/v1/users/me/permissions").json()]==["P-CUSTOMER"]
    assert client.get("/api/v1/cases/"+first.id).status_code==200


def test_multiple_orgs_require_explicit_selection_and_foreign_membership_is_denied(db,actors,scope_data):
    _,member,*_=scope_data
    db.add(OrganizationMembership(id="MEM-SECOND",organization_id="ORG-B",user_id=actors["manager_a"].id,
        role="customer_employee",permission_profile="محدود",status="ACTIVE"));db.commit()
    with pytest.raises(HTTPException) as error:resolve_membership(db,actors["manager_a"])
    assert error.value.detail=="organization_selection_required"
    assert resolve_membership(db,actors["manager_a"],organization_id="ORG-B").customer_id=="CUS-B"
    with pytest.raises(HTTPException):resolve_membership(db,actors["manager_b"],membership_id=member.id)


def test_manager_cannot_manage_other_org_or_delegate_unowned_case(client,db,actors,scope_data):
    org,member,first,second,foreign,grant=scope_data
    identity=resolve_membership(db,actors["manager_a"])
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.get("/api/v1/organizations/ORG-B/memberships").status_code==403
    body={"user_id":actors["manager_b"].id,"role":"admin","permission_profile":"پیشرفته","reason":"test authorization"}
    assert client.post("/api/v1/organizations/ORG-A/memberships",json=body).status_code==400
    body.update(role="customer_employee",permission_profile="محدود",scope_type="SELECTED_CASES",case_ids=[second.id])
    assert client.post("/api/v1/organizations/ORG-A/memberships",json=body).status_code==403
    body["case_ids"]=[first.id];grant.access_level="edit";db.commit()
    result=client.post("/api/v1/organizations/ORG-A/memberships",json=body)
    assert result.status_code==201,result.text
    assert db.scalar(select(AuditLog).where(AuditLog.entity_id==result.json()["id"])) is not None


def test_legacy_sessions_without_membership_column_remain_valid_only_when_unambiguous(db,actors,scope_data):
    identity=resolve_membership(db,actors["manager_a"],membership_id=None)
    assert identity.organization_id=="ORG-A"
    org,member,*_=scope_data
    org.customer_id=None;db.commit()
    with pytest.raises(HTTPException):resolve_membership(db,actors["manager_a"])
