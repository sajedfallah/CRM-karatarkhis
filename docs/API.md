# KARATARKHIS CRM — API Contract

Prefix: `/api/v1`.

## Existing V5 routes to preserve unless a later scoped task changes them
Health: `/health`, `/health/db`, `/health/sheets`.
Identity: `/api/v1/users/me`, `/api/v1/users/me/permissions`.
Cases: list/create/get/patch + assignments.
Tasks: list/create/get/patch + messages.
Documents: list/create/get/patch + approval.
Sync: `POST /api/v1/sync/manual`.

## Canonical command endpoints planned
- POST /case-drafts/{id}/precheck
- POST /case-drafts/{id}/confirm
- POST /case-drafts/{id}/submit
- POST /cases/{id}/transition
- POST /cases/{id}/reopen-for-correction
- POST /cases/{id}/resubmit
- POST /documents/{id}/versions
- POST /documents/{id}/ai-check
- POST /payments/{id}/confirm
- POST /correspondence/{id}/ai-draft
- POST /correspondence/{id}/request-approval
- POST /correspondence/{id}/approve
- POST /correspondence/{id}/send
- POST /cases/{id}/export/packing-list
- POST /cases/{id}/export/package

Sensitive business state must use command endpoints rather than unrestricted generic PATCH.

## Error contract target
```json
{"error":{"code":"CASE_LOCKED_AFTER_SUBMISSION","message":"این پرونده ثبت نهایی شده و قابل ویرایش نیست.","details":{}},"request_id":"..."}
```

Production authentication remains a blocker; the V5 `X-User-ID` adapter is DEV/STAGING only.
