# AUDIT-007 — Provisioning Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`

## Executive result

**AUDIT-007 status: FAIL — core provisioning flow is substantially hardened, but Production cannot be approved until runtime E2E and access-transaction edge cases are closed.**

No Production user or Production Workspace was created, modified, shared or revoked.

A dedicated staging sandbox was created:

- Folder: `STAGING AUDIT-007 Provisioning E2E 2026-09-20`
- Staging control workbook: `STAGING AUDIT-004 | CRM ترخیص یزد | 2026-09-20`

---

# 1. Provisioning control tables

Staging now contains the canonical control tables needed for provisioning audit:

- Provisioning Settings
- Provisioning Queue
- Provisioning Log
- Workspace Mapping
- Users
- Permissions
- مدیریت کاربران
- Dashboard Registry

Production Live still lacks several of these tables and remains blocked.

---

# 2. Template selection — PASS in code

Provisioning resolves role templates from:

`DASHBOARD_TEMPLATES`

and not from `LIVE_DASHBOARDS`.

Canonical role templates are:

- مدیر → `1Zt890HbsaHUS20ldmzWSrH0rRIEAuDgpavr8dqxxHBw`
- کارمند داخلی → `1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0`
- مدیر مشتری → `1m_Ao7XQMVlhhsMx4AR82b60GCK0XHKXhTW_S5BxKIAI`
- کارمند مشتری → `1eesSiyEhUr4qJkp4rK3qtRnt3w3X0yXH08dfZ08cXiE`

AUDIT-006 already added a regression guard preventing LIVE dashboard use as a provisioning source.

---

# 3. Persistence-before-sync — PASS in code

The final worker sequence is:

1. create/recover Workspace
2. persist Workspace File ID + URL in Provisioning Queue
3. log WORKSPACE_CREATED
4. sanitize
5. scoped sync
6. reconcile/share Drive access
7. update Users / UI
8. upsert Workspace Mapping
9. mark request DONE

This provides a deterministic recovery point before sync.

Existing regression coverage verifies that Workspace identity is persisted before `syncWorkspaceDataV412_`.

---

# 4. Share-after-sync — PASS in code and staging Drive behavior

The final `provisionWorkspace()` returns a private copy and performs no `addEditor` / `addViewer`.

Drive sharing happens only in:

`reconcileWorkspaceAccessV427_`

after sanitize + scoped sync.

## Staging evidence

Four synthetic role Workspaces were copied from the four canonical RAW templates into a dedicated staging folder.

Each staging copy was verified immediately after creation:

- owner-only permission
- `shared = false`
- no domain / anyone permission

This reproduces the intended private-copy stage for all four roles.

No staging synthetic Workspace was shared to an external test principal.

---

# 5. Four-role staging provisioning evidence

Synthetic staging Workspaces were created for:

- Admin
- Internal Employee
- Customer Manager
- Customer Employee

All four copies use deterministic Workspace naming with synthetic User IDs.

Synthetic Queue, Log and Mapping rows were written only to the staging control workbook and clearly marked as AUDIT-007 staging evidence.

No real employee/customer identity or Gmail address was copied into those synthetic records.

This validates:

- canonical template resolution
- role-specific source selection
- private-copy creation
- Workspace File ID persistence model
- Queue/Log/Mapping schema compatibility

## Limitation

The available connector can manipulate Drive/Sheets but cannot execute the bound Apps Script runtime itself.

Therefore this is a **staging structural/provisioning E2E through the private-copy/persistence stage**, not a full live Apps Script worker execution.

A full runtime E2E remains mandatory before Production approval.

---

# 6. Deterministic copy recovery — PASS in code

The final provisioning implementation uses:

`findWorkspaceCopyByDeterministicNameV428_`

before `makeCopy()`.

Workspace name includes:

- role
- full name
- User ID

This specifically closes the crash window:

`makeCopy() → process crash → Queue not yet patched`

