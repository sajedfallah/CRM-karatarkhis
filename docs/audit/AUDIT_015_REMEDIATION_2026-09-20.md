# AUDIT-015-REMEDIATION — Production Readiness Blocker Closure

Date: 2026-09-20  
Branch: `codex/full-system-audit`

## Decision

**PARTIAL PASS — remediation materially closed multiple Critical/High gates, but final merge remains blocked.**

The branch must **not** merge to `main` yet because several runtime/security gates require capabilities or isolated credentials not available in this execution context.

## Closed gates

### 1. Canonical Provisioning Settings → RAW templates — CLOSED

A pre-change backup of the canonical CRM was created first:

- Backup: `1cZ4m-9Y2Dpwf2LaOR523BooLcB0Ho0Yx4PcAEZXTZcU`
- Audit folder: `1q6d6sV3sIiPmOkH_zbGmDo8AeSwcG-ca`

The live canonical `Provisioning Settings` table was migrated from LIVE dashboard IDs to verified private native RAW templates:

- Internal Employee → `1vVrrUZDApL3br29JWU8nAfYEajyx83ztgSF1KdFdIvc`
- Customer Manager → `1uHmv-4QotaXY8jDJgyXsip-EHEGBiaGliKLRCMacc_s`
- Customer Employee → `18Blwx4-WDXjVyCOR6fcFDllqXUAAVBUcygu5xbN8U_M`
- Admin → `1CK614Ai1F3VzyK-4d9FxmtL96jkMXmu5KVHue3-lGjo`

Post-write re-read confirms all four canonical IDs.

The repair function was also hardened: it now converges noncanonical nonblank values to `DASHBOARD_TEMPLATES[role]`, validates the expected file is a native Google Sheet, and remains dry-run by default.

Code commit: `ebf5fb7f2b4f97a4bff1490b463e7a0a225bfe04`

### 2. Four-role isolated staging topology — CLOSED as data/isolation simulation

Created isolated staging CRM:

`1J4PfWS_wuyhu_OxGvcO0OMhOlx7B2zQYiDiaaqd5tlM`

Created private RAW-template copies for:

- Admin
- Internal Employee
- Customer Manager A
- Customer Employee A
- Customer Manager B

Synthetic staging identities, permissions, two customers, two cases, tasks and customer tasks were created only in staging.

Cross-customer visibility evidence from the staged workspaces:

| Workspace | Customer A | Customer B |
|---|---:|---:|
| Admin | visible | visible |
| Internal Employee assigned to A | visible | hidden |
| Customer Manager A | visible | hidden |
| Customer Employee A | visible | hidden |
| Customer Manager B | hidden | visible |

This closes the **data-level cross-tenant isolation simulation**.

It does **not** claim that Apps Script runtime provisioning executed these copies; that runtime gate is separately listed below.

### 3. Backup + restore drill — CLOSED

A pre-remediation canonical backup was copied into isolated staging as:

`1oBk_J8WpfrMFSwKSRQNRLDWwXn667Xwi5aQfw7Nn5oQ`

Critical ranges were compared between backup and restored copy:

- Users — equal
- Permissions — equal
- Provisioning Settings — equal
- Workspace Mapping — equal
- Settings — equal

This proves Drive-level copy/restore integrity for the audited critical tables.

### 4. Destructive recovery drill — CLOSED for synthetic Sheet record

A pre-destructive staging snapshot was created:

`1xftMxzEh8aaaMmGuBY4RPl6564mf-k8YWadKjFBY5yQ`

Synthetic task `STG-TASK-B` was deleted from the staging CRM only.

Verification showed 0 matching rows after deletion.

The task was restored from the recorded synthetic source state.

Verification showed exactly 1 matching row after restoration.

No Production row/file was deleted.

### 5. Proactive reminder/escalation implementation — CODE GATE CLOSED

Added V4.30 proactive worker covering:

- overdue Tasks
- stale Leads
- unanswered Customer Tasks
- reminder thresholds from canonical Settings
- escalation thresholds
- user/Telegram recipient resolution
- durable per-record/per-level idempotency keys
- ScriptLock
- dry-run default
- explicit `RELEASE_REMINDERS_ENABLED=true` delivery gate
- explicit live wrapper for time-driven trigger
- 15-minute trigger installer blocked unless release flag is enabled

No Telegram message was sent during remediation.

Code commit: `ebf5fb7f2b4f97a4bff1490b463e7a0a225bfe04`

