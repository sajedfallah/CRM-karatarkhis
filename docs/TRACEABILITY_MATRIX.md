# KARATARKHIS CRM — Traceability Matrix

| Requirement | Target Module | Current V5 | Evidence/Gap | Test Status |
|---|---|---|---|---|
| IAM-BASE | Identity/Auth | PARTIAL | Users/Permissions exist; production auth missing | PARTIAL |
| IAM-ORG | Organization/Membership foundation | IMPLEMENTED | migration 0006_identity_access and ORM models; CI run 35802057875 verified PostgreSQL zero→head | PASS |
| SEC-004 | Customer Isolation | PARTIAL | server-side tenant/scope logic exists; automated IDOR suite missing | UNTESTED |
| CRM-CUSTOMER | Customer | IMPLEMENTED-PARTIAL | customer backend foundation exists; 360/contacts incomplete | PARTIAL |
| CASE-CORE | Case/Assignment | IMPLEMENTED | V5 case + assignments exist | PARTIAL |
| TASK-CORE | Tasks/Messages | IMPLEMENTED | migration 0003 and API exist | PARTIAL |
| DOC-CORE | Documents | PARTIAL | metadata/approval/expiry exists; immutable version/file model incomplete | PARTIAL |
| AI-CORE | AI Orchestration | MISSING | no canonical AI request/result worker stack | NOT_STARTED |
| PRD-HS | Product/HS | MISSING | canonical product/HS domain absent | NOT_STARTED |
| SUB-001 | Customer Confirmation | MISSING | no final confirmation command | NOT_STARTED |
| SUB-003 | Submission Lock | MISSING | no immutable submission/lock model | NOT_STARTED |
| SUB-005 | Admin Reopen | MISSING | no limited reopen/revision workflow | NOT_STARTED |
| CMP-004 | Expiry Worker | PARTIAL | Deterministic expiry service and panel materialization; independent daily worker not wired | PARTIAL |
| FIN-CORE | Finance Ledger | MISSING | canonical finance domain absent | NOT_STARTED |
| COM-CORE | Communication Hub | MISSING | V5 full communication/notification engine absent | NOT_STARTED |
| COM-TG | Telegram V5 | PARTIAL/MISSING | legacy V4 bot exists; V5 adapter incomplete | NOT_STARTED |
| LTR-001 | Smart Correspondence / Template-first | MISSING | template library + AI-assisted draft not implemented | NOT_STARTED |
| LTR-002 | Template Recommendation | MISSING | search/recommendation flow not implemented | NOT_STARTED |
| LTR-003 | Missing Information Gate | MISSING | NEEDS_INFORMATION structured flow not implemented | NOT_STARTED |
| LTR-005 | Human Review | MISSING | outbound review workflow not implemented | NOT_STARTED |
| LTR-008 | Versioned Templates | MISSING | template/version data model not implemented | NOT_STARTED |
| LTR-009 | AI Draft → Template Draft | MISSING | reusable template promotion workflow not implemented | NOT_STARTED |
| EXP-001 | Packing List Snapshot | MISSING | not implemented | NOT_STARTED |
| EXP-003 | Export Package Manifest | MISSING | not implemented | NOT_STARTED |
| UI-WEB | Persian RTL Web App | MISSING | no canonical web frontend | NOT_STARTED |
| OPS-CI | Automated CI | IMPLEMENTED | `.github/workflows/ci.yml`: compile/import, PostgreSQL zero→head migration, pytest, Gitleaks | PASS (local pytest: 5 passed; remote GitHub Actions verified green) |
| OPS-AUTH | Production Auth | PARTIAL | password/session runtime tested; enrollment and organization integration remain open | PARTIAL |
| IAM-SESSION | Revocable cookie sessions | IMPLEMENTED | migration 0007; CSRF/expiry/revocation/rate-limit regressions; PostgreSQL CI and isolated staging verified | PASS |

