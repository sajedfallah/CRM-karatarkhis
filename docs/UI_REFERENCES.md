# مراجع UI/UX و سورس‌های پیشنهادی

هدف این فایل این است که Codex دقیقاً بداند از پروژه‌های Open Source بیرونی چه چیزی بگیرد و چه چیزی نگیرد.

## 1) Atomic CRM — مرجع اصلی UI

Repository:
https://github.com/marmelab/atomic-crm

Demo:
https://marmelab.com/atomic-crm-demo

جایگاه:
**Primary UI/Interaction Reference**

چرا:
- React
- shadcn/ui / shadcn-admin-kit
- Vite
- ساختار CRM مدرن
- فرم‌ها، Contact/Company، Task، Notes، Kanban، Activity History، Import/Export
- قابل سفارشی‌سازی و مناسب Frontend مستقل

استفاده مجاز:
- Layout
- Navigation
- Data Table
- Filter/Search
- Detail Page
- Drawer/Modal
- Form UX
- Kanban
- Activity Timeline
- Dashboard composition
- Responsive patterns

استفاده غیرمجاز:
- انتقال Supabase به پروژه بدون Task
- جایگزینی FastAPI/PostgreSQL
- کپی کورکورانه Business Rule
- تقلید کامل Visual Identity

## 2) BottleCRM — مرجع ثانویه عملکرد CRM و Case UX

Repository:
https://github.com/mj-pagani/BottleCRM

جایگاه:
**Secondary Functional UX Reference**

نقاط مفید:
- Leads
- Accounts
- Contacts
- Opportunities
- Cases
- Tasks
- Invoices
- Multi-tenant UX
- Activity/Audit patterns

استفاده پیشنهادی:
برای نحوه سازمان‌دهی Case، Account/Customer، Task، Invoice و ارتباط ماژول‌ها.

ممنوع:
Backend Django/SvelteKit نباید جای FastAPI/React ما را بگیرد مگر تصمیم معماری جدیدی ثبت شود.

## 3) Krayin CRM — مرجع اختیاری

Repository:
https://github.com/krayin/laravel-crm

Demo:
https://demo.krayincrm.com/

جایگاه:
**Optional CRM/Admin Reference**

نقاط مفید:
- Admin Dashboard
- Settings
- Custom Attributes
- Lead/Contact navigation
- Modular CRM organization

ممنوع:
Laravel/PHP/Vue stack نباید وارد Backend/Frontend اصلی شود مگر Task صریح داشته باشد.

## ترتیب اولویت

```text
KARATARKHIS Canonical Specifications
            ↓
Atomic CRM — Primary UI
            ↓
BottleCRM — Secondary Functional UX
            ↓
Krayin CRM — Optional Pattern Reference
```

## روش استفاده توسط Codex

برای هر صفحه Frontend قبل از کدنویسی:

1. Requirementهای کاراترخیص را استخراج کن.
2. Atomic CRM را برای الگوی تعامل و layout بررسی کن.
3. در صورت مرتبط بودن BottleCRM را برای Case/Task/CRM flow بررسی کن.
4. در صورت نیاز Krayin را برای Admin/Settings pattern بررسی کن.
5. یک «Adaptation Plan» بنویس.
6. UI را داخل Design System کاراترخیص بازطراحی کن.
7. هیچ کد خارجی را بدون بررسی License/Dependency/Compatibility کپی نکن.

## اصل حقوقی/فنی

این Repositoryها منبع الهام و Reference هستند. هر استفاده مستقیم از کد باید مجوز و attribution لازم را رعایت کند و با Stack رسمی کاراترخیص سازگار باشد.
