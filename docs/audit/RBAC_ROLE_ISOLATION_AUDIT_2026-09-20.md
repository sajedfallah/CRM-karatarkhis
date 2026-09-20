# AUDIT-005 — RBAC & Role Isolation Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`

## Executive result

**AUDIT-005 status: FAIL — security hardening improved, but end-to-end RBAC cannot be approved.**

Production Google Sheet was not modified.

A staging copy is used for safe RBAC scaffolding:

- `STAGING AUDIT-004 | CRM ترخیص یزد | 2026-09-20`
- Spreadsheet ID: `1KzHAh9FySaRxGYDmWbAueznUd-4wW3EFPhnWWILCgs4`

Safe code hardening was committed only to `codex/full-system-audit`.

---

# 1. Live RBAC data-model status

The current Live workbook does **not** contain the canonical RBAC / workspace tables required by the current Apps Script:

- Users
- Permissions
- Workspace Mapping
- مدیریت کاربران
- Case Assignments
- Assignment History
- Assignment Policy
- Provisioning Queue
- Provisioning Log
- Provisioning Settings
- Dashboard Registry

This means the current repository code and the current live Spreadsheet schema are not yet aligned.

## Consequence

The following cannot be proven end-to-end on Live:

- User ID uniqueness
- Telegram identity → canonical User mapping
- permission profile enforcement
- role/profile consistency
- Customer scope enforcement
- Case assignment history
- Workspace mapping ownership
- workspace access revocation
- cross-customer isolation
- provisioning access lifecycle

---

# 2. Drive sharing status — PASS

The current main CRM file is not broadly shared.

Observed permission metadata:

- one owner permission
- no `anyone` permission
- no domain-wide permission
- no group-wide permission
- Drive reports `shared = false`

This is positive evidence that the central CRM file itself is not currently exposed through broad Drive sharing.

This does **not** prove Workspace isolation because role workspaces are not represented in the current Live `Workspace Mapping` table.

---

# 3. Exact identity matching — PASS after hardening

The final active implementation uses exact-token matching.

### Stable User ID

Stable IDs such as:

`USR-...`

are compared using exact equality.

Substring matching such as:

- `Ali` matching `Alireza`
- `USR-001` matching `USR-0012`

is rejected.

### Legacy full name

Legacy name matching is permitted only when the canonical Users directory is available and the name occurs exactly once.

### Telegram User ID

Telegram identity matching is permitted only when the canonical Users directory is available and that Telegram ID occurs exactly once.

### Hardening added during AUDIT-005

Before this audit, when the Users directory was unavailable, the code treated an unknown legacy name/Telegram ID as effectively unique.

This was changed to fail closed.

Commits:

- `c40f89e201d3aad3853dac59a205e06dc8dbc62f`
- `4104e13b34bb16d4bb98b0d248c1ec7b87412d49`

Regression guard added:

`legacy identity matching requires an available canonical Users directory`

---

# 4. Telegram authorization missing-sheet behavior — FIXED on audit branch

## Defect found

Severity: **CRITICAL**

`getTelegramUserContextV419_` reads:

- Users
- مدیریت کاربران
- Permissions

The Live workbook currently has none of these sheets.

`readRows()` calls `getSheet()`, and `getSheet()` throws when a sheet does not exist.

The previous Telegram authorization implementation did not catch missing user-source sheets.

Therefore a missing canonical RBAC table could produce a runtime exception rather than a deterministic deny.

## Remediation applied on audit branch

The authorization path now catches unavailable RBAC sources and returns:

- `rbac_source_unavailable`
- `permission_source_unavailable`

with:

`authorized:false`

This converts schema/configuration failure into fail-closed authorization behavior.

Commits:

- `c15fc0bef714273eb97540af0f65d4ae393bd9bc`
- `9a24ce0f8ed0f05d6dd061f34ded9a2317eabd2a`

Regression guard added:

`Telegram authorization fails closed when RBAC sheets are unavailable`

---

# 5. Telegram authorization policy — PASS in code / NOT PROVEN LIVE

For non-break-glass users, code requires:

1. Telegram ID match
2. User status = `فعال`
3. allowed role
4. non-empty User ID
5. active Permission row
6. Permission Role consistent with User Role

Role-specific scope:

### مدیر

Expected:

- Scope Type = `ALL`
- Scope ID = `*`

