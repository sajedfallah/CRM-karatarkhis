# دفتر تصمیم‌های کاراترخیص

این سند تصمیم‌های مهمی را که نباید در Sessionهای مختلف Agent فراموش شوند ثبت می‌کند.

## DEC-001 — نوع محصول
کاراترخیص Generic CRM نیست؛ Customs Clearance Case/Operations Management است.

## DEC-002 — Backend
FastAPI + PostgreSQL/Neon + SQLAlchemy + Alembic حفظ می‌شود. Backend از صفر Rewrite نمی‌شود.

## DEC-003 — Legacy
V4 Google Sheets/Apps Script/Drive/Telegram تا Cutover به‌عنوان Legacy Operational Bridge حفظ می‌شود.

## DEC-004 — Source of Truth
هدف نهایی PostgreSQL است. Google Sheets سطح Migration/Integration/Reporting است.

## DEC-005 — Frontend
Frontend جدید مستقل و مدرن با React + TypeScript + Vite + Tailwind v4 + shadcn/ui ساخته می‌شود.

## DEC-006 — UI Reference
Atomic CRM مرجع اصلی UI است؛ BottleCRM مرجع ثانویه Functional UX؛ Krayin مرجع اختیاری Admin/CRM pattern.

## DEC-007 — UI Identity
هیچ پروژه مرجع نباید عیناً Clone شود. Visual Identity کاراترخیص اختصاصی است: Persian RTL + Modern Enterprise Operations.

## DEC-008 — Customer Confirmation
Final Submit بدون Customer Confirmation ممنوع است.

## DEC-009 — Submission Lock
بعد از Submit، Customer editing قفل می‌شود؛ Admin Limited Reopen با Reason امکان‌پذیر است.

## DEC-010 — Documents
Document Version immutable است. Replace = Version جدید.

## DEC-011 — AI
AI Assistant است؛ تصمیم نهایی HS، Finance، Permission، Case Closure و sensitive outbound communication انسانی/Rule-controlled است.

## DEC-012 — Expiry
AI extraction مجاز است ولی Expiry countdown/block/alert deterministic Rule Engine است.

## DEC-013 — Finance
Posted Ledger immutable؛ اصلاح از طریق Adjustment.

## DEC-014 — Export
Packing List و Export Package از immutable submission revision ساخته می‌شوند و manifest exact versions دارند.

## DEC-015 — Telegram
Telegram interface سبک است. عملیات سنگین Sheet/Drive/API داخل callback همزمان انجام نمی‌شود؛ Worker/Queue هدف است.

## DEC-016 — Security
Default deny + backend authorization + customer isolation + audit.

## DEC-017 — Migration
Migration repeatable/scripted است؛ Manual copy برای Production ممنوع. Permanent dual-write بین Sheets و PostgreSQL هدف نیست.

## DEC-018 — Development Governance
هر Feature = Requirement + Scope + Test + Acceptance + Traceability. Agent حق تغییر خاموش Business Rule را ندارد.

## DEC-019 — Repository Language
مستندات محصول و راهنماها فارسی هستند؛ identifiers/API/code/migration names می‌توانند انگلیسی بمانند.

## DEC-020 — Production Cutover Blocker
Version identity باید reconcile شود: main V4.26، مستندات V5 Production V4.9.2، Audit target V4.30.


## DEC-021 — نامه‌نگاری Template-First + AI-Assisted
ماژول نامه‌نگاری ابتدا Template Library را جستجو و پیشنهاد می‌دهد. اگر Template مناسب موجود باشد، داده‌های مجاز CRM در آن Auto-fill می‌شوند و AI فقط برای Polish/Rewrite یا کمک تکمیلی استفاده می‌شود. اگر Template مناسب موجود نباشد، AI Intent را تشخیص می‌دهد، اطلاعات ناقص را درخواست می‌کند و Draft می‌سازد. Letter نهایی می‌تواند با تأیید کاربر به Template Draft تبدیل شود، اما Active Template فقط پس از Human/Admin Approval ایجاد می‌شود.
