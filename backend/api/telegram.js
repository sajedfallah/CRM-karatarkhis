'use strict';

const crypto = require('crypto');

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function canonicalPayload(body) {
  if (typeof body === 'string') {
    try { return JSON.stringify(JSON.parse(body)); }
    catch (_) { return body; }
  }
  return JSON.stringify(body || {});
}

function signEnvelope(timestamp, nonce, payloadJson, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(String(timestamp) + '\n' + String(nonce) + '\n' + String(payloadJson), 'utf8')
    .digest('hex');
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

  const suppliedSecret = req.headers['x-telegram-bot-api-secret-token'] || '';
  if (!safeEqual(suppliedSecret, telegramSecret)) {
    return res.status(401).json({ ok:false, error:'unauthorized_source' });
  }

  const payloadJson = canonicalPayload(req.body);
  let update;
  try { update = JSON.parse(payloadJson); }
  catch (_) { return res.status(400).json({ ok:false, error:'invalid_json' }); }

  if (!update || typeof update !== 'object' || update.update_id == null) {
    return res.status(400).json({ ok:false, error:'invalid_telegram_update' });
  }

  // Milliseconds are used deliberately; Apps Script validates max age/skew.
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const signature = signEnvelope(timestamp, nonce, payloadJson, relaySecret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(appsScriptUrl, {
      method:'POST',
      headers:{ 'content-type':'application/json; charset=utf-8' },
      body:JSON.stringify({
        relay_version:1,
        timestamp,
        nonce,
        payload_json:payloadJson,
        signature
      }),
      signal:controller.signal
    });

    const text = await upstream.text();
    let body = null;
    try { body = JSON.parse(text); } catch (_) {}

    if (!upstream.ok || !body || body.ok !== true) {
      return res.status(502).json({
        ok:false,
        error:'apps_script_rejected_relay',
        reason:body && (body.reason || body.error) ? (body.reason || body.error) : 'unknown'
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
module.exports._test = { safeEqual, canonicalPayload, signEnvelope };
