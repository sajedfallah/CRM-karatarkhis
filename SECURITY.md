# امنیت و حریم خصوصی کاراترخیص

کاراترخیص با اطلاعات تجاری، اطلاعات تماس مشتریان، پرونده‌های گمرکی و اسناد حساس سروکار دارد. بنابراین امنیت باید بخشی از طراحی سیستم باشد، نه یک مرحله بعدی.

---

## 1. طبقه‌بندی داده

### Public

- مستندات عمومی پروژه
- ساختار کلی معماری
- نمونه Payloadهای ساختگی

### Internal

- نام Sheetها
- ساختار Workflow
- Logهای غیرحساس
- تنظیمات غیرSecret

### Confidential

- اطلاعات مشتری
- شماره تماس و ایمیل
- اطلاعات پرونده
- مانده حساب
- اطلاعات کارمندان
- Telegram User ID
- اسناد شرکت

### Secret

- Telegram Bot Token
- OAuth credentials
- Service Account Key
- API Key
- Webhook Secret
- Recovery codes

---

## 2. GitHub

Repository فعلی Public است. بنابراین:

**هرگز Commit نکنید:**

```text
BOT_TOKEN
.env
credentials.json
service-account*.json
customer exports
Google Sheet backup with real data
Telegram chat exports
PDF/JPG customer documents
```

اگر Secret اشتباهاً Commit شد:

1. Secret را فوراً Rotate کنید.
2. صرفاً حذف فایل از آخرین Commit کافی نیست.
3. History repository را پاک‌سازی کنید.
4. Access Log/Provider Log را بررسی کنید.

---

## 3. Telegram Bot Token

Token فقط در Apps Script Script Properties قرار گیرد.

```javascript
PropertiesService
  .getScriptProperties()
  .getProperty('BOT_TOKEN');
```

Token واقعی نباید در `CONFIG` Hardcode شود.

در صورت نمایش Token در Screenshot یا Chat، Token را Compromised فرض و Rotate کنید.

---

## 4. Telegram Authorization

Role Mapping از شیت `کارمندان` انجام می‌شود:

```text
Telegram User ID → Employee → Role → Access
```

قواعد:

- User ID باید منحصربه‌فرد باشد.
- کارمند غیرفعال دسترسی نداشته باشد.
- تغییر Role باید توسط مدیر انجام شود.
- Group membership به‌تنهایی معادل Authorization نیست.

---

## 5. Group vs Private

### Group

مناسب:

- Task
- وضعیت عملیات
- Reminder
- گزارش تیمی

نامناسب:

- اسناد هویتی
- کد ملی
- فایل وکالت‌نامه
- اطلاعات مالی حساس شخصی
- داده‌ای که همه اعضای گروه نباید ببینند

### Private

برای خلاصه شخصی و اطلاعات Role-Based استفاده شود.

---

## 6. Google Drive

اصل Least Privilege:

- Root Folderها Public نشوند.
- Customer Folder فقط به افراد لازم Share شود.
- لینک فایل در Telegram فقط در صورت نیاز ارسال شود.
- حذف Folder از طریق Automation ممنوع باشد مگر با Migration مشخص.

ساختار پیشنهادی Permission:

```text
Manager: Editor
Assigned operator: Editor where necessary
Other staff: Viewer or No Access
External customer: No Access by default
```

---

## 7. Google Sheets

- Tabهای Backend در صورت امکان Protected شوند.
- ستون‌های System مثل Task ID و Telegram Message ID توسط کاربر عادی ویرایش نشوند.
- Data Validation حفظ شود.
- Sheetهای `Settings`, `System Log`, `کارمندان` برای کاربران غیرمدیر محدود شوند.

---

## 8. Webhook Security

در V4.9.2 Telegram → Vercel Relay → Apps Script استفاده می‌شود.

پیشنهاد امنیتی برای V5:

```text
Telegram
  ↓
Vercel validates secret/header
  ↓
Apps Script validates relay secret
  ↓
Router
```

در Relay:

- Body را بدون نیاز Log نکنید.
- Token را Log نکنید.
- Request size limit داشته باشید.
- فقط POST پذیرفته شود.
- Rate limit معقول در نظر گرفته شود.

---

## 9. Logging

Log خوب:

```text
TASK_SEND id=KRT-... status=SUCCESS
```

Log بد:

```text
BOT_TOKEN=...
Full customer document content=...
```

Logها باید برای Debug کافی باشند ولی داده حساس غیرضروری نداشته باشند.

---

## 10. Backup

Backup باید شامل:

- Spreadsheet
- Source Code
- Apps Script Deployment version
- Drive structure reference

اما Backup اسناد مشتری باید در Storage امن و با Access Control مناسب باشد.

---

## 11. Incident Response

### Token Leak

1. Rotate in BotFather.
2. Script Property را Update کنید.
3. Webhook را Verify کنید.
4. Test message بفرستید.
5. Secret قدیمی را از Git/Chat/Docs حذف یا Redact کنید.

### Unauthorized User

1. Employee را غیرفعال کنید.
2. Telegram group access را revoke کنید.
3. Drive sharing را بررسی کنید.
4. Logs و تغییرات اخیر را مرور کنید.

### Wrong Document Share

1. Permission را revoke کنید.
2. Link sharing را Disable کنید.
3. Access history را بررسی کنید.
4. اگر اطلاعات حساس افشا شده، Incident را ثبت کنید.

---

## 12. Security Roadmap

- Secret Header بین Relay و Apps Script
- Centralized Audit Log
- Role/Permission Matrix
- Protected Ranges automated setup
- GitHub secret scanning
- CI check برای hardcoded token patterns
- Backup policy
- Data retention policy
- Customer document access audit

---

## گزارش آسیب‌پذیری

آسیب‌پذیری امنیتی را در Issue عمومی با Secret یا داده مشتری گزارش نکنید. از کانال خصوصی مالک Repository استفاده کنید و فقط اطلاعات لازم برای بازتولید مشکل را ارائه دهید.
