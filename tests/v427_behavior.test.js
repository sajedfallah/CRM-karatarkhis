'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('src/apps-script/Code.gs', 'utf8');

const properties = new Map([
  ['BOT_TOKEN', 'test-token'],
  ['ADMIN_TELEGRAM_ID', '999'],
  ['WEB_APP_URL', 'https://script.example/exec'],
  ['TELEGRAM_RELAY_URL', 'https://relay.example/api/telegram'],
  ['TELEGRAM_WEBHOOK_SECRET', 'telegram-secret'],
  ['RELAY_SHARED_SECRET', 'relay-secret']
]);

const cache = new Map();

function toSignedBytes(buffer) {
  return Array.from(buffer.values()).map((n) => n > 127 ? n - 256 : n);
}

const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Object,
  String,
  Number,
  Boolean,
  Array,
  RegExp,
  Error,
  parseInt,
  parseFloat,
  isNaN,
  setTimeout,
  clearTimeout,
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
      return toSignedBytes(
        crypto.createHmac('sha256', String(secret)).update(String(value), 'utf8').digest()
      );
    },
    computeDigest(_algorithm, value) {
      return toSignedBytes(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
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
  SpreadsheetApp: {},
  DriveApp: {},
  UrlFetchApp: {},
  ContentService: {},
  HtmlService: {}
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'Code.gs', timeout: 5000 });

let passed = 0;
function testCase(name, fn) {
  try {
    cache.clear();
    fn();
    passed++;
    console.log('PASS', name);
  } catch (err) {
    console.error('FAIL', name);
    throw err;
  }
}

const ali = {
  'User ID': 'USR-001',
  'نام کامل': 'Ali',
  'Telegram User ID': '100'
};

testCase('exact ownership rejects similar name', () => {
  assert.strictEqual(sandbox.assignmentFieldMatchesUserV427_('Alireza', ali), false);
  assert.strictEqual(sandbox.assignmentFieldMatchesUserV427_('Ali', ali), true);
});

testCase('exact ownership rejects similar stable id', () => {
  assert.strictEqual(sandbox.assignmentFieldMatchesUserV427_('USR-0012', ali), false);
  assert.strictEqual(sandbox.assignmentFieldMatchesUserV427_('USR-002, USR-001', ali), true);
});

testCase('personal source is authoritative', () => {
  assert.strictEqual(
    sandbox.personalTaskBelongsToUserV420_(
      { 'منبع': 'PERSONAL:USR-002', 'مسئول': 'Ali' },
      ali
    ),
    false
  );
});

testCase('pending Telegram user is denied', () => {
  sandbox.readRows = () => [{
    'User ID': 'USR-001',
    'Telegram User ID': '100',
    'نام کامل': 'Ali',
    'نقش': 'کارمند داخلی',
    'وضعیت': 'در انتظار فعالسازی'
  }];
  sandbox.getRowById = () => ({
    'Permission ID': 'PERM-USR-001',
    'Role': 'کارمند داخلی',
    'Scope Type': 'ASSIGNED',
    'Scope ID': 'OWN_ASSIGNMENTS',
    'وضعیت': 'فعال'
  });
  const ctx = sandbox.getTelegramUserContextV419_('100');
  assert.strictEqual(ctx.authorized, false);
  assert.strictEqual(ctx.reason, 'status_not_active');
});

testCase('active Telegram user requires complete active permission', () => {
  sandbox.readRows = () => [{
    'User ID': 'USR-001',
    'Telegram User ID': '100',
    'نام کامل': 'Ali',
    'نقش': 'کارمند داخلی',
    'وضعیت': 'فعال'
  }];
  sandbox.getRowById = () => ({
    'Permission ID': 'PERM-USR-001',
    'Role': 'کارمند داخلی',
    'Scope Type': 'ASSIGNED',
    'Scope ID': 'OWN_ASSIGNMENTS',
    'وضعیت': 'فعال'
  });
  const ctx = sandbox.getTelegramUserContextV419_('100');
  assert.strictEqual(ctx.authorized, true);
});

testCase('daily task conflict resolver detects concurrent changes', () => {
  const baseline = { localHash: 'A', centralHash: 'A' };
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'B', 'A'), 'push_local');
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'A', 'B'), 'pull_central');
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(baseline, 'B', 'C'), 'conflict');
});

testCase('daily task without baseline never overwrites divergent central state', () => {
  assert.strictEqual(sandbox.resolveDailyTaskConflictV427_(null, 'LOCAL', 'CENTRAL'), 'baseline_missing');
});

