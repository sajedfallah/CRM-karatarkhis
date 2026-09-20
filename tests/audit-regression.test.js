'use strict';

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'apps-script', 'Code.gs'), 'utf8');

function extractLastFunction(name) {
  const needle = 'function ' + name + '(';
  const start = code.lastIndexOf(needle);
  assert.ok(start >= 0, 'missing function ' + name);
  const brace = code.indexOf('{', start);
  let depth = 0, quote = null, escaped = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

test('legacy identity matching requires an available canonical Users directory', () => {
  const dir = extractLastFunction('identityDirectoryV427_');
  const matcher = extractLastFunction('fieldMatchesUserIdentityV427_');
  assert.match(dir, /sourceAvailable/);
  assert.match(matcher, /if \(!dir\.sourceAvailable\) return false/);
  assert.match(matcher, /dir\.byTelegram\[telegramId\] === 1/);
  assert.match(matcher, /dir\.nameCounts\[fullName\] === 1/);
});

test('scope matching uses exact identity helper', () => {
  const fn = extractLastFunction('getScopedWorkspaceDataV412_');
  assert.match(fn, /assignmentFieldMatchesUserV427_|fieldMatchesUserIdentityV427_/);
  const wrapper = extractLastFunction('assignmentFieldMatchesUserV427_');
  assert.match(wrapper, /fieldMatchesUserIdentityV427_/);
  assert.doesNotMatch(fn, /textContainsAnyV412_/);

  const split = v => String(v || '').trim().split(/[\n,،;|]+/).map(x => x.trim()).filter(Boolean);
  const matches = (value, user) => split(value).some(p =>
    p === user.id || p === user.name || p === user.telegram
  );
  assert.equal(matches('Alireza', {id:'USR-1', name:'Ali', telegram:'1'}), false);
  assert.equal(matches('USR-1,USR-2', {id:'USR-1', name:'Ali', telegram:'1'}), true);
});

test('PERSONAL source is authoritative for personal task ownership', () => {
  const fn = extractLastFunction('personalTaskBelongsToUserV420_');
  assert.match(fn, /source\.indexOf\('PERSONAL:'\) === 0/);
  assert.match(fn, /source === 'PERSONAL:' \+ userId/);
});

test('Telegram authorization fails closed when RBAC sheets are unavailable', () => {
  const fn = extractLastFunction('getTelegramUserContextV419_');
  assert.match(fn, /rbac_source_unavailable/);
  assert.match(fn, /permission_source_unavailable/);
  assert.match(fn, /try\s*\{/);
  assert.match(fn, /catch\s*\(_\)/);
});

test('Telegram authorization is fail-closed', () => {
  const fn = extractLastFunction('getTelegramUserContextV419_');
  assert.match(fn, /status !== 'فعال'/);
  assert.match(fn, /allowedRoles/);
  assert.match(fn, /missing_customer_scope/);
});

test('Telegram webhook validates signed relay before update handling', () => {
  const fn = extractLastFunction('doPost');
  const verifyAt = fn.indexOf('verifyRelayEnvelopeV427_');
  const callbackAt = fn.indexOf('update.callback_query');
  assert.ok(verifyAt >= 0);
  assert.ok(callbackAt > verifyAt);
});

test('provisioning persists before sync and shares after sync', () => {
  const fn = extractLastFunction('processProvisioningQueue');
  const persistedAt = fn.indexOf("'Workspace File ID':workspace.fileId");
  const syncAt = fn.indexOf('syncWorkspaceDataV412_');
  const shareAt = fn.indexOf('reconcileWorkspaceAccessV427_', syncAt);
  assert.ok(persistedAt >= 0 && syncAt > persistedAt, 'workspace identity must persist before sync');
  assert.ok(shareAt > syncAt, 'workspace must be shared only after scoped sync');

  const provision = extractLastFunction('provisionWorkspace');
  assert.doesNotMatch(provision, /addEditor|addViewer/);
});

test('provisioning recovers copy created before queue persistence', () => {
  const fn = extractLastFunction('provisionWorkspace');
  assert.match(fn, /findWorkspaceCopyByDeterministicNameV428_/);
  assert.match(fn, /reusedExistingCopy/);
  assert.doesNotMatch(fn, /addEditor|addViewer/);
});

test('workspace sync rotates and never writes admin personal data to RAW template', () => {
  const fn = extractLastFunction('syncAllActiveWorkspacesV412');
  assert.match(fn, /selectMappingsRoundRobinV427_/);
  assert.doesNotMatch(fn, /DASHBOARD_TEMPLATES\['مدیر'\]/);
});

test('role dashboard renderer uses Vazirmatn', () => {
  const fn = extractLastFunction('renderRoleDashboardV425_');
  assert.match(fn, /VAZIR_FONT_FAMILY_V427/);
  assert.doesNotMatch(fn, /setFontFamily\\('Arial'\\)/);
});

test('daily task sync detects concurrent changes and preserves local row', () => {
  const resolver = extractLastFunction('resolveDailyTaskConflictV427_');
  assert.match(resolver, /localChanged/);
  assert.match(resolver, /centralChanged/);
  assert.match(resolver, /return 'conflict'/);

  const pull = extractLastFunction('pullPersonalDailyTasksFromWorkspaceV420_');
  assert.match(pull, /resolveDailyTaskConflictV427_/);
  assert.match(pull, /preserveLocalById/);
});

test('relay backend and Vercel root exist', () => {
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'backend', 'api', 'telegram.js')), true);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'backend', 'vercel.json')), true);
});


