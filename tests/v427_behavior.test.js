'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');
const relay = require('../backend/api/telegram.js');

const code = fs.readFileSync('src/apps-script/Code.gs', 'utf8');

const properties = new Map([
  ['BOT_TOKEN', 'test-token'],
  ['ADMIN_TELEGRAM_ID', '999'],
  ['WEB_APP_URL', 'https://script.example/exec'],
  ['SPREADSHEET_ID', 'STAGING-SHEET'],
  ['CRM_FOLDER_ID', 'STAGING-CRM-FOLDER'],
  ['CRM_DOCUMENTS_ROOT_FOLDER_ID', 'STAGING-DOCS'],
  ['TELEGRAM_RELAY_URL', 'https://relay.example/api/telegram'],
  ['TELEGRAM_WEBHOOK_SECRET', 'telegram-secret'],
  ['RELAY_SHARED_SECRET', 'relay-secret'],
  ['TEMPLATE_ADMIN_ID', 'TPL-A'],
  ['TEMPLATE_INTERNAL_EMPLOYEE_ID', 'TPL-I'],
  ['TEMPLATE_CUSTOMER_MANAGER_ID', 'TPL-CM'],
  ['TEMPLATE_CUSTOMER_EMPLOYEE_ID', 'TPL-CE'],
  ['WORKSPACE_FOLDER_ADMIN_ID', 'WS-A'],
  ['WORKSPACE_FOLDER_INTERNAL_ID', 'WS-I'],
  ['WORKSPACE_FOLDER_CUSTOMER_MANAGER_ID', 'WS-CM'],
  ['WORKSPACE_FOLDER_CUSTOMER_EMPLOYEE_ID', 'WS-CE']
]);

const cache = new Map();

function signedBytes(buffer) {
  return Array.from(buffer.values()).map(n => n > 127 ? n - 256 : n);
}

const sandbox = {
  console, Date, JSON, Math, Object, String, Number, Boolean, Array, RegExp, Error,
  parseInt, parseFloat, isNaN, setTimeout, clearTimeout,
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) { return properties.get(key) || null; },
        setProperty(key, value) { properties.set(key, String(value)); },
        deleteProperty(key) { properties.delete(key); }
      };
    }
  },
  CacheService: {
    getScriptCache() {
      return {
        get(key) { return cache.has(key) ? cache.get(key) : null; },
        put(key, value) { cache.set(key, String(value)); },
        remove(key) { cache.delete(key); }
      };
    }
  },
  Utilities: {
    Charset: { UTF_8: 'utf8' },
    DigestAlgorithm: { SHA_256: 'sha256' },
    computeHmacSha256Signature(value, secret) {
      return signedBytes(
        crypto.createHmac('sha256', String(secret))
          .update(String(value), 'utf8')
          .digest()
      );
    },
    computeDigest(_algorithm, value) {
      return signedBytes(
        crypto.createHash('sha256')
          .update(String(value), 'utf8')
          .digest()
      );
    },
    getUuid() { return '12345678-1234-1234-1234-123456789012'; },
    formatDate() { return '2026-09-19'; }
  },
  Logger: { log() {} },
  Session: {
    getScriptTimeZone() { return 'Asia/Tehran'; },
    getActiveUser() { return { getEmail() { return ''; } }; }
  },
  ScriptApp: {},
  SpreadsheetApp: { BorderStyle: { SOLID: 'SOLID' } },
  DriveApp: {},
  UrlFetchApp: {},
  ContentService: {},
  HtmlService: {}
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'Code.gs', timeout: 5000 });

let passed = 0;
function testCase(name, fn) {
  cache.clear();
  fn();
  passed++;
  console.log('PASS', name);
}

function resetIdentity(users) {
  sandbox.readRows = () => users;
  vm.runInContext('resetIdentityDirectoryV427_()', sandbox);
}

const ali = {
  'User ID':'USR-001',
  'نام کامل':'Ali',
  'Telegram User ID':'100'
};

