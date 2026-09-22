# نامه‌نگاری هوشمند کاراترخیص — Smart Correspondence

## وضعیت فعلی

این ماژول در V5 هنوز پیاده‌سازی نشده و در وضعیت **MISSING / PLANNED** است.

این سند رفتار Canonical ماژول نامه‌نگاری را تعریف می‌کند و برای Codex مرجع رسمی است.

---

## 1. هدف

کاربر باید بتواند برای موضوعات پرتکرار از Templateهای آماده استفاده کند و فقط اطلاعات لازم را تکمیل کند.

اگر Template مناسب وجود نداشت، AI باید:

1. موضوع درخواست را بفهمد.
2. نزدیک‌ترین دسته نامه را پیشنهاد دهد.
3. اطلاعات ناقص مورد نیاز را از کاربر بپرسد.
4. از Context مجاز مشتری/پرونده/اسناد استفاده کند.
5. پیش‌نویس رسمی تولید کند.
6. قبل از ارسال، متن را برای Review/Edit انسانی نمایش دهد.
7. در صورت تأیید و داشتن Permission، امکان ذخیره ساختار به‌عنوان Template جدید را پیشنهاد دهد.

اصل معماری:

```text
Template First
      ↓
Structured Fields
      ↓
CRM Context
      ↓
AI Draft/Polish
      ↓
Human Review
      ↓
Approval if required
      ↓
Finalize / Send / Export
      ↓
Archive + Timeline + Audit
```

AI جای Template Engine یا Human Approval را نمی‌گیرد.

---

## 2. منوی نامه‌نگاری

حداقل بخش‌ها:

- نامه جدید
- قالب‌های آماده
- پیش‌نویس‌ها
- در انتظار بررسی
- در انتظار تأیید
- آماده ارسال
- ارسالی
- دریافتی
- نیازمند پاسخ
- نامه‌های پرونده
- نامه‌های مشتری
- نامه‌های گمرک
- بایگانی

---

## 3. روش ساخت نامه جدید

### حالت A — استفاده از Template آماده

Flow:

```text
New Letter
→ Select Context
→ Select Template
→ Auto-fill CRM Data
→ Ask Missing Fields
→ Preview
→ Optional AI Rewrite/Polish
→ Human Review
→ Approval if required
→ Finalize/Send
```

کاربر ابتدا Context را مشخص می‌کند:

- Customer
- Case
- Document
- Customs Office / Organization
- Recipient
- General/Internal

سپس سیستم Templateهای مرتبط را بر اساس Context و موضوع نمایش می‌دهد.

---

### حالت B — Template مناسب وجود ندارد

Flow:

```text
Describe Request
→ AI Understands Intent
→ AI Suggests Letter Category
→ AI Suggests Existing Similar Templates
→ No Suitable Template?
→ Ask Required Questions
→ Generate Draft
→ Human Review/Edit
→ Optional Approval
→ Finalize
→ Optional Save as New Template
```

AI نباید بلافاصله از یک توضیح کوتاه نامه نهایی بسازد، اگر اطلاعات کلیدی ناقص است.

---

## 4. Template Library

هر Template باید Entity مستقل و Versioned باشد.

فیلدهای پیشنهادی:

- Template ID
- Title
- Category
- Operation Type
- Recipient Type
- Related Entity Type
- Subject Pattern
- Body Pattern
- Required Variables
- Optional Variables
- Allowed Context Sources
- Tone
- Approval Policy
- Active Version
- Created By
- Approved By
- Status
- Created At
- Updated At

Status:

- DRAFT
- UNDER_REVIEW
- APPROVED
- ACTIVE
- INACTIVE
- SUPERSEDED
- ARCHIVED

Template فعال فقط نسخه APPROVED/ACTIVE است.

ویرایش Template فعال باید Version جدید بسازد؛ نسخه قبلی نباید overwrite شود.

---

## 5. Template Variable Engine

Templateها باید Placeholder داشته باشند.

نمونه:

