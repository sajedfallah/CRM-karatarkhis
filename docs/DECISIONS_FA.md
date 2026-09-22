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

## DEC-022 — ساختار سازمان و دعوت کاربران
مدل هویتی/سازمانی از ابتدا دو نوع Organization را پشتیبانی می‌کند:
- INTERNAL_ORGANIZATION برای کارمندان خود کاراترخیص
- CUSTOMER_ORGANIZATION برای شرکت/سازمان مشتری

User از طریق Membership به Organization و Role متصل می‌شود.

دعوت کاربر:
Admin/Manager → Invite → Email Verification → User sets password → Membership activation.

کارمند داخلی بعد از دعوت وارد پنل داخلی می‌شود.
مشتری بعد از دعوت وارد Customer Portal می‌شود.

Customer Admin می‌تواند کارکنان سازمان خودش را دعوت کند، ولی فقط در محدوده Organization خودش و Permissionهای مجاز.

## DEC-023 — احراز هویت و ورود
ورود رسمی با Email + Password است.
ایمیل باید Confirm شود.
سیستم Login هسته مشترک دارد ولی تجربه UI داخلی و مشتری جدا است.
OTP اجباری به‌عنوان روش اصلی ورود نیست؛ MFA/step-up authentication برای عملیات حساس باید آماده باشد.

## DEC-024 — RBAC سازمانی و سطح پرونده
Authorization حداقل دو سطح دارد:
- Organization Scope
- Case Scope

در Customer Organization، Customer Admin می‌تواند کاربر را به کل سازمان یا فقط Caseهای مشخص محدود کند.
هیچ کاربری خارج از Organization خودش نباید از طریق UI یا API به داده Organization دیگر دسترسی داشته باشد.

## DEC-025 — Audit و Security Log از روز اول
تمام عملیات حساس از ابتدا Audit می‌شوند:
login, invite, permission change, case change, document action, approval, send, reopen, finance-sensitive action.
Security Log جدا برای auth failure، suspicious access و permission denial نگهداری می‌شود.

## DEC-026 — محیط‌های جدا
Development، Staging و Production از ابتدا جدا هستند.
هیچ Feature بدون عبور از Staging و Testهای لازم وارد Production نمی‌شود.

## DEC-027 — Feature Flags
Feature Flag برای Rollout مرحله‌ای قابلیت‌های جدید در سطح Environment/Organization/User پشتیبانی می‌شود.
Feature Flag نباید جای Permission یا Business Rule را بگیرد.

## DEC-028 — Observability
Structured logging، request/correlation ID، error tracking، metrics و alerting از Foundation جزو الزامات هستند.

## DEC-029 — Backup / Restore
Backup خودکار Offsite اجباری است.
Restore Drill واقعی و دوره‌ای باید انجام شود؛ داشتن Backup بدون تست Restore کافی نیست.

## DEC-030 — تقویم رخداد و Reminder پرونده
Case Timeline علاوه بر تاریخچه، Deadline/Reminder و Eventهای عملیاتی را پشتیبانی می‌کند.
Reminder داخلی برای کاربر/تیم/مشتری باید از Notification Engine استفاده کند.

## DEC-031 — داشبورد مدیریتی و مشتری
Admin Home روی KPIهای عملیاتی، Bottleneck، Delay، SLA، Expiry و Action Needed تمرکز دارد.
Customer Home فقط اطلاعات قابل فهم و Actionable سازمان خودش را نشان می‌دهد.

## DEC-032 — Timeline پرونده به‌جای Status ساده
Case فقط Status ندارد؛ یک Timeline مرحله‌ای و قابل مشاهده دارد.
هر مرحله:
- status
- started_at
- completed_at
- actor/owner
- notes/comments
- attachments
- blockers
- required customer action
- next step
را ثبت می‌کند.

Admin/Internal و Customer می‌توانند Timeline را با سطح جزئیات متفاوت ببینند.

## DEC-033 — Comment/Note در هر مرحله
هر Timeline Stage امکان Comment Thread دارد.
کارمند/ادمین و مشتری بر اساس Visibility Policy می‌توانند پیام بگذارند.
Comment دارای timestamp، author، visibility و optional attachment است.
Internal-only Note از Customer جداست.

## DEC-034 — Notification Center و Badge
هر رویداد actionable مثل Comment جدید، درخواست سند، درخواست اصلاح، approval request یا تغییر مهم پرونده Notification داخلی می‌سازد.
Customer در Home badge/count می‌بیند و با کلیک مستقیم به Context همان پرونده/مرحله/پیام می‌رود.
Email کانال اصلی اجباری نیست؛ In-app Notification مرجع اصلی UX است.

