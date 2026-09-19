'use strict';

const crypto = require('crypto');

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function signEnvelope(timestamp, nonce, update, secret) {
  const payload = String(timestamp) + '\n' + String(nonce) + '\n' + JSON.stringify(update);
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok:true, service:'karatarkhis-telegram-relay' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok:false, error:'method_not_allowed' });
  }

  const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  const relaySecret = process.env.RELAY_SHARED_SECRET || '';
  const appsScriptUrl = process.env.APPS_SCRIPT_WEB_APP_URL || '';

  if (!telegramSecret || !relaySecret || !appsScriptUrl) {
    return res.status(503).json({ ok:false, error:'relay_not_configured' });
  }

  const supplied = req.headers['x-telegram-bot-api-secret-token'] || '';
  if (!safeEqual(supplied, telegramSecret)) {
    return res.status(401).json({ ok:false, error:'invalid_telegram_secret' });
  }

  let update = req.body;
  if (typeof update === 'string') {
    try { update = JSON.parse(update); }
    catch (_) { return res.status(400).json({ ok:false, error:'invalid_json' }); }
  }

  if (!update || typeof update !== 'object' || update.update_id == null) {
    return res.status(400).json({ ok:false, error:'invalid_telegram_update' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const signature = signEnvelope(timestamp, nonce, update, relaySecret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(appsScriptUrl, {
      method:'POST',
      headers:{ 'content-type':'application/json; charset=utf-8' },
      body:JSON.stringify({
        relay:{ timestamp, nonce, signature },
        update
      }),
      signal:controller.signal
    });

    const text = await upstream.text();
    let body;
    try { body = JSON.parse(text); }
    catch (_) { body = { ok:false, error:'invalid_upstream_response' }; }

    if (!upstream.ok || !body || body.ok !== true) {
      return res.status(502).json({
        ok:false,
        error:'apps_script_rejected_relay',
        upstream:body && body.error ? body.error : 'unknown'
      });
    }

    return res.status(200).json({ ok:true, relayed:true });
  } catch (err) {
    const code = err && err.name === 'AbortError'
      ? 'apps_script_timeout'
      : 'relay_forward_failed';
    return res.status(502).json({ ok:false, error:code });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = handler;
module.exports._test = { safeEqual, signEnvelope };
