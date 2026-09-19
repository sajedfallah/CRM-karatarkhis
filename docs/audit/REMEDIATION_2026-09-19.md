# ممیزی و Remediation — 2026-09-19

## وضعیت انتشار

**Production readiness هنوز تأیید نشده است.** این شاخه فقط برای رفع ایراد و تست staging است. Merge به `main` و انتشار Production نیازمند تأیید صریح است.

## اصلاحات انجام‌شده در V4.28

### A — Scope و جداسازی کاربران
- مجوز Scope دیگر بر اساس substring نام/شناسه صادر نمی‌شود.
- فهرست مسئولان با جداکننده‌های مشخص parse می‌شود و تطابق دقیق User ID / نام legacy / Telegram ID انجام می‌شود.
- اگر `PERSONAL:<User ID>` روی تسک شخصی وجود داشته باشد، همان منبع قطعی مالکیت است.

### B — Webhook
- Apps Script برای Telegram فقط envelope امضاشده Relay را قبول می‌کند.
- امضا HMAC-SHA256 شامل timestamp + nonce + بدنه update است.
- درخواست منقضی، امضای اشتباه و replay پیش از پردازش Telegram رد می‌شود.
- Relay Vercel در `backend/api/telegram.js` هدر `X-Telegram-Bot-Api-Secret-Token` را بررسی می‌کند.

Environment variables موردنیاز Relay:
- `TELEGRAM_WEBHOOK_SECRET`
- `RELAY_SHARED_SECRET`
- `APPS_SCRIPT_WEB_APP_URL`

Script Property موردنیاز Apps Script:
- `RELAY_SHARED_SECRET` = همان مقدار `RELAY_SHARED_SECRET` در Vercel

### C — Telegram access
- دسترسی فقط برای وضعیت صریح `فعال` صادر می‌شود.
- Role ناشناخته، User ID خالی و Customer Scope ناقص رد می‌شود.

### D — Google access lifecycle
- Gmail جدید با Mapping قبلی reconcile می‌شود.
- ایمیل قبلی هنگام تغییر Gmail حذف می‌شود.
- کاربر غیرفعال در sync دسترسی Workspace خود را از دست می‌دهد.
- rollout واقعی باید ابتدا با فایل staging تست شود.

### E — Provisioning idempotency
- Workspace بلافاصله پس از Copy داخل Provisioning Queue ثبت می‌شود.
- Retry ابتدا Workspace File ID/URL همان درخواست را بازیابی می‌کند.
- Share فقط بعد از scoped sync انجام می‌شود.
- خطا بعد از ساخت، شناسه Workspace را از Queue پاک نمی‌کند.

### F — Daily task conflict
- baseline hash از آخرین sync نگهداری می‌شود.
- اگر هم مرکز و هم Workspace نسبت به baseline تغییر کرده باشند، `concurrent_change` ثبت و overwrite متوقف می‌شود.
- این پیاده‌سازی از baseline hash در state مخفی Workspace استفاده می‌کند؛ migration آینده به revision column صریح در رکورد مرکزی پیشنهاد می‌شود.

### G — بیش از ۲۰ Workspace
- cursor پایدار و چرخشی اضافه شد تا Mappingهای بعد از ۲۰ نیز در چرخه‌های بعدی پردازش شوند.

### H — RAW Template
- RAW Template دیگر مقصد sync تسک شخصی مدیر نیست.
- Template preparation فقط ساختار را نگه می‌دارد و داده عملیاتی را پاک می‌کند.

### I — Template source
- سورس کد V4.26+ از RAW Templateها استفاده می‌کند.
- Provisioning Settings زنده باید بعد از staging به RAW IDها migrate شود؛ این شاخه عمداً Production config را تغییر نداده است.

### J — Font
- renderer فعال از `Vazirmatn` استفاده می‌کند.
- تست regression مانع بازگشت `Arial` در renderer فعال می‌شود.

## Vercel
- فولدر `backend` وجود دارد و Root Directory پروژه می‌تواند `backend` باقی بماند.
- endpoint: `/api/telegram`
- Preview باید با Environment Variableهای staging ساخته و تست شود.

