# راهنمای اجرای پروژه توسط Codex

## روش صحیح

Codex نباید یک Prompt با عنوان «کل CRM را بساز» دریافت کند.

روش رسمی:
```text
Master Context
→ Current Status
→ One Atomic Task
→ Implementation
→ Tests
→ Diff Review
→ Status/Handoff
→ Next Task
```

## Prompt شروع Session

```text
PROJECT: KARATARKHIS CRM
MODE: CONTINUE

Repository:
sajedfallah/CRM-karatarkhis

Working Branch:
codex/canonical-v5-build

قبل از هر تغییر:
1. PROJECT_STATUS.md را بخوان.
2. AGENTS.md را بخوان.
3. docs/START_HERE.md را بخوان.
4. docs/AI_AGENT_CONTEXT.md را بخوان.
5. docs/MASTER_SPEC_FA.md را بخوان.
6. Git status و branch را بررسی کن.
7. فقط Task بعدی ثبت‌شده در PROJECT_STATUS.md را اجرا کن.
8. Business Rule جدید اختراع نکن.
9. Migrationهای 0001 تا 0004 را Rewrite نکن.
10. Production Deploy انجام نده مگر Task صریح داشته باشد.

در پایان:
STATUS
FILES CHANGED
MIGRATIONS
TESTS
SECURITY CHECKS
RISKS
NEXT COMMAND
را گزارش کن.
```

## قالب Task

```text
PROJECT-IMPLEMENT
Project: KARATARKHIS CRM
Repository: sajedfallah/CRM-karatarkhis
Scope: <scope>
Task: <KRT-ID>
Title: <title>

OBJECTIVE:
...

DEPENDENCIES:
...

REQUIREMENTS:
...

SCOPE:
...

OUT OF SCOPE:
...

DATABASE:
...

API:
...

FRONTEND:
...

WORKERS:
...

PERMISSIONS:
...

TESTS:
...

ACCEPTANCE CRITERIA:
...

DO NOT CHANGE:
...

END RESPONSE:
STATUS / FILES / MIGRATIONS / TESTS / RISKS / NEXT COMMAND
```

## وقتی Session جدید است

به Codex فقط لینک Repository و Prompt بالا را بده. لازم نیست تاریخچه ChatGPT را بدهی؛ Context لازم داخل Repository است.

## وقتی Task تمام شد

خروجی Codex باید Audit شود. سپس Task بعدی شروع شود. اگر Task PARTIAL/BLOCKED بود، مستقیم به Feature بعدی نرو.