A retry searches for the exact deterministic name and reuses the existing file instead of blindly creating another copy.

Existing regression coverage verifies this behavior statically.

---

# 7. P-001 — Open-request duplicate prevention incomplete — FIXED

Severity before fix: **MEDIUM/HIGH**

Before AUDIT-007:

`findOpenProvisioningRequestV412_`

treated only these states as open:

- در صف
- در حال پردازش

But the recovery worker recognizes additional in-progress states:

- در حال ساخت
- Workspace ساخته شد

Therefore a new enqueue during one of those states could create a second Request row, even though the deterministic Workspace file itself might still be reused.

## Remediation applied

Open-request detection now includes:

- در صف
- در حال پردازش
- در حال ساخت
- Workspace ساخته شد

Commits:

- `3d9a7a49d89a540cc1ba63ada445e270f042d3e3`
- `1d2f1477f6c6eb7225192d982f5797ab08fab93b`

This prevents duplicate provisioning requests during recoverable in-progress states.

---

# 8. Stale worker recovery — PASS in code

`provisioningQueueCandidatesV427_` processes:

- `در صف` immediately
- stale `در حال پردازش`
- stale `در حال ساخت`
- stale `Workspace ساخته شد`

Staleness is determined using a Script Properties heartbeat.

This prevents a permanently stuck queue row after process death.

Regression coverage added for these recovery states.

---

# 9. Retry behavior — PASS with manual retry boundary

Failed rows are set to:

`خطا`

They are intentionally not auto-retried by the normal queue candidate selector.

Explicit helper:

`retryFailedProvisioningV412()`

changes failed rows back to:

`در صف`

and preserves the Queue record for deterministic recovery.

This is safer than unbounded automatic retries.

Regression coverage added for:

- failed → queued reset
- stale recovery state eligibility
- preservation of Workspace identity in failure paths

Commit:

`c99eb414c8d37709759b9b404a1e901c9b4f2647`

---

# 10. Failure persistence — PASS in code

If an exception occurs after a Workspace object exists, the error handler preserves:

- Workspace File ID
- Workspace URL
- error detail

in the Queue row.

On retry, `recoverWorkspaceForRequestV427_` prefers request-owned File ID / URL before other mapping sources.

This supports recovery without creating a new file.

---

# 11. Failure injection coverage — PARTIAL

Static failure paths are present and regression guards now verify:

- Workspace ID/URL preservation
- error → retry reset
- stale recovery status handling

A real Apps Script exception-injection run was not executed because the available Drive connector cannot invoke the bound Apps Script worker.

Required runtime scenarios for later E2E:

1. fail immediately after makeCopy
2. fail after Queue Workspace ID persistence
3. fail during sanitize
4. fail during scoped sync
5. fail during addEditor
6. fail after share but before Mapping update
7. retry each case and verify one Workspace only

Production must remain blocked until these are executed in a runtime staging deployment.

---

# 12. Gmail change behavior — PASS in normal mapped flow

`reconcileWorkspaceAccessV427_` reads:

- previous shared Gmail from Workspace Mapping
- desired Gmail from current User

If they differ:

- previous email is revoked
- desired email is added

This is the correct normal-state rotation model.

---

# 13. Inactive-user access removal — PASS in code

For inactive Users:

`reconcileWorkspaceAccessV427_`

removes mapped/current principals and does not share the file.

Dedicated request type:

`غیرفعال‌سازی دسترسی`

calls:

`revokeWorkspaceAccessForUserV427_`

and updates:

- Workspace Mapping status
- Users Google Access
- UI Provisioning state

This is a reasonable revocation path.

---

# 14. P-002 — Share-before-Mapping failure window

Severity: **HIGH**

Current order is:

1. sync succeeds
2. Drive editor is added
3. Users records updated
4. Workspace Mapping written

If the process crashes after successful sharing but before `Workspace Mapping` is written, the file may already be shared while the previous/shared Gmail is not durably recorded in Mapping.

On retry:

