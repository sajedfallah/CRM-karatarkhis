from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import func, select

from app.api.deps import get_current_user
from app.main import app
from app.models.auth import PasswordCredential
from app.models.core import AuditLog, Case, Organization, OrganizationMembership, User
from app.models.draft_review import DraftCustomerReview
from app.services.membership_identity import resolve_membership


def create_draft(client,headers):
    return client.post("/api/v1/case-drafts",headers=headers,json={"request_id":str(uuid4()),"customer_id":"CUS-A"}).json()


def verified_customer_manager(db,customer,uid,email):
    organization=Organization(id="ORG-"+customer,type="CUSTOMER",name=customer,slug="slug-"+customer,
        customer_id=customer,status="active")
    user=User(id=uid,full_name="Verified Customer Manager",email=email,role="customer_manager",
        customer_id=customer,is_active=True,permission_profile="عملیاتی")
    db.add_all([organization,user]);db.flush()
    member=OrganizationMembership(id="MEM-"+uid,organization_id=organization.id,user_id=user.id,
        role="customer_manager",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE",is_primary=True)
    db.add_all([member,PasswordCredential(user_id=user.id,password_hash="unused",verified_email=email,
        email_verified_at=datetime.now(timezone.utc))]);db.commit()
    return resolve_membership(db,user)


def test_customer_review_is_scoped_safe_versioned_and_does_not_submit(client,db,actors,auth_headers):
    admin=actors["admin"];admin_headers=auth_headers(admin.id)
    customer_manager=verified_customer_manager(db,"CUS-A","USR-REVIEW-A","review-a@example.test")
    other_manager=verified_customer_manager(db,"CUS-B","USR-REVIEW-B","review-b@example.test")
    current={"user":admin}
    app.dependency_overrides[get_current_user]=lambda:current["user"]

    draft=create_draft(client,admin_headers);path=f"/api/v1/case-drafts/{draft['id']}"
    content={"title":"Import case","operation_type":"import","customs":"Tehran",
        "product_description":"Customer goods","shipment_reference":"BL-100","quantity":5,
        "net_weight":"10","gross_weight":"11",
        "finance_estimate":{"description":"Internal freight estimate","amount":"700.00","currency":"USD"},
        "planned_assignee_user_id":None}
    assert client.put(path,headers=admin_headers,json={"expected_version":1,"content":content}).status_code==200
    candidates=client.get(path+"/review-recipients")
    assert candidates.status_code==200
    assert candidates.json()==[{"membership_id":customer_manager.membership_id,"full_name":"Verified Customer Manager","email":"review-a@example.test"}]
    request=client.post(path+"/customer-review",json={"expected_version":2,"recipient_membership_id":customer_manager.membership_id})
    assert request.status_code==201,request.text
    review=request.json()
    assert review["status"]=="PENDING" and review["draft_version"]==2
    stored_review=db.get(DraftCustomerReview,review["id"])
    assert len(stored_review.content_hash)==64
    assert "finance_estimate" not in review["snapshot"]["content"]
    assert "planned_assignee_user_id" not in review["snapshot"]["content"]
    assert client.post(path+"/customer-review",json={"expected_version":2,"recipient_membership_id":customer_manager.membership_id}).status_code==201
    assert db.scalar(select(func.count()).select_from(DraftCustomerReview))==1

    current["user"]=customer_manager
    inbox=client.get("/api/v1/case-drafts/customer-reviews")
    assert inbox.status_code==200 and [item["id"] for item in inbox.json()]==[review["id"]]
    assert "no-store" in inbox.headers["cache-control"]
    assert client.get(f"/api/v1/case-drafts/customer-reviews/{review['id']}").status_code==200
    assert client.post(f"/api/v1/case-drafts/customer-reviews/{review['id']}/decision",
        json={"decision":"CHANGES_REQUESTED","comment":"  "}).status_code==422
    decision=client.post(f"/api/v1/case-drafts/customer-reviews/{review['id']}/decision",
        json={"decision":"CONFIRMED","comment":""})
    assert decision.status_code==200,decision.text
    assert decision.json()["status"]=="CONFIRMED"
    assert client.post(f"/api/v1/case-drafts/customer-reviews/{review['id']}/decision",
        json={"decision":"CONFIRMED","comment":""}).json()["status"]=="CONFIRMED"
    assert client.post(f"/api/v1/case-drafts/customer-reviews/{review['id']}/decision",
        json={"decision":"CHANGES_REQUESTED","comment":"Please correct the customs value"}).status_code==409
    assert client.get("/api/v1/case-drafts").status_code==403

    current["user"]=other_manager
    assert client.get(f"/api/v1/case-drafts/customer-reviews/{review['id']}").status_code==404
    assert client.get("/api/v1/case-drafts/customer-reviews").json()==[]

    current["user"]=admin
    updated={**content,"title":"Changed after customer confirmation"}
    assert client.put(path,headers=admin_headers,json={"expected_version":2,"content":updated}).status_code==200
    current["user"]=customer_manager
    stale=client.get("/api/v1/case-drafts/customer-reviews").json()[0]
    assert stale["status"]=="STALE"
    assert client.post(f"/api/v1/case-drafts/customer-reviews/{review['id']}/decision",
        json={"decision":"CONFIRMED","comment":""}).status_code==409
    assert db.scalar(select(func.count()).select_from(Case))==0
    assert {row.action for row in db.scalars(select(AuditLog).where(AuditLog.entity_id==review["id"]))}=={"request_review","confirmed"}


def test_customer_review_rejects_non_admin_request_and_wrong_or_inactive_recipients(client,db,actors,auth_headers):
    admin=actors["admin"];manager=actors["manager_a"]
    manager_org=Organization(id="ORG-CUS-A",type="CUSTOMER",name="Customer A",slug="cus-a",customer_id="CUS-A",status="active")
    verified=User(id="USR-VERIFIED",full_name="Verified",email="verified@example.test",role="customer_manager",customer_id="CUS-A",is_active=True)
    inactive=User(id="USR-INACTIVE",full_name="Inactive",email="inactive@example.test",role="customer_manager",customer_id="CUS-A",is_active=False)
    other=Organization(id="ORG-CUS-B",type="CUSTOMER",name="Customer B",slug="cus-b",customer_id="CUS-B",status="active")
    foreign=User(id="USR-FOREIGN",full_name="Foreign",email="foreign@example.test",role="customer_manager",customer_id="CUS-B",is_active=True)
    db.add_all([manager_org,other,verified,inactive,foreign]);db.flush()
    good=OrganizationMembership(id="MEM-GOOD",organization_id=manager_org.id,user_id=verified.id,role="customer_manager",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE")
    bad=OrganizationMembership(id="MEM-INACTIVE",organization_id=manager_org.id,user_id=inactive.id,role="customer_manager",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE")
    foreign_member=OrganizationMembership(id="MEM-FOREIGN",organization_id=other.id,user_id=foreign.id,role="customer_manager",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE")
    db.add_all([good,bad,foreign_member,PasswordCredential(user_id=verified.id,password_hash="unused",verified_email=verified.email,email_verified_at=datetime.now(timezone.utc)),PasswordCredential(user_id=inactive.id,password_hash="unused",verified_email=inactive.email,email_verified_at=datetime.now(timezone.utc)),PasswordCredential(user_id=foreign.id,password_hash="unused",verified_email=foreign.email,email_verified_at=datetime.now(timezone.utc))]);db.commit()
    draft=create_draft(client,auth_headers(admin.id));path=f"/api/v1/case-drafts/{draft['id']}"
    assert client.get(path+"/review-recipients",headers=auth_headers(manager.id)).status_code==403
    listed=client.get(path+"/review-recipients",headers=auth_headers(admin.id)).json()
    assert listed==[{"membership_id":good.id,"full_name":"Verified","email":"verified@example.test"}]
    for membership_id in (bad.id,foreign_member.id,"MEM-MISSING"):
        assert client.post(path+"/customer-review",headers=auth_headers(admin.id),
            json={"expected_version":1,"recipient_membership_id":membership_id}).status_code==422
    assert client.post(path+"/customer-review",headers=auth_headers(admin.id),
        json={"expected_version":0,"recipient_membership_id":good.id}).status_code==422
