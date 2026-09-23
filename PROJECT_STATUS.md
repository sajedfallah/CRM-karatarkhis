# KARATARKHIS CRM — Project Status

## Current State
Current Epic: EPIC-001 FOUNDATION
Current Task: KRT-IAM-001
Branch: codex/canonical-v5-build
Base: feature/v5-backend-foundation
Environment: repository baseline only; no production deployment

## Task Status
KRT-FOUNDATION-001R: PARTIAL
KRT-FOUNDATION-002R: PASS
KRT-IAM-001: IN_PROGRESS
KRT-IAM-001A: PASS — identity/organization schema and ORM foundation; CI gate
verified on 2026-09-23 by GitHub Actions run 35802057875 at commit
`b772ddcc786c96cb0e3f9ef61b64c65c5b57ffa7`.

Next Subtask: KRT-IAM-001B

## KRT-FOUNDATION-002R — Automated QA + CI Foundation

**Status: PASS**

Implemented a canonical automated backend baseline:
- pytest + FastAPI TestClient fixtures with a disposable SQLite developer
  fallback and PostgreSQL CI configuration.
- Health and identity boundary tests.
- Customer tenant-isolation/IDOR regression tests for cases, tasks, and
  documents, including cross-tenant create denial.
- GitHub Actions CI with dependency installation, compile/import checks,
  PostgreSQL zero-to-head Alembic validation, pytest, and Gitleaks scan.
- Local commands documented in `docs/TEST_COMMANDS.md`.

Verification executed locally on 2026-09-23:
`python -m compileall -q app tests` — PASS
`python -m pytest -q` — **5 passed**

The PostgreSQL migration rehearsal is enforced by CI's disposable PostgreSQL
service. No credentials, production database, or live data were used.

**Next Task:** KRT-IAM-001 — Production Authentication, Organizations,
Memberships, Invitations, Email Confirmation, RBAC, and security event logs.

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

## Product Decisions Synced — 2026-09-22
تصمیم‌های جدید این جلسه به مستندات Canonical اضافه شدند:

- Organization model برای Internal/Customer
- Invite flow و Customer Admin user management
- Email + Password + Email Confirmation
- Organization + Case scope RBAC
- Audit/Security Logs
- Dev/Staging/Prod
- Feature Flags
- Observability
- Backup/Restore Drill
- Case calendar/reminders
- Admin/Customer dashboards
- In-App Notification Center + unread badge + deep links
- Admin Announcement Board
- Case completion satisfaction survey
- Global Search / Tags / Saved Views / Report templates
- Timeline-based Case UX
- Comments/attachments per stage
- Import declaration draft customer approval/correction
- Kotazh as primary operational reference after declaration
- Authorized route assignment
- GREEN/YELLOW/RED import workflow branches
- Actionable chart policy

این تغییرات Documentation/Specification هستند و به معنی پیاده‌سازی Runtime نیستند.

## Next Task
KRT-FOUNDATION-002R — Automated QA + CI Foundation
