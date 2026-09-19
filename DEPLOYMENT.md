# راهنمای Deployment کاراترخیص — V4.28

این سند مسیر Development، Staging و Production برای نسخه V4.28 را تعریف می‌کند.

> Production تا زمانی که تست‌های Staging و E2E این سند تکمیل نشده‌اند، آماده انتشار تلقی نمی‌شود.

## 1. اصل جداسازی محیط‌ها

هر محیط باید Bot، Apps Script Project، Spreadsheet و Drive Folder مستقل داشته باشد. شناسه‌های محیطی ترجیحاً در Script Properties تنظیم شوند و fallbackهای موجود فقط برای سازگاری نسخه فعلی هستند.

### Script Properties لازم

```text
BOT_TOKEN
ADMIN_TELEGRAM_ID
WEB_APP_URL
SPREADSHEET_ID
CRM_FOLDER_ID
CRM_DOCUMENTS_ROOT_FOLDER_ID

TELEGRAM_RELAY_URL
TELEGRAM_WEBHOOK_SECRET
RELAY_SHARED_SECRET

TEMPLATE_ADMIN_ID
TEMPLATE_INTERNAL_EMPLOYEE_ID
TEMPLATE_CUSTOMER_MANAGER_ID
TEMPLATE_CUSTOMER_EMPLOYEE_ID

WORKSPACE_FOLDER_ADMIN_ID
WORKSPACE_FOLDER_INTERNAL_ID
WORKSPACE_FOLDER_CUSTOMER_MANAGER_ID
WORKSPACE_FOLDER_CUSTOMER_EMPLOYEE_ID
```

Folder IDهای تکمیلی V4.26/V4.28 نیز در صورت تفاوت محیط می‌توانند با Script Properties متناظر override شوند.

Secret واقعی نباید در Git Commit شود.

## 2. Telegram Relay / Vercel

Root Directory پروژه Vercel باید `backend` باشد. این شاخه یک Relay واقعی در مسیر زیر دارد:

```text
backend/api/telegram.js
```

Environment Variables لازم در Vercel:

```text
TELEGRAM_WEBHOOK_SECRET
RELAY_SHARED_SECRET
APPS_SCRIPT_WEB_APP_URL
```

Endpoint:

```text
GET  /api/telegram
POST /api/telegram
```

Relay ابتدا `X-Telegram-Bot-Api-Secret-Token` را بررسی می‌کند، سپس payload را با HMAC-SHA256 + timestamp + nonce به Apps Script می‌فرستد.

Apps Script درخواست Telegram مستقیم، signature اشتباه، timestamp منقضی و replay را قبل از پردازش داده رد می‌کند.

## 3. Staging setup

1. از CRM یک Copy بدون داده حساس واقعی بسازید.
2. چهار RAW Template را برای Staging کپی کنید.
3. Workspace Folderهای چهار نقش را جدا بسازید.
4. Bot تستی مستقل ایجاد کنید.
5. Relay Preview/Staging مستقل بسازید.
6. Script Properties بالا را با شناسه‌های Staging تکمیل کنید.
7. `src/apps-script/Code.gs` را در Apps Script Staging قرار دهید.
8. Web App Staging را Deploy کنید.
9. `repairBotInstallation()` را فقط در Staging اجرا کنید.
10. نتیجه `validateRuntimeConfigV427_()` و `repairProvisioningSettingsV427_(true)` را بررسی کنید.

## 4. تست‌های اجباری Staging

### RBAC / Scope

- نام‌های مشابه مانند Ali / Alireza نباید داده یکدیگر را ببینند.
- User ID مشابه نباید match شود.
- `PERSONAL:<User ID>` باید مرجع قطعی تسک شخصی باشد.
- وضعیت‌های خالی، ناشناخته و «در انتظار فعالسازی» باید Telegram access را رد کنند.
- Customer Manager / Customer Employee بدون Customer ID معتبر باید رد شوند.

