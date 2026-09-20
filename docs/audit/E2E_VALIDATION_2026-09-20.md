# AUDIT-013 — Controlled Full E2E Validation

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Canonical CRM: `CRM | ترخیص یزد | V1.5 | 2026-09-17`  
Canonical Spreadsheet ID: `1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM`

## Final result

**AUDIT-013: FAIL — Production E2E gate remains closed.**

The controlled validation produced useful live evidence and the complete source regression suite is now green, but a true four-role E2E cannot be certified because the canonical CRM currently has only two active Internal Employee identities. There are no canonical Admin, Customer Manager, or Customer Employee test identities/permissions/workspaces available for a safe role-by-role runtime exercise without creating Production records.

No Production user was messaged. No Production credential was rotated. No Production file was deleted/moved. No merge to `main` was performed.

## Safe regression repair performed

The AUDIT-012 test added for `repairProvisioningSettingsV427_` asserted an obsolete implementation shape (`applyChanges === true`). The actual V4.28 function safely defaults to dry-run using:

`dryRun = dryRun !== false`

and writes only under:

`if (!dryRun)`

The regression assertion was corrected to validate the real safety invariant instead of changing safe production code.

Commit:

`075a56f178a2d2310053946d130e238f529bc593`

## CI evidence

GitHub Actions run `35531388401` / Static validation #142 completed **SUCCESS**.

Observed successful stages:

- JavaScript syntax check
- obvious Telegram token block
- high-confidence Git-history secret scan
- engineering docs check
- duplicate-function report
- V4.27 behavioral regression tests
- Audit regression tests: **36/36 PASS**
- Telegram relay syntax check
- Vercel relay structure check

This closes the executable-regression uncertainty from AUDIT-012.

## Canonical CRM live evidence

The canonical workbook was read directly from Google Sheets.

Observed:

- title matches canonical CRM
- **47 sheets**
- Users / Permissions / Workspace Mapping present
- Case Assignments / Assignment History present
- Provisioning Queue / Provisioning Log present
- Provisioning Settings / Assignment Policy / Dashboard Registry present
- task/customer-task/alert/log infrastructure present

### Current role population

Canonical `Users` contains only:

- `USR-INTERNAL-001` — Internal Employee — active
- `USR-INTERNAL-002` — Internal Employee — active

Both have active `ASSIGNED / OWN_ASSIGNMENTS` permissions and completed Workspace mappings.

No canonical rows were found for:

- Admin role user
- Customer Manager role user
- Customer Employee role user

Therefore Admin/Customer Manager/Customer Employee runtime isolation cannot be marked PASS from live E2E.

## Workspace / Drive live validation

Existing Internal Employee Workspaces were inspected.

### USR-INTERNAL-001

- Workspace exists under the Internal Employee role folder.
- Owner + expected writer only.
- Scoped data tabs exist.
- Current scoped operational data rows are empty.

### USR-INTERNAL-002

- Workspace exists under the Internal Employee role folder.
- Owner + expected writer only.
- Scoped data tabs exist.
- Current scoped operational data rows are empty.

This matches the canonical CRM state: `CASE-001` currently has no Customer ID or internal assignee, and `Case Assignments` is empty.

The absence of `CASE-001` from Internal Employee workspaces is therefore a **PASS for fail-closed scope behavior**, not missing-data leakage.

## Case/customer isolation

Canonical customer:

- `CUS-001` exists.

Canonical case:

- `CASE-001` exists.
- Customer link is blank.
- Internal assignment is blank.

Because the case is not linked or assigned, it must not appear in an Internal Employee scoped Workspace. The inspected Workspaces contain headers only and do not expose the unassigned case.

**Result: PASS for observed Internal Employee fail-closed isolation.**

Customer-to-customer isolation remains **UNEXECUTED** because no Customer Manager/Employee test identities exist.

## Provisioning E2E

Historical evidence confirms a real provisioning lifecycle for `USR-INTERNAL-002`:

QUEUE → PROCESS → ERROR → retry PROCESS → DONE.

The resulting Workspace exists and is correctly shared.

However, this is V4.13–V4.15 historical evidence, not a new V4.28 staging provisioning run.

### Blocking configuration defect

Canonical `Provisioning Settings` still uses LIVE dashboard IDs as `Template File ID` for all four roles.

This is incompatible with the intended:

`RAW template → private copy → sanitize → scoped sync → share`

architecture.

The V4.28 code itself correctly provisions from Script Property-backed `DASHBOARD_TEMPLATES`, and `repairProvisioningSettingsV427_` has a dry-run-safe repair path, but the canonical live table has not been migrated.

**Result: FAIL.**

## RAW template / Drive permissions

Observed template artifacts:

- native `RAW_Admin` Google Sheet is private/owner-only.
- `RAW_Internal_Employee.xlsx` is private/owner-only.
- `RAW_Customer_Manager.xlsx` is private/owner-only.
- `RAW_Customer_Employee.xlsx` is private/owner-only.
- `RAW_Admin.xlsx` still has an `anyone:reader` permission with discovery disabled.

**Result: FAIL security/readiness for the public XLSX artifact.**

No permission was changed during this audit.

## Telegram relay / webhook

Vercel relay project has READY Production deployments.

Recent runtime-log query returned no requests in the available recent retention window, so no Production Telegram message was generated for testing.

Source/CI validates:

- Telegram secret header verification at relay
- HMAC-signed relay envelope
- timestamp freshness
- nonce replay rejection
- fail-closed Apps Script relay verification
- exact RBAC identity matching
- duplicate Telegram identity rejection
- callback/navigation code paths
- generic internal error response

Actual Telegram `getWebhookInfo` state and a real role callback round-trip were not exercised because the task explicitly prohibited Production user messaging and no isolated Telegram staging identity/bot endpoint was available.

**Result: PASS static/CI, UNEXECUTED runtime E2E.**

## Reminder / escalation flow

The canonical CRM contains reminder/escalation settings and columns, including task reminder and escalation thresholds.

However the active Apps Script source has no proactive reminder/escalation sender/worker functions. Searches for dedicated task/lead/customer reminder senders return none; only on-demand alert views exist.

Therefore a proactive reminder/escalation E2E cannot pass.

**Result: FAIL — functional gap.**

## Retry / recovery

Static + behavioral tests validate:

- stale provisioning states are recoverable
- persisted Workspace identity wins on retry
- deterministic Workspace copy reuse
- failed provisioning preserves Workspace identity
- retry returns failed requests to queue
- Workspace share occurs only after sanitize/sync

Historical live Provisioning Log demonstrates recovery from a real validation error to DONE.

**Result: PASS for recovery contract; current-version live staging execution still not performed.**

## Destructive-operation safeguards

CI/static tests validate:

- hard-delete entity allowlist
- state-bound Telegram confirmation token
- primary Telegram admin delete protection
- Customer Manager destructive actions limited to cases/tasks
- manager scope check before delete
- delete audit logging calls
- Workspace access revocation verification
- installer preflight before trigger deletion

No destructive Production action was executed.

Rollback/recovery from an actual delete is not proven.

**Result: PASS safeguard contract / FAIL destructive recovery E2E.**

## E2E evidence matrix

| Domain | Result |
|---|---|
| Canonical 47-sheet identity | PASS |
| Source regression suite | **PASS — 36/36 audit tests** |
| Git history secret gate | PASS CI |
| Internal Employee auth/scope | PASS static + live data evidence |
| Internal Employee Workspace placement/sharing | PASS live |
| Unassigned case fail-closed isolation | PASS live |
| Admin role E2E | UNEXECUTED |
| Customer Manager role E2E | UNEXECUTED |
| Customer Employee role E2E | UNEXECUTED |
| Cross-customer isolation | UNEXECUTED |
| V4.28 new Workspace provisioning | UNEXECUTED |
| Provisioning Settings RAW-template correctness | **FAIL** |
| Historical provisioning retry/recovery | PASS |
| Telegram relay/auth | PASS static/CI |
| Telegram real callback round-trip | UNEXECUTED |
| Proactive reminders/escalations | **FAIL — implementation gap** |
| Destructive guards | PASS static/CI |
| Destructive rollback/recovery | UNEXECUTED |
| RAW template privacy | **FAIL — RAW_Admin.xlsx public-link reader** |
| Vercel production deployment | READY |
| Vercel recent relay traffic evidence | NONE observed |
| Production credential rotation | NOT PERFORMED by instruction |
| Merge to main | NOT PERFORMED by instruction |

## Blocking defects for AUDIT-014

1. Canonical Provisioning Settings points at LIVE dashboards instead of verified RAW template IDs.
2. No safe canonical test identities exist for three of four roles.
3. No current V4.28 staging provisioning transaction has been executed for all four roles.
4. No Customer Manager / Customer Employee cross-customer runtime isolation evidence.
5. No real isolated Telegram webhook/callback E2E.
6. Proactive reminder/escalation delivery engine is absent.
7. `RAW_Admin.xlsx` remains anyone-reader.
8. Destructive rollback/recovery is not demonstrated.
9. Production backup/restore drill remains unproven.
10. Production credential rotation remains a readiness action from the security audit.

## AUDIT-013 acceptance

**FAIL.**

The source/test baseline is now green and the existing Internal Employee isolation behaves fail-closed, but Production readiness cannot be approved without resolving the runtime/configuration gaps above.

Next task: **AUDIT-014 — Production Readiness Review**.
