# Karatarkhis Telegram Relay

این پوشه عمداً با نام `backend` نگه‌داری می‌شود تا با Root Directory فعلی پروژه Vercel سازگار باشد.

## Endpoint

- `GET /api/telegram` — health check
- `POST /api/telegram` — Telegram webhook ingress

## Required Vercel environment variables

- `TELEGRAM_WEBHOOK_SECRET`
- `RELAY_SHARED_SECRET`
- `APPS_SCRIPT_WEB_APP_URL`

Telegram باید webhook را روی URL همین Relay ثبت کند و `secret_token` آن با `TELEGRAM_WEBHOOK_SECRET` برابر باشد.

Relay هدر `X-Telegram-Bot-Api-Secret-Token` را قبل از Forward بررسی می‌کند. سپس payload را با HMAC-SHA256، timestamp و nonce به Apps Script می‌فرستد. Apps Script درخواست مستقیم Telegram یا درخواست replay/منقضی را رد می‌کند.

هیچ Secret واقعی نباید در مخزن Commit شود.
