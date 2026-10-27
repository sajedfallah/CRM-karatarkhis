# KRT-IAM-001B — Password/session foundation

This slice adds password verification and revocable server-side sessions to the existing FastAPI stack. It does not complete the IAM epic or authorize production cutover.

## Behavior

- `POST /api/v1/auth/login`: email/password; only active users with a verified credential can sign in. Email matching is normalized; ambiguous duplicate legacy identities fail closed.
- Argon2id password hashes; session and CSRF tokens are random and stored only as SHA-256 hashes.
- Host-only `__Host-krt_session` cookie: Secure, HttpOnly, SameSite=Strict, eight-hour expiry.
- Mutations authenticated by cookie require an allowed Origin and `X-CSRF-Token` returned by login.
- `POST /api/v1/auth/logout` revokes the server-side session and expires the cookie.
- Active state and verified email are checked for every session request. Changing email invalidates existing sessions.
- Database-backed, atomic login limits: ten attempts per normalized email and sixty per connection IP per fifteen minutes. The proxy forwarding header is deliberately ignored; configure trusted proxy handling before relying on per-client IP limits behind a proxy.
- Security events record success/failure/logout without passwords, raw tokens or email addresses.
- `X-User-ID` is disabled by default. It requires `DEV_IDENTITY_ENABLED=true` and APP_ENV=development/test. It never overrides a cookie or works in staging/production.

## Configuration

Set `AUTH_ALLOWED_ORIGINS` to a JSON array containing the exact HTTPS frontend origin, for example `["https://crm.example.test"]`. There is no wildcard fallback. HTTPS is required for the session cookie, including staging. Cross-origin frontend deployment/CORS is not configured by this change; prefer a same-origin reverse proxy.

Apply the new `0007_password_sessions` migration on a disposable staging database first. Previous migrations are unchanged. Run `python -m pytest -q` and the existing PostgreSQL zero-to-head CI gate.

## Remaining IAM dependencies

PasswordCredential rows must be created by a subsequent invitation/email-verification flow. This slice deliberately adds no public registration endpoint or admin verification bypass. No account was created and no email sent. Organization-membership activation, invitation acceptance, email delivery, password reset, organization/case access integration, MFA and session management UI remain open. Existing User/Permission authorization is retained and the full organization model is not yet enforced by it.

Expired session/throttle cleanup needs an operations job. The current per-IP limiter can conservatively group users behind a reverse proxy; tune it using a verified trusted-proxy policy before public rollout. Full production readiness still depends on the canonical P0/UAT checklist.
