# KARATARKHIS CRM — Project Status

## Current State
Current Epic: EPIC-001 FOUNDATION
Current Task: KRT-FOUNDATION-001R
Branch: codex/canonical-v5-build
Base: feature/v5-backend-foundation
Environment: repository baseline only; no production deployment

## Task Status
KRT-FOUNDATION-001R: PARTIAL

## Baseline
V5 backend foundation: FastAPI + SQLAlchemy 2 + PostgreSQL/Neon + Alembic.
Legacy V4: Google Sheets + Apps Script + Drive + Telegram, retained as migration bridge.

## Existing migrations
- 0001_initial_v5_schema
- 0002_case_sync_metadata
- 0003_tasks
- 0004_documents

These migrations are locked and were byte-identical by Git blob SHA between the base branch and canonical branch during this task.

## Verification performed
- canonical branch created directly from feature/v5-backend-foundation
- branch diff reviewed: documentation/status files only
- backend/app/main.py blob SHA unchanged from base
- Alembic migration 0001 blob SHA unchanged from base
- Alembic migration 0002 blob SHA unchanged from base
- Alembic migration 0003 blob SHA unchanged from base
- Alembic migration 0004 blob SHA unchanged from base
- existing health endpoints statically confirmed in backend/app/main.py: /health, /health/db, /health/sheets

No executable CI/pytest suite exists in the audited V5 baseline, so no claim of runtime automated-test execution is made. Establishing that capability is the next task.

## Production Cutover Blocker
Version identity mismatch:
- main: V4.26
- V5 docs: production V4.9.2
- audit target: V4.30 staging

Exact live deployment/version/commit must be pinned before production migration.

## Completed in this task
- canonical branch created
- canonical documentation baseline established
- V5 current-state matrix established
- traceability baseline established
- migration delta priorities documented
- V4 kept intact
- no production deployment
- no live customer-data migration
- no wholesale PR #4 merge

## Known P0 Gaps
- automated V5 test/CI foundation
- real production authentication
- canonical document version/file model
- worker/queue architecture
- customer submission confirmation/lock/reopen
- security regression suite

## Remaining verification
Runtime health/migration execution was not rerun in this task because the V5 baseline has no verified automated test/CI runner in-repository. Static route/migration integrity and branch diff verification passed. This is the only reason the task remains PARTIAL.

## Next Task
KRT-FOUNDATION-002R — Automated QA + CI Foundation
