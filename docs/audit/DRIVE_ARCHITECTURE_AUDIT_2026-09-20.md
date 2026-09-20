# AUDIT-009 — Drive Architecture Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`

## Executive result

**AUDIT-009 status: FAIL — top-level Drive architecture is largely correct, but a critical source-of-truth split and several placement/configuration defects block Production readiness.**

No Production file was deleted or moved.

Only Audit-created staging artifacts were relocated out of the project root into a dedicated staging folder under Archive.

---

# 1. Canonical top-level Drive structure — PASS

Observed under `Customs CRM`:

- `00-هسته CRM`
- `تمپلیت`
- `داشبوردهای LIVE`
- `Workspace کاربران`
- `اسناد CRM`
- `ورژن`
- `گزارش‌ها و خروجی‌ها`
- `بکاپ و آرشیو`
- `راهنما و مستندات`

This matches `docs/DRIVE_ARCHITECTURE.md`.

All audited top-level system folders are owner-only/private based on Drive permission metadata.

No domain-wide or anyone permission was observed on the system folders.

---

# 2. D-001 — Critical CRM source-of-truth split

Severity: **CRITICAL**

Two materially different CRM spreadsheets exist.

## Legacy/root workbook

ID:

`1Ug-hwZxk47XlO60qGfUiSa7iUrJTXugyPTpUYrIvEQs`

Title:

`CRM | ترخیص یزد`

Observed parent:

project root `Customs CRM`

Observed schema:

**33 sheets**

Last modified in metadata:

2026-09-16

## Canonical/core workbook candidate

ID:

