# MASTER PROMPT — KARATARHIS CRM FINAL AUDIT, HARDENING & PRODUCTION HANDOFF

تو مسئول ادامه و تکمیل پروژه **کاراترخیص / CRM-karatarkhis** تا مرحله تست نهایی، رفع کامل خطاها و آماده‌سازی برای اجرای Production هستی.

## 0) هدف نهایی

پروژه باید به یک سیستم پایدار، سریع، قابل نگهداری و Role-Based تبدیل شود که شامل این اجزاست:

- Google Sheets CRM به‌عنوان Source of Truth داده
- Google Apps Script برای اتوماسیون، Provisioning، Sync، Drive و Telegram
- Google Drive با ساختار پوشه‌بندی استاندارد
- چهار RAW Template مستقل برای نقش‌ها
- Workspace اختصاصی برای هر کاربر
- Telegram Bot سبک و فقط برای دریافت اطلاعات مهم/هشدار/گزارش، نه CRUD سنگین
- Role-Based Access واقعی در داده، UI، Dashboard و Workspace
- تست کامل تمام شیت‌ها، ستون‌ها، فرمول‌ها، Validationها، Triggerها، Queueها، Drive و Telegram
- مستندسازی نهایی و Evidence قابل بررسی

کار را تا رسیدن به وضعیت **Release Candidate آماده Production** ادامه بده. بین مراحل عادی و قابل برگشت منتظر تأیید نمان. برای حذف داده Production، تغییر مخرب Schema، Rotate کردن Secret، تغییر مالکیت/Permission گسترده یا Merge به main حتماً تأیید صریح کاربر لازم است.

---

## 1) GitHub — Source Control

Repository:

`sajedfallah/CRM-karatarkhis`

Branch فعلی handoff:

`codex/final-audit-handoff-2026-09-19`

قوانین Git:
- روی همین branch ادامه بده یا branch فرعی مشخص از آن بساز.
- **main را مستقیم تغییر نده و Merge نکن مگر با تأیید صریح کاربر.**
- هر تغییر منطقی یک commit مستقل و قابل بازگشت داشته باشد.
- PR به main بساز/به‌روزرسانی کن ولی تا تأیید کاربر Merge نکن.
- هیچ Secret، Token، Password یا Credential را Commit نکن.
- Repository عمومی است؛ امنیت را با فرض Public بودن رعایت کن.
- Script Properties فقط با نام کلیدها مستند شوند، نه مقدار Secret.

فایل Apps Script اصلی:

`src/apps-script/Code.gs`

Snapshot نسخه فعلی:

`src/apps-script/releases/Karatarkhis_CRM_APP_SCRIPT_V4_26_DRIVE_STRUCTURE_TEMPLATES.gs`

چهار Export تمپلیت:

- `templates/RAW_Admin.xlsx`
- `templates/RAW_Internal_Employee.xlsx`
- `templates/RAW_Customer_Manager.xlsx`
- `templates/RAW_Customer_Employee.xlsx`

قبل از هر تغییر، README و کل پوشه `docs/` را بخوان، مخصوصاً:
- `docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md`
- `docs/FEATURE_MATRIX.md`
- `docs/DRIVE_ARCHITECTURE.md`
- `docs/PROJECT_EXECUTION_WORKFLOW.md`

---

## 2) Google Drive — معماری رسمی

Root:
`Customs CRM`
Folder ID:
`17LGzt2z04D9KhlXrW1YJc_AmEtA1g-ZM`

ساختار canonical:

```text
Customs CRM/
├── 00-هسته CRM/
├── تمپلیت/
├── داشبوردهای LIVE/
├── Workspace کاربران/
│   ├── مدیر/
│   ├── کارمند داخلی/
│   ├── مدیر مشتری/
│   └── کارمند مشتری/
├── اسناد CRM/
├── ورژن/
├── گزارش‌ها و خروجی‌ها/
├── بکاپ و آرشیو/
└── راهنما و مستندات/
```

