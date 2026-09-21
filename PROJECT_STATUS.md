# KARATARKHIS CRM — Project Status

## Current State
Current Epic: EPIC-001 FOUNDATION
Current Task: KRT-FOUNDATION-001R
Branch: codex/canonical-v5-build
Base: feature/v5-backend-foundation
Environment: repository baseline only; no production deployment

## Task Status
KRT-FOUNDATION-001R: IN_PROGRESS

## Baseline
V5 backend foundation: FastAPI + SQLAlchemy 2 + PostgreSQL/Neon + Alembic.
Legacy V4: Google Sheets + Apps Script + Drive + Telegram, retained as migration bridge.

## Existing migrations
- 0001_initial_v5_schema
- 0002_case_sync_metadata
- 0003_tasks
- 0004_documents

These migrations are locked and must not be rewritten.

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

## Known P0 Gaps
- automated V5 test/CI foundation
- real production authentication
- canonical document version/file model
- worker/queue architecture
- customer submission confirmation/lock/reopen
- security regression suite

## Next Task
KRT-FOUNDATION-002R — Automated QA + CI Foundation
