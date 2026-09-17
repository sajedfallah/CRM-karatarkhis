# Karatarkhis CRM V5 Documentation Index

این پوشه مرجع مستندات V5 برای توسعه‌دهندگان، DevOps و ذی‌نفعان عملیاتی است.

## اسناد اصلی

- [V5 Technical & Operations](V5_TECHNICAL_AND_OPERATIONS.md) — معماری، Backend، Infrastructure، Integration، Security و Dependencies
- [V5 Actions & Decisions](V5_ACTIONS_AND_DECISIONS.md) — اقدامات انجام‌شده و Architecture Decision Log
- [V5 Migration Guide](V5_MIGRATION_GUIDE.md) — مهاجرت، Seed/Import، Rollout و Rollback
- [V5 QA Report](V5_QA_REPORT.md) — تست‌های انجام‌شده، شواهد، Gapها و Production Gate
- [Project CHANGELOG](../CHANGELOG.md) — تغییرات نسخه، fixes، known limitations و breaking changes
- [Root README](../README.md) — نمای کلی وضعیت پروژه
- [Backend README](../backend/README.md) — راهنمای اجرا و API Backend

## Tracking

تمام workstream فعلی V5 تحت [PR #1](https://github.com/sajedfallah/CRM-karatarkhis/pull/1) نگهداری می‌شود. Issue مستقل برای این workstream در Repository ثبت نشده است.

## وضعیت فعلی

- Version: `5.0.0-dev`
- Environment: Development / Vercel Preview
- DB: Neon PostgreSQL
- Migration: `0004_documents`
- DEV data: intentionally empty after reset
- Production V4.9.2: unchanged
- PR #1: Draft

## Production Readiness

این نسخه هنوز Production-ready نیست. Real authentication، automated CI/tests، dependency locking، Google runtime credentials، backup/restore rehearsal و production migration rehearsal باید قبل از Release نهایی تکمیل شوند.
