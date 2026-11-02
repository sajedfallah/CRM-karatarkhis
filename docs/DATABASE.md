# KARATARKHIS CRM — Database Canonical Model

## Existing V5 baseline
Existing migrations must remain immutable:
- 0001_initial_v5_schema
- 0002_case_sync_metadata
- 0003_tasks
- 0004_documents

Existing implemented domains include Customers, Users, Permissions, Cases, Assignments, Tasks, Task Messages, Documents and Audit Logs.

## Canonical target additions
Identity: roles, role_permissions, user_roles, user_permission_overrides, teams, sessions.
CRM: referrals, leads, lead_contact_logs, customer_contacts, tags.
Product: products, product_hs_classifications.
Case: case_drafts, case_draft_payloads, case_submissions, case_reopen_requests, shipments.
Workflow: workflow_templates/versions/stages/substages, stage history, blockers, holds, exceptions, checklists.
Task/SLA: task dependencies/collaborators/comments, sla policies/instances, calendars.
Documents: document_types, document_versions, file_objects, extractions, findings, requirements, expiry policies/alerts.
Finance: costs/categories, payments, invoices/lines, ledger entries, adjustments, approvals.
Communication: threads/messages/attachments, notifications, alerts, telegram_links.
Correspondence: letters, letter_versions, templates, approvals, threads.
AI: ai_requests/results/reviews, prompt/model versions, knowledge_items.
Export: export_shipments, generated_packing_lists, export_document_packages, export_package_documents.
System: domain_events, outbox_events, background_jobs, idempotency_keys, timeline_events, automation rules/executions.

## Migration deltas
The existing V5 `documents` model is only a foundation; canonical implementation requires true immutable document versions and separate file objects before AI/submission-lock work.
Existing V5 auth/permission tables must be extended, not replaced blindly.
Legacy Google Sheet IDs should be preserved as stable business identifiers where valid.

Migration 0014 adds `draft_corporate_document_links`, a restricted FK association
from a resumable case draft to one exact immutable customer corporate-document
version. Detach is soft and audited; it never deletes a stored file/version.

Migration 0015 adds `draft_customer_reviews`, an immutable copy of one safe,
customer-facing draft version plus one recipient-bound decision. The customer
cannot query another membership's review. This is a pre-finalization review
record; it does not create `Case`, `CaseAssignment`, submission lock, or final
confirmation.

## Deletion
No hard delete for cases, submission snapshots, document versions, posted finance, audit, stage history, sent official correspondence or human AI decisions.

## Customer profile — migration 0009_customer_profile
Nullable fields on customers: customer_type (person/company), national_id,
registration_number, economic_code, contact_name, phone, mobile, email,
province, city, postal_code, address. IDs/phone/postal values are strings so
leading zeroes are preserved. Persian/Arabic digits normalize to ASCII.
Existing rows retain NULL for unknown values. No identity or tax-verification
claim is inferred from a populated field. Multiple contacts remain a separate
Customer 360 milestone. Profile reads/writes remain admin-only through the
existing customer endpoints; no contact data is added to public pages or logs.