### کارمند داخلی

Expected:

- Scope Type = `ASSIGNED`
- Scope ID present / canonical target expected `OWN_ASSIGNMENTS`

### مدیر مشتری / کارمند مشتری

Expected:

- User Customer ID present
- Scope Type = `CUSTOMER`
- Permission Scope ID exactly equals User Customer ID

This is a sound fail-closed model in code.

However Live has no Users/Permissions rows, so actual production authorization cannot yet be certified.

---

# 6. R-001 — Break-glass Telegram admin bypass

Severity: **HIGH**

If incoming Telegram ID exactly equals Script Property:

`ADMIN_TELEGRAM_ID`

the function immediately returns an authorized administrator context.

This bypass does not require:

- Users row
- Permission row
- status check
- permission profile
- Customer scope

This may be intentional as a break-glass path, but it is outside canonical RBAC.

## Risk

A stale, incorrect or compromised `ADMIN_TELEGRAM_ID` grants full administrative Telegram access.

## Required controls

- keep property outside Git
- restrict who may edit Script Properties
- log every break-glass authorization
- document owner and recovery procedure
- optionally require a canonical admin User/Permission record after migration
- rotate/review the value during production cutover

No automatic change was applied because removing the bypass may lock out administrative recovery.

---

# 7. Customer role scoping — code is fail-closed, Live schema blocks operation

For:

- مدیر مشتری
- کارمند مشتری

`getScopedWorkspaceDataV412_` requires a non-empty User Customer ID.

Without it, all scoped collections are empty.

Customer scoping uses exact equality:

`record Customer ID === user Customer ID`

This is positive isolation behavior.

## Live blocker

The current `پرونده‌ها` sheet does not contain canonical `Customer ID`.

Therefore customer-role Case visibility cannot operate correctly against current Live data.

Current consequence is primarily **underexposure / empty scope**, not a proven cross-customer leak.

Production RBAC cannot be approved until Case → Customer ID migration is complete.

---

# 8. R-002 — Workspace scoped-data function does not independently enforce Permissions

Severity: **HIGH / architectural security blocker**

`getScopedWorkspaceDataV412_(user)` scopes data based on fields inside the supplied user object.

It does **not** independently verify:

- active Permission row
- Permission Profile
- permission Role
- Scope Type / Scope ID

In particular:

`role === مدیر → return full source snapshot`

Telegram reaches this logic after authorization checks, but Workspace provisioning/sync calls the function using user records directly.

Therefore the isolation boundary for Workspaces depends on upstream correctness of:

- user role
- provisioning queue
- workspace mapping
- caller discipline

rather than the scoped-data function enforcing canonical Permissions itself.

## Risk

A malformed or stale user record with an elevated role can cause over-scoped Workspace data if it reaches provisioning/sync.

## Required remediation

Before production:

- introduce a canonical authorization/scope resolver shared by Telegram and Workspace sync
- derive an effective scope from User + Permission
- reject inactive/missing/mismatched Permission
- pass only the resolved scope into data filtering
- add negative tests for forged/elevated user role objects

This was not auto-patched because it changes the central authorization architecture and provisioning behavior.

---

# 9. Internal employee scope

The final implementation filters:

- Cases by exact responsibility identity
- Customers by Customer IDs derived from assigned Cases
- Tasks by exact assignee or assigned Case
- Leads by exact assignee
- Customer Tasks by exact assignee or assigned Case
- Case Documents by assigned Case

This is substantially safer than historical substring matching.

## Remaining gap

Canonical `Case Assignments` does not exist in Live.

Current assignment authority is still embedded in Case textual fields:

- مسئول داخلی اصلی
- همکاران داخلی

This limits auditability and reassignment history.

---

# 10. R-003 — Identity directory depends on missing Users table

Severity before fix: **HIGH**

The uniqueness directory for:

- User ID
- Telegram ID
- full name

is sourced from the canonical `Users` sheet.

Live does not currently contain `Users`.

AUDIT-005 changed legacy-name and Telegram matching to require an available canonical identity directory.

Stable User ID exact matches remain allowed because they are authoritative identifiers.

This change is fail-closed and should be kept.

---

# 11. Personal Daily Task ownership — PASS in code

If a task source begins with:

`PERSONAL:`

ownership is based on exact:

`PERSONAL:<User ID>`

