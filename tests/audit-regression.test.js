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
  assert.match(provision, /DASHBOARD_TEMPLATES/);
  assert.doesNotMatch(provision, /LIVE_DASHBOARDS/);

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