## DEC-035 — تابلو اعلانات عمومی
Admin می‌تواند Announcement بسازد با:
title, body, audience, starts_at, ends_at, priority, dismissible, link.
Audience می‌تواند:
ALL_CUSTOMERS, selected organizations, selected segments
باشد.
Announcement در Home مشتری نمایش داده می‌شود و Audit می‌شود.

## DEC-036 — نظرسنجی رضایت پایان پرونده
پس از Completion/Closure هر Case، یک Survey کوتاه اختیاری نمایش داده می‌شود:
- rating 1..5
- optional comment
- submitted_at
- case_id
- customer organization
گزارش ماهانه رضایت و trend باید قابل استخراج باشد.
در فاز اولیه از نمایش مستقیم رتبه کارمند به مشتری یا رقابت ناسالم پرهیز شود.

## DEC-037 — جستجوی سراسری
Global Search باید حداقل روی:
Customer، Case، Kotazh/Case Number، Document Number، Letter، Task، Contact
کار کند و نتیجه Permission-aware باشد.

## DEC-038 — برچسب‌گذاری و Saved Views
Case/Customer/Task می‌توانند Tag داشته باشند.
Saved Views و Filters برای کاربر/تیم پشتیبانی می‌شوند.
Tag نباید جای Workflow Status را بگیرد.

## DEC-039 — گزارش‌های آماده
Report Templates برای Admin و Customer تعریف می‌شوند:
- Case status report
- Customer case summary
- Finance summary
- Delay/SLA report
- Document expiry report
- Satisfaction report
- Team workload
خروجی permission-aware است.

## DEC-040 — مسیر عملیاتی پرونده واردات
پس از ایجاد پرونده و Upload اسناد:
1. Document Review توسط کارمند/ادمین مجاز
2. Draft Declaration
3. ارسال Draft Declaration برای Customer Review
4. Customer Approve یا Request Correction + Comment
5. پس از Approval، Declaration Submission توسط کاربر مجاز
6. دریافت شماره کوتاژ
7. از این نقطه Kotazh Number مرجع اصلی عملیاتی پرونده می‌شود و در UI به‌عنوان Primary Operational Reference نمایش داده می‌شود.

شماره داخلی immutable Case ID همچنان در Database باقی می‌ماند و نباید با Kotazh ID جایگزین فنی شود.

## DEC-041 — تأیید پیش‌نویس اظهار توسط مشتری
Draft Declaration قبل از اظهار واقعی باید توسط مشتری تأیید شود.
Customer می‌تواند:
APPROVE
یا
REQUEST_CORRECTION + comment
انجام دهد.
اظهار نهایی قبل از Customer Approval بلوکه است مگر Override Policy صریح با permission/reason/audit وجود داشته باشد.

## DEC-042 — تعیین مسیر گمرکی
بعد از اظهار/دریافت کوتاژ، مسیر گمرکی فقط توسط کاربر داخلی دارای Permission مربوط به Declaration/Customs Route ثبت می‌شود.
Route:
GREEN
YELLOW
RED

ثبت Route یک Transition رسمی در Workflow است و شاخه Timeline مناسب را فعال می‌کند.

## DEC-043 — مسیر سبز واردات
GREEN Route:
- در صورت نیاز: Permit/Standard step
- Customs Duties & Taxes Payment
- Exit Gate
- Completion

اگر کالا Standard/Permit اجباری داشته باشد، Permit/Compliance step قبل از Payment یا طبق Rule عملیاتی پرونده اضافه می‌شود.

## DEC-044 — مسیر زرد واردات
YELLOW Route:
- Virtual Expert Review
- Expert may request additional document/correction
- Upload/Response in same stage
- Virtual Expert Approval
- Customs Duties & Taxes Payment
- Exit Gate
- Completion

## DEC-045 — مسیر قرمز واردات
RED Route:
- Physical Evaluation
- Physical Evaluator Approval/Findings
- Virtual Expert Review
- Expert may request document/correction
- Customs Duties & Taxes Payment
- Exit Gate
- Completion

هر مرحله می‌تواند Comment، Attachment، Request و Notification داشته باشد.

## DEC-046 — Dashboard Chart Policy
نمودار فقط وقتی نمایش داده می‌شود که Actionable insight بدهد.
Admin Home می‌تواند شامل:
- Donut/Pie برای Case distribution by route/status/risk
- Line/Area برای trend پرونده جدید/تکمیل‌شده
- Bar برای average cycle time by stage/team
- Stacked Bar برای backlog/SLA
- Funnel برای Lead→Customer و Case progression
- Heatmap برای workload/deadline concentration
- Gauge/Progress فقط برای KPI محدود و قابل تفسیر

Customer Home:
- Case progress/timeline
- تعداد پرونده فعال/منتظر اقدام
- simple status distribution
- document readiness/progress
- satisfaction history فقط در صورت ارزش واقعی

Chart تزئینی و بدون Action ممنوع است.