- request File ID can recover the Workspace
- current Gmail can be added again safely
- but if Gmail changed in the crash window, the old shared email may not be discoverable from Mapping because Mapping was never persisted

## Risk

Potential stale Drive access after a rare crash + Gmail-change combination.

## Required architectural remediation

Make access intent durable before external sharing.

Recommended design:

1. persist Workspace Mapping or pending-access record with desired/previous Gmail
2. perform Drive share/revoke
3. mark access reconciliation complete
4. only then finalize provisioning

Alternative: store previous/desired principal in Queue before share and make retry reconciliation derive from Queue + Mapping.

No automatic code change was made because this changes transaction semantics and requires failure-injection testing.

---

# 15. P-003 — Duplicate deterministic filenames already present

Severity: **MEDIUM**

`findWorkspaceCopyByDeterministicNameV428_` returns the first file returned by `getFilesByName()`.

If historical duplicate files with the same deterministic name already exist, the helper does not detect ambiguity.

Current observed role folders did not show duplicate current Workspace names.

## Required hardening

Before Production cutover:

- inventory exact duplicate deterministic names
- if >1 match, fail closed and require reconciliation rather than picking an arbitrary file

---

# 16. P-004 — Production Script Properties remain runtime dependency

Severity: **HIGH deployment gate**

Provisioning depends on Script Properties for:

- TEMPLATE_* IDs
- WORKSPACE_FOLDER_* IDs
- main Spreadsheet ID
- related runtime settings

The repository documents expected values and staging registry now mirrors them, but the actual deployed Script Property values have not been read/verified in this audit environment.

Production provisioning cannot be approved until deployed properties are compared against:

- canonical RAW template IDs
- canonical role Workspace folder IDs

---

# 17. Provisioning Settings audit

Staging `Provisioning Settings` contains all four roles and canonical template IDs.

The code includes:

`repairProvisioningSettingsV427_(dryRun)`

which compares each configured Template File ID to `DASHBOARD_TEMPLATES[role]`.

This is useful reconciliation logic.

Production still lacks the sheet, so this check cannot yet operate there.

---

# 18. Queue / Log audit

Canonical Queue schema and Log schema are represented in staging.

Queue includes:

- request identity
- user/customer context
- role/profile
- template identity
- status
- Workspace File ID / URL
- requester/time/error

Log includes:

- action
- old/new status
- Workspace identity
- Gmail
- actor/source/timestamp/details

This is sufficient for state transition evidence once runtime execution is enabled.

---

# 19. Production safety during AUDIT-007

The audit did **not**:

- create Production users
- create files in Production role Workspace folders
- share Production Workspaces
- revoke Production access
- change Production Queue/Log/Mapping
- modify canonical RAW templates

All new synthetic files are isolated under:

`STAGING AUDIT-007 Provisioning E2E 2026-09-20`

---

# AUDIT-007 acceptance

**FAIL — Production Provisioning gate remains closed.**

## Passed / improved

- canonical template selection
- private-copy provisioning model
- persistence-before-sync
- share-after-sync
- deterministic file-name recovery
- stale in-progress recovery
- explicit failed-request retry
- failure path preserves Workspace identity
- inactive-user revocation logic
- Gmail rotation logic in normal mapped state
- duplicate Queue request defect fixed
- four-role private-copy staging evidence created
- Queue/Log/Mapping staging evidence created

## Remaining blockers

1. full bound Apps Script runtime E2E not yet executed
2. share-before-Mapping crash window
3. ambiguous pre-existing duplicate deterministic filenames not fail-closed
4. deployed Script Properties not runtime-verified
5. Production Provisioning Queue/Log/Settings/Mapping not materialized
6. Gmail-change + crash recovery not failure-injection tested
7. inactive-user revocation not exercised against synthetic shared staging principal
8. four-role scoped sync not runtime-executed
9. production Role folder/template mapping not runtime-asserted

Next task: **AUDIT-008 — Apps Script Audit**.
