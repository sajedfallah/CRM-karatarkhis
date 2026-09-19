# کاتالوگ کامل شیت‌ها، ستون‌ها و وابستگی‌ها

Snapshot ساختاری: 2026-09-19  
منبع: Spreadsheet عملیاتی CRM.  
داده واقعی، نام مشتریان، شماره تماس، ایمیل و Telegram ID عمداً در این سند وارد نشده است.

## اصول کلیدی وابستگی

- Customer ID / مشتری ID: کلید اصلی مشتری.
- Case ID: کلید اصلی پرونده.
- Task ID: کلید اصلی تسک.
- User ID: کلید اصلی کاربر.
- Document ID: کلید سند منطقی.
- Version ID: کلید نسخه سند.
- Assignment ID: کلید تخصیص پرونده.
- Request ID: کلید Provisioning Queue.
- Mapping ID: کلید Workspace Mapping.

هر ارجاع خارجی باید به رکورد فعال/معتبر مقصد اشاره کند و Codex باید orphanها را گزارش کند.

## 1. داشبورد مدیریتی — visible
ماهیت: Executive dashboard و KPI.
ساختار: شیت presentation/formula است و Header جدولی واحد ندارد.
وابستگی: مشتریان، پرونده‌ها، تسک‌ها، سرنخ‌ها، اسناد پرونده، هشدارها.
Audit: تمام Formulaها و #REFها باید cell-by-cell استخراج شوند.

## 2. سرنخ‌ها — visible
ستون‌ها:
شناسه | تاریخ ثبت | نام شرکت | شخص رابط | شماره تماس | حوزه فعالیت | نوع کالا | منبع سرنخ | دلیل انتخاب | امتیاز | مرحله فروش | مسئول | آخرین تماس | نتیجه تماس | اقدام بعدی | تاریخ پیگیری بعدی | ارزش احتمالی | احتمال موفقیت | وضعیت | یادداشت | Batch ID | Assigned At | Last Activity At | Reminder Count | Last Reminder At | Escalation Level | Closed At | Close Reason
وابستگی: مسئول → Users/کارمندان؛ Lead workflow → بازاریابی و پیگیری؛ conversion → مشتریان.

## 3. مشتریان — visible
ستون‌ها:
مشتری ID | نوع مشتری | نام / عنوان مشتری | شناسه ملی / کد ملی | شماره ثبت | کد اقتصادی | شخص رابط | موبایل | تلفن | ایمیل | استان / شهر | آدرس | شروع وکالت | پایان وکالت | وضعیت وکالت | روز مانده وکالت | 📁 پوشه اسناد | لینک وکالت‌نامه | آخرین یادآوری وکالت | فعال؟ | تاریخ ایجاد | یادداشت | مدیر اصلی | موبایل مدیر | Gmail مدیر | Telegram ID مدیر | User ID مدیر | Workspace مدیر | وضعیت دسترسی مدیر
کلید: مشتری ID.
وابستگی: پرونده‌ها.Customer ID، Users.Customer ID، دسترسی مشتریان، تسک‌های مشتریان، Workspace مدیر مشتری، Drive customer folder.

## 4. پرونده‌ها — visible
ستون‌ها:
Case ID | شماره کوتاژ | مشتری | نوع عملیات | گمرک | شماره پرونده واقعی | وضعیت | مسئول داخلی اصلی | همکاران داخلی | مسئول مشتری | وضعیت اسناد | تسک باز | آخرین فعالیت | وضعیت خروج | تعداد کل | وزن کل | تعداد ترخیص‌شده | وزن ترخیص‌شده | تعداد مانده | وزن مانده | درصد ترخیص | تاریخ کوتاژ | تاریخ ترخیص قطعی/بیجک | مدت ترخیص | نیازمند توجه مدیر | ایجادکننده | تاریخ ایجاد | یادداشت | Customer ID | Sync Version | Sync Source | Sync Updated At
کلید: Case ID.
Foreign key: Customer ID → مشتریان.
مصرف‌کنندگان: اسناد پرونده، نسخه‌های اسناد، رویدادهای خروج، Case Assignments، Assignment History، تسک‌ها، تسک‌های مشتریان.

