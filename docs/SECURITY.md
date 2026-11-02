# KARATARKHIS CRM — Security Canonical Rules

## Current blockers
- Password/session authentication foundation is implemented; production enrollment and organization-membership authorization remain incomplete. See IAM_SESSION_AUTH.md.
- Repository is public; no customer data, credentials, tokens or private documents may be committed.
- Legacy audit evidence reported a RAW admin file with link-wide reader access; this must be separately remediated/verified before cutover.
- V5 automated IDOR/cross-tenant regression coverage is not yet complete.

## Authentication
Real production identity is required. Cookie sessions use verified credentials, Origin/CSRF protection and server-side revocation. `X-User-ID` is available only in development/test with explicit DEV_IDENTITY_ENABLED=true; staging/production reject it. There is no public enrollment or verification bypass.

## Authorization
Default deny. Enforce backend role + resource + action + scope + field access. UI visibility is not a security boundary.

## Files
Private storage; validate type/size/MIME; malware scan before AI; authorize immediately before issuing any signed/access link.

## Web
HTTPS, secure cookies/session strategy, CSRF where applicable, CORS allowlist, CSP/HSTS, input validation, parameterized queries/ORM, rate limits.

## Audit
Sensitive mutations and overrides are append-only audited.

## Secrets
No secrets in Git, logs, AI prompts or public artifacts.

## Session CSRF recovery for new tabs
The same-origin GET /api/v1/auth/csrf requires an active verified cookie session
and X-CSRF-Request: 1. An explicitly supplied Origin must be allowlisted. No
cross-origin CORS access is enabled. Responses are private/no-store and vary by
Cookie. CSRF is an HMAC-SHA256 value with a versioned purpose string, keyed by
the cryptographically random HttpOnly session secret. It is not a bearer session
credential and cannot authenticate without the cookie. Recovery does not rotate
or extend sessions and does not invalidate other tabs. Unsafe requests still
require both exact Origin and session-bound X-CSRF-Token. Legacy random CSRF
hashes remain accepted only within their existing valid sessions. Expired,
revoked, unverified and inactive sessions cannot acquire a token.