Folder IDs:

- 00-هسته CRM: `1INrIWIfBlsygSaJi9q0koPP5-FvVQK4h`
- تمپلیت: `1Ufj-W77Krk_9CSbSwCADe5U5_fBbKCrT`
- داشبوردهای LIVE: `1CAGRK3ITGt44J_mI44C9FoPPXM-DMjml`
- Workspace کاربران: `1xBbzdLdDOxfZaa_8Yq-GGV2sgsJfFxf4`
- Workspace/مدیر: `1hOvd6yR15DFJW69_yDP9jKP0LBRjG_fV`
- Workspace/کارمند داخلی: `15wH_gDtXcyZKpcQwABYAM5zEoujpuKNl`
- Workspace/مدیر مشتری: `1HmWgBFQi0TCaqbA993OGRhD2TEGVVF6U`
- Workspace/کارمند مشتری: `1eg6hK4W7Pxsg4_nYxd9MUuxRAO7rsXw4`
- اسناد CRM: `13h-NyW6CQgJAAB3EtBGjowNypHLZn2-s`
- ورژن: `1XlSQ0GGTG7kR1-P37PjFs4jE79P4I6k5`
- گزارش‌ها و خروجی‌ها: `1SYpbQUg5SyJ29HbhayqcSNg43tQ279nR`
- بکاپ و آرشیو: `1Xc5ueDdOnO7dgQj_LerP4jkesXbY2HN7`
- راهنما و مستندات: `1QVDZhDfReBDjIcQ1XpsZzCwgCxdh2R98`

قانون:
- هر فایل جدید باید در پوشه درست خودش ساخته شود.
- Workspace کاربر هرگز در Root ذخیره نشود.
- RAW Templateها canonical source برای ساخت Workspace هستند.
- LIVE Dashboardها source provisioning نیستند.
- خروجی گزارش، Backup و Documentation در پوشه‌های مستقل خودشان قرار بگیرند.

---

## 3) فایل CRM اصلی

Spreadsheet ID:

`1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

این Spreadsheet مرجع اصلی داده است.

طبق Documentation فعلی حدود 47 Sheet دارد. باید **تک‌تک Sheetها** را زنده بررسی کنی و به Documentation اعتماد کورکورانه نکنی.

برای هر Sheet این موارد را استخراج و Audit کن:

1. نام Sheet
2. Visible/Hidden
3. Header row واقعی
4. تمام ستون‌ها
5. ID/Primary key
6. Foreign keyها
7. Formulaها
8. Data Validationها
9. Dropdownها
10. Checkboxها
11. Number format
12. Date/time format
13. Conditional formatting
14. Merged ranges
15. Named ranges
16. Protected ranges
17. Hidden rows/columns
18. Filter / Filter Views
19. Freeze rows/columns
20. Links / Drive URLs
21. وابستگی به Apps Script
22. وابستگی به Telegram
23. وابستگی به Workspace
24. Legacy status
25. سطح دسترسی مورد انتظار

هیچ Sheet یا Column را صرفاً به دلیل Legacy بودن حذف نکن. ابتدا dependency graph و migration plan بساز.

---

## 4) Templateهای canonical

Google Drive RAW Template IDs:

- مدیر:
  `1Zt890HbsaHUS20ldmzWSrH0rRIEAuDgpavr8dqxxHBw`
- کارمند داخلی:
  `1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0`
- مدیر مشتری:
  `1m_Ao7XQMVlhhsMx4AR82b60GCK0XHKXhTW_S5BxKIAI`
- کارمند مشتری:
  `1eesSiyEhUr4qJkp4rK3qtRnt3w3X0yXH08dfZ08cXiE`

قانون تغییر UI:
1. ابتدا RAW Template همان Role را اصلاح کن.
2. روی Copy تست کن.
3. migration function برای Workspaceهای موجود بنویس.
4. migration را روی Staging اجرا کن.
5. سپس Workspaceهای موجود را Update کن.
6. دوباره Role Scope، Formulaها و Permissionها را تست کن.

---

## 5) طراحی و استایل تمام Google Sheets — الزام مهم

کاربر صریحاً خواسته است:

- اختلاف رنگ بین نقش‌ها حفظ شود.
- تمام Sheetها در تمام فایل‌ها کامل بررسی شوند.
- Headerها، Sectionها و گروه ستون‌ها با رنگ‌های متمایز ولی هماهنگ تفکیک شوند.
- **فونت Vazirmatn برای تمام Sheetها، تمام صفحات، تمام Used Rangeها و تمام Template/Workspace/Dashboardها اعمال شود.**
- راست‌به‌چپ بودن محیط فارسی حفظ شود.

Role color identity فعلی را حفظ کن:
- مدیر: آبی
- کارمند داخلی: سبز
- مدیر مشتری: طلایی/قهوه‌ای
- کارمند مشتری: بنفش

داخل هر Sheet یک Semantic Color System تعریف کن و در Documentation ثبت کن. حداقل گروه‌های زیر باید visually distinguishable باشند:
- شناسه‌ها / System IDs
- اطلاعات هویتی/مشتری
- عملیات پرونده
- مسئولیت/Assignment/User
- تاریخ‌ها و زمان‌ها
- وضعیت و Status
- اولویت و Warning
- مالی در صورت وجود
- لینک/Drive/Document
- Formula/Calculated
- System Sync/Audit columns
- Notes/Description
- Required user-input columns

قواعد:
- رنگ‌بندی باید readable، professional و هماهنگ باشد؛ نه شلوغ.
- Header اصلی قوی‌تر از body باشد.
- ستون‌های System/ID با user-input اشتباه نشوند.
- ستون‌های Formula/System read-only باید visual cue داشته باشند.
- Required fields cue مشخص داشته باشند.
- Conditional formatting برای وضعیت‌ها با palette هماهنگ باشد.
- رنگ نقش با semantic colors تداخل نداشته باشد.
- Contrast متن/پس‌زمینه مناسب باشد.
- Freeze و Filter منطقی باشند.
- Width/Wrap/Alignment همه ستون‌ها بررسی شود.
- Row heights و merged ranges فقط جایی استفاده شود که UX را بهتر کند.

**Vazirmatn را واقعاً روی Google Sheets اعمال کن و نتیجه را بخوان/تست کن.**
اگر Google Sheets API یا محیط فعلی font family `Vazirmatn` را قبول نکرد، آن را silently با فونت دیگری عوض نکن. ابتدا blocker و evidence دقیق ثبت کن و بهترین راه حل سازگار را پیشنهاد بده.

---

## 6) Role-Based UX و Access

چهار نقش:

### مدیر
- کل CRM
- Dashboard مدیریتی کلان
- Customers / Cases / Tasks / Users
- دسترسی کامل مطابق policy

### کارمند داخلی
- فقط موارد assigned
- پرونده‌های من
- تسک‌های من
- اسناد پرونده‌های من
- تسک روزانه من
- Dashboard عملیاتی شخصی

### مدیر مشتری
- فقط Customer ID خودش
- اطلاعات شرکت
- پرونده‌های شرکت
- تسک‌های شرکت
- تسک روزانه شخصی
- Dashboard شرکت
- edit فقط fieldهای مجاز

### کارمند مشتری
- فقط Customer ID شرکت خودش
- پرونده‌های قابل مشاهده
- فقط تسک‌های شخصی خودش
- تسک روزانه
- Dashboard محدود
- Read-only در بخش‌های مدیریتی

تست امنیتی اجباری:
- هیچ Role نباید داده خارج از Scope خود را در Sheet visible، hidden sheet، Formula spill، Dashboard، Telegram یا Workspace ببیند.
- Hidden sheet امنیت محسوب نمی‌شود؛ data scope باید در داده sync شده هم enforce شود.
- Customer Employee نباید با تغییر URL/Sheet name به داده Manager دسترسی پیدا کند.
- Internal Employee فقط assignment خودش را ببیند.

---

## 7) Provisioning و Workspace

Provisioning باید کاملاً idempotent باشد.

تست کن:

- ثبت User جدید از `مدیریت کاربران`
- Mirror به `Users`
- Permission row
- Queue row
- Worker
- RAW template درست بر اساس Role
- ساخت Workspace در Folder درست Role
- Share فقط به Gmail درست
- Workspace Mapping
- Provisioning Log
- Google Access status
- Telegram Linked status
- Role dashboard
- role-specific visible tabs
- technical tabs hidden
- sync trigger
- no duplicate Workspace on retry
- retry after failure
- Gmail change
- deactivate/reactivate access

Provisioning Settings و Queue را Audit کن تا Template File IDها فقط به RAW Templateها اشاره کنند، نه LIVE dashboards.

---

## 8) Customer flow

E2E روی Staging:

1. Customer جدید بساز.
2. Customer ID ساخته شود.
3. Folder اسناد ساخته شود.
4. URL پوشه در Sheet ثبت شود.
5. ساختار:
   - 00-اسناد پایه
   - پرونده‌ها
6. Manager Customer تعریف کن.
7. ستون شرکت Dropdown زنده از مشتریان باشد.
8. با انتخاب شرکت، Customer ID خودکار شود.
9. Manager Workspace ساخته و Share شود.
10. اطلاعات Manager به customer record link شود.
11. Customer Manager فقط همان شرکت را ببیند.

هم Sheet-entry و هم مسیرهای باقی‌مانده Apps Script را تست کن.

---

## 9) Case / Assignment / Documents

برای Case:
- ID
- Customer link
- operation type
- assignment
- case folder
- document folder
- status
- clearance metrics
- manager attention

Assignment:
- primary/secondary
- history
- policy
- scope propagation

Documents:
- Document ID
- Version ID
- active version invariant
- upload/status/review
- Drive links
- reject reason
- case visibility
- no orphan Drive file metadata

Hard delete/cascade را فقط روی Staging تست کن. Production delete بدون تأیید کاربر ممنوع.

---

## 10) Daily Personal Tasks

تب:
`📅 تسک روزانه من`

باید برای همه Roleها فعال باشد.

تست:
- create
- edit
- sync to central `کارهای روزانه`
- sync back
- owner isolation
- status dropdown
- priority dropdown
- category dropdown
- free-typed new category
- central category library
- category appears for other users after sync
- no overwrite race
- no duplication
- completion/cancel behavior

Category dropdown باید:
- دسته‌بندی‌های قبلی را نشان دهد
- category جدید قابل تعریف باشد
- category جدید بعد از sync در library مرکزی و Dropdown بقیه ظاهر شود.

---

## 11) Telegram Bot — معماری مطلوب

Telegram باید **سبک و Read/Alert oriented** باقی بماند.

CRUD سنگین در Google Sheets انجام شود.

Admin menu فقط موارد مهم:
- گزارش امروز
- هشدارهای مهم
- پرونده‌های مهم
- تسک‌های مهم
- لینک CRM

User menu:
- کارهای امروز من
- موارد مهم من
- لینک میز کار

تست Telegram:
- /start برای Admin
- /start برای Internal Employee
- /start برای Customer Manager
- /start برای Customer Employee
- unauthorized user
- inactive user
- wrong Telegram ID
- stale callback
- duplicate update_id
- duplicate message
- callback ack
- editMessageText fallback
- webhook retry behavior
- rate limiting
- no freeze
- no long-running Sheet scan on simple navigation
- no sync job blocking webhook
- background sync remains background
- role scoped output

Performance:
- برای navigation ساده، Google Sheets/Drive scan انجام نشود.
- callback ack باید سریع باشد.
- latency instrumentation داشته باش.
- اگر response کند است، زمان دقیق مراحل را log کن.
- هدف UX: منوی ساده در حالت عادی تقریباً فوری حس شود؛ External API delay را جداگانه اندازه بگیر.

---

## 12) Apps Script — Audit فنی کامل

کل `src/apps-script/Code.gs` را بررسی کن.

موارد اجباری:
- Syntax
- duplicate function definitions
- override order
- dead code
- unreachable code
- inconsistent version names
- missing helper references
- exception swallowing
- excessive readRows
- N+1 Sheet calls
- N+1 Drive calls
- trigger duplication
- locks
- idempotency
- CacheService consistency
- Script Properties
- timezone
- webhook logic
- retry paths
- queue concurrency
- race conditions
- partial failures
- audit logging
- permission checks
- SpreadsheetApp flush usage
- expensive onEdit handlers
- Apps Script quotas

Duplicate functionهای ناشی از patch history را شناسایی کن. اگر Consolidate می‌کنی:
- behavior regression test قبل و بعد داشته باش.
- یک‌باره کل فایل را rewrite نکن مگر evidence کامل داشته باشی.
- functional parity را ثابت کن.

---

## 13) Security

Repository عمومی است.

Secretها هرگز Commit نشوند.

این Script Properties باید مستند و Runtime-loaded باشند:
- `BOT_TOKEN`
- `ADMIN_TELEGRAM_ID`
- `WEB_APP_URL`
- هر secret داخلی دیگر

اگر Token واقعی در git history پیدا شد:
- آن را در گزارش Security ثبت کن.
- Rotate نیازمند اطلاع/تأیید کاربر است.
- Token جدید را هرگز در GitHub قرار نده.

Audit:
- Telegram auth
- role permission
- Drive sharing
- customer isolation
- internal API secret
- public links
- anyone-with-link permissions
- user email sharing
- protected file IDs
- delete cascade protection

---

## 14) Formula Audit — Cell by Cell

تمام Formulaها در CRM اصلی، RAW Templates، LIVE dashboards و Workspaceهای تستی را استخراج کن.

برای هر Formula:
- file
- sheet
- cell
- exact formula
- dependencies
- expected type
- actual value
- error status
- scope safety

خطاهای نهایی غیرقابل قبول:
- #REF!
- #VALUE!
- #DIV/0!
- #NAME?
- circular dependency unresolved
- reference به sheet حذف‌شده
- reference به column اشتباه
- formula leaking out-of-scope data

اگر #N/A عمداً بخشی از UX است، explicit document کن؛ در غیر این صورت رفع شود.

---

## 15) Data Validation Audit

برای هر Validation:
- file
- sheet
- range
- rule type
- source range/list
- allowInvalid
- show dropdown
- current invalid values
- role relevance

موارد مهم:
- Roles
- Permission Profile
- User Status
- Google Access
- Telegram Linked
- Provisioning Status
- Provisioning Request Type
- Company dropdown
- Task Status/Priority
- Daily Category
- Case status/operation type
- Document status/type

هیچ Dropdown نباید به stale range یا deleted sheet اشاره کند.

---

## 16) Test Strategy

### Phase A — Inventory
هیچ mutation نکن.
Snapshot کامل بگیر.

### Phase B — Static audit
Code + schema + dependencies.

### Phase C — Staging copies
از CRM/Templateها Copy تستی بساز.
هیچ تست مخرب روی Production انجام نده.

### Phase D — Unit/functional
هر function مهم با fixture کنترل‌شده.

### Phase E — Integration
Sheet ↔ Apps Script ↔ Drive ↔ Workspace ↔ Telegram.

### Phase F — E2E role tests
چهار Role جداگانه.

### Phase G — performance
Telegram, sync, queue.

### Phase H — migration
فقط پس از Pass شدن staging.

### Phase I — production smoke test
non-destructive.

### Phase J — evidence + PR
گزارش نهایی و checklist.

---

## 17) Acceptance Criteria

تحویل نهایی فقط وقتی PASS است که:

- تمام Sheetها و Columnها inventory شده باشند.
- font/style audit کامل باشد.
- Vazirmatn در همه فایل‌های هدف اعمال و verify شده باشد یا blocker رسمی داشته باشد.
- semantic color system کامل و مستند باشد.
- هیچ Formula error غیرعمدی باقی نماند.
- هیچ invalid validation باقی نماند.
- RAW Templateها درست باشند.
- همه Role dashboardها واقعاً متفاوت باشند.
- Workspace هر Role scope صحیح داشته باشد.
- User provisioning بدون duplicate کار کند.
- Customer folder automation کار کند.
- Customer Manager link درست باشد.
- Daily Tasks bidirectional و isolated باشد.
- Telegram bot freeze نکند.
- simple navigation heavy Sheet/Drive scan نداشته باشد.
- unauthorized access تست و رد شده باشد.
- triggers duplicate نباشند.
- queue stuck row نداشته باشد.
- Drive folder structure رعایت شود.
- public repo secret-free باشد.
- staging E2E pass باشد.
- production smoke test pass باشد.
- مستندات GitHub با وضعیت واقعی یکی باشد.
- PR شامل changelog، migration notes، test evidence و rollback plan باشد.

---

## 18) Evidence الزامی

در `docs/audit/` خروجی‌های زیر را نگهدار:

- `INVENTORY.md`
- `FORMULA_AUDIT.md`
- `VALIDATION_AUDIT.md`
- `RBAC_TEST_MATRIX.md`
- `DRIVE_AUDIT.md`
- `TELEGRAM_TEST_REPORT.md`
- `PERFORMANCE_REPORT.md`
- `STYLING_SYSTEM.md`
- `E2E_TEST_REPORT.md`
- `MIGRATION_PLAN.md`
- `ROLLBACK_PLAN.md`
- `FINAL_ACCEPTANCE.md`

هر Pass/Fail باید evidence داشته باشد؛ صرف گفتن «اوکی است» قابل قبول نیست.

---

## 19) نحوه کار

- کار را مرحله‌به‌مرحله انجام بده ولی تا جای ممکن مستقل پیش برو.
- قبل از تغییر، state را بخوان.
- بعد از تغییر، همان مورد را verify کن.
- مشکل را با حدس حل نکن؛ evidence جمع کن.
- داده واقعی مشتری را در GitHub Commit نکن.
- برای Test fixture از داده مصنوعی استفاده کن.
- Test data را با Prefix مشخص بساز: `TEST-CODEX-`.
- Cleanup تست را انجام بده، مگر evidence لازم باشد؛ در آن صورت staging copy را نگه دار.
- تغییر Production باید کمینه و قابل rollback باشد.
- هر بار bug پیدا شد، regression test اضافه کن.
- هیچ failure را silently swallow نکن.
- هر کار تمام‌شده را در checklist ثبت کن.

---

## 20) اولین اقدام تو

بدون پرسیدن سؤال عمومی:

1. Repository و branch handoff را checkout و inventory کن.
2. وضعیت Git را ثبت کن.
3. فایل‌های docs، Apps Script و Template exports را بخوان.
4. با Google Drive ساختار واقعی پوشه‌ها و فایل‌ها را verify کن.
5. CRM اصلی را read-only inventory کن.
6. Gap Analysis بین docs و live state بساز.
7. یک Plan اجرایی دقیق در `docs/audit/EXECUTION_PLAN.md` Commit کن.
8. سپس Audit را شروع کن.
9. تا Release Candidate ادامه بده.
10. PR را آماده نگه دار ولی Merge به main نکن.

هدف: **سیستم کامل، قابل تست، قابل rollback، امن، سریع و آماده اجرای واقعی**.