test('semantic sheet styling preserves per-sheet color identity and Vazirmatn', () => {
  const fn = extractLastFunction('styleUsedRangeV429_');
  assert.match(fn, /sheetPaletteV429_/);
  assert.match(fn, /setFontFamily\(VAZIR_FONT_FAMILY_V427\)/);
  assert.match(fn, /getTabColor/);
  assert.match(fn, /SHEET_STYLE_GROUP_SIZE_V429/);

  const repair = extractLastFunction('repairKnownSheetStylesV429_');
  assert.match(repair, /DASHBOARD_TEMPLATES/);
  assert.match(repair, /LIVE_DASHBOARDS/);
  assert.match(repair, /SHEETS\.mapping/);

  const sync = extractLastFunction('syncWorkspaceDataV412_');
  assert.match(sync, /styleSpreadsheetSemanticallyV429_/);
});

test('workspace provisioning never uses LIVE dashboards as template source', () => {
  const provision = extractLastFunction('provisionWorkspace');
  const resolver = extractLastFunction('templateIdForRoleV429_');
  assert.match(provision, /templateIdForRoleV429_/);
  assert.match(resolver, /provisioningTemplateMapV429_/);
  assert.match(resolver, /DASHBOARD_TEMPLATES/);
  assert.doesNotMatch(provision, /LIVE_DASHBOARDS/);
  assert.doesNotMatch(resolver, /LIVE_DASHBOARDS/);

  const enqueue = extractLastFunction('enqueueProvisioningRequestV412_');
  assert.match(enqueue, /'Template File ID': DASHBOARD_TEMPLATES\[role\]/);
  assert.doesNotMatch(enqueue, /LIVE_DASHBOARDS/);
});


test('provisioning enqueue treats recovery states as open requests', () => {
  const fn = extractLastFunction('findOpenProvisioningRequestV412_');
  assert.match(fn, /Workspace ساخته شد/);
  assert.match(fn, /در حال ساخت/);
  assert.match(fn, /در حال پردازش/);
  assert.match(fn, /در صف/);
});


test('failed provisioning retry resets errors to queued', () => {
  const retry = extractLastFunction('retryFailedProvisioningV412');
  assert.match(retry, /=== 'خطا'/);
  assert.match(retry, /'وضعیت': 'در صف'/);
});

