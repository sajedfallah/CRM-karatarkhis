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
CRM-CUSTOMER / UI-WEB: PASS for the profile slice; full Customer 360 remains PARTIAL. Extend create/edit/detail to include person/company,
identity/registration/tax identifiers, primary contact, phone/mobile/email, province,
city/postal/address. Name remains required; optional fields can be completed later.
Migration 0009 adds nullable columns; existing customers/sessions are preserved.
Plan: PostgreSQL/frontend CI, additive staging migration, deploy, browser form QA.

Customer profile: 48 PostgreSQL tests, 8 frontend tests, TypeScript/Vite build
and secret scan PASS. Runtime candidate 188e67e132988d5fa1e7ffae6d83928b54795bba.
Additive Alembic-generated migration applied to isolated staging; schema 0009.

Profile deployment verified with the existing administrator/customer: details
include all new fields, editor preserves the previous name, contact/address
sections and save button render correctly, and write-session preparation completes.
The agent did not modify the real customer profile or create test records in staging.

## Active task — corporate documents and expiry notifications
DOC-CORE / CMP-001 / CMP-005 / NTF-INAPP: PASS for this corporate-document/in-app slice; full compliance remains PARTIAL. Private branch-scoped Neon
object storage, authenticated upload/download, immutable versions, POA date range,
configurable reminder window (30 days default), deduplicated per-recipient in-app
alerts and read state. 3 MiB PDF/JPEG/PNG cap. No AI extraction/malware-scan claim.
Expiry alerts refresh on the authenticated panel poll (60 seconds) and next visit;
background/offline email/push delivery and daily standalone worker remain future.
Vercel storage provisioning returned 403; existing Neon branch storage used.
Additive migration 0010 required; prior migrations unchanged.

Corporate documents: 53 PostgreSQL tests, 8 frontend tests, TypeScript/Vite build
and secret scan PASS. Runtime candidate 8e9760510e893295cc414eea01e3f77ee8f25f3e.
Staging upgraded with Alembic-generated SQL to 0010_customer_documents.
Private Neon bucket and scoped server credentials provisioned on staging only.
Live authenticated storage probe and upload-form readiness verified without
uploading a fabricated customer document. See docs/CUSTOMER_DOCUMENTS_FA.md.

Final runtime 8e9760510e893295cc414eea01e3f77ee8f25f3e deployed and verified:
customer document tab/deep link, upload fields, actual private-storage readiness,
notification bell and empty notification center. The agent uploaded no customer
file and modified no real profile. No independent offline scheduler is claimed.

## Active task — resumable case draft foundation
CASE-DRAFT / UI-WEB / SEC-003: PASS for initial drafts; full wizard remains PARTIAL. Separate draft records with bounded
initial operation/goods/shipment fields, idempotent creation/save replay, atomic
optimistic version checks and audit. Admin-only scope initially; no final-submit
command is exposed and no Case record is created. Web autosave/resume and
unsaved-navigation protection added. Full wizard/confirmation/submission remain.
Additive migration 0011 required; prior migrations unchanged.

Case draft runtime 631a7b6bdedcb74cbd4f70385a95a9c01b089358: 57 PostgreSQL
tests, 10 frontend tests, TypeScript/Vite build and secret scan PASS. Additive
migration 0011 applied to isolated staging using Alembic-generated SQL.
See docs/CASE_DRAFTS_FA.md for the explicit initial-draft scope.

Deployed /app/drafts verified with the existing administrator: menu, active
customer selector and saved-draft list load successfully. The agent created no
fabricated draft in staging. Save/resume/conflict/replay validation is PostgreSQL
CI evidence; final confirmation/submission workflows remain unimplemented.


Terminology correction (UI-WEB / CASE-DRAFT): initial case-data UI is labelled
«پرونده‌های در حال ثبت». External declaration draft upload/customer approval
(IMP-DRAFT) remains a separate missing workflow; no declaration sending or
customer approval is claimed. Existing draft IDs, API, content and autosave remain intact.


IMP-DRAFT / DOC-003 / SEC-004: declaration-review slice PASS for API/UI foundation; full import workflow PARTIAL. Private
immutable import-case file versions, explicit verified customer-manager recipient,
version-bound approval/correction with required comment, append-only decisions,
stale-version rejection and customer action inbox. No automatic EPS integration,
email delivery, customer enrollment or case final-submission implementation.
Migration 0012_declaration_review is additive. 62 PostgreSQL tests, 10 frontend tests, TypeScript/Vite build and secret scan PASS (CI 40535885618). Staging upgraded to 0012 with Alembic-generated SQL. Runtime e05eed0a3456fa89b05c4c0672e98fba7d079161.

Authenticated Preview verification: /app/declarations renders the separate menu,
import-case selector and honest empty state; /health/db returns 200. No real
case or file was fabricated. Runtime e05eed0a3456fa89b05c4c0672e98fba7d079161
was READY on the active Preview alias. Full customer workflow remains PARTIAL.


