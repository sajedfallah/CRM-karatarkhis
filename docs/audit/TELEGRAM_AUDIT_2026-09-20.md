# AUDIT-010 — Telegram Audit

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Scope: `FULL-SYSTEM-AUDIT`  
Canonical CRM: `1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

## Executive result

**AUDIT-010 status: FAIL — relay/auth/navigation are materially hardened, but Production Telegram readiness is not yet proven because webhook runtime state and proactive notification flows are incomplete/unverified.**

No Telegram test message was sent to any Production user.

No Production webhook was modified.

---

# 1. Canonical CRM Telegram identity state

The canonical 47-sheet CRM contains active canonical Users and Permissions.

Observed active internal users:

- `USR-INTERNAL-001`
- `USR-INTERNAL-002`

Both have:

- Telegram User ID
- Role = `کارمند داخلی`
- Status = `فعال`
- active Permission
- Scope Type = `ASSIGNED`
- Scope ID = `OWN_ASSIGNMENTS`

This means the role-aware Telegram authorization model has real canonical data available in the 47-sheet CRM.

The legacy `کارمندان` sheet also contains Telegram identities, but canonical authorization should rely on Users + Permissions.

---

# 2. Telegram admin access

A break-glass admin path remains:

`ADMIN_TELEGRAM_ID`

If an incoming Telegram ID exactly matches that Script Property, the code grants administrator context without requiring a Users/Permissions row.

This remains an explicit operational exception to canonical RBAC.

## Required controls

- keep value only in Script Properties
- audit every break-glass use
- restrict Script Property edit permissions
- document recovery owner
- verify the configured admin Telegram ID before Production cutover

No secret or raw admin ID is reproduced in this audit report.

---

# 3. T-001 — Duplicate Telegram identity ambiguity — FIXED

Severity before fix: **HIGH security**

Previous behavior stopped at the first matching Telegram ID found in:

- Users
- مدیریت کاربران

This meant a Telegram ID accidentally assigned to multiple different User IDs could authorize whichever row was encountered first.

## Remediation

The final authorization function now:

1. scans both canonical identity sources
2. deduplicates mirrored rows by User ID
3. requires exactly one unique User ID for the Telegram ID
4. returns:

`duplicate_telegram_identity`

when more than one canonical User ID is linked to the same Telegram ID

and denies access.

Commit:

`f31e92250cf0f5e760260e1f939cfee07145d6d9`

Regression guard:

`d901cbeab7c8a760f28cfd72ff34d1dbee6ae237`

---

# 4. Role authorization model — PASS in code

Non-break-glass Telegram users require:

1. Telegram ID match
2. exactly one canonical User identity
3. User status = active
4. supported role
5. non-empty User ID
6. active Permission row
7. Permission Role consistent with User Role
8. valid role scope

Role scopes:

### Admin

- Scope Type = ALL
- Scope ID = *

### Internal Employee

- Scope Type = ASSIGNED
- non-empty Scope ID

### Customer Manager / Customer Employee

- User Customer ID must exist
- Scope Type = CUSTOMER
- Scope ID must exactly equal User Customer ID

The authorization path is fail-closed for missing Users/Permissions sources.

---

# 5. Customer-role Telegram isolation — NOT YET PROVEN LIVE

The canonical CRM currently has active internal users, but no real active Customer Manager / Customer Employee Telegram scenario was evidenced in this audit.

Therefore these paths are implemented in code but still require E2E proof:

- customer manager Telegram home
- customer employee Telegram home
- cross-customer denial
- invalid Customer ID denial
- inactive customer user denial
- Permission Customer Scope mismatch denial

No Production customer test messages were sent.

---

# 6. Relay architecture — PASS in source

Telegram webhook traffic is designed to terminate at a Vercel relay first.

The relay requires:

`x-telegram-bot-api-secret-token`

and compares it with:

`TELEGRAM_WEBHOOK_SECRET`

using timing-safe comparison.

The relay then creates:

- timestamp
- random nonce
- HMAC SHA-256 signature

using:

`RELAY_SHARED_SECRET`

and forwards the signed envelope to the Apps Script URL.

Apps Script verifies:

- relay secret exists
- envelope structure
- timestamp freshness
- future clock skew
- nonce format
- HMAC signature
- replay nonce

before dispatching the Telegram update.

Existing V4.27 behavioral tests cover:

- valid signature
- replay rejection
- expired request rejection
- bad signature rejection

---

# 7. Vercel relay deployment evidence

A separate Vercel project exists:

`karatarkhis-webhook`

Observed Production deployment:

- state: `READY`
- target: `production`
- stable production alias present

This confirms that a live relay deployment exists.

The CRM repository itself also has READY preview deployments on the audit branch.

## Limitation

The audit environment cannot read Vercel environment variable values.

Therefore these runtime values remain unverified:

- TELEGRAM_WEBHOOK_SECRET
- RELAY_SHARED_SECRET
- APPS_SCRIPT_WEB_APP_URL

---

# 8. T-002 — Current Telegram getWebhookInfo not runtime-verified

Severity: **HIGH deployment evidence gap**

The repository contains:

- `getTelegramWebhookInfo()`
- `setTelegramWebhook()`
- `resetTelegramWebhook()`

The intended webhook target is:

`TELEGRAM_RELAY_URL`

with:

- secret_token
- allowed_updates = message, callback_query
- drop_pending_updates = false

However this audit cannot invoke the bound Apps Script runtime with its private BOT_TOKEN.

Therefore the following current Telegram runtime facts are still unknown:

- actual webhook URL registered at Telegram
- pending_update_count
- last_error_message
- last_error_date
- max_connections
- whether registered secret token matches relay environment

This must be captured from `getWebhookInfo()` during staging/production verification.

---

# 9. Callback navigation — PASS with bounded-data paths

The final callback path is layered:

1. `handleEssentialCallbackV423_`
2. `handleFastNavigationV422_`
3. fallback `handleCallback`

## Fast navigation

Main/navigation callbacks use prebuilt payloads and Telegram `fetchAll` to:

- ACK callback
- edit panel

in parallel.

This avoids waiting on Sheet/Drive reads for basic menu navigation.

## Heavy report buttons

On-demand buttons such as:

- brief:today
- brief:alerts
- brief:cases
- brief:tasks
- me:today
- me:alerts

ACK/show loading first and then execute bounded reads.

Admin report reads are capped around:

- 80
- 100
- 120

recent rows depending on view.

Personal daily views are also bounded.

This is materially better than full-table reads on every menu click.

---

# 10. Callback spinner behavior — PASS

Legacy callback flow calls:

`answerCallback()`

before expensive Sheet/Drive work.

Fast path uses `fetchAll` to send callback ACK and edit request concurrently.

This reduces Telegram spinner latency.

Existing System Log data also contains historical successful callback records.

---

# 11. Stale panel protection — PASS

The bot stores the current panel message ID.

If a callback comes from an older menu message:

- it is rejected
- stale keyboard is disabled
- current wizard/state is not reset

This prevents old inline menus from mutating current interaction state.

---

# 12. T-003 — Telegram update duplicate detection is cache-based and non-atomic

Severity: **MEDIUM**

`isDuplicateUpdate(updateId)` performs:

1. cache.get
2. cache.put

without a transactional lock.

Two simultaneous deliveries of the same Telegram update could theoretically both pass the read before either cache write is visible.

The relay also has nonce replay protection, but Telegram may legitimately retry the same update with a new relay nonce after an HTTP-level failure.

Therefore update_id deduplication remains important.

## Recommended remediation

Add a very small critical section around update-id claim/mark, or use a durable idempotency record.

Do not lock the entire webhook handler.

AUDIT-010 did not change this path because latency impact must be benchmarked.

---

# 13. T-004 — Webhook internal exception disclosure — FIXED

Severity before fix: **LOW/MEDIUM security**

The final Apps Script `doPost()` previously returned:

the internal exception message

to the relay/caller.

Detailed error text can expose implementation details.

## Remediation

The webhook now logs detailed server-side error information but returns only:

`internal_error`

to the caller.

Commit:

`f31e92250cf0f5e760260e1f939cfee07145d6d9`

Regression guard:

`d901cbeab7c8a760f28cfd72ff34d1dbee6ae237`

---

# 14. Relay error handling — PASS

The Vercel relay:

- rejects missing configuration with 503
- rejects wrong Telegram secret with 401
- rejects invalid body/update with 400
- imposes an 8-second Apps Script upstream timeout
- returns 502 on upstream rejection/timeout
- does not return relay secrets

This is an appropriate boundary for Telegram webhook forwarding.

---

# 15. Apps Script webhook failure semantics

If Apps Script throws after update ID has been claimed:

the duplicate cache marker is removed in the catch path.

This allows Telegram retry to be processed again rather than permanently discarded.

This is desirable.

Detailed failure is logged internally.

---

# 16. Telegram linking state — PASS with silent-write caveat

On successful authorized message receipt:

`markTelegramLinkedV419_()`

updates:

- Telegram Linked = yes
- last activity
- last update

in canonical/raw user sheets.

The writes are best-effort and failures are silently swallowed.

## Risk

Authorization may work while `Telegram Linked` metadata remains stale.

Severity: **LOW/MEDIUM**

Recommended:

- log linking write failures
- do not block authorization merely because telemetry metadata write fails

---

# 17. Telegram menu scope — PASS by current product design

Current Telegram product behavior is intentionally lightweight/read-oriented.

Legacy CRUD operational buttons are intercepted by the essential callback layer.

For non-admin users, old operational routes are redirected back to their role home instead of exposing admin CRUD.

This is safer than allowing Telegram to mutate CRM records broadly.

---

# 18. T-005 — Admin fallback callback remains admin-only

The old generic `handleCallback()` starts with:

admin authorization.

This is safe because role-user callbacks intended for current product behavior should already be consumed by `handleEssentialCallbackV423_`.

If a role user reaches an unsupported legacy callback, access is denied rather than falling through to admin CRUD.

Result: **PASS / fail-closed**

---

# 19. Telegram command behavior

Authorized admin commands include:

- /start
- /admin
- /menu
- /cancel

Role users receive role-specific home behavior.

Unauthorized users receive an access-denied message showing their Telegram ID so an administrator can link/activate them.

No Production messages were generated during AUDIT-010.

---

# 20. T-006 — Proactive reminder/escalation Telegram engine is not present

Severity: **HIGH functional gap**

The canonical CRM contains reminder/escalation fields for:

- Leads
- Tasks / Daily Tasks
- Customer Tasks
- Customer Task Messages

and Settings includes reminder timing values.

However the active `Code.gs` does not contain a dedicated runtime function family for:

- task reminder send
- lead reminder send
- customer-task reminder send
- escalation push send
- reminder scheduler

The current Telegram implementation provides on-demand views/alerts, but a proactive reminder/escalation push engine could not be identified.

## Impact

The audit cannot claim that:

- overdue Task reminders are sent
- customer request reminder levels trigger Telegram messages
- manager escalation pushes are sent
- reminder message IDs are persisted

This is a Production functionality blocker if those notifications are required.

---

# 21. Customer task Telegram persistence — schema exists, runtime delivery not proven

Canonical sheets include fields such as:

- Employee Message ID
- Customer Chat ID
- last reminder
- escalation timestamp
- last manager alert

and a dedicated:

`پیام‌های تسک مشتری`

table.

But no active proactive delivery engine was located in the current runtime source.

Current data tables are effectively ready for notification tracking, but the delivery lifecycle is not proven.

---

# 22. Provisioning-related Telegram messages

Historical installer versions sent installation/provisioning status messages to the admin Telegram account.

The final audited installer is now focused on configuration/trigger repair and does not rely on sending those historical status messages as a success criterion.

Provisioning Queue/Log is a more reliable source of lifecycle evidence.

No Production provisioning Telegram notification was triggered in this audit.

---

# 23. System Log evidence

The canonical System Log includes historical successful Telegram callback events.

It also contains provisioning-related errors from older V4.13–V4.15 releases.

Those historical errors include validation conflicts and do not prove a current Telegram routing failure.

The later Provisioning Log shows the previously failing request eventually reaching:

`DONE`

in V4.15.

This indicates historical recovery but is not a substitute for current Telegram E2E.

---

# 24. Current user/permission consistency

Observed internal users have matching:

- Users role
- Permissions role
- Telegram ID
- active status
- ASSIGNED scope

No duplicate Telegram ID was observed in the currently populated canonical Users rows inspected.

The new duplicate-ID fail-closed guard remains necessary for future data growth.

---

# 25. Production Telegram E2E still required

Required test matrix without using real customer accounts initially:

## Admin

- /start
- main menu
- today brief
- alerts
- cases
- tasks
- manual sync enqueue
- stale menu callback

## Internal Employee

- /start
- role home
- today tasks
- alerts
- attempt legacy admin callback → deny/redirect

## Customer Manager

- /start
- role home
- Customer-only data
- cross-customer synthetic record must be absent

## Customer Employee

- /start
- restricted home
- restricted task/case visibility
- write/admin callbacks denied

## Negative identity

- inactive user
- missing Permission
- Permission role mismatch
- Customer scope mismatch
- duplicate Telegram ID
- unknown Telegram ID

## Webhook

- valid Telegram secret
- invalid Telegram secret
- valid relay HMAC
- bad HMAC
- expired timestamp
- replayed nonce
- repeated update_id
- Apps Script timeout
- Apps Script internal exception
- Telegram retry

---

# AUDIT-010 acceptance

**FAIL — Telegram Production gate remains closed.**

## Passed / improved

- canonical Users/Permissions now confirmed in 47-sheet CRM
- active internal Telegram identities have canonical Permission rows
- role-aware authorization is fail-closed
- duplicate Telegram identity is now rejected
- signed relay architecture is sound
- production Vercel relay deployment exists and is READY
- callback navigation has fast ACK/edit paths
- heavy reports use bounded reads
- stale panel protection exists
- webhook no longer exposes internal exception details
- no Production test messages were sent

## Remaining blockers

1. actual Telegram `getWebhookInfo()` runtime state not captured
2. Vercel relay environment variables not independently verified
3. proactive reminder/escalation Telegram engine not present/proven
4. Customer Manager Telegram E2E not executed
5. Customer Employee Telegram E2E not executed
6. cross-customer Telegram isolation not runtime-tested
7. update_id deduplication remains non-atomic
8. Telegram-linked metadata write failures are silently swallowed
9. relay timeout/retry behavior requires live staging failure injection
10. no current end-to-end latency measurement from Telegram → relay → Apps Script → Telegram edit

Next task: **AUDIT-011 — Security Audit**.
