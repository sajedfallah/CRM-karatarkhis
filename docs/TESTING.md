# KARATARKHIS CRM — Testing Strategy

## Current V5 status
Existing documentation reports manual/partial validation for migrations, health endpoints, route registration and portions of authorization, but no verified automated unit/integration/E2E suite and no GitHub Actions CI at the V5 baseline.

## Next required task
KRT-FOUNDATION-002R must establish pytest/TestClient, disposable DB migration tests, authorization regression, CI, secret scan, lint/type baseline.

## P0 scenarios
- customer confirmation required
- post-submit customer lock
- admin limited reopen
- immutable resubmission revisions
- document version history
- stale AI result after source change
- critical HS conflict gate
- expiry alert dedupe/blocking
- Packing List from immutable revision
- exact export package manifest
- posted ledger immutability
- customer isolation / IDOR
- internal-message isolation
- external integration failure isolation

Any failing P0 test blocks go-live.
