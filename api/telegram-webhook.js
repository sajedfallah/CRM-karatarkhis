'use strict';
const { timingSafeEqual } = require('node:crypto');
function equalSecret(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok:false }); }
  const { TELEGRAM_WEBHOOK_SECRET, TELEGRAM_RELAY_SECRET, APPS_SCRIPT_WEB_APP_URL } = process.env;
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(TELEGRAM_WEBHOOK_SECRET || '') || (TELEGRAM_RELAY_SECRET || '').length < 32 ||
      !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(APPS_SCRIPT_WEB_APP_URL || '')) {
    return res.status(503).json({ ok:false, error:'relay_not_configured' });
  }
  if (!equalSecret(req.headers['x-telegram-bot-api-secret-token'], TELEGRAM_WEBHOOK_SECRET)) return res.status(401).json({ ok:false });
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 262144) return res.status(413).json({ ok:false });
    const update = JSON.parse(raw);
    if (!update || !Number.isSafeInteger(update.update_id) || update.update_id < 0) return res.status(400).json({ ok:false });
    const upstream = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ relay_secret:TELEGRAM_RELAY_SECRET, update }),
      signal:AbortSignal.timeout(50000)
    });
    const result = await upstream.json();
    // Never acknowledge an upstream failure as delivered: Telegram must retry.
    if (!upstream.ok || result.ok !== true || result.handled_error) return res.status(502).json({ ok:false, error:'upstream_failed' });
    return res.status(200).json({ ok:true });
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(400).json({ ok:false, error:'invalid_json' });
    return res.status(502).json({ ok:false, error:'upstream_failed' });
  }
}
module.exports = handler;

