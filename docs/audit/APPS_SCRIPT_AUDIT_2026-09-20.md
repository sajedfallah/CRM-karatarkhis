# AUDIT-008 — Apps Script Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`

## Executive result

**AUDIT-008 status: FAIL — runtime architecture is functional but carries substantial historical override debt and several operational safety gaps.**

No Production Apps Script deployment was changed.

Safe, regression-protected source fixes were applied only on `codex/full-system-audit`.

---

# 1. Runtime source inventory

Audited source:

`src/apps-script/Code.gs`

Current structural metrics:

- Lines: **12,440**
- Unique function names: **418**
- Function declarations: **499**
- Duplicate function names: **44**
- Duplicate declarations across those names: **125**
- Script/Cache/Properties/Trigger/Drive/Spreadsheet APIs are all used extensively
- Empty/swallowed catch blocks detected: **189**

This confirms that the file is a layered historical override stack rather than a clean single-definition runtime.

---

# 2. A-001 — Historical duplicate function override debt

Severity: **HIGH maintainability / regression risk**

44 function names are declared more than once.

Highest duplicate counts:

- `repairBotInstallation` — 12
- `installTelegramBot` — 12
- `syncWorkspaceDataV412_` — 7
- `doPost` — 5
- `provisionWorkspace` — 4
- `finishCreateWizard` — 3
- `handleUserSheetEdit` — 3
- `upsertWorkspaceMappingForUser_` — 3
- `getScopedWorkspaceDataV412_` — 3
- `syncAllActiveWorkspacesV412` — 3

JavaScript uses the final declaration, so duplicate definitions do not automatically mean the currently deployed behavior is broken.

However they create several risks:

- source ordering becomes security-sensitive
- partial copy/release can reactivate obsolete behavior
- code review can inspect the wrong version
- changes to an earlier declaration may have zero runtime effect
- cleanup/refactor can silently change behavior by changing order
- static grep cannot reliably describe active logic

## Safe mitigation applied

A regression guard now freezes duplicate-function debt at the audited baseline.

Commit:

`ba8e31bd9eefd8198a34bd1dda676700c60a79dc`

The test allows debt to decrease, but fails if duplicate count grows beyond the AUDIT-008 baseline.

## Consolidation policy

Do **not** bulk-delete historical overrides yet.

Consolidation must be performed family-by-family after equivalent runtime tests exist.

Priority families:

1. `doPost`
2. `repairBotInstallation` / `installTelegramBot`
3. `provisionWorkspace`
4. `processProvisioningQueue`
5. `getScopedWorkspaceDataV412_`
6. `syncWorkspaceDataV412_`
7. `syncAllActiveWorkspacesV412`
8. Workspace trigger installers
9. user-sheet provisioning/edit functions

---

# 3. A-002 — Destructive installer could reset triggers before schema preflight — FIXED

Severity before fix: **HIGH**

The final `repairBotInstallation()` previously did:

1. validate config
2. list triggers
3. remove **all** project triggers
4. rebuild runtime triggers
5. access canonical RBAC/Provisioning sheets

Live currently lacks several canonical sheets including Workspace Mapping and Provisioning tables.

Therefore running the installer against the current Live schema could remove working triggers and then fail partway through reconstruction.

## Remediation

Added:

`installerPreflightV430_()`

It verifies the presence of required runtime sheets before any destructive trigger mutation:

- Users
- مدیریت کاربران
- Permissions
- Workspace Mapping
- Provisioning Queue
- Provisioning Log
- Provisioning Settings

If prerequisites are missing:

- installer returns `blocked:true`
- no project trigger deletion occurs

Commit:

`43a7071687e74af54d82e5fb6b3c455d527ba585`

Regression guard:

`installer preflight blocks destructive trigger reset when canonical sheets are missing`

Commit:

`89cfd5d6355e3a7d6194d202a97cd3a2172585e4`

This is a major operational-safety improvement.

---

# 4. Trigger audit

Final active installer creates/recreates:

- user-sheet edit trigger
- provisioning worker trigger
- workspace sync trigger
- role-aware sheet triggers
- Telegram stats trigger

Helper installers generally remove same-handler duplicates before creating a new trigger.

Role Workspace trigger installer also filters by trigger source file ID before deleting per-workspace handlers.

## Positive

- same-handler duplicate cleanup exists
- role-workspace installer is source-ID aware
- time triggers are recreated deterministically
- explicit repair installer can normalize trigger topology

## Remaining risk

`removeAllProjectTriggers()` is intentionally global.

The new preflight protects against missing canonical sheets, but any future installer bug after the reset can still leave a partial topology.

### Required future hardening

Prefer transactional trigger migration where possible:

1. preflight
2. record expected topology
3. create/verify replacement triggers
4. remove obsolete triggers last

or provide an automatic rollback/reinstall path.

---

# 5. LockService audit

Locking is present around major mutating background paths including:

