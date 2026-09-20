# AUDIT-006 — Template & Workspace Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`

## Executive result

**AUDIT-006 status: FAIL — template source-of-truth is identifiable and mostly healthy, but Workspace lifecycle/provisioning cannot yet be certified.**

No Production Workspace or Production RAW Template was modified.

Safe staging-only changes were made to:

`STAGING AUDIT-004 | CRM ترخیص یزد | 2026-09-20`

---

# 1. Canonical RAW Template source-of-truth — PASS

Repository documentation defines four native Google Sheets RAW templates:

| Role | Canonical Google Sheet ID |
|---|---|
| مدیر | `1Zt890HbsaHUS20ldmzWSrH0rRIEAuDgpavr8dqxxHBw` |
| کارمند داخلی | `1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0` |
| مدیر مشتری | `1m_Ao7XQMVlhhsMx4AR82b60GCK0XHKXhTW_S5BxKIAI` |
| کارمند مشتری | `1eesSiyEhUr4qJkp4rK3qtRnt3w3X0yXH08dfZ08cXiE` |

All four IDs resolve to native Google Sheets.

All four are located under the canonical Drive folder:

`تمپلیت`

All four have no broad Drive sharing; observed permissions are owner-only.

This matches `templates/README.md`.

---

# 2. GitHub XLSX snapshots are not the live source — PASS with duplicate-artifact risk

The repository contains version-control snapshots:

- `RAW_Admin.xlsx`
- `RAW_Internal_Employee.xlsx`
- `RAW_Customer_Manager.xlsx`
- `RAW_Customer_Employee.xlsx`

Drive also contains imported XLSX copies and at least one extra native/imported RAW artifact.

Therefore there are multiple review artifacts with similar names.

## Risk

A human operator could accidentally treat a snapshot/import as the provisioning source.

## Rule

Only the documented native canonical IDs above may be used for provisioning.

GitHub XLSX and Drive XLSX files are review/export artifacts only.

---

# 3. Provisioning code source — PASS in repository

The active provisioning code resolves template IDs through:

`DASHBOARD_TEMPLATES`

which reads Script Properties:

- `TEMPLATE_ADMIN_ID`
- `TEMPLATE_INTERNAL_EMPLOYEE_ID`
- `TEMPLATE_CUSTOMER_MANAGER_ID`
- `TEMPLATE_CUSTOMER_EMPLOYEE_ID`

The provisioning code does not use `LIVE_DASHBOARDS` as a template source.

A regression guard was added during AUDIT-006:

`workspace provisioning never uses LIVE dashboards as template source`

Commit:

`30665b96b896c6aa4997be142176c881392116d8`

## Remaining limitation

The actual Production Script Property values could not be proven from the Spreadsheet itself.

Therefore it is not yet proven that the deployed Apps Script properties equal the four canonical IDs documented in GitHub.

This must be checked during deployment/runtime inventory.

---

# 4. Role-specific RAW Template visibility — PASS

## مدیر

Visible:

- داشبورد مدیریت
- مشتریان
- پرونده‌ها
- تسک‌ها
- 📅 تسک روزانه من

Hidden technical tabs:

- سرنخ‌ها
- تسک‌های مشتریان
- اسناد پرونده

## کارمند داخلی

Visible:

- داشبورد من
- پرونده‌های من
- تسک‌های من
- اسناد پرونده‌های من
- 📅 تسک روزانه من

Hidden canonical source tabs:

- مشتریان
- پرونده‌ها
- تسک‌ها
- سرنخ‌ها
- تسک‌های مشتریان
- اسناد پرونده

## مدیر مشتری

Visible:

- داشبورد شرکت
- اطلاعات شرکت
- پرونده‌های شرکت
- تسک‌های شرکت
- 📅 تسک روزانه من

Canonical data tabs are hidden.

## کارمند مشتری

Visible:

- داشبورد من
- پرونده‌های قابل مشاهده
- تسک‌های من
- 📅 تسک روزانه من

Canonical data tabs are hidden.