```text
{{customer.name}}
{{case.id}}
{{case.customs}}
{{case.real_case_number}}
{{document.number}}
{{document.date}}
{{shipment.gross_weight}}
{{shipment.net_weight}}
{{product.description}}
{{hs_code}}
{{recipient.name}}
{{recipient.title}}
{{today}}
```

Variable باید از Source مشخص و مجاز Resolve شود.

اگر مقدار معتبر موجود نباشد:

```text
[نیازمند تکمیل: شماره پرونده]
```

یا UI باید از کاربر مقدار را درخواست کند.

AI اجازه ندارد Missing Variable را اختراع کند.

---

## 6. Template Categories پیشنهادی

کتابخانه اولیه باید قابل توسعه باشد و حداقل بتواند این دسته‌ها را پشتیبانی کند:

### پرونده و گمرک
- درخواست بررسی پرونده
- درخواست رفع نقص
- درخواست اصلاح اطلاعات
- درخواست پیگیری
- درخواست تسریع
- پاسخ به اخطار
- پاسخ به استعلام
- توضیح مغایرت
- درخواست تمدید مهلت
- درخواست اصلاح اظهار/مدارک در صورت مجاز بودن

### اسناد
- درخواست ارسال سند از مشتری
- اعلام نقص مدارک
- درخواست نسخه اصلاحی
- اعلام انقضای مدرک
- درخواست تمدید/جایگزینی مجوز
- تأیید دریافت مدارک

### مالی
- درخواست پرداخت
- اعلام مانده
- درخواست علی‌الحساب
- اعلام دریافت وجه
- پیگیری هزینه/صورتحساب

### مشتری
- اعلام وضعیت پرونده
- درخواست اقدام مشتری
- اعلام آماده بودن مرحله بعد
- درخواست تأیید اطلاعات
- اعلام نیاز به اصلاح
- اعلام تکمیل فرآیند

### حمل/صادرات
- هماهنگی راننده/خودرو
- درخواست اطلاعات حمل
- اعلام آماده بودن Packing List
- درخواست مدارک صادرات
- اعلام آماده بودن بسته صادراتی

### عمومی
- نامه رسمی آزاد
- پاسخ رسمی آزاد
- معرفی‌نامه
- درخواست جلسه/هماهنگی
- یادآوری رسمی

این لیست Hardcoded دائمی نیست؛ Admin مجاز باید بتواند Category/Template جدید تعریف کند.

---

## 7. AI در نامه‌نگاری

AI در این ماژول مجاز است:

- Intent Classification
- Template Recommendation
- Similar Template Search
- Missing Information Detection
- Draft Generation
- Rewrite
- Tone Adjustment
- Grammar/Clarity Improvement
- Summarize Incoming Letter
- Suggest Reply
- Extract Deadlines/Requests from incoming letter

AI مجاز نیست:

- شماره پرونده اختراع کند
- شماره سند اختراع کند
- تاریخ قطعی اختراع کند
- مبلغ اختراع کند
- HS Code تأییدنشده را به‌عنوان قطعی بنویسد
- نام گیرنده یا سمت او را حدس بزند
- تصمیم حقوقی/گمرکی حساس را به‌عنوان Fact قطعی جا بزند
- نامه حساس را خودکار ارسال کند مگر Policy صریح و Approved Automation وجود داشته باشد

---

## 8. Context Resolution

AI فقط باید Contextی را دریافت کند که User مجاز به دیدن آن است.

Context ممکن است شامل:

- Customer profile
- Case summary
- Current stage
- Relevant tasks
- Approved document metadata
- Verified document fields
- Human-verified HS
- Finance status در صورت داشتن Permission
- Prior correspondence
- Recipient data
- Timeline events

اطلاعات داخلی حساس، هزینه داخلی، Profit و Notes خصوصی نباید بدون Permission وارد Prompt شوند.

---

## 9. Missing Information Flow

اگر اطلاعات کافی نیست:

Status:
`NEEDS_INFORMATION`

AI باید Missing Fields را Structured برگرداند.

مثال:

