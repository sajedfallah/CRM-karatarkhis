# KARATARKHIS CRM — Project Status

## Current State
Current Epic: EPIC-001 FOUNDATION / Identity & Access
Current Task: KRT-IAM-001C — organization and selected-case authorization
Working Branch: codex/iam-session-auth-20261027
Canonical Base: codex/canonical-v5-build
Environment: isolated Neon staging + Vercel Preview; no production cutover

## Verified baseline — 2026-10-27
- KRT-FOUNDATION-002R: PASS — automated QA/CI foundation.
- KRT-IAM-001A: PASS — organization and identity schema.
- KRT-IAM-001B session/internal enrollment slice: PASS.
- KRT-IAM-001 overall: IN_PROGRESS.

Password/session runtime includes Argon2id, verified-email binding, hashed opaque
sessions, Secure/HttpOnly/SameSite cookies, Origin/CSRF checks, revocation and
persistent atomic throttles. X-User-ID is explicit opt-in in development/test only.
Internal enrollment uses one-time 24-hour invitation tokens and Resend.
Auth utility pages /activate, /login and /account are deployed; they are not the
final React operations frontend.

31 PostgreSQL/API tests and CI secret scan passed at
867cd57c888051b91b9436fc191db85a84d027a0.
Isolated Neon staging-iam-20261027 was upgraded to 0007 with Alembic-generated SQL.
Live /health and /health/db returned 200 with APP_ENV=staging.
The initial invitation was located in Spam. Database evidence now confirms one
accepted invitation, one verified account and one successful real-user login.
No password or raw invitation token was read or stored in repository artifacts.
The staging bootstrap secret was disabled after sending the invitation.

## Current implementation
KRT-IAM-001C: CI_PENDING.
Requirement IDs: IAM-ORG, IAM-CASE-SCOPE, SEC-004, AUD-CORE.

Implemented:
- session-bound Membership identity without mutating the global User;
- per-request membership/organization/customer activation checks;
- exact customer-organization binding;
- selected-case grants for cases/tasks/documents and restricted creation;
- role/profile permission filtering for the selected organization;
- organization and membership management API with delegation ceilings;
- required reason and audit for sensitive membership changes;
- migration 0008_session_org_scope, with all earlier migrations unchanged.

Plan: isolated CI branch → PostgreSQL tests → Alembic-generated staging upgrade
→ deploy tested code on the existing Preview branch. Preserve the current admin
session where the legacy membership selection is unambiguous.

## Remaining IAM and product work
- customer invitations and existing-account invitation acceptance;
- organization selection UX, password reset and MFA;
- durable email queue/retry and production sender configuration;
- Persian RTL React operations frontend;
- canonical CRM/workflow/documents/submission governance/finance/communication,
  AI and export P0 milestones;
- migration rehearsal, backup/restore, complete security audit and UAT.

V4 remains a legacy operational bridge. The user explicitly selected V5 web
completion and migration as the target. No live customer data was migrated.
The full roadmap and product authority remain docs/MASTER_SPEC_FA.md,
docs/IMPLEMENTATION_ROADMAP_FA.md and docs/TRACEABILITY_MATRIX.md.

## Local verification limits
Organization scope slice: PASS — 40 PostgreSQL CI tests and secret scan passed
on 9668fc10b2559207d8b972c0924cde8d6a71a27f. Staging migration 0008 applied.
The initial administrator accepted the invitation and completed a real login.

Current task: UI-WEB initial read-only operations panel — IN_PROGRESS.
React/TypeScript/Vite, Tailwind, TanStack Query/Table/Router, self-hosted Vazirmatn.
Real API lists and counts, role-aware navigation, explicit detail fields,
loading/error/empty states. No fabricated records. 42 PostgreSQL backend tests,
3 frontend tests, TypeScript/Vite build and secret scan passed. Deployed browser
verification remains pending. Forms, organization selector and full product UI
remain future slices.

compileall and git diff --check passed for the previous slices. Local pip downloads
timed out, so runtime pytest results come from PostgreSQL CI, not this workstation.
Do not claim complete frontend, complete organization IAM, or production readiness
from backend health alone.