Role separation in the RAW template UI is consistent with the intended UX.

---

# 5. RAW Template operational-data cleanliness — PASS

The canonical data tabs of all four RAW templates were sampled directly.

No operational rows were found below the header in:

- مشتریان
- پرونده‌ها
- تسک‌ها
- سرنخ‌ها
- تسک‌های مشتریان
- اسناد پرونده
- 📅 تسک روزانه من

This confirms that the RAW templates are structurally clean and are not currently carrying copied Production data.

---

# 6. Dashboard formulas — PASS

Each canonical RAW role dashboard contains active formulas.

No effective formula error was detected in the audited dashboard regions.

Observed:

- no `#REF!`
- no `#NAME?`
- no `#VALUE!`
- no `#DIV/0!`

The same check on the two existing user Workspaces also produced no dashboard formula error.

---

# 7. Vazirmatn styling — PASS for populated template/workspace content

For non-empty cells inspected across the canonical RAW templates, the effective font was `Vazirmatn`.

The two existing internal-employee Workspace dashboards also use `Vazirmatn` on populated dashboard content.

Blank cells may retain Google Sheet default formatting; this does not affect populated UI content.

---

# 8. T-001 — RAW Template timezone differs from CRM master

Severity: **MEDIUM**

All four RAW templates currently report:

`Etc/GMT`

The central CRM reports:

`Asia/Tehran`

## Risk

Role Workspaces created from RAW templates may inherit a timezone that differs from the CRM source.

Functions/formulas using:

- NOW()
- TODAY()
- date/time comparisons
- reminder deadlines
- daily task dates
- Apps Script spreadsheet timezone assumptions

can become inconsistent.

## Required remediation

Before Production template rollout:

- standardize all four RAW templates to `Asia/Tehran`
- verify role Workspaces inherit the intended timezone
- regression-test date-sensitive formulas and reminder logic

No Production template timezone was changed in this audit.

---

# 9. LIVE Dashboards — structurally separate and private

Four LIVE dashboard files exist in the dedicated folder:

`داشبوردهای LIVE`

Roles:

- Admin
- Internal Employee
- Customer Manager
- Customer Employee

All four are private/owner-only based on observed metadata.

Their sheet structures mirror their corresponding RAW role design.

This is consistent with the architecture rule:

**LIVE dashboards are operational references and not provisioning source templates.**

---

# 10. Workspace Drive architecture — PARTIAL PASS

The Drive hierarchy contains:

`Workspace کاربران`

with four role folders:

- مدیر
- کارمند داخلی
- مدیر مشتری
- کارمند مشتری

This matches the documented target architecture.

## Current actual Workspace inventory

Observed user Workspaces:

- 2 internal-employee Workspaces
- 0 admin user Workspace
- 0 customer-manager Workspace
- 0 customer-employee Workspace

No duplicate User ID Workspace name was observed in the current role folders.

---

# 11. Existing internal-employee Workspaces — structural PASS

Two existing internal-employee Workspaces were inspected.

Both contain the expected role UI:

- داشبورد من
- پرونده‌های من
- تسک‌های من
- اسناد پرونده‌های من
- 📅 تسک روزانه من

and hidden canonical data tabs.

Both currently show zero populated operational rows in the audited scoped source/view ID columns.

No dashboard formula errors were found.

Vazirmatn is applied to populated dashboard content.

---

# 12. Workspace sharing — no broad leak reproduced

Both existing internal employee Workspaces are shared with:

- file owner
- one writer principal

No `anyone` or domain-wide permission was observed.

Therefore no broad Drive-sharing leak was reproduced.

## Limitation

Because Live lacks canonical `Workspace Mapping`, the expected email/User ID cannot be reconciled automatically against each actual Drive permission.

So sharing is narrow, but ownership correctness is not yet formally proven by the CRM registry.

---

# 13. W-001 — Live Workspace Mapping is absent

Severity: **HIGH**

Production Live does not contain:

`Workspace Mapping`

even though actual user Workspace files exist in Drive.

## Impact

