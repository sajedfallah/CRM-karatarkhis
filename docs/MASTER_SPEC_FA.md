# سند جامع محصول و معماری کاراترخیص

این سند خلاصه Canonical تصمیم‌های CASE-STRUCTURE-001 تا CASE-STRUCTURE-022 است و باید همراه با اسناد دامنه‌ای دیگر خوانده شود.

## 1. تعریف محصول
کاراترخیص یک سامانه اختصاصی مدیریت عملیات ترخیص و کارگزاری گمرکی است. هسته محصول «Case Management + Operations Management» است، نه CRM فروش عمومی.

مدل مرکزی:
Customer → Case → Stage → Task → Action

هر Case به Documents، Finance، Communication، AI Analysis، Timeline، Alerts و Audit متصل است.

## 2. اصول پایه
- PostgreSQL منبع حقیقت نهایی است.
- Backend مرجع نهایی Business Rule و Permission است.
- Frontend صرفاً UX است و Security Boundary نیست.
- عملیات سنگین async هستند.
- Sensitive Actionها Command endpoint دارند.
- Audit و History حذف نمی‌شوند.
- AI دستیار است، نه تصمیم‌گیر نهایی در عملیات حساس.

## 3. نقش‌ها
حداقل:
SUPER_ADMIN, ADMIN, OPERATIONS_MANAGER, TEAM_MANAGER, EMPLOYEE, FINANCE, DOCUMENT_REVIEWER, SALES, CUSTOMER_RELATION, CUSTOMER, READ_ONLY.

Permission model:
ROLE + RESOURCE + ACTION + SCOPE + FIELD ACCESS.

Scopeهای هدف:
ALL, BRANCH, TEAM, CUSTOMER, CASE, ASSIGNED, OWN, READ_ONLY, CUSTOM.

## 4. CRM و Referral
Referral یک Entity مستقل است.
Lead pipeline:
REFERRED → NEW → CONTACT_PENDING → CONTACTED → NEEDS_DISCOVERY → QUALIFIED → PROPOSAL_SENT → FOLLOW_UP → NEGOTIATION → READY_TO_CONVERT → CONVERTED
و خروجی‌های LOST/NO_RESPONSE/NOT_INTERESTED/INVALID/DUPLICATE/ARCHIVED.

Lead فعال باید Owner + Stage + Next Action + Date داشته باشد.
Lead → Customer باید History را حفظ کند.

## 5. Customer 360
تب‌ها:
نمای کلی، مخاطبین، پرونده‌ها، وظایف، اسناد، مالی، ارتباطات، نامه‌نگاری، یادداشت‌ها، Timeline، کاربران پرتال، AI، تنظیمات.

Customer Portal:
خانه، پرونده‌های من، کارهای من، اسناد، مالی، پیام‌ها، پروفایل.

Internal data هیچ‌وقت نباید به Customer Portal نشت کند.

## 6. ساختار پرونده
Case مستقل از یک status تک‌بعدی است و وضعیت‌های جدا دارد:
- Operational Status
- Financial Status
- Customer Action Status
- Document Readiness
- Risk Status
- Hold Status

Workflow:
CASE_CREATED → INITIAL_REVIEW → DOCUMENT_COLLECTION → DOCUMENT_VALIDATION → PRE_DECLARATION → DECLARATION_PREPARATION → DECLARATION_SUBMITTED → CUSTOMS_PROCESSING → INSPECTION/ASSESSMENT → FINANCIAL_CLEARANCE → RELEASE_PREPARATION → RELEASE_READY → DELIVERY → FINAL_REVIEW → COMPLETED → ARCHIVED

Transition فقط از طریق command و با Rule Engine معتبر انجام می‌شود.

## 7. Case Registration Wizard
ترتیب:
Customer → Operation Type → Product → Shipment → Documents → AI Pre-Check → HS Review → Initial Finance → Assignment → Final Review → Customer Confirmation → Final Submit.

Draft autosave/resume اجباری.
قبل از Final Case، Draft وجود دارد.

## 8. Customer Confirmation / Submission Lock
Customer قبل از Submit باید Confirmation صریح انجام دهد.
Submit:
- immutable snapshot می‌سازد
- revision number دارد
- confirmation text/version/timestamp ثبت می‌شود
- customer editing را backend-block می‌کند

Reopen:
فقط نقش مجاز، با دلیل، ترجیحاً LIMITED_REOPEN.
بعد از Correction، Confirmation جدید لازم است.

