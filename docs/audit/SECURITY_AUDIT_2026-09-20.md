# AUDIT-011 — Security Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Executable baseline: `V4.28-2026-09-19`  
Canonical CRM candidate: `1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

## Executive result

**AUDIT-011 status: FAIL — no confirmed active secret embedded in the current Apps Script source, but the public-repository threat model, Git-history evidence gap, one public Drive artifact, break-glass access, and destructive internal-action controls prevent Security approval.**

No Production credential was rotated, invalidated, or replaced.

No Production webhook was changed.

---

# 1. Repository exposure model

Repository:

`sajedfallah/CRM-karatarkhis`

is **public**.

Therefore any committed credential, customer export, service-account JSON, private key, or operational workbook must be treated as publicly compromised even if later deleted from the current branch.

This makes history-level secret detection mandatory.

---

# 2. Current-tree secret hygiene — PASS with limits

The current Apps Script source obtains sensitive runtime configuration through Script Properties.

Observed properties include:

- BOT_TOKEN
- ADMIN_TELEGRAM_ID
- WEB_APP_URL
- SPREADSHEET_ID
- CRM_FOLDER_ID
- CRM_DOCUMENTS_ROOT_FOLDER_ID
- TELEGRAM_RELAY_URL
- TELEGRAM_WEBHOOK_SECRET
- RELAY_SHARED_SECRET
- TEMPLATE_* IDs
- WORKSPACE_FOLDER_* IDs

The internal manager-workspace API secret is generated randomly and stored in Script Properties.

No raw Telegram bot token was identified in the currently audited `Code.gs`.

The Vercel relay obtains its secrets from environment variables rather than repository literals.

---

# 3. .gitignore controls — PASS for future local files

Current `.gitignore` excludes:

- .env / .env.*
- credentials.json
- service-account JSON
- secret JSON
- PEM/key files
- exports/
- backups/
- data/
- customer-data/
- customer-documents/
- CSV/XLS/XLSX/ZIP
- private screenshots/captures

This is appropriate preventive hygiene.

## Limitation

.gitignore does not protect files already committed in Git history.

---

# 4. S-001 — Git-history secret assurance was missing — HARDENED

Severity before fix: **HIGH**

The existing CI scanned only the checked-out current tree for Telegram token patterns.

Because the repository is public, a secret committed and later deleted could remain readable in Git history.

## Remediation

Static Validation now checks out full history:

`fetch-depth: 0`

and scans `git log --all -p` for high-confidence patterns including:

- Telegram bot token format
- OpenAI-style secret format
- Google API key format
- private-key headers

The scanner uses quiet matching and prints only a generic failure message, not the matched secret.

Commit:

`cc20f5592ddde2cfa755320e76b75c6193f8f3c7`

## Evidence gap

The GitHub connector currently exposes no workflow run for that latest commit.

Therefore the new history scanner is installed, but **a successful full-history scan has not yet been observed**.

Security gate remains closed until that CI run is green.

---

# 5. Tracked binary/export risk

The repository intentionally tracks canonical role XLSX snapshots even though `*.xlsx` is now ignored for future files.

Prior template audit found the canonical RAW templates structurally clean and without operational rows.

However binary workbook history is harder to inspect with normal text scanners.

## Required policy

Only synthetic/template workbooks may be tracked.

Every binary Office artifact added to a public repository must be reviewed for:

- hidden sheets
- comments
- document properties
- cached values
- external links
- customer data

before commit.

---

# 6. Drive sharing — system folders PASS, one public artifact FAIL

Canonical RAW native templates are owner-only/private.

System architecture folders audited in AUDIT-009 were also private.

## S-002 — RAW_Admin.xlsx public link

Severity: **HIGH for public-artifact governance**

Drive file:

`RAW_Admin.xlsx`

currently has:

`anyone → reader`

with file discovery disabled.

It is an export/snapshot, not the canonical native RAW Admin template.

No operational data was proven in the canonical template set, but public-link sharing violates the private-template security model.

### Required remediation

After confirming no external workflow depends on this snapshot:

- remove the `anyone` permission
- preserve owner access
- retain canonical native RAW template as source of truth

AUDIT-011 did not alter Production/template permissions because permission revocation could affect an unknown external consumer.

---

# 7. Telegram relay trust boundary — PASS in design

Vercel relay verifies Telegram's secret-token header using timing-safe comparison.

It then creates an HMAC-SHA256 envelope containing:

- timestamp
- nonce
- Telegram update

Apps Script verifies:

- relay secret presence
- envelope fields
- nonce format
- timestamp age/future skew
- HMAC signature
- nonce replay

This is a strong two-hop ingress model.

---

# 8. Telegram update-id idempotency — WARNING

Telegram `update_id` deduplication still uses CacheService get/put without a transactional compare-and-set.

A rare concurrent retry race remains possible.

Severity: **MEDIUM**

Relay nonce replay prevention does not replace update-id idempotency because the same Telegram update can be relayed again with a fresh nonce after transport failure.

---

# 9. S-003 — Internal workspace API actor check allowed blank actor — FIXED

Severity before fix: **HIGH**

The manager Workspace internal API previously used:

`if (ctx.email && actorEmail && ctx.email !== actorEmail)`

When the canonical Workspace had an owner email but the request omitted `actor_email`, the condition did not reject the request.

This path can execute:

`manager_delete`

for scoped Cases/Tasks.

## Remediation

The final internal-action handler now:

- requires non-empty supplied/expected secret
- compares secret using constant-time equality
- requires actor email when canonical Workspace email exists
- requires exact actor-email equality
- requires canonical User status = active
- requires active Permission
- retains Workspace-role and row-scope enforcement

Commit:

`debc69c9688c4057eb849114c038cf5879f031da`

Regression guards:

`246cddbba878b6ba1183cb125d091113edb832ae`

---

# 10. Internal API secret storage — PASS

The internal action secret is:

- generated using two UUID-derived random values
- stored in Script Properties
- not hardcoded in source

This is materially better than deriving it from BOT_TOKEN or another shared credential.

---

# 11. Break-glass Telegram administrator — HIGH governance risk

`ADMIN_TELEGRAM_ID`

is a Script Property and acts as a break-glass administrator identity.

It bypasses canonical Users/Permissions.

## Benefit

Administrative recovery remains possible if RBAC tables are damaged.

## Risk

If the property is stale or unauthorized parties can modify Script Properties, canonical RBAC can be bypassed.

## Required controls

- document named owner/responsibility outside public repo
- restrict Apps Script editors
- review value before each Production release
- log break-glass usage
- periodically reconcile it to a canonical admin identity
- define emergency rotation procedure

No Production admin setting was changed.

---

# 12. Canonical RBAC boundary — PARTIAL PASS

Role authorization requires active Users + Permissions for normal Telegram users.

Previously audited protections include:

- exact stable User ID matching
- uniqueness requirement for legacy names/Telegram IDs
- duplicate Telegram identity denial
- role/permission consistency
- Customer scope fail-closed
- inactive/missing permission denial

## Remaining blocker

Workspace scoped-data generation still needs a single canonical Permission-derived scope resolver; direct reliance on User role in Workspace sync remains an architectural concern from AUDIT-005.

---

# 13. Destructive Sheet operations

Admin-side cascade delete uses an explicit UI YES/NO confirmation.

Manager-customer delete also uses UI confirmation and is limited to:

- cases
- tasks

with row-scope verification.

Cascade delete can:

- delete dependent Sheet rows
- move related Drive files/folders to Trash
- trigger Workspace re-sync

This is genuinely destructive and requires strong audit evidence.

---

# 14. Deletion audit logging — PASS with limitations

Cascade deletion calls:

`safeLogDeleteV413_()`

which records:

- entity
- record ID through action context
- rows deleted
- Drive items trashed
- actor label

in System Log.

## Limitation

The admin Sheet path records actor as a generic:

`SHEET_ADMIN`

rather than a durable canonical User ID/email.

Manager path records:

`SHEET_CM:<User ID>`

which is stronger.

### Recommended future hardening

Resolve admin destructive actions to a stable canonical administrator identity wherever Apps Script session identity is available.

---

# 15. Public endpoint error disclosure — improved

AUDIT-010 changed the final Telegram webhook to return:

`internal_error`

instead of raw exception text.

Detailed exception data is retained server-side through logging.

This reduces endpoint information disclosure.

---

# 16. Logging confidentiality

`logSystem()` stores detailed error text in the CRM System Log.

This is useful operationally but can contain:

- internal stack traces
- record identifiers
- operational context

System Log must remain restricted to privileged internal users.

No evidence was found that System Log is intentionally publicly shared.

---

# 17. Vercel relay configuration

The relay expects environment variables:

- TELEGRAM_WEBHOOK_SECRET
- RELAY_SHARED_SECRET
- APPS_SCRIPT_WEB_APP_URL

and returns 503 if they are absent.

The relay does not expose environment values in response bodies.

A READY Production deployment exists.

## Evidence gap

This audit cannot read Vercel environment variable values, so it cannot independently confirm:

- uniqueness
- age
- rotation status
- equality with Apps Script Script Properties

---

# 18. Google credential model

The Apps Script code primarily uses native authorization scopes through:

- SpreadsheetApp
- DriveApp
- ScriptApp
- PropertiesService
- UrlFetchApp

No service-account/private-key credential is required by the current Apps Script runtime source.

The repository ignores service-account JSON/private keys.

Result: **PASS for current Apps Script architecture.**

---

# 19. Dependency exposure

The Telegram relay backend has no third-party runtime dependency listed beyond Node built-ins.

`crypto` and native `fetch` are used.

This significantly reduces npm supply-chain exposure for the relay.

Node requirement:

`>=20`

Result: **PASS**

---

# 20. Production configuration exposure

IDs such as Spreadsheet IDs, Drive Folder IDs and Template IDs are not secret credentials by themselves, but in a public repository they should still be treated as infrastructure metadata.

Security must rely on Google authorization, not ID secrecy.

Current design mostly follows that rule.

---

# 21. Secret/logging rotation priorities

No rotation was executed.

Recommended order if rotation becomes necessary:

## Priority 1 — Telegram Bot Token

Rotate if any history scan or external exposure confirms it was committed/public.

Sequence:

1. create new token through Telegram/BotFather
2. update Apps Script BOT_TOKEN
3. smoke-test outbound API
4. reinstall/reset webhook through relay
5. verify getWebhookInfo
6. invalidate old token

## Priority 2 — TELEGRAM_WEBHOOK_SECRET

1. generate new random secret
2. update Vercel relay env
3. update Apps Script Script Property
4. call setWebhook with new Telegram secret token
5. verify relay accepts Telegram and rejects old secret

## Priority 3 — RELAY_SHARED_SECRET

1. update Vercel and Apps Script in coordinated maintenance window
2. deploy relay
3. deploy/update Apps Script property
4. verify signed envelope
5. remove old value

Because this secret is symmetric, mismatched rotation temporarily breaks ingress.

## Priority 4 — Internal Workspace API secret

1. rotate Script Property
2. existing role Workspaces do not need a source-code change because they fetch the current secret through the bound Apps Script runtime
3. verify manager refresh/delete path in staging

## Priority 5 — Admin break-glass identity

Change only as part of controlled ownership transfer/recovery procedure.

---

# 22. Credential rotation triggers

Immediate rotation should occur if any of these become true:

- full-history scan finds a real secret
- secret appears in public GitHub issue/PR/log
- Vercel or Apps Script access is compromised
- unauthorized Telegram request succeeds
- secret is shared through a public Drive/file artifact
- collaborator with secret access leaves without controlled offboarding

---

# 23. Security fixes completed across audit stream

Security-relevant commits include:

- fail-closed missing RBAC source
- fail-closed legacy identity matching
- duplicate Telegram ID rejection
- generic public webhook errors
- installer preflight before trigger reset
- property-derived protected Drive IDs
- provisioning duplicate-request recovery
- manager internal-action actor/permission enforcement
- full-history CI secret scanner
- fail-closed Workspace principal revocation with post-removal verification

AUDIT-011-specific:

- `debc69c9688c4057eb849114c038cf5879f031da`
- `246cddbba878b6ba1183cb125d091113edb832ae`
- `cc20f5592ddde2cfa755320e76b75c6193f8f3c7`
- `e99b668a20df41aff7d5942ccea31df6406640d3`
- `62c84c6e4c509459310e9f9d96409a8ee82414af`

---

# 24. Workspace access revocation — HARDENED

Previous access-removal logic swallowed `removeEditor` / `removeViewer` failures. An inactive or revoked user could therefore theoretically retain Drive access while the workflow continued.

The final audit branch now:

- checks whether the principal is currently an editor/viewer
- attempts revocation
- fails closed if an existing principal cannot be removed
- verifies that the principal is absent after removal

Code commit:

`e99b668a20df41aff7d5942ccea31df6406640d3`

Regression commit:

`62c84c6e4c509459310e9f9d96409a8ee82414af`

# 25. Known external credential exposure

A real Telegram bot token was previously supplied in project conversation context. Even though the current repository scan did not identify it in audited source, it must be treated as compromised.

AUDIT-011 did **not** rotate it because credential rotation was explicitly excluded without approval.

Before Production approval:

1. rotate the bot token through BotFather
2. update Apps Script `BOT_TOKEN` only in Script Properties
3. verify relay/webhook registration
4. run staging/admin smoke tests
5. confirm the old token no longer works
6. retain only non-secret rotation evidence

# AUDIT-011 acceptance

**FAIL — Security Production gate remains closed.**

## PASS

- current Apps Script runtime reads secrets from Script Properties
- Vercel relay reads secrets from environment
- internal workspace API secret is randomly generated/stored in Script Properties
- no obvious raw Telegram token observed in current Code.gs
- canonical RAW native templates are private
- core Drive folders are private
- relay uses timing-safe Telegram secret validation
- relay→Apps Script HMAC + timestamp + nonce/replay checks exist
- normal Telegram RBAC is fail-closed
- manager internal action actor gap is fixed on audit branch
- destructive manager delete remains entity/scope constrained
- current backend has minimal dependency attack surface
- webhook exception disclosure was reduced

## HIGH / CRITICAL blockers

1. A real Telegram bot token was previously exposed outside Git in project conversation context; it must be rotated before Production approval. Public-repository Git-history evidence must also be green; the full-history scanner is installed but a successful final-head run is not yet observed.
2. Public-link `RAW_Admin.xlsx` remains shared to anyone-with-link.
3. Break-glass admin bypass remains outside canonical RBAC and lacks dedicated usage logging.
4. Workspace scoping still needs unified Permission-derived authorization architecture.
5. Destructive admin Sheet audit identity is generic rather than canonical.
6. Vercel runtime secret values/rotation age cannot be independently verified.
7. Actual Production Telegram webhook runtime state remains unverified.
8. Security-sensitive duplicate historical Apps Script overrides remain in source.
9. Production backup/restore evidence remains incomplete.
10. Source-of-truth split between legacy and canonical CRM must be fully resolved before security approval.

Next task: **AUDIT-012 — Regression Test Expansion**.