`1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

Title:

`CRM | ترخیص یزد | V1.5 | 2026-09-17`

Parent:

`00-هسته CRM`

Observed schema:

**47 sheets**

Last modified:

2026-09-20

The 47-sheet workbook contains the canonical sheets that were missing from the root workbook:

- رویدادهای خروج
- اسناد پرونده
- نسخه‌های اسناد
- Users
- Permissions
- Workspace Mapping
- Case Assignments
- Assignment History
- Provisioning Queue
- Provisioning Log
- مدیریت کاربران
- Provisioning Settings
- Assignment Policy
- Dashboard Registry

## Impact

The project context had pointed earlier audits at the 33-sheet root workbook.

Therefore AUDIT-003 through portions of AUDIT-007 used a stale/legacy workbook as their Live evidence source.

Those audits remain useful for code/staging defects, but any conclusion that a canonical table was absent from Production must now be revalidated against the 47-sheet core workbook.

## Required remediation

1. Formally designate the 47-sheet core workbook as the Production Source of Truth if runtime Script Properties confirm it.
2. Verify deployed `SPREADSHEET_ID`.
3. Mark the 33-sheet workbook as Legacy/Archive or migrate/retire it safely.
4. Do not delete or move either workbook until runtime references and triggers are verified.
5. Re-run schema/RBAC/provisioning evidence against the canonical 47-sheet workbook before final readiness.

---

# 3. Core workbook placement — PASS for canonical candidate

The 47-sheet workbook is correctly located inside:

`00-هسته CRM`

This matches architecture rule #1.

The 33-sheet root workbook violates the intended single-core placement rule if it is still considered operational.

---

# 4. Canonical document root — PASS

`اسناد CRM`

exists directly under the CRM project root.

The canonical 47-sheet workbook Settings points these document-root keys to that folder:

- `CASE_DOCS_ROOT_FOLDER_ID`
- `CUSTOMER_DOCS_ROOT_FOLDER_ID`
- `CRM_DOCS_ROOT_FOLDER_ID`

All resolve to:

`13h-NyW6CQgJAAB3EtBGjowNypHLZn2-s`

This is internally consistent.

---

# 5. Customer folder hierarchy — PARTIAL PASS

Observed customer folder:

`CUS-001 | فولاد بافق`

under:

`اسناد CRM`

Its children are:

- `00-اسناد پایه`
- `پرونده‌ها`

This matches the documented hierarchy.

The customer row in the 47-sheet CRM points its `📁 پوشه اسناد` field to this same folder.

This provides positive Customer → Drive linkage evidence.

---

# 6. D-002 — Case folder hierarchy is not materialized

Severity: **HIGH**

The 47-sheet CRM contains:

`CASE-001`

with operation type:

`واردات`

but:

`CUS-001 | فولاد بافق / پرونده‌ها`

currently contains no operation or Case subfolder.

Expected architecture:

`Customer / پرونده‌ها / نوع عملیات / CASE-XXX`

## Impact

Case-level document placement cannot currently be enforced or proven for CASE-001.

## Required remediation

When the Case record has a valid Customer ID/customer linkage:

1. create operation folder deterministically
2. create/reuse Case folder by Case ID
3. persist Case folder ID/URL in canonical document/case data
4. prohibit document uploads outside the case folder

No Production folder was created automatically in AUDIT-009 because the Case row currently has incomplete customer linkage fields and Production mutation was explicitly out of scope.

---

# 7. RAW Template architecture — PASS with artifact ambiguity

The four canonical native RAW template IDs audited in AUDIT-006 remain the intended source of truth.

They are private and reside under the `تمپلیت` folder.

The same folder also contains:

- XLSX snapshots
- an additional native file named `RAW_Admin`

These extra artifacts are not the documented canonical template IDs.

## Risk

Name-based human selection can choose the wrong file.

## Required policy

Provisioning must select RAW templates only by canonical ID, never by filename.

---

# 8. D-003 — Public RAW Admin snapshot

Severity: **MEDIUM/HIGH**

File:

`RAW_Admin.xlsx`

has permission:

`anyone → reader`

with link discovery disabled.

The file is a snapshot/export rather than the canonical native RAW template, and no operational data was identified in canonical RAW templates.

However public-link access violates the private-template architecture.

## Required remediation

Remove public-link permission after confirming there is no external workflow relying on that snapshot.

AUDIT-009 did not change Production/template permissions.

---

# 9. D-004 — Provisioning Settings in canonical CRM points to LIVE dashboards

Severity: **CRITICAL**

The 47-sheet core workbook contains `Provisioning Settings`.

Its `Template File ID` values currently point to:

- LIVE Admin dashboard
- LIVE Internal Employee dashboard
- LIVE Customer Manager dashboard
- LIVE Customer Employee dashboard

These are the four LIVE Dashboard IDs.

This directly violates architecture rule:

**Dashboard LIVE is not a provisioning template source.**

The repository/code expects canonical RAW Template IDs through `DASHBOARD_TEMPLATES`.

## Impact

Any runtime path that trusts the sheet setting instead of the final code/property resolver may provision from LIVE files.

Even if the current final Apps Script reads Script Properties, the sheet itself is stale/misleading configuration and fails the architecture audit.

## Required remediation

Run the existing safe reconciliation helper:

`repairProvisioningSettingsV427_(dryRun)`

against the canonical 47-sheet workbook first in dry-run mode, confirm expected four RAW IDs, then apply only after runtime `SPREADSHEET_ID` and template Script Properties are verified.

No Production cell was changed during AUDIT-009.

---

# 10. LIVE Dashboard architecture — PASS

Four LIVE dashboard files exist under:

`داشبوردهای LIVE`

They are owner-only/private based on observed metadata.

They are structurally separate from canonical RAW templates.

This is correct.

---

# 11. Workspace role folders — PASS

`Workspace کاربران` contains four role folders:

- مدیر
- کارمند داخلی
- مدیر مشتری
- کارمند مشتری

All are private and correctly parented under the Workspace root.

---

# 12. Workspace Mapping — PASS in canonical 47-sheet CRM

Contrary to the legacy 33-sheet workbook, the canonical core CRM contains `Workspace Mapping`.

Two existing internal-employee Workspaces are mapped:

- `USR-INTERNAL-001`
- `USR-INTERNAL-002`

Their mapped Spreadsheet IDs correspond to the two actual Drive Workspace files previously audited.

This resolves an earlier evidence gap caused by auditing the wrong workbook.

---

# 13. Existing Workspace sharing — narrow, not broad

The two mapped internal-employee Workspaces were previously observed with:

- owner
- one writer principal

No domain/anyone access was observed.

This is consistent with role-specific sharing.

Full access correctness still requires User/Permission/Gmail reconciliation on the canonical workbook.

---

# 14. Version folder — functional but contains duplicate artifacts

The `ورژن` folder contains many sequential Apps Script snapshots.

This is appropriate for engineering history.

However duplicate artifacts exist.

Example:

Two files named:

`Karatarkhis_CRM_FINAL_EXEC.js`

have the same observed size:

`44666` bytes

with different Drive IDs.

## Risk

Manual rollback can select an ambiguous duplicate.

## Required remediation

Do not delete automatically.

Create a release manifest with:

- version
- Drive file ID
- commit SHA
- created timestamp
- canonical/deprecated status

Then archive confirmed duplicates.

---

# 15. Reports folder — empty

`گزارش‌ها و خروجی‌ها`

currently contains no files.

This is not itself a defect, but it means no evidence exists yet for the report-output placement rule.

---

# 16. Backup/archive folder — previously empty, staging area added safely

`بکاپ و آرشیو`

had no files/folders at the start of this audit.

AUDIT-009 created:

`STAGING-AUDIT`

under Archive and moved only Audit-created staging artifacts into it:

- `STAGING AUDIT-004 | CRM ترخیص یزد | 2026-09-20`
- `STAGING AUDIT-007 Provisioning E2E 2026-09-20`

This was a safe staging-only remediation.

No Production artifact was moved.

The project root is now cleaner of Audit-generated files.

---

# 17. Backup policy gap

Severity: **HIGH operational resilience**

No actual periodic Production backup was observed in `بکاپ و آرشیو`.

The folder existed but contained no backup evidence before Audit staging artifacts were moved there.

## Required remediation

Define automated backup policy for:

- canonical 47-sheet CRM
- Apps Script source/export
- critical template IDs/settings
- Workspace Mapping / Permissions / Provisioning control tables

Include retention and restore test.

---

# 18. Guide/documentation placement — PASS

`راهنما و مستندات`

contains a Drive architecture/source-of-truth guide.

This matches the intended architecture.

---

# 19. Permission inheritance / broad-sharing audit

Observed system folders are owner-only/private:

- root
- core
- templates
- LIVE dashboards folder
- Workspace root
- role Workspace folders
- documents root
- versions
- reports
- archive
- guides

No broad inheritance was observed from the system folder tree.

Known exception:

- `RAW_Admin.xlsx` snapshot has anyone-with-link reader permission

Existing user Workspace sharing is file-specific, as expected.

---

# 20. Wrong-parent / root-placement findings

## Confirmed architectural issue

The legacy 33-sheet CRM has been observed with parent = project root rather than `00-هسته CRM`.

Do not move it until runtime reference status is known.

## Audit artifacts

AUDIT-created staging artifacts were initially in project root and have now been moved into `بکاپ و آرشیو/STAGING-AUDIT`.

## System folders

All main system folders are correctly parented.

---

# 21. Protected-ID architecture

AUDIT-008 already changed the active protected Drive ID logic so that:

- CRM/system folders
- role Workspace folders
- RAW templates
- LIVE dashboards

are protected by configuration-derived IDs rather than hardcoded LIVE file IDs.

This is aligned with Drive architecture.

Final validation still depends on runtime Script Property values.

---

# 22. Orphan-file assessment

## Proven orphan

No Production file was conclusively classified as safe-to-delete orphan.

## Suspected ambiguity

- legacy 33-sheet CRM in project root
- extra `RAW_Admin` native/imported artifact
- XLSX template snapshots
- duplicate version files

These may have historical/review value and must not be deleted based on name alone.

## Rule

Before deletion/archive:

`File ID → runtime reference → sheet/config reference → script property → mapping/log → human purpose`

must be resolved.

---

# 23. Impact on prior audit evidence

Because the 47-sheet canonical CRM was discovered as the correctly placed, recently modified core workbook:

The following prior conclusions must be revalidated:

- AUDIT-003 schema gaps
- AUDIT-004 formula/validation state
- AUDIT-005 Live RBAC table absence
- AUDIT-006 Live Workspace Mapping/Provisioning Settings absence
- AUDIT-007 Production Queue/Log/Mapping absence

Those conclusions accurately described the 33-sheet legacy workbook, but not the current 47-sheet core workbook.

Code-level defects and safe branch fixes from those audits remain valid.

This is now a mandatory correction to the audit evidence chain.

---

# 24. Required migration / correction sequence

1. Verify runtime `SPREADSHEET_ID` points to the 47-sheet core workbook.
2. Freeze the 33-sheet root workbook from further operational edits if it is legacy.
3. Re-run schema/formula/RBAC/provisioning checks against the 47-sheet workbook.
4. Dry-run `repairProvisioningSettingsV427_` on the 47-sheet workbook.
5. Replace LIVE IDs in Provisioning Settings with canonical RAW IDs after verification.
6. Remove public-link permission from `RAW_Admin.xlsx` after dependency check.
7. Complete Customer → Case Drive hierarchy for valid Case records.
8. Create release manifest for version artifacts.
9. Establish periodic backup + restore verification.
10. Only then archive/move legacy/duplicate artifacts.

---

# AUDIT-009 acceptance

**FAIL — Drive Production gate remains closed.**

## Passed

- top-level architecture exists
- system folders are correctly parented
- system folders are private
- canonical document root is configured consistently
- CUS-001 folder structure exists
- RAW/LIVE/Workspace separation exists
- four role Workspace folders exist
- canonical core workbook contains 47 sheets
- Workspace Mapping exists in canonical core workbook
- Audit staging artifacts were safely removed from root

## Blocking

1. CRITICAL source-of-truth split between 33-sheet root CRM and 47-sheet core CRM
2. CRITICAL canonical Provisioning Settings points to LIVE dashboards instead of RAW templates
3. CASE-001 Drive hierarchy not materialized
4. public-link RAW_Admin.xlsx snapshot
5. no proven periodic Production backup
6. duplicate/ambiguous version artifacts
7. runtime Script Property references not yet proven
8. prior Live-audit evidence must be revalidated against the 47-sheet core workbook

Next task: **AUDIT-010 — Telegram Audit**.