If no PERSONAL source is present, legacy owner fallback uses the hardened exact identity matcher.

This prevents substring-based personal-task ownership.

---

# 12. Workspace Drive access lifecycle — PASS in code / NOT PROVEN LIVE

`reconcileWorkspaceAccessV427_` implements:

- revoke previous email when Gmail changes
- revoke access for inactive user
- reject invalid email
- add editor only for active valid user
- persist/reconcile previous sharing identity through mapping

This is positive behavior.

However the current Live workbook has no `Workspace Mapping` table and no canonical role-workspace inventory.

Therefore real revoke/change-Gmail/cross-role access behavior is not yet proven end-to-end.

---

# 13. R-004 — Historical duplicate function overrides

Severity: **MEDIUM/HIGH maintenance risk**

`Code.gs` contains historical repeated definitions of critical functions including:

- `getScopedWorkspaceDataV412_`
- `syncWorkspaceDataV412_`

The final definition is the active JavaScript implementation and contains the hardened exact matching logic.

However security behavior depends on source ordering.

## Risk

A future refactor or partial copy can accidentally reactivate an older substring-scoping implementation.

## Required remediation

After regression coverage is complete:

- consolidate duplicate historical overrides
- keep exactly one authoritative implementation
- preserve tests before removing older blocks

Do not consolidate before regression coverage proves equivalent behavior.

---

# 14. Staging RBAC scaffold created

Safe staging-only remediation:

Created hidden sheets in the existing audit staging workbook:

### Users

Canonical 18-column header.

### Permissions

Canonical permission/scope header.

### Workspace Mapping

Canonical mapping/access lifecycle header.

### مدیریت کاربران

Header at row 4, compatible with `SHEETS.users.headerRow = 4`.

No real employee/customer identity data was copied into these sheets.

Purpose:

- allow later staging authorization/provisioning tests
- avoid testing against Production
- prepare synthetic role-isolation scenarios

Production workbook was not changed.

---

# 15. Current test evidence

Existing repository behavioral/static tests cover:

- substring identity rejection
- similar stable-ID rejection
- same-name legacy fail-closed
- personal-task exact ownership
- pending/inactive Telegram denial
- active permission requirement
- Customer scope requirements
- provisioning order before sharing
- signed Telegram relay checks

AUDIT-005 added guards for:

- missing RBAC source fail-closed
- missing Permission source fail-closed
- identity-directory unavailable fail-closed

Latest audit-branch Vercel status observed after hardening: **success**.

This is deployment/build evidence only; it is not a substitute for real four-role E2E tests.

---

# 16. Cross-customer / cross-role leakage verdict

## Proven direct leakage

**None observed in current evidence.**

## Can absence of leakage be certified?

**No.**

Reasons:

- Live has no canonical Users
- Live has no Permissions
- Live has no Workspace Mapping
- Live has no Case Assignments
- Live Cases lack Customer ID
- no four-role synthetic Workspace E2E has been executed
- scoped Workspace logic does not independently enforce Permission rows

Therefore the correct verdict is:

**No reproduced leak, but RBAC production isolation is not yet proven.**

---

# AUDIT-005 acceptance

**FAIL — production RBAC gate remains closed.**

## Security improvements completed

1. Missing RBAC tables now fail closed in Telegram authorization on audit branch.
2. Missing identity directory now fails closed for legacy name/Telegram matching.
3. Regression guards added.
4. Staging now has minimal canonical RBAC scaffolding.
5. Production Drive file broad-sharing check passed.

## Blocking work before approval

1. Materialize canonical RBAC sheets in staging and then Live through migration.
2. Add canonical User and Permission records for all four roles.
3. Add Case Customer ID.
4. Add Case Assignments / Assignment History.
5. Resolve Workspace Mapping and real role workspaces.
6. Make Workspace scope resolution enforce Permissions, not only User role.
7. Run four-role E2E:
   - Admin
   - Internal Employee
   - Customer Manager
   - Customer Employee
8. Prove:
   - no cross-customer visibility
   - no cross-role visibility
   - inactive user revocation
   - Gmail change revocation
   - permission mismatch denial
   - duplicate-name denial
   - forged role denial
9. Consolidate historical duplicate security-sensitive overrides only after regression tests are green.

Next task: **AUDIT-006 — Template & Workspace Audit**.
