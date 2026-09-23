# KARATARKHIS CRM — Traceability Matrix

| Requirement | Target Module | Current V5 | Evidence/Gap | Test Status |
|---|---|---|---|---|
| IAM-BASE | Identity/Auth | PARTIAL | Users/Permissions exist; production auth missing | PARTIAL |
| IAM-ORG | Organization/Membership foundation | IMPLEMENTED | migration 0006_identity_access and ORM models | PASS |
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
| CMP-004 | Expiry Worker | MISSING | document expiry metadata only; no deterministic worker | NOT_STARTED |
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
| OPS-AUTH | Production Auth | MISSING | X-User-ID DEV/STAGING only | NOT_STARTED |

| IAM-INVITE | Organization/User Invitation | MISSING | invite/email confirmation/customer admin membership flow not implemented | NOT_STARTED |
| IAM-CASE-SCOPE | Customer Case Scope | MISSING | organization + selected-case access model not implemented | NOT_STARTED |
| AUD-CORE | Audit/Security Logs | PARTIAL | audit exists; comprehensive auth/security events incomplete | PARTIAL |
| OPS-FLAG | Feature Flags | MISSING | rollout control not implemented | NOT_STARTED |
| OPS-OBS | Observability | MISSING/PARTIAL | structured monitoring baseline incomplete | NOT_STARTED |
| OPS-BACKUP | Backup/Restore Drill | MISSING | production drill not established | NOT_STARTED |
| NTF-INAPP | In-App Notification Center | MISSING | unread badge/deep-link notifications not implemented | NOT_STARTED |
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
