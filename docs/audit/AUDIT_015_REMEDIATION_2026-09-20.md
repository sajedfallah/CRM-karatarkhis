# AUDIT-015-REMEDIATION — Production Gate Closure Work

Date: 2026-09-20  
Branch: `codex/full-system-audit`  
Source baseline after remediation: `V4.29-2026-09-20`

## Current decision

**PARTIAL REMEDIATION — DO NOT MERGE TO MAIN.**

This stage closed the canonical RAW-template configuration defect and the missing reminder/escalation implementation defect at source level, created isolated four-role staging data, and completed a basic backup→restore structural drill. Runtime Apps Script/Telegram gates remain and therefore the release is still NO-GO.

## 1. Canonical RAW templates — REMEDIATED

Verified/created native private Google Sheets templates:

- Admin: `1CK614Ai1F3VzyK-4d9FxmtL96jkMXmu5KVHue3-lGjo`
- Internal Employee: `1vVrrUZDApL3br29JWU8nAfYEajyx83ztgSF1KdFdIvc`
- Customer Manager: `1uHmv-4QotaXY8jDJgyXsip-EHEGBiaGliKLRCMacc_s`
- Customer Employee: `18Blwx4-WDXjVyCOR6fcFDllqXUAAVBUcygu5xbN8U_M`

The three new role templates were copied from the matching role-specific native LIVE structures, then all non-dashboard operational/view rows below headers were cleared. Verification showed owner-only/private permissions and header-only sampled technical case data.

Canonical `Provisioning Settings` was migrated from LIVE IDs to these four native RAW IDs. Before/after evidence was captured directly from the canonical 47-sheet CRM.

### Runtime hardening

V4.29 now treats `Provisioning Settings` as the canonical runtime template map and Script Properties only as fallback.

The final provisioning path:

- resolves role template through `templateIdForRoleV429_`
- requires native Google Sheets MIME type
- keeps deterministic retry-safe copy behavior
- keeps the copy private until sanitize/sync succeeds

The final `repairProvisioningSettingsV427_` no longer overwrites a nonblank verified canonical table ID with a stale Script Property value.

Commits:

- `a87b6f575c4c1fb047692a1766c1514125223cc2`
- `ffce5f5050f269746a887eb7050f12e88746f458`

**Gate status: configuration defect CLOSED; runtime provisioning E2E still OPEN.**

## 2. Proactive reminder/escalation engine — IMPLEMENTED, runtime gate OPEN

V4.29 adds proactive processing for:

- task reminder 1 / reminder 2 / escalation
- lead reminder / escalation
- customer-task reminder 1 / reminder 2 / escalation

Safety controls:

- `PROACTIVE_NOTIFICATIONS_ENABLED` is disabled unless explicitly set to `true`
- execution defaults to dry-run
- non-dry-run fails closed while feature flag is disabled
- lock + cache idempotency claim protects each notification level
- unresolved recipients do not produce a send
- escalation routes to the configured admin identity
- hourly trigger installation is blocked while feature flag is disabled

Commits:

- `b6a3c6512df4af619a438b5c0105e901176bb4fe`
- `44d5cc2bdf64899745a1d697092029fc35b8e53a`

Source version was bumped to:

`V4.29-2026-09-20`

Commits:

- `6ac9817fd91ff10583a2b1a1b67f059fc3f8b82f`
- `9e1ed8c973227e2e66ecf9e3d82d41f18177f478`

**Gate status: implementation gap CLOSED; isolated Telegram delivery E2E OPEN.**

## 3. Isolated staging topology — CREATED

Staging folder:

`STAGING AUDIT-015 REMEDIATION 2026-09-20`

ID:

`1naza77-aLkzutLLTP6x2xLPaZNN-eiki`

A restored staging CRM contains synthetic identities only:

- Stage Admin
- Stage Internal Employee
- Stage Customer Manager A
- Stage Customer Employee A
- Stage Customer Manager B

Synthetic customers:

- `CUS-STAGE-A`
- `CUS-STAGE-B`

Synthetic cases:

- `CASE-STAGE-A`
- `CASE-STAGE-B`

Synthetic tasks:

- `TASK-STAGE-A`
- `TASK-STAGE-B`

Permissions encode:

- Admin → ALL
- Internal → ASSIGNED / OWN_ASSIGNMENTS
- Customer Manager A → CUSTOMER / CUS-STAGE-A
- Customer Employee A → CUSTOMER / CUS-STAGE-A
- Customer Manager B → CUSTOMER / CUS-STAGE-B

