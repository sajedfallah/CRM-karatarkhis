# KARATARKHIS CRM — Traceability Matrix

| Requirement | Target Module | Current V5 | Evidence/Gap | Test Status |
|---|---|---|---|---|
| IAM-BASE | Identity/Auth | PARTIAL | Users/Permissions exist; production auth missing | PARTIAL |
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
| LTR-001 | Smart Correspondence | MISSING | not implemented | NOT_STARTED |
| EXP-001 | Packing List Snapshot | MISSING | not implemented | NOT_STARTED |
| EXP-003 | Export Package Manifest | MISSING | not implemented | NOT_STARTED |
| UI-WEB | Persian RTL Web App | MISSING | no canonical web frontend | NOT_STARTED |
| OPS-CI | Automated CI | MISSING | no verified GitHub Actions baseline | NOT_STARTED |
| OPS-AUTH | Production Auth | MISSING | X-User-ID DEV/STAGING only | NOT_STARTED |
