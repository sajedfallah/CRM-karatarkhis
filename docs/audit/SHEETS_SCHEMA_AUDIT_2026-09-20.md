# AUDIT-003 — Sheets & Schema Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Workstream: `FULL-SYSTEM-AUDIT`

## Scope and evidence

This audit compared the supplied operational workbook snapshot (`CRM | ترخیص یزد`) against the canonical repository schema in `docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md` and `docs/FEATURE_MATRIX.md`.

The supplied workbook is a valid XLSX file, but its structure is materially smaller and older than the canonical schema. It must **not** be treated as a production-schema source of truth until reconciled.

## Executive finding

**Status: FAIL — High schema drift.**

Canonical repository schema defines **47 sheets**.  
The supplied workbook contains only **7 sheets**, all visible:

1. سرنخ‌ها
2. داشبورد مدیریتی
3. پیگیری‌ها
4. کارهای روزانه
5. فهرست‌ها
6. راهنمای مکالمات
7. میز کار اردوان

Therefore 40 canonical sheets are absent from this snapshot, including all current Customer, Case, Document, RBAC, Assignment, Provisioning and observability tables.

This means FK integrity for Customer ID, Case ID, Task ID, User ID, Document ID, Version ID, Assignment ID, Request ID and Mapping ID cannot be validated from this workbook.

---

## Finding S-001 — Workbook is not aligned with canonical sheet catalog

Severity: **HIGH**

Expected: 47 canonical sheets.  
Actual: 7 sheets.

Major missing domains:

- مشتریان / مشتری جدید / اسناد مشتریان
- پرونده‌ها / پرونده جدید
- تسک‌ها
- Users
- Permissions
- Workspace Mapping
- Case Assignments
- Assignment History
- Assignment Policy
- Provisioning Queue
- Provisioning Log
- Provisioning Settings
- اسناد پرونده
- نسخه‌های اسناد
- رویدادهای خروج
- تسک‌های مشتریان
- پیام‌های تسک مشتری
- Settings
- System Log
- Dashboard Registry
- مرکز هشدارها
- role/navigation sheets defined by canonical schema

### Risk

Apps Script header lookups, workspace sync, provisioning, role isolation, Telegram authorization and Drive integration cannot be validated against this workbook because their source tables are absent.

### Required remediation

1. Identify the real live/staging master Spreadsheet ID.
2. Export a fresh structural snapshot from that workbook.
3. Compare the live sheet inventory against the 47-sheet catalog.
4. Treat this 7-sheet workbook as legacy/partial unless proven otherwise.
5. Do not migrate or delete legacy sheets until dependency reconciliation is complete.

---

## Finding S-002 — `سرنخ‌ها` schema is outdated

Severity: **HIGH**

Actual columns: **20**

`شناسه | تاریخ ثبت | نام شرکت | شخص رابط | شماره تماس | حوزه فعالیت | نوع کالا | منبع سرنخ | دلیل انتخاب | امتیاز | مرحله فروش | مسئول | آخرین تماس | نتیجه تماس | اقدام بعدی | تاریخ پیگیری بعدی | ارزش احتمالی | احتمال موفقیت | وضعیت | یادداشت`

Canonical schema: **28 columns**

Missing canonical columns:

- Batch ID
- Assigned At
- Last Activity At
- Reminder Count
- Last Reminder At
- Escalation Level
- Closed At
- Close Reason

### Risk

Reminder/escalation, assignment history and closed-lead lifecycle cannot be represented reliably in this snapshot.

### Required remediation

Migrate the live Lead table to canonical headers only after checking Apps Script header lookups, formulas, validation ranges and Telegram formatters.

---

## Finding S-003 — Lead Data Validation is attached to the wrong columns

Severity: **CRITICAL for data-entry correctness**

Actual XLSX validation rules:

