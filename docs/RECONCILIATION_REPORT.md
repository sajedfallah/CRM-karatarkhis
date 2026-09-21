# Canonical V5 Reconciliation Report

## Baseline
Branch `codex/canonical-v5-build` was created from `feature/v5-backend-foundation`.

## Decisions
- V5 FastAPI/PostgreSQL/Alembic foundation is retained.
- V4 Apps Script/Sheets/Drive remains an operational migration bridge and is not deleted or rewritten by this task.
- PostgreSQL is the target Source of Truth.
- Google Sheets becomes migration/integration surface.
- Google Drive may remain document storage during the migration.
- `codex/full-system-audit` is evidence/reference only; no wholesale merge is permitted.

## Production cutover blocker
Version identity must be reconciled:
- main says V4.26;
- V5 docs say current production V4.9.2;
- legacy audit references V4.30 staging.
Cutover requires exact live deployment/version/commit mapping.

## Migration delta priorities
1. automated QA/CI;
2. production authentication;
3. RBAC/field-scope expansion;
4. immutable document versions/file objects;
5. case draft/workflow;
6. queue/worker foundation;
7. AI/product/HS;
8. customer submission confirmation/lock/reopen;
9. compliance/expiry;
10. finance/communication/export/frontend;
11. security hardening, migration rehearsal and go-live.

No production deployment or live data migration occurred in this task.
