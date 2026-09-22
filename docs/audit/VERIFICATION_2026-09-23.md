# Verification Follow-up — 2026-09-23

## Scope

Repository: `sajedfallah/CRM-karatarkhis`  
PR: #3  
Working branch: `codex/final-audit-handoff-2026-09-19`  
Audit baseline: `30db3d26852f4145a91dcb2f47b2411bf5fb6f46`

This document verifies the remediation status of the issues reported against the audit baseline. It does **not** approve Production release.

## Current branch delta

The working branch is 45 commits ahead of audit commit `30db3d...` and contains the V4.28 remediation chain, behavioral regression tests, Relay backend, Vercel configuration, staging/deployment instructions, and later role/style work.

## Finding status

| ID | Finding | Current status | Verification |
|---|---|---|---|
| A | substring-based user isolation | FIXED IN SOURCE + OFFLINE TESTS | `getScopedWorkspaceDataV412_` uses `assignmentFieldMatchesUserV427_` → exact identity helper; same-name and similar-ID negative tests exist |
| B | unauthenticated Telegram webhook ingress | FIXED IN SOURCE + OFFLINE TESTS | Apps Script validates signed Relay envelope before Telegram handlers; Relay validates Telegram secret header and signs timestamp/nonce/update |
| C | pending Telegram user authorized | FIXED IN SOURCE + OFFLINE TESTS | authorization is fail-closed and requires explicit `فعال` status plus valid role/scope |
| D | stale Google Drive access after Gmail/status change | FIXED IN SOURCE; LIVE STAGING TEST PENDING | `reconcileWorkspaceAccessV427_` revokes old/disabled principals and applies current Gmail |
| E | non-idempotent Workspace provisioning | FIXED IN SOURCE + OFFLINE TESTS; FAILURE-INJECTION STAGING PENDING | Workspace identity is persisted before sync; deterministic copy recovery prevents duplicate copy after crash-window |
| F | stale daily-task overwrite | FIXED IN SOURCE + OFFLINE TESTS; CONCURRENCY STAGING PENDING | baseline hashes and `resolveDailyTaskConflictV427_` detect concurrent edits and preserve conflict |
| G | mappings after first 20 never synced | FIXED IN SOURCE + OFFLINE TESTS | `selectMappingsRoundRobinV427_` provides persistent rotation/cursor behavior |
| H | RAW Admin template receives operational sync | FIXED IN SOURCE | active sync path no longer targets `DASHBOARD_TEMPLATES['مدیر']` for personal operational data |
| I | Provisioning Settings vs canonical RAW templates | CODE SUPPORT FIXED; LIVE CONFIG MIGRATION PENDING | canonical template IDs are environment properties; staging migration must be verified before Production |
| J | Arial renderer violates Vazirmatn | FIXED IN ACTIVE RENDERER + REGRESSION TEST | active role dashboard renderer uses centralized Vazirmatn constant |

## Vercel / Relay

The branch contains:

- `backend/api/telegram.js`
- `backend/package.json`
- `backend/vercel.json`

Therefore the previous `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` condition caused by a missing `backend` directory is structurally resolved in this branch. Existing remediation evidence records a READY Preview and HTTP 200 Relay health check. POST forwarding remains a staging-only verification item.

## CI coverage now present

`.github/workflows/static-validation.yml` checks:

1. Apps Script JavaScript syntax.
2. obvious Telegram token patterns.
3. required engineering documents.
4. duplicate function declarations (reported as debt, not silently ignored).
5. V4.27/V4.28 behavioral regression suite.
6. audit regression suite.
7. Relay JavaScript syntax.
8. required Vercel Relay structure.

## Remaining Production blockers

The following items remain intentionally **NOT VERIFIED** and must stay as release gates:

1. Exact deployed Apps Script source ↔ Git branch SHA comparison.
2. Live inventory of Apps Script triggers, deployments and Telegram webhook.
3. Four-role E2E in isolated staging using test Bot/Sheet/Drive.
4. Real staging Gmail change + revoke + deactivate/reactivate + role-change access checks.
5. Provisioning failure injection/retry/recovery in staging.
6. Concurrent daily-task edit conflict in staging.
7. Cascade delete + rollback using test data.
8. Full validation/protected-range/effective-style/KPI audit.
9. Real Telegram latency and workspace sync-duration measurements.
10. Provisioning Settings migration to canonical RAW template IDs in staging and then controlled Production migration.

## Release decision

**NOT PRODUCTION READY.**

No merge to `main`, no Production Apps Script deployment, no Production Vercel promotion, no destructive Production tests, and no Production Telegram test messages should be performed without explicit owner approval.

## Recommended next execution phase

`STAGING-E2E-001`

Create/verify isolated staging configuration and collect evidence for:

- runtime config,
- webhook/Relay,
- four roles,
- provisioning retry,
- access lifecycle,
- daily-task conflict,
- scheduler >20 mappings,
- template cleanliness,
- validations/protected ranges/style/KPIs,
- latency/runtime.

Each case should record: precondition, command/action, expected result, actual evidence, PASS/FAIL, rollback result.
