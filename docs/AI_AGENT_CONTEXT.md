# Context اصلی Agent هوش مصنوعی — KARATARKHIS CRM

این فایل برای Codex/Claude/Agentها مرجع اجباری است.

## موقعیت پروژه

کاراترخیص یک Customs Clearance Case/Operations Management Platform است.

معماری فعلی:
- V4 = Google Sheets + Apps Script + Drive + Telegram، فقط Legacy Operational Bridge
- V5 = FastAPI + PostgreSQL/Neon + Alembic، Backend رسمی آینده
- Frontend نهایی = React + TypeScript + Vite + Tailwind v4 + shadcn/ui

PostgreSQL باید در Cutover نهایی Source of Truth شود.

## Product Authority

ترتیب اعتبار:
1. Business Ruleهای Canonical
2. MASTER_SPEC_FA.md
3. اسناد Domain در docs/
4. Task فعال
5. مراجع بیرونی UI

اگر تعارض وجود داشت، Reference خارجی هیچ‌وقت بر Specification کاراترخیص غلبه نمی‌کند.

## مرجع‌های UI

Primary:
Atomic CRM — https://github.com/marmelab/atomic-crm

Secondary:
BottleCRM — https://github.com/mj-pagani/BottleCRM

Optional:
Krayin CRM — https://github.com/krayin/laravel-crm

از این‌ها فقط برای UX/UI/interaction pattern استفاده کن. Backend، DB model یا Business Logic آن‌ها را خودکار وارد پروژه نکن.

## Business Ruleهای قفل‌شده

1. Customer قبل از Final Submit باید تأیید کند.
2. Submit یک Snapshot immutable می‌سازد.
3. بعد از Submit، Customer edit قفل است.
4. Customer حق self-reopen ندارد.
5. Reopen فقط نقش مجاز + Reason + Audit.
6. Limited Reopen بر Full Reopen اولویت دارد.
7. Resubmit نیاز به Confirmation جدید دارد.
8. Submission revision immutable است.
9. Document replacement = Version جدید، نه overwrite.
10. Source change باید AI result وابسته را STALE کند.
11. AI می‌تواند HS پیشنهاد دهد ولی final sensitive classification انسانی است.
12. Low-confidence critical AI result نیازمند Human Review است.
13. Expiry rule deterministic است.
14. Packing List/Export Package از immutable submission revision ساخته می‌شود.
15. Posted ledger مستقیم edit نمی‌شود.
16. Customer isolation اجباری است.
17. Internal content نباید به Customer نشت کند.
18. Backend مرجع نهایی permission است.
19. Sensitive override = permission + reason + audit.
20. خرابی AI/Telegram/PDF نباید Core CRM را از کار بیندازد.

## قواعد مهندسی

- Migrationهای قبلی Rewrite نشوند.
- Business rule داخل Frontend تنها مرجع نباشد.
- External API داخل transaction طولانی اجرا نشود.
- Heavy work async باشد.
- Critical commandها idempotent باشند.
- Mutable critical records optimistic concurrency داشته باشند.
- Audit/History حساس hard-delete نشود.
- Secret داخل Git/Log/Prompt قرار نگیرد.

## روش اجرای Task

قبل:
- PROJECT_STATUS
- AGENTS
- START_HERE
- MASTER_SPEC
- Domain docs
- current code
- dependencies

بعد:
- implementation
- tests
- permission/security tests
- diff review
- docs/status/traceability update
- handoff

## قانون Ambiguity

اگر Requirement حساس مبهم بود:
حدس نزن.
AMBIGUITY + OPTIONS + RECOMMENDATION + BLOCKING را گزارش کن.
