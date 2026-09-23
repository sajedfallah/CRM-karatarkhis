import json
from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.core import Case, CaseAccessGrant, EmailVerification, Invitation, Organization, OrganizationMembership, SecurityEvent


def test_identity_models_import():
    assert Organization.__tablename__ == "organizations"


def test_organization_membership_and_identity_records_persist(db, actors):
    org = Organization(id="ORG-A", type="CUSTOMER", name="Customer A Org", slug="customer-a")
    db.add(org); db.flush()
    membership = OrganizationMembership(id="MEM-A", organization_id=org.id, user_id=actors["manager_a"].id, role="customer_manager", permission_profile="عملیاتی", status="ACTIVE")
    db.add(membership); db.flush()
    expiry = datetime(2030, 1, 1, tzinfo=timezone.utc)
    invitation = Invitation(id="INV-A", organization_id=org.id, email="new@example.test", role="customer_employee", scope_type="SELECTED_CASES", token_hash="hashed-token", expires_at=expiry)
    verification = EmailVerification(id="VER-A", user_id=actors["manager_a"].id, email="a@example.test", token_hash="hashed-verification", expires_at=expiry)
    event = SecurityEvent(user_id=actors["manager_a"].id, organization_id=org.id, event_type="invite_created", metadata_json=json.dumps({"safe": True}))
    db.add_all([invitation, verification, event]); db.commit()
    assert db.get(Invitation, "INV-A").token_hash == "hashed-token"
    assert not hasattr(db.get(Invitation, "INV-A"), "token")


def test_membership_uniqueness_and_organization_type_constraint(db, actors):
    org = Organization(id="ORG-B", type="CUSTOMER", name="B", slug="customer-b")
    db.add_all([org, OrganizationMembership(id="MEM-B1", organization_id="ORG-B", user_id=actors["manager_a"].id, role="customer_manager", permission_profile="عملیاتی", status="ACTIVE")]); db.commit()
    db.add(OrganizationMembership(id="MEM-B2", organization_id="ORG-B", user_id=actors["manager_a"].id, role="customer_manager", permission_profile="عملیاتی", status="ACTIVE"))
    with pytest.raises(IntegrityError): db.commit()
    db.rollback()
    db.add(Organization(id="ORG-BAD", type="INVALID", name="Bad", slug="bad"))
    with pytest.raises(IntegrityError): db.commit()


def test_case_access_grant_references_membership_and_case(db, actors):
    org = Organization(id="ORG-C", type="CUSTOMER", name="C", slug="customer-c")
    membership = OrganizationMembership(id="MEM-C", organization_id="ORG-C", user_id=actors["manager_a"].id, role="customer_manager", permission_profile="عملیاتی", status="ACTIVE")
    case = Case(id="CASE-IAM", customer_id="CUS-A", operation_type="import", customs="Tehran", created_by=actors["admin"].id)
    db.add_all([org, membership, case]); db.flush()
    db.add(CaseAccessGrant(id="GRANT-C", membership_id=membership.id, case_id=case.id, access_level="view", granted_by=actors["admin"].id)); db.commit()
    assert db.get(CaseAccessGrant, "GRANT-C").case_id == case.id
