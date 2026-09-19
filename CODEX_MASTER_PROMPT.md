# CODEX MASTER PROMPT — KARATARKHIS CRM

You are the lead implementation engineer for the Karatarkhis customs-brokerage CRM. Your job is not to produce a superficial review. You must inspect, repair, test, document, and deliver the system end-to-end.

## Repository and authority

Repository: sajedfallah/CRM-karatarkhis
Current baseline: V4.26
Primary implementation: src/apps-script/Code.gs
Read first:
1. README.md
2. docs/PROJECT_EXECUTION_WORKFLOW.md
3. docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md
4. docs/DRIVE_ARCHITECTURE.md

Do not trust documentation blindly. The live Google Sheet and Drive structure are the operational source of truth. Reconcile documentation with live state and update docs when they differ.

## Non-negotiable safety rules

- Work on branch codex/full-system-audit. Do not push experimental changes directly to main.
- Never commit secrets, Telegram tokens, real customer records, personal emails, phone numbers, Telegram IDs, or exported operational data.
- Use Apps Script Script Properties for BOT_TOKEN, ADMIN_TELEGRAM_ID, WEB_APP_URL and preferably all environment-specific IDs.
- Before destructive migration, create a backup/copy and document rollback.
- Never delete a Legacy sheet until you have proven there is no formula, Apps Script, trigger, validation, named range, dashboard, or workflow dependency.
- Do not claim a test passed unless you have executable evidence.

## Mission

Deliver a production-grade, internally consistent CRM where every Sheet, column, formula, validation, trigger, Drive folder, Role permission, Workspace, Telegram path, and Apps Script function has been audited and verified.

## Phase 1 — Inventory and baseline

1. Parse src/apps-script/Code.gs.
2. Enumerate every function and identify duplicate function declarations caused by historical override patches.
3. Build a canonical function map: active implementation vs superseded implementation.
4. Connect to the live CRM spreadsheet and enumerate every sheet, sheet ID, visibility, row/column bounds, named ranges, filters, frozen rows, protected ranges, validations, conditional formatting, formulas and charts.
5. Export a machine-readable inventory into docs/audit/.
6. Inventory all Apps Script triggers and deployments.
7. Inventory Drive folders, templates, LIVE dashboards and existing Workspace Mapping.
8. Inventory Telegram webhook status and bot commands without logging the bot token.

## Phase 2 — Sheet-by-sheet audit

For EVERY sheet:
- identify business purpose;
- identify primary key and foreign keys;
- list every column exactly;
- determine manual/system/formula/read-only ownership;
- inspect every formula and dependency;
- inspect every Data Validation;
- inspect formats and visibility;
- detect stale or duplicate legacy structures;
- test sample valid and invalid values;
- report broken references.

The minimum list is the complete catalog in docs/SHEETS_SCHEMA_AND_DEPENDENCIES.md. Do not skip hidden sheets.

## Phase 3 — Referential integrity

Validate at least:
- مشتریان.مشتری ID
- پرونده‌ها.Case ID and Customer ID
- تسک‌ها.Task ID and شناسه مرتبط
- اسناد پرونده.Document ID / Case ID
- نسخه‌های اسناد.Version ID / Document ID / Case ID
- رویدادهای خروج.Clearance Event ID / Case ID
- Users.User ID / Customer ID
- Permissions.User ID
- Workspace Mapping.User ID / Customer ID
- Case Assignments.Case ID / User ID
- Assignment History.Assignment ID / Case ID
- Provisioning Queue.User ID / Customer ID / Template File ID
- Provisioning Log.Request ID
- تسک‌های مشتریان.Task ID / مشتری ID / شناسه پرونده
- پیام‌های تسک مشتری.Task ID

Produce orphan reports. Repair only after backup and after determining intended ownership.

## Phase 4 — Formula audit

Programmatically scan the entire workbook, not only header rows.

For each formula:
- record sheet/cell/formula;
- parse referenced sheets/ranges;
- detect missing sheets/columns;
- detect errors: #REF!, #N/A, #VALUE!, #DIV/0!, #NAME?, circular dependency;
- verify formulas copy/fill correctly across intended rows;
- verify dashboard KPIs against direct counts from source data;
- verify role Workspace dashboard formulas only see scoped local data.

Create docs/audit/FORMULA_AUDIT.md with Pass/Fail and evidence.

## Phase 5 — Role and Workspace audit

Roles:
- مدیر
- کارمند داخلی
- مدیر مشتری
- کارمند مشتری

Verify:
- scope isolation;
- visible tabs;
- dashboard template differs by role;
- editable fields are allowed only for the correct role;
- customer manager is restricted to its Customer ID;
- customer employee sees company cases but only own assigned tasks;
- internal employee sees only assigned cases/tasks/documents;
- admin sees all;
- hidden technical tabs do not leak unauthorized data through formulas, links, filters or permissions.

Templates in Drive folder تمپلیت are the only source for provisioning.
LIVE dashboards are not provisioning templates.

Update Provisioning Settings Template File ID values if they still point to old LIVE files.

