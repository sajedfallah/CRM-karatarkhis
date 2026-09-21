# راهنمای اجباری Agentهای کدنویسی — KARATARKHIS CRM

این فایل برای Codex، Claude Code، Cursor Agent و هر عامل خودکار دیگری که روی این مخزن کار می‌کند اجباری است.

## قانون شماره ۱

قبل از هر تغییر، به این ترتیب بخوان:

1. `PROJECT_STATUS.md`
2. `docs/START_HERE.md`
3. `docs/AI_AGENT_CONTEXT.md`
4. `docs/MASTER_SPEC_FA.md`
5. سند دامنه مرتبط با Task
6. `docs/TRACEABILITY_MATRIX.md`

## نقش Agent

تو «مجری پیاده‌سازی» هستی، نه طراح محصول. تصمیم‌های محصول و Business Ruleهای ثبت‌شده در مستندات Canonical مقدم بر ترجیح شخصی تو هستند.

## معماری رسمی

- V4 مبتنی بر Google Sheets + Apps Script + Drive + Telegram = پل عملیاتی Legacy
- V5 مبتنی بر FastAPI + PostgreSQL/Neon + Alembic = Backend رسمی آینده
- PostgreSQL = Source of Truth هدف
- Google Sheets = سطح Migration/Integration/Reporting
- Google Drive = مخزن قابل قبول اسناد در دوره مهاجرت
- Frontend هدف = React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui

## مرجع UI

- Primary: Atomic CRM — https://github.com/marmelab/atomic-crm
- Secondary: BottleCRM — https://github.com/mj-pagani/BottleCRM
- Optional: Krayin CRM — https://github.com/krayin/laravel-crm

این پروژه‌ها فقط مرجع الگو، UX و اجزای مناسب هستند. Backend/Stack آن‌ها را بدون Task صریح وارد نکن.

## قواعد غیرقابل تغییر بدون تأیید

- Customer confirmation قبل از Final Submit
- Lock بعد از Submit
- Reopen فقط توسط نقش مجاز و با دلیل
- Revision و Document Version immutable
- AI حق تصمیم نهایی HS/Finance/Permission/Close Case را ندارد
- Customer isolation اجباری
- Internal content نباید به Customer نشت کند
- Posted Ledger مستقیم Edit نمی‌شود
- Packing List و Export Package از Snapshot immutable ساخته می‌شوند
- Sensitive override = permission + reason + audit

## روش کار

برای هر Task:
1. وضعیت branch و Git را بررسی کن.
2. Task را به Requirement IDها نگاشت کن.
3. Dependencyها را تأیید کن.
4. طرح کوتاه اجرای خودت را بنویس.
5. فقط Scope همان Task را تغییر بده.
6. Migration قبلی را Rewrite نکن.
7. Test بنویس و اجرا کن.
8. Diff خودت را Review کن.
9. `PROJECT_STATUS.md` و Traceability را به‌روزرسانی کن.
10. نتیجه را با PASS / PARTIAL / BLOCKED / FAIL گزارش کن.

هیچ‌وقت برای سبز کردن Test، Security یا Business Rule را تضعیف نکن.
