# کاراترخیص — CRM عملیات ترخیص و کارگزاری گمرکی

کاراترخیص یک CRM عملیاتی مبتنی بر Google Sheets + Google Drive + Google Apps Script + Telegram است. این مخزن از تاریخ 2026-09-19 به‌عنوان مرجع کد و مستندات مهندسی پروژه استفاده می‌شود.

## وضعیت فعلی

- نسخه کد همگام‌شده با این مخزن: **V4.26**
- هسته داده: Google Sheets
- اتوماسیون و Webhook: Google Apps Script
- اسناد و Workspaceها: Google Drive
- رابط دریافت هشدار و گزارش سریع: Telegram Bot
- معماری Workspace: نقش‌محور
- منبع ساخت Workspace جدید: RAW Templateهای هر نقش
- منطقه زمانی عملیاتی: Asia/Tehran

> نکته امنیتی: مخزن عمومی است. هیچ Token، Secret، ایمیل مشتری، Telegram ID واقعی یا داده عملیاتی نباید Commit شود. مقادیر BOT_TOKEN، ADMIN_TELEGRAM_ID و WEB_APP_URL در نسخه GitHub از Apps Script Script Properties خوانده می‌شوند.

## اسناد مرجع

- [گردش کار و نقشه کامل سیستم](docs/PROJECT_EXECUTION_WORKFLOW.md)
- [کاتالوگ تمام شیت‌ها، ستون‌ها و وابستگی‌ها](docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md)
- [Feature Matrix امکانات و وابستگی‌ها](docs/FEATURE_MATRIX.md)
- [معماری Google Drive و Templateها](docs/DRIVE_ARCHITECTURE.md)
- [Master Prompt برای Codex](CODEX_MASTER_PROMPT.md)
- [سورس فعلی Apps Script](src/apps-script/Code.gs)
- [Snapshot نسخه V4.26](versions/V4.26/Karatarkhis_CRM_APP_SCRIPT_V4_26_DRIVE_STRUCTURE_TEMPLATES.gs)

## نقش‌ها

1. مدیر — Scope کل سیستم
2. کارمند داخلی — فقط پرونده‌ها و وظایف تخصیص‌یافته
3. مدیر مشتری — فقط Customer ID شرکت خودش با اختیارات مدیریتی محدود
4. کارمند مشتری — مشاهده محدود شرکت + وظایف شخصی

## قانون Source of Truth

- داده عملیاتی: شیت CRM اصلی
- طراحی Workspace: فایل RAW Template همان نقش
- Workspace کاربر: نسخه اجرایی ساخته‌شده از Template
- داشبورد LIVE: نمایش/مرجع، نه Template
- GitHub: مرجع کد، مستندات، تست‌ها و تغییرات مهندسی

## روش توسعه از این به بعد

هیچ تغییر ساختاری مستقیماً روی Workspace یک کاربر به‌عنوان مبنا انجام نشود. ابتدا Template نقش اصلاح شود، سپس Migration/Sync برای Workspaceهای موجود اجرا و نتیجه تست شود.

کار توسعه بعدی باید روی branch جدا انجام شود و پس از تست کامل به main برگردد.