- `K2:K1000` contains list `اردوان,ساجد`
- `J2:J1000` contains list `NEW,CONTACTED,INTERESTED,QUALIFIED,QUOTE,NEGOTIATION,WON,LOST`

But actual headers are:

- Column J = `امتیاز`
- Column K = `مرحله فروش`
- Column L = `مسئول`

Therefore:

- Sales-stage values are being validated in the **Score** column.
- Person/owner values are being validated in the **Sales Stage** column.
- The actual `مسئول` column has no corresponding owner validation.

### Required remediation

Move/replace validation based on header lookup, not hard-coded column numbers:

- `مرحله فروش` → canonical stage list
- `مسئول` → active Users/employee source
- `امتیاز` → numeric validation (expected score range must be defined explicitly)

Do not repair by positional index alone; use header resolution.

---

## Finding S-004 — `کارهای روزانه` is missing canonical lifecycle columns

Severity: **HIGH**

Actual columns: **15**

`تاریخ | مسئول | دسته‌بندی | کار روزانه | مرتبط با شرکت | اولویت | موعد | وضعیت | نتیجه | کار فردا | یادداشت مدیریتی | شناسه کار | Telegram Message ID | آخرین یادآوری | ارسال به اردوان`

Canonical schema: **23 columns**

Missing:

- ایجاد شده در
- موعد دقیق
- تعداد یادآوری
- آخرین تغییر وضعیت
- بسته شده در
- آخرین آپدیت تلگرام
- منبع
- شماره پرونده

Also the actual last header is `ارسال به اردوان` while the canonical catalog describes `ارسال به کارمند`.

### Risk

Conflict detection, personal-task ownership, reminder history, close timestamps, Telegram synchronization and Case linkage cannot be represented consistently.

### Required remediation

Reconcile the live table against canonical V4.28/V4.29 Apps Script expectations before changing headers.

---

## Finding S-005 — `فهرست‌ها` has no populated used range in the supplied workbook

Severity: **HIGH**

Canonical schema expects list sources for:

- شرکت‌ها
- کارکنان
- وضعیت پرونده
- اولویت
- وضعیت کار
- مرحله فروش
- وضعیت بازاریابی
- دسته‌بندی کار
- نوع سند
- وضعیت سند
- نوع پرونده
- نوع مشتری
- نقش کارمند
- مرحله پرونده

The supplied workbook reports no populated range for this sheet.

### Risk

Dropdowns are forced to use hard-coded inline lists, increasing schema drift and stale-value risk.

### Required remediation

Rebuild canonical list sources or verify that the real live workbook already contains them. Prefer central list/range sources over duplicated hard-coded list strings.

---

## Finding S-006 — Dashboard contains formula errors

Severity: **HIGH**

Detected:

- `داشبورد مدیریتی!A11` → `#NAME?`
- `داشبورد مدیریتی!A14` → `#NAME?`

The stored formulas contain compatibility wrappers using `__xludf.DUMMYFUNCTION` around FILTER/TEXTJOIN expressions.

### Risk

Dashboard task summaries are not reliable in the supplied XLSX environment.

### Required remediation

AUDIT-004 must replace/normalize these formulas for the target runtime and verify them cell-by-cell.

---

## Finding S-007 — Dashboard KPI cells have incorrect number formatting

Severity: **MEDIUM**

Counter formulas in:

- B5
- B6
- B7

evaluate as numeric counts, but displayed values are interpreted/formatted as dates such as `1899-12-30` / `1900-01-05`.

### Required remediation

Set KPI count cells to integer/General number format and regression-test the Dashboard formatting.

---

## Finding S-008 — `میز کار اردوان` is legacy and structurally incomplete vs catalog

Severity: **MEDIUM / migration blocker**

Actual headers: **10**

`ترتیب | نوع کار | شرکت / پرونده | اقدام دقیق | راه تماس | اولویت | وضعیت | نتیجه | اقدام بعدی | ارجاع به مدیر`

Canonical catalog also describes:

- خلاصه / KPI
- مقدار

