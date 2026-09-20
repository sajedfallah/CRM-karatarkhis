# AUDIT-015-FINAL-GATES — Runtime / Operational Gate Verification

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Audited head before this evidence commit: `3449e8c10c43b009766ad7b13984896c55e83f10`

## Decision

**FAIL / RELEASE BLOCKED — DO NOT MERGE TO `main`.**

This pass re-verified every remaining Critical/High gate using the connected GitHub, Google Drive and Vercel control planes. Static CI is green, but runtime/security evidence is still incomplete and one Drive exposure is positively confirmed open.

## Gate evidence

### G1 — RAW_Admin.xlsx public permission removal

**FAIL — still publicly readable by link.**

Drive metadata re-read for `15Aun9z6YXx7Ij19L9V2Z6tXCbG_zWNOC` still reports:

- `shared=true`
- `anyone → reader`
- `allowFileDiscovery=false`

The prior dependency scan found no repository reference to this file ID/name. The available Drive connector still exposes grant/read operations but no permission-revoke operation, so no destructive substitute was attempted.

Required closure: remove the Anyone permission using Google Drive UI or an authorized API surface that supports `permissions.delete`, then re-run this gate.

### G2 — Bound Apps Script V4.30 four-role provisioning/revoke/retry E2E

**BLOCKED — runtime control surface unavailable.**

The isolated staging CRM/workspaces created in the previous remediation remain valid data-level evidence. However, the connected toolset does not expose Apps Script execution/deployment APIs, so it cannot invoke the bound `provisionWorkspace`, revoke and retry paths against the staging `SPREADSHEET_ID`.

No Production Apps Script execution was attempted.

Required closure: run the staging-bound Apps Script E2E for Admin, Internal Employee, Customer Manager and Customer Employee and capture queue/log/mapping/share/revoke/retry evidence.

### G3 — Isolated Telegram webhook / relay / callback E2E

**FAIL / BLOCKED.**

Vercel project `prj_kM15kcA2gZFkiErzM7SYxE02fSTe` reports production deployment `dpl_3vUvjC3DdimcKuqinduTkRxtLqL2` as READY.

However direct fetches against the production aliases returned **404** for:

- `/`
- `/telegram`
- `/api/telegram`
- `/api/telegram.js`

Repository source contains `backend/api/telegram.js` and `backend/vercel.json`; there is no root `vercel.json`. This is runtime evidence that the currently deployed Vercel project does not expose the audited relay route at the tested aliases.

No synthetic Telegram update was sent because there is no reachable relay endpoint and no isolated staging Telegram credential was available.

Required closure: deploy the `backend` directory as the Vercel project root (or provide equivalent root routing), verify GET `/api/telegram` returns the relay health payload, then execute the signed staging Telegram round trip.

### G4 — Reminder delivery E2E

**BLOCKED.**

The reminder worker remains code/CI validated and delivery-gated by `RELEASE_REMINDERS_ENABLED=true`. Actual delivery requires a reachable staging Apps Script deployment plus isolated Telegram staging identity/bot. Those runtime prerequisites are not available in the connected control plane.

No Production reminder was sent.

### G5 — Credential rotation + break-glass ownership

**BLOCKED — no false PASS recorded.**

Repository CI secret/history scans pass, but this does not prove operational rotation of the previously exposed Telegram credential.

No secret value was read, printed, changed or copied during this pass.

The toolset does not expose Telegram BotFather credential rotation or Apps Script Script Properties/editor ownership. Therefore token rotation and break-glass ownership cannot be independently verified here.

Required closure:

1. rotate the exposed Telegram token through BotFather;
2. update only the authorized runtime secret store;
3. prove the previous token no longer authenticates;
4. verify the break-glass admin identity and Apps Script editors;
5. record non-secret evidence only.

### G6 — Apps Script deployed revision pin

**BLOCKED.**

GitHub identifies the approved source head, but the connected toolset exposes no Apps Script deployment/version API. Therefore no claim is made that the deployed Apps Script web app is pinned to V4.30/current audit head.

Required closure: create/pin an immutable Apps Script deployment version from the approved source and record deployment/version identifiers without secrets.

### G7 — Final CI

**PASS.**

GitHub Actions Static validation run #188 / `35533600771` completed **SUCCESS** on audited head `3449e8c10c43b009766ad7b13984896c55e83f10`.

Previous captured detail:

- V4.29 behavioral regression: 17 PASS
- Audit regression: 48/48 PASS
- JavaScript syntax: PASS
- secret/current-tree/history gates: PASS
- Telegram relay syntax/structure: PASS

Branch state at final-gate verification: **104 ahead / 0 behind** `main`.

## Final matrix

| Gate | Result |
|---|---|
| RAW_Admin.xlsx broad permission removed | **FAIL** |
| Four-role bound Apps Script provisioning/revoke/retry | **BLOCKED** |
| Vercel relay route reachable | **FAIL — 404** |
| Telegram callback round trip | **BLOCKED** |
| Reminder real delivery/idempotency | **BLOCKED** |
| Telegram credential rotation verified | **BLOCKED** |
| Break-glass ownership/editor review | **BLOCKED** |
| Apps Script immutable deployment pin | **BLOCKED** |
| GitHub CI | **PASS** |
| Branch synchronized with main | **PASS — 0 behind** |
| Final PR / migration / rollback release package | **NOT RELEASED** |
| Merge to main | **BLOCKED** |

## Release rule

PR #4 must remain Draft. Do not merge until every Critical/High gate above has direct runtime evidence and is PASS.

The next remediation pass should not repeat static analysis. It should focus on the three external control-plane actions that unlock the remaining tests:

1. revoke the Anyone permission on `RAW_Admin.xlsx`;
2. deploy/pin the audited Apps Script staging/runtime revision and expose a staging execution path;
3. deploy the Vercel relay from `backend` so `/api/telegram` is reachable, then use an isolated rotated Telegram credential for E2E.
