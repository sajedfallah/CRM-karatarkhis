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
