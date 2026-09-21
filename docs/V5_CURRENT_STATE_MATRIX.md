# V5 Current-State Matrix

| Subsystem | Status | Decision |
|---|---|---|
| FastAPI application | IMPLEMENTED | KEEP |
| PostgreSQL/Neon | IMPLEMENTED | KEEP |
| SQLAlchemy 2 | IMPLEMENTED | KEEP |
| Alembic migrations 0001-0004 | IMPLEMENTED | KEEP IMMUTABLE |
| Customers | IMPLEMENTED-PARTIAL | KEEP + EXTEND |
| Users/Permissions | IMPLEMENTED-PARTIAL | KEEP + EXTEND |
| Cases/Assignments | IMPLEMENTED | KEEP + EXTEND |
| Tasks/Task Messages | IMPLEMENTED | KEEP + EXTEND |
| Documents | PARTIAL | REFACTOR + EXTEND |
| Audit Logs | IMPLEMENTED | KEEP + EXTEND |
| Google Sheet sync | PARTIAL | KEEP AS MIGRATION/INTEGRATION ADAPTER |
| Health endpoints | IMPLEMENTED | KEEP |
| Production auth | MISSING | BUILD |
| Queue/Workers | MISSING | BUILD |
| AI Document Intelligence | MISSING | BUILD |
| Product/HS | MISSING | BUILD |
| Submission Confirmation/Lock/Reopen | MISSING | BUILD |
| Compliance/Expiry Worker | MISSING | BUILD |
| Finance | MISSING | BUILD |
| Communication/Notification | MISSING | BUILD |
| Smart Correspondence | MISSING | BUILD |
| Export Packing List/Package | MISSING | BUILD |
| Persian RTL web frontend | MISSING | BUILD |
| Automated CI/tests | MISSING | BUILD NEXT |