## 5. تسک‌ها — visible
ستون‌ها:
Task ID | نوع ارتباط | شناسه مرتبط | شرکت/پرونده | موضوع | دسته‌بندی | ایجادکننده | مسئول | اولویت | وضعیت | موعد | نیازمند مدیر | آخرین پاسخ | آخرین پاسخ‌دهنده | آخرین فعالیت | تعداد پیام | نتیجه | اقدام بعدی | تاریخ ایجاد | یادداشت
کلید: Task ID.
وابستگی: شناسه مرتبط با توجه به نوع ارتباط باید Customer ID یا Case ID معتبر باشد؛ مسئول → Users.

## 6. منوی کاراترخیص — hidden
ماهیت: Navigation UI.
نمونه ساختار: عنوان منو، نام بخش، لینک/اکشن، توضیح.
وابستگی: شیت‌های UI/عملیاتی.

## 7. 📣 بازاریابی و شرکت‌ها — hidden
ماهیت: Navigation UI بازاریابی.
وابستگی: سرنخ‌ها، بازاریابی و پیگیری، پروفایل شرکت.

## 8. مرکز هشدارها — hidden
ماهیت: View محاسباتی Alert.
شاخص‌ها: کارهای عقب‌افتاده، لیدهای عقب‌افتاده، نیاز به مدیر، پرونده بدون اسناد، وکالت نیازمند اقدام.
وابستگی: کارهای روزانه، سرنخ‌ها، پرونده‌ها، مشتریان، اسناد.
Audit: Formulaهای Summary و source ranges.

## 9. 📊 مدیریت — hidden
ماهیت: Navigation مدیریتی.
وابستگی: داشبورد، هشدارها، گزارش‌ها.

## 10. 👥 کارمندها — hidden
ماهیت: Navigation Workspace/کارمند.
وابستگی: Users، Workspace Mapping، Workspaceهای نقش.

## 11. 📁 پرونده‌ها و اسناد — hidden
ماهیت: Navigation پرونده/اسناد.
وابستگی: پرونده جدید، پرونده‌ها، اسناد پرونده، چک‌لیست اسناد.

## 12. میز کار اردوان — hidden / Legacy
ستون‌ها:
ترتیب | نوع کار | شرکت / پرونده | اقدام دقیق | راه تماس / مرجع | اولویت | وضعیت | نتیجه | اقدام بعدی | ارجاع به مدیر | خلاصه / KPI | مقدار
ماهیت: Legacy personal workbench.
قانون: قبل از حذف dependency audit کامل لازم است.

## 13. پروفایل شرکت — hidden
ماهیت: 360-degree company view.
ساختار: presentation/formula.
وابستگی: مشتریان/سرنخ‌ها/پرونده‌ها/تسک‌ها/مالی Legacy.

## 14. بازاریابی و پیگیری — hidden
ستون‌ها:
Activity ID | تاریخ (شمسی) | Lead ID | شرکت | مسئول | نوع اقدام | نتیجه | دلیل عدم نتیجه | اقدام بعدی | موعد بعدی (شمسی) | وضعیت | نیاز به مدیر | Source Task ID | Telegram Message ID | آخرین یادآوری | تصمیم مدیر | تاریخ پاسخ مدیر | پاسخ‌دهنده مدیر | وضعیت ارجاع مدیر
وابستگی: Lead ID → سرنخ‌ها؛ Source Task ID → Task؛ مسئول → Users.

## 15. پیگیری‌ها — hidden
ستون‌ها:
تاریخ پیگیری | نام شرکت | شخص رابط | شماره تماس | مسئول | نوع پیگیری | هدف تماس | نتیجه | اقدام بعدی | موعد بعدی | وضعیت | یادداشت

## 16. راهنمای مکالمات — hidden
ستون‌ها:
موضوع | سؤال یا اعتراض مشتری | پاسخ پیشنهادی اردوان | سؤال بعدی اردوان | هدف | زمان ارجاع به مدیر
ماهیت: Knowledge/reference sheet.

## 17. کارهای روزانه — hidden
ستون‌ها:
تاریخ | مسئول | دسته‌بندی | کار روزانه | مرتبط با شرکت | اولویت | موعد | وضعیت | نتیجه | کار فردا | یادداشت مدیریتی | شناسه کار | Telegram Message ID | آخرین یادآوری | ارسال به کارمند | ایجاد شده در | موعد دقیق | تعداد یادآوری | آخرین تغییر وضعیت | بسته شده در | آخرین آپدیت تلگرام | منبع | شماره پرونده
کلید منطقی: شناسه کار.
وابستگی: Workspace tab 📅 تسک روزانه من؛ دسته‌بندی‌ها؛ مسئول → Users.