## 9. Documents
Document و Document Version از هم جدا هستند.
Replace = Version جدید، نه overwrite.

Status:
REQUESTED, WAITING_FOR_UPLOAD, UPLOADED, AI_CHECKING, NEEDS_REVIEW, APPROVED, REJECTED, REVISION_REQUIRED, EXPIRED, SUPERSEDED, ARCHIVED.

Document Requirement با Operation/Product/Transport/Customer/Customs/Conditions تغییر می‌کند.

## 10. AI Document Intelligence
AI:
- classify
- extract
- normalize
- compare
- summarize
- suggest
- explain

Rule Engine:
- numeric validations
- tolerances
- blocking
- expiry
- deterministic conditions

AI Result باید source/evidence/confidence داشته باشد.
Source change → result STALE.
Low-confidence critical field → Human Review.

## 11. Weight/Quantity/Amount Validation
مقایسه بین CRM/Packing List/B/L و اسناد مرتبط.
Gross < Net = BLOCK.
Mismatchهای وزن/تعداد/مبلغ/ارز/Party بر اساس Severity و Policy مدیریت می‌شوند.

## 12. Product / HS
AI باید محصول را بر اساس technical attributes شناسایی کند، نه فقط trade name.
نتیجه HS:
MATCH, POSSIBLE_MATCH, REVIEW_RECOMMENDED, MISMATCH, INSUFFICIENT_INFORMATION.

AI Candidate فقط پیشنهاد است.
Final sensitive HS classification انسانی است.
Product Master فقط Human-Verified data را به Knowledge Base معتبر ارتقا می‌دهد.

## 13. Task / SLA
Task types:
PERSONAL_TASK, CASE_TASK, DOCUMENT_TASK, CUSTOMER_TASK, EMPLOYEE_TASK, MANAGER_TASK, APPROVAL_TASK, RECURRING_TASK, SYSTEM_TASK.

Features:
Owner, collaborator, dependency, subtask, checklist, priority, deadline, comments, attachment, mention, recurrence, approval, escalation.

SLA:
calendar-aware، pause/resume، breach، escalation L0-L3.

## 14. Finance
Operational finance:
Estimates, Actual Costs, Customer Charges, Payments, Advances, Outstanding, Invoice, Receipt, Ledger, Profitability.

Status:
NOT_STARTED, ADVANCE_REQUIRED, PARTIALLY_FUNDED, FUNDED, PAYMENT_PENDING, OVERDUE, FINANCIAL_HOLD, SETTLED, CLOSED.

Posted Ledger immutable است؛ Correction با Adjustment.
Profit/internal cost برای Customer مخفی است.

## 15. Corporate Document Compliance
Customer Corporate Document Library شامل:
کارت بازرگانی، وکالتنامه، مجوز فعالیت/تأسیس/بهره‌برداری، استاندارد، سلامت، Import/Export licenses، قرارداد، بیمه، مالیات و سایر مدارک Policy-defined.

AI:
issuer, document number, holder, scope, issue/effective/expiry extraction.

Rule Engine:
daily expiry scan، policy thresholds، blocking، alert dedupe.

Status:
VALID, EXPIRING_SOON, EXPIRED, NO_EXPIRY, UNKNOWN_EXPIRY, NEEDS_REVIEW, SUPERSEDED, ARCHIVED.

## 16. Communication Hub
Channels:
INTERNAL_MESSAGE, CUSTOMER_PORTAL, TELEGRAM, EMAIL, SMS, PHONE_LOG, WHATSAPP_READY, SYSTEM_NOTIFICATION, ALERT.

Visibility:
INTERNAL_ONLY, CUSTOMER_VISIBLE, PRIVATE, TEAM, MANAGER_ONLY.

Event flow:
Domain Event → Notification Rule → Recipient Resolution → Channel → Queue → Delivery → Audit.

Telegram باید lightweight باشد؛ CRUD سنگین و Drive scan داخل callback انجام نشود.

## 17. Smart Correspondence
معماری نامه‌نگاری **Template-First + AI-Assisted** است.

Menu:
نامه جدید، قالب‌های آماده، پیش‌نویس، در انتظار بررسی، در انتظار تأیید، آماده ارسال، ارسالی، دریافتی، نیازمند پاسخ، پرونده، مشتری، گمرک، آرشیو.

Flow استاندارد:
Template Search → Select → Auto-fill CRM Context → Ask Missing Fields → Preview → AI Polish Optional → Human Review → Approval if required → Send/Archive.