```json
{
  "status": "NEEDS_INFORMATION",
  "missing_fields": [
    "recipient_name",
    "recipient_title",
    "requested_deadline"
  ]
}
```

Frontend باید سؤال‌ها را مرحله‌ای و کوتاه از کاربر بپرسد.

بعد از تکمیل اطلاعات، Draft دوباره Generate/Render می‌شود.

---

## 10. AI Template Suggestion

هنگام ایجاد نامه:

1. ابتدا Search روی Template Library.
2. Templateهای مرتبط با Category/Context/Recipient rank شوند.
3. AI می‌تواند حداکثر چند Template مشابه پیشنهاد دهد.
4. کاربر Template را انتخاب می‌کند.
5. اگر هیچ‌کدام مناسب نبود:
   - "ساخت پیش‌نویس جدید با AI"
   - فعال می‌شود.

AI نباید بدون بررسی Template Library مستقیماً Freeform Generation را Default کند.

---

## 11. Save AI Draft as Template

بعد از نهایی‌شدن یک نامه Freeform، سیستم می‌تواند پیشنهاد دهد:

`ذخیره به‌عنوان قالب جدید`

اما ذخیره مستقیم به Active Template ممنوع است.

Flow:

```text
Final Letter
→ Suggest Save as Template
→ User chooses reusable fields
→ System converts fixed values to variables
→ Template Draft
→ Human/Admin Review
→ Approve
→ New Active Template Version
```

AI می‌تواند Variable Candidate پیشنهاد دهد، ولی فعال‌سازی Template نیازمند مجوز انسانی است.

---

## 12. Letter Status

Statusهای Canonical:

- DRAFT
- AI_GENERATED
- NEEDS_INFORMATION
- UNDER_REVIEW
- APPROVAL_REQUIRED
- APPROVED
- READY_TO_SEND
- SENT
- RECEIVED
- RESPONSE_PENDING
- RESPONDED
- CANCELLED
- ARCHIVED
- SUPERSEDED

---

## 13. Human Review / Approval

تمام نامه‌های Outbound رسمی باید حداقل Human Review داشته باشند.

برای انواع حساس، Approval اضافی لازم است.

Policy می‌تواند بر اساس موارد زیر تعیین شود:

- Letter Category
- Recipient Type
- Customer
- Case Risk
- Financial Content
- Legal/Customs Sensitivity
- Amount Threshold
- User Role

مثلاً:
Employee Draft → Manager Approval → Send

یا:
Manager Draft → Review → Send

---

## 14. Incoming Correspondence

نامه دریافتی می‌تواند Upload/Register شود.

AI می‌تواند:

- Sender را پیشنهاد کند
- Subject را استخراج کند
- Reference number/date را استخراج کند
- Summary بدهد
- Requested Actionها را استخراج کند
- Deadline احتمالی را تشخیص دهد
- Suggested Task بسازد
- Reply Template پیشنهاد دهد
- Draft Response تولید کند

Task/Deadline نهایی باید طبق Permission و Workflow ثبت شود.

---

## 15. Letter → Task

هر Letter می‌تواند:

- Task ایجاد کند
- Existing Task را Link کند
- Due Date ایجاد کند
- Approval Task ایجاد کند
- Customer Action ایجاد کند

مثال:
Incoming letter با deadline → Suggested Task → Human confirmation → Task created.

---

## 16. Letter Data Model هدف

حداقل Entityها:

- correspondence_letters
- correspondence_letter_versions
- correspondence_templates
- correspondence_template_versions
- correspondence_template_variables
- correspondence_recipients
- correspondence_approvals
- correspondence_attachments
- correspondence_threads
- correspondence_ai_generations

ارتباط با:

- customer_id
- case_id
- task_id
- document_id
- thread_id
- parent_letter_id

---

## 17. APIهای هدف

نمونه Command Endpointها:

```text
GET  /api/v1/correspondence/templates
POST /api/v1/correspondence/templates/search
POST /api/v1/correspondence/templates/{id}/render

POST /api/v1/correspondence/letters
POST /api/v1/correspondence/letters/{id}/ai-draft
POST /api/v1/correspondence/letters/{id}/request-information
POST /api/v1/correspondence/letters/{id}/request-approval
POST /api/v1/correspondence/letters/{id}/approve
POST /api/v1/correspondence/letters/{id}/finalize
POST /api/v1/correspondence/letters/{id}/send
POST /api/v1/correspondence/letters/{id}/create-template-draft
```

Sensitive commands باید idempotent/audited باشند.

---

## 18. UI پیشنهادی

New Letter Wizard:

### Step 1
انتخاب:
- Customer
- Case
- Recipient
- Type/Category

### Step 2
نمایش:
- Recommended Templates
- Search Templates

### Step 3
اگر Template انتخاب شد:
- Auto-filled variables
- Missing variables
- Edit fields

اگر Template نبود:
- "موضوع درخواست را توضیح دهید"
- AI clarification questions

### Step 4
Draft Editor:
- Template content
- AI suggestions
- Rewrite
- رسمی‌تر
- کوتاه‌تر
- واضح‌تر
- Generate alternative
- Restore previous version

### Step 5
Review:
- Data source indicators
- Missing data warnings
- Approval status
- Attachments

### Step 6
Finalize / Approval / Send

---

## 19. Source Indicators

در Editor بهتر است اطلاعات Auto-filled مشخص باشند:

- CRM Verified
- Document Extracted
- Human Entered
- AI Suggested
- Missing

این باعث می‌شود کاربر بداند هر Fact از کجا آمده است.

---

## 20. Versioning

Letter Draftها Versioned هستند.

AI Regenerate نباید Draft قبلی را از بین ببرد.

SENT نامه immutable است.

Correction بعد از SENT:
- New Version / Correction Letter
- Link to original
- Audit

---

## 21. Output

خروجی‌های هدف:

- PDF
- Word/DOCX در صورت نیاز
- Print
- Customer Portal
- Email
- Telegram link/notification
- Archive

ارسال روی Channel باید از Communication/Notification architecture استفاده کند.

---

## 22. Audit

ثبت شود:

- creator
- template used
- template version
- AI model/request ID
- context references
- human edits
- approval
- approver
- finalizer
- send channel
- recipient
- sent timestamp
- attachment versions

---

## 23. Security

- Prompt context باید permission-aware باشد.
- AI نباید Hidden/Internal field دریافت کند مگر مجاز.
- Template expression نباید arbitrary code اجرا کند.
- User input و incoming letter content untrusted است.
- Prompt injection داخل نامه/Attachment نباید بتواند Policy را تغییر دهد.
- Recipient قبل از Send دوباره Validate شود.
- Sensitive send نیازمند re-authorization/confirmation است.

---

## 24. Acceptance Criteria هدف

- کاربر بتواند Template مناسب را Search/Select کند.
- Template بتواند داده مجاز CRM را Auto-fill کند.
- Missing variables واضح باشند.
- AI فقط در نبود Template یا برای Draft/Rewrite وارد شود.
- AI Template پیشنهاد دهد.
- AI Missing Information را قبل از Draft نهایی درخواست کند.
- هیچ Fact حساس اختراع نشود.
- Draft قبل از Send Human Review شود.
- Sensitive Letter Approval داشته باشد.
- SENT immutable باشد.
- AI-generated successful letter بتواند به Template Draft تبدیل شود.
- Active Template فقط با Human Approval ایجاد شود.
- تمام عملیات مهم Audit شوند.

---

## 25. تصمیم نهایی

نامه‌نگاری کاراترخیص **Template-First + AI-Assisted** است.

AI یک Freeform Letter Generator بدون Governance نیست.

ترتیب استاندارد همیشه این است:

```text
Existing Template?
  ├─ YES → Fill → Review → AI Polish Optional → Approve → Send
  └─ NO  → AI Understand → Ask Missing Info → Draft → Review
                    → Optional Save as Template Draft
                    → Admin Approval → Reusable Template
```
