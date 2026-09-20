# AUDIT-003 — Sheets & Schema Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Workstream: `FULL-SYSTEM-AUDIT`

## Evidence used

This audit used two sources:

1. **Current live Google Sheet**: `CRM | ترخیص یزد`  
   Spreadsheet ID: `1Ug-hwZxk47XlO60qGfUiSa7iUrJTXugyPTpUYrIvEQs`
2. Repository canonical schema:
   - `docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md`
   - `docs/FEATURE_MATRIX.md`

A Project XLSX snapshot modified on 2026-09-15 was also inspected. It contains only 7 sheets and is stale relative to the current live workbook, so it is retained only as historical evidence and is **not** the basis of the final live-schema verdict.

---

# Executive result

**AUDIT-003 status: FAIL — remediation required.**

The live Google Sheet currently contains **33 sheets**.  
The repository canonical schema defines **47 sheets**.

Therefore the live workbook is materially closer to the canonical design than the stale XLSX snapshot, but **14 canonical sheets are still absent**.

The largest unresolved gap is the complete RBAC / Workspace / Assignment / Provisioning data model plus the new document/version/clearance model.

---

# 1. Live sheet inventory

## Visible sheets

1. داشبورد مدیریتی
2. سرنخ‌ها
3. مشتریان
4. پرونده‌ها
5. تسک‌ها

## Hidden sheets

6. منوی کاراترخیص
7. 📣 بازاریابی و شرکت‌ها
8. مرکز هشدارها
9. 📊 مدیریت
10. 👥 کارمندها
11. 📁 پرونده‌ها و اسناد
12. میز کار اردوان
13. پروفایل شرکت
14. بازاریابی و پیگیری
15. پیگیری‌ها
16. راهنمای مکالمات
17. کارهای روزانه
18. پرونده جدید
19. پرونده‌ها و تسویه اردوان
20. اسناد پرونده‌ها
21. چک‌لیست اسناد
22. فهرست‌ها
23. Settings
24. System Log
25. کارمندان
26. مشتری جدید
27. اسناد مشتریان
28. گزارش واردات و صادرات
29. فرم‌های مدیریتی
30. راهنمای سیستم
31. دسترسی مشتریان
32. تسک‌های مشتریان
33. پیام‌های تسک مشتری

The visibility state now broadly matches the repository documentation for these existing sheets.

---

# 2. Canonical sheets missing from the live workbook

Severity: **HIGH / production blocker for canonical architecture**

The following 14 sheets defined in the repository schema do not currently exist in the live workbook:

1. رویدادهای خروج
2. اسناد پرونده
3. نسخه‌های اسناد
4. Users
5. Permissions
6. Workspace Mapping
7. Case Assignments
8. Assignment History
9. Provisioning Queue
10. Provisioning Log
11. مدیریت کاربران
12. Provisioning Settings
13. Assignment Policy
14. Dashboard Registry

## Impact

Because these tables are absent, the live workbook cannot currently prove or persist the canonical relationships for:

- User ID
- Permission ID / role scope
- Workspace Mapping ID
- Assignment ID
- Provisioning Request ID
- canonical Document ID / Version ID
- clearance event IDs
- dashboard registry references

This is a schema gap, not merely a documentation issue.

---

# 3. Sheet-by-sheet schema comparison

## سرنخ‌ها — PASS

Live columns: **28**  
Canonical columns: **28**

The live header exactly includes the lifecycle fields missing from the old XLSX snapshot:

- Batch ID
- Assigned At
- Last Activity At
- Reminder Count
- Last Reminder At
- Escalation Level
- Closed At
- Close Reason

Live Data Validation is also correctly attached by field:

- `مرحله فروش` → `فهرست‌ها!F2:F100`
- `مسئول` → `فهرست‌ها!B2:B100`
- `وضعیت` → فعال / بسته

The column-mapping defect found in the 2026-09-15 XLSX snapshot is **not present in the live sheet**.

---

## مشتریان — FAIL

Severity: **HIGH**

Live columns: **22**  
Canonical columns: **29**

Missing canonical columns:

- مدیر اصلی
- موبایل مدیر
- Gmail مدیر
- Telegram ID مدیر
- User ID مدیر
- Workspace مدیر
- وضعیت دسترسی مدیر

## Impact

The Customer entity cannot directly link to the canonical Customer Manager / User / Workspace lifecycle described in the repository.

### Additional integrity defect

A stray row exists with:

- `مشتری ID = blank`
- `نوع مشتری = حقیقی`

Any operational row in `مشتریان` must have a primary key. This row must be classified as helper/template residue or removed/migrated safely.

Valid populated Customer IDs observed:

- CUS-001
- CUS-002

No duplicate populated Customer ID was observed in the current small dataset.

---

## پرونده‌ها — FAIL

Severity: **HIGH**

Live columns: **28**  
Canonical columns: **32**

Missing canonical columns:

- Customer ID
- Sync Version
- Sync Source
- Sync Updated At

## Impact

This is a major relational defect. The Case table currently has no canonical `Customer ID` foreign key even though the repository defines:

`پرونده‌ها.Customer ID → مشتریان.مشتری ID`