The system cannot reliably answer:

- which Workspace is canonical for a User ID
- whether a Workspace is stale
- whether duplicate Workspaces exist historically
- which Gmail should still have access
- which previous Gmail must be revoked
- last sync time
- provisioning status
- whether an orphan Workspace should be archived

This blocks reliable Workspace lifecycle management.

---

# 14. W-002 — Live Provisioning Settings is absent

Severity: **HIGH**

Production Live does not contain:

`Provisioning Settings`

The code can use Script Properties directly, but the documented architecture expects this table to define role/template provisioning policy.

Without it, live runtime policy cannot be audited from the CRM workbook.

This also prevents a live reconciliation between:

- Role
- Template Type
- Template File ID
- Default Profile
- Required Customer
- Share Permission
- Active

---

# 15. W-003 — Dashboard Registry is absent

Severity: **MEDIUM/HIGH**

Four LIVE dashboards exist in Drive, but Production Live does not contain:

`Dashboard Registry`

Therefore their lifecycle/status/last-sync is not tracked canonically in CRM.

---

# 16. Staging remediation performed

No Production Workspace or template was changed.

In the existing staging workbook, AUDIT-006 created:

## Provisioning Settings

Populated with the four canonical RAW template IDs documented in GitHub.

## Dashboard Registry

Populated with the four currently observed LIVE dashboard IDs/URLs.

These are staging-only reference tables for later provisioning/E2E tests.

The earlier AUDIT-005 staging scaffold already includes:

- Users
- Permissions
- مدیریت کاربران
- Workspace Mapping

Together, the staging workbook now has the minimum registry/control tables needed for synthetic provisioning tests.

---

# 17. Stale / duplicate Workspace verdict

## Proven duplicate canonical Workspace

None observed among the currently listed role folders.

## Proven stale Workspace

Cannot be determined reliably.

Reason:

- Production `Workspace Mapping` is absent
- canonical User table is absent
- provisioning history is absent

A Drive file's modification date alone is not sufficient evidence that it is stale.

Therefore no Workspace was deleted, moved or archived.

---

# 18. Migration requirements

Before Production Workspace migration:

1. Verify deployed Script Properties equal the four canonical RAW template IDs.
2. Standardize RAW template timezone to `Asia/Tehran`.
3. Create Production `Provisioning Settings`.
4. Create Production `Workspace Mapping`.
5. Import/reconcile existing Drive Workspaces into Mapping without creating duplicates.
6. Create `Dashboard Registry`.
7. Add canonical Users/Permissions first.
8. For each mapped Workspace verify:
   - User ID
   - Role
   - Customer ID
   - Gmail
   - Drive permission
   - Template type
   - current/stale status
9. Execute change-Gmail and deactivation revocation tests.
10. Execute four-role synthetic provisioning on staging.
11. Confirm template copies contain no operational data before scoped sync.
12. Confirm scoped sync does not leak another customer/user's data.
13. Only after green E2E, migrate Production.

---

# AUDIT-006 acceptance

**FAIL — Production Workspace gate remains closed.**

## Passed

- four canonical RAW IDs exist
- correct Drive template folder
- RAW templates are private
- RAW templates contain no operational data
- role-specific visible/hidden sheet structure is appropriate
- dashboard formulas currently evaluate without errors
- populated UI content uses Vazirmatn
- LIVE dashboards are separate/private
- Workspace folder role hierarchy exists
- existing Workspaces do not show broad Drive sharing
- no duplicate current User ID Workspace observed

## Blocking

- RAW template timezone mismatch
- deployed Script Property template IDs not yet runtime-verified
- Live Workspace Mapping missing
- Live Provisioning Settings missing
- Live Dashboard Registry missing
- canonical User/Permission model not yet live
- existing Workspace sharing cannot be reconciled to canonical User/Mapping
- no Customer Manager / Customer Employee Workspace E2E
- no four-role provisioning E2E
- stale/orphan Workspace inventory cannot yet be proven

Next task: **AUDIT-007 — Provisioning Audit**.
