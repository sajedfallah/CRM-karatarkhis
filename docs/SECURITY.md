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
