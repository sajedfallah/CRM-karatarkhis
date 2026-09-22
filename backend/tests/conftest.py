import os

# Configuration must be present before importing application modules, which build
# their engine during import. CI supplies a disposable PostgreSQL database; the
# SQLite fallback keeps the API regression suite runnable for contributors.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", os.getenv("KRT_TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.deps import get_db
from app.main import app
from app.models.core import AuditLog, Case, CaseAssignment, Customer, Document, Permission, Task, TaskMessage, User


@pytest.fixture()
def db_engine():
    url = os.environ["DATABASE_URL"]
    options = {}
    if url.startswith("sqlite"):
        options = {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool}
    engine = create_engine(url, **options)
    if url.startswith("sqlite"):
        from app.db.base import Base

        Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db(db_engine):
    session = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db):
    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def actors(db):
    customer_a = Customer(id="CUS-A", name="Customer A")
    customer_b = Customer(id="CUS-B", name="Customer B")
    admin = User(id="USR-ADMIN", full_name="Admin", role="admin", permission_profile="مدیریتی")
    manager_a = User(id="USR-A", full_name="Manager A", role="customer_manager", customer_id="CUS-A", permission_profile="عملیاتی")
    manager_b = User(id="USR-B", full_name="Manager B", role="customer_manager", customer_id="CUS-B", permission_profile="عملیاتی")
    db.add_all([customer_a, customer_b, admin, manager_a, manager_b])
    db.flush()
    for user, customer_id in ((manager_a, "CUS-A"), (manager_b, "CUS-B")):
        db.add(Permission(id=f"PERM-{user.id}", user_id=user.id, role=user.role, scope_type="CUSTOMER", scope_id=customer_id, profile=user.permission_profile, can_view=True, can_create=True, can_edit=True, can_assign=True))
    db.commit()
    return {"admin": admin, "manager_a": manager_a, "manager_b": manager_b}


@pytest.fixture()
def auth_headers():
    return lambda user_id: {"X-User-ID": user_id}
