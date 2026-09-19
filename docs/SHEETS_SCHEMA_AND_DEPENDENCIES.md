# کاتالوگ شیت‌ها، ستون‌ها و وابستگی‌ها

این Snapshot بر اساس ساختار Live در 2026-09-19 تهیه شده است. داده واقعی عمداً در این مخزن ثبت نشده است.

## شیت‌های اصلی و عملیاتی

### سرنخ‌ها
ستون‌ها: شناسه، تاریخ ثبت، نام شرکت، شخص رابط، شماره تماس، حوزه فعالیت، نوع کالا، منبع سرنخ، دلیل انتخاب، امتیاز، مرحله فروش، مسئول، آخرین تماس، نتیجه تماس، اقدام بعدی، تاریخ پیگیری بعدی، ارزش احتمالی، احتمال موفقیت، وضعیت، یادداشت، Batch ID، Assigned At، Last Activity At، Reminder Count، Last Reminder At، Escalation Level، Closed At، Close Reason.
وابستگی: مسئول → Users/کارمندان؛ تبدیل Lead → مشتریان؛ Follow-up → بازاریابی و پیگیری.

### مشتریان
ستون‌ها: مشتری ID، نوع مشتری، نام / عنوان مشتری، شناسه ملی / کد ملی، شماره ثبت، کد اقتصادی، شخص رابط، موبایل، تلفن، ایمیل، استان / شهر، آدرس، شروع وکالت، پایان وکالت، وضعیت وکالت، روز مانده وکالت، پوشه اسناد، لینک وکالت‌نامه، آخرین یادآوری وکالت، فعال؟، تاریخ ایجاد، یادداشت، مدیر اصلی، موبایل مدیر، Gmail مدیر، Telegram ID مدیر، User ID مدیر، Workspace مدیر، وضعیت دسترسی مدیر.
کلید: مشتری ID.
مصرف‌کنندگان: پرونده‌ها، Users، دسترسی مشتریان، تسک‌های مشتریان، Workspace/Manager linking.

### پرونده‌ها
ستون‌ها: Case ID، شماره کوتاژ، مشتری، نوع عملیات، گمرک، شماره پرونده واقعی، وضعیت، مسئول داخلی اصلی، همکاران داخلی، مسئول مشتری، وضعیت اسناد، تسک باز، آخرین فعالیت، وضعیت خروج، تعداد کل، وزن کل، تعداد ترخیص‌شده، وزن ترخیص‌شده، تعداد مانده، وزن مانده، درصد ترخیص، تاریخ کوتاژ، تاریخ ترخیص قطعی/بیجک، مدت ترخیص، نیازمند توجه مدیر، ایجادکننده، تاریخ ایجاد، یادداشت، Customer ID، Sync Version، Sync Source، Sync Updated At.
کلید: Case ID.
Foreign key: Customer ID → مشتریان.
مصرف‌کنندگان: تسک‌ها، اسناد پرونده، نسخه‌های اسناد، رویدادهای خروج، Case Assignments، Assignment History، تسک‌های مشتریان.

### تسک‌ها
ستون‌ها: Task ID، نوع ارتباط، شناسه مرتبط، شرکت/پرونده، موضوع، دسته‌بندی، ایجادکننده، مسئول، اولویت، وضعیت، موعد، نیازمند مدیر، آخرین پاسخ، آخرین پاسخ‌دهنده، آخرین فعالیت، تعداد پیام، نتیجه، اقدام بعدی، تاریخ ایجاد، یادداشت.
کلید: Task ID.
شناسه مرتبط باید بر اساس نوع ارتباط به Customer ID یا Case ID معتبر اشاره کند.

### کارهای روزانه
ستون‌ها: تاریخ، مسئول، دسته‌بندی، کار روزانه، مرتبط با شرکت، اولویت، موعد، وضعیت، نتیجه، کار فردا، یادداشت مدیریتی، شناسه کار، Telegram Message ID، آخرین یادآوری، ارسال به کارمند، ایجاد شده در، موعد دقیق، تعداد یادآوری، آخرین تغییر وضعیت، بسته شده در، آخرین آپدیت تلگرام، منبع، شماره پرونده.
کارکرد: برنامه شخصی روزانه و Sync با تب شخصی Workspace.

