# کاراترخیص — سامانه مدیریت عملیات ترخیص و کارگزاری گمرکی

کاراترخیص یک CRM عمومی نیست؛ یک سامانه اختصاصی **Case Management + Operations Management** برای مدیریت مشتری، پرونده گمرکی، اسناد، وظایف، مالی، ارتباطات، هوش مصنوعی، نامه‌نگاری، صادرات و کنترل دسترسی است.

## وضعیت فعلی پروژه

شاخه Canonical توسعه:
`codex/canonical-v5-build`

معماری هدف:
- Backend: FastAPI
- Database: PostgreSQL / Neon
- ORM: SQLAlchemy 2
- Migration: Alembic
- Frontend هدف: React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- معماری: Modular Monolith
- V4: Google Sheets + Apps Script + Drive + Telegram به‌عنوان پل عملیاتی Legacy

## اگر Codex/Claude هستی

اول این فایل‌ها را به همین ترتیب بخوان:

1. `AGENTS.md`
2. `PROJECT_STATUS.md`
3. `docs/START_HERE.md`
4. `docs/AI_AGENT_CONTEXT.md`
5. `docs/MASTER_SPEC_FA.md`
6. `docs/BUSINESS_RULES.md`
7. سند Domain مربوط به Task
8. `docs/TRACEABILITY_MATRIX.md`
9. `docs/CODEX_EXECUTION_GUIDE_FA.md`

بعد فقط Task بعدی ثبت‌شده در `PROJECT_STATUS.md` را اجرا کن.

## معماری کسب‌وکار

```text
Customer
  ↓
Case
  ↓
Workflow Stage
  ↓
Task
  ↓
Action

همراه با:
Documents
Finance
Communication
AI
Timeline
Audit
Alerts
Correspondence
```

## ماژول‌های اصلی

- Lead / Referral
- Customer 360
- Product / HS
- Case Registration Wizard
- Workflow / Stage / Task / SLA
- Document Management / Versioning
- AI Document Intelligence
- Customer Final Confirmation / Submission Lock
- Corporate Document Compliance / Expiry
- Finance
- Communication Hub / Telegram
- Smart Correspondence
- Export Workflow / Packing List / PDF Package
- Dashboard / Reporting / Search
- Employees / RBAC
- Security / Audit
- Deployment / Backup / Monitoring

## طراحی UI

هدف UI:
**Modern SaaS + Enterprise Operations Command Center**

ویژگی‌ها:
- فارسی
- RTL
- Vazirmatn
- Responsive
- Dark/Light mode
- Minimal
- Data-dense but uncluttered
- No dead buttons
- Backend-driven permissions

### مراجع UI

**مرجع اصلی: Atomic CRM**  
https://github.com/marmelab/atomic-crm

**مرجع ثانویه: BottleCRM**  
https://github.com/mj-pagani/BottleCRM

**مرجع اختیاری: Krayin CRM**  
https://github.com/krayin/laravel-crm

قاعده:
این پروژه‌ها فقط مرجع UX/UI/interaction هستند. Product Authority و Business Rule همیشه متعلق به کاراترخیص است.

## Migrationهای فعلی V5

- `0001_initial_v5_schema`
- `0002_case_sync_metadata`
- `0003_tasks`
- `0004_documents`

این Migrationها Historical Baseline هستند و نباید Rewrite شوند.

## وضعیت فعلی Backend

پیاده‌سازی‌شده/قابل استفاده:
- Customers
- Users
- Permissions
- Cases
- Case Assignments
- Tasks
- Task Messages
- Documents baseline
- Audit Logs
- Google Sheets sync foundation
- Health endpoints

Gapهای مهم:
- automated QA/CI
- production authentication
- advanced RBAC
- document version/file model
- queue/workers
- AI layer
- HS
- submission confirmation/lock/reopen
- compliance/expiry worker
- finance
- communication
- export
- modern frontend

## Source of Truth

هدف نهایی:
`PostgreSQL = Source of Truth`

Google Sheets:
Migration / Integration / Reporting Surface

Google Drive:
در دوره مهاجرت می‌تواند مخزن فایل باقی بماند.

## اسناد مهم

- [شروع سریع Agent](docs/START_HERE.md)
- [سند جامع محصول](docs/MASTER_SPEC_FA.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [معماری](docs/ARCHITECTURE.md)
- [دیتابیس](docs/DATABASE.md)
- [API](docs/API.md)
- [UI/UX](docs/UI_UX.md)
- [مراجع UI](docs/UI_REFERENCES.md)
- [AI](docs/AI_SYSTEM.md)
- [امنیت](docs/SECURITY.md)
- [صادرات](docs/EXPORT_WORKFLOW.md)
- [نامه‌نگاری](docs/CORRESPONDENCE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Testing](docs/TESTING.md)
- [Roadmap](docs/IMPLEMENTATION_ROADMAP_FA.md)
- [راهنمای Codex](docs/CODEX_EXECUTION_GUIDE_FA.md)
- [Traceability](docs/TRACEABILITY_MATRIX.md)

## زبان Repository

توضیحات، راهنماها و Product Documentation باید فارسی باشند.

نام فایل‌های فنی، APIها، کلاس‌ها، enumها، migrationها و identifierهای کدنویسی می‌توانند انگلیسی باشند تا tooling و interoperability خراب نشود.

## قانون توسعه

هیچ Feature حساس بدون:
- Requirement
- Backend rule
- Permission
- Test
- Acceptance Criteria
- Audit where required

کامل محسوب نمی‌شود.

## Go-Live

تا زمانی که این موارد PASS نشده‌اند Production Cutover ممنوع است:
- Production Auth
- P0 tests
- Customer isolation
- Submission lock
- Document versioning
- HS/human approval
- Finance ledger integrity
- Export package integrity
- Backup/Restore
- Security audit
- Import/Export E2E
- Production version identity reconciliation

## وضعیت Version Drift

فعلاً یک Blocker شناخته‌شده وجود دارد:
- `main` مستندات V4.26
- V5 docs اشاره به Production V4.9.2
- Audit قبلی اشاره به V4.30 staging target

قبل از Cutover باید Version/Deployment/Commit واقعی Production دقیقاً Pin شود.
