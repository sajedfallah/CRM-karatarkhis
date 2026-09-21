# قواعد Canonical طراحی UI/UX کاراترخیص

## 1. هدف ظاهری

پنل کاراترخیص باید یک نرم‌افزار Enterprise مدرن و عملیاتی باشد، نه یک داشبورد قدیمی CRM.

جهت بصری:
- Modern SaaS
- Enterprise Operations
- Minimal
- Data-dense but uncluttered
- Command Center oriented
- Persian-first
- RTL-native
- Responsive
- Dark/Light mode

## 2. Stack رسمی Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- TanStack Table
- TanStack Router
- React Hook Form
- Zod
- Recharts
- Lucide

Backend مستقل باقی می‌ماند:
FastAPI + PostgreSQL.

## 3. مرجع‌های UI

### Primary
Atomic CRM
https://github.com/marmelab/atomic-crm

از آن برای:
- Layout
- CRM navigation
- Data tables
- Forms
- Kanban
- activity history
- drawers
- filters
- interaction patterns
استفاده شود.

### Secondary
BottleCRM
https://github.com/mj-pagani/BottleCRM

برای:
- Case UX
- Task UX
- Account/Customer organization
- Invoice/CRM relationship
- multi-tenant interaction patterns

### Optional
Krayin CRM
https://github.com/krayin/laravel-crm

برای:
- Admin navigation
- Settings
- Custom attributes
- Lead/contact management patterns

قانون:
هیچ‌کدام Product Authority نیستند. Specification کاراترخیص مقدم است.

## 4. Visual Language

- پس‌زمینه‌های ساده و خنثی
- Border ظریف
- Radius متوسط
- Shadow محدود
- Typography واضح
- whitespace کنترل‌شده
- Accent رنگ برند فقط برای Actionهای اصلی
- سبز فقط Success
- قرمز فقط Critical/Error
- نارنجی/Amber برای Warning
- آبی برای Info/Action
- از Gradient و کارت‌های تزئینی بیش‌ازحد پرهیز شود

## 5. Dashboard مدیر

بالا:
- پرونده فعال
- پرونده Critical
- Task overdue
- SLA breach
- اسناد نیازمند Review
- اسناد نزدیک انقضا

پایین:
- پرونده‌های نیازمند اقدام
- Taskهای عقب‌افتاده
- هشدارهای مالی
- Expiry alerts
- Team workload
- Recent activity

هر KPI باید actionable باشد.

## 6. Case Command Center

Header:
- Case ID
- Customer
- Operation Type
- Current Stage
- Owner
- Risk
- Document Readiness
- Financial Status
- Next Action
- SLA/Deadline

Action Bar:
- تغییر Stage
- ایجاد Task
- درخواست سند
- ثبت پیام
- ثبت هزینه/پرداخت
- AI Review
- Reopen/Override فقط با Permission

Tabs:
نمای کلی، عملیات، وظایف، اسناد، مالی، ارتباطات، نامه‌ها، Timeline، AI، تنظیمات.

## 7. Customer 360

Header:
- Customer name
- status
- owner
- risk/health
- active cases
- outstanding finance
- expiring documents

Tabs:
نمای کلی، مخاطبین، پرونده‌ها، وظایف، اسناد، مالی، ارتباطات، نامه‌نگاری، یادداشت‌ها، Timeline، کاربران پرتال، AI، تنظیمات.

## 8. Lead Pipeline

Kanban با Drag/Drop کنترل‌شده.
هر Card:
- نام شرکت
- Contact
- Owner
- Next Action
- Follow-up date
- Lead source
- probability/value در صورت نیاز

Stage change باید Business Rule را رعایت کند.

## 9. Tasks

Viewها:
- My Tasks
- Today
- Overdue
- Case Tasks
- Customer Tasks
- Approval Tasks
- Calendar
- Kanban

Task Drawer:
title, context, owner, collaborators, priority, deadline, SLA, checklist, dependencies, comments, files, activity.

## 10. Documents

Document Center:
- requirements checklist
- upload
- current version
- version history
- status
- AI findings
- evidence/confidence
- expiry
- reviewer
- compare view

Document Viewer و AI Finding Panel کنار هم در Desktop.

## 11. Customer Portal

Mobile-first و ساده.

منو:
خانه، پرونده‌های من، اقدامات من، اسناد، مالی، پیام‌ها، اعلان‌ها، پروفایل.

Customer نباید:
- internal notes
- internal costs/profit
- internal AI reasoning
- internal permissions
- internal messages
را ببیند.

## 12. Persian/RTL

- کل App `dir=rtl`
- Vazirmatn
- Technical IDs با LTR isolation
- Date/Number formatting قابل پیکربندی
- متن فارسی، اصطلاح فنی در صورت نیاز انگلیسی
- Icon direction در RTL بررسی شود

## 13. Component System

حداقل Componentهای reusable:
- AppShell
- Sidebar
- Topbar
- PageHeader
- EntityHeader
- DataTable
- FilterBar
- SearchCommand
- StatusBadge
- RiskBadge
- KPI Card
- TaskDrawer
- DocumentViewer
- AIResultCard
- Timeline
- ActivityFeed
- EmptyState
- ErrorState
- PermissionState
- StickyActionBar
- ConfirmationModal
- WizardStepper
- FileUploader

## 14. States

هر Screen:
Loading
Skeleton
Empty
Error
Offline/Degraded
Permission Denied
Stale Data
Validation Error
Success feedback
Mobile state

No dead button.

## 15. Accessibility

- Keyboard navigation
- focus-visible
- semantic HTML
- ARIA where needed
- contrast
- reduced motion
- touch target حداقل مناسب موبایل

## 16. ممنوع

- کپی مستقیم Visual Identity پروژه‌های مرجع
- UI شلوغ و رنگارنگ
- کارت‌های بزرگ بدون ارزش عملیاتی
- Chart تزئینی
- Action بدون API واقعی
- Permission فقط در Frontend
- قرار دادن Business Rule در Component
