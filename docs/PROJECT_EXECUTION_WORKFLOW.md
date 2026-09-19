# گردش کار کامل پروژه کاراترخیص

این سند نقشه اجرایی پروژه برای توسعه‌دهنده، Codex و هر عامل خودکار است.

## 1. هدف کسب‌وکار

سیستم باید چرخه کامل یک دفتر ترخیص/کارگزاری گمرکی را از Lead تا Customer، Case، Document، Task، Clearance Event، Follow-up، User/Role و گزارش مدیریتی پوشش دهد. ورود و ویرایش عمده داده در Google Sheets انجام می‌شود؛ Telegram برای دریافت موارد مهم، گزارش سریع و دسترسی به Workspace استفاده می‌شود.

## 2. لایه‌های سیستم

### لایه A — CRM اصلی
مرجع نهایی داده. تمام رکوردهای مشتری، پرونده، تسک، اسناد، کاربر، مجوز، تخصیص، Queue و Log اینجاست.

### لایه B — Apps Script
مسئول Webhook تلگرام، CRUD منطقی، Queue provisioning، ساخت پوشه‌های Drive، ساخت Workspace، همگام‌سازی نقش‌محور، Triggerها، Validationها، Cache و Logging.

### لایه C — Drive
ساختار استاندارد:
- 00-هسته CRM
- تمپلیت
- داشبوردهای LIVE
- Workspace کاربران / مدیر
- Workspace کاربران / کارمند داخلی
- Workspace کاربران / مدیر مشتری
- Workspace کاربران / کارمند مشتری
- اسناد CRM
- ورژن
- گزارش‌ها و خروجی‌ها
- بکاپ و آرشیو
- راهنما و مستندات

### لایه D — Telegram
منوی کم‌حجم و سریع:
- مدیر: گزارش امروز، هشدارهای مهم، پرونده‌های مهم، تسک‌های مهم، لینک CRM
- کاربران غیرمدیر: کارهای امروز من، موارد مهم من، لینک Workspace
تلگرام نباید محل اصلی ورود داده باشد.

## 3. جریان‌های اصلی

### Lead → Customer
سرنخ در سرنخ‌ها ثبت می‌شود، پیگیری در بازاریابی و پیگیری/پیگیری‌ها انجام می‌شود، در صورت تبدیل، Customer ساخته و پوشه اسناد Customer ایجاد می‌شود.

### Customer → Customer Manager
مدیر مشتری در مدیریت کاربران ثبت می‌شود، شرکت از Dropdown مشتریان انتخاب می‌شود، Customer ID خودکار لینک می‌شود، Permission ساخته می‌شود، Provisioning Queue درخواست می‌سازد، Worker فایل RAW Template نقش را Copy می‌کند و Workspace در پوشه نقش ذخیره و به Gmail کاربر Share می‌شود.

### Customer → Case
Case ID پایدار تولید می‌شود. Customer ID باید معتبر باشد. پوشه پرونده زیر اسناد CRM / Customer / پرونده‌ها ساخته می‌شود. Assignmentهای داخلی و مشتری باید با Policy سازگار باشند.

### Case → Documents
Document ID رکورد اصلی سند است. Version ID تاریخچه نسخه‌ها را نگه می‌دارد. Drive File ID و لینک فایل باید با نسخه فعال هم‌خوان باشد. هیچ سندی نباید بدون Case معتبر باقی بماند.

### Case → Clearance Events
هر خروج جزئی یک Event مستقل دارد. مقادیر تعداد/وزن مانده و درصد تجمعی باید با Case اصلی سازگار باشد و منفی یا بیش از کل نشود.

### Task
تسک‌ها برای روابط عمومی CRM استفاده می‌شود. کارهای روزانه برای برنامه شخصی روزانه است. تسک‌های مشتریان و پیام‌های تسک مشتری جریان ارتباط مشتری/کارمند را نگه می‌دارند.

### User / RBAC
Users هویت اصلی است. Permissions سطح مشاهده/ایجاد/ویرایش/واگذاری/اسناد/مالی را تعیین می‌کند. Workspace Mapping محل فایل شخصی را نگه می‌دارد. Case Assignments و Assignment History تاریخچه واگذاری Case را نگه می‌دارند.

### Provisioning
مدیریت کاربران → Users/Permissions → Provisioning Queue → Worker → RAW Template → Workspace → Share → Workspace Mapping → Provisioning Log.

## 4. نقش‌ها و Scope

### مدیر
ALL scope. دسترسی کامل به داده و عملیات مدیریتی.

### کارمند داخلی
ASSIGNED / OWN_ASSIGNMENTS. فقط پرونده‌هایی که مسئول اصلی/همکار است و Taskهای خودش/پرونده‌های خودش.

### مدیر مشتری
CUSTOMER scope با Customer ID. اطلاعات شرکت، پرونده‌ها و Taskهای همان شرکت. برخی فیلدهای عملیاتی/سیستمی غیرقابل ویرایش.

### کارمند مشتری
CUSTOMER scope محدود. پرونده‌های شرکت برای مشاهده و Taskهای شخصی. بدون دسترسی مدیریتی.

## 5. Template و Dashboard

چهار RAW Template وجود دارد:
- مدیر
- کارمند داخلی
- مدیر مشتری
- کارمند مشتری

هر Role داشبورد و تب‌های نمایشی متفاوت دارد. تغییر طراحی باید اول روی RAW Template انجام شود و سپس Migration به Workspaceهای موجود اعمال شود.

## 6. الزامات ظاهری

- راست‌به‌چپ
- فونت هدف: Vazirmatn در تمام Sheetها در صورت پشتیبانی Google Sheets
- رنگ اصلی هر Role حفظ شود
- Header، بخش‌های سیستمی، ورودی کاربر، خروجی محاسباتی، هشدار و Read-only با رنگ‌های متمایز اما هماهنگ مشخص شوند
- Tabهای فنی در Workspace کاربران مخفی باشند
- ستون‌های ID و System metadata visually distinguishable و محافظت منطقی داشته باشند

## 7. تست اجباری قبل از تحویل

1. Inventory تمام Sheetها و Columnها از Live Spreadsheet
2. استخراج تمام Formulaها و ارجاعات Cross-sheet
3. شناسایی #REF!, #N/A, #VALUE!, #DIV/0!, circular reference
4. تطبیق Foreign Keyها: Customer ID, Case ID, Task ID, User ID, Document ID, Assignment ID
5. بررسی Data Validation همه Dropdownها
6. بررسی Triggerها و جلوگیری از Duplicate Trigger
7. بررسی Queue idempotency و Retry
8. بررسی ساخت/Share Workspace هر چهار Role
9. بررسی Scope و جلوگیری از نشت داده بین Roleها
10. بررسی Folder creation و Trash cascade
11. بررسی Telegram webhook، callback latency، authorization و stale callback
12. بررسی Script Properties و حذف Secretهای hardcoded
13. تست Smoke کامل از Lead تا Case و Document و Task و User provisioning
14. تولید گزارش Pass/Fail با Evidence

## 8. Definition of Done

پروژه فقط زمانی نهایی است که:
- تمام تست‌ها Evidence داشته باشند
- هیچ Formula شکسته یا Foreign Key یتیم نباشد
- Scope چهار Role تست شده باشد
- Telegram بدون Freeze و بدون دسترسی غیرمجاز کار کند
- Workspace از RAW Template درست ساخته شود
- Drive structure رعایت شود
- Secrets از Source حذف شده باشند
- Migration plan و rollback plan ثبت شده باشد
- README و Schema docs مطابق Live system باشند
