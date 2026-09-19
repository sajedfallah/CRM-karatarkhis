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
  ['WEBHOOK_RELAY_SECRET', 'relay-secret']
]);
const cache = new Map();

function signedBytes(buffer) {
  return Array.from(buffer.values()).map(n => n > 127 ? n - 256 : n);
}

const sandbox = {
  console, Date, JSON, Math, Object, String, Number, Boolean, Array, RegExp, Error,
  parseInt, parseFloat, isNaN,
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
      return signedBytes(crypto.createHmac('sha256', String(secret)).update(String(value), 'utf8').digest());
    },
    computeDigest(_algorithm, value) {
      return signedBytes(crypto.createHash('sha256').update(String(value), 'utf8').digest());
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

const ali = {
  'User ID':'USR-001',
  'نام کامل':'Ali',
  'Telegram User ID':'100'
};

testCase('exact identity rejects similar names and ids', () => {
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Alireza', ali), false);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('USR-0012', ali), false);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('USR-002, USR-001', ali), true);
  assert.strictEqual(sandbox.fieldMatchesUserIdentityV427_('Ali', ali), true);
});

testCase('PERSONAL source is authoritative', () => {
  assert.strictEqual(
    sandbox.personalTaskBelongsToUserV420_(
      { 'منبع':'PERSONAL:USR-002', 'مسئول':'Ali' },
      ali
    ),
    false
  );
});

testCase('pending Telegram user is denied', () => {
  sandbox.readRows = (cfg) => {
    if (cfg && cfg.name === 'Permissions') return [{
      'Permission ID':'PERM-USR-001',
      'User ID':'USR-001',
      'Role':'کارمند داخلی',
      'Scope Type':'ASSIGNED',
      'Scope ID':'OWN_ASSIGNMENTS',
      'وضعیت':'فعال'
    }];
    return [{
      'User ID':'USR-001',
      'Telegram User ID':'100',
      'نام کامل':'Ali',
      'نقش':'کارمند داخلی',
      'وضعیت':'در انتظار فعالسازی'
    }];
  };
  sandbox.getRowById = () => null;
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
  sandbox.readRows = (cfg) => {
    if (cfg && cfg.name === 'Permissions') return [permission];
    return [user];
  };
  sandbox.getRowById = (_cfg, id) => id === 'PERM-USR-001' ? permission : null;
  assert.strictEqual(sandbox.getTelegramUserContextV419_('100').authorized, true);

  permission['وضعیت'] = 'غیرفعال';
  assert.strictEqual(sandbox.getTelegramUserContextV419_('100').authorized, false);
});

testCase('signed relay accepts valid request and rejects replay', () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = 'nonce-1';
  const update = { update_id:42, message:{ text:'/start' } };
  const payload = String(timestamp) + '\n' + nonce + '\n' + JSON.stringify(update);
  const signature = crypto.createHmac('sha256', 'relay-secret').update(payload, 'utf8').digest('hex');

  const envelope = { relay:{ timestamp, nonce, signature }, update };
  const first = sandbox.verifyRelayEnvelopeV427_(envelope);
  const second = sandbox.verifyRelayEnvelopeV427_(envelope);

  assert.strictEqual(first.ok, true);
  assert.strictEqual(second.ok, false);
  assert.strictEqual(second.reason, 'replay');
});

testCase('signed relay rejects expired and bad signature', () => {
  const update = { update_id:43 };
  const expired = sandbox.verifyRelayEnvelopeV427_({
    relay:{
      timestamp:Math.floor(Date.now() / 1000) - 600,
      nonce:'nonce-expired',
      signature:'00'.repeat(32)
    },
    update
  });
  assert.strictEqual(expired.ok, false);
  assert.strictEqual(expired.reason, 'expired_request');

  const bad = sandbox.verifyRelayEnvelopeV427_({
    relay:{
      timestamp:Math.floor(Date.now() / 1000),
      nonce:'nonce-bad',
      signature:'00'.repeat(32)
    },
    update
  });
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, 'bad_signature');
});

testCase('active runtime contains provisioning and sync invariants', () => {
  function lastBody(name) {
    const pos = code.lastIndexOf('function ' + name + '(');
    const next = code.indexOf('\nfunction ', pos + 20);
    return code.slice(pos, next > 0 ? next : code.length);
  }

  const sync = lastBody('syncAllActiveWorkspacesV412');
  assert.ok(sync.includes('WORKSPACE_SYNC_CURSOR_KEY_V427'));
  assert.ok(!sync.includes("DASHBOARD_TEMPLATES['مدیر']"));

  const provision = lastBody('provisionWorkspace');
  assert.ok(!provision.includes('.addEditor('));

  const worker = lastBody('processProvisioningQueue');
  assert.ok(worker.indexOf('workspace_persisted_before_sync') < worker.indexOf('syncWorkspaceDataV412_'));
  assert.ok(worker.indexOf('syncWorkspaceDataV412_') < worker.indexOf('reconcileWorkspaceAccessV427_'));

  const post = lastBody('doPost');
  assert.ok(post.includes('verifyRelayEnvelopeV427_'));

  const render = lastBody('renderRoleDashboardV425_');
  assert.ok(render.includes('VAZIR_FONT_FAMILY_V427'));
  assert.ok(!render.includes('Arial'));
});

console.log('V4.27 behavioral regression tests passed:', passed);
