# KARATARKHIS CRM — Project Status

## Current State
Current Epic: CRM foundation / operations web UI
Current Task: KRT-CRM-UI-001 — customer registration and safe new-tab writes
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
KRT-IAM-001C backend slice: PASS (40 PostgreSQL tests; overall IAM remains partial).
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

Current task: UI-WEB initial read-only operations panel — PASS for this slice; full UI remains PARTIAL.
React/TypeScript/Vite, Tailwind, TanStack Query/Table/Router, self-hosted Vazirmatn.
Real API lists and counts, role-aware navigation, explicit detail fields,
loading/error/empty states. No fabricated records. 42 PostgreSQL backend tests,
3 frontend tests, TypeScript/Vite build and secret scan passed. Deployed browser
verification passed on the active Preview alias with the signed-in administrator.
HTML, hashed JS/CSS responses and real zero-count/empty states verified.
Runtime code SHA: 512eb353088aa8370537da8673296446db06d30c.
Forms, organization selector and full product UI
remain future slices.

compileall and git diff --check passed for the previous slices. Local pip downloads
timed out, so runtime pytest results come from PostgreSQL CI, not this workstation.
Do not claim complete frontend, complete organization IAM, or production readiness
from backend health alone.

## Active slice — customer registration UI
KRT-CRM-UI-001 / UI-WEB / CRM-001 / SEC-003: PASS for this slice; full CRM remains PARTIAL.
Admin-only create and rename customer dialogs use existing APIs with CSRF,
no automatic retries, pending guard and cache refresh after server success.
Server trims names and rejects whitespace-only/explicit-null names.
No schema migration. Case creation UI remains gated on canonical draft workflow.
46 PostgreSQL tests and 7 frontend tests, TypeScript/Vite build and secret scan
passed on 2df25a97c7cd14e89feaf7471be9692455da53dc.
New-tab session preparation uses authenticated no-store CSRF recovery, preserving
legacy sessions and existing tabs. Origin/CSRF validation remains mandatory.
No customer records were fabricated for live verification.

Browser verification: active administrator opened the deployed customer form;
new-tab CSRF preparation completed without re-login or error. No live record
was created by the agent. Create/rename persistence, audit, role denial, Origin,
CSRF recovery and logout revocation were exercised against disposable PostgreSQL
in CI. Runtime code: 2df25a97c7cd14e89feaf7471be9692455da53dc.
Next task: canonical case-draft foundation and resumable registration flow.

## Active correction — customer profile
CRM-CUSTOMER / UI-WEB: CI_PENDING. Extend create/edit/detail to include person/company,
identity/registration/tax identifiers, primary contact, phone/mobile/email, province,
city/postal/address. Name remains required; optional fields can be completed later.
Migration 0009 adds nullable columns; existing customers/sessions are preserved.
Plan: PostgreSQL/frontend CI, additive staging migration, deploy, browser form QA.