testCase('scope rejects substring names and similar stable IDs', () => {
  resetIdentity([ali, {
    'User ID':'USR-002',
    'نام کامل':'Alireza',
    'Telegram User ID':'200'
  }]);

  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Alireza', ali), false);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('USR-0012', ali), false);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('USR-002, USR-001', ali), true);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Ali', ali), true);
});

testCase('same-name legacy assignment fails closed', () => {
  resetIdentity([
    ali,
    { 'User ID':'USR-002', 'نام کامل':'Ali', 'Telegram User ID':'200' }
  ]);

  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Ali', ali), false);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('USR-001', ali), true);
});

testCase('same-name legacy ownership fails closed', () => {
  sandbox.readRows = () => [
    { 'User ID':'USR-001', 'نام کامل':'Ali', 'Telegram User ID':'100' },
    { 'User ID':'USR-002', 'نام کامل':'Ali', 'Telegram User ID':'200' }
  ];
  vm.runInContext('resetIdentityDirectoryV427_()', sandbox);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Ali', ali), false);
});

testCase('PERSONAL source is authoritative', () => {
  resetIdentity([ali]);
  assert.strictEqual(
    sandbox.personalTaskBelongsToUserV420_(
      { 'منبع':'PERSONAL:USR-002', 'مسئول':'Ali' },
      ali
    ),
    false
  );
});

testCase('pending Telegram user is denied', () => {
  const user = {
    'User ID':'USR-001',
    'Telegram User ID':'100',
    'نام کامل':'Ali',
    'نقش':'کارمند داخلی',
    'وضعیت':'در انتظار فعالسازی'
  };
  const permission = {
    'Permission ID':'PERM-USR-001',
    'User ID':'USR-001',
    'Role':'کارمند داخلی',
    'Scope Type':'ASSIGNED',
    'Scope ID':'OWN_ASSIGNMENTS',
    'وضعیت':'فعال'
  };

  sandbox.readRows = (cfg) => cfg && cfg.name === 'Permissions' ? [permission] : [user];
  sandbox.getRowById = (_cfg, id) => id === 'PERM-USR-001' ? permission : null;

  const ctx = sandbox.getTelegramUserContextV419_('100');
  assert.strictEqual(ctx.authorized, false);
  assert.strictEqual(ctx.reason, 'status_not_active');
});

testCase('active Telegram user requires active complete permission', () => {
  const user = {
    'User ID':'USR-001',
    'Telegram User ID':'100',
    'نام کامل':'Ali',
    'نقش':'کارمند داخلی',
    'وضعیت':'فعال'
  };
  const permission = {
    'Permission ID':'PERM-USR-001',
    'User ID':'USR-001',
    'Role':'کارمند داخلی',
    'Scope Type':'ASSIGNED',
    'Scope ID':'OWN_ASSIGNMENTS',
    'وضعیت':'فعال'
  };

  sandbox.readRows = (cfg) => cfg && cfg.name === 'Permissions' ? [permission] : [user];
  sandbox.getRowById = (_cfg, id) => id === 'PERM-USR-001' ? permission : null;

  assert.strictEqual(sandbox.getTelegramUserContextV419_('100').authorized, true);
  permission['وضعیت'] = 'غیرفعال';
  assert.strictEqual(sandbox.getTelegramUserContextV419_('100').authorized, false);
});

testCase('signed relay matches Vercel signer and rejects replay', () => {
  const nowMs = Date.now();
  const timestamp = Math.floor(nowMs / 1000);
  const nonce = '12345678-1234-1234-1234-123456789012';
  const update = { update_id:42, message:{ text:'/start' } };
  const signature = relay._test.signEnvelope(
    timestamp,
    nonce,
    update,
    'relay-secret'
  );

  const envelope = {
    relay:{ timestamp, nonce, signature },
    update
  };

  const first = sandbox.verifyRelayEnvelopeV427_(envelope, nowMs + 10);
  const second = sandbox.verifyRelayEnvelopeV427_(envelope, nowMs + 20);

  assert.strictEqual(first.ok, true);
  assert.strictEqual(first.update.update_id, 42);
  assert.strictEqual(second.ok, false);
  assert.strictEqual(second.reason, 'replay');
});