## 18. پرونده جدید — hidden
ماهیت: فرم سریع ثبت Case.
وابستگی: مشتریان، فهرست‌ها، createCase logic.

## 19. پرونده‌ها و تسویه اردوان — hidden / Legacy
ستون‌ها:
شناسه پرونده | شرکت / صاحب کالا | شماره سند / کوتاژ | وضعیت پرونده | تاریخ ترخیص | کارمزد کل | هزینه ۲۰٪ | خالص پس از هزینه | سهم اردوان ۵۰٪ | علی‌الحساب / برداشت | پرداخت به اردوان | مانده حساب | وضعیت حساب | تاریخ واریز | یادداشت | 📁 اسناد پرونده | مسئول | نوع پرونده | مشتری ID | تاریخ ایجاد | آخرین بروزرسانی | Telegram Message ID | مرحله فعلی | مسئول مرحله فعلی | آخرین تغییر مرحله | نمایش به مشتری؟ | توضیح قابل نمایش به مشتری
قانون: Legacy dependency audit قبل از migration/delete.

## 20. اسناد پرونده‌ها — hidden / Legacy
ستون‌ها:
شناسه پرونده | شرکت / صاحب کالا | نوع سند | نام فایل / سند | لینک فایل | تاریخ دریافت | ثبت‌کننده | توضیحات
تفاوت با اسناد پرونده جدید باید روشن و migration plan تهیه شود.

## 21. چک‌لیست اسناد — hidden
ستون‌ها:
شناسه پرونده | شرکت | نوع سند | نام / شرح سند | وضعیت سند | تاریخ دریافت | مسئول | لینک فایل | نیاز به پیگیری | تاریخ پیگیری | یادداشت | تکمیل پرونده
وابستگی: Case و document workflow.

## 22. فهرست‌ها — hidden
ستون‌ها:
شرکت‌ها | کارکنان | وضعیت پرونده | اولویت | وضعیت کار | مرحله فروش | وضعیت بازاریابی | دسته‌بندی کار | نوع سند | وضعیت سند | نوع پرونده | نوع مشتری | نقش کارمند | مرحله پرونده
ماهیت: منابع Dropdown Legacy/عمومی.
Audit: هر Validation باید منبع دقیق و stale valueها را مشخص کند.

## 23. Settings — hidden
ستون‌ها:
Key | Value | Description
ماهیت: تنظیمات runtime/business rules.

## 24. System Log — hidden
ستون‌ها:
Timestamp | Module | Action | Record ID | Result | Error | Source | Details
ماهیت: observability و debugging.

## 25. کارمندان — hidden / Legacy
ستون‌ها:
نام کارمند | Telegram User ID | نقش | فعال؟ | Telegram Username | شناسه | تاریخ ثبت | آخرین بروزرسانی
وابستگی Legacy Telegram. باید با Users reconciliation شود.

## 26. مشتری جدید — hidden
ماهیت: فرم ثبت Customer.
وابستگی: مشتریان، createCustomer، folder automation.

## 27. اسناد مشتریان — hidden
ستون‌ها:
مشتری ID | نام مشتری | نوع سند | نام فایل / سند | لینک فایل | تاریخ دریافت | ثبت‌کننده | توضیحات
Foreign key: مشتری ID → مشتریان.

## 28. گزارش واردات و صادرات — hidden
ماهیت: Report/summary.
شاخص‌ها: نوع پرونده، کل پرونده، در حال انجام، ترخیص شد، بسته، کارمزد کل، مانده حساب.
Audit: source ranges و Legacy finance dependencies.

## 29. فرم‌های مدیریتی — hidden
ماهیت: UI برای افزودن آیتم Dropdown، کارمند و Settings.
وابستگی: فهرست‌ها، Users/Legacy employees، Settings.

## 30. راهنمای سیستم — hidden
ستون‌ها:
شیت | کارکرد | ورودی اصلی | خروجی / مقصد | اتوماسیون | ویرایش دستی | سطح دسترسی | وضعیت
ماهیت: Legacy internal documentation؛ باید با docs GitHub reconcile شود.

