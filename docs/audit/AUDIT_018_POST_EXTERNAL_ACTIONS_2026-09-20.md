# AUDIT-018-POST-EXTERNAL-ACTIONS

Date: 2026-09-20  
Branch: `codex/full-system-audit`

## Result

**PRECONDITION FAIL — STOPPED BEFORE RUNTIME E2E. DO NOT MERGE.**

AUDIT-018 explicitly required verification of three externally completed actions before executing downstream runtime E2E. The first two verifiable prerequisites are still false, and no verifiable Apps Script staging deployment identity is available. Per the task gate, downstream E2E was not executed and no release package was finalized.

## Precondition 1 — RAW_Admin.xlsx privacy

File: `15Aun9z6YXx7Ij19L9V2Z6tXCbG_zWNOC`

**FAIL**

Current metadata:

- `shared=true`
- `anyone → reader`
- `allowFileDiscovery=false`

The public/link-wide permission remains present.

## Precondition 2 — new Vercel deployment

Project: `prj_kM15kcA2gZFkiErzM7SYxE02fSTe`

**FAIL**

Deployment inventory still contains only the two pre-existing production deployments:

- `dpl_3vUvjC3DdimcKuqinduTkRxtLqL2`
- `dpl_5cCg45EoYQxaC7ViUAtGqPdommxh`

No new deployment consuming the audit-branch root routing fix is visible.

Direct health verification:

- production alias `/api/telegram` → **404**
- deployment-specific alias `/api/telegram` → **404**

Therefore relay health/auth behavior cannot be validated.

## Precondition 3 — Apps Script V4.30 staging pin

**NOT VERIFIED / BLOCKED**

The connected toolset exposes no Apps Script deployment/version API, and no non-secret staging deployment identity was supplied or discoverable through the available project control planes.

Therefore the V4.30 staging pin cannot be verified.

## Downstream E2E decision

Because all three preconditions were required before runtime execution, the following were intentionally **not executed**:

- relay unauthorized-source rejection
- four-role provisioning
- workspace revoke
- provisioning retry/recovery
- Telegram callback/navigation
- reminder/escalation delivery
- reminder idempotency

This avoids producing misleading PASS evidence against stale or Production runtime.

## CI/security

Latest audit-head Static validation run #202 / `35535606588` completed **SUCCESS**.

The previous audit baseline remains:

- behavioral regression: 17 PASS
- audit regression: 49/49 PASS
- syntax/secret-history/relay/Vercel structure checks: PASS

## Branch / PR state

Before this evidence commit:

- branch: 111 ahead / 0 behind `main`
- PR #4: remains Draft
- merge: not performed

## Release decision

**NO-GO.**

Migration manifest, rollback package and Production release checklist are not marked final because Critical/High runtime gates remain open.

Do not rerun POST-EXTERNAL-ACTIONS verification until the operator has actually completed:

1. Drive permission removal;
2. Vercel deployment of the audit-branch routing fix;
3. Apps Script V4.30 isolated staging deployment/pin.

Once those are complete, runtime E2E may proceed.
