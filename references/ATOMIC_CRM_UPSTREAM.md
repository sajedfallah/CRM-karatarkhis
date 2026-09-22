# Atomic CRM — مرجع UI کاراترخیص

این مسیر به نسخه پین‌شده‌ی Atomic CRM متصل است تا Codex و تیم توسعه بتوانند سورس کامل مرجع UI را در کنار پروژه ببینند.

- Upstream: https://github.com/marmelab/atomic-crm
- Pinned commit: `625c221d1f3adc442298d9a8cea3af02397dc125`
- Path: `references/atomic-crm/`
- Role: Primary UI/UX reference
- Integration policy: Reference only؛ معماری Backend و Business Ruleهای Atomic CRM نباید بدون Task صریح وارد KARATARKHIS شوند.

برای دریافت سورس کامل بعد از clone:

```bash
git submodule update --init --recursive
```

یا:

```bash
git clone --recurse-submodules https://github.com/sajedfallah/CRM-karatarkhis.git
```

قواعد استفاده در `docs/UI_REFERENCES.md` و `docs/UI_UX.md` مرجع رسمی هستند.