testCase('sync scheduler selects oldest mappings instead of first rows forever', () => {
  const rows = [
    { 'User ID': 'U1', 'Workspace URL': 'x1', 'آخرین Sync': '2026-09-19 10:00:00' },
    { 'User ID': 'U2', 'Workspace URL': 'x2', 'آخرین Sync': '2026-09-19 09:00:00' },
    { 'User ID': 'U21', 'Workspace URL': 'x21', 'آخرین Sync': '' }
  ];
  const selected = sandbox.selectMappingsForSyncV427_(rows, 2);
  assert.deepStrictEqual(Array.from(selected, x => x['User ID']), ['U21', 'U2']);
});

testCase('persisted request workspace wins over user mapping on retry', () => {
  const ref = sandbox.preferredWorkspaceRefV427_(
    {
      'Workspace File ID': 'FILE-REQ',
      'Workspace URL': 'https://docs.google.com/spreadsheets/d/FILE-REQ/edit'
    },
    {
      fileId: 'FILE-OTHER',
      url: 'https://docs.google.com/spreadsheets/d/FILE-OTHER/edit'
    }
  );
  assert.strictEqual(ref.fileId, 'FILE-REQ');
  assert.strictEqual(ref.source, 'request');
});

testCase('email lifecycle identifies stale principal', () => {
  assert.deepStrictEqual(
    Array.from(sandbox.emailsToRevokeV427_('old@example.com', 'new@example.com')),
    ['old@example.com']
  );
  assert.deepStrictEqual(
    Array.from(sandbox.emailsToRevokeV427_('same@example.com', 'same@example.com')),
    []
  );
});

testCase('signed relay accepts valid request then rejects replay', () => {
  const timestamp = Date.now();
  const nonce = '12345678-1234-1234-1234-123456789012';
  const payloadJson = JSON.stringify({ update_id: 42, message: { text: '/start' } });
  const signature = crypto
    .createHmac('sha256', 'relay-secret')
    .update(String(timestamp) + '\n' + nonce + '\n' + payloadJson, 'utf8')
    .digest('hex');

  const envelope = {
    relay_version: 1,
    timestamp,
    nonce,
    payload_json: payloadJson,
    signature
  };

  const first = sandbox.verifyRelayEnvelopeV427_(envelope, timestamp + 100);
  const second = sandbox.verifyRelayEnvelopeV427_(envelope, timestamp + 200);

  assert.strictEqual(first.ok, true);
  assert.strictEqual(second.ok, false);
  assert.strictEqual(second.reason, 'relay_replay');
});

testCase('signed relay rejects expired and bad signature requests', () => {
  const now = Date.now();
  const payloadJson = JSON.stringify({ update_id: 43 });

  const expired = sandbox.verifyRelayEnvelopeV427_({
    relay_version: 1,
    timestamp: now - (6 * 60 * 1000),
    nonce: '12345678-1234-1234-1234-123456789013',
    payload_json: payloadJson,
    signature: '00'.repeat(32)
  }, now);
  assert.strictEqual(expired.ok, false);
  assert.strictEqual(expired.reason, 'relay_expired');

  const bad = sandbox.verifyRelayEnvelopeV427_({
    relay_version: 1,
    timestamp: now,
    nonce: '12345678-1234-1234-1234-123456789014',
    payload_json: payloadJson,
    signature: '00'.repeat(32)
  }, now);
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, 'bad_signature');
});

testCase('active runtime contains hardening invariants', () => {
  assert.strictEqual(code.includes(".setFontFamily('Arial')"), false);

  const syncPos = code.lastIndexOf('function syncAllActiveWorkspacesV412');
  const syncEnd = code.indexOf('\nfunction ', syncPos + 20);
  const syncBody = code.slice(syncPos, syncEnd > 0 ? syncEnd : code.length);
  assert.strictEqual(syncBody.includes("DASHBOARD_TEMPLATES['مدیر']"), false);
  assert.strictEqual(syncBody.includes('selectMappingsForSyncV427_'), true);

  const provPos = code.lastIndexOf('function provisionWorkspace(user)');
  const provEnd = code.indexOf('\nfunction ', provPos + 20);
  const provBody = code.slice(provPos, provEnd > 0 ? provEnd : code.length);
  assert.strictEqual(provBody.includes('.addEditor('), false);

  const postPos = code.lastIndexOf('function doPost(e)');
  const postEnd = code.indexOf('\nfunction ', postPos + 20);
  const postBody = code.slice(postPos, postEnd > 0 ? postEnd : code.length);
  assert.strictEqual(postBody.includes('verifyRelayEnvelopeV427_'), true);
});

console.log('V4.27 behavioral regression tests passed:', passed);