## Migration پیشنهادی
1. Spreadsheet/Drive/Bot مستقل staging بسازید.
2. Script Properties staging را تنظیم کنید.
3. Relay Preview را Deploy کنید.
4. webhook Bot تستی را با secret token به Relay وصل کنید.
5. E2E چهار Role، retry provisioning، change Gmail، deactivate/reactivate و conflict را اجرا کنید.
6. Provisioning Settings staging را به RAW Template IDs تغییر دهید.
7. فقط بعد از نتیجه سبز، migration Production انجام شود.

## Rollback
- Apps Script: بازگشت Deployment به نسخه قبل.
- Relay: بازگشت Vercel Deployment قبلی و webhook قبلی.
- Drive access: snapshot Mapping قبل از migration نگهداری شود.
- Provisioning Settings: snapshot قبل از تغییر و restore در rollback.
- Queue تاریخی حذف یا بازنویسی نشود.

## تست‌های زنده باقی‌مانده
- تطبیق GitHub با Apps Script منتشرشده
- inventory trigger/deployment/webhook
- E2E چهار Role در staging
- create customer/case/document/version
- change Gmail / deactivate / role change
- failure injection + provisioning retry
- concurrent sync + daily-task conflict
- cascade delete + rollback
- Telegram latency + sync duration
- validation/protection/style/KPI audit کامل

تا تکمیل این موارد، نسخه Production-ready اعلام نمی‌شود.


## اصلاح تکمیلی V4.28

- فرمت envelope بین Vercel Relay و Apps Script یکسان شد: `{ relay:{timestamp, nonce, signature}, update }`.
- timestamp بر حسب Unix seconds است و TTL پنج‌دقیقه‌ای با future-skew محدود اعمال می‌شود.
- replay key پیش از ورود به handlerهای Telegram ثبت/بررسی می‌شود.
- `RELAY_SHARED_SECRET` نام canonical secret در هر دو سمت است؛ نام قدیمی فقط fallback مهاجرتی است.
- تست‌های regression برای exact identity، same-name fail-closed، relay signature/replay/expiry و conflict sync به‌روزرسانی شدند.
- وضعیت انتشار همچنان **Not Production Ready** است تا E2E زنده Staging تکمیل شود.


## شواهد اجرای شاخه — V4.28

- GitHub Actions `Static validation` برای commit `da83ff953af360c8501192ecb9d3b91270217151` با نتیجه **success** کامل شد (run #89).
- در همان pipeline، syntax Apps Script، اسکن الگوی توکن، behavioral regression، audit regression، syntax Relay و ساختار Vercel بررسی می‌شوند.
- Vercel Preview برای branch `codex/final-audit-handoff-2026-09-19` و commit `da83ff953af360c8501192ecb9d3b91270217151` با وضعیت **READY** ساخته شد؛ بنابراین خطای قبلی `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` در ساختار فعلی بازتولید نمی‌شود.
- Health endpoint Relay روی Preview قبلی همین زنجیره با پاسخ HTTP 200 و `{"ok":true,"service":"karatarkhis-telegram-relay"}` تأیید شد. Preview نهایی دارای Vercel Authentication است و آزمون POST انجام نشد.
- provisioning در V4.28 علاوه بر ثبت File ID پیش از sync، برای crash-window بین `makeCopy` و ثبت Queue از نام deterministic و reuse فایل موجود استفاده می‌کند.
- هیچ merge به `main` و هیچ rollout Production در این ممیزی انجام نشده است.

### مواردی که هنوز شرط Production را مسدود می‌کنند

1. تطبیق نسخه واقعاً Deploy‌شده Apps Script با SHA شاخه.
2. inventory زنده triggerها، deploymentها و webhook.
3. E2E چهار Role با Bot/Sheet/Drive مستقل staging.
4. تست واقعی تغییر Gmail، revoke/reactivate و تغییر Role روی فایل تست.
5. failure injection provisioning و retry در staging.
6. conflict هم‌زمان تسک روزانه در staging.
7. cascade delete و rollback روی داده تستی.
8. ممیزی کامل Validation، protected ranges، استایل مؤثر و KPIها.
9. اندازه‌گیری واقعی latency تلگرام و زمان اجرای sync.

تا زمانی که موارد بالا در staging با Evidence پاس نشوند، وضعیت انتشار **Not Production Ready** باقی می‌ماند.
