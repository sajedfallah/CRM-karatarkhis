# Changelog

تمام تغییرات مهم کاراترخیص در این فایل ثبت می‌شوند. ساختار این سند بر مبنای Keep a Changelog و وضعیت واقعی شاخه توسعه تنظیم شده است.

## [5.0.0-dev] - 2026-09-17

**Tracking:** Pull Request [#1](https://github.com/sajedfallah/CRM-karatarkhis/pull/1) — `feature/v5-backend-foundation` → `main`

> برای این مجموعه تغییرات Issue مستقل در GitHub ثبت نشده است؛ بنابراین Reference اصلی تمام موارد زیر PR #1 و commit history همان شاخه است.

### Added

- Backend جدید V5 بر پایه FastAPI، SQLAlchemy 2، Alembic و PostgreSQL/Neon.
- تنظیمات Typed با `pydantic-settings` و `.env.example` بدون Secret واقعی.
- مدل‌های دامنه: `customers`, `users`, `permissions`, `cases`, `case_assignments`, `audit_logs`.
- Migration اولیه `0001_initial_v5_schema`.
- Metadata همگام‌سازی Case شامل `sync_version`, `sync_source`, `sync_updated_at` در Migration `0002_case_sync_metadata`.
- APIهای Case CRUD و lifecycle تخصیص مسئول.
- مدل و API Task و Task Message/Thread در Migration `0003_tasks`.
- مدل و API Document metadata، approval/reject، expiry و Drive metadata در Migration `0004_documents`.
- Endpointهای هویت DEV: `GET /api/v1/users/me` و `GET /api/v1/users/me/permissions`.
- Controlled Manual Sync API: `POST /api/v1/sync/manual` با Dry Run و Audit.
- Google Sheets adapters برای Customer/Case sync.
- Customer resolver سخت‌گیرانه برای جلوگیری از حدس‌زدن مشتری در داده مبهم.
- Health endpoints: `/health`, `/health/db`, `/health/sheets`.
- Vercel serverless entrypoint و routing برای API/Docs/OpenAPI.
- پشتیبانی Google credentials از سه مسیر: Base64 JSON، raw JSON secret و mounted file.
- Audit logging برای عملیات اصلی Case، Assignment، Task، Message، Document و Sync.
- ساختار permission profile و scopeهای `GLOBAL`, `CUSTOMER`, `ASSIGNED`.

### Fixed

- اصلاح Vercel routing تا FastAPI path اصلی هنگام rewrite حفظ شود و `/health` و `/api/v1/*` به endpoint صحیح برسند. Ref: PR #1.
- اصلاح تبدیل مقدار Active مشتریان Sheet؛ رشته‌هایی مانند `FALSE` دیگر با `bool("FALSE")` به اشتباه True تلقی نمی‌شوند. Ref: PR #1.
- resolver پرونده اکنون فقط مشتری فعال را می‌پذیرد و در حالت ambiguous/unknown از حدس‌زدن جلوگیری می‌کند. Ref: PR #1.
- ترتیب Case sync اصلاح شد: Commit دیتابیس قبل از ثبت marker در Sheet انجام می‌شود تا marker موفقیت پیش از ذخیره DB نوشته نشود. Ref: PR #1.
- sync metadata در import پرونده در خود DB persist می‌شود. Ref: PR #1.
- role permissionها بر اساس `permission_profile` scope شدند تا profileهای متفاوت به اشتباه Permission مشترک نگیرند. Ref: PR #1.
- semantics مسئول اصلی Case enforce شد تا بیش از یک Primary Internal Assignment فعال ایجاد نشود. Ref: PR #1.
- Roleهای کاربر داخلی به مقادیر Backend نرمال شدند و Permission اردوان به Scope=`ASSIGNED` منتقل شد. Ref: PR #1.

### Changed

- جهت معماری از «Google Sheet به‌عنوان دیتاست مرکزی» به «PostgreSQL به‌عنوان Source of Truth و Sheet به‌عنوان operational interface» تغییر کرد.
- Authorization از کنترل UI/Sheet به server-side policy منتقل شد.
- Case ID، Customer ID و User ID به شناسه‌های immutable تبدیل شدند.
- Customer-side access بر پایه tenant boundary و Customer ID طراحی شد.
- Assignment و Task visibility بر اساس server-side permission checks انجام می‌شود.
- V5 به‌صورت modular monolith پیاده‌سازی شده و از microservice، message queue یا cache مستقل استفاده نمی‌کند.
- Deployment توسعه از Git branch به Vercel Preview متصل شد؛ Production V4.9.2 در این شاخه تغییر نکرده است.

### Database

- `0001_initial_v5_schema`: ایجاد schema پایه.
- `0002_case_sync_metadata`: اضافه‌شدن metadata همگام‌سازی Case.
- `0003_tasks`: اضافه‌شدن `tasks` و `task_messages` و indexهای مربوطه.
- `0004_documents`: اضافه‌شدن `documents` و indexهای customer/case/status/expiry.
- Migrationهای `0003` و `0004` ابتدا روی Neon temporary branch تست و سپس با تأیید صریح روی DEV اعمال شدند.
- در 2026-09-17 بنا به تصمیم عملیاتی، داده‌های DEV تخلیه شدند؛ Schema و `alembic_version=0004_documents` باقی ماندند.

### Security

- `X-User-ID` فقط DEV/STAGING identity adapter است.
- در `APP_ENV=production` این adapter عمداً پاسخ `503 production_auth_not_configured` می‌دهد.
- authorization chain شامل Active User، Role، Tenant Boundary، Permission Profile، Scope، Assignment و Action است.
- Google Sheet validation/hidden tab به‌عنوان security boundary استفاده نمی‌شود.
- Secretها، service-account JSON، customer exports و customer documents نباید Commit شوند.
- Manual Sync به نقش Admin محدود شده است.

### Infrastructure

- Neon PostgreSQL برای DEV.
- Vercel Preview برای branch توسعه.
- Vercel function `api/index.py` با `maxDuration=60`.
- GitHub Actions در این نسخه تعریف نشده است.
- Docker/Kubernetes در این نسخه وجود ندارد.
- Redis/Message Queue وجود ندارد.
- REST/JSON تنها protocol اپلیکیشن Backend است.

### Integration

- Google Sheets: explicit adapters و Controlled Sync.
- Google Drive: ساختار پوشه مشتری/پرونده و Document metadata در DB.
- Telegram credentials در config پیش‌بینی شده‌اند، اما Telegram V5 integration کامل هنوز جزو work remaining است.
- Runtime autonomous Google Sheets sync روی Vercel هنوز به credential backend-grade نیاز دارد؛ ChatGPT Google Drive connector credential اپلیکیشن Vercel نیست.

### Dependencies

قیود فعلی `backend/requirements.txt`:

- `fastapi>=0.128,<1.0`
- `uvicorn[standard]>=0.40,<1.0`
- `sqlalchemy>=2.0,<3.0`
- `alembic>=1.18,<2.0`
- `psycopg[binary]>=3.2,<4.0`
- `pydantic-settings>=2.12,<3.0`
- `python-dotenv>=1.2,<2.0`
- `google-api-python-client>=2.190,<3.0`
- `google-auth>=2.40,<3.0`

> نسخه resolve‌شده دقیق dependencyها در Repo lock نشده است؛ lockfile قبل از Production لازم است.

### QA / Verification

- Migrationهای `0002`, `0003`, `0004` روی Neon بررسی شده‌اند.
- `/health` و `/health/db` روی Preview پاسخ موفق داشته‌اند.
- OpenAPI روی Preview وجود Routeهای Case، Task، User، Manual Sync و Document را تأیید کرده است.
- visibility Task برای Scope=`ASSIGNED` با داده واقعی DEV بررسی شد.
- Deploymentهای branch به وضعیت `READY` رسیده‌اند.
- GitHub Actions workflow برای HEAD این PR وجود ندارد؛ بنابراین CI automated test evidence نداریم.
- Test coverage عددی ثبت نشده است.
- HTTP E2E برای POST/PATCHهایی که نیازمند custom `X-User-ID` header هستند به‌صورت کامل از بیرون Vercel اجرا نشده است.

### Known Limitations / Open Work

- Production authentication هنوز پیاده‌سازی نشده است.
- Runtime Google credential strategy روی Vercel نهایی نشده است.
- Manual Sync duplicate-ID validation در payload باید سخت‌گیرانه‌تر شود.
- DB→Sheet reconciliation/retry برای حالتی که DB commit موفق ولی Sheet marker write ناموفق شود باید تکمیل شود.
- Automated unit/integration/E2E test suite و CI pipeline هنوز وجود ندارد.
- Dependency locking/reproducible builds لازم است.
- Telegram V5، Notifications، Partial Clearance و Customer Workspace end-to-end هنوز کامل نیستند.
- Backup/restore و production migration rehearsal انجام نشده است.

### Breaking / Migration Notes

- V5 معماری Source of Truth را از Sheet به PostgreSQL منتقل می‌کند؛ integrationهایی که مستقیم Sheet را authoritative فرض می‌کنند باید به API/Sync Adapter منتقل شوند.
- `X-User-ID` راهکار Production نیست.
- Permission enforcement server-side است و دسترسی صرفاً بر مبنای visible rows یا tabs معتبر نیست.
- Migration Guide کامل: [docs/V5_MIGRATION_GUIDE.md](docs/V5_MIGRATION_GUIDE.md).
