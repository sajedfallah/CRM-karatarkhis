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

## Deletion
No hard delete for cases, submission snapshots, document versions, posted finance, audit, stage history, sent official correspondence or human AI decisions.
