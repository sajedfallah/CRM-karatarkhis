# KARATARKHIS CRM — AI System

## Current status
Canonical AI orchestration is MISSING in current V5 baseline.

## Allowed AI capabilities
CLASSIFY, EXTRACT, COMPARE, SUMMARIZE, SUGGEST, EXPLAIN.

AI must not silently final-approve HS, post finance, close cases, bypass permission, send sensitive official letters, or mutate critical fields.

## Required architecture
AI request/result/review records, provider abstraction, prompt/model versioning, structured schema validation, permission-filtered context, source/evidence/confidence, stale invalidation, retry/manual fallback and cost tracking path.

## Document intelligence
Upload → scan → classification → extraction → normalization → deterministic validations → semantic comparison → findings → human review where required.

Document contents are untrusted input and cannot issue system instructions.

## Expiry
AI may extract/interpret expiry; deterministic jobs compute remaining days, thresholds, blocks and reminders.
