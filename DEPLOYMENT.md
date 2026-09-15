# راهنمای Deployment کاراترخیص

این سند روش استقرار کاراترخیص در محیط‌های Development، Staging و Production را توضیح می‌دهد.

> **اصل کلیدی:** Google Sheet، Apps Script Deployment، Telegram Bot و Drive Folderهای Production نباید برای تست توسعه استفاده شوند.

---

## 1. محیط‌ها

| محیط | هدف | Bot | Sheet | Drive | Apps Script |
|---|---|---|---|---|---|
| Development | توسعه و تست سریع | جدا | کپی تست | پوشه تست | Project جدا |
| Staging | تست End-to-End قبل از Release | جدا | کپی نزدیک Production | پوشه Staging | Deployment جدا |
| Production | عملیات واقعی | اصلی | اصلی | اصلی | Deployment اصلی |

---

## 2. پیش‌نیاز

- Google Account دارای دسترسی Editor/Owner
- Google Sheet CRM
- Google Apps Script Project
- Telegram Bot
- Telegram Group
- Vercel Relay
- دسترسی به Repository GitHub
- Backup از Sheet و کد نسخه فعلی

---

## 3. Secretها و Configuration

Secretها فقط در Apps Script → **Project Settings → Script Properties** ذخیره شوند.

### Propertyهای لازم

```text
BOT_TOKEN
GROUP_CHAT_ID
SPREADSHEET_ID
CUSTOMER_DOCS_ROOT_FOLDER_ID
CASE_IMPORT_ROOT_FOLDER_ID
CASE_EXPORT_ROOT_FOLDER_ID
```

Optional:

```text
WEB_APP_URL
CASE_DOCS_ROOT_FOLDER_ID
```

### ممنوع

هرگز این موارد را Commit نکنید:

```text
real bot token
real customer data
private Telegram IDs when not required
Google OAuth credentials
service-account key JSON
Drive exports containing customer documents
```

---

# 4. Development Deployment

## 4.1 ساخت Sheet تست

از Production Spreadsheet یک Copy بگیرید و Customer Data واقعی را حذف/Mask کنید.

نام پیشنهادی:

```text
CRM | ترخیص یزد | DEV
```

## 4.2 ساخت Drive Folderهای تست

```text
DEV-Case-Import
DEV-Case-Export
DEV-Customer-Docs
```

IDها را در Script Properties محیط DEV قرار دهید.

## 4.3 Telegram Bot تست

Bot جدا بسازید. Production Bot Token را در DEV استفاده نکنید.

## 4.4 Apps Script

سورس Branch Feature را در Project DEV قرار دهید.

### Syntax Check محلی اختیاری

اگر سورس به فایل JS export شده است:

```bash
node --check Code.js
```

Apps Script از برخی Globalهای خاص Google استفاده می‌کند؛ Node فقط Syntax خام JavaScript را بررسی می‌کند، نه API Compatibility.

## 4.5 Setup

برای V4.9.2:

```text
setupV492
```

فقط یک‌بار اجرا شود.

انتظار:

- Trigger `onCrmEditV492`
- Trigger Sender هر 1 دقیقه
- Trigger Document Sync هر 5 دقیقه

## 4.6 Web App

Apps Script:

```text
Deploy
→ New deployment
→ Web app
```

Execute as:

```text
Me
```

Access باید متناسب با Webhook تنظیم شود.

URL `/exec` را ثبت کنید.

## 4.7 Relay

Relay محیط DEV را به Web App DEV متصل کنید.

## 4.8 Webhook

Telegram webhook را روی Relay تست تنظیم کنید و بررسی کنید:

```text
allowed_updates = message, callback_query
```

---

# 5. Staging Deployment

Staging باید تا حد ممکن مشابه Production باشد، اما بدون داده حساس واقعی.

### تست‌های اجباری

#### Telegram

- `/version`
- Group message
- Callback button
- Private keyboard

#### Task

- Task برای مدیر
- Task برای کارمند
- Reply مسئول
- Reply کاربر غیرمسئول
- Telegram Message ID
- Pending Sender

#### پرونده

- واردات
- صادرات
- Folder Routing
- Document Sync
- Reset فرم

#### مشتری

- مشتری حقیقی
- مشتری حقوقی
- Folder creation
- تاریخ وکالت
- Reset فرم

#### Regression

- Company Search
- Lead Reply
- Daily Report manual run
- Marketing Report manual run

---

# 6. Production Release Process

## مرحله 1 — Freeze

قبل از Deploy:

- تغییرات جدید Sheet متوقف شود.
- Backup گرفته شود.
- Version فعلی ثبت شود.
- Script Properties Export دستی امن/لیست شود؛ Secretها در Git ذخیره نشوند.

## مرحله 2 — Git

Branch تغییرات باید Review و Merge شده باشد.

Tag پیشنهادی:

```bash
git tag v4.9.2
git push origin v4.9.2
```

## مرحله 3 — Apps Script Code

