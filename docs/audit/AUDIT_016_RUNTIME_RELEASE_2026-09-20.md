# AUDIT-016-RUNTIME-RELEASE

Date: 2026-09-20  
Branch: `codex/full-system-audit`

## Decision

**NO-GO — DO NOT MERGE.**

This execution fixed the repository-side Vercel routing defect and reran CI successfully, but external control-plane gates remain open.

## Actions and evidence

### Drive permission

Re-read `RAW_Admin.xlsx` (`15Aun9z6YXx7Ij19L9V2Z6tXCbG_zWNOC`).

Result: **FAIL** — permission remains `anyone → reader` with link discovery disabled.

The connected Google Drive surface has no permission-delete/revoke operation. No unsafe file deletion/replacement was substituted.

### Vercel relay repository fix

Root deployment previously had no root `vercel.json`, while the relay lived at `backend/api/telegram.js` with `backend/vercel.json`.

Added root `vercel.json` to expose:

`/api/telegram → /backend/api/telegram`

Commits:

- `f57251c213f93e1fee3021030a299aa4241b4718`
- regression fixes through `ad6541995f813d0f739f5d3e7a17922290fff04b`

A regression guard now verifies root routing.

### CI

GitHub Actions run #198 / `35534756872`: **SUCCESS**.

- V4.29 behavioral tests: 17 PASS
- Audit regression tests: 49/49 PASS
- syntax / secret-history / Telegram relay / Vercel structure checks: PASS

### Vercel runtime deployment

The connected Vercel deployment action is not available at runtime (tool reports unavailable). No new deployment was created.

Current project still lists the two previous READY production deployments only. Re-check of production `/api/telegram` after the repository fix still returns **404**, as expected until a new deployment consumes the branch fix.

Therefore relay health/auth E2E is **BLOCKED**.

### Apps Script V4.30 staging deployment

No Apps Script execution/deployment/version-management action is exposed by the connected control planes.

Therefore bound four-role provisioning/revoke/retry E2E and immutable deployment pin remain **BLOCKED**.

### Telegram staging credentials / E2E

No staging-only Telegram bot credential/control surface is available. No Production credential was used or exposed.

Because the Vercel relay is not yet deployed and Apps Script staging runtime is not deployable from this control plane:

- callback E2E: BLOCKED
- reminder delivery E2E: BLOCKED
- operational token rotation proof: BLOCKED
- break-glass Script Property/editor ownership proof: BLOCKED

## Final gate matrix

| Gate | Result |
|---|---|
| RAW_Admin.xlsx Anyone permission removed | **FAIL** |
| Root Vercel routing source fixed | **PASS** |
| Vercel routing regression | **PASS** |
| CI | **PASS — 49/49 audit** |
| New Vercel relay deployed | **BLOCKED** |
| Live `/api/telegram` health | **FAIL — current deployment 404** |
| Apps Script V4.30 staging deployment pinned | **BLOCKED** |
| Four-role runtime provisioning/revoke/retry | **BLOCKED** |
| Isolated Telegram callback E2E | **BLOCKED** |
| Reminder delivery/idempotency E2E | **BLOCKED** |
| Credential rotation proof | **BLOCKED** |
| Break-glass ownership review | **BLOCKED** |
| Final release package | **NOT RELEASED** |
| Merge to main | **BLOCKED** |

## Required external actions

1. Remove the Anyone permission from `RAW_Admin.xlsx`.
2. Trigger a Vercel deployment of the audit branch/root configuration and confirm GET `/api/telegram` returns the relay health JSON.
3. Deploy an isolated Apps Script V4.30 staging revision and provide its non-secret deployment identity.
4. Configure isolated staging Telegram credentials in the authorized secret stores.
5. Re-run the remaining runtime E2E gates.

Until those actions are complete, PR #4 remains Draft and no release package may be declared final.