### بازاریابی و پیگیری
ستون‌ها: Activity ID، تاریخ (شمسی)، Lead ID، شرکت، مسئول، نوع اقدام، نتیجه، دلیل عدم نتیجه، اقدام بعدی، موعد بعدی (شمسی)، وضعیت، نیاز به مدیر، Source Task ID، Telegram Message ID، آخرین یادآوری، تصمیم مدیر، تاریخ پاسخ مدیر، پاسخ‌دهنده مدیر، وضعیت ارجاع مدیر.
وابستگی: Lead ID → سرنخ‌ها؛ Source Task ID → Task.

### پیگیری‌ها
ستون‌ها: تاریخ پیگیری، نام شرکت، شخص رابط، شماره تماس، مسئول، نوع پیگیری، هدف تماس، نتیجه، اقدام بعدی، موعد بعدی، وضعیت، یادداشت.

### اسناد پرونده
ستون‌ها: Document ID، Case ID، کوتاژ، مشتری، نوع عملیات، نوع سند، الزام، وضعیت سند، نسخه جاری، Drive File ID، لینک فایل، بارگذاری‌کننده، زمان بارگذاری، بررسی‌کننده، زمان بررسی، قفل، دلیل رد/اصلاح، Source، آخرین بروزرسانی، یادداشت.
کلید: Document ID.
Foreign key: Case ID → پرونده‌ها.

### نسخه‌های اسناد
ستون‌ها: Version ID، Document ID، Case ID، نوع سند، شماره نسخه، Drive File ID، لینک فایل، بارگذاری‌کننده، زمان بارگذاری، وضعیت نسخه، بررسی‌کننده، زمان بررسی، دلیل رد/اصلاح، Source، نسخه فعال؟، یادداشت.
Foreign key: Document ID → اسناد پرونده؛ Case ID → پرونده‌ها.

### رویدادهای خروج
ستون‌ها: Clearance Event ID، Case ID، شماره کوتاژ، مشتری، تاریخ/زمان خروج، تعداد خروج این مرحله، وزن خروج این مرحله (kg)، تعداد مانده بعد از خروج، وزن مانده بعد از خروج (kg)، درصد خروج تجمعی، نوع رویداد، ثبت‌کننده، منبع، یادداشت.
Foreign key: Case ID → پرونده‌ها.

## کاربر، دسترسی و Provisioning

### Users
ستون‌ها: User ID، نام کامل، موبایل، Gmail / Email، Telegram User ID، نقش، Customer ID، شرکت، پروفایل دسترسی، وضعیت، Workspace URL، Google Access، Telegram Linked، ایجادکننده، تاریخ ایجاد، آخرین بروزرسانی، آخرین فعالیت، یادداشت.
کلید: User ID.

### Permissions
ستون‌ها: Permission ID، User ID، Role، Scope Type، Scope ID، Permission Profile، مشاهده، ایجاد، ویرایش، تخصیص/واگذاری، تأیید اسناد، مالی، وضعیت، یادداشت.
Foreign key: User ID → Users.

### Workspace Mapping
ستون‌ها: Mapping ID، User ID، نام کاربر، نقش، Customer ID، نوع Workspace، Spreadsheet ID، Workspace URL، Gmail مشترک‌شده، وضعیت Provisioning، آخرین Sync، یادداشت.
Foreign key: User ID → Users؛ Customer ID → مشتریان برای نقش مشتری.

### Case Assignments
ستون‌ها: Assignment ID، Case ID، User ID، نام کاربر، سمت/Role، نوع تخصیص، Primary?، Customer ID، وضعیت، تخصیص‌دهنده، تاریخ تخصیص، پایان تخصیص، آخرین بروزرسانی، یادداشت.
Foreign key: Case ID → پرونده‌ها؛ User ID → Users.

### Assignment History
ستون‌ها: History ID، Case ID، Assignment ID، نوع تغییر، کاربر قبلی، کاربر جدید، نوع تخصیص، Primary?، تغییردهنده، Source، زمان تغییر، دلیل، یادداشت.
Foreign key: Case ID → پرونده‌ها؛ Assignment ID → Case Assignments.

### Provisioning Queue
ستون‌ها: Request ID، نوع درخواست، Customer ID، شرکت، User ID، نام کاربر، Gmail، Telegram User ID، Role، Permission Profile، Template Type، Template File ID، وضعیت، Workspace File ID، Workspace URL، درخواست‌دهنده، تاریخ درخواست، خطا/یادداشت.
وابستگی: Users، مشتریان، RAW Template، Workspace folder.