testCase('relay rejects expired and bad signature', () => {
  const nowMs = Date.now();
  const nowSeconds = Math.floor(nowMs / 1000);
  const update = { update_id:43 };

  const expired = sandbox.verifyRelayEnvelopeV427_({
    relay:{
      timestamp:nowSeconds - 600,
      nonce:'12345678-1234-1234-1234-123456789013',
      signature:'00'.repeat(32)
    },
    update
  }, nowMs);
  assert.strictEqual(expired.ok, false);
  assert.strictEqual(expired.reason, 'expired_request');

  const bad = sandbox.verifyRelayEnvelopeV427_({
    relay:{
      timestamp:nowSeconds,
      nonce:'12345678-1234-1234-1234-123456789014',
      signature:'00'.repeat(32)
    },
    update
  }, nowMs);
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, 'bad_signature');
});

testCase('Google access change revokes stale email before new grant', () => {
  const editors = new Set(['old@example.com']);
  const fakeFile = {
    removeEditor(mail) { editors.delete(String(mail).toLowerCase()); },
    removeViewer() {},
    addEditor(mail) { editors.add(String(mail).toLowerCase()); },
    getEditors() {
      return Array.from(editors).map(mail => ({ getEmail: () => mail }));
    },
    getViewers() { return []; }
  };

  sandbox.DriveApp.getFileById = () => fakeFile;
  sandbox.readRows = (cfg) => {
    if (cfg && cfg.name === 'Workspace Mapping') {
      return [{
        'User ID':'USR-001',
        'Gmail مشترک‌شده':'old@example.com',
        'Spreadsheet ID':'FILE-1',
        'Workspace URL':'https://docs.google.com/spreadsheets/d/FILE-1/edit'
      }];
    }
    return [];
  };

  const result = sandbox.reconcileWorkspaceAccessV427_(
    { fileId:'FILE-1', url:'https://docs.google.com/spreadsheets/d/FILE-1/edit' },
    { 'User ID':'USR-001', 'Gmail / Email':'new@example.com', 'وضعیت':'فعال' }
  );

  assert.strictEqual(result.ok, true);
  assert.strictEqual(editors.has('old@example.com'), false);
  assert.strictEqual(editors.has('new@example.com'), true);
});

testCase('Google deactivation removes mapped access', () => {
  const editors = new Set(['old@example.com']);
  const fakeFile = {
    removeEditor(mail) { editors.delete(String(mail).toLowerCase()); },
    removeViewer() {},
    addEditor(mail) { editors.add(String(mail).toLowerCase()); },
    getEditors() {
      return Array.from(editors).map(mail => ({ getEmail: () => mail }));
    },
    getViewers() { return []; }
  };

  sandbox.DriveApp.getFileById = () => fakeFile;
  sandbox.readRows = (cfg) => cfg && cfg.name === 'Workspace Mapping'
    ? [{ 'User ID':'USR-001', 'Gmail مشترک‌شده':'old@example.com' }]
    : [];

  const result = sandbox.reconcileWorkspaceAccessV427_(
    { fileId:'FILE-1', url:'x' },
    { 'User ID':'USR-001', 'Gmail / Email':'old@example.com', 'وضعیت':'غیرفعال' }
  );

  assert.strictEqual(result.ok, true);
  assert.strictEqual(editors.size, 0);
});

testCase('daily task conflict resolver prevents silent concurrent overwrite', () => {
  const baseline = { localHash:'A', centralHash:'A' };
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'B', 'A'), 'push_local');
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'A', 'B'), 'pull_central');
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'B', 'C'), 'conflict');
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(null, 'LOCAL', 'CENTRAL'), 'baseline_missing');
});

