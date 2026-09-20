# AUDIT-012 — Regression Test Expansion & Evidence Matrix

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Executable baseline: `V4.28-2026-09-19`  
Canonical CRM: `1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

## Result

**AUDIT-012: PARTIAL FAIL — regression coverage was expanded and live canonical evidence was rechecked, but the Production regression gate cannot pass because the canonical Provisioning Settings still point to LIVE dashboards, GitHub Actions execution evidence is unavailable on the current head, and remaining Production/runtime gates require AUDIT-013 E2E.**

No Production user was messaged. No Production credential was rotated. No Production file was deleted or moved.

## Regression suite expansion

Commit:

`453659021c1bebb3bba7e8e5eb0af7af85bdd724`

Additional guards now cover:

- executable/canonical CRM identity
- required runtime configuration keys
- relay freshness/signature/replay controls
- hard-delete dispatcher entity allowlist
- state-bound Telegram delete confirmation
- primary Telegram admin delete protection
- delete audit emission
- post-revocation Drive principal verification
- internal-action vs signed-relay separation
- provisioning-settings repair dry-run behavior

Existing suites already cover:

- exact identity/RBAC matching
- fail-closed unavailable RBAC sources
- Telegram duplicate identity denial
- signed relay behavior
- provisioning persistence/sync/share ordering
- crash-window Workspace reuse
- stale provisioning recovery
- round-robin Workspace sync
- personal-task conflict detection
- role styling/Vazirmatn
- RAW-vs-LIVE template source invariants
- installer preflight
- protected Drive IDs
- duplicate override debt
- generic webhook errors
- manager actor/permission checks
- destructive manager scope checks
- Workspace access revocation failure

## CI execution evidence

A draft audit PR was opened solely to trigger/collect validation evidence:

PR #4 — `Audit: full-system regression validation`

It remains draft and must not be merged before AUDIT-013/014.

GitHub Actions workflow runs were not returned for the current head, so a green execution result cannot be claimed.

Vercel reports build-rate-limit failure; this is not evidence of a code regression.

Local container execution was attempted but the environment cannot resolve github.com, so it cannot clone the branch for an independent Node run.

Therefore executable regression status is **UNVERIFIED**, not PASS.

## Live canonical CRM revalidation

Canonical workbook metadata was re-read directly from Google Sheets.

Observed title:

`CRM | ترخیص یزد | V1.5 | 2026-09-17`

Observed sheet count: **47**

Canonical security/provisioning sheets are present, including:

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

This supersedes earlier legacy-33-sheet absence findings.

## Evidence matrix

| Area | Regression evidence | Status |
|---|---|---|
| Canonical workbook | 47 sheets and canonical tables observed live | PASS |
| Users / Permissions | active internal users have matching active ASSIGNED permissions in sampled live rows | PASS |
| Workspace Mapping | sampled active users map to completed Workspace records | PASS |
| Provisioning history | retry history shows prior validation error followed by successful V4.15 completion | PASS / historical |
| Provisioning source | live Provisioning Settings still contain LIVE dashboard IDs as Template File ID | **FAIL** |
| Code provisioning source | executable code uses `DASHBOARD_TEMPLATES`, not `LIVE_DASHBOARDS`, for provisioning | PASS |
| RBAC identity | exact identity + duplicate Telegram rejection guards present | PASS static |
| Customer/internal isolation | regression guards exist; full live role E2E still required | PENDING E2E |
| Telegram relay auth | secret-header + HMAC/timestamp/nonce guards covered | PASS static |
| Telegram navigation | callback/webhook regression guards present | PASS static / runtime pending |
| Duplicate updates | cache-based behavior covered; atomic concurrency race remains known | WARNING |
| Apps Script installer | required-sheet preflight before trigger reset | PASS static |
| Workspace access revoke | fail-closed removal + post-removal verification | PASS static |
| Destructive delete | allowlist, confirmation, primary-admin protection, scope guards, logging calls covered | PASS static / rollback FAIL |
| Audit logging | delete logging exists but can still fail silently | **FAIL governance** |
| Drive core folders | owner-only/private evidence retained from AUDIT-009/011 | PASS |
| Public template artifact | `RAW_Admin.xlsx` still anyone-reader | **FAIL** |
| Formula/validation | prior audit fixes/guards retained; canonical full-grid runtime E2E remains required | PENDING E2E |
| Styling | Vazirmatn/semantic styling guards retained | PASS static |
| Git secret gates | current-tree + full-history scanner configured | PASS definition / execution unverified |
| Credential rotation | exposed Telegram token still requires rotation before Production | **FAIL security gate** |
| Backup/restore | no proven Production restore drill | **FAIL readiness** |
| CI | no GitHub Actions run returned for current head | **UNVERIFIED** |
| Vercel | build-rate-limit status | EXTERNAL BLOCKER |

## Confirmed live defect: Provisioning Settings

The canonical 47-sheet workbook currently contains these Template File IDs:

- Internal Employee → LIVE Internal Employee dashboard
- Customer Manager → LIVE Customer Manager dashboard
- Customer Employee → LIVE Customer Employee dashboard
- Admin → LIVE Admin dashboard

This conflicts with the repository architecture:

`RAW Template → new Workspace`

and must not be treated as a passing regression state.

The executable code already expects Script Property-backed RAW template IDs, but the live configuration table remains inconsistent.

No Production mutation was made during AUDIT-012.

## Historical provisioning evidence

The canonical Provisioning Log shows a real prior flow for `USR-INTERNAL-002`:

1. QUEUE
2. PROCESS
3. ERROR due to a data-validation violation
4. retry PROCESS
5. DONE under V4.15

The resulting Workspace Mapping is currently `انجام شد`.

This is useful recovery evidence, but it is not a substitute for current-version V4.28 E2E.

## Remaining blockers before Production regression approval

1. Replace LIVE dashboard IDs in canonical Provisioning Settings with verified canonical RAW template IDs using controlled migration/dry-run.
2. Obtain a green execution of Node syntax + behavioral + audit regression suites on the final audit head.
3. Remove public-link permission from `RAW_Admin.xlsx` after dependency confirmation.
4. Rotate the previously exposed Telegram bot token before Production approval.
5. Verify actual Production `SPREADSHEET_ID` points to the canonical 47-sheet workbook.
6. Run live role-by-role RBAC isolation tests without exposing cross-customer data.
7. Run current V4.28 provisioning E2E in staging.
8. Verify Telegram webhook/relay runtime state and callback flow.
9. Validate destructive-operation recovery/rollback evidence.
10. Perform backup + restore drill.

## AUDIT-012 acceptance

**FAIL / E2E REQUIRED.**

Regression coverage is materially stronger and no new confirmed non-destructive source regression required another code repair in this stage.

The remaining failures are configuration/runtime/readiness blockers and must be validated/remediated through controlled E2E rather than guessed from static source.

Next task: **AUDIT-013 — Full E2E Validation**.
