# KARATARKHIS CRM — Business Rules

Rule results: PASS, WARNING, BLOCK, REVIEW_REQUIRED, OVERRIDE_REQUIRED, NOT_APPLICABLE.

## Submission
- SUB-001: Customer final confirmation is mandatory.
- SUB-002: Final submit creates an immutable snapshot.
- SUB-003: After submit, customer editing is backend-blocked.
- SUB-004: Customer cannot self-reopen.
- SUB-005: Admin reopen requires permission + reason + audit.
- SUB-006: Limited reopen is default.
- SUB-007: Resubmit requires new confirmation.
- SUB-008: Every submission is immutable and revisioned.

## Documents / AI
- DOC-001: Required documents are contextual.
- DOC-002: Missing required document may block submission.
- DOC-003: Replacement creates a new document version.
- DOC-004: Old versions remain immutable.
- AI-001: AI is advisory unless an explicit deterministic rule says otherwise.
- AI-002: Critical AI findings require source/evidence/confidence.
- AI-003: Source changes stale dependent AI results.
- AI-004: Low-confidence critical extraction requires human review.
- AI-005: Uploaded document text is untrusted input.

## Product / HS
- PRD-001: AI may suggest candidate HS codes.
- PRD-002: AI cannot final-verify legal HS classification.
- PRD-003: Authorized human verification is authoritative.
- PRD-004: Material product changes trigger HS revalidation.

## Corporate compliance
- CMP-001: Corporate documents are reusable customer assets with exact-version references.
- CMP-002: AI may extract issue/expiry/scope data.
- CMP-003: Low-confidence expiry requires human confirmation.
- CMP-004: Daily expiry evaluation is deterministic.
- CMP-005: Alerts are policy-configurable (e.g. 90/60/30/15/7/1/0 days).
- CMP-006: Expired required documents may block import/export.
- CMP-007: Customer cannot override expiry blocks.

## Export
- EXP-001: Packing List uses immutable submission snapshot.
- EXP-002: Generated PDFs are versioned/immutable.
- EXP-003: Package manifest records exact document-version IDs.
- EXP-004: Required expired/missing documents can block generation.

## Finance
- FIN-001: Confirmed payment posting is transactional.
- FIN-002: Posted ledger entries are immutable.
- FIN-003: Corrections use adjustment entries.
- FIN-004: Profit/internal costs are permission-restricted.

## Security
- SEC-001: Default deny.
- SEC-002: Authorization = role + resource + action + scope + field access.
- SEC-003: Backend is authoritative.
- SEC-004: Customer A must never access Customer B data.
- SEC-005: Sensitive overrides are permissioned and audited.

## Operations
- OPS-001: Heavy work is asynchronous.
- OPS-002: Critical commands are idempotent.
- OPS-003: External provider failure must not roll back already-committed core business transactions.


## Correspondence
- LTR-001: ساخت نامه به‌صورت Template-First است؛ Freeform AI generation مسیر پیش‌فرض نیست.
- LTR-002: قبل از AI Freeform، Template Library باید Search شود و Template مشابه پیشنهاد شود.
- LTR-003: AI در صورت نبود اطلاعات کافی باید NEEDS_INFORMATION و فهرست Missing Fields برگرداند.
- LTR-004: AI حق اختراع شماره پرونده، شماره سند، تاریخ، مبلغ، گیرنده یا HS تأییدشده را ندارد.
- LTR-005: تمام نامه‌های رسمی Outbound حداقل Human Review دارند.
- LTR-006: نامه‌های حساس طبق Approval Policy نیازمند Manager/Admin approval هستند.
- LTR-007: SENT immutable است؛ اصلاح بعدی باید Version/Correction جدید باشد.
- LTR-008: Template فعال Versioned و Human-Approved است.
- LTR-009: AI می‌تواند از Letter نهایی Template Draft پیشنهاد دهد، ولی حق فعال‌سازی مستقیم ندارد.
- LTR-010: Template Variable فقط از Context مجاز/verified یا Human Input Resolve می‌شود.
- LTR-011: Incoming Letter AI می‌تواند Summary/Task/Deadline/Reply پیشنهاد دهد؛ اجرای آن‌ها تابع Permission/Workflow است.
- LTR-012: AI context در نامه‌نگاری Permission-aware است و Internal/Finance sensitive data بدون مجوز وارد Prompt نمی‌شود.

