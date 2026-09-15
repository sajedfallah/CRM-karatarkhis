# راهنمای مشارکت در کاراترخیص

این سند نحوه مشارکت توسعه‌دهندگان در `CRM-karatarkhis` را مشخص می‌کند. هدف اصلی، جلوگیری از تغییر مستقیم و بدون کنترل در Production و حفظ قابلیت Rollback است.

---

## اصول پایه

1. `main` فقط باید شامل نسخه‌ای باشد که برای Production تأیید شده است.
2. هیچ Secret، Token، Chat ID حساس، فایل مشتری، Export واقعی Sheet یا سند تجاری در Git Commit نشود.
3. تغییرات باید روی Branch مجزا انجام شوند.
4. هر Pull Request باید یک هدف مشخص داشته باشد.
5. قبل از Merge، حداقل Syntax Check و تست مسیرهای اصلی انجام شود.
6. تغییرات ساختار Sheet باید همراه با Migration یا Setup idempotent باشند.
7. تغییرات Telegram باید هم Group Flow و هم Private Flow را بررسی کنند.

---

## مدل Branch

```text
main
├── develop
├── feature/customer-poa-reminders
├── feature/monthly-reports
├── fix/task-reply-routing
└── refactor/v5-core
```

در تیم کوچک می‌توان `develop` را حذف کرد و Feature Branchها را مستقیماً به `main` PR کرد، اما Merge مستقیم بدون Review توصیه نمی‌شود.

---

## نام‌گذاری Branch

| نوع | الگو | مثال |
|---|---|---|
| قابلیت | `feature/<name>` | `feature/customer-documents` |
| باگ | `fix/<name>` | `fix/private-menu-callback` |
| Refactor | `refactor/<name>` | `refactor/task-engine` |
| مستندات | `docs/<name>` | `docs/deployment-guide` |
| Hotfix | `hotfix/<name>` | `hotfix/webhook-routing` |

---

## استاندارد Commit

قالب پیشنهادی:

```text
<type>: <summary>
```

نمونه:

```text
feat: add customer POA expiry reminders
fix: prevent duplicate task Telegram send
docs: update deployment instructions
refactor: consolidate Apps Script triggers
```

Typeهای پیشنهادی:

- `feat`
- `fix`
- `refactor`
- `docs`
- `test`
- `chore`
- `security`

---

## استاندارد کدنویسی Apps Script

### نام تابع

- توابع Public که باید در Function Selector دیده شوند بدون `_` انتهایی باشند.
- Helperهای داخلی می‌توانند با `_` انتهایی نام‌گذاری شوند.
- Version-specific Functionهای موقت باید در Refactor بعدی حذف یا Consolidate شوند.

مثال:

```javascript
function setupV500() {}
function getEmployeeByName_(name) {}
```

### خطاها

خطاهای مهم نباید Silent شوند.

بد:

```javascript
try {
  doSomething();
} catch (_) {}
```

مجاز فقط برای Cleanup غیرحیاتی. برای منطق عملیاتی:

```javascript
try {
  doSomething();
} catch (err) {
  console.error(err.stack || err);
  throw err;
}
```

### Configuration

Secretها از `PropertiesService.getScriptProperties()` خوانده شوند.

```javascript
const token = PropertiesService
  .getScriptProperties()
  .getProperty('BOT_TOKEN');
```

مقدار واقعی Secret نباید در `CONFIG` قرار گیرد.

### Sheet Access

- نام Sheetها در یک Config مرکزی نگهداری شوند.
- Index ستون‌ها در Constant تعریف شوند.
- از Magic Number پراکنده تا حد امکان اجتناب شود.
- هر تغییر Schema باید با Migration همراه باشد.

### Telegram

- کارت Task دارای شناسه پایدار باشد.
- Updateها تا حد امکان Reply به پیام اصلی باشند.
- `callback_query` و `message` هر دو در Webhook پشتیبانی شوند.
- پیام‌های محرمانه به Group ارسال نشوند.

---

## استاندارد Pull Request

هر PR باید شامل این بخش‌ها باشد:

```markdown
## هدف

## تغییرات

## فایل‌ها / Sheetهای تحت تأثیر

## Migration لازم است؟

## تست‌های انجام‌شده

## ریسک و Rollback

## Screenshot / Log
```

### Checklist PR

- [ ] تغییر با Requirement مشخص مرتبط است.
- [ ] Secret اضافه نشده است.
- [ ] Syntax Check انجام شده است.
- [ ] Trigger جدید Duplicate ایجاد نمی‌کند.
- [ ] ساختار Sheet قدیمی Migration دارد.
- [ ] Group Telegram تست شده است.
- [ ] Private Bot تست شده است، اگر مرتبط است.
- [ ] مسیر Drive تست شده است، اگر مرتبط است.
- [ ] CHANGELOG به‌روزرسانی شده است.
- [ ] مستندات Deployment در صورت نیاز به‌روزرسانی شده‌اند.

---

## تست حداقلی قبل از Merge

### Task

1. ایجاد Task برای کارمند.
2. تأیید ارسال به Group.
3. تأیید ذخیره Telegram Message ID.
4. Reply مسئول.
5. تأیید Sync وضعیت/نتیجه.
6. بررسی جلوگیری از Reply کاربر غیرمسئول.

### پرونده

1. ثبت واردات.
2. ثبت صادرات.
3. تأیید شماره پرونده واقعی.
4. تأیید پوشه Drive صحیح.
5. Reset با «➕ پرونده جدید».

### مشتری

1. ثبت مشتری حقیقی/حقوقی.
2. ایجاد پوشه.
3. ثبت تاریخ وکالت‌نامه.
4. Reset با «➕ مشتری جدید».

### Telegram Private

1. مدیر منوی مدیر را ببیند.
2. کارمند فقط منوی مجاز خود را ببیند.
3. دکمه‌ها بدون Command کار کنند.

---

## تغییرات ساختار Sheet

هر PR که ستون، Tab یا Validation جدید اضافه می‌کند باید این اطلاعات را مستند کند:

| مورد | توضیح |
|---|---|
| Sheet | نام Tab |
| Range | محدوده تغییر |
| Data Type | متن/تاریخ/Checkbox/... |
| Migration | نحوه تبدیل داده قبلی |
| Rollback | نحوه بازگشت |

---

## Definition of Done

یک قابلیت زمانی Done است که:

- کد Merge شده باشد.
- Setup/Migration تست شده باشد.
- Production Test انجام شده باشد.
- Logging کافی وجود داشته باشد.
- مستندات به‌روز باشند.
- Rollback قابل انجام باشد.

---

## مالکیت و Review

تا زمانی که CODEOWNERS رسمی تعریف نشده، Merge تغییرات Production باید با تأیید مالک Repository یا مسئول فنی انجام شود.

برای Refactorهای بزرگ، ابتدا Issue/Design Note ایجاد کنید تا تغییر معماری پیش از پیاده‌سازی مشخص شود.
