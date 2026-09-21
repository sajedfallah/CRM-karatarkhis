# از اینجا شروع کن — راهنمای کامل Agent

اگر فقط لینک این Repository به Codex/Claude داده شده است، این صفحه نقطه شروع است.

## این پروژه چیست؟

کاراترخیص یک سامانه اختصاصی مدیریت عملیات ترخیص و کارگزاری گمرکی است؛ یک CRM عمومی نیست. محور سیستم «پرونده» و اجرای فرآیند عملیاتی است:

```text
Customer → Case → Workflow Stage → Task → Action
                          ↓
            Documents / Finance / Communication / AI / Audit
```

## وضعیت معماری

این Repository دو نسل مهم دارد:

- **V4 Legacy:** Google Sheets + Google Apps Script + Google Drive + Telegram
- **V5 Canonical:** FastAPI + SQLAlchemy 2 + PostgreSQL/Neon + Alembic

V4 تا زمان Cutover حذف نمی‌شود. V5 باید مرحله‌ای کامل شود و در نهایت Source of Truth را از Sheets به PostgreSQL منتقل کند.

## Frontend هدف

Frontend نهایی باید یک Web App فارسی، RTL و مدرن باشد.

Stack پیشنهادی/مورد تأیید:
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

جهت بصری:
Modern SaaS + Operations Command Center + Minimal Enterprise.

## ترتیب مطالعه

1. `MASTER_SPEC_FA.md`
2. `BUSINESS_RULES.md`
3. `ARCHITECTURE.md`
4. `DATABASE.md`
5. `API.md`
6. `UI_UX.md`
7. `UI_REFERENCES.md`
8. `AI_SYSTEM.md`
9. `SECURITY.md`
10. `EXPORT_WORKFLOW.md`
11. `CORRESPONDENCE.md`
12. `DEPLOYMENT.md`
13. `TESTING.md`
14. `IMPLEMENTATION_ROADMAP_FA.md`
15. `CODEX_EXECUTION_GUIDE_FA.md`

## ترتیب ساخت

Foundation → QA/CI → Auth/RBAC → CRM → Product/HS → Case Draft → Workflow/Task → Documents → AI → Confirmation/Lock → Compliance → Finance → Communication → Export → Frontend → Reporting/Advanced AI → Security/Deployment → UAT/Go-Live.

## قاعده مهم

هرگز از روی ظاهر Atomic/Bottle/Krayin، Business Logic آن‌ها را کپی نکن. UI Reference از Product Authority جدا است.

مرجع نهایی رفتار کاراترخیص همین مخزن است.