## Identity / Organization / Portal
- IAM-001: ورود رسمی با Email + Password است و Email Verification برای فعال‌سازی لازم است.
- IAM-002: Internal و Customer Portal هسته Identity مشترک دارند ولی Permission/UX جدا است.
- IAM-003: User بدون Organization Membership فعال دسترسی عملیاتی ندارد.
- IAM-004: Customer Admin فقط کاربران Organization خودش را مدیریت می‌کند.
- IAM-005: Customer User می‌تواند به کل Organization یا Caseهای منتخب محدود شود.
- IAM-006: Access خارج از Organization همیشه DENY است.
- IAM-007: Invite token باید time-limited، single-use و audit شود.

## Audit / Operations
- AUD-001: Login/Invite/Role/Permission/Case/Document/Approval/Send/Reopen/Finance-sensitive actions audit شوند.
- AUD-002: Security events جدا از business audit قابل گزارش باشند.
- OPS-004: Dev/Staging/Prod جدا باشند.
- OPS-005: Feature Flag جای Permission/Business Rule را نمی‌گیرد.
- OPS-006: Backup بدون Restore Drill معتبر تلقی نمی‌شود.
- OPS-007: Correlation/Request ID برای عملیات API وجود داشته باشد.

## Notification / Announcement
- NTF-001: Actionable case event باید In-App Notification بسازد.
- NTF-002: Notification باید recipient/context/deep-link/read-state داشته باشد.
- NTF-003: Unread count در Home/Topbar نمایش داده شود.
- NTF-004: Internal-only event نباید برای Customer notification تولید کند.
- ANN-001: Admin می‌تواند Announcement عمومی/هدفمند با start/end time منتشر کند.
- ANN-002: Announcement منقضی‌شده نباید روی Home فعال نمایش داده شود.
- ANN-003: Audience filtering باید backend-enforced باشد.

## Case Timeline / Import
- IMP-001: Draft Declaration قبل از Customs Declaration نیازمند Customer Review است.
- IMP-002: Customer می‌تواند Draft را Approve یا همراه Comment درخواست Correction کند.
- IMP-003: Customs Declaration قبل از Approval مشتری BLOCK است مگر authorized audited override.
- IMP-004: بعد از Declaration، Kotazh Number به‌عنوان Primary Operational Reference ثبت می‌شود.
- IMP-005: Immutable technical Case ID با Kotazh Number جایگزین نمی‌شود.
- IMP-006: Customs Route فقط توسط internal user دارای permission ثبت می‌شود.
- IMP-007: Route یکی از GREEN/YELLOW/RED است.
- IMP-008: GREEN به Permit/Standard if required → Duties/Taxes → Exit Gate می‌رود.
- IMP-009: YELLOW به Virtual Expert → requested correction/document if any → Approval → Duties/Taxes → Exit Gate می‌رود.
- IMP-010: RED به Physical Evaluation → Virtual Expert → requested correction/document if any → Approval → Duties/Taxes → Exit Gate می‌رود.
- IMP-011: هر Stage می‌تواند Comment/Attachment/Request داشته باشد.
- IMP-012: Customer-visible Comment/Request باید Notification تولید کند.

## Satisfaction
- CSAT-001: پس از Case Completion یک Survey اختیاری ایجاد می‌شود.
- CSAT-002: Rating فقط 1..5 است و Comment اختیاری.
- CSAT-003: Survey فقط به Case و Customer Organization مربوط خودش قابل دسترسی است.
- CSAT-004: Aggregate reporting باید privacy/permission را رعایت کند.

## Search / Reports
- SRCH-001: Global Search permission-aware است.
- SRCH-002: Search حداقل Customer/Case/Kotazh/Document/Letter/Task/Contact را پوشش می‌دهد.
- RPT-001: Report خروجی فقط داده مجاز کاربر را شامل می‌شود.
- RPT-002: Saved View/Tag نباید Workflow State را تغییر دهد.