The sheet currently has zero populated Case rows, so no row-level orphan exists today, but the schema itself cannot enforce or verify canonical customer linkage.

---

## تسک‌ها — FAIL

Severity: **HIGH**

Header structure matches the canonical generic Task schema.

However two migrated Task rows currently have:

- `نوع ارتباط = Customer`
- `شناسه مرتبط = blank`

Affected Task IDs:

- `KRT-789937DB`
- `KRT-E804BA74`

The canonical rule states that `شناسه مرتبط` must point to a valid Customer ID or Case ID according to relationship type.

These two rows therefore violate the canonical FK rule.

The company names map conceptually to existing customers:

- نیک بسپار → CUS-002
- فولاد بافق → CUS-001

but the formal FK field is still blank.

**Required remediation:** populate `شناسه مرتبط` using the canonical Customer IDs after a deterministic migration check.

---

## کارهای روزانه — PASS schema / migration follow-up required

Live columns: **23**  
Canonical columns: **23**

The live sheet contains the full canonical lifecycle fields:

- ایجاد شده در
- موعد دقیق
- تعداد یادآوری
- آخرین تغییر وضعیت
- بسته شده در
- آخرین آپدیت تلگرام
- منبع
- شماره پرونده

Observed logical Task IDs:

- `KRT-789937DB`
- `KRT-E804BA74`

These IDs correspond to the two rows migrated into the generic `تسک‌ها` table.

However the migrated generic rows lost their Customer FK in `شناسه مرتبط`, so the migration is not relationally complete.

---

## میز کار اردوان — PASS structure / Legacy

Live header contains all 12 documented columns including:

- خلاصه / KPI
- مقدار

This corrects the incomplete 10-column structure seen in the stale XLSX snapshot.

The sheet remains Legacy and must not be removed until dependency migration is proven.

---

## فهرست‌ها — PASS structure

The live sheet contains all 14 documented canonical/legacy list columns.

This also confirms that the stale XLSX snapshot's empty `فهرست‌ها` sheet is obsolete.

---

## Settings — PASS structure

Header:

`Key | Value | Description`

Runtime configuration exists in the live workbook.

---

## System Log — PASS structure

Header matches canonical observability schema:

`Timestamp | Module | Action | Record ID | Result | Error | Source | Details`

Live log data exists.

---

## کارمندان — FAIL vs canonical reconciliation target

Severity: **MEDIUM/HIGH**

Live legacy columns: **5**

- نام کارمند
- Telegram User ID
- نقش
- فعال؟
- Telegram Username

Repository catalog describes legacy reconciliation fields including:

- شناسه
- تاریخ ثبت
- آخرین بروزرسانی

More importantly, the canonical `Users` table does not exist at all.

Therefore Telegram employee identity still depends on a legacy table and cannot yet be reconciled against canonical User IDs.

---

## دسترسی مشتریان — PASS structure / storage quality issue

The 12-column header matches the catalog.

However the sheet is prefilled through approximately 1000 rows with boolean `FALSE` in `فعال؟` while the other fields are blank.

This makes naive row-count logic report hundreds of apparent rows.

**Required remediation:** all readers must determine logical record existence from a primary field such as Customer ID, not from row non-emptiness alone.

---

## تسک‌های مشتریان — PASS structure

20-column header matches canonical documentation.

No populated task rows currently exist.

---

## پیام‌های تسک مشتری — PASS structure

9-column header matches canonical documentation.

No populated message rows currently exist.

---

## اسناد مشتریان — PASS structure

8-column header matches canonical documentation.

No populated document rows currently exist.

---

## اسناد پرونده‌ها / چک‌لیست اسناد — Legacy only

Both documented legacy structures exist.

The new canonical sheets:

- اسناد پرونده
- نسخه‌های اسناد

do **not** exist.

Therefore the migration from legacy document storage to canonical Document/Version lifecycle has not been completed.

---

## پرونده‌ها و تسویه اردوان — Legacy

The documented 27-column legacy structure exists.

Its blank rows are prefilled with boolean FALSE in the customer-visibility field, so row count must not be interpreted as record count.

No canonical Case migration should delete this sheet until finance/document/customer-display dependencies are mapped.

---

# 4. Primary key audit

## Keys present and currently usable

### Lead ID

`سرنخ‌ها.شناسه`

Current live sample uses IDs such as:

- YAZD-B01-001
- YAZD-B01-002

No immediate duplicate was observed in sampled live data.

### Customer ID

`مشتریان.مشتری ID`

Observed populated IDs:

- CUS-001
- CUS-002

One malformed row exists without Customer ID.

### Task ID

`تسک‌ها.Task ID`

Observed:

- KRT-789937DB
- KRT-E804BA74

Both are unique in current live data.

### Daily Task logical ID

`کارهای روزانه.شناسه کار`

The two active logical IDs match the migrated generic Task IDs.

---

# 5. Foreign key audit

## Confirmed FK failure

### Generic Task → Customer

Rows with `نوع ارتباط = Customer` require a Customer identifier in `شناسه مرتبط`.

Current values:

