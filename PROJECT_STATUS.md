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

## Documentation Pack
بسته مستندات فارسی برای Codex تکمیل و به Repository اضافه شد:
- AGENTS.md
- README.md Canonical
- CODEX_MASTER_PROMPT.md
- docs/START_HERE.md
- docs/MASTER_SPEC_FA.md
- docs/UI_REFERENCES.md
- docs/IMPLEMENTATION_ROADMAP_FA.md
- docs/CODEX_EXECUTION_GUIDE_FA.md
- docs/DECISIONS_FA.md
- UI/UX و AI Agent Context به‌صورت فارسی و با Referenceهای UI به‌روزرسانی شدند.

## Newly Approved Product Decision
نامه‌نگاری هوشمند به‌صورت **Template-First + AI-Assisted** قفل شد:
- Templateهای آماده برای موضوعات پرتکرار
- پیشنهاد Template توسط AI
- در صورت نبود Template، AI ابتدا Missing Information را می‌گیرد و سپس Draft تولید می‌کند
- Letter نهایی می‌تواند به Template Draft تبدیل شود
- Active Template فقط با Human/Admin Approval
- ارسال رسمی همیشه Human Review و در موارد حساس Approval دارد

این تصمیم در CORRESPONDENCE.md، MASTER_SPEC_FA.md، BUSINESS_RULES.md، TRACEABILITY_MATRIX.md و DECISIONS_FA.md ثبت شده است.

## Next Task
KRT-FOUNDATION-002R — Automated QA + CI Foundation