## 31. دسترسی مشتریان — hidden
ستون‌ها:
مشتری ID | نام مشتری | کد اتصال | انقضای کد | Telegram User ID | Telegram Username | فعال؟ | وضعیت اتصال | تاریخ صدور | تاریخ فعال‌سازی | آخرین مشاهده | یادداشت
Foreign key: مشتری ID → مشتریان.

## 32. تسک‌های مشتریان — hidden
ستون‌ها:
Task ID | مشتری ID | نام مشتری | شناسه پرونده | مرحله پرونده | مسئول | درخواست مشتری | وضعیت | تاریخ ایجاد | اولین پاسخ | آخرین پاسخ | سطح یادآوری | آخرین یادآوری | Employee Message ID | Customer Chat ID | تاریخ Escalation | تاریخ بسته‌شدن | آخرین پیام | آخرین بروزرسانی | آخرین هشدار مدیر
Foreign keys: مشتری ID → مشتریان؛ شناسه پرونده → پرونده‌ها.

## 33. پیام‌های تسک مشتری — hidden
ستون‌ها:
Message ID | Task ID | نوع فرستنده | نام فرستنده | Telegram User ID | پیام | تاریخ | Telegram Message ID | Reply To
Foreign key: Task ID → تسک‌های مشتریان.

## 34. رویدادهای خروج — hidden
ستون‌ها:
Clearance Event ID | Case ID | شماره کوتاژ | مشتری | تاریخ/زمان خروج | تعداد خروج این مرحله | وزن خروج این مرحله (kg) | تعداد مانده بعد از خروج | وزن مانده بعد از خروج (kg) | درصد خروج تجمعی | نوع رویداد | ثبت‌کننده | منبع | یادداشت
Foreign key: Case ID → پرونده‌ها.
Business invariant: خروج تجمعی نباید از total quantity/weight عبور کند.

## 35. اسناد پرونده — hidden
ستون‌ها:
Document ID | Case ID | کوتاژ | مشتری | نوع عملیات | نوع سند | الزام | وضعیت سند | نسخه جاری | Drive File ID | لینک فایل | بارگذاری‌کننده | زمان بارگذاری | بررسی‌کننده | زمان بررسی | قفل | دلیل رد/اصلاح | Source | آخرین بروزرسانی | یادداشت
Foreign key: Case ID → پرونده‌ها.

## 36. نسخه‌های اسناد — hidden
ستون‌ها:
Version ID | Document ID | Case ID | نوع سند | شماره نسخه | Drive File ID | لینک فایل | بارگذاری‌کننده | زمان بارگذاری | وضعیت نسخه | بررسی‌کننده | زمان بررسی | دلیل رد/اصلاح | Source | نسخه فعال؟ | یادداشت
Foreign keys: Document ID → اسناد پرونده؛ Case ID → پرونده‌ها.
Invariant: برای هر Document فقط یک نسخه فعال.

## 37. Users — hidden
ستون‌ها:
User ID | نام کامل | موبایل | Gmail / Email | Telegram User ID | نقش | Customer ID | شرکت | پروفایل دسترسی | وضعیت | Workspace URL | Google Access | Telegram Linked | ایجادکننده | تاریخ ایجاد | آخرین بروزرسانی | آخرین فعالیت | یادداشت
کلید: User ID.
Foreign key: Customer ID → مشتریان برای نقش‌های مشتری.

## 38. Permissions — hidden
ستون‌ها:
Permission ID | User ID | Role | Scope Type | Scope ID | Permission Profile | مشاهده | ایجاد | ویرایش | تخصیص/واگذاری | تأیید اسناد | مالی | وضعیت | یادداشت
Foreign key: User ID → Users.
Invariant: Role/Scope/Profile باید با policy نقش هم‌خوان باشد.

## 39. Workspace Mapping — hidden
ستون‌ها:
Mapping ID | User ID | نام کاربر | نقش | Customer ID | نوع Workspace | Spreadsheet ID | Workspace URL | Gmail مشترک‌شده | وضعیت Provisioning | آخرین Sync | یادداشت
Foreign keys: User ID → Users؛ Customer ID → مشتریان.
Invariant: هر User فعال حداکثر یک Workspace فعال canonical.