| Task ID | Company | Expected Customer ID | Actual شناسه مرتبط |
|---|---|---|---|
| KRT-789937DB | نیک بسپار | CUS-002 | blank |
| KRT-E804BA74 | فولاد بافق | CUS-001 | blank |

Status: **FAIL**

---

## Case → Customer

Canonical FK:

`پرونده‌ها.Customer ID → مشتریان.مشتری ID`

Status: **UNIMPLEMENTED IN LIVE SCHEMA**

The Customer ID column is absent from the live Case sheet.

---

## Customer access → Customer

Schema exists but no populated records currently exist.

Status: **NO ORPHANS OBSERVED / no active data to validate**

---

## Customer Task → Customer / Case

Schema exists but no populated records currently exist.

Status: **NO ORPHANS OBSERVED / no active data to validate**

---

## Customer Task Message → Customer Task

Schema exists but no populated records currently exist.

Status: **NO ORPHANS OBSERVED / no active data to validate**

---

## Legacy customer documents → Customer

Schema exists but no populated rows currently exist.

Status: **NO ORPHANS OBSERVED / no active data to validate**

---

## RBAC / Workspace / Assignment / Provisioning FKs

Status: **CANNOT BE VALIDATED**

Parent/child tables are absent from the live workbook.

---

# 6. Cross-sheet dependency audit

## Confirmed live dependencies

- Dashboard → سرنخ‌ها
- Dashboard → کارهای روزانه
- Dashboard → تسک‌های مشتریان
- مرکز هشدارها → operational sheets
- Lead Stage / Owner validation → فهرست‌ها
- Customer type validation → فهرست‌ها
- Daily Tasks → generic Tasks migration by logical Task ID
- Reports → پرونده‌ها و تسویه اردوان
- Navigation sheets → operational sheets
- System Log records Customer registration operations

## Missing canonical dependency chains

The following repository-defined chains cannot currently exist end-to-end because tables are missing:

`Users → Permissions → Workspace Mapping`

`Case Assignments → Assignment History → Assignment Policy`

`Provisioning Settings + RAW Template → Provisioning Queue → Workspace → Mapping/Log`

`Case → اسناد پرونده → نسخه‌های اسناد`

`Case → رویدادهای خروج`

---

# 7. Legacy dependency status

Legacy sheets still actively present:

- میز کار اردوان
- پرونده‌ها و تسویه اردوان
- اسناد پرونده‌ها
- کارمندان
- پیگیری‌ها
- چک‌لیست اسناد
- راهنمای سیستم

They must not be removed until migration evidence exists.

The current live workbook still contains operational references to legacy data, especially:

- generic tasks migrated from Daily Tasks
- financial reports reading `پرونده‌ها و تسویه اردوان`
- Telegram identity in `کارمندان`

---

# 8. Stale XLSX snapshot discrepancy

The Project XLSX snapshot modified on 2026-09-15 contains only 7 sheets and outdated structures.

Examples of differences from Live:

- old Lead sheet had only 20 columns; Live has 28
- old Daily Tasks had only 15 columns; Live has 23
- old Lead validation was attached to wrong columns; Live validation is correct
- old `فهرست‌ها` appeared empty; Live is populated
- old `میز کار اردوان` had 10 columns; Live has 12

**Conclusion:** the XLSX snapshot must not be used as the current operational source of truth.

Any future local audit/export must export the current Google Sheet immediately before testing.

---

# 9. AUDIT-003 blockers

Production readiness remains blocked by:

1. **14 canonical sheets missing from Live**
2. `مشتریان` missing 7 canonical manager/workspace columns
3. `پرونده‌ها` missing Customer ID and sync metadata columns
4. canonical `Users` / `Permissions` / Workspace / Assignment model absent
5. canonical Provisioning tables absent
6. canonical Document / Version / Clearance tables absent
7. two generic Customer tasks have blank FK `شناسه مرتبط`
8. malformed Customer row exists without Customer ID
9. legacy Telegram identity still depends on `کارمندان`
10. prefilled FALSE rows can corrupt naive row-count / existence logic
11. stale local XLSX snapshot differs materially from Live and must be replaced for future offline audits

---

# 10. Required remediation sequence

## Before modifying production

1. Repair the two generic Task Customer FKs.
2. Remove or classify the malformed Customer row with blank Customer ID.
3. Add canonical Customer manager/User/workspace fields through a migration-safe schema update.
4. Add Case `Customer ID` + sync metadata fields.
5. Implement Users / Permissions / Workspace Mapping / Assignment / Provisioning tables in staging first.
6. Implement canonical Document / Version / Clearance tables with migration from legacy sheets.
7. Make logical record detection key-based instead of using non-empty rows.
8. Refresh the Project XLSX snapshot from current Live after schema stabilization.

---

# AUDIT-003 acceptance

**FAIL**

The 33-sheet live workbook is substantially more complete than the stale local snapshot, and many current sheets match their documented structures. However the canonical V4.26+ architecture is not yet fully materialized in the live Spreadsheet, and concrete FK/data-quality defects remain.

Proceed to AUDIT-004 for full Formula & Data Validation audit while keeping production rollout blocked.
