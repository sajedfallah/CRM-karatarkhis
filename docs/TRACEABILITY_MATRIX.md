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
