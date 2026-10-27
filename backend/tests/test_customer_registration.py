from sqlalchemy import select

from app.models.core import AuditLog, Customer


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