test('provisioning failure preserves workspace identity for retry', () => {
  const worker = extractLastFunction('processProvisioningQueue');
  assert.match(worker, /'Workspace File ID':\s*workspace/);
  assert.match(worker, /String\(req\['Workspace File ID'\]/);
  assert.match(worker, /'Workspace URL':\s*workspace/);
  assert.match(worker, /String\(req\['Workspace URL'\]/);
});

test('stale recoverable provisioning states are eligible for worker recovery', () => {
  const candidates = extractLastFunction('provisioningQueueCandidatesV427_');
  assert.match(candidates, /در حال پردازش/);
  assert.match(candidates, /در حال ساخت/);
  assert.match(candidates, /Workspace ساخته شد/);
  assert.match(candidates, /isProvisioningStaleV427_/);
});


test('installer preflight blocks destructive trigger reset when canonical sheets are missing', () => {
  const preflight = extractLastFunction('installerPreflightV430_');
  const installer = extractLastFunction('repairBotInstallation');
  assert.match(preflight, /required_sheets_missing/);
  assert.match(preflight, /Provisioning Settings/);
  const guardAt = installer.indexOf('if (!preflight.ok)');
  const destructiveAt = installer.indexOf('removeAllProjectTriggers');
  assert.ok(guardAt >= 0 && destructiveAt > guardAt, 'preflight must run before trigger deletion');
});

test('protected Drive IDs derive LIVE dashboard IDs from properties', () => {
  const fn = extractLastFunction('protectedDriveIdsV413_');
  assert.match(fn, /Object\.keys\(LIVE_DASHBOARDS\)/);
  assert.match(fn, /parseDriveFileId_\(LIVE_DASHBOARDS\[k\]\)/);
  assert.doesNotMatch(fn, /1RADxHUGzEfwrW76qb10ip-YcG6mogSXjhRVOyRGeImE/);
});


test('duplicate override debt does not grow beyond audited baseline', () => {
  const matches = [...code.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)];
  const counts = new Map();
  for (const m of matches) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  const duplicateNames = [...counts.entries()].filter(([, count]) => count > 1);
  assert.ok(duplicateNames.length <= 44, 'duplicate function-name debt grew beyond AUDIT-008 baseline');
  assert.ok((counts.get('repairBotInstallation') || 0) <= 12);
  assert.ok((counts.get('installTelegramBot') || 0) <= 12);
  assert.ok((counts.get('syncWorkspaceDataV412_') || 0) <= 7);
  assert.ok((counts.get('doPost') || 0) <= 5);
  assert.ok((counts.get('provisionWorkspace') || 0) <= 4);
});


test('Telegram authorization rejects duplicate Telegram identity', () => {
  const fn = extractLastFunction('getTelegramUserContextV419_');
  assert.match(fn, /duplicate_telegram_identity/);
  assert.match(fn, /matchesByUserId/);
  assert.match(fn, /matchedUsers\.length !== 1/);
});

test('Telegram webhook does not expose internal exception text', () => {
  const fn = extractLastFunction('doPost');
  assert.match(fn, /error:'internal_error'/);
  assert.doesNotMatch(fn, /error:String\(err && err\.message/);
});


test('internal action requires exact manager actor identity and active permission', () => {
  const fn = extractLastFunction('handleInternalActionV414_');
  assert.match(fn, /constantTimeEqualsV427_/);
  assert.match(fn, /actor_email_required/);
  assert.match(fn, /email_scope_mismatch/);
  assert.match(fn, /manager_user_inactive/);
  assert.match(fn, /permission_inactive_or_missing/);
});

test('internal destructive action remains scope-limited', () => {
  const fn = extractLastFunction('handleInternalActionV414_');
  assert.match(fn, /\['cases','tasks'\]\.indexOf\(entity\) < 0/);
  assert.match(fn, /managerRowBelongsToScopeV414_/);
  assert.match(fn, /delete_scope_not_allowed/);
  assert.match(fn, /record_out_of_scope/);
});


test('workspace access revocation fails closed when an existing principal cannot be removed', () => {
  const fn = extractLastFunction('removeWorkspacePrincipalV427_');
  assert.match(fn, /getEditors\(\)/);
  assert.match(fn, /getViewers\(\)/);
  assert.match(fn, /workspace_editor_revoke_failed/);
  assert.match(fn, /workspace_viewer_revoke_failed/);
  assert.match(fn, /workspace_access_revoke_incomplete/);
});


test('canonical CRM identity is pinned in executable source', () => {
  assert.match(code, /CRM \| ترخیص یزد \| V1\.5/);
  assert.match(code, /APP_VERSION\s*=\s*'V4.29-2026-09-20'/);
});

test('runtime config requires canonical CRM and all role template/workspace properties', () => {
  const fn = extractLastFunction('validateRuntimeConfigV427_');
  [
    'SPREADSHEET_ID',
    'CRM_FOLDER_ID',
    'CRM_DOCUMENTS_ROOT_FOLDER_ID',
    'TEMPLATE_ADMIN_ID',
    'TEMPLATE_INTERNAL_EMPLOYEE_ID',
    'TEMPLATE_CUSTOMER_MANAGER_ID',
    'TEMPLATE_CUSTOMER_EMPLOYEE_ID',
    'WORKSPACE_FOLDER_ADMIN_ID',
    'WORKSPACE_FOLDER_INTERNAL_ID',
    'WORKSPACE_FOLDER_CUSTOMER_MANAGER_ID',
    'WORKSPACE_FOLDER_CUSTOMER_EMPLOYEE_ID'
  ].forEach(key => assert.match(fn, new RegExp(key)));
});

test('relay verifier enforces freshness, signature and nonce replay controls', () => {
  const fn = extractLastFunction('verifyRelayEnvelopeV427_');
  assert.match(fn, /timestamp_in_future/);
  assert.match(fn, /expired_request/);
  assert.match(fn, /constantTimeEqualsV427_/);
  assert.match(fn, /RELAY_NONCE_V427_/);
  assert.match(fn, /reason:'replay'/);
});

test('hard-delete dispatcher only exposes audited entity classes', () => {
  const fn = extractLastFunction('deleteEntityCascadeV413_');
  assert.match(fn, /entity === 'users'/);
  assert.match(fn, /entity === 'customers'/);
  assert.match(fn, /entity === 'cases'/);
  assert.match(fn, /entity === 'tasks'/);
  assert.match(fn, /throw new Error/);
});

test('Telegram hard delete requires state-bound confirmation token', () => {
  const fn = extractLastFunction('handleDeleteConfirmV413');
  assert.match(fn, /state\.mode !== 'delete_confirm'/);
  assert.match(fn, /state\.entity !== entity/);
  assert.match(fn, /String\(state\.token \|\| ''\) !== String\(token \|\| ''\)/);
  assert.match(fn, /deleteEntityCascadeV413_/);
});

test('primary Telegram administrator cannot be deleted through user cascade', () => {
  const fn = extractLastFunction('deleteUserCascadeV413_');
  assert.match(fn, /ADMIN_TELEGRAM_ID/);
  assert.match(fn, /حذف مدیر اصلی ربات مسدود است/);
});

test('destructive cascades emit delete audit records', () => {
  ['deleteUserCascadeV413_','deleteCustomerCascadeV413_','deleteCaseCascadeV413_','deleteTaskCascadeV413_']
    .forEach(name => assert.match(extractLastFunction(name), /safeLogDeleteV413_/));
});

test('workspace access revocation verifies principal absence after mutation', () => {
  const fn = extractLastFunction('removeWorkspacePrincipalV427_');
  const removeEditorAt = fn.indexOf('removeEditor');
  const verifyEditorAt = fn.lastIndexOf('getEditors');
  const removeViewerAt = fn.indexOf('removeViewer');
  const verifyViewerAt = fn.lastIndexOf('getViewers');
  assert.ok(removeEditorAt >= 0 && verifyEditorAt > removeEditorAt);
  assert.ok(removeViewerAt >= 0 && verifyViewerAt > removeViewerAt);
  assert.match(fn, /workspace_access_revoke_incomplete/);
});

test('public webhook route separates internal action from signed Telegram relay', () => {
  const fn = extractLastFunction('doPost');
  const internalAt = fn.indexOf('handleInternalActionV414_');
  const relayAt = fn.indexOf('verifyRelayEnvelopeV427_');
  assert.ok(internalAt >= 0);
  assert.ok(relayAt > internalAt);
  assert.match(fn, /internal_action/);
});

test('provisioning settings repair defaults to dry-run safe mode', () => {
  const fn = extractLastFunction('repairProvisioningSettingsV427_');
  assert.match(fn, /dryRun\s*=\s*dryRun\s*!==\s*false/);
  assert.match(fn, /if \(!dryRun\)/);
});


test('proactive notifications are disabled by default and fail closed', () => {
  const enabled = extractLastFunction('proactiveNotificationsEnabledV429_');
  const run = extractLastFunction('runProactiveNotificationsV429_');
  assert.match(enabled, /PROACTIVE_NOTIFICATIONS_ENABLED/);
  assert.match(enabled, /=== 'true'/);
  assert.match(run, /dryRun = dryRun !== false/);
  assert.match(run, /!dryRun && !proactiveNotificationsEnabledV429_\(\)/);
  assert.match(run, /reason:'feature_disabled'/);
});

test('proactive notification idempotency is lock and cache protected', () => {
  const fn = extractLastFunction('claimReminderV429_');
  assert.match(fn, /LockService\.getScriptLock\(\)/);
  assert.match(fn, /tryLock\(3000\)/);
  assert.match(fn, /CacheService\.getScriptCache\(\)/);
  assert.match(fn, /cache\.get\(key\)/);
  assert.match(fn, /cache\.put\(key/);
});

test('proactive engine covers task lead and customer-task thresholds', () => {
  const task = extractLastFunction('evaluateTaskRemindersV429_');
  const lead = extractLastFunction('evaluateLeadRemindersV429_');
  const customer = extractLastFunction('evaluateCustomerTaskRemindersV429_');
  assert.match(task, /TASK_REMINDER_1_HOURS/);
  assert.match(task, /TASK_REMINDER_2_HOURS/);
  assert.match(task, /TASK_ESCALATION_HOURS/);
  assert.match(lead, /LEAD_REMINDER_HOURS/);
  assert.match(lead, /LEAD_ESCALATION_HOURS/);
  assert.match(customer, /CUSTOMER_TASK_REMINDER_1_MIN/);
  assert.match(customer, /CUSTOMER_TASK_REMINDER_2_MIN/);
  assert.match(customer, /CUSTOMER_TASK_ESCALATE_MIN/);
});

test('proactive trigger is installed only when feature flag is enabled', () => {
  const fn = extractLastFunction('installProactiveNotificationTriggerV429_');
  assert.match(fn, /proactiveNotificationsEnabledV429_\(\)/);
  assert.match(fn, /installed:false/);
  assert.match(fn, /everyHours\(1\)/);
});


test('V4.29 provisioning resolves canonical table before Script Property fallback', () => {
  const map = extractLastFunction('provisioningTemplateMapV429_');
  const resolver = extractLastFunction('templateIdForRoleV429_');
  const provision = extractLastFunction('provisionWorkspace');
  assert.match(map, /Provisioning Settings/);
  assert.match(map, /Template File ID/);
  assert.match(resolver, /map\[role\] \|\| DASHBOARD_TEMPLATES\[role\]/);
  assert.match(provision, /templateIdForRoleV429_\(role\)/);
  assert.match(provision, /MimeType\.GOOGLE_SHEETS/);
  assert.match(provision, /shared:false/);
});

test('V4.30 provisioning settings repair converges every role to verified canonical RAW template', () => {
  const fn = extractLastFunction('repairProvisioningSettingsV427_');
  assert.match(fn, /const expected = String\(DASHBOARD_TEMPLATES\[role\]/);
  assert.match(fn, /current !== expected/);
  assert.match(fn, /expected_template_not_native_google_sheet/);
  assert.match(fn, /invalid\.length === 0/);
  assert.match(fn, /if \(!dryRun\)/);
});


test('provisioning repair replaces noncanonical LIVE IDs with RAW template IDs', () => {
  const fn = extractLastFunction('repairProvisioningSettingsV427_');
  assert.match(fn, /replace_noncanonical_template/);
  assert.match(fn, /current !== expected/);
  assert.match(fn, /DASHBOARD_TEMPLATES/);
  assert.match(fn, /if \(!dryRun\)/);
});

test('proactive reminder worker is delivery-disabled by default', () => {
  const enabled = extractLastFunction('reminderDeliveryEnabledV430_');
  const worker = extractLastFunction('runReminderEscalationWorkerV430_');
  const sender = extractLastFunction('reminderSendV430_');
  assert.match(enabled, /RELEASE_REMINDERS_ENABLED/);
  assert.match(sender, /dryRun \|\| !reminderDeliveryEnabledV430_\(\)/);
  assert.match(worker, /dryRun = dryRun !== false/);
});

test('reminder worker covers tasks leads and customer tasks', () => {
  const worker = extractLastFunction('runReminderEscalationWorkerV430_');
  assert.match(worker, /SHEETS\.tasks/);
  assert.match(worker, /SHEETS\.leads/);
  assert.match(worker, /SHEETS\.customerTasks/);
  assert.match(worker, /TASK_ESCALATION_HOURS/);
  assert.match(worker, /LEAD_ESCALATION_HOURS/);
  assert.match(worker, /CUSTOMER_TASK_ESCALATE_MIN/);
});

test('reminder delivery is idempotent per record and level', () => {
  const sender = extractLastFunction('reminderSendV430_');
  assert.match(sender, /reminderAlreadySentV430_/);
  assert.match(sender, /reminderMarkSentV430_/);
});

test('reminder trigger installation is gated by explicit release property', () => {
  const fn = extractLastFunction('installReminderEscalationTriggerV430_');
  assert.match(fn, /reminderDeliveryEnabledV430_/);
  assert.match(fn, /blocked:true/);
  assert.match(fn, /runReminderEscalationWorkerV430Live_/);
  assert.match(fn, /everyMinutes\(15\)/);
});

test('live reminder wrapper explicitly disables dry-run only after release gate', () => {
  const fn = extractLastFunction('runReminderEscalationWorkerV430Live_');
  assert.match(fn, /reminderDeliveryEnabledV430_/);
  assert.match(fn, /runReminderEscalationWorkerV430_\(false\)/);
});


test('root Vercel config exposes backend Telegram relay', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
  assert.ok(cfg.includes('backend/api/telegram.js'));
  assert.ok(cfg.includes('"source": "/api/telegram"'));
  assert.ok(cfg.includes('"destination": "/backend/api/telegram"'));
});
