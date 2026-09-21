# KARATARKHIS CRM — Security Canonical Rules

## Current blockers
- Production authentication for V5 is not implemented.
- Repository is public; no customer data, credentials, tokens or private documents may be committed.
- Legacy audit evidence reported a RAW admin file with link-wide reader access; this must be separately remediated/verified before cutover.
- V5 automated IDOR/cross-tenant regression coverage is not yet complete.

## Authentication
Real production identity is required. The current V5 `X-User-ID` mechanism is DEV/STAGING only and must fail closed in production.

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
