from sqlalchemy import select
from datetime import timedelta
from fastapi.testclient import TestClient

from app.models.core import AuditLog, Customer, Organization, OrganizationMembership
from app.models.auth import AuthSession, PasswordCredential
from app.core.config import get_settings
from app.main import app
from app.services.authentication import COOKIE_NAME, token_hash, utc_now


def test_admin_registers_and_renames_customer_with_audit(client, db, actors, auth_headers):
    headers = auth_headers(actors["admin"].id)
    created = client.post("/api/v1/customers", headers=headers, json={"name": "  New Customer  "})
    assert created.status_code == 201, created.text
    customer_id = created.json()["id"]
    assert created.json()["name"] == "New Customer"
    assert created.json()["is_active"] is True
    updated = client.patch(f"/api/v1/customers/{customer_id}", headers=headers, json={"name": " Renamed Customer "})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Renamed Customer"
    assert db.get(Customer, customer_id).name == "Renamed Customer"
    assert {row.action for row in db.scalars(select(AuditLog).where(AuditLog.entity_id == customer_id))} == {"create", "update"}


def test_customer_role_cannot_register_or_rename(client, db, actors, auth_headers):
    headers = auth_headers(actors["manager_a"].id)
    assert client.post("/api/v1/customers", headers=headers, json={"name": "Forbidden"}).status_code == 403
    assert client.patch("/api/v1/customers/CUS-A", headers=headers, json={"name": "Forbidden"}).status_code == 403
    assert db.get(Customer, "CUS-A").name == "Customer A"


def test_invalid_customer_names_do_not_write(client, actors, auth_headers):
    headers = auth_headers(actors["admin"].id)
    for value in ("   ", " A ", None, "A" * 256):
        assert client.post("/api/v1/customers", headers=headers, json={"name": value}).status_code == 422
        assert client.patch("/api/v1/customers/CUS-A", headers=headers, json={"name": value}).status_code == 422


def test_cookie_customer_registration_requires_origin_and_csrf(client, db, actors):
    admin = actors["admin"]
    admin.email = "admin@example.test"
    db.add(Organization(id="REG-ORG", type="INTERNAL", name="Internal", slug="registration-org"))
    db.flush()
    db.add(OrganizationMembership(id="REG-MEM", organization_id="REG-ORG", user_id=admin.id,
        role="admin", permission_profile="مدیریتی", status="ACTIVE"))
    db.add(PasswordCredential(user_id=admin.id, password_hash="unused", verified_email=admin.email, email_verified_at=utc_now()))
    db.flush()
    db.add(AuthSession(user_id=admin.id, membership_id="REG-MEM", token_hash=token_hash("registration-session"),
        csrf_hash=token_hash("registration-csrf"), expires_at=utc_now()+timedelta(hours=1)))
    db.commit()
    settings = get_settings()
    previous = settings.auth_allowed_origins
    origin = "https://crm.example.test"
    settings.auth_allowed_origins = [origin]
    try:
        with TestClient(app, base_url=origin) as browser:
            browser.cookies.set(COOKIE_NAME, "registration-session")
            payload = {"name": "Session Customer"}
            assert browser.post("/api/v1/customers", json=payload, headers={"Origin": origin}).status_code == 403
            assert browser.post("/api/v1/customers", json=payload, headers={"Origin": "https://evil.example", "X-CSRF-Token": "registration-csrf"}).status_code == 403
            assert browser.post("/api/v1/customers", json=payload, headers={"Origin": origin, "X-CSRF-Token": "registration-csrf"}).status_code == 201
            assert browser.get("/api/v1/auth/csrf").status_code == 403
            assert browser.get("/api/v1/auth/csrf", headers={"X-CSRF-Request": "1", "Origin": "https://evil.example"}).status_code == 403
            recovered = browser.get("/api/v1/auth/csrf", headers={"X-CSRF-Request": "1"})
            assert recovered.status_code == 200
            assert "no-store" in recovered.headers["cache-control"]
            csrf = recovered.json()["csrf_token"]
            assert csrf != "registration-session"
            for invalid in ("wrong-session-token", "نامعتبر"):
                assert browser.post("/api/v1/customers", json=payload, headers={"Origin": origin, "X-CSRF-Token": invalid.encode().hex()}).status_code == 403
            assert browser.get("/api/v1/auth/csrf", headers={"X-CSRF-Request": "1"}).json()["csrf_token"] == csrf
            assert browser.post("/api/v1/customers", json={"name": "New Tab Customer"}, headers={"Origin": origin, "X-CSRF-Token": csrf}).status_code == 201
            assert browser.post("/api/v1/auth/logout", headers={"Origin": origin, "X-CSRF-Token": csrf}).status_code == 204
            assert browser.get("/api/v1/auth/csrf", headers={"X-CSRF-Request": "1"}).status_code == 401
    finally:
        settings.auth_allowed_origins = previous


def test_customer_profile_roundtrip_patch_and_clear(client, db, actors, auth_headers):
    headers = auth_headers(actors["admin"].id)
    profile = {"name": "Profile Customer", "customer_type": "company", "national_id": "۱۲۳۴۵۶۷۸۹۰۱",
        "registration_number": "۱۲۳۴", "economic_code": "۱۲۳۴۵۶", "contact_name": "Example Contact",
        "phone": "۰۲۱۱۲۳۴۵۶۷۸", "mobile": "۰۹۱۲۱۲۳۴۵۶۷", "email": " Contact@Example.Test ",
        "province": "Example Province", "city": "Example City", "postal_code": "۱۲۳۴۵۶۷۸۹۰", "address": "Example address"}
    response = client.post("/api/v1/customers", headers=headers, json=profile)
    assert response.status_code == 201, response.text
    row = response.json()
    assert row["national_id"] == "12345678901"
    assert row["phone"] == "02112345678"
    assert row["email"] == "contact@example.test"
    assert row["postal_code"] == "1234567890"
    assert row["address"] == profile["address"]
    customer_id = row["id"]
    updated = client.patch(f"/api/v1/customers/{customer_id}", headers=headers, json={"city": "Changed City", "email": None})
    assert updated.status_code == 200
    assert updated.json()["email"] is None
    assert updated.json()["national_id"] == "12345678901"
    assert updated.json()["name"] == "Profile Customer"
    assert db.get(Customer, customer_id).city == "Changed City"
    listed = client.get("/api/v1/customers", headers=headers).json()
    assert next(item for item in listed if item["id"] == customer_id)["contact_name"] == "Example Contact"
    assert client.patch(f"/api/v1/customers/{customer_id}", headers=auth_headers(actors["manager_a"].id), json={"phone": "Changed"}).status_code == 403


def test_profile_validation_and_existing_customer_compatibility(client, actors, auth_headers):
    headers = auth_headers(actors["admin"].id)
    for extra in ({"email": "invalid"}, {"customer_type": "unknown"}, {"address": "x"*2001}):
        assert client.post("/api/v1/customers", headers=headers, json={"name": "Invalid Profile", **extra}).status_code == 422
    existing = next(row for row in client.get("/api/v1/customers", headers=headers).json() if row["id"] == "CUS-A")
    assert existing["phone"] is None and existing["customer_type"] is None