- user-sheet provisioning/edit paths
- provisioning queue worker
- workspace synchronization
- later V4.27/V4.29 worker overrides

Final `processProvisioningQueue` uses ScriptLock with bounded `tryLock`.

Final `syncAllActiveWorkspacesV412` also uses ScriptLock.

This reduces concurrent worker races.

## Remaining concern

Not every shared mutable path is protected by one central lock strategy.

Webhook update deduplication uses CacheService rather than a transactional lock.

Sheet/edit paths and background workers use separate historical lock patterns and timeouts.

Result: **PARTIAL PASS**.

---

# 6. A-003 — Telegram update deduplication is cache-based and non-atomic

Severity: **MEDIUM**

Webhook flow checks/marks duplicate Telegram updates through CacheService.

A cache `get` followed by `put` is not a transactional compare-and-set.

Two simultaneous deliveries of the same Telegram update could theoretically both pass the duplicate check before either write becomes visible.

No reproduced duplicate side effect was observed in this audit.

## Required remediation candidate

Use a narrowly scoped lock around only the duplicate-check/mark section, not the entire webhook handler, then release immediately.

This was not changed in AUDIT-008 because Telegram latency and concurrency behavior must be benchmarked before changing the webhook hot path.

---

# 7. Cache consistency audit

Fast dashboard stats use:

`KARATARHIS_FAST_STATS_V48`

with short-lived caching.

Explicit invalidation exists in multiple mutation/delete/edit paths through:

`clearFastCachesV413_()`

However cache invalidation is decentralized rather than being enforced by common write primitives.

## Risk

A new write path can forget to invalidate fast stats and expose stale dashboard data until TTL expiry.

Current TTL behavior limits the duration, but the architecture is easy to regress.

Severity: **MEDIUM/LOW**

## Recommended consolidation

Centralize cache invalidation around mutation helpers or introduce named domain invalidators.

---

# 8. Error handling audit

Detected approximately **189 empty/swallowed catch blocks**.

Many are intentional best-effort cleanup operations such as:

- trigger cleanup
- cache cleanup
- optional logging
- Drive permission removal
- UI formatting

But the volume is too high to distinguish operationally expected failure from hidden defects.

## Risk

- silent failure during permission cleanup
- hidden trigger-install problems
- incomplete cache/state cleanup
- difficult production diagnosis
- misleading `ok:true` results after partial operations

Severity: **MEDIUM/HIGH**

## Required remediation

Classify catches into:

1. expected/best-effort — may stay silent but must have comment/reason
2. recoverable — must add structured log
3. security/access — must fail closed or log high severity
4. state mutation — must never be silently ignored

Bulk conversion was not performed because it could materially change runtime behavior and log volume.

---

# 9. Secret audit — PASS for obvious secrets

Sensitive runtime values are read through Script Properties, including:

- BOT token
- admin Telegram identity
- webhook/relay secret
- Spreadsheet ID
- folder/template IDs
- internal API secret

Static workflow also scans for obvious Telegram bot-token patterns.

No raw Telegram bot token was identified in `Code.gs` during AUDIT-008.

---

# 10. A-004 — LIVE Dashboard IDs were hardcoded in Drive protection — FIXED

Severity before fix: **MEDIUM**

`protectedDriveIdsV413_()` directly contained four LIVE dashboard Google IDs.

The system already has:

`LIVE_DASHBOARDS`

property-based configuration.

Hardcoded protection IDs can drift when dashboards are replaced.

## Remediation

The final protected-ID function now derives LIVE IDs from:

`LIVE_DASHBOARDS`

using `parseDriveFileId_()`.

The function continues to protect:

- CRM Spreadsheet
- CRM root/document folders
- architecture folders
- role Workspace folders
- RAW templates
- LIVE dashboards

without embedding specific LIVE IDs in the active implementation.

Commit:

`43a7071687e74af54d82e5fb6b3c455d527ba585`

Regression guard added in:

`89cfd5d6355e3a7d6194d202a97cd3a2172585e4`

---

# 11. Drive / Spreadsheet scan performance

The source performs multiple full-table reads through helpers such as:

`readRows()`

which read from header+1 to `getLastRow()`.

This is acceptable for current small datasets but can become costly as:

- Tasks grow
- Logs grow
- Provisioning history grows
- Customer tasks/messages grow

There are also multiple Drive and Spreadsheet open calls in provisioning, sync and role preparation.

## Positive

- Workspace source snapshot caching exists for one sync cycle
- workspace sync is paged/round-robin in the final implementation
- provisioning worker has a bounded item limit
- caches exist for hot dashboard stats and headers

## Remaining risk

There is no explicit capacity threshold or query/index strategy for large Sheets.

Severity: **MEDIUM scalability risk**

---

# 12. Workspace synchronization performance — PASS with limits

Final `syncAllActiveWorkspacesV412(limit)`:

- caps limit at 50
- uses ScriptLock
- uses a round-robin cursor stored in Script Properties
- resets source snapshot once per run
- processes only the selected mapping page

This is substantially safer than scanning/syncing every Workspace in every run.

---

# 13. Provisioning worker performance — PASS with limits

Final `processProvisioningQueue(limit)`:

- caps worker batch at 10
- uses ScriptLock
- maintains heartbeat/stale recovery
- resets scoped source/identity caches once per batch

This is appropriate for Apps Script execution limits.

---

# 14. Webhook runtime path audit

Final `doPost()` has two authentication paths.

## Telegram relay path

Before handling callback/message payloads it calls:

`verifyRelayEnvelopeV427_()`

Rejected relay requests do not reach Telegram update handlers.

## Internal action path

`internal_action` bypasses relay-envelope validation and goes to:

`handleInternalActionV414_()`

That handler uses a separate internal API secret and workspace/actor scope checks.

This is an intentional separate trust channel, but it is security-sensitive.

### Recommendation

Keep the internal-action secret separate from Telegram relay secrets and add explicit regression tests that:

- missing secret rejects
- wrong secret rejects
- workspace mismatch rejects
- actor mismatch rejects

---

# 15. A-005 — Error details are returned from webhook catch

Severity: **LOW/MEDIUM**

The final `doPost()` catch logs the detailed stack/error and also returns the error message in JSON.

This can expose internal implementation text to callers that can reach the endpoint.

## Recommended hardening

Return a generic public error code such as:

`internal_error`

while retaining detailed server-side logging.

Not changed in this audit because relay/backend observability expectations should be verified first.

---

# 16. Dead code / legacy override assessment

A large proportion of the 125 duplicate declarations are historical dead implementations shadowed by later versions.

They should be considered **legacy runtime source debt**, not documentation.

Safe consolidation candidates are functions where:

- the last implementation has regression coverage
- earlier implementations have no unique externally referenced helper
- no string-based trigger references point to an older function name
- deployment is tested after deletion

Highest-value consolidation target is the installer/provisioning/workspace stack, because behavior there is already covered by audit tests.

Do not consolidate `doPost` first without webhook and internal-action E2E.

---

# 17. Static validation workflow audit

Current GitHub workflow performs:

- Node syntax check for Apps Script
- obvious Telegram token detection
- required docs check
- duplicate function reporting
- V4.27 behavior regression tests
- audit regression tests
- Telegram relay syntax check
- relay structure check

## Gap

Duplicate declarations are only reported, not failed.

AUDIT-008 added an explicit Node regression test that fails if duplicate-function debt grows above the current baseline.

This allows gradual reduction without forcing a risky one-shot cleanup.

---

# 18. CI evidence gap

For the latest AUDIT-008 commit, GitHub connector returned no GitHub Actions workflow run.

The only visible external status was Vercel failure pointing to:

`build-rate-limit / upgradeToPro`

This is not evidence of a JavaScript regression.

However absence of a visible Static Validation run means the final audit cannot claim CI-green evidence for this commit.

Required before merge:

- successful Static validation workflow
- Node syntax check
- V4.27 behavior tests
- audit regression tests

---

# 19. Safe fixes completed in AUDIT-008

### Installer safety

Added schema preflight before destructive trigger reset.

Commits:

- `43a7071687e74af54d82e5fb6b3c455d527ba585`
- `89cfd5d6355e3a7d6194d202a97cd3a2172585e4`

### Drive protection configuration

Removed hardcoded LIVE Dashboard IDs from active protected-ID implementation; derive from runtime configuration.

Same commits above.

### Duplicate debt regression guard

Added audited duplicate baseline guard.

Commit:

- `ba8e31bd9eefd8198a34bd1dda676700c60a79dc`

No Production deployment was modified.

---

# AUDIT-008 acceptance

**FAIL — Apps Script production gate remains closed.**

## Passed / improved

- no obvious hardcoded Telegram secret in Code.gs
- critical runtime IDs primarily property-driven
- final Telegram relay path is signed
- provisioning and workspace workers use bounded locks/batches
- workspace sync uses round-robin cursor
- installer now fails closed before destructive trigger mutation
- LIVE Dashboard protection no longer depends on hardcoded IDs
- duplicate override debt cannot grow silently

## Remaining blockers

1. 44 duplicate function names / 125 duplicate declarations
2. 189 swallowed catches require classification
3. installer trigger reset is still globally destructive after preflight
4. Telegram dedup cache check is not atomic
5. cache invalidation remains decentralized
6. internal-action path requires dedicated security regression coverage
7. webhook returns internal error text
8. high-volume Sheet scalability is not proven
9. duplicate override consolidation not yet executed
10. successful Static Validation CI evidence is missing for latest commit
11. bound Apps Script runtime E2E remains pending

Next task: **AUDIT-009 — Drive Architecture Audit**.