| IAM-INVITE | Organization/User Invitation | PARTIAL | Internal activation tested in PostgreSQL CI; initial admin email accepted by Resend; customer enrollment and organization authorization remain open | PARTIAL (31 tests PASS; user activation pending) |
| IAM-CASE-SCOPE | Customer Case Scope | MISSING | organization + selected-case access model not implemented | NOT_STARTED |
| AUD-CORE | Audit/Security Logs | PARTIAL | audit exists; comprehensive auth/security events incomplete | PARTIAL |
| OPS-FLAG | Feature Flags | MISSING | rollout control not implemented | NOT_STARTED |
| OPS-OBS | Observability | MISSING/PARTIAL | structured monitoring baseline incomplete | NOT_STARTED |
| OPS-BACKUP | Backup/Restore Drill | MISSING | production drill not established | NOT_STARTED |
| NTF-INAPP | In-App Notification Center | PARTIAL | Recipient-bound expiry alerts, unread badge/read state and customer-document deep links implemented; other event types pending | PARTIAL |
| ANN-HOME | Customer Home Announcements | MISSING | targeted/scheduled announcement board not implemented | NOT_STARTED |
| CASE-TIMELINE | Stage Timeline | MISSING/PARTIAL | current Case backend lacks canonical stage timeline UX/model | NOT_STARTED |
| CASE-COMMENT | Stage Comments | MISSING | customer-visible/internal stage threads not implemented | NOT_STARTED |
| IMP-DRAFT | Declaration Draft Approval | MISSING | customer approve/correction workflow absent | NOT_STARTED |
| IMP-KOTAZH | Kotazh Operational Reference | MISSING | post-declaration reference workflow absent | NOT_STARTED |
| IMP-ROUTE | Green/Yellow/Red Workflow | MISSING | branch workflow absent | NOT_STARTED |
| CSAT-CASE | Case Satisfaction Survey | MISSING | closure survey/reporting absent | NOT_STARTED |
| SRCH-GLOBAL | Global Search | MISSING | permission-aware unified search absent | NOT_STARTED |
| RPT-TEMPLATES | Report Templates | MISSING | admin/customer operational reports absent | NOT_STARTED |
| UI-CHARTS | Actionable Dashboard Charts | MISSING | admin/customer chart policy not implemented | NOT_STARTED |

## Current UI slice (2026-10-27)

UI-WEB / SEC-004: PARTIAL. 42 backend PostgreSQL tests, 3 frontend tests and Vite/TypeScript build passed. Deployed browser verification passed on the active Preview alias with the signed-in administrator. Hashed JS/CSS return 200; real empty lists render. Initial Persian RTL read-only React
panel at /app uses existing authenticated API lists, session identity, real counts,
search/sort and explicit detail fields. Server authorization remains authoritative.
Panel route and asset boundary tests plus frontend request/CSRF tests added.
CRUD workflows, complete canonical screens and UAT remain outstanding.

## Customer registration UI slice
UI-WEB / CRM-001 / SEC-003: PARTIAL; 46 PostgreSQL tests, 7 frontend tests and build PASS. Admin customer create/rename
form with session-bound CSRF recovery for new tabs, input validation, pending/error/success handling; backend
permission and audit regression tests. Full Customer 360 and case wizard remain.

Customer form deployment and authenticated new-tab CSRF preparation verified
in-browser on the active Preview alias. Live create/rename was not performed
with fabricated customer data; persistence/audit/authorization verified in CI.

CRM-CUSTOMER profile slice: PARTIAL; 48 backend tests, 8 frontend tests and build PASS. Persistent identity/contact/address fields,
create/edit/detail UI, digit normalization, email validation and admin-only writes.
Full multiple-contact Customer 360 remains out of this slice.

Customer profile runtime 188e67e132988d5fa1e7ffae6d83928b54795bba deployed;
existing-customer details/edit form and all contact/address sections verified
in-browser. Staging schema 0009. Persistence/clear/partial-update tests PASS.

Corporate-document/notification slice: PARTIAL; 53 PostgreSQL tests and 8 frontend tests PASS. Private immutable file versions
with effective/expiry dates, recipient-bound deduplicated expiry alerts, badge and
customer-context link. Panel polling implements in-app freshness; independent
daily worker/offline delivery remain incomplete (CMP-004 stays PARTIAL).

Corporate runtime 8e9760510e893295cc414eea01e3f77ee8f25f3e: deployed tab,
private-storage readiness, upload fields and notification center verified in browser.

Case-draft foundation slice: PARTIAL; 57 PostgreSQL tests, 10 frontend tests and build PASS. Persistent resumable initial drafts,
optimistic conflict handling, idempotent replay, backend validation and no new
submission bypass. Full canonical registration wizard and customer confirmation
remain PARTIAL/NOT_STARTED until their own command workflows are implemented.

Initial draft runtime 631a7b6bdedcb74cbd4f70385a95a9c01b089358 deployed;
menu, real customer selection and draft listing verified in browser.


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

CASE-SHIPMENT / EXP-001: export shipment data capture implemented as a draft-only
slice. Packaging, package count, total value/currency, driver mobile and vehicle
identifier persist in the resumable draft; readiness checks them alongside
product/quantity/weights/customs/HS and explicit human HS review. Import and transit
shipment requirements remain undefined and are not guessed. No final submission,
snapshot, lock or migration is introduced. PostgreSQL CI run 40596279931 passed
with 73 backend tests, 11 frontend tests, TypeScript/Vite build, migration
rehearsal and secret scan. Preview commit 7273b710a7c15756f1de449457babc0b7af9286a
is READY. Existing draft/customer data was not edited for export verification.