اگر Template مناسب وجود نداشت:
Describe Request → AI Intent Detection → Similar Template Suggestion → Ask Missing Information → AI Draft → Human Review → Optional Save as Template Draft.

Templateها Versioned و Human-Approved هستند. AI-generated letter فقط می‌تواند Template Draft پیشنهاد دهد و حق فعال‌سازی خودکار Template را ندارد.

AI Fact اختراع نمی‌کند.
Missing fact = NEEDS_INFORMATION.
Official outgoing letters = Human Review/Approval.
Sensitive letters = Approval Policy.
SENT immutable است.
Incoming letters می‌توانند توسط AI خلاصه شوند و Suggested Task/Deadline/Reply ایجاد کنند، ولی ثبت نهایی طبق Permission/Workflow است.

## 18. Export Workflow
Required:
نوع کالا، تعداد، نوع بسته‌بندی، وزن خالص، وزن ناخالص، ارزش کل، ارز، گمرک خروجی، HS، موبایل راننده، خودرو/پلاک.

Flow:
Draft → Cargo → Driver/Vehicle → Corporate Docs → AI/HS → Final Review → Customer Confirmation → Lock → Admin Review → Packing List → Export Package → Secure Delivery.

Packing List از immutable submission revision ساخته می‌شود.
Package manifest exact document version IDs و checksum دارد.

## 19. Dashboard / Reporting
Role dashboards:
Admin, Employee, Finance, Sales, Document Review.

Case Command Center باید فوراً نشان دهد:
- پرونده کجاست؟
- چه چیزی Block شده؟
- چه کسی Owner است؟
- Next Action چیست؟
- Deadline/SLA چیست؟

KPI Registry centralized/versioned باشد.
Search، saved views، filters، safe bulk actions، report export و snapshot support لازم است.

## 20. UI/UX
فارسی، RTL، Vazirmatn، Responsive، Accessible.

Visual direction:
Modern SaaS / Enterprise Operations Command Center.

Primary UI reference:
Atomic CRM.

Secondary:
BottleCRM.

Optional:
Krayin CRM.

Target frontend stack:
React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + TanStack + React Hook Form + Zod + Recharts + Lucide.

UI باید minimal، data-dense but uncluttered، با borderهای ظریف، typography تمیز، status badge، sticky actions، drawers و timeline باشد.

## 21. Security
Default deny.
Production auth واقعی.
Secure session/cookie.
MFA-ready.
Customer isolation.
Private files.
Malware scanning.
Signed URLs after authorization.
Secrets خارج Git.
Audit append-only.
Prompt injection defense.
No sensitive content in logs/prompts.

## 22. Database/API/Event Architecture
FastAPI modular monolith.
PostgreSQL.
Alembic.
Transactional Outbox.
Idempotency for sensitive commands.
Optimistic concurrency.
Background jobs/DLQ.
No external API inside long DB transaction.

## 23. Deployment
Environments:
development, staging, production.

Target components:
frontend, api, postgres, redis, workers, private storage, reverse proxy.

Initial single VPS/managed services acceptable but not HA.
Backup offsite + restore drill.
Health/ready separate.
Structured logs + metrics + alerts.
No auto migration on app startup in production.

## 24. Testing
Unit + Integration + API + Permission + Worker + AI Contract + Security + E2E + UAT.
Any failing P0 test = NO GO-LIVE.

Critical E2E:
Import, Export, Confirmation/Lock/Reopen, Documents/Versions, HS, Expiry, Finance, Communication, Customer isolation, Package integrity.

## 25. Migration
V4 remains operational bridge until Cutover.
Preserve stable legacy IDs.
Migrate Customers → Users/Permissions → Cases/Assignments → Tasks → Document Metadata → selected Finance.
Google Drive binaries may stay in place initially.
Avoid permanent bidirectional dual-write.
Final authority becomes PostgreSQL.

## 26. Priority
P0:
Foundation, Auth/RBAC, Customer/Case, Workflow/Task, Documents, AI Precheck/HS, Submission Governance, Compliance, Finance, Communication, Export, Security, Deployment, E2E.

P1:
Smart Correspondence advanced, Reporting, Advanced AI, Workload/SLA enhancements.

P2:
Predictive AI, advanced customization, HA/multi-region, advanced SSO.

## 27. معیار پایان پروژه
- همه P0 پیاده‌سازی و تست شده‌اند
- Full System Audit PASS
- Go-Live Audit READY
- Security PASS
- Backup/Restore PASS
- Import/Export E2E PASS
- Customer/Admin UAT PASS
- هیچ Critical defect باز نیست