## 40. Case Assignments — hidden
ستون‌ها:
Assignment ID | Case ID | User ID | نام کاربر | سمت/Role | نوع تخصیص | Primary? | Customer ID | وضعیت | تخصیص‌دهنده | تاریخ تخصیص | پایان تخصیص | آخرین بروزرسانی | یادداشت
Foreign keys: Case ID → پرونده‌ها؛ User ID → Users.
Invariant: حداکثر یک مسئول داخلی Primary فعال در هر Case.

## 41. Assignment History — hidden
ستون‌ها:
History ID | Case ID | Assignment ID | نوع تغییر | کاربر قبلی | کاربر جدید | نوع تخصیص | Primary? | تغییردهنده | Source | زمان تغییر | دلیل | یادداشت
Foreign keys: Case ID → پرونده‌ها؛ Assignment ID → Case Assignments.

## 42. Provisioning Queue — hidden
ستون‌ها:
Request ID | نوع درخواست | Customer ID | شرکت | User ID | نام کاربر | Gmail | Telegram User ID | Role | Permission Profile | Template Type | Template File ID | وضعیت | Workspace File ID | Workspace URL | درخواست‌دهنده | تاریخ درخواست | خطا/یادداشت
Foreign keys: User ID → Users؛ Customer ID → مشتریان؛ Template File ID → RAW Template.
Audit مهم: Template File IDهای Settings/Queue باید با معماری جدید RAW Templates سازگار باشند.

## 43. Provisioning Log — hidden
ستون‌ها:
Log ID | Request ID | Customer ID | User ID | Action | Old Status | New Status | Workspace File ID | Workspace URL | Gmail | Permission | Actor | Source | Timestamp | Details
Foreign key: Request ID → Provisioning Queue.

## 44. مدیریت کاربران — visible
ماهیت: UI انسانی Users/RBAC/Provisioning.
Header واقعی: ردیف 4.
وابستگی: Users، Permissions، Provisioning Queue، Customer company dropdown، Workspace Mapping.
Audit: Data Validation نقش، Profile، Status، Google Access، Telegram Linked، Provisioning.

## 45. Provisioning Settings — hidden
ستون‌ها:
Role | Request Type | Template Type | Template File ID | Default Profile | Required Customer | Share Permission | Active
Audit مهم: Template File ID نباید به Dashboard LIVE به‌عنوان Source of Truth اشاره کند؛ باید RAW Template باشد.

## 46. Assignment Policy — hidden
ستون‌ها:
Assignment Type | Allowed Role | Customer Match Required | Can View | Can Edit | Can Assign | Can Upload Docs | Can Reply Task | Primary Allowed | Rule
ماهیت: policy table RBAC/assignment.

## 47. Dashboard Registry — visible
ستون‌ها:
Role | Dashboard Name | Spreadsheet ID | Dashboard URL | Status | Last Sync
ماهیت: Registry فایل‌های LIVE dashboard.
قانون: Dashboard Registry برای مرجع LIVE است و منبع provisioning نیست.

# وابستگی کلان

سرنخ‌ها → بازاریابی/پیگیری → مشتریان  
مشتریان → پرونده‌ها → اسناد/نسخه‌ها + رویدادهای خروج + تسک‌ها  
Users → Permissions + Workspace Mapping + Assignments + Provisioning  
Provisioning Settings + RAW Templates → Queue → Workspace → Mapping/Log  
Case Assignments → Role-scoped Workspace data  
کارهای روزانه → 📅 تسک روزانه من در Workspace  
تسک‌های مشتریان → پیام‌های تسک مشتری  
Dashboard/Alerts → Formula/reference به شیت‌های عملیاتی

# Formula Audit

این فایل فقط schema snapshot است. Codex باید تمام cellهای دارای Formula را از live workbook استخراج کند و برای هر مورد این اطلاعات را بسازد:
- sheet
- cell/range
- exact formula
- dependencies
- expected output type
- actual result
- error state
- copied/fill consistency
- role-scope safety

خطاهای ممنوع در تحویل نهایی:
#REF!, #VALUE!, #DIV/0!, #NAME?, unresolved circular reference و Formulaهایی که به Sheet/Column حذف‌شده اشاره می‌کنند.

# Validation Audit

برای تمام Data Validationها:
- target range
- source list/range
- allowInvalid
- UI dropdown behavior
- expected role
- stale values
- duplicate values
باید ثبت و تست شود.
