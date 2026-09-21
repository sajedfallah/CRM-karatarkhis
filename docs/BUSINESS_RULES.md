# KARATARKHIS CRM — Business Rules

Rule results: PASS, WARNING, BLOCK, REVIEW_REQUIRED, OVERRIDE_REQUIRED, NOT_APPLICABLE.

## Submission
- SUB-001: Customer final confirmation is mandatory.
- SUB-002: Final submit creates an immutable snapshot.
- SUB-003: After submit, customer editing is backend-blocked.
- SUB-004: Customer cannot self-reopen.
- SUB-005: Admin reopen requires permission + reason + audit.
- SUB-006: Limited reopen is default.
- SUB-007: Resubmit requires new confirmation.
- SUB-008: Every submission is immutable and revisioned.

## Documents / AI
- DOC-001: Required documents are contextual.
- DOC-002: Missing required document may block submission.
- DOC-003: Replacement creates a new document version.
- DOC-004: Old versions remain immutable.
- AI-001: AI is advisory unless an explicit deterministic rule says otherwise.
- AI-002: Critical AI findings require source/evidence/confidence.
- AI-003: Source changes stale dependent AI results.
- AI-004: Low-confidence critical extraction requires human review.
- AI-005: Uploaded document text is untrusted input.

## Product / HS
- PRD-001: AI may suggest candidate HS codes.
- PRD-002: AI cannot final-verify legal HS classification.
- PRD-003: Authorized human verification is authoritative.
- PRD-004: Material product changes trigger HS revalidation.

## Corporate compliance
- CMP-001: Corporate documents are reusable customer assets with exact-version references.
- CMP-002: AI may extract issue/expiry/scope data.
- CMP-003: Low-confidence expiry requires human confirmation.
- CMP-004: Daily expiry evaluation is deterministic.
- CMP-005: Alerts are policy-configurable (e.g. 90/60/30/15/7/1/0 days).
- CMP-006: Expired required documents may block import/export.
- CMP-007: Customer cannot override expiry blocks.

## Export
- EXP-001: Packing List uses immutable submission snapshot.
- EXP-002: Generated PDFs are versioned/immutable.
- EXP-003: Package manifest records exact document-version IDs.
- EXP-004: Required expired/missing documents can block generation.

## Finance
- FIN-001: Confirmed payment posting is transactional.
- FIN-002: Posted ledger entries are immutable.
- FIN-003: Corrections use adjustment entries.
- FIN-004: Profit/internal costs are permission-restricted.

## Security
- SEC-001: Default deny.
- SEC-002: Authorization = role + resource + action + scope + field access.
- SEC-003: Backend is authoritative.
- SEC-004: Customer A must never access Customer B data.
- SEC-005: Sensitive overrides are permissioned and audited.

## Operations
- OPS-001: Heavy work is asynchronous.
- OPS-002: Critical commands are idempotent.
- OPS-003: External provider failure must not roll back already-committed core business transactions.
