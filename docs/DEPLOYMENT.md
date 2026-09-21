# KARATARKHIS CRM — Deployment Baseline

## Current V5
Vercel Preview + Neon PostgreSQL. No Docker, Redis, independent workers or GitHub Actions at the audited V5 baseline.

## Target environments
development, staging, production with separate DB, secrets, storage, Telegram identity and domains.

## Target production services
frontend, FastAPI API, PostgreSQL, Redis/queue, AI worker, Telegram worker, notification worker, PDF worker, export worker, expiry worker, reverse proxy/HTTPS as deployment model requires.

## Rules
No production deploy in KRT-FOUNDATION-001R.
Production cutover is blocked until version identity is reconciled (main V4.26 vs documented production V4.9.2 vs audit V4.30 target), production auth exists, automated tests/CI pass, backup/restore is tested and migration rehearsal passes.
