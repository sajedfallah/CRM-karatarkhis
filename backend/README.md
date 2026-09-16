# Karatarkhis CRM V5 Backend

This directory is the new V5 backend foundation. It does not replace or mutate the V4.9.2 production Apps Script deployment.

## Architecture

```text
Google Sheets / Workspaces / Telegram
                ↓
           FastAPI API
                ↓
           PostgreSQL
                ↓
             Drive
```

PostgreSQL is the target source of truth. Google Sheets is an operational/admin interface and must synchronize through explicit adapters rather than becoming an implicit second database.

## Current foundation

- FastAPI application
- PostgreSQL via SQLAlchemy 2
- Alembic migration framework
- Typed environment configuration
- `/health` and `/health/db`
- Initial domain models:
  - customers
  - users
  - permissions
  - cases
  - case_assignments
  - audit_logs

## Security invariants

- Never commit `.env`, credentials, tokens, service-account JSON, customer exports or real customer documents.
- Customer-side users must be bound to an immutable `customer_id`.
- Authorization must enforce `User → Role → Customer Scope → Assignment → Permission → Action` server-side.
- Google Sheet validation is UX/data-quality support, not an authorization boundary.

## Local bootstrap

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL to a development PostgreSQL database.
alembic revision --autogenerate -m "initial v5 schema"
alembic upgrade head
uvicorn app.main:app --reload
```

Health endpoints:

```text
GET /health
GET /health/db
```

## Next implementation slice

1. Generate and review the initial Alembic migration.
2. Add repository/service layers.
3. Enforce customer boundary and assignment policies in the authorization service.
4. Add versioned `/api/v1` routes for users, customers, cases and assignments.
5. Build Google Sheets sync adapter for CRM V1.5 with `version`, `updated_at`, `source` and idempotency controls.
6. Pilot with the admin account and Ardavan before enabling customer workspaces.