testCase('round-robin scheduler reaches mapping 21 on second cycle', () => {
  const rows = Array.from({ length:25 }, (_, i) => ({
    'User ID':'U' + (i + 1),
    'Workspace URL':'https://workspace/' + (i + 1)
  }));

  const first = sandbox.selectMappingsRoundRobinV427_(rows, 20, 0);
  const second = sandbox.selectMappingsRoundRobinV427_(rows, 20, first.nextCursor);

  assert.strictEqual(first.selected.length, 20);
  assert.strictEqual(first.selected[19]['User ID'], 'U20');
  assert.strictEqual(second.selected[0]['User ID'], 'U21');
});

testCase('provisionWorkspace reuses deterministic orphan copy after crash window', () => {
  function lastBody(name) {
    const pos = code.lastIndexOf('function ' + name + '(');
    assert.ok(pos >= 0, 'missing function ' + name);
    const next = code.indexOf('\nfunction ', pos + 20);
    return code.slice(pos, next > 0 ? next : code.length);
  }

  const provision = lastBody('provisionWorkspace');
  assert.ok(provision.includes('findWorkspaceCopyByDeterministicNameV428_'));
  assert.ok(provision.includes('reusedExistingCopy'));
  assert.ok(provision.indexOf('findWorkspaceCopyByDeterministicNameV428_') < provision.indexOf('makeCopy'));
});

testCase('persisted request workspace wins over another mapped workspace on retry', () => {
  const ref = sandbox.preferredWorkspaceRefV427_(
    {
      'Workspace File ID':'FILE-REQ',
      'Workspace URL':'https://docs.google.com/spreadsheets/d/FILE-REQ/edit'
    },
    {
      fileId:'FILE-OTHER',
      url:'https://docs.google.com/spreadsheets/d/FILE-OTHER/edit'
    }
  );

  assert.strictEqual(ref.fileId, 'FILE-REQ');
  assert.strictEqual(ref.source, 'request');
});

testCase('runtime source contains provisioning and sync invariants', () => {
  function lastBody(name) {
    const pos = code.lastIndexOf('function ' + name + '(');
    assert.ok(pos >= 0, 'missing function ' + name);
    const next = code.indexOf('\nfunction ', pos + 20);
    return code.slice(pos, next > 0 ? next : code.length);
  }

  assert.strictEqual(code.includes(".setFontFamily('Arial')"), false);

  const sync = lastBody('syncAllActiveWorkspacesV412');
  assert.ok(sync.includes('selectMappingsRoundRobinV427_'));
  assert.ok(!sync.includes("DASHBOARD_TEMPLATES['مدیر']"));

  const provision = lastBody('provisionWorkspace');
  assert.ok(!provision.includes('.addEditor('));

  const worker = lastBody('processProvisioningQueue');
  assert.ok(worker.includes('provisioningQueueCandidatesV427_'));
  assert.ok(worker.includes('sanitizeNewWorkspaceV427_'));
  assert.ok(worker.indexOf("'Workspace File ID':workspace.fileId") < worker.indexOf('syncWorkspaceDataV412_'));
  assert.ok(worker.indexOf('syncWorkspaceDataV412_') < worker.indexOf('reconcileWorkspaceAccessV427_'));

  const post = lastBody('doPost');
  assert.ok(post.includes('verifyRelayEnvelopeV427_'));

  const render = lastBody('renderRoleDashboardV425_');
  assert.ok(render.includes('VAZIR_FONT_FAMILY_V427'));
  assert.ok(!render.includes("setFontFamily('Arial')"));

  assert.strictEqual(/const SPREADSHEET_ID[^\n]+1hpDV/.test(code), false);
  assert.strictEqual(/TEMPLATE_ADMIN_ID[^\n]+1Zt890/.test(code), false);
});

testCase('required runtime configuration is complete in test environment', () => {
  const result = sandbox.validateRuntimeConfigV427_();
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(Array.from(result.missing), []);
});

testCase('daily task conflict resolver reports conflict', () => {
  const baseline = { localHash:'base', centralHash:'base' };
  assert.strictEqual(
    sandbox.resolveDailyTaskConflictV427_(baseline, 'local-new', 'central-new'),
    'conflict'
  );
});

console.log('V4.29 behavioral regression tests passed:', passed);
