# KARATARKHIS CRM — Testing Strategy

## Current V5 status
KRT-FOUNDATION-002R established the automated backend baseline: pytest,
FastAPI TestClient fixtures, health/identity checks, tenant-isolation
regressions for cases/tasks/documents, and GitHub Actions CI. CI uses a
disposable PostgreSQL 16 service and validates Alembic from zero to head before
running the regression suite; Gitleaks scans the repository for secrets.

The initial remote CI failure exposed fixture data leakage across PostgreSQL
tests. It was fixed by deterministic FK-safe cleanup and the follow-up CI run
passed. This suite is a foundation, not a claim that P0 E2E coverage is complete.

## Next required task
KRT-IAM-001 must add production authentication, Organization/Membership scope,
invitations, email confirmation, and its security/permission test matrix.

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
