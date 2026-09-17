# V5 Migration & Rollout Guide

این سند مسیر مهاجرت از معماری عملیاتی V4.9.2 به Backend V5 را شرح می‌دهد.

## 1. Breaking Changes اصلی

### Source of Truth

در V4.9.2، Google Sheets/Apps Script بخش عمده state عملیاتی را نگهداری می‌کند. در V5، PostgreSQL باید Source of Truth باشد و Sheet فقط از طریق adapter کنترل‌شده sync شود.

### Authentication

`X-User-ID` صرفاً برای DEV/STAGING است و نباید در Production استفاده شود.

### Authorization

دسترسی دیگر نباید از visible tab، filter view یا validation Sheet نتیجه‌گیری شود. Backend باید Role/Customer/Permission/Assignment را enforce کند.

### Immutable IDs

- User ID
- Customer ID
- Case ID

نباید پس از ایجاد تغییر کنند.

## 2. وضعیت فعلی DEV

- Migration state: `0004_documents`
- داده‌های DEV: خالی
- Production V4.9.2: بدون تغییر
- Feature branch: `feature/v5-backend-foundation`
- PR: #1

## 3. Pre-Migration Checklist

قبل از هر محیط جدید:

1. Backup کامل دیتابیس/Sheet و Drive metadata تهیه شود.
2. `DATABASE_URL` فقط از secret manager/environment وارد شود.
3. Google credential strategy مشخص شود.
4. Telegram secrets خارج از Git نگهداری شوند.
5. `APP_ENV` صحیح تنظیم شود.
6. migration files با branch مقصد تطبیق داده شوند.
7. User/Customer/Case ID mapping freeze شود.

## 4. نصب Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
```

حداقل config:

```text
APP_ENV=development
DATABASE_URL=...
GOOGLE_SPREADSHEET_ID=...
```

## 5. اعمال Migrationها

ترتیب الزامی:

```text
0001_initial_v5_schema
→ 0002_case_sync_metadata
→ 0003_tasks
→ 0004_documents
```

اجرای محلی/استاندارد:

```bash
alembic upgrade head
```

پس از اجرا:

```sql
SELECT version_num FROM alembic_version;
```

انتظار:

```text
0004_documents
```

## 6. Seed / Import Strategy

به دلیل خالی بودن DEV، Import باید از صفر و کنترل‌شده انجام شود.

ترتیب پیشنهادی:

1. Customers
2. Users
3. Permissions
4. Cases
5. Case Assignments
6. Tasks
7. Task Messages
8. Documents metadata
9. Audit bootstrap records در صورت نیاز

### قواعد Import

- duplicate immutable ID ممنوع
- unknown customer نباید auto-guess شود
- inactive customer نباید Case جدید بگیرد
- conflicting existing record باید report شود، نه silently overwrite
- Dry Run قبل از Apply

## 7. Google Sheets Migration

Spreadsheet پایه فعلی:

`CRM | ترخیص یزد | V1.5 | 2026-09-17`

### رفتار مورد انتظار

Sheet نباید مستقیماً authoritative write به state حساس انجام دهد. تغییرات باید از adapter/API عبور کنند.

### Controlled Sync

Endpoint:

```text
POST /api/v1/sync/manual
```

برای Import batch و dry-run در محیط DEV طراحی شده است.

## 8. Google Credentials

Backend سه روش credential را می‌پذیرد:

1. `GOOGLE_SERVICE_ACCOUNT_JSON_B64`
2. `GOOGLE_SERVICE_ACCOUNT_JSON`
3. `GOOGLE_SERVICE_ACCOUNT_FILE`

در زمان تدوین این سند، autonomous runtime credential روی Vercel هنوز نهایی نشده است.

## 9. Vercel Rollout

### Preview

Feature branch باید ابتدا روی Vercel Preview deploy شود.

Verification:

```text
GET /health
GET /health/db
GET /openapi.json
```

Google credential در صورت پیکربندی:

```text
GET /health/sheets
```

### Production

تا زمانی که موارد زیر تکمیل نشده‌اند deploy Production ممنوع است:

- real authentication
- production secrets
- automated regression tests
- DB backup/restore validation
- migration rehearsal
- dependency locking
- permission E2E tests

## 10. Permission Migration

Permissionهای قدیمی باید به مدل زیر map شوند:

```text
User
→ Role
→ Permission Profile
→ Scope (GLOBAL/CUSTOMER/ASSIGNED)
→ Actions
```

برای `internal_employee` با Scope=`ASSIGNED`، visibility باید به assignment واقعی محدود باشد.

## 11. Case Assignment Migration

قواعد:

- assignment فعال duplicate ایجاد نشود
- تنها یک Primary Internal Assignment فعال برای هر Case
- پایان assignment با lifecycle مشخص و `ended_at`

## 12. Task Migration

Task Legacy باید به schema V5 map شود:

- ID ثابت
- relation type
- customer/case linkage
- assignee
- status/priority
- due date
- result/next action
- legacy note/Telegram ID در notes/message در صورت نیاز

## 13. Document Migration

فایل واقعی در Google Drive باقی می‌ماند. DB فقط metadata و governance را نگهداری می‌کند:

- Drive File ID
- URL
- document type
- customer/case
- version
- status
- approval
- expiry

## 14. Rollback Strategy

### قبل از Production

Rollback ساده است: branch V5 merge نشود و V4.9.2 ادامه یابد.

### پس از Production

Rollback باید شامل این موارد باشد:

1. توقف writeهای V5
2. snapshot/backup DB
3. rollback app deployment
4. تصمیم صریح درباره downgrade DB؛ downgrade اتوماتیک بدون بررسی داده انجام نشود
5. reconciliation Sheet/DB

## 15. Post-Migration Validation

- health API سالم
- DB reachable
- migration version صحیح
- admin access صحیح
- internal employee assigned-only visibility
- customer tenant isolation
- create/update Case audit log
- Task thread persistence
- Document approval authorization
- duplicate/unknown sync conflict handling
- no secrets in repository

## 16. Production Cutover Checklist

- [ ] Production auth complete
- [ ] Google runtime auth complete
- [ ] Secrets configured
- [ ] Dependency versions locked
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Permission regression pass
- [ ] Backup created
- [ ] Restore drill pass
- [ ] Migration rehearsal pass
- [ ] Monitoring/logging ready
- [ ] Rollback owner مشخص
- [ ] PR review complete
- [ ] Explicit production approval
