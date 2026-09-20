# AUDIT-017-EXTERNAL-GATE-VERIFY

Date: 2026-09-20  
Branch: `codex/full-system-audit`

## Result

**FAIL — external actions were not completed; release remains NO-GO.**

AUDIT-017 was explicitly a verification pass for actions expected to have been completed outside the connected control planes. Direct re-check shows those prerequisites are still not satisfied.

## Verification evidence

### 1. RAW_Admin.xlsx privacy

File: `15Aun9z6YXx7Ij19L9V2Z6tXCbG_zWNOC`

Result: **FAIL**

Current Drive metadata still reports:

- `shared=true`
- permission `type=anyone`
- role `reader`
- `allowFileDiscovery=false`

Therefore the broad/public link permission has **not** been removed.

### 2. Vercel deployment / relay health

Project: `prj_kM15kcA2gZFkiErzM7SYxE02fSTe`

Result: **FAIL**

The deployment list still contains only the same two earlier production deployments:

- `dpl_3vUvjC3DdimcKuqinduTkRxtLqL2`
- `dpl_5cCg45EoYQxaC7ViUAtGqPdommxh`

No new deployment consuming the root routing fix is present.

Direct GET verification:

- production alias `/api/telegram` → **404**
- deployment-specific alias `/api/telegram` → **404**

Because the route is not live, unauthorized-source rejection and signed callback E2E cannot be meaningfully executed.

### 3. Apps Script V4.30 staging deployment identity

Result: **BLOCKED / NOT VERIFIED**

No Apps Script deployment/version control surface is exposed by the connected tools, and no externally completed staging deployment identity became available for verification.

Therefore the following cannot be executed:

- bound four-role provisioning
- revoke
- retry/recovery
- immutable V4.30 deployment pin verification

### 4. Telegram callback/navigation

Result: **BLOCKED**

Prerequisites are absent:

- Vercel relay is still 404
- no verified isolated staging Apps Script deployment
- no isolated staging Telegram credential/control surface

No Production Telegram user was messaged.

### 5. Proactive reminder/escalation delivery + idempotency

Result: **BLOCKED**

Code/CI coverage remains green, but real delivery requires the staging Apps Script + Telegram path above. No Production reminder was sent.

### 6. CI/security

Result: **PASS**

Static validation run #200 / `35534804099` completed SUCCESS on AUDIT-016 evidence head.

Evidence:

- behavioral regression: 17 PASS
- audit regression: 49/49 PASS
- JavaScript syntax: PASS
- obvious token scan: PASS
- Git-history high-confidence secret scan: PASS
- Telegram relay syntax: PASS
- Vercel relay structure: PASS

### 7. Branch/release state

Before this evidence commit:

- audit branch: 110 ahead / 0 behind `main`
- PR #4 remains Draft
- no merge performed

## Final gate matrix

| Gate | Status |
|---|---|
| RAW_Admin.xlsx broad permission removed | **FAIL** |
| New Vercel deployment present | **FAIL** |
| `/api/telegram` health reachable | **FAIL — 404** |
| unauthorized relay rejection | **BLOCKED** |
| Apps Script V4.30 staging revision pinned | **BLOCKED** |
| four-role provisioning/revoke/retry E2E | **BLOCKED** |
| Telegram callback/navigation E2E | **BLOCKED** |
| reminder delivery/idempotency E2E | **BLOCKED** |
| CI/security | **PASS** |
| final migration/rollback/release package | **NOT FINALIZED** |
| merge to main | **BLOCKED** |

## Required external completion before another verification pass

Do not repeat AUDIT-017 until all three prerequisites are actually completed:

1. remove `anyone → reader` from `RAW_Admin.xlsx`;
2. deploy the current audit branch/root Vercel routing so `/api/telegram` is reachable;
3. deploy/pin an isolated Apps Script V4.30 staging revision and configure staging-only Telegram/runtime secrets.

After those three changes exist, the remaining runtime E2E can be executed and the release package can be finalized if all gates pass.