This sheet contains live operational-looking data, so it cannot be deleted merely because it is marked Legacy.

### Required remediation

Build a dependency/migration mapping from every field in this sheet to canonical Lead/Task/Case structures before removal.

---

## Finding S-009 — `پیگیری‌ها` and `راهنمای مکالمات` headers match the canonical catalog

Severity: **PASS with limitations**

The supplied header structures match the documented legacy/reference schema.

However:

- `پیگیری‌ها` has no data rows in this snapshot.
- Neither sheet proves integration with canonical Lead/User/Task IDs.
- Referential integrity is therefore not established.

---

## Primary key and orphan assessment

### Keys directly observable in supplied snapshot

- `سرنخ‌ها.شناسه`: values use IDs such as `YZ-001` ... `YZ-005`.
- `کارهای روزانه.شناسه کار`: present in the table structure and intended as logical task key.

### Canonical keys that cannot be audited because parent sheets are absent

- Customer ID
- Case ID
- Task ID (generic task table)
- User ID
- Document ID
- Version ID
- Assignment ID
- Request ID
- Mapping ID

### Orphan-record risk

**HIGH / untestable in this snapshot.**

References such as responsible user, company/customer, case, workspace, assignment and document relationships cannot be verified without their parent tables.

The absence of the parent sheets is itself an audit failure; it is not evidence that no orphans exist.

---

## Hidden-sheet audit

The supplied XLSX marks **all 7 sheets as visible**.

This differs from the canonical catalog, where many operational/helper/legacy sheets are expected to be hidden.

### Risk

This further supports that the supplied workbook is a legacy/partial operational workbook rather than the canonical current master.

---

## Data Validation inventory found in supplied XLSX

### سرنخ‌ها

- `J2:J1000`: stage list — **wrong target column**
- `K2:K1000`: owner list — **wrong target column**

### کارهای روزانه

- `B2:B500`: `اردوان,مدیر`
- `C2:C500`: task categories
- `F2:F500`: priority
- `H2:H500`: task status

These are positional hard-coded lists rather than canonical Users/Settings/list-source relationships.

### میز کار اردوان

- `G3:G500`: legacy task status list

### Risk

Hard-coded duplicated lists can diverge from Settings/Users/Permissions and should be treated as legacy compatibility data.

---

## Cross-sheet dependency status

### Confirmed dependencies in supplied workbook

- Dashboard → سرنخ‌ها
- Dashboard → کارهای روزانه
- میز کار اردوان contains duplicated operational lead/task information

### Canonical dependencies not verifiable here

- Lead → activity/follow-up → Customer
- Customer → Case
- Case → Document / Version / Clearance / Assignment / Tasks
- Users → Permissions / Workspace Mapping / Provisioning / Assignments
- Provisioning Settings + RAW Templates → Queue → Workspace → Mapping/Log
- Customer Task → Customer Task Messages
- Dashboard/Alerts → full operational domain

---

## AUDIT-003 acceptance result

**FAIL — remediation required before production readiness.**

Confirmed blockers:

1. 7-sheet snapshot vs 47-sheet canonical schema.
2. Missing RBAC, Customer, Case, Document, Assignment and Provisioning parent tables.
3. Lead validation mapped to incorrect columns.
4. Daily-task schema missing canonical lifecycle fields.
5. Empty/unpopulated list-source sheet.
6. Dashboard `#NAME?` errors.
7. KPI count cells formatted as dates.
8. Legacy workbench remains operational and unmigrated.
9. Referential/orphan validation cannot be completed from this workbook.

## Required next actions

1. AUDIT-004: complete Formula & Data Validation audit and repair the confirmed broken formulas/validation mappings.
2. Obtain/export the actual current live/staging master workbook and rerun the 47-sheet inventory.
3. Do not declare schema audit green until all canonical PK/FK relationships can be evaluated against a complete workbook.
4. Keep production rollout blocked.

