# V5 QA & Verification Report

تاریخ: `2026-09-17`  
Scope: `feature/v5-backend-foundation` / PR #1

## 1. Summary

این گزارش فقط شواهدی را ثبت می‌کند که واقعاً اجرا یا مشاهده شده‌اند. موارد اجرا نشده صریحاً به‌عنوان Gap علامت‌گذاری شده‌اند.

## 2. Verified Items

### Database / Migration

| Test | Result |
|---|---|
| `0002_case_sync_metadata` applied | PASS |
| `0003_tasks` روی temporary Neon branch | PASS |
| `0003_tasks` روی DEV | PASS |
| `0004_documents` روی temporary Neon branch | PASS |
| `0004_documents` روی DEV | PASS |
| `alembic_version=0004_documents` | PASS |
| DEV data reset after 0004 | PASS |

### API / Deployment

| Test | Result |
|---|---|
| Vercel Preview build | PASS / READY |
| `GET /health` | PASS |
| `GET /health/db` | PASS |
| OpenAPI reachable | PASS |
| Case routes registered | PASS |
| Task routes registered | PASS |
| User routes registered | PASS |
| Manual Sync route registered | PASS |
| Document routes committed/Preview build initiated | VERIFIED IN CODE; final route smoke check should be repeated after READY |

### Authorization

| Scenario | Result |
|---|---|
| Ardavan Scope=`ASSIGNED` configuration | PASS |
| Assigned Task visible to Ardavan | PASS |
| Unassigned Task hidden from Ardavan | PASS |
| customer boundary logic exists server-side | CODE VERIFIED |
| role permission filtering by profile | FIXED / CODE VERIFIED |
| duplicate primary internal assignment prevention | FIXED / CODE VERIFIED |

### Sync

| Scenario | Result |
|---|---|
| Customers `CUS-001`, `CUS-002` previously synced/verified in DEV before reset | PASS before reset |
| Case sheet empty at verification time | CONFIRMED |
| Controlled manual sync route registered | PASS |
| Dry-run design exists | CODE VERIFIED |
| Sheet active flag normalization | FIXED |
| Ambiguous customer matching prevented | FIXED |

> DEV data was later intentionally cleared, so historical PASS evidence does not mean the records still exist.

## 3. Regression Areas Checked

- Vercel route rewrite regression
- DB-before-Sheet-marker sync ordering
- permission-profile leakage
- assigned-only Task visibility
- primary assignment uniqueness semantics
- migration ordering
- Google credential configuration paths

## 4. Tests Not Yet Executed / Gaps

### Automated tests

- Unit test suite: **not present/verified**
- Integration test suite: **not present/verified**
- E2E test suite: **not present/verified**
- GitHub Actions CI: **none for current HEAD**
- Numeric code coverage: **not available**

### HTTP E2E

ابزار Preview fetch موجود امکان ارسال کامل custom request header/body برای همه سناریوهای mutating را فراهم نکرد؛ بنابراین موارد زیر باید با `curl`, Postman یا automated test client اجرا شوند:

- POST Case with `X-User-ID`
- PATCH Case
- POST/DELETE Assignment
- POST/PATCH Task
- POST Task Message
- POST/PATCH Document
- POST Document Approval
- POST Manual Sync dry-run/apply

### Security tests pending

- forged identity attempts
- cross-tenant access
- inactive user denial
- customer manager vs customer employee matrix
- permission profile downgrade/upgrade regression
- document approval privilege escalation
- IDOR tests
- rate limiting
- malformed payload/fuzz testing

### Performance tests pending

- load test
- query latency baseline
- N+1 profiling
- connection pool behavior under concurrency
- large Sheet sync batch
- large Task/Document pagination behavior

## 5. Known Risks

### Sync split-brain window

DB commit قبل از Sheet marker انجام می‌شود. این ترتیب از false-success در Sheet جلوگیری می‌کند، اما اگر DB commit موفق و Sheet write ناموفق شود، reconciliation لازم است.

### Manual Sync duplicate IDs

Validation duplicate ID داخل یک payload batch باید قبل از production سخت‌گیرانه‌تر شود تا count اشتباه یا PK conflict ایجاد نشود.

### Development identity adapter

`X-User-ID` برای production امن نیست؛ production adapter هنوز وجود ندارد.

### Dependency reproducibility

requirements range-based است و lockfile وجود ندارد.

## 6. Recommended QA Gate Before Merge

1. اضافه‌کردن pytest و TestClient.
2. تست authorization matrix.
3. تست migrations روی DB disposable.
4. تست manual sync idempotency/duplicates.
5. تست Case/Task/Document CRUD.
6. تست AuditLog assertions.
7. GitHub Actions workflow.
8. minimum coverage threshold تعریف شود.
9. Vercel Preview smoke test خودکار شود.

## 7. Recommended Production Gate

- 100% pass روی critical auth/tenant tests
- migration rehearsal روی snapshot production-like
- backup/restore drill
- dependency lock verification
- Google auth health test
- monitoring/alerting smoke test
- rollback rehearsal

## 8. QA Status

**Development validation: PARTIAL PASS**  
**Production readiness: NOT YET APPROVED**

دلیل: foundation و migrationها معتبرند، اما automated regression، real production authentication، full E2E و production operational controls هنوز تکمیل نشده‌اند.