## Phase 6 — Drive audit

Verify folder architecture from docs/DRIVE_ARCHITECTURE.md.
Test:
- Customer folder creation;
- 00-اسناد پایه;
- پرونده‌ها subtree;
- Case folder creation;
- document/version storage;
- Workspace destination by role;
- Template protection;
- cascade delete protection;
- no orphan Workspace or document folders.

## Phase 7 — Telegram bot audit and repair

The Telegram bot should be lightweight and fast.

Expected admin menu:
- گزارش امروز
- هشدارهای مهم
- پرونده‌های مهم
- تسک‌های مهم
- ورود به CRM

Expected non-admin menu:
- کارهای امروز من
- موارد مهم من
- ورود به میز کار من

Audit:
- webhook configuration;
- update deduplication;
- authorization from Users;
- Telegram Linked state;
- Role-aware menu;
- stale callback handling;
- answerCallbackQuery latency;
- callback edit vs send fallback;
- no synchronous heavy Drive/Sheet scan on simple navigation;
- background sync;
- error logging;
- webhook retry behavior;
- message deletion behavior;
- concurrency/locks/cache.

Run controlled tests for admin and every non-admin role. Fix any freeze/latency defects.

## Phase 8 — Security

Mandatory:
- No hardcoded BOT_TOKEN.
- Rotate the currently deployed Telegram bot token if it has ever been stored in source/history outside secure Script Properties.
- Move ADMIN_TELEGRAM_ID and WEB_APP_URL to Script Properties.
- Evaluate moving Spreadsheet/Folder/Template IDs to configuration as well.
- Never print tokens in logs.
- Ensure public GitHub contains no live personal/customer data.

## Phase 9 — UX and formatting

Preserve role color identities.
Apply a coherent visual system to all relevant sheets:
- font: Vazirmatn if supported by Google Sheets; otherwise document the closest safe fallback;
- RTL;
- distinctive coordinated colors for:
  - title/section;
  - user input;
  - system ID/read-only;
  - calculated/formula;
  - warning/attention;
  - completed/closed;
- freeze headers;
- sensible column widths;
- filters;
- consistent status colors.

Do not destroy existing role-specific color identity.

## Phase 10 — Refactor technical debt

The current Code.gs accumulated version patches and duplicate function names. After behavior is captured in tests:
- consolidate duplicate declarations into one canonical implementation;
- split logical modules if feasible with clasp-compatible Apps Script files;
- centralize configuration;
- centralize sheet schemas;
- centralize role policy;
- centralize Telegram routing;
- keep backward-compatible migrations where needed.

No refactor is accepted without regression tests.

## Phase 11 — Automated tests

Create tests or executable audit scripts covering:
- schema;
- formulas;
- validations;
- IDs and foreign keys;
- role scope;
- provisioning;
- folder creation;
- daily task category sync;
- customer folder automation;
- manager-company linking;
- role dashboards;
- Telegram authorization/navigation;
- queue retry/idempotency;
- delete cascade protections.

GitHub CI must at least run JavaScript syntax validation and secret-pattern checks. Where live Google integration requires credentials, separate offline unit tests from live integration tests and document required secure credentials.

## Phase 12 — End-to-end scenarios

Run and document these scenarios:
1. New Lead → follow-up → Customer.
2. New Customer → Drive folder.
3. New internal employee → Permission → Queue → Workspace → Share.
4. New customer manager → company Dropdown → Customer ID → scoped Workspace.
5. New customer employee → limited Workspace.
6. New Case → assignment → documents → versions.
7. Partial clearance events → remaining quantity/weight/progress.
8. Task lifecycle.
9. Personal daily task + new category.
10. Telegram start/menu/report for each Role.
11. Hard delete on disposable test records and Drive cleanup.
12. Sync/retry after simulated failure.

## Deliverables

Commit all work to codex/full-system-audit.

Required files:
- docs/audit/BASELINE.md
- docs/audit/SHEET_AUDIT.md
- docs/audit/FORMULA_AUDIT.md
- docs/audit/VALIDATION_AUDIT.md
- docs/audit/REFERENTIAL_INTEGRITY.md
- docs/audit/TELEGRAM_AUDIT.md
- docs/audit/DRIVE_AUDIT.md
- docs/audit/ROLE_ACCESS_MATRIX.md
- docs/audit/E2E_TEST_REPORT.md
- docs/audit/SECURITY_AUDIT.md
- docs/audit/FINAL_DELIVERY.md

Update README, architecture docs, deployment instructions and changelog to match the final implementation.

## Final acceptance gate

Do not declare completion until:
- no unresolved critical/high defects;
- no broken formulas;
- no unauthorized cross-role data exposure;
- no hardcoded secret;
- all four role workspaces provision correctly;
- Telegram is responsive and authorized correctly;
- Drive folders are placed correctly;
- all mandatory E2E scenarios have evidence;
- rollback instructions exist.

At the end, open a Pull Request from codex/full-system-audit to main with a clear summary, migration notes, test evidence, remaining known limitations, and explicit production deployment steps.