کد Release را کامل جایگزین کنید.

بعد:

```text
Save
Refresh
```

Version Header و `CONFIG.VERSION` را بررسی کنید.

## مرحله 4 — Setup/Migration

برای V4.9.2:

```text
setupV492
```

فقط یک بار.

### بسیار مهم

در V4.9.2 تابع Legacy `installTriggers()` را بلافاصله بعد از `setupV492()` اجرا نکنید. این تابع می‌تواند Trigger `onTaskEdit` جداگانه بسازد، درحالی‌که `onCrmEditV492` خودش `onTaskEdit(e)` را اجرا می‌کند. نتیجه ممکن است پردازش دوبل باشد.

برای گزارش‌های زمان‌بندی‌شده تا قبل از Refactor Scheduler:

- Triggerهای موجود Production را بررسی کنید.
- از Duplicate نبودن Handler مطمئن شوید.
- اگر نیاز به Trigger گزارش دارید، آن‌ها را جدا و کنترل‌شده از UI Apps Script ایجاد کنید یا کد Scheduler Consolidated منتشر کنید.

## مرحله 5 — Update Web App

اگر Webhook/Private Router تغییر کرده:

```text
Deploy
→ Manage deployments
→ Edit deployment
→ New version
→ Deploy
```

**Deployment جدید با URL جدید ایجاد نکنید** مگر اینکه قصد تغییر Relay را داشته باشید.

## مرحله 6 — Webhook

ابتدا Webhook Info را بررسی کنید.

شرط درست:

```text
URL = Relay production URL
allowed_updates includes message + callback_query
```

اگر URL فعلی درست است، Repair باید URL را حفظ و فقط `allowed_updates` را اصلاح کند.

## مرحله 7 — Smoke Test

ترتیب پیشنهادی:

```text
1. GET Web App health
2. /version
3. Telegram direct test
4. Private menu button
5. New Task
6. Task Reply
7. New Case test
8. New Customer test
9. Drive link
10. Apps Script Executions
```

---

# 7. Rollback

## Apps Script Rollback

اگر Release جدید مشکل دارد:

1. نسخه کد قبلی را از Git Tag/Backup بازیابی کنید.
2. Code.gs را جایگزین کنید.
3. Setup نسخه قبلی را فقط در صورت نیاز اجرا کنید.
4. Web App را به Version پایدار Deploy کنید.
5. Triggerها را بررسی کنید.

## Sheet Rollback

قبل از Migrationهای Schema یک Copy کامل Sheet داشته باشید.

هرگز برای Rollback Production از `reset/clean` تهاجمی روی داده استفاده نکنید.

## Drive Rollback

Folderها و اسناد مشتری را خودکار حذف نکنید. Migrationها باید Create/Link باشند، نه Destructive Delete.

---

# 8. Monitoring بعد از Deploy

حداقل 30 دقیقه اول:

- Apps Script → Executions
- Error Rate
- Pending Telegram Update
- Taskهایی که Message ID ندارند
- Trigger execution failures
- Document Sync errors
- Duplicate messages

روز بعد:

- Reminderها
- Daily Reports
- Lead Escalation
- Folder Sync

---

# 9. گزارش Deployment

برای هر Release یک یادداشت کوتاه ثبت کنید:

```markdown
## Release vX.Y.Z

Date:
Deployer:
Git commit:
Apps Script deployment version:
Sheet migration:
Triggers changed:
Webhook changed:
Smoke tests:
Rollback version:
```

---

# 10. Environment Matrix پیشنهادی

| Config | DEV | STAGING | PROD |
|---|---|---|---|
| BOT_TOKEN | جدا | جدا | اصلی |
| GROUP_CHAT_ID | گروه تست | گروه تست نهایی | گروه اصلی |
| SPREADSHEET_ID | DEV | STG | PROD |
| Drive Roots | DEV | STG | PROD |
| Relay URL | DEV | STG | PROD |
| Apps Script Project | DEV | STG | PROD |

---

# 11. Production Safety Rules

- ابتدا Backup، سپس Migration.
- Secret هرگز در Git.
- Webhook URL را بدون نیاز تغییر ندهید.
- Trigger جدید را قبل از بررسی Triggerهای موجود نصب نکنید.
- Customer Documents را Delete/Move نکنید مگر Migration برنامه‌ریزی‌شده باشد.
- تغییر Schema بدون Backward Compatibility روی Production انجام نشود.
- یک Release باید قابلیت Rollback داشته باشد.

---

# 12. مسیر پیشنهادی بعدی

برای V5 استقرار باید از `clasp` یا CI/CD کنترل‌شده استفاده کند تا GitHub منبع حقیقت سورس باشد و Copy/Paste دستی Code.gs حذف شود.

معماری پیشنهادی Release:

```text
GitHub main
   ↓
Automated checks
   ↓
Staging Apps Script
   ↓
Smoke tests
   ↓
Manual approval
   ↓
Production Apps Script
```
