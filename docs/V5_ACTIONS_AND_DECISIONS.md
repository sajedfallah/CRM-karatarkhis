# V5 Actions Taken & Architecture Decision Log

تاریخ مرجع: `2026-09-17`  
Tracking: PR #1

## 1. Actions Taken — Chronological

### Phase A — Backend Foundation

- ایجاد FastAPI application و serverless entrypoint.
- ایجاد SQLAlchemy session/base/dependency layer.
- ایجاد Alembic framework.
- تعریف typed configuration و `.env.example`.
- ایجاد مدل‌های Customer، User، Permission، Case، CaseAssignment و AuditLog.
- ایجاد health endpointهای API و Database.

### Phase B — Database & Sync Foundation

- اجرای Migration `0001_initial_v5_schema`.
- افزودن Case sync metadata در `0002_case_sync_metadata`.
- پیاده‌سازی Google Sheets client.
- پیاده‌سازی Customer Sheet Sync.
- پیاده‌سازی Case Customer Resolver.
- پیاده‌سازی Case Sheet Sync.
- اصلاح Active flag parsing.
- اصلاح DB commit ordering پیش از Sheet marker.
- persist کردن sync metadata در DB.
- افزودن credential loading از env/base64/file برای Google.
- افزودن `/health/sheets`.

### Phase C — Controlled Sync

- تعریف payload schema برای controlled/manual sync.
- ایجاد Manual Sync Service.
- ایجاد admin-only `POST /api/v1/sync/manual`.
- افزودن dry-run و conflict reporting.
- ایجاد bootstrap admin برای DEV در مرحله validation قبلی.

### Phase D — Identity & Permission

- نرمال‌سازی Roleهای Backend.
- ایجاد Current User endpoint.
- ایجاد permission introspection endpoint.
- اعمال `permission_profile` در role permission lookup.
- تعریف Scopeهای `GLOBAL`, `CUSTOMER`, `ASSIGNED`.
- تنظیم دسترسی Internal Employee روی assigned-only semantics.

### Phase E — Cases & Assignments

- ساخت Case schemas.
- ساخت Case CRUD API.
- ساخت Assignment lifecycle API.
- enforce کردن Primary Internal Assignment invariant.
- Audit logging برای create/update/assign/end assignment.

### Phase F — Tasks

- طراحی Task و TaskMessage.
- ایجاد Migration `0003_tasks`.
- تست روی temporary Neon branch.
- اعمال روی DEV پس از تأیید.
- ایجاد Task CRUD و message thread API.
- اعمال authorization برای assigned task/case.
- migration آزمایشی دو Task legacy به DEV و بررسی visibility؛ سپس داده DEV طبق تصمیم بعدی تخلیه شد.

### Phase G — Documents

- بررسی ساختار واقعی Google Drive مشتریان و پرونده‌ها.
- طراحی Document metadata model.
- ایجاد Migration `0004_documents`.
- افزودن approval/reject/expiry metadata.
- ایجاد Document API.
- افزودن Document authorization.
- تست migration روی temporary Neon branch.
- اعمال روی DEV پس از تأیید.

### Phase H — DEV Reset

- پس از اعمال `0004_documents`، طبق دستور عملیاتی داده DEV پاک شد.
- Schema و migration history حفظ شدند.
- DEV اکنون برای Seed/Import از صفر آماده است.

## 2. Architecture Decisions

### ADR-001 — PostgreSQL as Source of Truth

**Decision:** state مرکزی در PostgreSQL نگهداری شود.

**Reason:** جلوگیری از دوگانگی داده، امکان transaction، authorization مطمئن و audit بهتر.

**Impact:** Google Sheets از دیتابیس اصلی به operational interface/sync surface تبدیل می‌شود.

### ADR-002 — Modular Monolith First

**Decision:** FastAPI به‌صورت modular monolith اجرا شود.

**Reason:** پیچیدگی دامنه هنوز microservice را توجیه نمی‌کند؛ transaction و توسعه سریع‌تر مهم‌تر است.

**Impact:** Queue/service discovery/distributed tracing فعلاً لازم نیست.

### ADR-003 — Server-Side Authorization

**Decision:** access control فقط در Backend enforce شود.

**Reason:** hidden tabs، validation و filters امنیت ایجاد نمی‌کنند.

### ADR-004 — Immutable Domain IDs

**Decision:** User/Customer/Case ID immutable باشد.

**Reason:** sync، audit، Drive mapping و cross-system identity به شناسه پایدار نیاز دارند.

### ADR-005 — Explicit Sync

**Decision:** Sheet و DB فقط با adapter صریح sync شوند.

**Reason:** implicit two-way writes باعث split-brain و conflict می‌شود.

### ADR-006 — DEV Identity Adapter Is Non-Production

**Decision:** `X-User-ID` فقط DEV/STAGING.

**Reason:** header قابل جعل است و authentication واقعی محسوب نمی‌شود.

**Safeguard:** در Production adapter فعلی fail می‌شود.

### ADR-007 — Migration Safety with Temporary Branch

**Decision:** schema migrationهای مهم ابتدا روی temporary Neon branch تست شوند.

**Reason:** کاهش ریسک خراب‌شدن DEV schema و امکان بررسی قبل از apply.

### ADR-008 — DB Commit Before Sheet Marker

**Decision:** sync ابتدا DB commit، سپس Sheet success marker.

**Reason:** Sheet نباید success نشان دهد وقتی DB هنوز commit نشده است.

**Trade-off:** failure در Sheet write بعد از DB commit نیازمند reconciliation است.

## 3. Operational Decisions

- `main` تا review تغییر نکند.
- Production V4.9.2 در این workstream دست‌نخورده بماند.
- secrets/customer exports هرگز در repo ذخیره نشوند.
- Google connector موجود در ChatGPT credential runtime Vercel محسوب نشود.
- قبل از Production، production auth و automated QA gate اجباری باشد.

## 4. Deferred Decisions

- انتخاب نهایی authentication provider/mechanism.
- انتخاب strategy نهایی Google backend credential.
- Queue/background worker architecture.
- cache strategy.
- Docker/Kubernetes adoption.
- pagination/filter/search contract برای datasets بزرگ.
- document binary upload strategy از طریق Backend یا direct-to-Drive.

## 5. Traceability

Issue مستقل برای این اقدامات در GitHub موجود نیست. مرجع رسمی فعلی PR #1، commit history، migration files و مستندات داخل `docs/` است.