UI-WEB / IAM-INVITE / IMP-DRAFT: grouped case navigation and customer reviewer
enrollment PASS for this restricted slice; full customer portal PARTIAL. Case lists, registration drafts, declarations and documents
share an accessible disclosure. Admin-only email invitation creates a dedicated
DECLARATION_REVIEW permission, not generic customer data or delegation rights.
Customer activation still verifies email and consumes a one-use 24h token. Existing
accounts and general customer portal invitations remain outside this slice.
No migration. 66 PostgreSQL tests, 10 frontend tests, TypeScript/Vite build and secret scan PASS (CI 40538045883; runtime 5820a9bc4db3fd7f046a838563fd46528d4e1073). Authenticated Preview group collapse/reopen with Enter and reviewer invitation tab verified; no live email sent.

Preview verification: compact four-item navigation, keyboard disclosure and empty
reviewer invitation form load with the existing admin. No customer profile or
invitation was changed. /health/db returns 200. Full final submission remains open.


CASE-DRAFT / UI-WEB / SUB-001/002: registration-readiness diagnostics PASS for this read-only slice; full submission remains PARTIAL.
Read-only, exact saved-version initial-data checklist, latest customer corporate
document validity and explicit unimplemented canonical wizard dependencies.
Completing initial fields cannot enable final submission. No case/snapshot/customer
confirmation is fabricated. No migration; 69 PostgreSQL tests, 10 frontend tests, TypeScript/Vite build and secret scan PASS (CI 40540571845; runtime 8c6ea4758e02b34b3ba90a05c27224e752049b41). Authenticated Preview verified with existing saved draft version 9; no data changed.

Readiness runtime 8c6ea4758e02b34b3ba90a05c27224e752049b41 deployed READY.
Saved-version checklist and canonical missing-step list verified in browser;
existing draft stayed at version 9. Final submission remains unavailable.


PRD-HS / PRD-002/003/004: draft technical product details and explicit admin human
review PASS for draft-only slice; Product Master/final submission remain PARTIAL. Immutable review snapshots and source fingerprint plus monotonic
product revision invalidate reviews on material change, including change-and-revert.
No AI suggestion, Product Master promotion or final submission is claimed.
Additive migration 0013 applied to isolated staging. 72 PostgreSQL tests, 11 frontend tests, TypeScript/Vite build and secret scan PASS (CI 40594359687; runtime 3d0ef60a087ddf6b3f607b98d33a9f14348d2bd9). Authenticated Preview verified: technical fields, disabled incomplete-review action and existing draft version 9 preserved.

Product-review runtime 3d0ef60a087ddf6b3f607b98d33a9f14348d2bd9 deployed READY.
Technical form and human-review readiness verified in authenticated Preview.
No real HS value, review, customer record or draft edit was fabricated.

## Active slice — export shipment details
CASE-SHIPMENT / UI-WEB: implementation prepared; full shipment workflow remains PARTIAL.
Export drafts now include packaging type/count, total value/currency, driver mobile,
and vehicle/plate. The read-only saved-version checklist includes the existing
product, quantity, weight, customs and HS data plus a separate human-HS-review
check. Import/transit requirements are not inferred. These fields stay inside the
existing versioned draft JSON, so no migration or final-case creation is added.
Customer confirmation, immutable submission snapshot, final-submit lock, and
document linkage remain unavailable. PostgreSQL CI run 40596279931 passed: 73
backend tests, 11 frontend tests, TypeScript/Vite build, migration rehearsal and
secret scan. The code is deployed READY on the existing protected Preview alias
at commit 7273b710a7c15756f1de449457babc0b7af9286a. Staging schema stayed at 0013;
no real draft/customer was edited to test export fields.

## Active slice — exact document version links
DOC-CORE / CASE-DRAFT / SEC-004: implementation prepared; document governance remains PARTIAL.
Admin can attach a specific immutable corporate-document version belonging to
the draft's customer, or soft-detach it. Cross-customer IDs are denied; each
change advances the draft version and appends audit. Readiness and the draft UI
show the exact linked version and date-based validity without claiming document
authenticity, requirement sufficiency or customer approval. Migration 0014 is
additive; PostgreSQL CI, staging migration and protected-preview verification are
pending. No production data changed.

## Next wizard slice — proposed draft assignee
The draft form now offers an optional internal proposed assignee. The eligible
list and save-time validation require an active internal employee in the admin's
selected internal organization. Selection is stored only in versioned draft
JSON; it creates no CaseAssignment, case access grant or final Case. The
readiness view labels final assignment as a post-registration gap. No migration
is required. Backend organization-scope and API regressions plus a frontend
serialization regression were added; CI and Preview deployment are pending.