### Provisioning Log
ستون‌ها: Log ID، Request ID، Customer ID، User ID، Action، Old Status، New Status، Workspace File ID، Workspace URL، Gmail، Permission، Actor، Source، Timestamp، Details.
Foreign key: Request ID → Provisioning Queue.

### مدیریت کاربران
UI انسانی برای ثبت و مدیریت User. Header اصلی در ردیف 4 است و باید با Users/Permissions/Queue Mirror شود.

### Provisioning Settings
ستون‌ها: Role، Request Type، Template Type، Template File ID، Default Profile، Required Customer، Share Permission، Active.
نکته Audit: Template File ID باید با RAW Templateهای پوشه تمپلیت سازگار باشد؛ Recordهای قدیمی ممکن است هنوز به Dashboard LIVE اشاره کنند.

### Assignment Policy
ستون‌ها: Assignment Type، Allowed Role، Customer Match Required، Can View، Can Edit، Can Assign، Can Upload Docs، Can Reply Task، Primary Allowed، Rule.

## دسترسی و ارتباط مشتری

### دسترسی مشتریان
ستون‌ها: مشتری ID، نام مشتری، کد اتصال، انقضای کد، Telegram User ID، Telegram Username، فعال؟، وضعیت اتصال، تاریخ صدور، تاریخ فعال‌سازی، آخرین مشاهده، یادداشت.

### تسک‌های مشتریان
ستون‌ها: Task ID، مشتری ID، نام مشتری، شناسه پرونده، مرحله پرونده، مسئول، درخواست مشتری، وضعیت، تاریخ ایجاد، اولین پاسخ، آخرین پاسخ، سطح یادآوری، آخرین یادآوری، Employee Message ID، Customer Chat ID، تاریخ Escalation، تاریخ بسته‌شدن، آخرین پیام، آخرین بروزرسانی، آخرین هشدار مدیر.

### پیام‌های تسک مشتری
ستون‌ها: Message ID، Task ID، نوع فرستنده، نام فرستنده، Telegram User ID، پیام، تاریخ، Telegram Message ID، Reply To.
Foreign key: Task ID → تسک‌های مشتریان.

## Legacy / UI / Report / Helper Sheets

- داشبورد مدیریتی: داشبورد کلان CRM و Formulaهای KPI.
- منوی کاراترخیص: Landing navigation.
- 📣 بازاریابی و شرکت‌ها: Landing بازاریابی.
- مرکز هشدارها: Summary و Alert view.
- 📊 مدیریت: Landing مدیریتی.
- 👥 کارمندها: Landing کارمندان.
- 📁 پرونده‌ها و اسناد: Landing پرونده/اسناد.
- میز کار اردوان: Legacy/personal operational view؛ باید dependency audit شود قبل از حذف.
- پروفایل شرکت: نمای 360 درجه شرکت.
- راهنمای مکالمات: Knowledge sheet برای مکالمات فروش.
- پرونده جدید: فرم سریع Case.
- پرونده‌ها و تسویه اردوان: Legacy operational/settlement table.
- اسناد پرونده‌ها: Legacy document table.
- چک‌لیست اسناد: checklist per Case.
- فهرست‌ها: منبع Dropdownهای عمومی.
- Settings: Key/Value تنظیمات سیستم.
- System Log: Timestamp، Module، Action، Record ID، Result، Error، Source، Details.
- کارمندان: Legacy Telegram employee registry.
- مشتری جدید: فرم ثبت Customer.
- اسناد مشتریان: اسناد سطح Customer.
- گزارش واردات و صادرات: گزارش تجمیعی.
- فرم‌های مدیریتی: UI مدیریت Dropdown/Employee/Settings.
- راهنمای سیستم: نقشه تبادل داده Legacy.
- Dashboard Registry: Role، Dashboard Name، Spreadsheet ID، Dashboard URL، Status، Last Sync.

## Audit اجباری Formula و Validation

این سند Header snapshot است و جایگزین Audit زنده Formula نیست. عامل اجرایی باید برای تک‌تک Cellهای دارای Formula:
- Formula text
- Sheet/Range references
- dependency graph
- error state
- expected type
- sample evaluation
را ثبت کند.

تمام Data Validationها نیز باید با منبع Range/List، allowInvalid و Role requirement ثبت و تست شوند.
