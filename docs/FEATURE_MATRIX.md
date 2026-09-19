# Feature Matrix — امکانات و وابستگی‌های کاراترخیص

| قابلیت | شیت‌های اصلی | Apps Script / اتوماسیون | Drive | Telegram |
|---|---|---|---|---|
| Lead & Marketing | سرنخ‌ها، بازاریابی و پیگیری، پیگیری‌ها | reminder/escalation, assignment | — | گزارش/هشدار |
| Customer | مشتریان، مشتری جدید، اسناد مشتریان | createCustomer, folder automation | Customer folder | گزارش مهم |
| Customer Manager | مدیریت کاربران، Users، Permissions | company dropdown, Customer ID linking | role workspace | role home |
| Case | پرونده‌ها، پرونده جدید | create/update, scope sync | Case folder | پرونده‌های مهم |
| Assignments | Case Assignments، Assignment History، Assignment Policy | role scope and history | — | scoped access |
| Generic Tasks | تسک‌ها | lifecycle, manager flag | — | تسک‌های مهم |
| Personal Daily Tasks | کارهای روزانه، Workspace tab | bidirectional sync, categories | Workspace | کارهای امروز |
| Customer Tasks | تسک‌های مشتریان، پیام‌های تسک مشتری | messaging/escalation | — | customer/employee messages |
| Documents | اسناد پرونده، نسخه‌های اسناد، چک‌لیست اسناد | upload/version/status | Drive files | alerts |
| Clearance | رویدادهای خروج، پرونده‌ها | remaining/progress calculations | — | report |
| User/RBAC | Users، Permissions، مدیریت کاربران | authorization, validation | Workspace share | auth/menu |
| Provisioning | Provisioning Queue/Log/Settings | async worker, retry, idempotency | RAW Template → Workspace | status |
| Dashboards | داشبورد مدیریتی، Dashboard Registry، role workspaces | scoped sync/render | LIVE + Workspace | links/reports |
| Alerts | مرکز هشدارها، Settings | scheduled checks/cache | — | essential alerts |
| Observability | System Log | error/performance logs | — | failure handling |
| Configuration | Settings، فهرست‌ها | runtime rules and dropdowns | — | — |
| Legacy compatibility | میز کار اردوان، پرونده‌ها و تسویه اردوان، اسناد پرونده‌ها، کارمندان | compatibility/migration | legacy links | legacy IDs |

## مسیر توسعه یک قابلیت

1. تعریف business rule.
2. تعیین Source-of-Truth sheet.
3. تعریف IDs و foreign keys.
4. تعریف columns: user input / system / calculated / read-only.
5. تعریف validation.
6. پیاده‌سازی Apps Script.
7. تعریف Drive side-effect در صورت نیاز.
8. تعریف role access.
9. تعریف Telegram output فقط اگر اطلاعات مهم است.
10. unit/static test.
11. test روی staging copy.
12. migration workspace/template.
13. integration/E2E test.
14. documentation.
15. PR و production rollout.

## قانون تغییر Schema

هیچ ستون rename/delete/reorder بدون بررسی این موارد انجام نشود:
- Apps Script header lookup
- Formula references
- Data Validation
- Dashboard formulas
- Workspace sync
- Role view column list
- Telegram formatter
- legacy sheet dependency
- named ranges
- external links/imports

## قانون تغییر Template

Templateهای پوشه تمپلیت canonical هستند. برای تغییر UI Role:
1. RAW Template همان Role اصلاح شود.
2. test روی copy انجام شود.
3. migration function برای Workspaceهای موجود نوشته شود.
4. sync اجرا شود.
5. role access و formula scope تست شود.

## قانون Telegram

تلگرام interface ورودی سنگین نیست. عملیات CRUD عمدتاً در Google Sheets انجام می‌شود. callback ساده نباید Sheet/Drive scan سنگین انجام دهد.
