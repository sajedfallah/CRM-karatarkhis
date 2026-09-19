# Karatarkhis CRM V5 Backend

این پوشه Backend جدید V5 را شامل می‌شود. این شاخه Production V4.9.2 را جایگزین نکرده و تا زمان Review/Merge مستقل باقی می‌ماند.

## Current Stack

- FastAPI
- SQLAlchemy 2
- PostgreSQL / Neon
- Alembic
- Pydantic Settings
- Google Sheets API client
- Vercel Python Serverless

## Architecture

```text
Clients / Telegram / Workspaces
              ↓
          FastAPI REST
              ↓
      Authorization Layer
              ↓
       PostgreSQL / Neon
              ↕
   Explicit Google Sync Adapters
              ↓
       Google Sheets / Drive
```

PostgreSQL هدف Source of Truth است. Google Sheets رابط عملیاتی است و authorization boundary نیست.

## Implemented Domain

- Customers
- Users
- Permissions
- Cases
- Case Assignments
- Tasks
- Task Messages
- Documents
- Audit Logs

## Migrations

```text
0001_initial_v5_schema
0002_case_sync_metadata
0003_tasks
0004_documents
```

DEV فعلی روی `0004_documents` است و داده آن عمداً خالی شده تا Seed/Import کنترل‌شده انجام شود.

## API

### Health

```text
GET /health
GET /health/db
GET /health/sheets
```

### Identity

```text
GET /api/v1/users/me
GET /api/v1/users/me/permissions
```

### Cases

```text
GET    /api/v1/cases
POST   /api/v1/cases
GET    /api/v1/cases/{case_id}
PATCH  /api/v1/cases/{case_id}
GET    /api/v1/cases/{case_id}/assignments
POST   /api/v1/cases/{case_id}/assignments
DELETE /api/v1/cases/{case_id}/assignments/{assignment_id}
```

### Tasks

```text
GET   /api/v1/tasks
POST  /api/v1/tasks
GET   /api/v1/tasks/{task_id}
PATCH /api/v1/tasks/{task_id}
GET   /api/v1/tasks/{task_id}/messages
POST  /api/v1/tasks/{task_id}/messages
```

### Documents

```text
GET   /api/v1/documents
POST  /api/v1/documents
GET   /api/v1/documents/{document_id}
PATCH /api/v1/documents/{document_id}
POST  /api/v1/documents/{document_id}/approval
```

### Sync

```text
POST /api/v1/sync/manual
```

## Authorization

اصل امنیتی:

```text
User → Active → Role → Tenant → Permission Profile → Scope → Assignment → Action
```

Scopeها:

- `GLOBAL`
- `CUSTOMER`
- `ASSIGNED`

Google Sheet filtering یا hidden tabs هیچ‌گاه جای authorization سمت سرور را نمی‌گیرد.

## Authentication Status

DEV/STAGING از `X-User-ID` استفاده می‌کند. این adapter فقط برای توسعه است.

در `APP_ENV=production` adapter فعلی عمداً fail می‌شود تا بدون real authentication سرویس Production بالا نیاید.

## Google Integration

Credentialهای پشتیبانی‌شده:

```text
GOOGLE_SERVICE_ACCOUNT_JSON_B64
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_SERVICE_ACCOUNT_FILE
```

و Spreadsheet ID:

```text
GOOGLE_SPREADSHEET_ID
```

هیچ credential واقعی نباید commit شود.

## Local Bootstrap

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Vercel

`vercel.json` مسیرهای FastAPI را به `api/index.py` route می‌کند و function limit فعلی 60 ثانیه است.

## Testing Status

Manual/DEV verification برای migrations، health، OpenAPI و بخشی از authorization انجام شده است؛ اما automated pytest/CI/coverage هنوز اضافه نشده است.

گزارش کامل: [../docs/V5_QA_REPORT.md](../docs/V5_QA_REPORT.md)

## Production Blockers

- real authentication
- automated test suite
- CI pipeline
- dependency locking
- Google runtime auth strategy
- sync reconciliation/retry
- backup/restore rehearsal
- production migration rehearsal

## Documentation

- [Root README](../README.md)
- [CHANGELOG](../CHANGELOG.md)
- [Technical & Operations](../docs/V5_TECHNICAL_AND_OPERATIONS.md)
- [Migration Guide](../docs/V5_MIGRATION_GUIDE.md)
- [QA Report](../docs/V5_QA_REPORT.md)