### Telegram ingress

- درخواست معتبر از Relay پذیرفته شود.
- درخواست مستقیم به Apps Script رد شود.
- secret اشتباه رد شود.
- timestamp منقضی رد شود.
- replay همان nonce رد شود.

### Provisioning

برای هر چهار نقش:
- یک Workspace ساخته شود.
- قبل از Share، data tabs پاک و Scope اعمال شده باشد.
- شکست عمدی بعد از ساخت فایل و retry، فایل دوم نسازد.
- درخواست مانده در «در حال پردازش» بعد از timeout بازیابی شود.

### Google Access lifecycle

- تغییر Gmail: دسترسی ایمیل قبلی حذف و ایمیل جدید اضافه شود.
- غیرفعال‌سازی: editor/viewer کاربر حذف شود.
- فعال‌سازی مجدد: فقط Gmail فعلی اضافه شود.
- تغییر Role: Workspace قبلی حذف نشود؛ migration/review کنترل‌شده انجام شود.

### Daily Task conflict

- local-only change → push شود.
- central-only change → pull شود.
- تغییر هم‌زمان → conflict ثبت شود و local بی‌صدا overwrite نشود.
- baseline ناموجود و داده متفاوت → overwrite مرکز انجام نشود.

### Scheduler

بیش از ۲۰ Mapping آزمایشی بسازید و چند چرخه Sync اجرا کنید. همه Mappingها باید بر اساس قدیمی‌ترین `آخرین Sync` نوبت بگیرند.

### Templates

- RAW Template نباید داده عملیاتی دریافت کند.
- Provisioning Settings باید به RAW IDهای canonical اشاره کند.
- فونت مؤثر صفحات بعد از Sync باید Vazirmatn باشد.

## 5. CI

قبل از Staging این موارد باید سبز باشند:

```bash
node --check src/apps-script/Code.gs
node tests/v427_behavior.test.js
node --check backend/api/telegram.js
```

GitHub Actions workflow `Static validation` این موارد را اجرا می‌کند.

## 6. Production release

Production تنها پس از ثبت نتیجه Staging مجاز است.

ترتیب:
1. Backup Sheet و ثبت Version فعلی.
2. Backup/ثبت Triggerها و Deployment فعلی.
3. Export امن لیست Script Properties بدون مقدار Secret.
4. تأیید RAW Template IDs و Provisioning Settings.
5. Merge به `main` فقط با تأیید صریح مالک پروژه.
6. Deploy نسخه جدید Apps Script.
7. Deploy Relay Production.
8. اجرای کنترل‌شده `repairBotInstallation()`.
9. Smoke test کم‌خطر.
10. پایش Apps Script Executions و Vercel logs.

هیچ پیام آزمایشی یا تست مخرب روی Production قبل از تأیید انجام نشود.

## 7. Rollback

### Apps Script

- نسخه قبلی Code.gs را از Git/Version history بازیابی کنید.
- Web App deployment را به نسخه پایدار قبلی برگردانید.
- Triggerها را با inventory ثبت‌شده بازسازی کنید.

### Relay

- Vercel deployment قبلی را Promote/Rollback کنید.
- Telegram webhook را فقط به Relay معتبر قبلی برگردانید.

### Provisioning

Workspace ایجادشده در retry حذف خودکار نمی‌شود. Request ID و Workspace File ID ثبت‌شده مبنای recovery هستند.

### Sheet / Drive

Schema یا اسناد عملیاتی با rollback خودکار پاک نمی‌شوند. هر migration باید create/link یا update محدود و قابل برگشت باشد.

## 8. وضعیت انتشار

V4.28 روی شاخه audit/handoff اصلاح شده است، اما تا تکمیل E2E زنده Staging، inventory واقعی Trigger/Deployment و تست lifecycle دسترسی، Production-ready اعلام نمی‌شود.