Live-wrapper correction: `e7fe6d38be6ad8bec0671feafb7f285fe7a59317`

Regression commits:

- `adad02eba0a769cfbaaa974d906343352acdca2f`
- `772cb4e3a8f2870322799414afd424398fb53738`
- `4788a11c16d9cb31ffe500ce9b1cd4ca8f846a40`

### 6. CI — CLOSED

GitHub Actions Static validation run:

`35533538036` / run #186

Result: **SUCCESS**

Evidence:

- JavaScript syntax PASS
- current-tree token gate PASS
- Git-history secret gate PASS
- engineering docs PASS
- V4.29 behavioral regression tests: **17 PASS**
- Audit regression tests: **48/48 PASS**
- Telegram relay syntax PASS
- Vercel relay structure PASS

## Remaining release blockers

### B-01 — RAW_Admin.xlsx public permission — HIGH / OPEN

Dependency scan found no repository reference to:

- file ID `15Aun9z6YXx7Ij19L9V2Z6tXCbG_zWNOC`
- filename `RAW_Admin.xlsx`

All four canonical native RAW templates are owner-only/private.

However the XLSX snapshot still has:

`anyone → reader`

The connected Drive action set exposes permission grant/read operations but no permission-revocation action. Therefore the broad permission could not be safely removed here without deleting/replacing the file, which was intentionally avoided.

**Required external/manual action:** remove the Anyone-with-link permission from that XLSX, then re-read metadata and record evidence.

### B-02 — Actual Apps Script four-role provisioning runtime — CRITICAL / OPEN

The staging topology proves template copyability and role data isolation, but this execution context cannot invoke the bound Apps Script runtime against a staging `SPREADSHEET_ID`.

Required runtime evidence:

- queue
- private makeCopy
- persisted Workspace identity
- sanitize
- scoped sync
- share-after-sync
- retry/reuse
- revoke
- mapping/log updates

for all four roles.

### B-03 — Real Telegram staging callback E2E — HIGH / OPEN

No isolated staging Telegram bot/identity and webhook configuration was available.

Source and CI are green, but a real:

Telegram → Vercel relay → signed Apps Script envelope → RBAC → callback ACK/navigation

round trip remains required.

No Production user was messaged.

### B-04 — Reminder delivery runtime E2E — HIGH / OPEN

The proactive worker is implemented and CI-covered, but delivery remains intentionally disabled unless:

`RELEASE_REMINDERS_ENABLED=true`

A staging Apps Script + staging Telegram bot is required to prove actual scheduled delivery, idempotency and escalation.

### B-05 — Credential / break-glass release action — HIGH / OPEN

No secret value was printed or changed.

The previously exposed Telegram bot token remains a release blocker until rotated through the authorized operational channel.

Break-glass `ADMIN_TELEGRAM_ID` ownership and Script Property editor access must be reviewed at release time.

### B-06 — Deployed Apps Script revision pin — HIGH / OPEN

Repository source and CI identify the approved remediation head, but the connected tools do not expose Apps Script deployment/version management.

The deployed web-app revision must be pinned to the approved release commit/version and verified before merge.

## Template privacy evidence

Verified private native RAW templates:

- `RAW_Admin`
- `RAW_Internal_Employee`
- `RAW_Customer_Manager`
- `RAW_Customer_Employee`

All are owner-only/private.

Only the legacy/export `RAW_Admin.xlsx` remains broadly readable.

## Final gate matrix

| Gate | Status |
|---|---|
| Canonical RAW Provisioning Settings | PASS |
| Canonical backup before migration | PASS |
| Four-role staging topology | PASS |
| Cross-customer staged data isolation | PASS |
| Backup/restore drill | PASS |
| Synthetic destructive recovery drill | PASS |
| Reminder/escalation implementation | PASS code/CI |
| Full CI | PASS — 48/48 audit |
| Native RAW template privacy | PASS |
| RAW_Admin.xlsx broad permission removal | **OPEN** |
| Apps Script four-role runtime provisioning | **OPEN** |
| Telegram real staging callback E2E | **OPEN** |
| Reminder real staging delivery E2E | **OPEN** |
| Credential rotation/break-glass release review | **OPEN** |
| Deployed Apps Script immutable revision pin | **OPEN** |
| Merge to main | **BLOCKED** |

## Merge decision

**DO NOT MERGE.**

AUDIT-015 final PR/migration package can only proceed after the six open runtime/security gates above have direct evidence.