No real Gmail recipient was added and no Production Telegram user was messaged.

**Gate status: test topology READY; Apps Script runtime RBAC/workspace execution OPEN.**

## 4. Backup / restore drill — STRUCTURAL PASS

Created protected staging backup:

`BACKUP STAGING | CRM V1.5 | AUDIT-015 | 2026-09-20`

Backup ID:

`1aND7WpNH-Of0J2g3Ml6VwvRoR1G4VrgpWePruPOfixA`

Created restore-drill copy from that backup:

`RESTORE DRILL | CRM V1.5 | AUDIT-015 | 2026-09-20`

Restore ID:

`1ztbqSEhAHFokYr73OQgUla043pn-RWScC8NGzwioBOU`

Source, backup and restored workbook all contain the same 47 canonical sheet names.

This proves Drive-level workbook backup/copy restoration structure. It does not yet prove automated periodic backup scheduling or row/formula checksum equivalence.

**Gate status: basic restore drill PASS; periodic backup policy/checksum evidence remains MEDIUM readiness work.**

## 5. RAW_Admin.xlsx broad permission — STILL OPEN

Repository search found no reference to the public XLSX file ID or `RAW_Admin.xlsx`, reducing dependency risk.

However the available Drive connector does not expose permission-revocation functionality. The artifact remains:

`anyone → reader`

The canonical native `RAW_Admin` is private and is now the configured provisioning source.

**Gate status: HIGH blocker OPEN until broad permission is actually removed and reverified.**

## 6. Telegram runtime E2E — OPEN

No Production user was messaged.

No isolated staging bot/webhook credential is available through the current connected runtime, so the following remain unexecuted:

- real Telegram `getWebhookInfo`
- staging callback round-trip
- all-role Telegram auth/navigation
- duplicate-delivery transport retry
- measured callback latency
- proactive reminder delivery

Static/CI relay/auth protections remain in place.

**Gate status: HIGH blocker OPEN.**

## 7. Apps Script deployment pin — OPEN

Repository source is now explicitly:

`V4.29-2026-09-20`

The connected tools do not expose Apps Script deployment/version publishing. Therefore the currently deployed web app cannot be proven to execute this exact commit/version.

**Gate status: HIGH blocker OPEN.**

## 8. Destructive recovery drill — OPEN

Destructive safeguards are regression-tested, but no application-level staging cascade delete + restore was executed because the connected environment cannot invoke the Apps Script runtime directly.

No Production deletion was performed.

**Gate status: HIGH blocker OPEN.**

## 9. Credential / break-glass controls — PARTIAL

No credential was printed or rotated.

Current source keeps runtime secrets outside Git and CI history scanning remains enabled. Break-glass admin remains a Script Property.

Remaining release evidence:

- verify actual Script Property presence/ownership without values
- verify Vercel env presence without values
- document/confirm break-glass owner
- execute approved Telegram token rotation because a token was previously exposed outside Git
- revalidate webhook after rotation

**Gate status: HIGH blocker OPEN.**

## 10. CI

Static Validation #150 passed after the proactive engine changes.

A later CI run was triggered after canonical provisioning resolver changes and was still in progress at the time this report was prepared. Final release cannot use an in-progress run as PASS evidence.

## Gate matrix after remediation

| Gate | Status |
|---|---|
| Canonical 47-sheet CRM | PASS |
| RAW native template set | **PASS** |
| Provisioning Settings uses RAW IDs | **PASS** |
| Provisioning source fail-closed/native-only | **PASS static** |
| Proactive reminder/escalation implementation | **PASS static** |
| Four-role staging topology | **PASS / ready** |
| Four-role Apps Script runtime E2E | **OPEN** |
| Cross-customer runtime isolation | **OPEN** |
| V4.29 provisioning runtime E2E | **OPEN** |
| Telegram isolated runtime E2E | **OPEN** |
| RAW_Admin.xlsx broad permission | **OPEN** |
| Backup→restore structural drill | **PASS** |
| Periodic backup/checksum policy | PARTIAL |
| Destructive recovery runtime drill | **OPEN** |
| Credential/break-glass release evidence | **OPEN** |
| Apps Script deployed revision pin | **OPEN** |
| Main merge | BLOCKED |

## Final remediation decision

**NO-GO remains in force.**

The most important architectural provisioning defect is now corrected and the missing proactive-notification engine exists behind a fail-closed feature flag. The remaining blockers require runtime capabilities or permission/credential operations that were not safely available through the connected execution surface.

No merge to `main` is authorized by this report.
