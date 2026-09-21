# KARATARKHIS CRM — AI Agent Context

## Authority
This branch is the canonical V5 build baseline. Product behavior is governed by the approved CASE-STRUCTURE-001..022 specification and the canonical files under `docs/`.

## Architecture position
- V4 Google Sheets + Apps Script + Drive + Telegram = **Legacy Operational Bridge**.
- V5 FastAPI + PostgreSQL/Neon + Alembic = **Canonical Backend Target**.
- PostgreSQL = future transactional Source of Truth.
- Google Sheets = migration/integration/reporting surface, not the final security boundary or authoritative transactional store.
- Google Drive remains an accepted document store during migration; binary migration is not required by this baseline task.

## Locked rules
1. Customer final confirmation before final submission.
2. Submitted customer data/documents become customer-locked.
3. Customer cannot self-reopen; authorized Admin/Manager only.
4. Reopen requires reason; limited reopen preferred.
5. Resubmission requires a new confirmation and immutable revision.
6. Documents are versioned; previous versions are never overwritten.
7. AI results become stale when source data changes.
8. AI can recommend HS codes; final sensitive classification remains human-authorized.
9. Corporate document expiry is deterministic/rule-driven after extraction.
10. Export Packing List and package derive from immutable submission snapshots.
11. Posted finance records are not edited directly; use adjustments.
12. Customer isolation and backend authorization are mandatory.
13. Internal communication must never leak to customer views.
14. Sensitive overrides require permission + reason + audit.
15. AI/Telegram/PDF failures must not crash core CRM.

## Agent working rules
- Read `PROJECT_STATUS.md` first.
- Inspect existing implementation before editing.
- Work one scoped task at a time.
- Do not rewrite existing Alembic migrations.
- Do not delete V4 during migration.
- No production deploy or live-data migration without an explicit task and approval.
- Do not wholesale merge `codex/full-system-audit`; evaluate individual changes separately.
- If a critical requirement is ambiguous, stop that part and report it instead of guessing.
