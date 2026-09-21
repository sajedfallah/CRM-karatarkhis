# KARATARKHIS CRM — Canonical Architecture

## Current reconciliation
The repository contains two important architecture generations:
1. V4: Google Sheets + Apps Script + Drive + Telegram. Keep operationally as a migration bridge.
2. V5: FastAPI + SQLAlchemy 2 + PostgreSQL/Neon + Alembic. This is the canonical backend foundation.

## Target logical architecture
Frontend / Customer Portal / Telegram
→ HTTPS / Reverse Proxy
→ FastAPI modular monolith
→ PostgreSQL
→ Redis/Queue (planned)
→ private file storage / Google Drive adapter during migration
→ Workers: AI, Notification, Telegram, PDF, Export, Expiry

## Layering
API → Application Service → Domain/Business Rules → Repository/Data Access → PostgreSQL.

Core business rules must not live only in controllers or frontend code.

## Integration policy
- Google Sheets: migration/integration surface.
- Google Drive: accepted document repository during migration.
- Apps Script: legacy bridge only; do not expand it with new canonical domains unless required for production-critical maintenance.
- External calls should not hold long DB transactions.

## Events / Outbox target
Important mutations should create domain/outbox events in the same DB transaction. Planned events include CUSTOMER_CONFIRMED, CASE_SUBMITTED_TO_ADMIN, CASE_REOPENED, DOCUMENT_VERSION_CREATED, DOCUMENT_AI_CHECK_COMPLETED, HS_REVIEW_REQUIRED, PAYMENT_RECEIVED, EXPORT_PACKAGE_GENERATED and DOCUMENT_EXPIRY_ALERT_CREATED.

## Current version-drift blocker
Production cutover is BLOCKED until the exact live identity is pinned:
- `main` source states V4.26.
- V5 documentation states current production V4.9.2.
- audit work referenced an Apps Script V4.30 staging target.

Required before cutover: exact live Apps Script deployment/version + matching commit + production deployment identity.

## Branch policy
Canonical development branch: `codex/canonical-v5-build`, based on `feature/v5-backend-foundation`.
No wholesale merge of `codex/full-system-audit`.
