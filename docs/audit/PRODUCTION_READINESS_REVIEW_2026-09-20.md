# AUDIT-014 — Production Readiness Review

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Executable source baseline: `V4.28-2026-09-19`  
Canonical CRM: `CRM | ترخیص یزد | V1.5 | 2026-09-17`  
Canonical Spreadsheet ID: `1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

## Release decision

# **NO-GO**

The branch is materially more stable than the original baseline and current CI is green, but the system does **not** meet the release gate required by Issue #2. AUDIT-015 must not merge this branch to `main` until the Critical/High blockers below are remediated and revalidated.

No Production data, permissions, credentials, webhook configuration, or deployment was modified by AUDIT-014.

## Current verified baseline

- Audit branch: **82 commits ahead / 0 behind main** before this report commit.
- Latest observed Static validation: **SUCCESS**.
- AUDIT-013 regression suite: **36/36 PASS**.
- Canonical CRM is the 47-sheet workbook, not the legacy 33-sheet root workbook.
- Canonical workbook itself is owner-only/private.
- Vercel Telegram relay has READY Production deployments.
- Existing Internal Employee workspaces are narrowly shared and fail closed for unassigned `CASE-001`.
- Existing historical provisioning retry/recovery reached DONE.
- No confirmed active secret is embedded in current Apps Script source.

## GO / NO-GO matrix

| Release gate | Status | Severity | Evidence / reason |
|---|---|---:|---|
| Canonical 47-sheet source of truth | GO | — | Canonical workbook revalidated; owner-only/private |
| Branch synchronization | GO | — | Audit branch 0 behind main |
| Static/behavioral CI | GO | — | Latest observed Static validation SUCCESS; audit tests 36/36 |
| Current-tree secret hygiene | GO with governance | — | Secrets loaded from Script Properties/env; history scanner passes in current CI |
| Core Internal Employee scope isolation | GO | — | Existing workspaces do not expose unassigned case |
| Four-role runtime RBAC isolation | **NO-GO** | **CRITICAL** | Admin/Customer Manager/Customer Employee staging identities and runtime evidence absent |
| RAW-template provisioning configuration | **NO-GO** | **CRITICAL** | Canonical Provisioning Settings still points all roles to LIVE dashboard IDs |
| Current V4.28 four-role provisioning E2E | **NO-GO** | **CRITICAL** | Not executed against isolated staging identities |
| Customer cross-tenant isolation | **NO-GO** | **CRITICAL** | No Customer Manager/Employee runtime cross-customer test |
| Proactive reminder/escalation engine | **NO-GO** | **HIGH** | Settings/schema exist but proactive sender/worker implementation is absent |
| Telegram runtime webhook/callback E2E | **NO-GO** | **HIGH** | Relay design/CI passes; isolated real callback round-trip not demonstrated |
| Template privacy | **NO-GO** | **HIGH** | `RAW_Admin.xlsx` remains `anyone:reader` |
| Backup + restore drill | **NO-GO** | **HIGH** | No proven periodic Production backup and restore exercise |
| Destructive rollback/recovery | **NO-GO** | **HIGH** | Guards pass tests; actual recovery from destructive operation unproven |
| Credential release readiness | **NO-GO** | **HIGH** | Break-glass/admin governance and release-time secret verification/rotation plan not executed |
| Apps Script duplicate override debt | Conditional | MEDIUM | Audited baseline remains large; regression prevents growth but consolidation incomplete |
| Telegram update-id concurrency | Conditional | MEDIUM | Cache get/put idempotency remains non-atomic |
| Admin destructive actor attribution | Conditional | MEDIUM | Sheet admin logging still uses generic `SHEET_ADMIN` in some paths |
| Production deployment alignment | **NO-GO** | **HIGH** | Source V4.28 is verified in branch; deployed Apps Script runtime version has not been independently proven |
| Migration/rollback package | Pending | HIGH | Must be finalized only after blockers close in AUDIT-015 |

## Critical blockers

### C-01 — Provisioning Settings uses LIVE dashboard IDs

Live canonical table currently maps:

- Internal Employee → LIVE Internal Employee dashboard
- Customer Manager → LIVE Customer Manager dashboard
- Customer Employee → LIVE Customer Employee dashboard
- Admin → LIVE Admin dashboard

This conflicts with the intended provisioning contract:

`RAW template → private copy → sanitize → scoped sync → share`

The executable code uses Script Property-backed `DASHBOARD_TEMPLATES`, and the repair function defaults to dry-run, but the canonical configuration remains inconsistent.

**Required before release:** verify all four canonical RAW native template IDs, dry-run the repair, capture diff, apply approved migration, re-read the table, and execute provisioning regression/E2E.

### C-02 — Four-role RBAC runtime proof missing

Canonical Users currently contains only two active Internal Employee users. There is no safe canonical test identity for:

- Admin
- Customer Manager
- Customer Employee

Static controls are not a substitute for runtime tenant isolation.

**Required before release:** create isolated staging-only identities/data for all four roles outside Production customer data, provision workspaces, validate positive and negative visibility matrices, then remove/archive staging artifacts.

### C-03 — Customer cross-tenant isolation unproven

Customer roles depend on exact `Customer ID` scope. No runtime test has proven Customer A cannot read/edit Customer B records through Workspace and Telegram paths.

**Required before release:** two synthetic customers minimum, with manager/employee identities for negative isolation testing.

### C-04 — Current V4.28 provisioning not exercised end-to-end

Historical provisioning evidence is from V4.13–V4.15.

**Required before release:** execute a V4.28 staging provisioning transaction for each role and prove copy, sanitize, sync, share, retry and revoke behavior.

## High blockers

### H-01 — Proactive reminder/escalation delivery is missing

The canonical Settings table defines lead/task/customer-task reminder and escalation thresholds. Active Apps Script source exposes on-demand alert views, but no proactive reminder/escalation sender/worker was found.

**Required:** implement scheduled worker(s), idempotency, escalation state updates, recipient scoping, retry/error logging, and staging Telegram tests.

### H-02 — Telegram runtime E2E is incomplete

Relay/HMAC/auth/navigation contracts pass CI, and Vercel deployments are READY. Actual Telegram webhook state and isolated callback round-trip are not proven.

**Required:** use staging Telegram identity/bot or an explicitly isolated test route; validate webhook, relay signature, role auth, navigation, duplicate update, timeout/retry, and latency without messaging Production users.

### H-03 — Public RAW_Admin.xlsx artifact

Drive revalidation still shows:

`RAW_Admin.xlsx → anyone:reader`

The canonical native `RAW_Admin` is private.

**Required:** confirm no dependency uses the XLSX public link, remove broad permission, and verify owner-only/private result.

### H-04 — Backup/restore readiness unproven

Archive structure exists, but no periodic Production backup + restore drill is evidenced.

**Required:** define backup cadence/retention, produce a dated backup manifest, restore into isolated staging, compare schema/critical rows/configuration, document RPO/RTO and restore steps.

### H-05 — Destructive recovery unproven

Delete protections are tested, but a rollback from an actual synthetic destructive operation has not been demonstrated.

**Required:** execute delete/restore only on staging synthetic records/files; prove System Log evidence and recovery.

### H-06 — Credential/release governance incomplete

Current source does not expose confirmed active credentials, but release readiness still requires:

- verify Script Property names and presence without printing values
- verify Vercel env presence without printing values
- review break-glass admin ownership
- document emergency rotation order
- rotate only credentials with confirmed exposure or per approved release policy
- re-register webhook after Telegram secret/token changes when applicable

No credential was changed in this audit.

### H-07 — Runtime deployment version not independently pinned

The branch source identifies V4.28, but this does not prove the currently deployed Apps Script web app is executing that exact source revision.

**Required:** deploy/identify an immutable release version after gates pass and capture runtime version evidence.

## Medium blockers / accepted technical debt candidates

### M-01 — Duplicate Apps Script overrides

The audited source still carries substantial duplicate function-declaration debt. Regression tests prevent growth, but consolidation is incomplete.

Release may proceed only if no duplicate changes execution semantics and the final test suite remains green; otherwise consolidate before release.

### M-02 — Telegram update-id deduplication

Update-id deduplication uses CacheService get/put and is not transactional.

Before scale-up, move to a lock/transaction-backed idempotency strategy or document the residual duplicate-processing risk.

### M-03 — Admin destructive actor identity

Some Sheet-admin destructive logs use generic `SHEET_ADMIN` rather than stable canonical actor identity.

Improve attribution when Apps Script session identity is available.

## Exact remediation sequence before AUDIT-015

1. **Freeze release inputs.** Keep `main` unchanged; record current audit branch head and canonical workbook ID.
2. **Create isolated E2E staging topology.** Use synthetic customers/cases/tasks and four role identities; no Production users.
3. **Verify RAW native templates.** Confirm IDs, role folder destinations, privacy and schema.
4. **Repair Provisioning Settings safely.** Run dry-run first; compare LIVE IDs → RAW IDs; apply only after approval/evidence; re-read values.
5. **Run V4.28 four-role provisioning E2E.** Verify private copy before share, sanitize, scoped sync, permissions, retry, revoke and deterministic reuse.
6. **Run RBAC matrix.** Admin, Internal Employee, Customer Manager, Customer Employee; positive and negative tests; include two-customer cross-tenant isolation.
7. **Close template exposure.** Remove `anyone:reader` from `RAW_Admin.xlsx` after dependency check; verify no broad permission remains.
8. **Implement proactive reminder/escalation worker.** Add idempotency, scheduling, scope-safe recipients, retries, logging and regression tests.
9. **Run isolated Telegram E2E.** Verify webhook state, relay HMAC, callback ACK/navigation, all four roles, duplicate update handling, retry and latency.
10. **Run destructive staging drill.** Synthetic delete/cascade, audit log, Drive trash behavior and recovery.
11. **Run backup/restore drill.** Backup canonical configuration/data to protected archive, restore to staging, compare integrity, document RPO/RTO.
12. **Complete credential release checklist.** Verify presence/ownership without exposing values; execute approved rotation only where required; verify webhook after any rotation.
13. **Pin deployed Apps Script release.** Capture immutable deployment/version evidence matching approved commit.
14. **Re-run full CI and live staging E2E.** Require zero Critical/High failures.
15. **Produce release manifest.** Exact commit SHAs, Apps Script deployment version, CRM ID, RAW template IDs, Vercel deployment, migration actions, rollback points and known accepted Medium risks.
16. Only then execute **AUDIT-015 Final PR + Migration/Rollback Package**.

## Required AUDIT-015 entry criteria

AUDIT-015 may prepare the final merge package only when all of the following are true:

- zero open Critical blockers
- zero open High blockers
- four-role E2E PASS
- cross-customer isolation PASS
- current-version provisioning PASS
- proactive reminder/escalation PASS
- Telegram runtime E2E PASS
- RAW template privacy PASS
- backup/restore PASS
- destructive staging recovery PASS
- CI PASS
- runtime deployment revision pinned
- credential checklist complete
- migration and rollback evidence complete

## Final AUDIT-014 decision

**NO-GO for Production merge/release.**

The system has a green executable regression baseline and several strong fail-closed controls, but the remaining blockers are release-significant rather than cosmetic. The next implementation stage must close these gates before any final merge package is approved.
