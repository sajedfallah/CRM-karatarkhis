/************************************************************
 * PUBLIC REPOSITORY MIRROR: secrets are loaded from Apps Script Script Properties.
 * KARATARHIS / TEJARATYAAR CRM — V4.7 STABLE CALLBACK + SHEET SYNC
 * Telegram Bot + Google Sheets + Drive Provisioning
 * Source of truth: CRM | ترخیص یزد | V1.5
 ************************************************************/

const BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN') || '';
const ADMIN_TELEGRAM_ID = PropertiesService.getScriptProperties().getProperty('ADMIN_TELEGRAM_ID') || '';
const WEB_APP_URL = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') || '';
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
const CRM_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('CRM_FOLDER_ID') || '';
const CRM_DOCUMENTS_ROOT_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('CRM_DOCUMENTS_ROOT_FOLDER_ID') || '';
const APP_VERSION = 'V4.28-2026-09-19';

const DASHBOARD_TEMPLATES = {
  'مدیر': PropertiesService.getScriptProperties().getProperty('TEMPLATE_ADMIN_ID') || '',
  'کارمند داخلی': PropertiesService.getScriptProperties().getProperty('TEMPLATE_INTERNAL_EMPLOYEE_ID') || '',
  'کارمند': PropertiesService.getScriptProperties().getProperty('TEMPLATE_INTERNAL_EMPLOYEE_ID') || '',
  'مدیر مشتری': PropertiesService.getScriptProperties().getProperty('TEMPLATE_CUSTOMER_MANAGER_ID') || '',
  'کارمند مشتری': PropertiesService.getScriptProperties().getProperty('TEMPLATE_CUSTOMER_EMPLOYEE_ID') || ''
};

const LIVE_DASHBOARDS = {
  admin: PropertiesService.getScriptProperties().getProperty('LIVE_DASHBOARD_ADMIN_URL') || '',
  employee: PropertiesService.getScriptProperties().getProperty('LIVE_DASHBOARD_INTERNAL_URL') || '',
  customerManager: PropertiesService.getScriptProperties().getProperty('LIVE_DASHBOARD_CUSTOMER_MANAGER_URL') || '',
  customerEmployee: PropertiesService.getScriptProperties().getProperty('LIVE_DASHBOARD_CUSTOMER_EMPLOYEE_URL') || ''
};

const SHEETS = {
  customers: { name: 'مشتریان', headerRow: 1, idHeader: 'مشتری ID' },
  cases: { name: 'پرونده‌ها', headerRow: 1, idHeader: 'Case ID' },
  tasks: { name: 'تسک‌ها', headerRow: 1, idHeader: 'Task ID' },
  users: { name: 'مدیریت کاربران', headerRow: 4, idHeader: 'User ID' },
  usersRaw: { name: 'Users', headerRow: 1, idHeader: 'User ID' },
  permissions: { name: 'Permissions', headerRow: 1, idHeader: 'Permission ID' },
  mapping: { name: 'Workspace Mapping', headerRow: 1, idHeader: 'Mapping ID' },
  customerDocs: { name: 'اسناد مشتریان', headerRow: 1, idHeader: 'مشتری ID' },
  caseDocs: { name: 'اسناد پرونده‌ها', headerRow: 1, idHeader: 'شناسه پرونده' },
  legacyEmployees: { name: 'کارمندان', headerRow: 1, idHeader: 'شناسه' },
  alerts: { name: 'مرکز هشدارها', headerRow: 5, idHeader: null },
  systemLog: { name: 'System Log', headerRow: 1, idHeader: null }
};

const WIZARDS = {
  customers: [
    { key: 'نوع مشتری', label: 'نوع مشتری', required: true, options: ['حقوقی', 'حقیقی'] },
    { key: 'نام / عنوان مشتری', label: 'نام / عنوان مشتری', required: true },
    { key: 'شناسه ملی / کد ملی', label: 'شناسه ملی / کد ملی', required: false },
    { key: 'شماره ثبت', label: 'شماره ثبت', required: false },
    { key: 'کد اقتصادی', label: 'کد اقتصادی', required: false },
    { key: 'شخص رابط', label: 'شخص رابط', required: false },
    { key: 'موبایل', label: 'موبایل', required: true },
    { key: 'تلفن', label: 'تلفن', required: false },
    { key: 'ایمیل', label: 'ایمیل', required: false },
    { key: 'استان / شهر', label: 'استان / شهر', required: false },
    { key: 'آدرس', label: 'آدرس', required: false },
    { key: 'شروع وکالت', label: 'شروع وکالت', required: false },
    { key: 'پایان وکالت', label: 'پایان وکالت', required: false },
    { key: 'لینک وکالت‌نامه', label: 'لینک وکالت‌نامه', required: false },
    { key: 'یادداشت', label: 'یادداشت', required: false }
  ],
  cases: [
    { key: 'Customer ID', label: 'Customer ID مشتری', required: true },
    { key: 'شماره کوتاژ', label: 'شماره کوتاژ', required: false },
    { key: 'نوع عملیات', label: 'نوع عملیات', required: true, options: ['واردات', 'صادرات', 'ترانزیت', 'سایر'] },
    { key: 'گمرک', label: 'گمرک', required: true },
    { key: 'شماره پرونده واقعی', label: 'شماره پرونده واقعی', required: false },
    { key: 'وضعیت', label: 'وضعیت', required: true, options: ['جدید', 'در حال اقدام', 'منتظر مدرک', 'تکمیل شده', 'بایگانی'] },
    { key: 'مسئول داخلی اصلی', label: 'مسئول داخلی اصلی', required: false },
    { key: 'همکاران داخلی', label: 'همکاران داخلی', required: false },
    { key: 'مسئول مشتری', label: 'مسئول مشتری', required: false },
    { key: 'وضعیت اسناد', label: 'وضعیت اسناد', required: false, options: ['ناقص', 'در حال تکمیل', 'کامل'] },
    { key: 'تاریخ کوتاژ', label: 'تاریخ کوتاژ', required: false },
    { key: 'یادداشت', label: 'یادداشت', required: false }
  ],
  tasks: [
    { key: 'نوع ارتباط', label: 'نوع ارتباط', required: true, options: ['مشتری', 'پرونده', 'عمومی'] },
    { key: 'شناسه مرتبط', label: 'شناسه مرتبط (Customer ID یا Case ID)', required: false },
    { key: 'موضوع', label: 'موضوع تسک', required: true },
    { key: 'دسته‌بندی', label: 'دسته‌بندی', required: false },
    { key: 'مسئول', label: 'مسئول', required: true },
    { key: 'اولویت', label: 'اولویت', required: true, options: ['بالا', 'متوسط', 'پایین'] },
    { key: 'وضعیت', label: 'وضعیت', required: true, options: ['باز', 'در حال انجام', 'منتظر پاسخ', 'انجام شد', 'لغو شده'] },
    { key: 'موعد', label: 'موعد', required: false },
    { key: 'نیازمند مدیر', label: 'نیازمند مدیر', required: true, options: ['بله', 'خیر'] },
    { key: 'اقدام بعدی', label: 'اقدام بعدی', required: false },
    { key: 'یادداشت', label: 'یادداشت', required: false }
  ],
  users: [
    { key: 'نام کامل', label: 'نام کامل', required: true },
    { key: 'موبایل', label: 'موبایل', required: false },
    { key: 'Gmail / Email', label: 'Gmail / Email', required: false },
    { key: 'Telegram User ID', label: 'Telegram User ID', required: true, type: 'digits' },
    { key: 'نقش', label: 'نقش', required: true, options: ['مدیر', 'کارمند داخلی', 'مدیر مشتری', 'کارمند مشتری'] },
    { key: 'Customer ID', label: 'Customer ID (برای نقش‌های مشتری)', required: false },
    { key: 'شرکت', label: 'شرکت', required: false },
    { key: 'پروفایل دسترسی', label: 'پروفایل دسترسی', required: true, options: ['پیشرفته', 'مدیریتی', 'عملیاتی', 'محدود'] },
    { key: 'وضعیت', label: 'وضعیت', required: true, options: ['فعال', 'غیرفعال'] },
    { key: 'یادداشت', label: 'یادداشت', required: false }
  ]
};

// ===== V4.8 FAST RUNTIME CACHES =====
// These globals live for the duration of one Apps Script invocation and avoid
// reopening the same Spreadsheet / Sheet / header ranges repeatedly.
let __CRM_SS = null;
const __SHEET_CACHE = {};
const __HEADER_CACHE = {};


function getCRMSpreadsheet() {
  if (!__CRM_SS) __CRM_SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  return __CRM_SS;
}

function getWebAppUrl() {
  // V4.4 intentionally pins Telegram to the exact deployment URL supplied by the admin.
  // This removes ambiguity when several Apps Script deployments exist.
  return WEB_APP_URL;
}

function rememberCurrentWebAppUrl() {
  PropertiesService.getScriptProperties().setProperty('KARATARHIS_WEB_APP_URL', WEB_APP_URL);
  return WEB_APP_URL;
}

function doGet() {
  return jsonResponse({ ok: true, service: 'Karatarkhis CRM Bot', version: APP_VERSION, webhook: getWebAppUrl(), scriptId: ScriptApp.getScriptId(), time: new Date().toISOString() });
}

function doPost(e) {
  let updateId = '';
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: true, version: APP_VERSION });
    }

    const update = JSON.parse(e.postData.contents);
    updateId = String(update.update_id || '');

    // هر update تلگرام یک شناسه یکتا دارد. این کنترل برای جلوگیری از Retry تکراری کافی است.
    // در V4.6 یک ScriptLock سراسری وجود داشت که در ترافیک سریع callback می‌توانست
    // Update بعدی را با پاسخ busy=true دور بیندازد. در V4.6 عمداً حذف شده است.
    if (updateId && isDuplicateUpdate(updateId)) {
      return jsonResponse({ ok: true, duplicate: true, version: APP_VERSION });
    }

    if (update.callback_query) {
      handleCallback(update.callback_query);
    } else if (update.message) {
      handleMessage(update.message);
    }

    return jsonResponse({ ok: true, version: APP_VERSION });
  } catch (err) {
    console.error(err);
    // اگر پردازش واقعاً شکست خورد، شناسه update را از cache پاک می‌کنیم تا
    // کلیک مجدد کاربر با یک update جدید بی‌دلیل تحت تأثیر آن قرار نگیرد.
    if (updateId) {
      try { CacheService.getScriptCache().remove('TG_UPDATE_' + updateId); } catch (_) {}
    }
    try { logSystem('telegram_error', String(err && err.stack ? err.stack : err)); } catch (_) {}
    return jsonResponse({ ok: true, handled_error: true, version: APP_VERSION });
  }
}

function isDuplicateUpdate(updateId) {
  const cache = CacheService.getScriptCache();
  const key = 'TG_UPDATE_' + updateId;
  if (cache.get(key)) return true;
  cache.put(key, '1', 21600);
  return false;
}

function isDuplicateMessage(message) {
  if (!message || !message.chat || message.message_id == null) return false;
  const cache = CacheService.getScriptCache();
  const key = 'TG_MSG_' + String(message.chat.id) + '_' + String(message.message_id);
  if (cache.get(key)) return true;
  cache.put(key, '1', 21600);
  return false;
}

function telegramApi(method, payload) {
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });

  const body = response.getContentText();
  const httpCode = response.getResponseCode();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (_) {
    parsed = { ok: false, description: 'Telegram response is not valid JSON', raw: body };
  }
  parsed._httpCode = httpCode;
  parsed._method = method;
  return parsed;
}

function telegramErrorDescription(result) {
  if (!result) return 'پاسخی از Telegram دریافت نشد.';
  const description = String(result.description || result.raw || 'خطای نامشخص Telegram');
  const code = result.error_code || result._httpCode || '';
  return (code ? '[' + code + '] ' : '') + description;
}

function sendMessage(chatId, text, replyMarkup) {
  const payload = { chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return telegramApi('sendMessage', payload);
}

function panelMessageKey(chatId) {
  return 'TG_PANEL_MESSAGE_' + String(chatId);
}

function getPanelMessageId(chatId) {
  const value = CacheService.getScriptCache().get(panelMessageKey(chatId));
  return value ? Number(value) : null;
}

function setPanelMessageId(chatId, messageId) {
  if (messageId == null) return;
  CacheService.getScriptCache().put(panelMessageKey(chatId), String(messageId), 21600);
}

function clearPanelMessageId(chatId) {
  CacheService.getScriptCache().remove(panelMessageKey(chatId));
}

function deleteTelegramMessage(chatId, messageId) {
  if (messageId == null) return { ok: true };
  return telegramApi('deleteMessage', { chat_id: chatId, message_id: messageId });
}

function safeDeleteMessage(chatId, messageId) {
  try {
    const result = deleteTelegramMessage(chatId, messageId);
    if (Number(getPanelMessageId(chatId)) === Number(messageId)) clearPanelMessageId(chatId);
    return result;
  } catch (_) {
    return { ok: false };
  }
}

function rememberPanelFromResult(chatId, result) {
  if (result && result.ok && result.result && result.result.message_id != null) {
    setPanelMessageId(chatId, result.result.message_id);
  }
  return result;
}

/**
 * SINGLE-PANEL UI
 * تمام منوها، سوال‌ها و نتیجه عملیات داخل یک پیام واحد نمایش داده می‌شوند.
 * مرحله قبلی با Edit جایگزین می‌شود و روی چت باقی نمی‌ماند.
 */
function renderPanel(chatId, text, replyMarkup, preferredMessageId) {
  const previousId = preferredMessageId || getPanelMessageId(chatId);
  const markup = replyMarkup || { inline_keyboard: [] };

  // V4.8 FAST PATH:
  // Most menu navigation uses a single Telegram editMessageText call.
  // Only if Telegram refuses the edit do we fall back to send + delete.
  if (previousId) {
    const edited = telegramApi('editMessageText', {
      chat_id: chatId,
      message_id: previousId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: markup
    });

    const description = String((edited && edited.description) || '');
    if ((edited && edited.ok) || description.indexOf('message is not modified') >= 0) {
      setPanelMessageId(chatId, previousId);
      return edited;
    }
  }

  const sent = sendMessage(chatId, text, markup);
  if (sent && sent.ok && sent.result && sent.result.message_id != null) {
    const newId = Number(sent.result.message_id);
    setPanelMessageId(chatId, newId);

    if (previousId && Number(previousId) !== newId) {
      // Cleanup is best-effort only; it must never block the new panel.
      try { deleteTelegramMessage(chatId, previousId); } catch (_) {}
    }
    return sent;
  }

  try {
    logSystem('panel_render_error',
      'edit=' + (previousId ? 'failed' : 'not_attempted') +
      ' | send=' + telegramErrorDescription(sent) +
      ' | messageId=' + (previousId || '')
    );
  } catch (_) {}

  throw new Error('Telegram panel render failed: ' + telegramErrorDescription(sent));
}
function editMessage(chatId, messageId, text, replyMarkup) {
  return renderPanel(chatId, text, replyMarkup, messageId);
}

function answerCallback(id, text) {
  try {
    return telegramApi('answerCallbackQuery', { callback_query_id: id, text: text || undefined });
  } catch (err) {
    // شکست ACK نباید اجرای اکشن دکمه را متوقف کند.
    return { ok: false, description: String(err && err.message ? err.message : err) };
  }
}

function isAdmin(userId) {
  return String(userId) === String(ADMIN_TELEGRAM_ID);
}

function isBotCommand(text, command) {
  const t = String(text || '').trim();
  const c = String(command || '').replace(/^\//, '');
  // Supports: /start, /start@BotName and /start payload (deep links).
  const re = new RegExp('^\\/' + c + '(?:@[A-Za-z0-9_]+)?(?:\\s+.*)?$', 'i');
  return re.test(t);
}

function getCachedFastDashboardStatsOnly() {
  try {
    const cached = CacheService.getScriptCache().get('KARATARHIS_FAST_STATS_V48');
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return { customers: '…', cases: '…', tasks: '…', users: '…', attention: '…' };
}

function buildAdminMenuPayloadFast() {
  const s = getCachedFastDashboardStatsOnly();
  const text =
    '🎯 <b>کاراترخیص | پنل مدیریت</b>\n\n' +
    '📊 <b>وضعیت فعلی CRM</b>\n' +
    '🏢 مشتریان فعال: <b>' + s.customers + '</b>\n' +
    '📁 پرونده‌های باز: <b>' + s.cases + '</b>\n' +
    '✅ تسک‌های باز: <b>' + s.tasks + '</b>\n' +
    '👥 کاربران فعال: <b>' + s.users + '</b>\n\n' +
    'یکی از بخش‌ها را انتخاب کنید:\n\n<code>' + APP_VERSION + '</code>';
  const kb = { inline_keyboard: [
    [{ text: '📊 داشبورد مدیریتی', callback_data: 'dashboard' }],
    [{ text: '🏢 مشتریان', callback_data: 'customers' }, { text: '📁 پرونده‌ها', callback_data: 'cases' }],
    [{ text: '✅ تسک‌ها', callback_data: 'tasks' }, { text: '👥 مدیریت کاربران', callback_data: 'users' }]
  ]};
  return { text: text, kb: kb };
}

function showAdminMenuFresh(chatId) {
  const oldPanelId = getPanelMessageId(chatId);
  const payload = buildAdminMenuPayloadFast();
  const sent = sendMessage(chatId, payload.text, payload.kb);
  if (!(sent && sent.ok && sent.result && sent.result.message_id != null)) {
    throw new Error('Start menu send failed: ' + telegramErrorDescription(sent));
  }
  const newId = Number(sent.result.message_id);
  setPanelMessageId(chatId, newId);
  if (oldPanelId && Number(oldPanelId) !== newId) {
    try { deleteTelegramMessage(chatId, oldPanelId); } catch (_) {}
  }
  try {
    PropertiesService.getScriptProperties().setProperty('TG_LAST_START_TRACE', JSON.stringify({
      version: APP_VERSION,
      chatId: String(chatId),
      oldPanelId: oldPanelId || null,
      newPanelId: newId,
      at: new Date().toISOString()
    }));
  } catch (_) {}
  return sent;
}

function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = String(message.from && message.from.id);
  const text = String(message.text || '').trim();
  const incomingMessageId = message.message_id;

  if (!isAdmin(userId)) {
    sendMessage(chatId, '⛔️ شما دسترسی مدیریت این ربات را ندارید.');
    return;
  }

  // V4.10 START RESCUE: /start must respond without any Google Sheet read.
  if (isBotCommand(text, 'start') || isBotCommand(text, 'admin') || isBotCommand(text, 'menu') || text === 'مدیریت' || text === 'پنل مدیریت') {
    clearState(userId);
    const sent = showAdminMenuFresh(chatId);
    if (sent && sent.ok) safeDeleteMessage(chatId, incomingMessageId);
    return;
  }

  if (isBotCommand(text, 'cancel') || text === 'لغو') {
    clearState(userId);
    const sent = showAdminMenuFresh(chatId);
    if (sent && sent.ok) safeDeleteMessage(chatId, incomingMessageId);
    return;
  }

  const state = getState(userId);
  if (state) {
    safeDeleteMessage(chatId, incomingMessageId);
    processStateInput(chatId, userId, text, state);
    return;
  }

  // پیام آزاد ادمین در حالت بدون عملیات باقی نماند.
  safeDeleteMessage(chatId, incomingMessageId);
}

function resolveCallbackRoute(data) {
  data = String(data || '');

  if (['main', 'dashboard', 'customers', 'cases', 'tasks', 'users'].indexOf(data) >= 0) {
    return { type: 'nav', target: data };
  }

  if (data.indexOf('dashboard:') === 0) {
    const action = data.substring('dashboard:'.length);
    if (['summary', 'daily', 'alerts', 'links', 'sync'].indexOf(action) >= 0) {
      return { type: 'dashboard', action: action };
    }
    return null;
  }

  let m = data.match(/^(customers|cases|tasks|users):(list|add|search|edit|deactivate|delete|docs|complete|workspace)$/);
  if (m) return { type: 'entity', entity: m[1], action: m[2] };

  // V4.9: every wizard callback carries a short session id.
  // This prevents buttons from an older wizard from mutating the current state.
  m = data.match(/^wizopt:([A-Za-z0-9_-]{4,16}):(\d+):(\d+)$/);
  if (m) return { type: 'wizard_option', session: m[1], step: Number(m[2]), optionIndex: Number(m[3]) };

  m = data.match(/^wizskip:([A-Za-z0-9_-]{4,16}):(\d+)$/);
  if (m) return { type: 'wizard_skip', session: m[1], step: Number(m[2]) };

  m = data.match(/^wizcancel:([A-Za-z0-9_-]{4,16})$/);
  if (m) return { type: 'wizard_cancel', session: m[1] };

  m = data.match(/^wizconfirm:([A-Za-z0-9_-]{4,16}):(save|back|cancel)$/);
  if (m) return { type: 'wizard_confirm', session: m[1], action: m[2] };

  // Legacy callbacks are recognized only so the bot can reject them cleanly.
  m = data.match(/^wizopt:(\d+):(\d+)$/);
  if (m) return { type: 'wizard_option', session: null, step: Number(m[1]), optionIndex: Number(m[2]), legacy: true };

  m = data.match(/^wizskip:(\d+)$/);
  if (m) return { type: 'wizard_skip', session: null, step: Number(m[1]), legacy: true };

  if (data === 'wizcancel') return { type: 'wizard_cancel', session: null, legacy: true };

  m = data.match(/^wizconfirm:(save|back|cancel)$/);
  if (m) return { type: 'wizard_confirm', session: null, action: m[1], legacy: true };

  m = data.match(/^delconfirm:(customers|cases|tasks|users):([A-Za-z0-9_-]{4,20}):(yes|cancel)$/);
  if (m) return { type: 'delete_confirm', entity: m[1], token: m[2], action: m[3] };

  m = data.match(/^editfield:(customers|cases|tasks|users):(\d+)$/);
  if (m) return { type: 'edit_field', entity: m[1], fieldIndex: Number(m[2]) };

  m = data.match(/^editopt:(customers|cases|tasks|users):(\d+):(\d+)$/);
  if (m) return { type: 'edit_option', entity: m[1], fieldIndex: Number(m[2]), optionIndex: Number(m[3]) };

  return null;
}

function callbackTraceKey() {
  return 'KARATARHIS_LAST_CALLBACK_TRACE';
}

function setCallbackTrace(payload) {
  try {
    CacheService.getScriptCache().put(
      callbackTraceKey(),
      JSON.stringify(Object.assign({ at: nowFa(), version: APP_VERSION }, payload || {})),
      21600
    );
  } catch (_) {}
}

function getLastCallbackTrace() {
  const raw = CacheService.getScriptCache().get(callbackTraceKey());
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return { raw: raw }; }
}

function getActiveUiDebugState() {
  const report = {
    version: APP_VERSION,
    adminPanelMessageId: getPanelMessageId(ADMIN_TELEGRAM_ID),
    adminState: getState(ADMIN_TELEGRAM_ID),
    lastCallback: getLastCallbackTrace(),
    webhook: getTelegramWebhookInfo()
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function handleCallback(callback) {
  const userId = String(callback.from && callback.from.id);
  if (!isAdmin(userId)) {
    answerCallback(callback.id, 'دسترسی ندارید');
    return;
  }

  if (!callback.message || !callback.message.chat) {
    answerCallback(callback.id, 'پیام دکمه در دسترس نیست؛ /start را بزنید.');
    setCallbackTrace({ ok: false, stage: 'missing_callback_message', data: String(callback.data || '') });
    return;
  }

  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const data = String(callback.data || '');

  // V4.9 STALE-PANEL GUARD:
  // A visible old menu must never be able to reset the current wizard/state.
  const activePanelId = getPanelMessageId(chatId);
  if (activePanelId && Number(activePanelId) !== Number(messageId)) {
    answerCallback(callback.id, 'این منو قدیمی است؛ از آخرین منوی ربات استفاده کنید.');
    setCallbackTrace({
      ok: false,
      stage: 'stale_panel_callback_blocked',
      data: data,
      staleMessageId: messageId,
      activePanelId: activePanelId
    });
    // Disable the stale keyboard so it cannot be pressed again.
    try {
      telegramApi('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] }
      });
    } catch (_) {}
    return;
  }

  setPanelMessageId(chatId, messageId);

  const route = resolveCallbackRoute(data);
  if (!route) {
    answerCallback(callback.id, 'این دکمه مسیر معتبری ندارد.');
    logSystem('callback_unhandled', data);
    renderPanel(
      chatId,
      '⚠️ <b>مسیر این دکمه تعریف نشده است</b>\n\n' +
      'Callback: <code>' + escapeHtml(data) + '</code>\n\n' +
      'به منوی اصلی برگردید.',
      backMainKeyboard(),
      messageId
    );
    return;
  }

  // Spinner تلگرام باید فوراً بسته شود؛ عملیات Sheet/Drive بعد از آن اجرا می‌شود.
  answerCallback(callback.id);

  try {
    if (route.type === 'nav') {
      clearState(userId);
      if (route.target === 'main') { showAdminMenu(chatId, messageId); return; }
      if (route.target === 'dashboard') { showDashboardMenu(chatId, messageId); return; }
      showEntityMenu(chatId, messageId, route.target);
      return;
    }

    if (route.type === 'dashboard') {
      clearState(userId);
      if (route.action === 'summary') { showDashboardSummary(chatId, messageId); return; }
      if (route.action === 'daily') { showDailyReport(chatId, messageId); return; }
      if (route.action === 'alerts') { showAlerts(chatId, messageId); return; }
      if (route.action === 'links') { showDashboardLinks(chatId, messageId); return; }
      if (route.action === 'sync') {
        const r = runSyncAudit();
        showSyncResult(chatId, messageId, r);
        return;
      }
    }

    if (route.type === 'entity') {
      clearState(userId);
      if (route.action === 'list') { showEntityList(chatId, messageId, route.entity); return; }
      if (route.action === 'add') { startCreateWizard(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'search') { startSearch(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'edit') { startEdit(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'deactivate') { startDeactivate(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'delete') { startDeleteCascadeV413(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'docs') { startDocsLookup(chatId, userId, route.entity, messageId); return; }
      if (route.action === 'complete') { startCompleteTask(chatId, userId, messageId); return; }
      if (route.action === 'workspace') { startWorkspaceLookup(chatId, userId, messageId); return; }
    }

    if (route.type === 'delete_confirm') {
      handleDeleteConfirmV413(chatId, userId, route.entity, route.token, route.action, messageId);
      return;
    }

    if (route.type === 'wizard_option') {
      handleWizardOption(chatId, userId, route.session, route.step, route.optionIndex, messageId);
      return;
    }

    if (route.type === 'wizard_skip') {
      handleWizardSkip(chatId, userId, route.session, route.step, messageId);
      return;
    }

    if (route.type === 'wizard_cancel') {
      cancelCreateWizard(chatId, userId, messageId, route.session);
      return;
    }

    if (route.type === 'wizard_confirm') {
      handleWizardConfirm(chatId, userId, route.session, route.action, messageId);
      return;
    }

    if (route.type === 'edit_field') {
      handleEditFieldSelection(chatId, userId, route.entity, route.fieldIndex, messageId);
      return;
    }

    if (route.type === 'edit_option') {
      handleEditOptionSelection(chatId, userId, route.entity, route.fieldIndex, route.optionIndex, messageId);
      return;
    }

    throw new Error('Route resolved but was not dispatched: ' + data);
  } catch (err) {
    setCallbackTrace({ ok: false, stage: 'callback_error', data: data, error: String(err && err.stack ? err.stack : err) });
    logSystem('callback_error', data + ' | ' + String(err && err.stack ? err.stack : err));
    renderPanel(
      chatId,
      '❌ <b>خطا در اجرای دکمه</b>\n\n' +
      'دکمه: <code>' + escapeHtml(data) + '</code>\n' +
      'خطا: ' + escapeHtml(String(err && err.message ? err.message : err)) +
      '\n\nلطفاً به منوی اصلی برگردید.',
      backMainKeyboard(),
      messageId
    );
  }
}

function getButtonAuditSamples() {
  const samples = [
    'main', 'dashboard', 'customers', 'cases', 'tasks', 'users',
    'dashboard:summary', 'dashboard:daily', 'dashboard:alerts', 'dashboard:links', 'dashboard:sync'
  ];

  const entityActions = {
    customers: ['list', 'add', 'search', 'edit', 'deactivate', 'delete', 'docs'],
    cases: ['list', 'add', 'search', 'edit', 'deactivate', 'delete', 'docs'],
    tasks: ['list', 'add', 'search', 'edit', 'complete', 'delete'],
    users: ['list', 'add', 'search', 'edit', 'deactivate', 'delete', 'workspace']
  };

  Object.keys(entityActions).forEach(function(entity) {
    entityActions[entity].forEach(function(action) {
      samples.push(entity + ':' + action);
    });
  });

  samples.push(
    'wizopt:TEST99:0:0',
    'wizskip:TEST99:1',
    'wizcancel:TEST99',
    'wizconfirm:TEST99:save',
    'wizconfirm:TEST99:back',
    'wizconfirm:TEST99:cancel',
    'delconfirm:users:TEST99:yes',
    'delconfirm:customers:TEST99:cancel',
    'editfield:users:0',
    'editopt:users:4:0'
  );
  return samples;
}

function testCallbackRuntime() {
  const report = {
    version: APP_VERSION,
    webhook: getTelegramWebhookInfo(),
    panelMessageId: getPanelMessageId(ADMIN_TELEGRAM_ID),
    state: getState(ADMIN_TELEGRAM_ID),
    routes: testButtonRoutes()
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testButtonRoutes() {
  const samples = getButtonAuditSamples();
  const results = samples.map(function(callbackData) {
    const route = resolveCallbackRoute(callbackData);
    return { callback: callbackData, ok: !!route, route: route || null };
  });

  const failed = results.filter(function(r) { return !r.ok; });
  const report = {
    version: APP_VERSION,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    failures: failed,
    results: results
  };

  Logger.log(JSON.stringify(report, null, 2));
  if (failed.length) throw new Error('Button route audit failed: ' + failed.map(function(x){return x.callback;}).join(', '));
  return report;
}

function showAdminMenu(chatId, messageId) {
  const s = getFastDashboardStats();
  const text =
    '🎯 <b>کاراترخیص | پنل مدیریت</b>\n\n' +
    '📊 <b>وضعیت فعلی CRM</b>\n' +
    '🏢 مشتریان فعال: <b>' + s.customers + '</b>\n' +
    '📁 پرونده‌های باز: <b>' + s.cases + '</b>\n' +
    '✅ تسک‌های باز: <b>' + s.tasks + '</b>\n' +
    '👥 کاربران فعال: <b>' + s.users + '</b>\n\n' +
    'یکی از بخش‌ها را انتخاب کنید:\n\n<code>' + APP_VERSION + '</code>';

  const kb = { inline_keyboard: [
    [{ text: '📊 داشبورد مدیریتی', callback_data: 'dashboard' }],
    [{ text: '🏢 مشتریان', callback_data: 'customers' }, { text: '📁 پرونده‌ها', callback_data: 'cases' }],
    [{ text: '✅ تسک‌ها', callback_data: 'tasks' }, { text: '👥 مدیریت کاربران', callback_data: 'users' }]
  ]};
  renderPanel(chatId, text, kb, messageId);
}

function showDashboardMenu(chatId, messageId) {
  const text = '📊 <b>داشبورد مدیریتی</b>\n\nگزارش، هشدار و وضعیت همگام‌سازی را از این بخش مدیریت کنید.';
  const kb = { inline_keyboard: [
    [{ text: '📈 خلاصه وضعیت', callback_data: 'dashboard:summary' }, { text: '🗓 گزارش روزانه', callback_data: 'dashboard:daily' }],
    [{ text: '⚠️ هشدارها', callback_data: 'dashboard:alerts' }, { text: '🔗 داشبوردها', callback_data: 'dashboard:links' }],
    [{ text: '🔄 همگام‌سازی و لینک‌سازی', callback_data: 'dashboard:sync' }],
    [{ text: '⬅️ بازگشت', callback_data: 'main' }]
  ]};
  editMessage(chatId, messageId, text, kb);
}

function showEntityMenu(chatId, messageId, entity) {
  const names = { customers: '🏢 مشتریان', cases: '📁 پرونده‌ها', tasks: '✅ تسک‌ها', users: '👥 مدیریت کاربران' };
  const rows = [
    [{ text: '📋 لیست', callback_data: entity + ':list' }, { text: '🔎 جستجو', callback_data: entity + ':search' }],
    [{ text: '➕ ثبت جدید', callback_data: entity + ':add' }, { text: '✏️ اصلاح', callback_data: entity + ':edit' }],
    [{ text: entity === 'tasks' ? '✅ تکمیل تسک' : '🚫 غیرفعال/بایگانی', callback_data: entity + ':' + (entity === 'tasks' ? 'complete' : 'deactivate') }],
    [{ text: '🗑 حذف کامل', callback_data: entity + ':delete' }]
  ];
  if (entity === 'customers' || entity === 'cases') rows.push([{ text: '📎 اسناد مرتبط', callback_data: entity + ':docs' }]);
  if (entity === 'users') rows.push([{ text: '🔗 وضعیت Workspace', callback_data: 'users:workspace' }]);
  rows.push([{ text: '⬅️ بازگشت', callback_data: 'main' }]);
  editMessage(chatId, messageId, names[entity] + '\n\nعملیات موردنظر را انتخاب کنید:', { inline_keyboard: rows });
}

function backMainKeyboard() {
  return { inline_keyboard: [[{ text: '⬅️ بازگشت به منوی اصلی', callback_data: 'main' }]] };
}

function entityBackKeyboard(entity) {
  return { inline_keyboard: [[{ text: '⬅️ بازگشت', callback_data: entity }], [{ text: '🏠 منوی اصلی', callback_data: 'main' }]] };
}

function newWizardSessionId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

function wizardSessionMatches(state, session) {
  if (!state || !state.session) return false;
  return !!session && String(state.session) === String(session);
}

function rejectStaleWizard(chatId, userId, messageId) {
  const state = getState(userId);
  if (state && state.mode === 'create') {
    askWizardStep(chatId, userId, 'این دکمه مربوط به فرم قبلی است؛ مرحله فعلی حفظ شد.', messageId);
    return;
  }
  if (state && state.mode === 'create_confirm') {
    showCreateConfirmation(chatId, userId, messageId);
    return;
  }
  renderPanel(chatId, '⚠️ این عملیات منقضی شده است. از منوی فعلی ادامه دهید.', backMainKeyboard(), messageId);
}

function startCreateWizard(chatId, userId, entity, messageId) {
  if (!WIZARDS[entity]) throw new Error('فرم ثبت برای این بخش تعریف نشده است.');
  setPanelMessageId(chatId, messageId || getPanelMessageId(chatId));
  setState(userId, {
    mode: 'create',
    entity: entity,
    step: 0,
    data: {},
    session: newWizardSessionId(),
    startedAt: Date.now()
  });
  askWizardStep(chatId, userId, '', messageId);
}

function askWizardStep(chatId, userId, notice, preferredMessageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'create') return;

  const fields = WIZARDS[state.entity];
  if (!fields) throw new Error('ساختار فرم پیدا نشد.');

  if (state.step >= fields.length) {
    showCreateConfirmation(chatId, userId, preferredMessageId);
    return;
  }

  const field = fields[state.step];
  let text = '';
  if (notice) text += '⚠️ ' + escapeHtml(notice) + '\n\n';

  text +=
    '➕ <b>ثبت جدید</b>\n\n' +
    '🧩 <b>مرحله ' + (state.step + 1) + ' از ' + fields.length + '</b>\n\n' +
    '❓ ' + escapeHtml(field.label) + (field.required ? ' <b>*</b>' : ' (اختیاری)');

  const buttons = [];

  if (field.options) {
    field.options.forEach(function(opt, i) {
      buttons.push([{ text: opt, callback_data: 'wizopt:' + state.session + ':' + state.step + ':' + i }]);
    });
  } else if (!field.required) {
    buttons.push([{ text: '⏭ رد شدن از این مرحله', callback_data: 'wizskip:' + state.session + ':' + state.step }]);
  }

  buttons.push([{ text: '❌ انصراف', callback_data: 'wizcancel:' + state.session }]);

  if (!field.options) {
    text += '\n\nپاسخ را به صورت پیام ارسال کنید.';
  }
  text += '\n\nبرای انصراف می‌توانید <code>/cancel</code> هم بفرستید.';
  text += '\n\n<code>' + APP_VERSION + '</code>';

  renderPanel(chatId, text, { inline_keyboard: buttons }, preferredMessageId);
}

function handleWizardOption(chatId, userId, session, step, idx, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'create') {
    renderPanel(chatId, '⚠️ عملیات ثبت فعال نیست.', backMainKeyboard(), messageId);
    return;
  }

  if (!wizardSessionMatches(state, session)) {
    rejectStaleWizard(chatId, userId, messageId);
    return;
  }

  if (Number(step) !== Number(state.step)) {
    askWizardStep(chatId, userId, 'این دکمه مربوط به مرحله قبلی است.', messageId);
    return;
  }

  const field = WIZARDS[state.entity][state.step];
  if (!field || !field.options || idx < 0 || idx >= field.options.length) {
    throw new Error('گزینه انتخاب‌شده معتبر نیست.');
  }

  state.data[field.key] = field.options[idx];
  state.step++;
  setState(userId, state);
  askWizardStep(chatId, userId, '', messageId);
}

function handleWizardSkip(chatId, userId, session, step, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'create') {
    renderPanel(chatId, '⚠️ عملیات ثبت فعال نیست.', backMainKeyboard(), messageId);
    return;
  }

  if (!wizardSessionMatches(state, session)) {
    rejectStaleWizard(chatId, userId, messageId);
    return;
  }

  if (Number(step) !== Number(state.step)) {
    askWizardStep(chatId, userId, 'این دکمه مربوط به مرحله قبلی است.', messageId);
    return;
  }

  const field = WIZARDS[state.entity][state.step];
  if (!field) throw new Error('مرحله فرم پیدا نشد.');
  if (field.required) {
    askWizardStep(chatId, userId, 'این فیلد الزامی است و قابل رد شدن نیست.', messageId);
    return;
  }

  state.data[field.key] = '';
  state.step++;
  setState(userId, state);
  askWizardStep(chatId, userId, '', messageId);
}

function cancelCreateWizard(chatId, userId, messageId, session) {
  const state = getState(userId);
  if (state && state.session && !wizardSessionMatches(state, session)) {
    rejectStaleWizard(chatId, userId, messageId);
    return;
  }
  const entity = state && state.entity ? state.entity : null;
  clearState(userId);
  if (entity && ['customers','cases','tasks','users'].indexOf(entity) >= 0) {
    showEntityMenu(chatId, messageId || getPanelMessageId(chatId), entity);
  } else {
    showAdminMenu(chatId, messageId || getPanelMessageId(chatId));
  }
}

function buildWizardSummary(entity, data) {
  const fields = WIZARDS[entity] || [];
  let text = '🧾 <b>بازبینی اطلاعات قبل از ثبت</b>\n\n';
  fields.forEach(function(field) {
    const value = Object.prototype.hasOwnProperty.call(data, field.key) ? data[field.key] : '';
    text += '• <b>' + escapeHtml(field.label) + ':</b> ' + escapeHtml(String(value || '—')) + '\n';
  });
  return truncateTelegram(text);
}

function showCreateConfirmation(chatId, userId, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'create') return;

  state.mode = 'create_confirm';
  setState(userId, state);

  const text = buildWizardSummary(state.entity, state.data) +
    '\n\n✅ اگر اطلاعات صحیح است ثبت نهایی را بزنید.';

  const kb = { inline_keyboard: [
    [{ text: '✅ تأیید و ثبت نهایی', callback_data: 'wizconfirm:' + state.session + ':save' }],
    [{ text: '↩️ برگشت به مرحله قبل', callback_data: 'wizconfirm:' + state.session + ':back' }],
    [{ text: '❌ انصراف', callback_data: 'wizconfirm:' + state.session + ':cancel' }]
  ]};

  renderPanel(chatId, text, kb, messageId);
}

function handleWizardConfirm(chatId, userId, session, action, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'create_confirm') {
    renderPanel(chatId, '⚠️ مرحله تأیید ثبت فعال نیست.', backMainKeyboard(), messageId);
    return;
  }

  if (!wizardSessionMatches(state, session)) {
    rejectStaleWizard(chatId, userId, messageId);
    return;
  }

  if (action === 'cancel') {
    const entity = state.entity;
    clearState(userId);
    showEntityMenu(chatId, messageId, entity);
    return;
  }

  if (action === 'back') {
    state.mode = 'create';
    state.step = Math.max(0, (WIZARDS[state.entity] || []).length - 1);
    setState(userId, state);
    askWizardStep(chatId, userId, '', messageId);
    return;
  }

  if (action === 'save') {
    finishCreateWizard(chatId, userId, state, messageId);
    return;
  }

  throw new Error('عملیات تأیید نامعتبر است.');
}

function processStateInput(chatId, userId, text, state) {
  try {
    if (state.mode === 'create') {
      const field = WIZARDS[state.entity][state.step];
      if (!field) {
        showCreateConfirmation(chatId, userId);
        return;
      }

      if (field.options) {
        askWizardStep(chatId, userId, 'لطفاً یکی از گزینه‌های روی صفحه را انتخاب کنید.');
        return;
      }

      if (text === '/skip') {
        if (field.required) {
          askWizardStep(chatId, userId, 'این فیلد الزامی است.');
          return;
        }
        state.data[field.key] = '';
      } else {
        validateFieldValue(field, text);
        state.data[field.key] = text;
      }

      state.step++;
      setState(userId, state);
      askWizardStep(chatId, userId);
      return;
    }

    if (state.mode === 'create_confirm') {
      showCreateConfirmation(chatId, userId);
      return;
    }

    if (state.mode === 'search') {
      clearState(userId);
      const rows = searchEntity(state.entity, text);
      renderPanel(chatId, formatSearchResults(state.entity, rows), entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'edit_id') {
      const row = getEntityById(state.entity, text);
      if (!row) {
        renderPanel(
          chatId,
          '❌ <b>شناسه پیدا نشد</b>\n\nدوباره شناسه را ارسال کنید:\n' +
          escapeHtml(idHint(state.entity)) +
          '\n\nبرای لغو: <code>/cancel</code>'
        );
        return;
      }
      state.targetId = text;
      state.mode = 'edit_field';
      setState(userId, state);
      showEditableFields(chatId, state.entity, getPanelMessageId(chatId));
      return;
    }

    if (state.mode === 'edit_value') {
      updateEntityField(state.entity, state.targetId, state.fieldKey, text);
      clearState(userId);
      renderPanel(chatId, '✅ مقدار «' + escapeHtml(state.fieldKey) + '» بروزرسانی شد.', entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'edit_option') {
      renderPanel(chatId, 'لطفاً یکی از گزینه‌های دکمه‌ای را انتخاب کنید.', entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'delete_id') {
      const id = String(text || '').trim();
      const row = getEntityById(state.entity, id);
      if (!row) {
        renderPanel(chatId, '❌ <b>شناسه پیدا نشد</b>\n\nدوباره شناسه را ارسال کنید:\n' + escapeHtml(idHint(state.entity)) + '\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: state.entity }]] });
        return;
      }
      showDeleteConfirmationV413(chatId, userId, state.entity, id, row, getPanelMessageId(chatId));
      return;
    }

    if (state.mode === 'delete_confirm') {
      renderPanel(chatId, '⚠️ برای حذف کامل فقط از دکمه‌های تأیید یا انصراف استفاده کنید.', entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'deactivate') {
      const ok = deactivateEntity(state.entity, text);
      clearState(userId);
      renderPanel(chatId, ok ? '✅ وضعیت رکورد بروزرسانی شد.' : '❌ شناسه پیدا نشد.', entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'complete_task') {
      const ok = updateEntityField('tasks', text, 'وضعیت', 'انجام شد');
      clearState(userId);
      renderPanel(chatId, ok ? '✅ تسک انجام‌شده ثبت شد.' : '❌ Task ID پیدا نشد.', entityBackKeyboard('tasks'));
      return;
    }

    if (state.mode === 'docs_lookup') {
      clearState(userId);
      renderPanel(chatId, formatDocs(state.entity, text), entityBackKeyboard(state.entity));
      return;
    }

    if (state.mode === 'workspace_lookup') {
      clearState(userId);
      renderPanel(chatId, formatWorkspace(text), entityBackKeyboard('users'));
      return;
    }
  } catch (err) {
    logSystem('state_error', String(err && err.stack ? err.stack : err));
    if (state && (state.mode === 'create' || state.mode === 'create_confirm')) {
      if (state.mode === 'create_confirm') showCreateConfirmation(chatId, userId);
      else askWizardStep(chatId, userId, String(err.message || err));
    } else {
      renderPanel(
        chatId,
        '❌ ' + escapeHtml(String(err.message || err)) +
        '\n\nبرای لغو <code>/cancel</code> را بفرستید.'
      );
    }
  }
}

function finishCreateWizard(chatId, userId, state, messageId) {
  const result = createEntity(state.entity, state.data, userId);
  clearState(userId);
  let msg = '✅ <b>ثبت با موفقیت انجام شد</b>\n\n🆔 ' + escapeHtml(result.id);
  if (result.workspaceUrl) msg += '\n🔗 <a href="' + result.workspaceUrl + '">Workspace کاربر</a>';
  if (result.folderUrl) msg += '\n📁 <a href="' + result.folderUrl + '">پوشه اسناد</a>';
  renderPanel(chatId, msg, entityBackKeyboard(state.entity), messageId);
}

function startSearch(chatId, userId, entity, messageId) {
  setState(userId, { mode: 'search', entity: entity });
  renderPanel(chatId, '🔎 <b>جستجو</b>\n\nعبارت جستجو را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] }, messageId);
}

function startEdit(chatId, userId, entity, messageId) {
  setState(userId, { mode: 'edit_id', entity: entity });
  renderPanel(chatId, '✏️ <b>اصلاح اطلاعات</b>\n\nشناسه رکورد را ارسال کنید:\n' + escapeHtml(idHint(entity)) + '\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] }, messageId);
}

function showEditableFields(chatId, entity, messageId) {
  const fields = WIZARDS[entity];
  const kb = {
    inline_keyboard: fields.map(function(f, i) {
      return [{ text: '✏️ ' + f.label, callback_data: 'editfield:' + entity + ':' + i }];
    }).concat([[{ text: '❌ انصراف', callback_data: entity }]])
  };
  renderPanel(chatId, '✏️ <b>اصلاح اطلاعات</b>\n\nکدام فیلد اصلاح شود؟', kb, messageId || getPanelMessageId(chatId));
}

function handleEditFieldSelection(chatId, userId, entity, idx, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'edit_field' || state.entity !== entity) {
    renderPanel(chatId, '⚠️ عملیات اصلاح فعال نیست.', entityBackKeyboard(entity), messageId);
    return;
  }

  const field = WIZARDS[entity][idx];
  if (!field) throw new Error('فیلد انتخاب‌شده معتبر نیست.');

  state.fieldKey = field.key;
  state.fieldIndex = idx;

  if (field.options) {
    state.mode = 'edit_option';
    setState(userId, state);
    const buttons = field.options.map(function(opt, optIdx) {
      return [{ text: opt, callback_data: 'editopt:' + entity + ':' + idx + ':' + optIdx }];
    });
    buttons.push([{ text: '❌ انصراف', callback_data: entity }]);
    renderPanel(chatId, '✏️ مقدار جدید برای «' + escapeHtml(field.label) + '» را انتخاب کنید.', { inline_keyboard: buttons }, messageId);
    return;
  }

  state.mode = 'edit_value';
  setState(userId, state);
  renderPanel(
    chatId,
    '✏️ مقدار جدید برای «' + escapeHtml(field.label) + '» را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>',
    { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] },
    messageId
  );
}

function handleEditOptionSelection(chatId, userId, entity, fieldIndex, optionIndex, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'edit_option' || state.entity !== entity || Number(state.fieldIndex) !== Number(fieldIndex)) {
    renderPanel(chatId, '⚠️ عملیات اصلاح فعال نیست.', entityBackKeyboard(entity), messageId);
    return;
  }

  const field = WIZARDS[entity][fieldIndex];
  if (!field || !field.options || optionIndex < 0 || optionIndex >= field.options.length) {
    throw new Error('گزینه ویرایش معتبر نیست.');
  }

  const value = field.options[optionIndex];
  const ok = updateEntityField(entity, state.targetId, field.key, value);
  clearState(userId);

  renderPanel(
    chatId,
    ok ? '✅ مقدار «' + escapeHtml(field.label) + '» به «' + escapeHtml(value) + '» بروزرسانی شد.' : '❌ رکورد پیدا نشد.',
    entityBackKeyboard(entity),
    messageId
  );
}

function startDeactivate(chatId, userId, entity, messageId) {
  setState(userId, { mode: 'deactivate', entity: entity });
  renderPanel(chatId, '🚫 <b>غیرفعال / بایگانی</b>\n\nشناسه رکورد را ارسال کنید:\n' + escapeHtml(idHint(entity)) + '\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] }, messageId);
}

function startCompleteTask(chatId, userId, messageId) {
  setState(userId, { mode: 'complete_task', entity: 'tasks' });
  renderPanel(chatId, '✅ <b>تکمیل تسک</b>\n\nTask ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: 'tasks' }]] }, messageId);
}

function startDocsLookup(chatId, userId, entity, messageId) {
  setState(userId, { mode: 'docs_lookup', entity: entity });
  renderPanel(
    chatId,
    entity === 'customers'
      ? '📎 <b>اسناد مشتری</b>\n\nCustomer ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>'
      : '📎 <b>اسناد پرونده</b>\n\nCase ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>',
    { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] },
    messageId
  );
}

function startWorkspaceLookup(chatId, userId, messageId) {
  setState(userId, { mode: 'workspace_lookup', entity: 'users' });
  renderPanel(chatId, '🔗 <b>وضعیت Workspace</b>\n\nUser ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: 'users' }]] }, messageId);
}

function validateFieldValue(field, value) {
  if (field.required && !String(value || '').trim()) throw new Error('این فیلد الزامی است.');
  if (field.type === 'digits' && !/^\d+$/.test(String(value).trim())) throw new Error('فقط عدد وارد کنید.');
}

function finishCreateWizard(chatId, userId, state) {
  const result = createEntity(state.entity, state.data, userId);
  clearState(userId);
  let msg = '✅ <b>ثبت با موفقیت انجام شد</b>\n\n🆔 ' + escapeHtml(result.id);
  if (result.workspaceUrl) msg += '\n🔗 <a href="' + result.workspaceUrl + '">Workspace کاربر</a>';
  if (result.folderUrl) msg += '\n📁 <a href="' + result.folderUrl + '">پوشه اسناد</a>';
  renderPanel(chatId, msg, entityBackKeyboard(state.entity));
}

function startSearch(chatId, userId, entity) {
  setState(userId, { mode: 'search', entity: entity });
  renderPanel(chatId, '🔎 <b>جستجو</b>\n\nعبارت جستجو را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>');
}

function startEdit(chatId, userId, entity) {
  setState(userId, { mode: 'edit_id', entity: entity });
  renderPanel(chatId, '✏️ <b>اصلاح اطلاعات</b>\n\nشناسه رکورد را ارسال کنید:\n' + escapeHtml(idHint(entity)) + '\n\nبرای لغو: <code>/cancel</code>');
}

function showEditableFields(chatId, entity, messageId) {
  const fields = WIZARDS[entity];
  const kb = {
    inline_keyboard: fields.map(function(f, i) {
      return [{ text: '✏️ ' + f.label, callback_data: 'editfield:' + entity + ':' + i }];
    }).concat([[{ text: '❌ لغو', callback_data: entity }]])
  };
  renderPanel(chatId, '✏️ <b>اصلاح اطلاعات</b>\n\nکدام فیلد اصلاح شود؟', kb, messageId || getPanelMessageId(chatId));
}

function handleEditFieldSelection(chatId, userId, data) {
  const parts = data.split(':');
  const entity = parts[1], idx = Number(parts[2]);
  const state = getState(userId);
  if (!state || state.mode !== 'edit_field' || state.entity !== entity) return;
  const field = WIZARDS[entity][idx];
  if (!field) return;
  state.mode = 'edit_value';
  state.fieldKey = field.key;
  setState(userId, state);
  renderPanel(chatId, '✏️ مقدار جدید برای «' + escapeHtml(field.label) + '» را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>');
}

function startDeactivate(chatId, userId, entity) {
  setState(userId, { mode: 'deactivate', entity: entity });
  renderPanel(chatId, '🚫 <b>غیرفعال / بایگانی</b>\n\nشناسه رکورد را ارسال کنید:\n' + escapeHtml(idHint(entity)) + '\n\nبرای لغو: <code>/cancel</code>');
}

function startCompleteTask(chatId, userId) {
  setState(userId, { mode: 'complete_task', entity: 'tasks' });
  renderPanel(chatId, '✅ <b>تکمیل تسک</b>\n\nTask ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>');
}

function startDocsLookup(chatId, userId, entity) {
  setState(userId, { mode: 'docs_lookup', entity: entity });
  renderPanel(
    chatId,
    entity === 'customers'
      ? '📎 <b>اسناد مشتری</b>\n\nCustomer ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>'
      : '📎 <b>اسناد پرونده</b>\n\nCase ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>'
  );
}

function startWorkspaceLookup(chatId, userId, messageId) {
  setState(userId, { mode: 'workspace_lookup', entity: 'users' });
  renderPanel(chatId, '🔗 <b>وضعیت Workspace</b>\n\nUser ID را ارسال کنید.\n\nبرای لغو: <code>/cancel</code>', { inline_keyboard: [[{ text: '❌ انصراف', callback_data: 'users' }]] }, messageId || getPanelMessageId(chatId));
}

function idHint(entity) {
  return { customers: 'مثال: CUS-001', cases: 'مثال: CASE-001', tasks: 'مثال: TSK-001', users: 'مثال: USR-INTERNAL-001' }[entity] || '';
}

function createEntity(entity, data, actorUserId) {
  if (entity === 'customers') return createCustomer(data, actorUserId);
  if (entity === 'cases') return createCase(data, actorUserId);
  if (entity === 'tasks') return createTask(data, actorUserId);
  if (entity === 'users') return createUser(data, actorUserId);
  throw new Error('Entity نامعتبر است.');
}

function createCustomer(data, actorUserId) {
  const id = nextId('customers', 'CUS-', 3);
  const folder = createCustomerFolder(id, data['نام / عنوان مشتری']);
  const row = Object.assign({}, data, {
    'مشتری ID': id,
    'وضعیت وکالت': data['پایان وکالت'] ? 'فعال' : '',
    '📁 پوشه اسناد': folder ? folder.getUrl() : '',
    'فعال؟': true,
    'تاریخ ایجاد': nowFa(),
    'ایجادکننده': actorUserId
  });
  appendObject(SHEETS.customers, row);
  logSystem('customer_create', id + ' | ' + data['نام / عنوان مشتری']);
  return { id: id, folderUrl: folder ? folder.getUrl() : '' };
}

function createCase(data, actorUserId) {
  const id = nextId('cases', 'CASE-', 3);
  const customer = getEntityById('customers', data['Customer ID']);
  if (!customer) throw new Error('Customer ID معتبر نیست.');
  const customerName = customer['نام / عنوان مشتری'] || '';
  const folder = createCaseFolder(customer, id, data['نوع عملیات']);
  const row = Object.assign({}, data, {
    'Case ID': id,
    'مشتری': customerName,
    'تسک باز': 0,
    'آخرین فعالیت': nowFa(),
    'نیازمند توجه مدیر': 'خیر',
    'ایجادکننده': actorUserId,
    'تاریخ ایجاد': nowFa(),
    'Sync Version': 'V4',
    'Sync Source': 'Telegram',
    'Sync Updated At': nowFa()
  });
  appendObject(SHEETS.cases, row);
  if (folder) appendObject(SHEETS.caseDocs, { 'شناسه پرونده': id, 'شرکت / صاحب کالا': customerName, 'نوع سند': 'پوشه پرونده', 'نام فایل / سند': 'پوشه پرونده', 'لینک فایل': folder.getUrl(), 'تاریخ دریافت': nowFa(), 'ثبت‌کننده': actorUserId, 'توضیحات': 'ساخت خودکار توسط ربات' });
  logSystem('case_create', id + ' | ' + customerName);
  return { id: id, folderUrl: folder ? folder.getUrl() : '' };
}

function createTask(data, actorUserId) {
  const id = nextId('tasks', 'TSK-', 4);
  const relatedLabel = resolveRelatedLabel(data['نوع ارتباط'], data['شناسه مرتبط']);
  const row = Object.assign({}, data, {
    'Task ID': id,
    'شرکت/پرونده': relatedLabel,
    'ایجادکننده': actorUserId,
    'آخرین فعالیت': nowFa(),
    'تعداد پیام': 0,
    'تاریخ ایجاد': nowFa()
  });
  appendObject(SHEETS.tasks, row);
  logSystem('task_create', id + ' | ' + data['موضوع']);
  return { id: id };
}

function createUser(data, actorUserId) {
  const role = normalizeRole(data['نقش']);
  const idPrefix = role === 'مدیر' ? 'USR-ADMIN-' : role === 'مدیر مشتری' ? 'USR-CM-' : role === 'کارمند مشتری' ? 'USR-CE-' : 'USR-INTERNAL-';
  const id = nextIdRaw(SHEETS.usersRaw, 'User ID', idPrefix, 3);

  if ((role === 'مدیر مشتری' || role === 'کارمند مشتری') && !data['Customer ID']) throw new Error('برای نقش مشتری، Customer ID الزامی است.');
  if (data['Customer ID']) {
    const customer = getEntityById('customers', data['Customer ID']);
    if (!customer) throw new Error('Customer ID معتبر نیست.');
    if (!data['شرکت']) data['شرکت'] = customer['نام / عنوان مشتری'] || '';
  }

  const base = {
    'User ID': id,
    'نام کامل': data['نام کامل'],
    'موبایل': data['موبایل'] || '',
    'Gmail / Email': data['Gmail / Email'] || '',
    'Telegram User ID': data['Telegram User ID'],
    'نقش': role,
    'Customer ID': data['Customer ID'] || '',
    'شرکت': data['شرکت'] || '',
    'پروفایل دسترسی': data['پروفایل دسترسی'] || defaultProfile(role),
    'وضعیت': data['وضعیت'] || 'فعال',
    'ایجادکننده': actorUserId,
    'تاریخ ایجاد': nowFa(),
    'آخرین بروزرسانی': nowFa(),
    'آخرین فعالیت': nowFa(),
    'یادداشت': data['یادداشت'] || ''
  };

  appendObject(SHEETS.usersRaw, base);
  appendObject(SHEETS.users, Object.assign({}, base, { 'Provisioning': 'در صف' }));
  upsertPermissionForUser(base);
  if (role === 'کارمند داخلی') upsertLegacyEmployeeV4(base);

  let workspace = null;
  try { workspace = provisionWorkspace(base); } catch (err) { logSystem('provision_error', id + ' | ' + String(err)); }
  if (workspace) {
    updateRowById(SHEETS.usersRaw, id, { 'Workspace URL': workspace.url, 'Google Access': workspace.shared ? 'فعال' : 'ایجاد شد', 'Telegram Linked': 'بله', 'آخرین بروزرسانی': nowFa() });
    updateRowById(SHEETS.users, id, { 'Workspace': workspace.url, 'Google Access': workspace.shared ? 'فعال' : 'ایجاد شد', 'Telegram Linked': 'بله', 'Provisioning': 'انجام شد', 'آخرین فعالیت': nowFa() });
    appendWorkspaceMapping(base, workspace);
    if (role === 'مدیر مشتری') linkCustomerManager(base, workspace);
  } else {
    updateRowById(SHEETS.users, id, { 'Provisioning': 'نیازمند بررسی' });
  }
  logSystem('user_create', id + ' | ' + role);
  return { id: id, workspaceUrl: workspace ? workspace.url : '' };
}

function normalizeRole(role) {
  if (role === 'کارمند') return 'کارمند داخلی';
  return role;
}

function defaultProfile(role) {
  if (role === 'مدیر') return 'پیشرفته';
  if (role === 'مدیر مشتری') return 'مدیریتی';
  if (role === 'کارمند مشتری') return 'محدود';
  return 'عملیاتی';
}

function provisionWorkspace(user) {
  const role = normalizeRole(user['نقش']);
  const templateId = DASHBOARD_TEMPLATES[role];
  if (!templateId) return null;
  const folder = DriveApp.getFolderById(CRM_FOLDER_ID);
  const template = DriveApp.getFileById(templateId);
  const name = 'Workspace | ' + role + ' | ' + user['نام کامل'] + ' | ' + user['User ID'];
  const copy = template.makeCopy(name, folder);
  let shared = false;
  const email = String(user['Gmail / Email'] || '').trim();
  if (email && email.indexOf('@') > 0) {
    try { copy.addEditor(email); shared = true; } catch (_) {}
  }
  return { fileId: copy.getId(), url: copy.getUrl(), shared: shared, type: role };
}

function appendWorkspaceMapping(user, workspace) {
  appendObject(SHEETS.mapping, {
    'Mapping ID': 'MAP-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    'User ID': user['User ID'],
    'نام کاربر': user['نام کامل'],
    'نقش': user['نقش'],
    'Customer ID': user['Customer ID'] || '',
    'نوع Workspace': workspace.type,
    'Spreadsheet ID': workspace.fileId,
    'Workspace URL': workspace.url,
    'Gmail مشترک‌شده': user['Gmail / Email'] || '',
    'وضعیت Provisioning': 'انجام شد',
    'آخرین Sync': nowFa(),
    'یادداشت': 'ساخت خودکار V4'
  });
}

function linkCustomerManager(user, workspace) {
  const customerId = user['Customer ID'];
  if (!customerId) return;
  updateRowById(SHEETS.customers, customerId, {
    'مدیر اصلی': user['نام کامل'],
    'موبایل مدیر': user['موبایل'] || '',
    'Gmail مدیر': user['Gmail / Email'] || '',
    'Telegram ID مدیر': user['Telegram User ID'] || '',
    'User ID مدیر': user['User ID'],
    'Workspace مدیر': workspace.url,
    'وضعیت دسترسی مدیر': 'فعال'
  });
}

function upsertPermissionForUser(user) {
  const role = normalizeRole(user['نقش']);
  const isAdminRole = role === 'مدیر';
  const isCustomerManager = role === 'مدیر مشتری';
  const active = user['وضعیت'] !== 'غیرفعال';

  const row = {
    'Permission ID': 'PERM-' + user['User ID'],
    'User ID': user['User ID'],
    'Role': role,
    'Scope Type': isAdminRole ? 'ALL' : (isCustomerManager || role === 'کارمند مشتری' ? 'CUSTOMER' : 'ASSIGNED'),
    'Scope ID': isCustomerManager || role === 'کارمند مشتری' ? (user['Customer ID'] || '') : (isAdminRole ? '*' : 'OWN_ASSIGNMENTS'),
    'Permission Profile': user['پروفایل دسترسی'] || defaultProfile(role),
    'مشاهده': active,
    'ایجاد': active && (isAdminRole || role === 'کارمند داخلی' || isCustomerManager),
    'ویرایش': active && (isAdminRole || role === 'کارمند داخلی' || isCustomerManager),
    'تخصیص/واگذاری': active && (isAdminRole || isCustomerManager),
    'تأیید اسناد': active && isAdminRole,
    'مالی': active && (isAdminRole || isCustomerManager),
    'وضعیت': active ? 'فعال' : 'غیرفعال',
    'یادداشت': 'همگام‌سازی خودکار ' + APP_VERSION
  };

  upsertObject(SHEETS.permissions, 'Permission ID', row['Permission ID'], row);
}

function upsertLegacyEmployeeV4(user) {
  upsertObject(SHEETS.legacyEmployees, 'شناسه', user['User ID'], {
    'شناسه': user['User ID'],
    'نام کارمند': user['نام کامل'],
    'Telegram User ID': user['Telegram User ID'],
    'نقش': 'کارمند',
    'فعال؟': user['وضعیت'] !== 'غیرفعال',
    'Telegram Username': '',
    'تاریخ ثبت': nowFa(),
    'آخرین بروزرسانی': nowFa()
  });
}

function createCustomerFolder(customerId, customerName) {
  const root = DriveApp.getFolderById(CRM_DOCUMENTS_ROOT_FOLDER_ID);
  const name = customerId + ' | ' + safeDriveName(customerName);
  const folder = ensureSubfolder(root, name);
  ensureSubfolder(folder, '00-اسناد پایه');
  ensureSubfolder(folder, 'پرونده‌ها');
  return folder;
}

function createCaseFolder(customer, caseId, operationType) {
  const url = String(customer['📁 پوشه اسناد'] || '');
  let customerFolder = null;
  const m = url.match(/folders\/([A-Za-z0-9_-]+)/);
  if (m) {
    try { customerFolder = DriveApp.getFolderById(m[1]); } catch (_) {}
  }
  if (!customerFolder) customerFolder = createCustomerFolder(customer['مشتری ID'], customer['نام / عنوان مشتری']);
  const casesFolder = ensureSubfolder(customerFolder, 'پرونده‌ها');
  const opFolder = ensureSubfolder(casesFolder, safeDriveName(operationType || 'سایر'));
  const caseFolder = ensureSubfolder(opFolder, caseId);
  ['01-اسناد تجاری', '02-حمل و قبض انبار', '03-مجوزها و بازرسی', '04-گمرک و ترخیص', '05-مالی و تسویه', '99-سایر'].forEach(function(n) { ensureSubfolder(caseFolder, n); });
  return caseFolder;
}

function ensureSubfolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function safeDriveName(s) {
  return String(s || '').replace(/[\\/:*?"<>|]/g, '-').trim() || 'بدون نام';
}

function resolveRelatedLabel(type, id) {
  if (!id) return '';
  if (type === 'مشتری') {
    const c = getEntityById('customers', id);
    return c ? c['نام / عنوان مشتری'] : id;
  }
  if (type === 'پرونده') {
    const c = getEntityById('cases', id);
    return c ? (c['Case ID'] + ' | ' + (c['مشتری'] || '')) : id;
  }
  return id;
}

function showEntityList(chatId, messageId, entity) {
  const rows = getEntityRows(entity).slice(-20).reverse();
  const title = { customers: '🏢 آخرین مشتریان', cases: '📁 آخرین پرونده‌ها', tasks: '✅ آخرین تسک‌ها', users: '👥 آخرین کاربران' }[entity];
  let text = title + '\n\n';
  if (!rows.length) text += 'رکوردی ثبت نشده است.';
  else rows.forEach(function(r, i) { text += formatEntityLine(entity, r, i + 1) + '\n\n'; });
  editMessage(chatId, messageId, truncateTelegram(text), entityBackKeyboard(entity));
}

function formatEntityLine(entity, r, n) {
  if (entity === 'customers') return n + '. 🏢 <b>' + escapeHtml(r['نام / عنوان مشتری'] || '-') + '</b>\n🆔 ' + escapeHtml(r['مشتری ID'] || '-') + ' | 📱 ' + escapeHtml(r['موبایل'] || '-');
  if (entity === 'cases') return n + '. 📁 <b>' + escapeHtml(r['Case ID'] || '-') + '</b>\n🏢 ' + escapeHtml(r['مشتری'] || '-') + ' | 📌 ' + escapeHtml(r['وضعیت'] || '-');
  if (entity === 'tasks') return n + '. ✅ <b>' + escapeHtml(r['موضوع'] || '-') + '</b>\n🆔 ' + escapeHtml(r['Task ID'] || '-') + ' | 🚦 ' + escapeHtml(r['وضعیت'] || '-') + ' | ⚡ ' + escapeHtml(r['اولویت'] || '-');
  return n + '. 👤 <b>' + escapeHtml(r['نام کامل'] || '-') + '</b>\n🆔 ' + escapeHtml(r['User ID'] || '-') + ' | 🔐 ' + escapeHtml(r['نقش'] || '-') + ' | ' + escapeHtml(r['وضعیت'] || '-');
}

function searchEntity(entity, q) {
  const query = normalize(q);
  return getEntityRows(entity).filter(function(r) { return normalize(Object.keys(r).map(function(k) { return r[k]; }).join(' | ')).indexOf(query) >= 0; }).slice(0, 20);
}

function formatSearchResults(entity, rows) {
  let text = '🔎 <b>نتیجه جستجو</b>\n\n';
  if (!rows.length) return text + 'موردی پیدا نشد.';
  rows.forEach(function(r, i) { text += formatEntityLine(entity, r, i + 1) + '\n\n'; });
  return truncateTelegram(text);
}

function deactivateEntity(entity, id) {
  if (entity === 'customers') return updateEntityField(entity, id, 'فعال؟', false);
  if (entity === 'cases') return updateEntityField(entity, id, 'وضعیت', 'بایگانی');
  if (entity === 'users') {
    const ok1 = updateEntityField(entity, id, 'وضعیت', 'غیرفعال');
    updateRowById(SHEETS.usersRaw, id, { 'وضعیت': 'غیرفعال', 'آخرین بروزرسانی': nowFa() });
    upsertPermissionForUser(Object.assign({}, getEntityById('users', id) || {}, { 'User ID': id, 'وضعیت': 'غیرفعال' }));
    return ok1;
  }
  return false;
}

function updateEntityField(entity, id, field, value) {
  const cfg = SHEETS[entity];
  if (!cfg) return false;
  const ok = updateRowById(cfg, id, (function(){ const o={}; o[field]=value; if(entity==='cases') o['Sync Updated At']=nowFa(); return o; })());
  if (entity === 'users' && ok) updateRowById(SHEETS.usersRaw, id, (function(){ const o={}; o[field]=value; o['آخرین بروزرسانی']=nowFa(); return o; })());
  return ok;
}

function formatDocs(entity, id) {
  const cfg = entity === 'customers' ? SHEETS.customerDocs : SHEETS.caseDocs;
  const key = entity === 'customers' ? 'مشتری ID' : 'شناسه پرونده';
  const rows = readRows(cfg).filter(function(r) { return String(r[key] || '') === String(id); });
  let text = '📎 <b>اسناد مرتبط</b>\n\n';
  if (!rows.length) return text + 'سندی ثبت نشده است.';
  rows.slice(-20).reverse().forEach(function(r, i) {
    const name = r['نام فایل / سند'] || r['نوع سند'] || 'سند';
    const link = r['لینک فایل'] || '';
    text += (i + 1) + '. 📄 ' + escapeHtml(name) + (link ? '\n🔗 ' + escapeHtml(link) : '') + '\n\n';
  });
  return truncateTelegram(text);
}

function formatWorkspace(userId) {
  const rows = readRows(SHEETS.mapping).filter(function(r) { return String(r['User ID'] || '') === String(userId); });
  if (!rows.length) return '🔗 <b>Workspace</b>\n\nبرای این User ID موردی ثبت نشده است.';
  const r = rows[rows.length - 1];
  return '🔗 <b>Workspace کاربر</b>\n\n👤 ' + escapeHtml(r['نام کاربر'] || '-') + '\n🔐 ' + escapeHtml(r['نقش'] || '-') + '\n📌 ' + escapeHtml(r['وضعیت Provisioning'] || '-') + '\n🌐 ' + escapeHtml(r['Workspace URL'] || '-');
}

function showDashboardSummary(chatId, messageId) {
  const s = getFastDashboardStats();
  const text =
    '📈 <b>خلاصه وضعیت CRM</b>\n\n' +
    '🏢 مشتریان فعال: <b>' + s.customers + '</b>\n\n' +
    '📁 پرونده‌های باز: <b>' + s.cases + '</b>\n\n' +
    '✅ تسک‌های باز: <b>' + s.tasks + '</b>\n\n' +
    '👥 کاربران فعال: <b>' + s.users + '</b>\n\n' +
    '⚠️ نیازمند توجه مدیر: <b>' + s.attention + '</b>';
  editMessage(chatId, messageId, text, entityBackKeyboard('dashboard'));
}

function showDailyReport(chatId, messageId) {
  const s = getFastDashboardStats();
  const tasks = readRows(SHEETS.tasks);
  const cases = readRows(SHEETS.cases);
  const highTasks = tasks.filter(function(r) {
    return r['وضعیت'] !== 'انجام شد' && r['وضعیت'] !== 'لغو شده' && r['اولویت'] === 'بالا';
  }).slice(0, 5);
  const attentionCases = cases.filter(function(r) {
    return String(r['نیازمند توجه مدیر'] || '') === 'بله';
  }).slice(0, 5);

  let text =
    '🗓 <b>گزارش روزانه کاراترخیص</b>\n' +
    '━━━━━━━━━━━━━━━━\n\n' +
    '🏢 <b>مشتریان</b>\n' +
    '• فعال: <b>' + s.customers + '</b>\n\n' +
    '📁 <b>پرونده‌ها</b>\n' +
    '• باز: <b>' + s.cases + '</b>\n' +
    '• نیازمند توجه مدیر: <b>' + s.attention + '</b>\n\n' +
    '✅ <b>تسک‌ها</b>\n' +
    '• باز/در حال انجام: <b>' + s.tasks + '</b>\n' +
    '• اولویت بالا: <b>' + highTasks.length + '</b>\n\n' +
    '👥 <b>کاربران</b>\n' +
    '• فعال: <b>' + s.users + '</b>\n\n';

  if (highTasks.length) {
    text += '🚨 <b>تسک‌های مهم</b>\n';
    highTasks.forEach(function(r) { text += '• ' + escapeHtml(r['موضوع'] || '-') + ' — ' + escapeHtml(r['مسئول'] || '-') + '\n'; });
    text += '\n';
  }
  if (attentionCases.length) {
    text += '⚠️ <b>پرونده‌های نیازمند توجه</b>\n';
    attentionCases.forEach(function(r) { text += '• ' + escapeHtml(r['Case ID'] || '-') + ' — ' + escapeHtml(r['مشتری'] || '-') + '\n'; });
    text += '\n';
  }
  text += '━━━━━━━━━━━━━━━━\n🔄 آخرین بروزرسانی: ' + escapeHtml(nowFa());
  editMessage(chatId, messageId, truncateTelegram(text), entityBackKeyboard('dashboard'));
}

function showAlerts(chatId, messageId) {
  const rows = readRows(SHEETS.alerts).slice(-15).reverse();
  let text = '⚠️ <b>مرکز هشدارها</b>\n\n';
  if (!rows.length) text += 'هشدار فعالی ثبت نشده است.';
  else rows.forEach(function(r, i) { text += (i + 1) + '. ' + escapeHtml(Object.keys(r).map(function(k){return r[k];}).filter(Boolean).slice(0,4).join(' | ')) + '\n\n'; });
  editMessage(chatId, messageId, truncateTelegram(text), entityBackKeyboard('dashboard'));
}

function showDashboardLinks(chatId, messageId) {
  const text =
    '🔗 <b>داشبوردهای مجزا</b>\n\n' +
    '👑 <a href="' + LIVE_DASHBOARDS.admin + '">داشبورد مدیر</a>\n\n' +
    '👷 <a href="' + LIVE_DASHBOARDS.employee + '">داشبورد کارمند داخلی</a>\n\n' +
    '🏢 <a href="' + LIVE_DASHBOARDS.customerManager + '">داشبورد مدیر مشتری</a>\n\n' +
    '👤 <a href="' + LIVE_DASHBOARDS.customerEmployee + '">داشبورد کارمند مشتری</a>';
  editMessage(chatId, messageId, text, entityBackKeyboard('dashboard'));
}

function runSyncAudit() {
  const users = readRows(SHEETS.usersRaw);
  let provisioned = 0, pending = 0, errors = 0;
  users.forEach(function(u) {
    if (String(u['وضعیت'] || '') === 'غیرفعال') return;
    if (String(u['Workspace URL'] || '').trim()) { provisioned++; return; }
    pending++;
    try {
      const w = provisionWorkspace(u);
      if (w) {
        updateRowById(SHEETS.usersRaw, u['User ID'], { 'Workspace URL': w.url, 'Google Access': w.shared ? 'فعال' : 'ایجاد شد', 'Telegram Linked': 'بله', 'آخرین بروزرسانی': nowFa() });
        updateRowById(SHEETS.users, u['User ID'], { 'Workspace': w.url, 'Google Access': w.shared ? 'فعال' : 'ایجاد شد', 'Telegram Linked': 'بله', 'Provisioning': 'انجام شد', 'آخرین فعالیت': nowFa() });
        appendWorkspaceMapping(u, w);
        provisioned++;
        pending--;
      }
    } catch (err) { errors++; logSystem('sync_provision_error', u['User ID'] + ' | ' + String(err)); }
  });
  return { users: users.length, provisioned: provisioned, pending: pending, errors: errors };
}

function showSyncResult(chatId, messageId, r) {
  const text = '🔄 <b>همگام‌سازی و لینک‌سازی</b>\n\n👥 کاربران بررسی‌شده: <b>' + r.users + '</b>\n✅ Workspace آماده: <b>' + r.provisioned + '</b>\n⏳ باقی‌مانده: <b>' + r.pending + '</b>\n❌ خطا: <b>' + r.errors + '</b>\n\nاطلاعات مستقیماً در Google Sheet و Workspace Mapping ثبت شد.';
  editMessage(chatId, messageId, text, entityBackKeyboard('dashboard'));
}


function getFastDashboardStats() {
  const cache = CacheService.getScriptCache();
  const key = 'KARATARHIS_FAST_STATS_V48';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }

  let customers = 0, cases = 0, tasks = 0, users = 0, attention = 0;

  // Dashboard already calculates the three operational KPIs.
  // Reading one compact range is much faster than scanning three full tables.
  try {
    const dash = getCRMSpreadsheet().getSheetByName('داشبورد مدیریتی');
    if (dash) {
      const v = dash.getRange('B5:F11').getDisplayValues();
      cases = Number(String(v[1][0] || '0').replace(/,/g,'')) || 0;      // B6
      customers = Number(String(v[1][2] || '0').replace(/,/g,'')) || 0;  // D6
      tasks = Number(String(v[6][4] || '0').replace(/,/g,'')) || 0;      // F11
    }
  } catch (_) {}

  // Users / manager-attention are small tables and cached for 30 seconds.
  try {
    users = readRows(SHEETS.users).filter(function(r){
      return String(r['وضعیت'] || '') !== 'غیرفعال';
    }).length;
  } catch (_) {}

  try {
    const alertSheet = getCRMSpreadsheet().getSheetByName('مرکز هشدارها');
    if (alertSheet) {
      const v = alertSheet.getRange('A2:F2').getDisplayValues()[0];
      attention = Number(String(v[5] || '0').replace(/,/g,'')) || 0;
    }
  } catch (_) {}

  const result = { customers: customers, cases: cases, tasks: tasks, users: users, attention: attention };
  try { cache.put(key, JSON.stringify(result), 30); } catch (_) {}
  return result;
}

function warmMenuCache() {
  CacheService.getScriptCache().remove('KARATARHIS_FAST_STATS_V48');
  return getFastDashboardStats();
}

function countActiveCustomers() { return readRows(SHEETS.customers).filter(function(r){ return isTruthy(r['فعال؟']); }).length; }
function countOpenCases() { return readRows(SHEETS.cases).filter(function(r){ return ['تکمیل شده','بایگانی'].indexOf(String(r['وضعیت']||'')) < 0; }).length; }
function countOpenTasks() { return readRows(SHEETS.tasks).filter(function(r){ return ['انجام شد','لغو شده'].indexOf(String(r['وضعیت']||'')) < 0; }).length; }
function countActiveUsers() { return readRows(SHEETS.users).filter(function(r){ return String(r['وضعیت']||'') !== 'غیرفعال'; }).length; }
function countManagerAttention() { return readRows(SHEETS.cases).filter(function(r){ return String(r['نیازمند توجه مدیر']||'') === 'بله'; }).length; }

function getEntityRows(entity) { return readRows(SHEETS[entity]); }
function getEntityById(entity, id) { return getRowById(SHEETS[entity], id); }

function getSheet(cfg) {
  const key = String(cfg.name);
  if (__SHEET_CACHE[key]) return __SHEET_CACHE[key];
  const sh = getCRMSpreadsheet().getSheetByName(cfg.name);
  if (!sh) throw new Error('شیت «' + cfg.name + '» پیدا نشد.');
  __SHEET_CACHE[key] = sh;
  return sh;
}

function getHeaders(cfg) {
  const localKey = String(cfg.name) + '|' + String(cfg.headerRow);
  if (__HEADER_CACHE[localKey]) return __HEADER_CACHE[localKey].slice();

  const cache = CacheService.getScriptCache();
  const cacheKey = 'KARATARHIS_HDR_' + localKey;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      const headers = JSON.parse(cached);
      __HEADER_CACHE[localKey] = headers;
      return headers.slice();
    } catch (_) {}
  }

  const sh = getSheet(cfg);
  const lastCol = Math.max(1, sh.getLastColumn());
  const headers = sh.getRange(cfg.headerRow, 1, 1, lastCol)
    .getDisplayValues()[0]
    .map(function(v){return String(v).trim();});

  __HEADER_CACHE[localKey] = headers;
  try { cache.put(cacheKey, JSON.stringify(headers), 600); } catch (_) {}
  return headers.slice();
}

function readRows(cfg) {
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const start = cfg.headerRow + 1;
  if (sh.getLastRow() < start) return [];
  const values = sh.getRange(start, 1, sh.getLastRow() - cfg.headerRow, headers.length).getValues();
  return values.filter(function(row){return row.some(function(v){return String(v).trim() !== '';});}).map(function(row){
    const o = {}; headers.forEach(function(h,i){ if(h) o[h]=row[i]; }); return o;
  });
}

function appendObject(cfg, obj) {
  const sh = getSheet(cfg), headers = getHeaders(cfg);
  const row = headers.map(function(h){ return Object.prototype.hasOwnProperty.call(obj,h) ? obj[h] : ''; });
  sh.appendRow(row);
}

function upsertObject(cfg, keyHeader, keyValue, obj) {
  const sh = getSheet(cfg), headers = getHeaders(cfg);
  const rowNum = findRowNumber(cfg, keyHeader, keyValue);
  if (!rowNum) { appendObject(cfg, obj); return true; }

  const row = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  Object.keys(obj).forEach(function(k) {
    const idx = headers.indexOf(k);
    if (idx >= 0) row[idx] = obj[k];
  });
  sh.getRange(rowNum, 1, 1, headers.length).setValues([row]);
  return true;
}

function findRowNumber(cfg, header, value) {
  const sh = getSheet(cfg), headers = getHeaders(cfg), col = headers.indexOf(header);
  if (col < 0) return null;
  const start = cfg.headerRow + 1;
  if (sh.getLastRow() < start) return null;
  const vals = sh.getRange(start, col+1, sh.getLastRow()-cfg.headerRow, 1).getDisplayValues();
  for (let i=0;i<vals.length;i++) if (String(vals[i][0]).trim() === String(value).trim()) return start+i;
  return null;
}

function getRowById(cfg, id) {
  if (!cfg || !cfg.idHeader) return null;
  const sh = getSheet(cfg), headers = getHeaders(cfg), rowNum = findRowNumber(cfg, cfg.idHeader, id);
  if (!rowNum) return null;
  const vals = sh.getRange(rowNum,1,1,headers.length).getValues()[0];
  const o={}; headers.forEach(function(h,i){if(h)o[h]=vals[i];}); return o;
}

function updateRowById(cfg, id, patch) {
  if (!cfg || !cfg.idHeader) return false;
  const sh = getSheet(cfg), headers = getHeaders(cfg), rowNum = findRowNumber(cfg, cfg.idHeader, id);
  if (!rowNum) return false;

  const row = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  Object.keys(patch).forEach(function(k) {
    const idx = headers.indexOf(k);
    if (idx >= 0) row[idx] = patch[k];
  });
  sh.getRange(rowNum, 1, 1, headers.length).setValues([row]);
  return true;
}

function nextId(entity, prefix, width) {
  const cfg = SHEETS[entity];
  return nextIdRaw(cfg, cfg.idHeader, prefix, width);
}

function nextIdRaw(cfg, header, prefix, width) {
  let max=0;
  readRows(cfg).forEach(function(r){const m=String(r[header]||'').match(new RegExp('^'+prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\d+)$')); if(m) max=Math.max(max,Number(m[1]));});
  return prefix + String(max+1).padStart(width,'0');
}

function setState(userId, state) {
  const key = 'TG_STATE_' + userId;
  const raw = JSON.stringify(state);
  CacheService.getScriptCache().put(key, raw, 21600);
  PropertiesService.getScriptProperties().setProperty(key, raw);
}
function getState(userId) {
  const key = 'TG_STATE_' + userId;
  let s = CacheService.getScriptCache().get(key);
  if (!s) s = PropertiesService.getScriptProperties().getProperty(key);
  if (!s) return null;
  try {
    const state = JSON.parse(s);
    try { CacheService.getScriptCache().put(key, s, 21600); } catch (_) {}
    return state;
  } catch (_) { return null; }
}
function clearState(userId) {
  const key = 'TG_STATE_' + userId;
  CacheService.getScriptCache().remove(key);
  PropertiesService.getScriptProperties().deleteProperty(key);
}

function isTruthy(v) { if(v===true || v===1)return true; return ['true','1','بله','فعال','active'].indexOf(normalize(v))>=0; }
function normalize(v) { return String(v==null?'':v).trim().toLowerCase(); }
function escapeHtml(v) { return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function truncateTelegram(s) { s=String(s); return s.length>3900?s.slice(0,3880)+'\n…':s; }
function nowFa() { return Utilities.formatDate(new Date(), 'Asia/Tehran', 'yyyy-MM-dd HH:mm:ss'); }
function jsonResponse(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function logSystem(type, details) {
  try {
    appendObject(SHEETS.systemLog, {
      'Timestamp': nowFa(),
      'Module': 'Telegram Bot',
      'Action': type,
      'Record ID': '',
      'Result': String(type).indexOf('error') >= 0 ? 'ERROR' : 'OK',
      'Error': String(type).indexOf('error') >= 0 ? String(details || '') : '',
      'Source': APP_VERSION,
      'Details': String(details || '')
    });
  } catch (_) {}
}

function validateSheetSchemas() {
  const requirements = {
    customers: ['مشتری ID','نوع مشتری','نام / عنوان مشتری','موبایل','فعال؟','📁 پوشه اسناد'],
    cases: ['Case ID','Customer ID','مشتری','نوع عملیات','گمرک','وضعیت'],
    tasks: ['Task ID','نوع ارتباط','موضوع','مسئول','اولویت','وضعیت'],
    users: ['User ID','نام کامل','Telegram User ID','نقش','پروفایل دسترسی','وضعیت','Provisioning'],
    usersRaw: ['User ID','نام کامل','Telegram User ID','نقش','پروفایل دسترسی','وضعیت','Workspace URL'],
    permissions: ['Permission ID','User ID','Role','Scope Type','Scope ID','Permission Profile','مشاهده','ایجاد','ویرایش','تخصیص/واگذاری','تأیید اسناد','مالی','وضعیت'],
    mapping: ['Mapping ID','User ID','نقش','Spreadsheet ID','Workspace URL','وضعیت Provisioning'],
    customerDocs: ['مشتری ID','نوع سند','نام فایل / سند','لینک فایل'],
    caseDocs: ['شناسه پرونده','نوع سند','نام فایل / سند','لینک فایل'],
    alerts: ['نوع هشدار','شناسه','شرکت','مسئول','شرح / اقدام','موعد','وضعیت']
  };

  const result = {};
  let totalMissing = 0;

  Object.keys(requirements).forEach(function(key) {
    const headers = getHeaders(SHEETS[key]);
    const missing = requirements[key].filter(function(h) { return headers.indexOf(h) < 0; });
    totalMissing += missing.length;
    result[key] = { ok: missing.length === 0, missing: missing, headers: headers };
  });

  const report = { version: APP_VERSION, ok: totalMissing === 0, totalMissing: totalMissing, sheets: result };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function runFullButtonAndSchemaAudit() {
  const buttons = testButtonRoutes();
  const schemas = validateSheetSchemas();
  const report = {
    version: APP_VERSION,
    buttons: buttons,
    schemas: schemas,
    webhook: getTelegramWebhookInfo()
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}


function auditCRMDataIntegrity() {
  const report = {
    version: APP_VERSION,
    customersMissingId: [],
    casesMissingId: [],
    usersUiMissingId: [],
    usersRawMissingId: [],
    orphanCustomerCases: [],
    usersOnlyInUi: [],
    usersOnlyInRaw: []
  };

  const customers = readRows(SHEETS.customers);
  const cases = readRows(SHEETS.cases);
  const uiUsers = readRows(SHEETS.users);
  const rawUsers = readRows(SHEETS.usersRaw);

  customers.forEach(function(r, i) {
    if (!String(r['مشتری ID'] || '').trim() && Object.keys(r).some(function(k){ return String(r[k] || '').trim(); })) {
      report.customersMissingId.push({ rowOffset: i + 1, name: r['نام / عنوان مشتری'] || '' });
    }
  });

  const customerIds = {};
  customers.forEach(function(r) {
    const id = String(r['مشتری ID'] || '').trim();
    if (id) customerIds[id] = true;
  });

  cases.forEach(function(r, i) {
    const caseId = String(r['Case ID'] || '').trim();
    const customerId = String(r['Customer ID'] || '').trim();
    if (!caseId && Object.keys(r).some(function(k){ return String(r[k] || '').trim(); })) {
      report.casesMissingId.push({ rowOffset: i + 1, customerId: customerId, customer: r['مشتری'] || '' });
    }
    if (customerId && !customerIds[customerId]) {
      report.orphanCustomerCases.push({ caseId: caseId, customerId: customerId });
    }
  });

  const uiIds = {};
  const rawIds = {};
  uiUsers.forEach(function(r, i) {
    const id = String(r['User ID'] || '').trim();
    if (!id && Object.keys(r).some(function(k){ return String(r[k] || '').trim(); })) {
      report.usersUiMissingId.push({ rowOffset: i + 1, name: r['نام کامل'] || '', telegramId: r['Telegram User ID'] || '' });
    }
    if (id) uiIds[id] = true;
  });
  rawUsers.forEach(function(r, i) {
    const id = String(r['User ID'] || '').trim();
    if (!id && Object.keys(r).some(function(k){ return String(r[k] || '').trim(); })) {
      report.usersRawMissingId.push({ rowOffset: i + 1, name: r['نام کامل'] || '' });
    }
    if (id) rawIds[id] = true;
  });

  Object.keys(uiIds).forEach(function(id){ if (!rawIds[id]) report.usersOnlyInUi.push(id); });
  Object.keys(rawIds).forEach(function(id){ if (!uiIds[id]) report.usersOnlyInRaw.push(id); });

  report.ok =
    report.customersMissingId.length === 0 &&
    report.casesMissingId.length === 0 &&
    report.usersUiMissingId.length === 0 &&
    report.usersRawMissingId.length === 0 &&
    report.orphanCustomerCases.length === 0 &&
    report.usersOnlyInUi.length === 0 &&
    report.usersOnlyInRaw.length === 0;

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/*
 * تعمیر محافظه‌کارانه:
 * فقط برای ردیف‌های موجود که شناسه ندارند ID می‌سازد.
 * هیچ نام/شماره/رکوردی حذف یا بازنویسی نمی‌شود.
 * اتصال‌های مبهم (مثل پرونده بدون Customer ID) به صورت خودکار حدس زده نمی‌شوند.
 */
function repairSafeMissingIds() {
  const result = { version: APP_VERSION, customers: 0, cases: 0 };

  // فقط ردیف‌های مشتری و پرونده ID می‌گیرند؛ هیچ رابطه‌ای حدس زده نمی‌شود.
  const customerCfg = SHEETS.customers;
  const customerSh = getSheet(customerCfg);
  const customerHeaders = getHeaders(customerCfg);
  const customerIdCol = customerHeaders.indexOf('مشتری ID') + 1;
  if (customerIdCol > 0 && customerSh.getLastRow() > customerCfg.headerRow) {
    const values = customerSh.getRange(customerCfg.headerRow + 1, 1, customerSh.getLastRow() - customerCfg.headerRow, customerHeaders.length).getValues();
    let nextCustomer = 1;
    readRows(customerCfg).forEach(function(r) {
      const m = String(r['مشتری ID'] || '').match(/^CUS-(\d+)$/);
      if (m) nextCustomer = Math.max(nextCustomer, Number(m[1]) + 1);
    });
    values.forEach(function(row, i) {
      const hasData = row.some(function(v){ return String(v || '').trim() !== ''; });
      if (hasData && !String(row[customerIdCol - 1] || '').trim()) {
        const id = 'CUS-' + String(nextCustomer++).padStart(3, '0');
        customerSh.getRange(customerCfg.headerRow + 1 + i, customerIdCol).setValue(id);
        result.customers++;
      }
    });
  }

  const caseCfg = SHEETS.cases;
  const caseSh = getSheet(caseCfg);
  const caseHeaders = getHeaders(caseCfg);
  const caseIdCol = caseHeaders.indexOf('Case ID') + 1;
  if (caseIdCol > 0 && caseSh.getLastRow() > caseCfg.headerRow) {
    const values = caseSh.getRange(caseCfg.headerRow + 1, 1, caseSh.getLastRow() - caseCfg.headerRow, caseHeaders.length).getValues();
    let nextCase = 1;
    readRows(caseCfg).forEach(function(r) {
      const m = String(r['Case ID'] || '').match(/^CASE-(\d+)$/);
      if (m) nextCase = Math.max(nextCase, Number(m[1]) + 1);
    });
    values.forEach(function(row, i) {
      const hasData = row.some(function(v){ return String(v || '').trim() !== ''; });
      if (hasData && !String(row[caseIdCol - 1] || '').trim()) {
        const id = 'CASE-' + String(nextCase++).padStart(3, '0');
        caseSh.getRange(caseCfg.headerRow + 1 + i, caseIdCol).setValue(id);
        result.cases++;
      }
    });
  }

  SpreadsheetApp.flush();
  result.after = auditCRMDataIntegrity();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/*
 * همگام‌سازی محافظه‌کارانه مدیریت کاربران -> Users/Permissions.
 * فقط ردیف‌هایی که Telegram User ID دارند پردازش می‌شوند.
 * اگر User ID خالی باشد یک ID یکتا ساخته می‌شود.
 */
function repairUserMirrors() {
  const uiRows = readRows(SHEETS.users);
  const result = { version: APP_VERSION, processed: 0, mirrored: 0, skipped: 0 };

  const counters = { admin: 1, internal: 1, cm: 1, ce: 1 };
  readRows(SHEETS.usersRaw).forEach(function(r) {
    const id = String(r['User ID'] || '');
    let m;
    if ((m=id.match(/^USR-ADMIN-(\d+)$/))) counters.admin=Math.max(counters.admin,Number(m[1])+1);
    if ((m=id.match(/^USR-INTERNAL-(\d+)$/))) counters.internal=Math.max(counters.internal,Number(m[1])+1);
    if ((m=id.match(/^USR-CM-(\d+)$/))) counters.cm=Math.max(counters.cm,Number(m[1])+1);
    if ((m=id.match(/^USR-CE-(\d+)$/))) counters.ce=Math.max(counters.ce,Number(m[1])+1);
  });

  const uiCfg = SHEETS.users;
  const uiSh = getSheet(uiCfg);
  const uiHeaders = getHeaders(uiCfg);

  uiRows.forEach(function(r, i) {
    result.processed++;
    const telegramId = String(r['Telegram User ID'] || '').trim();
    if (!telegramId) { result.skipped++; return; }

    const role = normalizeRole(r['نقش'] || 'کارمند داخلی');
    let userId = String(r['User ID'] || '').trim();
    if (!userId) {
      if (role === 'مدیر') userId = 'USR-ADMIN-' + String(counters.admin++).padStart(3,'0');
      else if (role === 'مدیر مشتری') userId = 'USR-CM-' + String(counters.cm++).padStart(3,'0');
      else if (role === 'کارمند مشتری') userId = 'USR-CE-' + String(counters.ce++).padStart(3,'0');
      else userId = 'USR-INTERNAL-' + String(counters.internal++).padStart(3,'0');

      const rowNum = uiCfg.headerRow + 1 + i;
      const idCol = uiHeaders.indexOf('User ID');
      if (idCol >= 0) uiSh.getRange(rowNum, idCol + 1).setValue(userId);
    }

    const base = {
      'User ID': userId,
      'نام کامل': r['نام کامل'] || '',
      'موبایل': r['موبایل'] || '',
      'Gmail / Email': r['Gmail / Email'] || '',
      'Telegram User ID': telegramId,
      'نقش': role,
      'Customer ID': r['Customer ID'] || '',
      'شرکت': r['شرکت'] || '',
      'پروفایل دسترسی': r['پروفایل دسترسی'] || defaultProfile(role),
      'وضعیت': r['وضعیت'] || 'فعال',
      'ایجادکننده': r['ایجادکننده'] || ADMIN_TELEGRAM_ID,
      'تاریخ ایجاد': r['تاریخ ایجاد'] || nowFa(),
      'آخرین بروزرسانی': nowFa(),
      'آخرین فعالیت': r['آخرین فعالیت'] || nowFa(),
      'یادداشت': r['یادداشت'] || ''
    };

    upsertObject(SHEETS.usersRaw, 'User ID', userId, base);
    upsertObject(SHEETS.users, 'User ID', userId, Object.assign({}, base, {
      'Provisioning': r['Provisioning'] || 'نیازمند بررسی'
    }));
    upsertPermissionForUser(base);
    if (role === 'کارمند داخلی') upsertLegacyEmployeeV4(base);
    result.mirrored++;
  });

  SpreadsheetApp.flush();
  result.after = auditCRMDataIntegrity();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


function testPanelRoundTrip() {
  const chatId = ADMIN_TELEGRAM_ID;
  const oldId = getPanelMessageId(chatId);
  const first = sendMessage(chatId, '🧪 <b>تست پنل V4.7</b>\\n\\nمرحله ۱', {
    inline_keyboard: [[{ text: '✅ تست', callback_data: 'main' }]]
  });

  if (!first || !first.ok || !first.result) {
    const failed = { ok: false, stage: 'send', error: telegramErrorDescription(first) };
    Logger.log(JSON.stringify(failed, null, 2));
    return failed;
  }

  const messageId = first.result.message_id;
  const edited = telegramApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: '🧪 <b>تست پنل V4.7</b>\\n\\nمرحله ۲ — Edit موفق',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: '🏠 منوی اصلی', callback_data: 'main' }]] }
  });

  const result = {
    ok: !!(edited && edited.ok),
    sentMessageId: messageId,
    editResult: edited,
    webhook: getTelegramWebhookInfo(),
    sheetSchema: validateSheetSchemas(),
    integrity: auditCRMDataIntegrity()
  };

  if (result.ok) {
    if (oldId && Number(oldId) !== Number(messageId)) safeDeleteMessage(chatId, oldId);
    setPanelMessageId(chatId, messageId);
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runV47PreflightAudit() {
  const result = {
    version: APP_VERSION,
    webhook: getTelegramWebhookInfo(),
    schemas: validateSheetSchemas(),
    integrity: auditCRMDataIntegrity(),
    callbackRoutes: testButtonRoutes(),
    lastCallbackTrace: getLastCallbackTrace()
  };
  result.ok =
    !!(result.webhook && result.webhook.ok) &&
    !!(result.schemas && result.schemas.ok) &&
    result.callbackRoutes.failed === 0;
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function resetTelegramWebhook() {
  const expectedUrl = rememberCurrentWebAppUrl();
  const del = telegramApi('deleteWebhook', { drop_pending_updates: true });
  Utilities.sleep(1200);
  const set = telegramApi('setWebhook', { url: expectedUrl, allowed_updates: ['message','callback_query'], drop_pending_updates: true });
  Utilities.sleep(800);
  const info = getTelegramWebhookInfo();
  Logger.log(JSON.stringify({ expectedUrl: expectedUrl, deleted: del, installed: set, info: info }, null, 2));
  return { expectedUrl: expectedUrl, deleted: del, installed: set, info: info };
}

function setTelegramWebhook() {
  const expectedUrl = rememberCurrentWebAppUrl();
  const result = telegramApi('setWebhook', { url: expectedUrl, allowed_updates: ['message','callback_query'], drop_pending_updates: true });
  Logger.log(JSON.stringify({ expectedUrl: expectedUrl, result: result },null,2));
  return result;
}

function getTelegramWebhookInfo() {
  const result = telegramApi('getWebhookInfo', {});
  Logger.log(JSON.stringify(result,null,2));
  return result;
}


/************************************************************
 * V4.11 — DIRECT GOOGLE SHEET USER AUTO-PROVISIONING
 * ثبت کاربر مستقیم در شیت «مدیریت کاربران» نیز همان مسیر ربات را طی می‌کند:
 * User ID -> Users -> Permissions -> Workspace -> Mapping -> Legacy Employee
 * این مسیر با installable onEdit اجرا می‌شود تا DriveApp مجوز لازم داشته باشد.
 ************************************************************/

function installUserSheetEditTrigger() {
  const handler = 'handleUserSheetEdit';
  const removed = [];
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === handler) {
      removed.push(t.getUniqueId());
      ScriptApp.deleteTrigger(t);
    }
  });

  const trigger = ScriptApp.newTrigger(handler)
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();

  const result = {
    ok: true,
    handler: handler,
    triggerId: trigger.getUniqueId(),
    removedDuplicates: removed.length,
    spreadsheetId: SPREADSHEET_ID
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function removeUserSheetEditTrigger() {
  const handler = 'handleUserSheetEdit';
  const removed = [];
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === handler) {
      removed.push(t.getUniqueId());
      ScriptApp.deleteTrigger(t);
    }
  });
  const result = { ok: true, removed: removed };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function handleUserSheetEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (!sheet || sheet.getName() !== SHEETS.users.name) return;

  const firstDataRow = SHEETS.users.headerRow + 1;
  if (range.getLastRow() < firstDataRow) return;

  // فقط ستون‌های جدول کاربر A:R؛ تغییرات خارج از جدول نادیده گرفته می‌شوند.
  if (range.getColumn() > 18 || range.getLastColumn() < 1) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    logSystem('sheet_user_trigger_busy', 'row=' + range.getRow());
    return;
  }

  try {
    const startRow = Math.max(firstDataRow, range.getRow());
    const endRow = range.getLastRow();
    for (let row = startRow; row <= endRow; row++) {
      provisionUserRowFromSheet_(row, 'SHEET_EDIT');
    }
  } catch (err) {
    try { logSystem('sheet_user_trigger_error', String(err && err.stack ? err.stack : err)); } catch (_) {}
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getUserUiRowObject_(rowNumber) {
  const cfg = SHEETS.users;
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  if (rowNumber <= cfg.headerRow || rowNumber > sh.getMaxRows()) return null;
  const values = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const obj = {};
  headers.forEach(function(h, i) { if (h) obj[h] = values[i]; });
  return obj;
}

function patchUserUiRow_(rowNumber, patch) {
  const cfg = SHEETS.users;
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const row = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  Object.keys(patch || {}).forEach(function(k) {
    const idx = headers.indexOf(k);
    if (idx >= 0) row[idx] = patch[k];
  });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function parseDriveFileId_(url) {
  const s = String(url || '');
  let m = s.match(/\/d\/([A-Za-z0-9_-]+)/);
  if (!m) m = s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}

function findExistingWorkspaceForUser_(userId, uiRow) {
  const uiUrl = String((uiRow && uiRow['Workspace']) || '').trim();
  if (uiUrl) {
    return { fileId: parseDriveFileId_(uiUrl), url: uiUrl, type: normalizeRole(uiRow['نقش'] || ''), source: 'UI' };
  }

  const raw = getRowById(SHEETS.usersRaw, userId);
  const rawUrl = raw ? String(raw['Workspace URL'] || '').trim() : '';
  if (rawUrl) {
    return { fileId: parseDriveFileId_(rawUrl), url: rawUrl, type: normalizeRole((raw && raw['نقش']) || (uiRow && uiRow['نقش']) || ''), source: 'Users' };
  }

  const mappings = readRows(SHEETS.mapping).filter(function(r) {
    return String(r['User ID'] || '').trim() === String(userId || '').trim() && String(r['Workspace URL'] || '').trim();
  });
  if (mappings.length) {
    const m = mappings[mappings.length - 1];
    return {
      fileId: String(m['Spreadsheet ID'] || '') || parseDriveFileId_(m['Workspace URL']),
      url: String(m['Workspace URL'] || ''),
      type: normalizeRole(m['نوع Workspace'] || m['نقش'] || (uiRow && uiRow['نقش']) || ''),
      source: 'Workspace Mapping'
    };
  }
  return null;
}

function shareWorkspaceToUser_(workspace, email) {
  const mail = String(email || '').trim();
  if (!workspace || !workspace.url || !mail || mail.indexOf('@') <= 0) return false;
  try {
    const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
    if (!fileId) return false;
    DriveApp.getFileById(fileId).addEditor(mail);
    return true;
  } catch (err) {
    try { logSystem('workspace_share_error', String(err)); } catch (_) {}
    return false;
  }
}

function upsertWorkspaceMappingForUser_(user, workspace) {
  const existingRow = findRowNumber(SHEETS.mapping, 'User ID', user['User ID']);
  let mappingId = '';
  if (existingRow) {
    const sh = getSheet(SHEETS.mapping);
    const headers = getHeaders(SHEETS.mapping);
    const idx = headers.indexOf('Mapping ID');
    if (idx >= 0) mappingId = String(sh.getRange(existingRow, idx + 1).getDisplayValue() || '').trim();
  }
  if (!mappingId) mappingId = 'MAP-' + user['User ID'];

  upsertObject(SHEETS.mapping, 'User ID', user['User ID'], {
    'Mapping ID': mappingId,
    'User ID': user['User ID'],
    'نام کاربر': user['نام کامل'],
    'نقش': user['نقش'],
    'Customer ID': user['Customer ID'] || '',
    'نوع Workspace': workspace.type || user['نقش'],
    'Spreadsheet ID': workspace.fileId || parseDriveFileId_(workspace.url),
    'Workspace URL': workspace.url,
    'Gmail مشترک‌شده': user['Gmail / Email'] || '',
    'وضعیت Provisioning': 'انجام شد',
    'آخرین Sync': nowFa(),
    'یادداشت': 'ساخت/همگام‌سازی مستقیم Google Sheet | ' + APP_VERSION
  });
}

function buildUserFromUiRow_(row, rowNumber) {
  const name = String(row['نام کامل'] || '').trim();
  const telegramId = String(row['Telegram User ID'] || '').trim();
  const role = normalizeRole(String(row['نقش'] || '').trim());

  if (!name && !telegramId && !role) return { ready: false, empty: true };
  if (!name || !telegramId || !role) {
    return { ready: false, reason: 'نام کامل، Telegram User ID و نقش باید تکمیل شوند.' };
  }

  if ((role === 'مدیر مشتری' || role === 'کارمند مشتری') && !String(row['Customer ID'] || '').trim()) {
    return { ready: false, reason: 'برای نقش مشتری، Customer ID الزامی است.' };
  }

  let userId = String(row['User ID'] || '').trim();
  if (!userId) {
    const prefix = role === 'مدیر' ? 'USR-ADMIN-' : role === 'مدیر مشتری' ? 'USR-CM-' : role === 'کارمند مشتری' ? 'USR-CE-' : 'USR-INTERNAL-';
    userId = nextIdRaw(SHEETS.usersRaw, 'User ID', prefix, 3);
    patchUserUiRow_(rowNumber, { 'User ID': userId });
  }

  let company = String(row['شرکت'] || '').trim();
  const customerId = String(row['Customer ID'] || '').trim();
  if (customerId) {
    const customer = getEntityById('customers', customerId);
    if (!customer) return { ready: false, reason: 'Customer ID معتبر نیست.' };
    if (!company) company = String(customer['نام / عنوان مشتری'] || '').trim();
  }

  const base = {
    'User ID': userId,
    'نام کامل': name,
    'موبایل': String(row['موبایل'] || '').trim(),
    'Gmail / Email': String(row['Gmail / Email'] || '').trim(),
    'Telegram User ID': telegramId,
    'نقش': role,
    'Customer ID': customerId,
    'شرکت': company,
    'پروفایل دسترسی': String(row['پروفایل دسترسی'] || '').trim() || defaultProfile(role),
    'وضعیت': String(row['وضعیت'] || '').trim() || 'فعال',
    'ایجادکننده': String(row['ایجادکننده'] || '').trim() || ADMIN_TELEGRAM_ID,
    'تاریخ ایجاد': String(row['تاریخ ایجاد'] || '').trim() || nowFa(),
    'آخرین بروزرسانی': nowFa(),
    'آخرین فعالیت': nowFa(),
    'یادداشت': String(row['یادداشت'] || '').trim()
  };
  return { ready: true, user: base };
}

function provisionUserRowFromSheet_(rowNumber, source) {
  const row = getUserUiRowObject_(rowNumber);
  if (!row) return { ok: false, row: rowNumber, skipped: true, reason: 'row_not_found' };

  const built = buildUserFromUiRow_(row, rowNumber);
  if (!built.ready) {
    if (!built.empty) {
      patchUserUiRow_(rowNumber, { 'Provisioning': 'منتظر تکمیل اطلاعات' });
    }
    return { ok: false, row: rowNumber, skipped: true, reason: built.reason || 'empty' };
  }

  const user = built.user;
  const userId = user['User ID'];

  patchUserUiRow_(rowNumber, {
    'User ID': userId,
    'شرکت': user['شرکت'],
    'پروفایل دسترسی': user['پروفایل دسترسی'],
    'وضعیت': user['وضعیت'],
    'Provisioning': 'در حال ساخت',
    'آخرین فعالیت': nowFa(),
    'ایجادکننده': user['ایجادکننده'],
    'تاریخ ایجاد': user['تاریخ ایجاد']
  });

  upsertObject(SHEETS.usersRaw, 'User ID', userId, user);
  upsertPermissionForUser(user);
  if (user['نقش'] === 'کارمند داخلی') upsertLegacyEmployeeV4(user);

  let workspace = findExistingWorkspaceForUser_(userId, row);
  if (workspace && workspace.type && normalizeRole(workspace.type) !== normalizeRole(user['نقش'])) {
    workspace = null;
  }

  try {
    if (!workspace) workspace = provisionWorkspace(user);
    if (!workspace || !workspace.url) throw new Error('Template Workspace برای این نقش پیدا نشد.');

    const shared = shareWorkspaceToUser_(workspace, user['Gmail / Email']);
    workspace.shared = shared;
    workspace.type = normalizeRole(user['نقش']);

    const access = shared ? 'فعال' : 'ایجاد شد';
    const patch = {
      'Workspace': workspace.url,
      'Google Access': access,
      'Telegram Linked': 'بله',
      'Provisioning': 'انجام شد',
      'آخرین فعالیت': nowFa()
    };
    patchUserUiRow_(rowNumber, patch);

    upsertObject(SHEETS.usersRaw, 'User ID', userId, Object.assign({}, user, {
      'Workspace URL': workspace.url,
      'Google Access': access,
      'Telegram Linked': 'بله',
      'آخرین بروزرسانی': nowFa(),
      'آخرین فعالیت': nowFa()
    }));

    upsertWorkspaceMappingForUser_(user, workspace);
    if (user['نقش'] === 'مدیر مشتری') linkCustomerManager(user, workspace);

    logSystem('sheet_user_provision_ok', userId + ' | row=' + rowNumber + ' | source=' + (source || 'SHEET'));
    return { ok: true, row: rowNumber, userId: userId, workspaceUrl: workspace.url, shared: shared };
  } catch (err) {
    patchUserUiRow_(rowNumber, {
      'Provisioning': 'خطا',
      'آخرین فعالیت': nowFa()
    });
    logSystem('sheet_user_provision_error', userId + ' | row=' + rowNumber + ' | ' + String(err));
    return { ok: false, row: rowNumber, userId: userId, error: String(err) };
  }
}

function provisionPendingSheetUsers() {
  const cfg = SHEETS.users;
  const sh = getSheet(cfg);
  const startRow = cfg.headerRow + 1;
  const lastRow = sh.getLastRow();
  const results = [];
  if (lastRow < startRow) return { ok: true, version: APP_VERSION, results: results };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    for (let row = startRow; row <= lastRow; row++) {
      const obj = getUserUiRowObject_(row);
      if (!obj) continue;
      const hasData = Object.keys(obj).some(function(k) { return String(obj[k] || '').trim(); });
      if (!hasData) continue;
      const workspace = String(obj['Workspace'] || '').trim();
      const provisioning = String(obj['Provisioning'] || '').trim();
      if (workspace && provisioning === 'انجام شد') {
        // حتی در حالت تکمیل، Mirror و Permission را همگام می‌کنیم.
      }
      results.push(provisionUserRowFromSheet_(row, 'MANUAL_SWEEP'));
    }
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  const report = {
    ok: results.every(function(x) { return x.ok || x.skipped; }),
    version: APP_VERSION,
    processed: results.length,
    provisioned: results.filter(function(x) { return x.ok; }).length,
    skipped: results.filter(function(x) { return x.skipped; }).length,
    failed: results.filter(function(x) { return !x.ok && !x.skipped; }).length,
    results: results
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testSheetUserProvisioningAutomation() {
  const triggers = listProjectTriggers();
  const relevant = triggers.filter(function(t) { return t.handler === 'handleUserSheetEdit'; });
  const result = {
    ok: relevant.length === 1,
    version: APP_VERSION,
    triggerCount: relevant.length,
    triggers: relevant,
    pendingUsers: readRows(SHEETS.users).filter(function(r) {
      return String(r['نام کامل'] || '').trim() && !String(r['Workspace'] || '').trim();
    }).map(function(r) { return { userId: r['User ID'] || '', name: r['نام کامل'] || '', provisioning: r['Provisioning'] || '' }; })
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function listProjectTriggers() {
  const items = ScriptApp.getProjectTriggers().map(function(t) {
    return {
      handler: t.getHandlerFunction(),
      eventType: String(t.getEventType()),
      triggerSource: String(t.getTriggerSource()),
      uniqueId: t.getUniqueId()
    };
  });
  Logger.log(JSON.stringify(items, null, 2));
  return items;
}

function removeAllProjectTriggers() {
  // V4.7 is webhook-driven and does not require any installable project trigger.
  // Removing stale triggers prevents old timer jobs from sending the legacy menu repeatedly.
  const triggers = ScriptApp.getProjectTriggers();
  const removed = [];
  triggers.forEach(function(t) {
    removed.push({ handler: t.getHandlerFunction(), eventType: String(t.getEventType()), uniqueId: t.getUniqueId() });
    ScriptApp.deleteTrigger(t);
  });
  Logger.log(JSON.stringify({ removed: removed }, null, 2));
  return removed;
}


function benchmarkMenuPerformance() {
  const started = Date.now();
  const statsStart = Date.now();
  const stats = warmMenuCache();
  const statsMs = Date.now() - statsStart;

  const headerStart = Date.now();
  ['customers','cases','tasks','users'].forEach(function(k){ getHeaders(SHEETS[k]); });
  const headersMs = Date.now() - headerStart;

  const result = {
    version: APP_VERSION,
    totalMs: Date.now() - started,
    statsMs: statsMs,
    headersMs: headersMs,
    stats: stats
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();
  const sheetEditTrigger = installUserSheetEditTrigger();
  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);
  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const ok = !!(info && info.ok && actualUrl === expectedUrl);
  const report = {
    ok: ok,
    version: APP_VERSION,
    scriptId: ScriptApp.getScriptId(),
    expectedUrl: expectedUrl,
    actualWebhookUrl: actualUrl,
    pendingUpdates: info && info.ok && info.result ? (info.result.pending_update_count || 0) : null,
    lastError: info && info.ok && info.result ? (info.result.last_error_message || '') : '',
    triggersBefore: beforeTriggers,
    removedTriggers: removedTriggers,
    sheetEditTrigger: sheetEditTrigger
  };
  Logger.log(JSON.stringify(report, null, 2));
  try { warmMenuCache(); } catch (_) {}
  renderPanel(ADMIN_TELEGRAM_ID,
    (ok ? '✅ <b>Repair V4.11 انجام شد</b>' : '❌ <b>Repair کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n🎯 Expected: <code>' + escapeHtml(expectedUrl) + '</code>' +
    '\n🔗 Webhook: <code>' + escapeHtml(actualUrl || '-') + '</code>' +
    '\n🧹 Trigger حذف‌شده: <b>' + removedTriggers.length + '</b>' +
    '\n🧾 Auto-Provision شیت: <b>' + (sheetEditTrigger && sheetEditTrigger.ok ? 'فعال' : 'خطا') + '</b>' +
    '\n📬 Pending: <b>' + escapeHtml(String(report.pendingUpdates == null ? '-' : report.pendingUpdates)) + '</b>' +
    (report.lastError ? '\n⚠️ Last Error: ' + escapeHtml(report.lastError) : '') +
    '\n\nحالا فقط <code>/start</code> را ارسال کنید.'
  );
  return report;
}

function configureTelegramCommands() {
  return telegramApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'باز کردن پنل مدیریت' },
      { command: 'menu', description: 'نمایش منوی اصلی' },
      { command: 'cancel', description: 'لغو عملیات جاری' }
    ]
  });
}

function testStartAction() {
  clearState(ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);
  const result = showAdminMenuFresh(ADMIN_TELEGRAM_ID);
  const report = {
    version: APP_VERSION,
    ok: !!(result && result.ok),
    telegram: result,
    panelMessageId: getPanelMessageId(ADMIN_TELEGRAM_ID)
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function getLastStartTrace() {
  const raw = PropertiesService.getScriptProperties().getProperty('TG_LAST_START_TRACE') || '';
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { parsed = raw; }
  Logger.log(JSON.stringify(parsed, null, 2));
  return parsed;
}

function installTelegramBot() {
  const report = repairBotInstallation();
  try { report.commands = configureTelegramCommands(); } catch (_) {}
  return report;
}

function testCRMHealth() {
  const result = {
    spreadsheet: getCRMSpreadsheet().getName(),
    customers: readRows(SHEETS.customers).length,
    cases: readRows(SHEETS.cases).length,
    tasks: readRows(SHEETS.tasks).length,
    users: readRows(SHEETS.users).length,
    webhook: getTelegramWebhookInfo()
  };
  Logger.log(JSON.stringify(result,null,2));
  return result;
}


/************************************************************
 * V4.12 — ASYNC PROVISIONING QUEUE + WORKSPACE DATA SYNC
 * ----------------------------------------------------------
 * هدف:
 * 1) مسیر Telegram/onEdit دیگر Drive makeCopy/share را Sync اجرا نمی‌کند.
 * 2) Provisioning Queue توسط worker یک‌دقیقه‌ای پردازش می‌شود.
 * 3) هر Workspace تب‌های داده مخفی محلی دارد؛ Dashboard به همین تب‌ها وصل است.
 * 4) داده‌ها بر اساس Role/Scope فیلتر و هر 5 دقیقه Sync می‌شوند.
 ************************************************************/

Object.assign(SHEETS, {
  leads: { name: 'سرنخ‌ها', headerRow: 1, idHeader: 'شناسه' },
  customerTasks: { name: 'تسک‌های مشتریان', headerRow: 1, idHeader: 'Task ID' },
  caseDocumentsV2: { name: 'اسناد پرونده', headerRow: 1, idHeader: 'Document ID' },
  provisioningQueue: { name: 'Provisioning Queue', headerRow: 1, idHeader: 'Request ID' },
  provisioningLog: { name: 'Provisioning Log', headerRow: 1, idHeader: 'Log ID' }
});

const WORKSPACE_DATA_TABS_V412 = [
  { name: 'مشتریان', cfg: SHEETS.customers },
  { name: 'پرونده‌ها', cfg: SHEETS.cases },
  { name: 'تسک‌ها', cfg: SHEETS.tasks },
  { name: 'سرنخ‌ها', cfg: SHEETS.leads },
  { name: 'تسک‌های مشتریان', cfg: SHEETS.customerTasks },
  { name: 'اسناد پرونده', cfg: SHEETS.caseDocumentsV2 }
];

let __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;

function getRoleTemplateTypeV412_(role) {
  role = normalizeRole(role);
  if (role === 'مدیر') return 'Admin';
  if (role === 'کارمند داخلی') return 'Internal Employee';
  if (role === 'مدیر مشتری') return 'Customer Manager';
  if (role === 'کارمند مشتری') return 'Customer Employee';
  return role || 'Unknown';
}

function appendProvisioningLogV412_(requestId, user, action, oldStatus, newStatus, workspace, details) {
  try {
    appendObject(SHEETS.provisioningLog, {
      'Log ID': 'PLOG-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase(),
      'Request ID': requestId || '',
      'Customer ID': user ? (user['Customer ID'] || '') : '',
      'User ID': user ? (user['User ID'] || '') : '',
      'Action': action || '',
      'Old Status': oldStatus || '',
      'New Status': newStatus || '',
      'Workspace File ID': workspace ? (workspace.fileId || '') : '',
      'Workspace URL': workspace ? (workspace.url || '') : '',
      'Gmail': user ? (user['Gmail / Email'] || '') : '',
      'Permission': 'writer',
      'Actor': ADMIN_TELEGRAM_ID,
      'Source': APP_VERSION,
      'Timestamp': nowFa(),
      'Details': details || ''
    });
  } catch (err) {
    try { logSystem('provision_log_error', String(err)); } catch (_) {}
  }
}

function findOpenProvisioningRequestV412_(userId) {
  const rows = readRows(SHEETS.provisioningQueue).slice().reverse();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]['User ID'] || '').trim() !== String(userId || '').trim()) continue;
    const st = String(rows[i]['وضعیت'] || '').trim();
    if (st === 'در صف' || st === 'در حال پردازش') return rows[i];
  }
  return null;
}

function enqueueProvisioningRequestV412_(user, actor, source) {
  if (!user || !user['User ID']) throw new Error('User ID برای صف Provisioning الزامی است.');
  const open = findOpenProvisioningRequestV412_(user['User ID']);
  if (open) return { queued: true, requestId: open['Request ID'], duplicate: true };

  const role = normalizeRole(user['نقش']);
  const requestId = 'PRV-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
  appendObject(SHEETS.provisioningQueue, {
    'Request ID': requestId,
    'نوع درخواست': 'ساخت/همگام‌سازی Workspace',
    'Customer ID': user['Customer ID'] || '',
    'شرکت': user['شرکت'] || '',
    'User ID': user['User ID'],
    'نام کاربر': user['نام کامل'] || '',
    'Gmail': user['Gmail / Email'] || '',
    'Telegram User ID': user['Telegram User ID'] || '',
    'Role': role,
    'Permission Profile': user['پروفایل دسترسی'] || defaultProfile(role),
    'Template Type': getRoleTemplateTypeV412_(role),
    'Template File ID': DASHBOARD_TEMPLATES[role] || '',
    'وضعیت': 'در صف',
    'Workspace File ID': '',
    'Workspace URL': '',
    'درخواست‌دهنده': actor || ADMIN_TELEGRAM_ID,
    'تاریخ درخواست': nowFa(),
    'خطا/یادداشت': source || 'SYSTEM'
  });
  appendProvisioningLogV412_(requestId, user, 'QUEUE', '', 'در صف', null, source || 'SYSTEM');
  return { queued: true, requestId: requestId, duplicate: false };
}

function patchProvisioningRequestV412_(requestId, patch) {
  return upsertObject(SHEETS.provisioningQueue, 'Request ID', requestId, Object.assign({ 'Request ID': requestId }, patch || {}));
}

function getWorkspaceSourceSnapshotV412_() {
  if (__WORKSPACE_SOURCE_SNAPSHOT_V412) return __WORKSPACE_SOURCE_SNAPSHOT_V412;
  __WORKSPACE_SOURCE_SNAPSHOT_V412 = {
    customers: readRows(SHEETS.customers),
    cases: readRows(SHEETS.cases),
    tasks: readRows(SHEETS.tasks),
    leads: readRows(SHEETS.leads),
    customerTasks: readRows(SHEETS.customerTasks),
    caseDocuments: readRows(SHEETS.caseDocumentsV2)
  };
  return __WORKSPACE_SOURCE_SNAPSHOT_V412;
}

function textContainsAnyV412_(value, needles) {
  const hay = normalize(value);
  return (needles || []).some(function(n) {
    const x = normalize(n);
    return x && hay.indexOf(x) >= 0;
  });
}

function getScopedWorkspaceDataV412_(user) {
  const src = getWorkspaceSourceSnapshotV412_();
  const role = normalizeRole(user['نقش']);
  if (role === 'مدیر') return src;

  const userTokens = [user['User ID'], user['نام کامل'], user['Telegram User ID']].filter(Boolean);
  let cases = [], customers = [], tasks = [], leads = [], customerTasks = [], caseDocuments = [];

  if (role === 'کارمند داخلی') {
    cases = src.cases.filter(function(r) {
      return textContainsAnyV412_(r['مسئول داخلی اصلی'], userTokens) || textContainsAnyV412_(r['همکاران داخلی'], userTokens);
    });
    const caseIds = cases.map(function(r){ return String(r['Case ID'] || '').trim(); }).filter(Boolean);
    const customerIds = cases.map(function(r){ return String(r['Customer ID'] || '').trim(); }).filter(Boolean);
    customers = src.customers.filter(function(r){ return customerIds.indexOf(String(r['مشتری ID'] || '').trim()) >= 0; });
    tasks = src.tasks.filter(function(r){
      return textContainsAnyV412_(r['مسئول'], userTokens) ||
        (String(r['نوع ارتباط'] || '') === 'پرونده' && caseIds.indexOf(String(r['شناسه مرتبط'] || '').trim()) >= 0);
    });
    leads = src.leads.filter(function(r){ return textContainsAnyV412_(r['مسئول'], userTokens); });
    customerTasks = src.customerTasks.filter(function(r){
      return textContainsAnyV412_(r['مسئول'], userTokens) || caseIds.indexOf(String(r['شناسه پرونده'] || '').trim()) >= 0;
    });
    caseDocuments = src.caseDocuments.filter(function(r){ return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0; });
  } else if (role === 'مدیر مشتری' || role === 'کارمند مشتری') {
    const customerId = String(user['Customer ID'] || '').trim();
    customers = src.customers.filter(function(r){ return String(r['مشتری ID'] || '').trim() === customerId; });
    cases = src.cases.filter(function(r){ return String(r['Customer ID'] || '').trim() === customerId; });
    const caseIds = cases.map(function(r){ return String(r['Case ID'] || '').trim(); }).filter(Boolean);
    tasks = src.tasks.filter(function(r){
      const type = String(r['نوع ارتباط'] || '').trim();
      const rel = String(r['شناسه مرتبط'] || '').trim();
      return (type === 'مشتری' && rel === customerId) || (type === 'پرونده' && caseIds.indexOf(rel) >= 0);
    });
    leads = [];
    customerTasks = src.customerTasks.filter(function(r){ return String(r['مشتری ID'] || '').trim() === customerId; });
    caseDocuments = src.caseDocuments.filter(function(r){ return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0; });
  }

  return { customers: customers, cases: cases, tasks: tasks, leads: leads, customerTasks: customerTasks, caseDocuments: caseDocuments };
}

function ensureTargetSheetSizeV412_(sh, rows, cols) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
}

function writeWorkspaceDataSheetV412_(targetSs, tabName, sourceCfg, rows) {
  const headers = getHeaders(sourceCfg);
  let sh = targetSs.getSheetByName(tabName);
  if (!sh) sh = targetSs.insertSheet(tabName);
  ensureTargetSheetSizeV412_(sh, Math.max(50, (rows || []).length + 5), Math.max(1, headers.length));
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows && rows.length) {
    const matrix = rows.map(function(r){ return headers.map(function(h){ return Object.prototype.hasOwnProperty.call(r,h) ? r[h] : ''; }); });
    sh.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
  }
  sh.setFrozenRows(1);
  try { sh.hideSheet(); } catch (_) {}
}

function getWorkspaceDashboardSheetV412_(ss) {
  const dataNames = WORKSPACE_DATA_TABS_V412.map(function(x){ return x.name; });
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) if (dataNames.indexOf(sheets[i].getName()) < 0) return sheets[i];
  return sheets[0];
}

function repairWorkspaceDashboardFormulasV412_(ss) {
  const sh = getWorkspaceDashboardSheetV412_(ss);
  if (!sh) return;
  const formulas = {
    'B6': '=COUNTIFS(\'پرونده‌ها\'!A2:A,"<>",\'پرونده‌ها\'!G2:G,"<>تکمیل شده",\'پرونده‌ها\'!G2:G,"<>بسته شده",\'پرونده‌ها\'!G2:G,"<>بایگانی")',
    'D6': '=COUNTIF(\'مشتریان\'!T2:T,TRUE)',
    'F6': '=COUNTIF(\'سرنخ‌ها\'!J2:J,">=80")',
    'J3': '=COUNTIFS(\'تسک‌های مشتریان\'!A2:A,"<>",\'تسک‌های مشتریان\'!H2:H,"<>بسته شد")',
    'J4': '=SUMPRODUCT((\'تسک‌های مشتریان\'!A2:A1000<>"")*(\'تسک‌های مشتریان\'!H2:H1000<>"بسته شد")*(\'تسک‌های مشتریان\'!K2:K1000="")*((NOW()-\'تسک‌های مشتریان\'!S2:S1000)*1440>=60))',
    'J5': '=SUMPRODUCT((\'تسک‌های مشتریان\'!A2:A1000<>"")*(\'تسک‌های مشتریان\'!H2:H1000<>"بسته شد")*(\'تسک‌های مشتریان\'!K2:K1000="")*((NOW()-\'تسک‌های مشتریان\'!S2:S1000)*1440>=120))',
    'J6': '=COUNTIF(\'تسک‌های مشتریان\'!H2:H,"نیاز به مدیر")',
    'J7': '=COUNTIFS(\'تسک‌های مشتریان\'!Q2:Q,">="&TODAY(),\'تسک‌های مشتریان\'!Q2:Q,"<"&TODAY()+1)',
    'J8': '=COUNTIFS(\'تسک‌های مشتریان\'!I2:I,">="&TODAY(),\'تسک‌های مشتریان\'!I2:I,"<"&TODAY()+1)',
    'B11': '=SUMPRODUCT(N(\'سرنخ‌ها\'!P2:P2000<>""),N(IFERROR(IF(ISNUMBER(\'سرنخ‌ها\'!P2:P2000),\'سرنخ‌ها\'!P2:P2000,DATE(VALUE(LEFT(\'سرنخ‌ها\'!P2:P2000,4)),VALUE(MID(\'سرنخ‌ها\'!P2:P2000,6,2)),VALUE(RIGHT(\'سرنخ‌ها\'!P2:P2000,2)))),TODAY()+1)<TODAY()),N(\'سرنخ‌ها\'!S2:S2000="فعال"))',
    'D11': '=COUNTIF(\'اسناد پرونده\'!H:H,"ارسال شده / در انتظار بررسی")',
    'F11': '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!J2:J,"<>انجام شد",\'تسک‌ها\'!J2:J,"<>انجام شده",\'تسک‌ها\'!J2:J,"<>بسته شد",\'تسک‌ها\'!J2:J,"<>بسته شده",\'تسک‌ها\'!J2:J,"<>لغو شده")',
    'B23': '=IF(B11>0,"پیگیری عقب‌افتاده: "&B11,IF(D11>0,"اسناد منتظر تأیید: "&D11,IF(F11>0,"تسک باز: "&F11,"مورد فوری ثبت نشده")))',
    'E23': '=IF(OR(B11>0,D11>0),"نیازمند توجه",IF(F11>0,"تحت پایش","پایدار"))',
    'B24': '="امروز "&B6&" پرونده فعال، "&D6&" مشتری فعال و "&F6&" سرنخ داغ در سیستم ثبت است. "&IF(B11>0,"اولویت نخست، رسیدگی به "&B11&" پیگیری عقب‌افتاده است. ","")&IF(D11>0,"همچنین "&D11&" سند منتظر تأیید نیاز به بررسی دارد. ","")&IF(F11>0,"تعداد تسک‌های باز: "&F11&".","صف تسک باز بحرانی نیست.")'
  };
  Object.keys(formulas).forEach(function(a1){ sh.getRange(a1).setFormula(formulas[a1]); });
}

function ensureWorkspaceStructureV412_(workspaceFileId) {
  const ss = SpreadsheetApp.openById(workspaceFileId);
  WORKSPACE_DATA_TABS_V412.forEach(function(spec) {
    let sh = ss.getSheetByName(spec.name);
    if (!sh) {
      sh = ss.insertSheet(spec.name);
      const headers = getHeaders(spec.cfg);
      ensureTargetSheetSizeV412_(sh, 50, headers.length);
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      try { sh.hideSheet(); } catch (_) {}
    }
  });
  repairWorkspaceDashboardFormulasV412_(ss);
  return ss;
}

function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');
  const ss = ensureWorkspaceStructureV412_(fileId);
  const scoped = getScopedWorkspaceDataV412_(user);
  writeWorkspaceDataSheetV412_(ss, 'مشتریان', SHEETS.customers, scoped.customers);
  writeWorkspaceDataSheetV412_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases);
  writeWorkspaceDataSheetV412_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks);
  writeWorkspaceDataSheetV412_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads);
  writeWorkspaceDataSheetV412_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks);
  writeWorkspaceDataSheetV412_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments);
  repairWorkspaceDashboardFormulasV412_(ss);
  SpreadsheetApp.flush();
  return {
    customers: scoped.customers.length,
    cases: scoped.cases.length,
    tasks: scoped.tasks.length,
    leads: scoped.leads.length,
    customerTasks: scoped.customerTasks.length,
    caseDocuments: scoped.caseDocuments.length
  };
}

function processProvisioningQueue(limit) {
  limit = Math.max(1, Math.min(Number(limit) || 3, 10));
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, busy: true, version: APP_VERSION };
  const report = { ok: true, version: APP_VERSION, processed: 0, succeeded: 0, failed: 0, results: [] };
  try {
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    const queue = readRows(SHEETS.provisioningQueue).filter(function(r){ return String(r['وضعیت'] || '').trim() === 'در صف'; }).slice(0, limit);
    queue.forEach(function(req) {
      const requestId = String(req['Request ID'] || '').trim();
      const userId = String(req['User ID'] || '').trim();
      report.processed++;
      let user = null, workspace = null;
      try {
        patchProvisioningRequestV412_(requestId, { 'وضعیت': 'در حال پردازش', 'خطا/یادداشت': 'Worker ' + APP_VERSION });
        user = getRowById(SHEETS.usersRaw, userId);
        if (!user) throw new Error('User در Users پیدا نشد: ' + userId);
        appendProvisioningLogV412_(requestId, user, 'PROCESS', 'در صف', 'در حال پردازش', null, 'worker_start');

        workspace = findExistingWorkspaceForUser_(userId, user);
        if (workspace && workspace.type && normalizeRole(workspace.type) !== normalizeRole(user['نقش'])) workspace = null;
        if (!workspace) workspace = provisionWorkspace(user);
        if (!workspace || !workspace.url) throw new Error('ساخت Workspace ناموفق بود.');
        workspace.fileId = workspace.fileId || parseDriveFileId_(workspace.url);
        workspace.type = normalizeRole(user['نقش']);

        const syncCounts = syncWorkspaceDataV412_(workspace, user);
        const shared = shareWorkspaceToUser_(workspace, user['Gmail / Email']);
        workspace.shared = shared;
        const access = shared ? 'فعال' : 'ایجاد شد';

        updateRowById(SHEETS.usersRaw, userId, {
          'Workspace URL': workspace.url,
          'Google Access': access,
          'Telegram Linked': 'بله',
          'آخرین بروزرسانی': nowFa(),
          'آخرین فعالیت': nowFa()
        });
        updateRowById(SHEETS.users, userId, {
          'Workspace': workspace.url,
          'Google Access': access,
          'Telegram Linked': 'بله',
          'Provisioning': 'انجام شد',
          'آخرین فعالیت': nowFa()
        });
        upsertWorkspaceMappingForUser_(user, workspace);
        if (normalizeRole(user['نقش']) === 'مدیر مشتری') linkCustomerManager(user, workspace);
        patchProvisioningRequestV412_(requestId, {
          'وضعیت': 'انجام شد',
          'Workspace File ID': workspace.fileId,
          'Workspace URL': workspace.url,
          'خطا/یادداشت': 'Sync: ' + JSON.stringify(syncCounts)
        });
        appendProvisioningLogV412_(requestId, user, 'DONE', 'در حال پردازش', 'انجام شد', workspace, JSON.stringify(syncCounts));
        report.succeeded++;
        report.results.push({ requestId: requestId, userId: userId, ok: true, workspaceUrl: workspace.url, sync: syncCounts });
      } catch (err) {
        report.failed++;
        report.ok = false;
        patchProvisioningRequestV412_(requestId, { 'وضعیت': 'خطا', 'خطا/یادداشت': String(err && err.message ? err.message : err) });
        if (user) updateRowById(SHEETS.users, userId, { 'Provisioning': 'خطا', 'آخرین فعالیت': nowFa() });
        appendProvisioningLogV412_(requestId, user || {'User ID': userId}, 'ERROR', 'در حال پردازش', 'خطا', workspace, String(err));
        try { logSystem('provision_worker_error', requestId + ' | ' + String(err && err.stack ? err.stack : err)); } catch (_) {}
        report.results.push({ requestId: requestId, userId: userId, ok: false, error: String(err) });
      }
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function retryFailedProvisioningV412() {
  const rows = readRows(SHEETS.provisioningQueue).filter(function(r){ return String(r['وضعیت'] || '').trim() === 'خطا'; });
  rows.forEach(function(r){ patchProvisioningRequestV412_(r['Request ID'], { 'وضعیت': 'در صف', 'خطا/یادداشت': 'Retry ' + nowFa() }); });
  return { ok: true, reset: rows.length, version: APP_VERSION };
}

function syncAllActiveWorkspacesV412(limit) {
  limit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return { ok: false, busy: true, version: APP_VERSION };
  const report = { ok: true, version: APP_VERSION, processed: 0, synced: 0, failed: 0, results: [] };
  try {
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    const mappings = readRows(SHEETS.mapping).filter(function(r){ return String(r['Workspace URL'] || '').trim(); }).slice(0, limit);
    mappings.forEach(function(m) {
      const userId = String(m['User ID'] || '').trim();
      const user = getRowById(SHEETS.usersRaw, userId);
      if (!user || String(user['وضعیت'] || '').trim() === 'غیرفعال') return;
      report.processed++;
      try {
        const workspace = { fileId: String(m['Spreadsheet ID'] || '') || parseDriveFileId_(m['Workspace URL']), url: String(m['Workspace URL'] || ''), type: m['نوع Workspace'] || user['نقش'] };
        const counts = syncWorkspaceDataV412_(workspace, user);
        upsertObject(SHEETS.mapping, 'User ID', userId, Object.assign({}, m, { 'User ID': userId, 'آخرین Sync': nowFa(), 'وضعیت Provisioning': 'انجام شد' }));
        report.synced++;
        report.results.push({ userId: userId, ok: true, counts: counts });
      } catch (err) {
        report.failed++; report.ok = false;
        try { logSystem('workspace_sync_error', userId + ' | ' + String(err)); } catch (_) {}
        report.results.push({ userId: userId, ok: false, error: String(err) });
      }
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function installTimeTriggerV412_(handler, minutes) {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === handler) { ScriptApp.deleteTrigger(t); removed++; }
  });
  const trigger = ScriptApp.newTrigger(handler).timeBased().everyMinutes(minutes).create();
  return { ok: true, handler: handler, minutes: minutes, triggerId: trigger.getUniqueId(), removedDuplicates: removed };
}

function installProvisioningWorkerTriggerV412() { return installTimeTriggerV412_('processProvisioningQueue', 1); }
function installWorkspaceSyncTriggerV412() { return installTimeTriggerV412_('syncAllActiveWorkspacesV412', 5); }

function enqueueUsersMissingWorkspaceV412_() {
  const users = readRows(SHEETS.usersRaw);
  let queued = 0, ready = 0, skipped = 0;
  users.forEach(function(u) {
    if (String(u['وضعیت'] || '').trim() !== 'فعال') { skipped++; return; }
    if (String(u['Workspace URL'] || '').trim()) { ready++; return; }
    enqueueProvisioningRequestV412_(u, ADMIN_TELEGRAM_ID, 'REPAIR_SWEEP');
    updateRowById(SHEETS.users, u['User ID'], {
      'Provisioning':'در صف',
      'آخرین فعالیت':nowFa()
    });
    queued++;
  });
  return { users:users.length, queued:queued, ready:ready, skipped:skipped };
}

function ensureDashboardTemplatesReadyV412() {
  const results = [];
  const seen = {};
  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    if (role === 'کارمند') return;
    const id = String(DASHBOARD_TEMPLATES[role] || '').trim();
    if (!id || seen[id]) return;
    seen[id] = true;
    try {
      const ss = ensureWorkspaceStructureV412_(id);
      WORKSPACE_DATA_TABS_V412.forEach(function(spec) {
        writeWorkspaceDataSheetV412_(ss, spec.name, spec.cfg, []);
      });
      const daily = ensurePersonalDailySheetV420_(ss);
      if (daily.getLastRow() > 1) {
        daily.getRange(2, 1, daily.getMaxRows() - 1, daily.getMaxColumns()).clearContent();
      }
      results.push({ role:role, ok:true, fileId:id, operationalDataWritten:false });
    } catch (err) {
      results.push({ role:role, ok:false, fileId:id, error:String(err) });
    }
  });
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

// --- V4.12 override: ثبت Telegram سریع است و فقط وارد Queue می‌شود. ---
function createUser(data, actorUserId) {
  const role = normalizeRole(data['نقش']);
  const idPrefix = role === 'مدیر' ? 'USR-ADMIN-' : role === 'مدیر مشتری' ? 'USR-CM-' : role === 'کارمند مشتری' ? 'USR-CE-' : 'USR-INTERNAL-';
  const id = nextIdRaw(SHEETS.usersRaw, 'User ID', idPrefix, 3);
  if ((role === 'مدیر مشتری' || role === 'کارمند مشتری') && !data['Customer ID']) throw new Error('برای نقش مشتری، Customer ID الزامی است.');
  if (data['Customer ID']) {
    const customer = getEntityById('customers', data['Customer ID']);
    if (!customer) throw new Error('Customer ID معتبر نیست.');
    if (!data['شرکت']) data['شرکت'] = customer['نام / عنوان مشتری'] || '';
  }
  const base = {
    'User ID': id, 'نام کامل': data['نام کامل'], 'موبایل': data['موبایل'] || '', 'Gmail / Email': data['Gmail / Email'] || '',
    'Telegram User ID': data['Telegram User ID'], 'نقش': role, 'Customer ID': data['Customer ID'] || '', 'شرکت': data['شرکت'] || '',
    'پروفایل دسترسی': data['پروفایل دسترسی'] || defaultProfile(role), 'وضعیت': data['وضعیت'] || 'فعال',
    'ایجادکننده': actorUserId, 'تاریخ ایجاد': nowFa(), 'آخرین بروزرسانی': nowFa(), 'آخرین فعالیت': nowFa(), 'یادداشت': data['یادداشت'] || ''
  };
  appendObject(SHEETS.usersRaw, base);
  appendObject(SHEETS.users, Object.assign({}, base, { 'Provisioning': 'در صف' }));
  upsertPermissionForUser(base);
  if (role === 'کارمند داخلی') upsertLegacyEmployeeV4(base);
  const q = enqueueProvisioningRequestV412_(base, actorUserId, 'TELEGRAM');
  logSystem('user_create_queued', id + ' | ' + role + ' | ' + q.requestId);
  return { id: id, queued: true, requestId: q.requestId };
}

// --- V4.12 override: ثبت مستقیم در Sheet فقط Mirror + Queue؛ بدون makeCopy داخل onEdit. ---
function provisionUserRowFromSheet_(rowNumber, source) {
  const row = getUserUiRowObject_(rowNumber);
  if (!row) return { ok: false, row: rowNumber, skipped: true, reason: 'row_not_found' };
  const built = buildUserFromUiRow_(row, rowNumber);
  if (!built.ready) {
    if (!built.empty) patchUserUiRow_(rowNumber, { 'Provisioning': 'منتظر تکمیل اطلاعات' });
    return { ok: false, row: rowNumber, skipped: true, reason: built.reason || 'empty' };
  }
  const user = built.user;
  const userId = user['User ID'];
  patchUserUiRow_(rowNumber, {
    'User ID': userId, 'شرکت': user['شرکت'], 'پروفایل دسترسی': user['پروفایل دسترسی'], 'وضعیت': user['وضعیت'],
    'Provisioning': String(row['Workspace'] || '').trim() ? 'در صف همگام‌سازی' : 'در صف', 'آخرین فعالیت': nowFa(),
    'ایجادکننده': user['ایجادکننده'], 'تاریخ ایجاد': user['تاریخ ایجاد']
  });
  upsertObject(SHEETS.usersRaw, 'User ID', userId, user);
  upsertPermissionForUser(user);
  if (user['نقش'] === 'کارمند داخلی') upsertLegacyEmployeeV4(user);
  const q = enqueueProvisioningRequestV412_(user, user['ایجادکننده'], source || 'SHEET_EDIT');
  logSystem('sheet_user_queued', userId + ' | row=' + rowNumber + ' | ' + q.requestId);
  return { ok: true, queued: true, row: rowNumber, userId: userId, requestId: q.requestId };
}

// --- V4.12 override: دکمه Sync فقط Queue/Status را سریع بررسی می‌کند. ---
function runSyncAudit() {
  const sweep = enqueueUsersMissingWorkspaceV412_();
  const queue = readRows(SHEETS.provisioningQueue);
  return {
    users: sweep.users,
    provisioned: sweep.ready,
    pending: queue.filter(function(r){ return ['در صف','در حال پردازش'].indexOf(String(r['وضعیت'] || '').trim()) >= 0; }).length,
    errors: queue.filter(function(r){ return String(r['وضعیت'] || '').trim() === 'خطا'; }).length,
    queued: sweep.queued
  };
}

// پیام پایان Wizard برای User نشان می‌دهد Workspace در صف است.
function finishCreateWizard(chatId, userId, state, messageId) {
  const result = createEntity(state.entity, state.data, userId);
  clearState(userId);
  let msg = '✅ <b>ثبت با موفقیت انجام شد</b>\n\n🆔 ' + escapeHtml(result.id);
  if (result.queued) msg += '\n⏳ ساخت/همگام‌سازی Workspace در صف قرار گرفت.';
  if (result.workspaceUrl) msg += '\n🔗 <a href="' + result.workspaceUrl + '">Workspace کاربر</a>';
  if (result.folderUrl) msg += '\n📁 <a href="' + result.folderUrl + '">پوشه اسناد</a>';
  renderPanel(chatId, msg, entityBackKeyboard(state.entity), messageId);
}

function testV412Architecture() {
  const qHeaders = getHeaders(SHEETS.provisioningQueue);
  const logHeaders = getHeaders(SHEETS.provisioningLog);
  const triggers = listProjectTriggers();
  const result = {
    ok: true,
    version: APP_VERSION,
    queueHeaders: qHeaders.length,
    logHeaders: logHeaders.length,
    triggers: triggers,
    openQueue: readRows(SHEETS.provisioningQueue).filter(function(r){ return String(r['وضعیت'] || '') === 'در صف'; }).length,
    mappings: readRows(SHEETS.mapping).length,
    templates: ensureDashboardTemplatesReadyV412()
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// --- V4.12 override: Webhook + onEdit + Queue worker + Workspace sync worker ---
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();
  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);
  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);
  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const deleteMenuTrigger = installSheetDeleteMenuTriggerV413();
  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}
  const sweep = enqueueUsersMissingWorkspaceV412_();
  const report = {
    ok: webhookOk,
    version: APP_VERSION,
    scriptId: ScriptApp.getScriptId(),
    expectedUrl: expectedUrl,
    actualWebhookUrl: actualUrl,
    pendingUpdates: info && info.ok && info.result ? (info.result.pending_update_count || 0) : null,
    lastError: info && info.ok && info.result ? (info.result.last_error_message || '') : '',
    triggersBefore: beforeTriggers,
    removedTriggers: removedTriggers,
    sheetEditTrigger: sheetEditTrigger,
    queueTrigger: queueTrigger,
    workspaceSyncTrigger: syncTrigger,
    deleteMenuTrigger: deleteMenuTrigger,
    templateRepair: templateRepair,
    provisioningSweep: sweep
  };
  Logger.log(JSON.stringify(report, null, 2));
  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}
  sendMessage(ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.13 نصب شد</b>' : '❌ <b>نصب کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n📬 Queue Worker: <b>هر 1 دقیقه</b>' +
    '\n🔄 Workspace Sync: <b>هر 5 دقیقه</b>' +
    '\n📝 Sheet onEdit: <b>فعال</b>' +
    '\n🗑 منوی حذف کامل شیت: <b>فعال</b>' +
    '\n⏳ کاربران در صف: <b>' + escapeHtml(String(sweep.queued)) + '</b>' +
    '\n\nحالا <code>/start</code> را ارسال کنید.'
  );
  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.13 — ADMIN HARD DELETE + CASCADE PURGE
 * حذف کامل با تأیید دو مرحله‌ای در Telegram و منوی Google Sheet.
 ************************************************************/

function startDeleteCascadeV413(chatId, userId, entity, messageId) {
  setState(userId, { mode: 'delete_id', entity: entity });
  renderPanel(
    chatId,
    '🗑 <b>حذف کامل رکورد</b>\n\n' +
    'شناسه رکورد را ارسال کنید:\n' + escapeHtml(idHint(entity)) +
    '\n\n⚠️ این عملیات با «غیرفعال/بایگانی» متفاوت است و اطلاعات مرتبط را از جداول سیستمی نیز حذف می‌کند.\n' +
    'قبل از حذف نهایی یک مرحله تأیید دیگر نمایش داده می‌شود.',
    { inline_keyboard: [[{ text: '❌ انصراف', callback_data: entity }]] },
    messageId
  );
}

function deleteTokenV413_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function showDeleteConfirmationV413(chatId, userId, entity, id, row, messageId) {
  if (entity === 'users') {
    const telegramId = String(row['Telegram User ID'] || '');
    const role = String(row['نقش'] || '');
    if (telegramId === String(ADMIN_TELEGRAM_ID) && role === 'مدیر') {
      clearState(userId);
      renderPanel(chatId, '⛔️ <b>حذف مدیر اصلی ربات مسدود است</b>\n\nبرای جلوگیری از قطع کامل مدیریت ربات، اکانت مدیر اصلی را نمی‌توان از داخل ربات حذف کرد.', entityBackKeyboard('users'), messageId);
      return;
    }
  }

  const impact = previewDeleteImpactV413_(entity, id, row);
  const token = deleteTokenV413_();
  setState(userId, { mode: 'delete_confirm', entity: entity, targetId: id, token: token });

  const text =
    '🚨 <b>تأیید حذف کامل</b>\n\n' +
    'نوع: <b>' + escapeHtml(entityLabelV413_(entity)) + '</b>\n' +
    'شناسه: <code>' + escapeHtml(id) + '</code>\n' +
    'عنوان: <b>' + escapeHtml(recordLabelV413_(entity, row)) + '</b>\n\n' +
    '📦 <b>اثر حذف</b>\n' + impact.lines.join('\n') +
    '\n\n⚠️ این عملیات برگشت خودکار ندارد. فایل‌های Drive وابسته به Trash منتقل می‌شوند.';

  renderPanel(chatId, text, { inline_keyboard: [
    [{ text: '🗑 بله، حذف کامل', callback_data: 'delconfirm:' + entity + ':' + token + ':yes' }],
    [{ text: '❌ انصراف', callback_data: 'delconfirm:' + entity + ':' + token + ':cancel' }]
  ] }, messageId);
}

function handleDeleteConfirmV413(chatId, userId, entity, token, action, messageId) {
  const state = getState(userId);
  if (!state || state.mode !== 'delete_confirm' || state.entity !== entity || String(state.token || '') !== String(token || '')) {
    renderPanel(chatId, '⚠️ درخواست حذف منقضی یا نامعتبر است. دوباره از منوی «حذف کامل» شروع کنید.', entityBackKeyboard(entity), messageId);
    return;
  }
  if (action === 'cancel') {
    clearState(userId);
    showEntityMenu(chatId, messageId, entity);
    return;
  }
  const id = state.targetId;
  clearState(userId);
  const result = deleteEntityCascadeV413_(entity, id, userId);
  clearFastCachesV413_();
  try { syncAllActiveWorkspacesV412(); } catch (_) {}
  renderPanel(
    chatId,
    '✅ <b>حذف کامل انجام شد</b>\n\n' +
    'نوع: ' + escapeHtml(entityLabelV413_(entity)) + '\n' +
    'شناسه: <code>' + escapeHtml(id) + '</code>\n\n' +
    formatDeleteResultV413_(result) +
    '\n\n🔄 Workspaceهای فعال نیز برای پاک‌شدن نسخه‌های کپی‌شده همگام‌سازی شدند.',
    entityBackKeyboard(entity),
    messageId
  );
}

function entityLabelV413_(entity) {
  return { customers: 'مشتری', cases: 'پرونده', tasks: 'تسک', users: 'کاربر/کارمند' }[entity] || entity;
}

function recordLabelV413_(entity, row) {
  if (!row) return '-';
  if (entity === 'customers') return row['نام / عنوان مشتری'] || '-';
  if (entity === 'cases') return row['شماره پرونده واقعی'] || row['شماره کوتاژ'] || row['Case ID'] || '-';
  if (entity === 'tasks') return row['موضوع'] || row['Task ID'] || '-';
  if (entity === 'users') return row['نام کامل'] || row['User ID'] || '-';
  return '-';
}

function previewDeleteImpactV413_(entity, id, row) {
  let lines = [];
  if (entity === 'users') {
    const uid = id;
    lines = [
      '• مدیریت کاربران / Users: ' + countRowsWhereV413_('مدیریت کاربران', 4, function(r){ return eqV413_(r['User ID'], uid); }) + '/' + countRowsWhereV413_('Users', 1, function(r){ return eqV413_(r['User ID'], uid); }),
      '• Permissions: ' + countRowsWhereV413_('Permissions', 1, function(r){ return eqV413_(r['User ID'], uid); }),
      '• Workspace Mapping: ' + countRowsWhereV413_('Workspace Mapping', 1, function(r){ return eqV413_(r['User ID'], uid); }),
      '• تخصیص‌های پرونده: ' + countRowsWhereV413_('Case Assignments', 1, function(r){ return eqV413_(r['User ID'], uid); }),
      '• درخواست/لاگ Provisioning: ' + (countRowsWhereV413_('Provisioning Queue', 1, function(r){ return eqV413_(r['User ID'], uid); }) + countRowsWhereV413_('Provisioning Log', 1, function(r){ return eqV413_(r['User ID'], uid); }))
    ];
  } else if (entity === 'cases') {
    const caseId = id;
    lines = [
      '• ردیف پرونده: 1',
      '• اسناد پرونده: ' + (countRowsWhereV413_('اسناد پرونده', 1, function(r){ return eqV413_(r['Case ID'], caseId); }) + countRowsWhereV413_('اسناد پرونده‌ها', 1, function(r){ return eqV413_(r['شناسه پرونده'], caseId); })),
      '• تخصیص‌ها/تاریخچه: ' + (countRowsWhereV413_('Case Assignments', 1, function(r){ return eqV413_(r['Case ID'], caseId); }) + countRowsWhereV413_('Assignment History', 1, function(r){ return eqV413_(r['Case ID'], caseId); })),
      '• تسک‌های مرتبط: ' + countRowsWhereV413_('تسک‌ها', 1, function(r){ return r['نوع ارتباط'] === 'پرونده' && eqV413_(r['شناسه مرتبط'], caseId); }),
      '• تسک مشتری: ' + countRowsWhereV413_('تسک‌های مشتریان', 1, function(r){ return eqV413_(r['شناسه پرونده'], caseId); })
    ];
  } else if (entity === 'customers') {
    const customerId = id;
    lines = [
      '• ردیف مشتری: 1',
      '• کاربران وابسته: ' + countRowsWhereV413_('مدیریت کاربران', 4, function(r){ return eqV413_(r['Customer ID'], customerId); }),
      '• پرونده‌های وابسته: ' + countRowsWhereV413_('پرونده‌ها', 1, function(r){ return eqV413_(r['Customer ID'], customerId); }),
      '• اسناد مشتری: ' + countRowsWhereV413_('اسناد مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); }),
      '• تسک مشتری/دسترسی: ' + (countRowsWhereV413_('تسک‌های مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); }) + countRowsWhereV413_('دسترسی مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); }))
    ];
  } else {
    lines = [
      '• ردیف تسک: 1',
      '• پیام‌های مرتبط: ' + countRowsWhereV413_('پیام‌های تسک مشتری', 1, function(r){ return eqV413_(r['Task ID'], id); }),
      '• فعالیت بازاریابی مرتبط: ' + countRowsWhereV413_('بازاریابی و پیگیری', 1, function(r){ return eqV413_(r['Source Task ID'], id); })
    ];
  }
  return { lines: lines };
}

function deleteEntityCascadeV413_(entity, id, actorUserId) {
  if (entity === 'users') return deleteUserCascadeV413_(id, actorUserId);
  if (entity === 'customers') return deleteCustomerCascadeV413_(id, actorUserId);
  if (entity === 'cases') return deleteCaseCascadeV413_(id, actorUserId);
  if (entity === 'tasks') return deleteTaskCascadeV413_(id, actorUserId);
  throw new Error('نوع حذف پشتیبانی نمی‌شود.');
}

function deleteUserCascadeV413_(userId, actorUserId) {
  const user = getRowById(SHEETS.users, userId) || getRowById(SHEETS.usersRaw, userId);
  if (!user) throw new Error('User ID پیدا نشد.');
  if (String(user['Telegram User ID'] || '') === String(ADMIN_TELEGRAM_ID) && String(user['نقش'] || '') === 'مدیر') throw new Error('حذف مدیر اصلی ربات مسدود است.');

  const result = newDeleteResultV413_('users', userId);
  const workspaceIds = {};
  extractDriveIdV413_(user['Workspace'] || user['Workspace URL'] || '') && (workspaceIds[extractDriveIdV413_(user['Workspace'] || user['Workspace URL'] || '')] = true);
  readRowsByNameV413_('Workspace Mapping', 1).forEach(function(r) {
    if (eqV413_(r['User ID'], userId)) {
      const fid = String(r['Spreadsheet ID'] || extractDriveIdV413_(r['Workspace URL'] || '') || '');
      if (fid) workspaceIds[fid] = true;
    }
  });
  Object.keys(workspaceIds).forEach(function(fid) { if (trashDriveIdV413_(fid)) result.driveTrashed++; });

  result.rows += deleteRowsWhereV413_('مدیریت کاربران', 4, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('Users', 1, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('Permissions', 1, function(r){ return eqV413_(r['User ID'], userId) || eqV413_(r['Permission ID'], 'PERM-' + userId); });
  result.rows += deleteRowsWhereV413_('Workspace Mapping', 1, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('کارمندان', 1, function(r){ return eqV413_(r['شناسه'], userId) || (!!user['Telegram User ID'] && eqV413_(r['Telegram User ID'], user['Telegram User ID'])); });
  result.rows += deleteRowsWhereV413_('Provisioning Queue', 1, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('Provisioning Log', 1, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('Case Assignments', 1, function(r){ return eqV413_(r['User ID'], userId); });
  result.rows += deleteRowsWhereV413_('Assignment History', 1, function(r){ return eqV413_(r['کاربر قبلی'], userId) || eqV413_(r['کاربر جدید'], userId); });

  if (user['نام کامل']) {
    result.referencesCleared += patchRowsWhereV413_('تسک‌ها', 1, function(r){ return eqV413_(r['مسئول'], user['نام کامل']); }, { 'مسئول': '' });
    result.referencesCleared += patchRowsWhereV413_('کارهای روزانه', 1, function(r){ return eqV413_(r['مسئول'], user['نام کامل']); }, { 'مسئول': '' });
    result.referencesCleared += patchRowsWhereV413_('بازاریابی و پیگیری', 1, function(r){ return eqV413_(r['مسئول'], user['نام کامل']); }, { 'مسئول': '' });
  }
  result.referencesCleared += patchRowsWhereV413_('مشتریان', 1, function(r){ return eqV413_(r['User ID مدیر'], userId); }, {
    'مدیر اصلی': '', 'موبایل مدیر': '', 'Gmail مدیر': '', 'Telegram ID مدیر': '', 'User ID مدیر': '', 'Workspace مدیر': '', 'وضعیت دسترسی مدیر': ''
  });
  safeLogDeleteV413_(actorUserId, 'users', userId, result);
  return result;
}

function deleteCaseCascadeV413_(caseId, actorUserId) {
  const row = getRowById(SHEETS.cases, caseId);
  if (!row) throw new Error('Case ID پیدا نشد.');
  const result = newDeleteResultV413_('cases', caseId);

  const customerTaskIds = readRowsByNameV413_('تسک‌های مشتریان', 1).filter(function(r){ return eqV413_(r['شناسه پرونده'], caseId); }).map(function(r){ return String(r['Task ID'] || ''); }).filter(Boolean);
  const documentRows = readRowsByNameV413_('اسناد پرونده', 1).filter(function(r){ return eqV413_(r['Case ID'], caseId); });
  const documentIds = documentRows.map(function(r){ return String(r['Document ID'] || ''); }).filter(Boolean);

  documentRows.forEach(function(r) {
    const fid = String(r['Drive File ID'] || extractDriveIdV413_(r['لینک فایل'] || '') || '');
    if (fid && trashDriveIdV413_(fid)) result.driveTrashed++;
  });
  readRowsByNameV413_('اسناد پرونده‌ها', 1).forEach(function(r) {
    if (eqV413_(r['شناسه پرونده'], caseId)) {
      const fid = extractDriveIdV413_(r['لینک فایل'] || '');
      if (fid && trashDriveIdV413_(fid)) result.driveTrashed++;
    }
  });

  result.rows += deleteRowsWhereV413_('پیام‌های تسک مشتری', 1, function(r){ return customerTaskIds.indexOf(String(r['Task ID'] || '')) >= 0; });
  result.rows += deleteRowsWhereV413_('تسک‌های مشتریان', 1, function(r){ return eqV413_(r['شناسه پرونده'], caseId); });
  result.rows += deleteRowsWhereV413_('نسخه‌های اسناد', 1, function(r){ return eqV413_(r['Case ID'], caseId) || documentIds.indexOf(String(r['Document ID'] || '')) >= 0; });
  result.rows += deleteRowsWhereV413_('اسناد پرونده', 1, function(r){ return eqV413_(r['Case ID'], caseId); });
  result.rows += deleteRowsWhereV413_('اسناد پرونده‌ها', 1, function(r){ return eqV413_(r['شناسه پرونده'], caseId); });
  result.rows += deleteRowsWhereV413_('Case Assignments', 1, function(r){ return eqV413_(r['Case ID'], caseId); });
  result.rows += deleteRowsWhereV413_('Assignment History', 1, function(r){ return eqV413_(r['Case ID'], caseId); });
  result.rows += deleteRowsWhereV413_('تسک‌ها', 1, function(r){ return r['نوع ارتباط'] === 'پرونده' && eqV413_(r['شناسه مرتبط'], caseId); });
  result.rows += deleteRowsWhereV413_('کارهای روزانه', 1, function(r){ return eqV413_(r['شماره پرونده'], caseId) || (!!row['شماره پرونده واقعی'] && eqV413_(r['شماره پرونده'], row['شماره پرونده واقعی'])); });
  result.rows += deleteRowsWhereV413_('پرونده‌ها', 1, function(r){ return eqV413_(r['Case ID'], caseId); });
  safeLogDeleteV413_(actorUserId, 'cases', caseId, result);
  return result;
}

function deleteCustomerCascadeV413_(customerId, actorUserId) {
  const row = getRowById(SHEETS.customers, customerId);
  if (!row) throw new Error('Customer ID پیدا نشد.');
  const result = newDeleteResultV413_('customers', customerId);

  const userIds = readRowsByNameV413_('مدیریت کاربران', 4).filter(function(r){ return eqV413_(r['Customer ID'], customerId); }).map(function(r){ return String(r['User ID'] || ''); }).filter(Boolean);
  userIds.forEach(function(uid) {
    try { result.children.push(deleteUserCascadeV413_(uid, actorUserId)); } catch (e) { result.errors.push('user ' + uid + ': ' + String(e.message || e)); }
  });

  const caseIds = readRowsByNameV413_('پرونده‌ها', 1).filter(function(r){ return eqV413_(r['Customer ID'], customerId); }).map(function(r){ return String(r['Case ID'] || ''); }).filter(Boolean);
  caseIds.forEach(function(cid) {
    try { result.children.push(deleteCaseCascadeV413_(cid, actorUserId)); } catch (e) { result.errors.push('case ' + cid + ': ' + String(e.message || e)); }
  });

  const customerTaskIds = readRowsByNameV413_('تسک‌های مشتریان', 1).filter(function(r){ return eqV413_(r['مشتری ID'], customerId); }).map(function(r){ return String(r['Task ID'] || ''); }).filter(Boolean);
  result.rows += deleteRowsWhereV413_('پیام‌های تسک مشتری', 1, function(r){ return customerTaskIds.indexOf(String(r['Task ID'] || '')) >= 0; });
  result.rows += deleteRowsWhereV413_('تسک‌های مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); });
  result.rows += deleteRowsWhereV413_('دسترسی مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); });
  result.rows += deleteRowsWhereV413_('اسناد مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); });
  result.rows += deleteRowsWhereV413_('Provisioning Queue', 1, function(r){ return eqV413_(r['Customer ID'], customerId); });
  result.rows += deleteRowsWhereV413_('Provisioning Log', 1, function(r){ return eqV413_(r['Customer ID'], customerId); });
  result.rows += deleteRowsWhereV413_('Case Assignments', 1, function(r){ return eqV413_(r['Customer ID'], customerId); });
  result.rows += deleteRowsWhereV413_('تسک‌ها', 1, function(r){ return r['نوع ارتباط'] === 'مشتری' && eqV413_(r['شناسه مرتبط'], customerId); });

  const folderId = extractDriveIdV413_(row['📁 پوشه اسناد'] || '');
  if (folderId && trashDriveIdV413_(folderId)) result.driveTrashed++;
  result.rows += deleteRowsWhereV413_('مشتریان', 1, function(r){ return eqV413_(r['مشتری ID'], customerId); });
  safeLogDeleteV413_(actorUserId, 'customers', customerId, result);
  return result;
}

function deleteTaskCascadeV413_(taskId, actorUserId) {
  const row = getRowById(SHEETS.tasks, taskId);
  if (!row) throw new Error('Task ID پیدا نشد.');
  const result = newDeleteResultV413_('tasks', taskId);
  result.rows += deleteRowsWhereV413_('پیام‌های تسک مشتری', 1, function(r){ return eqV413_(r['Task ID'], taskId); });
  result.rows += deleteRowsWhereV413_('تسک‌های مشتریان', 1, function(r){ return eqV413_(r['Task ID'], taskId); });
  result.rows += deleteRowsWhereV413_('بازاریابی و پیگیری', 1, function(r){ return eqV413_(r['Source Task ID'], taskId); });
  result.rows += deleteRowsWhereV413_('تسک‌ها', 1, function(r){ return eqV413_(r['Task ID'], taskId); });
  safeLogDeleteV413_(actorUserId, 'tasks', taskId, result);
  return result;
}

function newDeleteResultV413_(entity, id) {
  return { entity: entity, id: id, rows: 0, referencesCleared: 0, driveTrashed: 0, children: [], errors: [] };
}

function formatDeleteResultV413_(r) {
  let rows = Number(r.rows || 0), refs = Number(r.referencesCleared || 0), drive = Number(r.driveTrashed || 0);
  (r.children || []).forEach(function(c){ rows += Number(c.rows || 0); refs += Number(c.referencesCleared || 0); drive += Number(c.driveTrashed || 0); });
  let text = '🧹 ردیف‌های حذف‌شده: <b>' + rows + '</b>\n' +
             '🔗 ارجاع‌های پاک‌شده: <b>' + refs + '</b>\n' +
             '🗂 فایل/پوشه منتقل‌شده به Trash: <b>' + drive + '</b>';
  if (r.errors && r.errors.length) text += '\n⚠️ خطاهای فرعی: <b>' + r.errors.length + '</b>';
  return text;
}

function readRowsByNameV413_(sheetName, headerRow) {
  const sh = getCRMSpreadsheet().getSheetByName(sheetName);
  if (!sh) return [];
  const lastCol = sh.getLastColumn();
  const start = Number(headerRow || 1) + 1;
  if (lastCol < 1 || sh.getLastRow() < start) return [];
  const headers = sh.getRange(Number(headerRow || 1), 1, 1, lastCol).getDisplayValues()[0].map(function(v){ return String(v || '').trim(); });
  const vals = sh.getRange(start, 1, sh.getLastRow() - Number(headerRow || 1), lastCol).getValues();
  return vals.map(function(row, idx){
    const o = { __rowNum: start + idx };
    headers.forEach(function(h,i){ if (h) o[h] = row[i]; });
    return o;
  }).filter(function(o){ return headers.some(function(h){ return h && String(o[h] == null ? '' : o[h]).trim() !== ''; }); });
}

function deleteRowsWhereV413_(sheetName, headerRow, predicate) {
  const sh = getCRMSpreadsheet().getSheetByName(sheetName);
  if (!sh) return 0;
  const rows = readRowsByNameV413_(sheetName, headerRow).filter(function(r){ try { return !!predicate(r); } catch (_) { return false; } });
  rows.sort(function(a,b){ return b.__rowNum - a.__rowNum; }).forEach(function(r){ sh.deleteRow(r.__rowNum); });
  return rows.length;
}

function countRowsWhereV413_(sheetName, headerRow, predicate) {
  return readRowsByNameV413_(sheetName, headerRow).filter(function(r){ try { return !!predicate(r); } catch (_) { return false; } }).length;
}

function patchRowsWhereV413_(sheetName, headerRow, predicate, patch) {
  const sh = getCRMSpreadsheet().getSheetByName(sheetName);
  if (!sh) return 0;
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(Number(headerRow || 1),1,1,lastCol).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
  let count = 0;
  readRowsByNameV413_(sheetName, headerRow).forEach(function(r){
    let match = false; try { match = !!predicate(r); } catch (_) {}
    if (!match) return;
    const row = sh.getRange(r.__rowNum,1,1,lastCol).getValues()[0];
    Object.keys(patch).forEach(function(k){ const idx=headers.indexOf(k); if(idx>=0) row[idx]=patch[k]; });
    sh.getRange(r.__rowNum,1,1,lastCol).setValues([row]);
    count++;
  });
  return count;
}

function eqV413_(a,b) { return String(a == null ? '' : a).trim() === String(b == null ? '' : b).trim(); }

function extractDriveIdV413_(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  let m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  m = s.match(/folders\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  return '';
}

function protectedDriveIdsV413_() {
  const o = {};
  o[SPREADSHEET_ID] = true;
  Object.keys(DASHBOARD_TEMPLATES).forEach(function(k){ o[String(DASHBOARD_TEMPLATES[k])] = true; });
  return o;
}

function trashDriveIdV413_(fileId) {
  fileId = String(fileId || '');
  if (!fileId || protectedDriveIdsV413_()[fileId]) return false;
  try { DriveApp.getFileById(fileId).setTrashed(true); return true; } catch (_) {}
  try { DriveApp.getFolderById(fileId).setTrashed(true); return true; } catch (_) {}
  return false;
}

function clearFastCachesV413_() {
  try { CacheService.getScriptCache().remove('KARATARHIS_FAST_STATS_V48'); } catch (_) {}
}

function safeLogDeleteV413_(actor, entity, id, result) {
  try { logSystem('hard_delete', entity + ' | rows=' + Number(result.rows || 0) + ' | drive=' + Number(result.driveTrashed || 0) + ' | actor=' + String(actor || '')); } catch (_) {}
}

// ----- Google Sheet admin menu -----
function installSheetDeleteMenuTriggerV413() {
  const handler = 'handleSheetOpenV413';
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === handler) { ScriptApp.deleteTrigger(t); removed++; }
  });
  const trigger = ScriptApp.newTrigger(handler).forSpreadsheet(SPREADSHEET_ID).onOpen().create();
  return { ok: true, handler: handler, triggerId: trigger.getUniqueId(), removedDuplicates: removed };
}

function handleSheetOpenV413(e) {
  addDeleteMenuV413_();
}

function addDeleteMenuV413_() {
  try {
    SpreadsheetApp.getUi().createMenu('🗑 مدیریت حذف')
      .addItem('حذف کامل رکورد انتخاب‌شده', 'deleteSelectedRecordFromSheetV413')
      .addSeparator()
      .addItem('راهنمای حذف', 'showDeleteHelpV413')
      .addToUi();
  } catch (_) {}
}

function onOpen() {
  addDeleteMenuV413_();
}

function showDeleteHelpV413() {
  SpreadsheetApp.getUi().alert(
    'حذف کامل',
    'روی یک ردیف در یکی از شیت‌های «مدیریت کاربران»، «Users»، «مشتریان»، «پرونده‌ها» یا «تسک‌ها» کلیک کنید و از منوی «🗑 مدیریت حذف» گزینه حذف کامل را بزنید. حذف پس از تأیید، به صورت Cascade انجام می‌شود.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function deleteSelectedRecordFromSheetV413() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();
  const rowNum = sh.getActiveRange().getRow();
  const name = sh.getName();
  let entity = '', headerRow = 1, idHeader = '';
  if (name === 'مدیریت کاربران') { entity='users'; headerRow=4; idHeader='User ID'; }
  else if (name === 'Users') { entity='users'; headerRow=1; idHeader='User ID'; }
  else if (name === 'مشتریان') { entity='customers'; headerRow=1; idHeader='مشتری ID'; }
  else if (name === 'پرونده‌ها') { entity='cases'; headerRow=1; idHeader='Case ID'; }
  else if (name === 'تسک‌ها') { entity='tasks'; headerRow=1; idHeader='Task ID'; }
  else {
    SpreadsheetApp.getUi().alert('این شیت برای حذف Cascade پشتیبانی نمی‌شود.');
    return;
  }
  if (rowNum <= headerRow) { SpreadsheetApp.getUi().alert('ابتدا یکی از ردیف‌های داده را انتخاب کنید.'); return; }
  const headers = sh.getRange(headerRow,1,1,sh.getLastColumn()).getDisplayValues()[0];
  const idx = headers.indexOf(idHeader);
  if (idx < 0) { SpreadsheetApp.getUi().alert('ستون شناسه پیدا نشد: ' + idHeader); return; }
  const id = String(sh.getRange(rowNum, idx+1).getDisplayValue() || '').trim();
  if (!id) { SpreadsheetApp.getUi().alert('شناسه رکورد خالی است.'); return; }
  const ui = SpreadsheetApp.getUi();
  const ans = ui.alert('تأیید حذف کامل', 'آیا رکورد ' + id + ' و تمام اطلاعات وابسته آن حذف شود؟ فایل‌های وابسته به Trash منتقل می‌شوند.', ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) return;
  try {
    const result = deleteEntityCascadeV413_(entity, id, 'SHEET_ADMIN');
    clearFastCachesV413_();
    try { syncAllActiveWorkspacesV412(); } catch (_) {}
    ui.alert('حذف کامل انجام شد', 'شناسه: ' + id + '\nردیف‌های حذف‌شده: ' + result.rows + '\nفایل/پوشه‌های Trash: ' + result.driveTrashed, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('خطا در حذف', String(err && err.message ? err.message : err), ui.ButtonSet.OK);
  }
}

function testHardDeleteRoutesV413() {
  const samples = ['users:delete','customers:delete','cases:delete','tasks:delete','delconfirm:users:ABC123:yes','delconfirm:customers:ABC123:cancel'];
  const result = samples.map(function(x){ return { callback:x, route:resolveCallbackRoute(x), ok:!!resolveCallbackRoute(x) }; });
  Logger.log(JSON.stringify(result,null,2));
  return result;
}

/************************************************************
 * V4.14 — ROLE-AWARE GOOGLE SHEET EDIT / DELETE
 * ----------------------------------------------------------
 * 1) اصلاح Data Validation شیت مدیریت کاربران.
 * 2) Admin: ویرایش مستقیم در CRM + حذف Cascade از منوی شیت.
 * 3) Customer Manager: تب‌های مشتری/پرونده/تسک در Workspace قابل مشاهده و
 *    ویرایش مستقیم هستند؛ تغییرات با onEdit به CRM اصلی Push می‌شوند.
 * 4) حذف کامل پرونده/تسک مدیر مشتری از منوی Workspace با API داخلی امن.
 ************************************************************/

const V414_MANAGER_VISIBLE_TABS = ['مشتریان', 'پرونده‌ها', 'تسک‌ها'];
const V414_INTERNAL_SECRET_KEY = 'KARATARHIS_INTERNAL_API_SECRET_V414';

function getInternalApiSecretV414_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty(V414_INTERNAL_SECRET_KEY);
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(V414_INTERNAL_SECRET_KEY, secret);
  }
  return secret;
}

function repairUserManagementValidationsV414_() {
  const sh = getCRMSpreadsheet().getSheetByName('مدیریت کاربران');
  if (!sh) throw new Error('شیت مدیریت کاربران پیدا نشد.');
  const startRow = 5;
  const rows = Math.max(1, sh.getMaxRows() - startRow + 1);
  function rule(values) {
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  }
  sh.getRange(startRow, 6, rows, 1).setDataValidation(rule(['مدیر','کارمند داخلی','مدیر مشتری','کارمند مشتری']));
  sh.getRange(startRow, 9, rows, 1).setDataValidation(rule(['پیشرفته','مدیریتی','عملیاتی','محدود','سفارشی']));
  sh.getRange(startRow, 10, rows, 1).setDataValidation(rule(['فعال','غیرفعال','در انتظار فعالسازی','آرشیو']));
  sh.getRange(startRow, 12, rows, 1).setDataValidation(rule(['فعال','ایجاد شد','قطع شده','خطا']));
  sh.getRange(startRow, 13, rows, 1).setDataValidation(rule(['بله','خیر','در انتظار']));
  sh.getRange(startRow, 14, rows, 1).setDataValidation(rule(['در صف','در حال پردازش','انجام شد','نیازمند بررسی','خطا','غیرفعال']));
  try { sh.getRange(startRow, 3, rows, 1).setNumberFormat('@'); } catch (_) {}
  try { sh.getRange(startRow, 5, rows, 1).setNumberFormat('@'); } catch (_) {}
  return { ok: true, version: APP_VERSION };
}

function getWorkspaceContextV414_(spreadsheetId) {
  spreadsheetId = String(spreadsheetId || '').trim();
  if (!spreadsheetId) return null;
  if (spreadsheetId === SPREADSHEET_ID) return { main: true, role: 'مدیر', userId: 'CRM_ADMIN', customerId: '*', spreadsheetId: spreadsheetId };
  const rows = readRows(SHEETS.mapping);
  for (let i = rows.length - 1; i >= 0; i--) {
    const fid = String(rows[i]['Spreadsheet ID'] || parseDriveFileId_(rows[i]['Workspace URL'] || '') || '').trim();
    if (fid !== spreadsheetId) continue;
    return {
      main: false,
      mappingId: String(rows[i]['Mapping ID'] || ''),
      userId: String(rows[i]['User ID'] || ''),
      role: normalizeRole(String(rows[i]['نقش'] || '')),
      customerId: String(rows[i]['Customer ID'] || ''),
      email: String(rows[i]['Gmail مشترک‌شده'] || '').trim().toLowerCase(),
      spreadsheetId: spreadsheetId
    };
  }
  return null;
}

function entityFromWorkspaceSheetV414_(sheetName) {
  return { 'مشتریان': 'customers', 'پرونده‌ها': 'cases', 'تسک‌ها': 'tasks' }[String(sheetName || '')] || '';
}

function managerRowBelongsToScopeV414_(entity, row, ctx) {
  if (!ctx || ctx.role !== 'مدیر مشتری' || !ctx.customerId) return false;
  const customerId = String(ctx.customerId);
  if (entity === 'customers') return String(row['مشتری ID'] || '') === customerId;
  if (entity === 'cases') return String(row['Customer ID'] || '') === customerId;
  if (entity === 'tasks') {
    const type = String(row['نوع ارتباط'] || '');
    const rel = String(row['شناسه مرتبط'] || '');
    if (type === 'مشتری') return rel === customerId;
    if (type === 'پرونده') {
      const c = getRowById(SHEETS.cases, rel);
      return !!c && String(c['Customer ID'] || '') === customerId;
    }
  }
  return false;
}

function managerCanEditFieldV414_(entity, field) {
  const denied = {
    customers: ['مشتری ID','📁 پوشه اسناد','مدیر اصلی','موبایل مدیر','Gmail مدیر','Telegram ID مدیر','User ID مدیر','Workspace مدیر','وضعیت دسترسی مدیر','فعال؟','تاریخ ایجاد','ایجادکننده'],
    cases: ['Case ID','Customer ID','مشتری','تسک باز','ایجادکننده','تاریخ ایجاد','Sync Version','Sync Source','Sync Updated At'],
    tasks: ['Task ID','نوع ارتباط','شناسه مرتبط','شرکت/پرونده','ایجادکننده','تاریخ ایجاد','آخرین فعالیت','تعداد پیام']
  };
  return (denied[entity] || []).indexOf(String(field || '')) < 0;
}

function getWorkspaceRowV414_(sh, rowNum, cfg) {
  const headers = getHeaders(cfg);
  const vals = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  const row = {};
  headers.forEach(function(h, i){ if (h) row[h] = vals[i]; });
  return row;
}

function revertManagerWorkspaceV414_(ctx) {
  try {
    const user = getRowById(SHEETS.usersRaw, ctx.userId) || getRowById(SHEETS.users, ctx.userId);
    if (!user) return;
    syncWorkspaceDataV412_({ fileId: ctx.spreadsheetId, url: 'https://docs.google.com/spreadsheets/d/' + ctx.spreadsheetId + '/edit', type: ctx.role }, user);
  } catch (_) {}
}

function handleCustomerManagerWorkspaceEditV414(e) {
  try {
    if (!e || !e.source || !e.range) return;
    const ss = e.source;
    const ctx = getWorkspaceContextV414_(ss.getId());
    if (!ctx || ctx.role !== 'مدیر مشتری') return;
    const sh = e.range.getSheet();
    const entity = entityFromWorkspaceSheetV414_(sh.getName());
    if (!entity) return;
    if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1 || e.range.getRow() <= 1) {
      revertManagerWorkspaceV414_(ctx);
      try { ss.toast('ویرایش گروهی پشتیبانی نمی‌شود؛ هر سلول را جداگانه ویرایش کنید.', 'کاراترخیص', 5); } catch (_) {}
      return;
    }

    const cfg = SHEETS[entity];
    const headers = getHeaders(cfg);
    const col = e.range.getColumn();
    if (col > headers.length) return;
    const field = headers[col - 1];
    if (!field || !managerCanEditFieldV414_(entity, field)) {
      revertManagerWorkspaceV414_(ctx);
      try { ss.toast('این فیلد سیستمی است و مدیر مشتری اجازه ویرایش آن را ندارد.', 'دسترسی محدود', 5); } catch (_) {}
      return;
    }

    const row = getWorkspaceRowV414_(sh, e.range.getRow(), cfg);
    if (!managerRowBelongsToScopeV414_(entity, row, ctx)) {
      revertManagerWorkspaceV414_(ctx);
      try { ss.toast('این رکورد خارج از محدوده مشتری شماست.', 'دسترسی محدود', 5); } catch (_) {}
      return;
    }

    const id = String(row[cfg.idHeader] || '').trim();
    if (!id) {
      revertManagerWorkspaceV414_(ctx);
      return;
    }
    const value = e.range.getValue();
    const ok = updateEntityField(entity, id, field, value);
    if (!ok) throw new Error('رکورد اصلی برای بروزرسانی پیدا نشد: ' + id);
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    clearFastCachesV413_();
    try { logSystem('customer_manager_sheet_edit', entity + ' | ' + id + ' | ' + field + ' | user=' + ctx.userId); } catch (_) {}
    try { ss.toast('تغییر در CRM اصلی ثبت شد.', 'کاراترخیص', 3); } catch (_) {}
  } catch (err) {
    try { logSystem('customer_manager_sheet_edit_error', String(err && err.stack ? err.stack : err)); } catch (_) {}
  }
}

function prepareCustomerManagerWorkspaceV414_(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  V414_MANAGER_VISIBLE_TABS.forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (sh) { try { sh.showSheet(); } catch (_) {} }
  });
  ['سرنخ‌ها','تسک‌های مشتریان','اسناد پرونده'].forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (sh) { try { sh.hideSheet(); } catch (_) {} }
  });
  return true;
}

function writeWorkspaceDataSheetV414_(targetSs, tabName, sourceCfg, rows, user) {
  const headers = getHeaders(sourceCfg);
  let sh = targetSs.getSheetByName(tabName);
  if (!sh) sh = targetSs.insertSheet(tabName);
  ensureTargetSheetSizeV412_(sh, Math.max(50, (rows || []).length + 5), Math.max(1, headers.length));
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows && rows.length) {
    const matrix = rows.map(function(r){ return headers.map(function(h){ return Object.prototype.hasOwnProperty.call(r,h) ? r[h] : ''; }); });
    sh.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
  }
  sh.setFrozenRows(1);
  const role = normalizeRole(user && user['نقش']);
  if (role === 'مدیر مشتری' && V414_MANAGER_VISIBLE_TABS.indexOf(tabName) >= 0) {
    try { sh.showSheet(); } catch (_) {}
    try { sh.getRange(1,1,1,headers.length).setNote('فیلدهای شناسه و سیستمی محافظت منطقی دارند؛ تغییر مجاز به CRM اصلی منتقل می‌شود.'); } catch (_) {}
  } else {
    try { sh.hideSheet(); } catch (_) {}
  }
}

// Override V4.12: Customer Manager gets editable scoped tabs.
function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');
  const ss = ensureWorkspaceStructureV412_(fileId);
  const scoped = getScopedWorkspaceDataV412_(user);
  writeWorkspaceDataSheetV414_(ss, 'مشتریان', SHEETS.customers, scoped.customers, user);
  writeWorkspaceDataSheetV414_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks, user);
  writeWorkspaceDataSheetV414_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks, user);
  writeWorkspaceDataSheetV414_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments, user);
  repairWorkspaceDashboardFormulasV412_(ss);
  if (normalizeRole(user['نقش']) === 'مدیر مشتری') prepareCustomerManagerWorkspaceV414_(fileId);
  SpreadsheetApp.flush();
  return { customers: scoped.customers.length, cases: scoped.cases.length, tasks: scoped.tasks.length, leads: scoped.leads.length, customerTasks: scoped.customerTasks.length, caseDocuments: scoped.caseDocuments.length };
}

function installTriggersForCustomerManagerFileV414_(fileId) {
  fileId = String(fileId || '').trim();
  if (!fileId) return { ok:false, reason:'missing_file_id' };
  const handlers = ['handleRoleAwareSheetOpenV414','handleCustomerManagerWorkspaceEditV414'];
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) < 0) return;
    try {
      if (t.getTriggerSourceId && String(t.getTriggerSourceId() || '') === fileId) { ScriptApp.deleteTrigger(t); removed++; }
    } catch (_) {}
  });
  const openTrigger = ScriptApp.newTrigger('handleRoleAwareSheetOpenV414').forSpreadsheet(fileId).onOpen().create();
  const editTrigger = ScriptApp.newTrigger('handleCustomerManagerWorkspaceEditV414').forSpreadsheet(fileId).onEdit().create();
  try { prepareCustomerManagerWorkspaceV414_(fileId); } catch (_) {}
  return { ok:true, fileId:fileId, openTrigger:openTrigger.getUniqueId(), editTrigger:editTrigger.getUniqueId(), removedDuplicates:removed };
}

function installRoleAwareSheetTriggersV414() {
  const handlers = ['handleRoleAwareSheetOpenV414','handleCustomerManagerWorkspaceEditV414'];
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  const report = { main: null, customerManagers: [], errors: [] };
  report.main = ScriptApp.newTrigger('handleRoleAwareSheetOpenV414').forSpreadsheet(SPREADSHEET_ID).onOpen().create().getUniqueId();
  const seen = {};
  readRows(SHEETS.mapping).forEach(function(r) {
    if (normalizeRole(r['نقش']) !== 'مدیر مشتری') return;
    const fid = String(r['Spreadsheet ID'] || parseDriveFileId_(r['Workspace URL'] || '') || '').trim();
    if (!fid || seen[fid]) return;
    seen[fid] = true;
    try { report.customerManagers.push(installTriggersForCustomerManagerFileV414_(fid)); }
    catch (err) { report.errors.push({ fileId:fid, error:String(err) }); }
  });
  return report;
}

// Override mapping upsert so newly provisioned Customer Manager workspaces get triggers.
function upsertWorkspaceMappingForUser_(user, workspace) {
  const existingRow = findRowNumber(SHEETS.mapping, 'User ID', user['User ID']);
  let mappingId = '';
  if (existingRow) {
    const sh = getSheet(SHEETS.mapping);
    const headers = getHeaders(SHEETS.mapping);
    const idx = headers.indexOf('Mapping ID');
    if (idx >= 0) mappingId = String(sh.getRange(existingRow, idx + 1).getDisplayValue() || '').trim();
  }
  if (!mappingId) mappingId = 'MAP-' + user['User ID'];
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  upsertObject(SHEETS.mapping, 'User ID', user['User ID'], {
    'Mapping ID': mappingId,
    'User ID': user['User ID'],
    'نام کاربر': user['نام کامل'],
    'نقش': user['نقش'],
    'Customer ID': user['Customer ID'] || '',
    'نوع Workspace': workspace.type || user['نقش'],
    'Spreadsheet ID': fileId,
    'Workspace URL': workspace.url,
    'Gmail مشترک‌شده': user['Gmail / Email'] || '',
    'وضعیت Provisioning': 'انجام شد',
    'آخرین Sync': nowFa(),
    'یادداشت': 'ساخت/همگام‌سازی | ' + APP_VERSION
  });
  if (normalizeRole(user['نقش']) === 'مدیر مشتری' && fileId) {
    try { installTriggersForCustomerManagerFileV414_(fileId); } catch (err) { try { logSystem('manager_trigger_install_error', String(err)); } catch (_) {} }
  }
}

function isSheetAdminV414_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  try {
    const owner = String(DriveApp.getFileById(SPREADSHEET_ID).getOwner().getEmail() || '').trim().toLowerCase();
    if (email && owner && email === owner) return true;
  } catch (_) {}
  const admins = readRows(SHEETS.usersRaw).filter(function(r){ return normalizeRole(r['نقش']) === 'مدیر' && String(r['وضعیت'] || '') !== 'غیرفعال'; });
  if (!email) return false;
  return admins.some(function(r){ return String(r['Gmail / Email'] || '').trim().toLowerCase() === email; });
}

function addAdminSheetMenuV414_() {
  SpreadsheetApp.getUi().createMenu('✏️ مدیریت CRM')
    .addItem('🗑 حذف کامل ردیف انتخاب‌شده', 'deleteSelectedRecordFromSheetV414')
    .addItem('🔄 همگام‌سازی Workspaceها', 'menuSyncAllWorkspacesV414')
    .addSeparator()
    .addItem('ℹ️ راهنمای ویرایش و حذف', 'showRoleAwareSheetHelpV414')
    .addToUi();
}

function addCustomerManagerSheetMenuV414_() {
  SpreadsheetApp.getUi().createMenu('✏️ مدیریت مشتری')
    .addItem('🗑 حذف کامل ردیف انتخاب‌شده', 'deleteSelectedRecordFromCustomerManagerSheetV414')
    .addItem('🔄 تازه‌سازی اطلاعات از CRM', 'refreshCustomerManagerWorkspaceV414')
    .addSeparator()
    .addItem('ℹ️ راهنما', 'showRoleAwareSheetHelpV414')
    .addToUi();
}

function handleRoleAwareSheetOpenV414(e) {
  try {
    const ss = e && e.source ? e.source : SpreadsheetApp.getActiveSpreadsheet();
    const ctx = getWorkspaceContextV414_(ss.getId());
    if (!ctx) return;
    if (ctx.main) addAdminSheetMenuV414_();
    else if (ctx.role === 'مدیر مشتری') {
      prepareCustomerManagerWorkspaceV414_(ss.getId());
      addCustomerManagerSheetMenuV414_();
    }
  } catch (_) {}
}

function onOpen(e) { handleRoleAwareSheetOpenV414(e); }

function showRoleAwareSheetHelpV414() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ctx = getWorkspaceContextV414_(ss.getId());
  const ui = SpreadsheetApp.getUi();
  if (ctx && ctx.role === 'مدیر مشتری' && !ctx.main) {
    ui.alert('مدیریت مشتری', 'در تب‌های «مشتریان»، «پرونده‌ها» و «تسک‌ها» سلول‌های مجاز را مستقیم ویرایش کنید؛ تغییر در CRM اصلی ثبت می‌شود. شناسه‌ها و فیلدهای سیستمی قابل تغییر نیستند. حذف کامل برای پرونده و تسک از همین منو انجام می‌شود. حذف کل مشتری و مدیریت کاربران فقط برای ادمین مجاز است.', ui.ButtonSet.OK);
  } else {
    ui.alert('مدیریت CRM', 'ادمین می‌تواند اطلاعات شیت‌های اصلی را مستقیم ویرایش کند. برای حذف کامل، ردیف را انتخاب و گزینه حذف کامل را بزنید. حذف Cascade اطلاعات وابسته را نیز پاک و فایل‌های مرتبط را به Trash منتقل می‌کند.', ui.ButtonSet.OK);
  }
}

function deleteSelectedRecordFromSheetV414() {
  if (!isSheetAdminV414_()) { SpreadsheetApp.getUi().alert('فقط ادمین مجاز به حذف کامل از CRM اصلی است.'); return; }
  return deleteSelectedRecordFromSheetV413();
}

function menuSyncAllWorkspacesV414() {
  if (!isSheetAdminV414_()) { SpreadsheetApp.getUi().alert('دسترسی ادمین لازم است.'); return; }
  const ui = SpreadsheetApp.getUi();
  try {
    const r = syncAllActiveWorkspacesV412();
    ui.alert('همگام‌سازی انجام شد', 'Workspaceهای پردازش‌شده: ' + String(r.processed || 0), ui.ButtonSet.OK);
  } catch (err) { ui.alert('خطا', String(err && err.message ? err.message : err), ui.ButtonSet.OK); }
}

function callInternalApiV414_(payload) {
  payload = Object.assign({}, payload || {}, { internal_action: payload.internal_action, secret: getInternalApiSecretV414_() });
  const response = UrlFetchApp.fetch(WEB_APP_URL, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  const txt = response.getContentText();
  try { return JSON.parse(txt); } catch (_) { return { ok:false, error:txt }; }
}

function deleteSelectedRecordFromCustomerManagerSheetV414() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ctx = getWorkspaceContextV414_(ss.getId());
  const ui = SpreadsheetApp.getUi();
  if (!ctx || ctx.role !== 'مدیر مشتری') { ui.alert('این عملیات فقط در Workspace مدیر مشتری فعال است.'); return; }
  const sh = ss.getActiveSheet();
  const entity = entityFromWorkspaceSheetV414_(sh.getName());
  if (!entity) { ui.alert('حذف از این تب پشتیبانی نمی‌شود.'); return; }
  if (entity === 'customers') { ui.alert('حذف کامل مشتری فقط توسط ادمین CRM مجاز است. مدیر مشتری می‌تواند اطلاعات مشتری را ویرایش کند.'); return; }
  const rowNum = sh.getActiveRange().getRow();
  if (rowNum <= 1) { ui.alert('ابتدا یک ردیف داده را انتخاب کنید.'); return; }
  const cfg = SHEETS[entity];
  const row = getWorkspaceRowV414_(sh, rowNum, cfg);
  if (!managerRowBelongsToScopeV414_(entity, row, ctx)) { ui.alert('این رکورد خارج از محدوده مشتری شماست.'); return; }
  const id = String(row[cfg.idHeader] || '').trim();
  if (!id) { ui.alert('شناسه رکورد پیدا نشد.'); return; }
  const ans = ui.alert('تأیید حذف کامل', 'آیا ' + id + ' و اطلاعات وابسته آن حذف شود؟', ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) return;
  const result = callInternalApiV414_({ internal_action:'manager_delete', workspace_id:ss.getId(), entity:entity, id:id, actor_email:String(Session.getActiveUser().getEmail() || '') });
  if (result && result.ok) ui.alert('حذف انجام شد', 'شناسه: ' + id + '\nردیف‌های حذف‌شده: ' + String(result.rows || 0), ui.ButtonSet.OK);
  else ui.alert('حذف انجام نشد', String((result && result.error) || 'خطای نامشخص'), ui.ButtonSet.OK);
}

function refreshCustomerManagerWorkspaceV414() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ctx = getWorkspaceContextV414_(ss.getId());
  const ui = SpreadsheetApp.getUi();
  if (!ctx || ctx.role !== 'مدیر مشتری') { ui.alert('این عملیات فقط برای مدیر مشتری است.'); return; }
  const result = callInternalApiV414_({ internal_action:'manager_refresh', workspace_id:ss.getId(), actor_email:String(Session.getActiveUser().getEmail() || '') });
  if (result && result.ok) ui.alert('اطلاعات تازه‌سازی شد.', ui.ButtonSet.OK);
  else ui.alert('تازه‌سازی انجام نشد', String((result && result.error) || 'خطای نامشخص'), ui.ButtonSet.OK);
}

function handleInternalActionV414_(payload) {
  if (String(payload.secret || '') !== String(getInternalApiSecretV414_())) return { ok:false, error:'unauthorized' };
  const ctx = getWorkspaceContextV414_(payload.workspace_id);
  if (!ctx || ctx.role !== 'مدیر مشتری') return { ok:false, error:'workspace_not_authorized' };
  const actorEmail = String(payload.actor_email || '').trim().toLowerCase();
  if (ctx.email && actorEmail && ctx.email !== actorEmail) return { ok:false, error:'email_scope_mismatch' };
  const user = getRowById(SHEETS.usersRaw, ctx.userId) || getRowById(SHEETS.users, ctx.userId);
  if (!user) return { ok:false, error:'manager_user_not_found' };

  if (payload.internal_action === 'manager_refresh') {
    const counts = syncWorkspaceDataV412_({ fileId:ctx.spreadsheetId, url:'https://docs.google.com/spreadsheets/d/' + ctx.spreadsheetId + '/edit', type:ctx.role }, user);
    return { ok:true, counts:counts };
  }
  if (payload.internal_action === 'manager_delete') {
    const entity = String(payload.entity || '');
    if (['cases','tasks'].indexOf(entity) < 0) return { ok:false, error:'delete_scope_not_allowed' };
    const id = String(payload.id || '').trim();
    const cfg = SHEETS[entity];
    const row = getRowById(cfg, id);
    if (!row || !managerRowBelongsToScopeV414_(entity, row, ctx)) return { ok:false, error:'record_out_of_scope' };
    const result = deleteEntityCascadeV413_(entity, id, 'SHEET_CM:' + ctx.userId);
    clearFastCachesV413_();
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    try { syncAllActiveWorkspacesV412(); } catch (_) {}
    return { ok:true, rows:Number(result.rows || 0), driveTrashed:Number(result.driveTrashed || 0) };
  }
  return { ok:false, error:'unknown_internal_action' };
}

// Override doPost: internal Sheet API first, Telegram webhook otherwise.
function doPost(e) {
  let updateId = '';
  try {
    if (!e || !e.postData || !e.postData.contents) return jsonResponse({ ok:true, version:APP_VERSION });
    const raw = JSON.parse(e.postData.contents);
    if (raw && raw.internal_action) return jsonResponse(handleInternalActionV414_(raw));

    const update = raw;
    updateId = String(update.update_id || '');
    if (updateId && isDuplicateUpdate(updateId)) return jsonResponse({ ok:true, duplicate:true, version:APP_VERSION });
    if (update.callback_query) handleCallback(update.callback_query);
    else if (update.message) handleMessage(update.message);
    return jsonResponse({ ok:true, version:APP_VERSION });
  } catch (err) {
    if (updateId) { try { CacheService.getScriptCache().remove('TG_UPDATE_' + updateId); } catch (_) {} }
    try { logSystem('telegram_or_internal_error', String(err && err.stack ? err.stack : err)); } catch (_) {}
    return jsonResponse({ ok:false, handled_error:true, version:APP_VERSION, error:String(err && err.message ? err.message : err) });
  }
}

function testV414RoleAccess() {
  const report = {
    version: APP_VERSION,
    validations: repairUserManagementValidationsV414_(),
    mappings: readRows(SHEETS.mapping).map(function(r){ return { userId:r['User ID'], role:r['نقش'], customerId:r['Customer ID'], fileId:r['Spreadsheet ID'] }; }),
    triggers: listProjectTriggers()
  };
  Logger.log(JSON.stringify(report,null,2));
  return report;
}

// Final installer override for V4.14.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();
  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);
  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);
  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();
  const validations = repairUserManagementValidationsV414_();
  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}
  const sweep = enqueueUsersMissingWorkspaceV412_();
  const report = { ok:webhookOk, version:APP_VERSION, webhookUrl:actualUrl, removedTriggers:removedTriggers.length, sheetEditTrigger:sheetEditTrigger, queueTrigger:queueTrigger, syncTrigger:syncTrigger, roleAwareTriggers:roleAwareTriggers, validations:validations, templateRepair:templateRepair, sweep:sweep, triggersBefore:beforeTriggers };
  Logger.log(JSON.stringify(report,null,2));
  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}
  sendMessage(ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.14 نصب شد</b>' : '❌ <b>نصب کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n✏️ ویرایش مستقیم CRM ادمین: <b>فعال</b>' +
    '\n👔 ویرایش Workspace مدیر مشتری: <b>فعال</b>' +
    '\n🗑 حذف Cascade ادمین/مدیر مشتری: <b>فعال با Scope</b>' +
    '\n✅ Data Validation: <b>اصلاح شد</b>' +
    '\n📬 Queue Worker: <b>هر 1 دقیقه</b>' +
    '\n🔄 Workspace Sync: <b>هر 5 دقیقه</b>'
  );
  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.15 — PROVISIONING QUEUE VALIDATION FIX
 * ----------------------------------------------------------
 * Fixes:
 * 1) Queue column "نوع درخواست" is aligned with generated values.
 * 2) Queue status validation includes runtime statuses used by worker.
 * 3) Queue patching updates only requested cells and no longer rewrites
 *    the whole row, preventing unrelated strict validations from blocking.
 ************************************************************/

function getProvisioningRequestTypeV415_(role) {
  role = normalizeRole(role);
  if (role === 'مدیر') return 'ساخت Workspace مدیر';
  if (role === 'مدیر مشتری') return 'ساخت Workspace مدیر مشتری';
  if (role === 'کارمند مشتری') return 'ساخت Workspace کارمند مشتری';
  return 'ساخت Workspace کارمند داخلی';
}

function repairProvisioningQueueValidationsV415_() {
  const sh = getSheet(SHEETS.provisioningQueue);
  const startRow = 2;
  const rows = Math.max(1, sh.getMaxRows() - startRow + 1);

  function rule(values) {
    return SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .build();
  }

  sh.getRange(startRow, 2, rows, 1).setDataValidation(rule([
    'ساخت/همگام‌سازی Workspace',
    'ساخت Workspace مدیر',
    'ساخت Workspace مدیر مشتری',
    'ساخت Workspace کارمند مشتری',
    'ساخت Workspace کارمند داخلی',
    'تغییر Gmail',
    'غیرفعال‌سازی دسترسی',
    'فعال‌سازی مجدد'
  ]));

  sh.getRange(startRow, 13, rows, 1).setDataValidation(rule([
    'جدید',
    'در انتظار اطلاعات هویتی',
    'نیازمند Customer ID',
    'آماده ساخت',
    'در صف',
    'در حال پردازش',
    'در حال ساخت',
    'Workspace ساخته شد',
    'اشتراک‌گذاری شد',
    'انجام شد',
    'فعال',
    'خطا',
    'لغو شده'
  ]));

  return { ok: true, sheet: SHEETS.provisioningQueue.name, rows: rows };
}

// Override: do not rewrite the whole queue row when only one status/cell changes.
function patchProvisioningRequestV412_(requestId, patch) {
  const cfg = SHEETS.provisioningQueue;
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const rowNum = findRowNumber(cfg, 'Request ID', requestId);

  if (!rowNum) {
    appendObject(cfg, Object.assign({ 'Request ID': requestId }, patch || {}));
    return true;
  }

  const data = Object.assign({}, patch || {});
  Object.keys(data).forEach(function(key) {
    const idx = headers.indexOf(key);
    if (idx < 0) return;
    sh.getRange(rowNum, idx + 1).setValue(data[key]);
  });
  return true;
}

// Override: generate a queue request type that matches the strict dropdown.
function enqueueProvisioningRequestV412_(user, actor, source) {
  if (!user || !user['User ID']) throw new Error('User ID برای صف Provisioning الزامی است.');

  const open = findOpenProvisioningRequestV412_(user['User ID']);
  if (open) return { queued: true, requestId: open['Request ID'], duplicate: true };

  const role = normalizeRole(user['نقش']);
  const requestId = 'PRV-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();

  appendObject(SHEETS.provisioningQueue, {
    'Request ID': requestId,
    'نوع درخواست': getProvisioningRequestTypeV415_(role),
    'Customer ID': user['Customer ID'] || '',
    'شرکت': user['شرکت'] || '',
    'User ID': user['User ID'],
    'نام کاربر': user['نام کامل'] || '',
    'Gmail': user['Gmail / Email'] || '',
    'Telegram User ID': user['Telegram User ID'] || '',
    'Role': role,
    'Permission Profile': user['پروفایل دسترسی'] || defaultProfile(role),
    'Template Type': getRoleTemplateTypeV412_(role),
    'Template File ID': DASHBOARD_TEMPLATES[role] || '',
    'وضعیت': 'در صف',
    'Workspace File ID': '',
    'Workspace URL': '',
    'درخواست‌دهنده': actor || ADMIN_TELEGRAM_ID,
    'تاریخ درخواست': nowFa(),
    'خطا/یادداشت': source || 'SYSTEM'
  });

  appendProvisioningLogV412_(requestId, user, 'QUEUE', '', 'در صف', null, source || 'SYSTEM');
  return { queued: true, requestId: requestId, duplicate: false };
}

// Final installer override for V4.15.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok: webhookOk,
    version: APP_VERSION,
    webhookUrl: actualUrl,
    removedTriggers: removedTriggers.length,
    sheetEditTrigger: sheetEditTrigger,
    queueTrigger: queueTrigger,
    syncTrigger: syncTrigger,
    roleAwareTriggers: roleAwareTriggers,
    userValidations: userValidations,
    queueValidations: queueValidations,
    templateRepair: templateRepair,
    sweep: sweep,
    triggersBefore: beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));
  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.15 نصب شد</b>' : '❌ <b>نصب کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n📬 Queue Validation: <b>اصلاح شد</b>' +
    '\n⚙️ Queue Worker: <b>هر 1 دقیقه</b>' +
    '\n🔄 Workspace Sync: <b>هر 5 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() { return repairBotInstallation(); }

function testV415QueueValidation() {
  const result = {
    version: APP_VERSION,
    validationRepair: repairProvisioningQueueValidationsV415_(),
    queue: readRows(SHEETS.provisioningQueue).map(function(r) {
      return {
        requestId: r['Request ID'] || '',
        type: r['نوع درخواست'] || '',
        userId: r['User ID'] || '',
        status: r['وضعیت'] || ''
      };
    })
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/************************************************************
 * V4.16 — RAW USERS VALIDATION FIX
 * ----------------------------------------------------------
 * Fixes:
 * 1) Aligns strict validation in hidden Users table with runtime values.
 * 2) Prevents Google Access / Telegram Linked from blocking queue worker.
 * 3) Adds one-shot repair + retry helper.
 ************************************************************/

function repairRawUsersValidationsV416_() {
  const sh = getSheet(SHEETS.usersRaw);
  const startRow = 2;
  const rows = Math.max(1, sh.getMaxRows() - startRow + 1);

  function rule(values) {
    return SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .build();
  }

  // F = نقش
  sh.getRange(startRow, 6, rows, 1).setDataValidation(
    rule(['مدیر','کارمند داخلی','مدیر مشتری','کارمند مشتری'])
  );

  // I = پروفایل دسترسی
  sh.getRange(startRow, 9, rows, 1).setDataValidation(
    rule(['پیشرفته','مدیریتی','عملیاتی','محدود','سفارشی'])
  );

  // J = وضعیت
  sh.getRange(startRow, 10, rows, 1).setDataValidation(
    rule(['فعال','غیرفعال','در انتظار فعالسازی','آرشیو'])
  );

  // L = Google Access
  sh.getRange(startRow, 12, rows, 1).setDataValidation(
    rule(['فعال','ایجاد شد','قطع شده','خطا'])
  );

  // M = Telegram Linked
  sh.getRange(startRow, 13, rows, 1).setDataValidation(
    rule(['بله','خیر','در انتظار'])
  );

  return { ok:true, sheet:SHEETS.usersRaw.name, rows:rows };
}

function repairAndRetryProvisioningV416() {
  const queueValidation = repairProvisioningQueueValidationsV415_();
  const rawUsersValidation = repairRawUsersValidationsV416_();
  const retry = retryFailedProvisioningV412();
  const worker = processProvisioningQueue(10);
  const result = {
    ok: !!worker.ok,
    version: APP_VERSION,
    queueValidation: queueValidation,
    rawUsersValidation: rawUsersValidation,
    retry: retry,
    worker: worker
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// Final installer override for V4.16.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok: webhookOk,
    version: APP_VERSION,
    webhookUrl: actualUrl,
    removedTriggers: removedTriggers.length,
    sheetEditTrigger: sheetEditTrigger,
    queueTrigger: queueTrigger,
    syncTrigger: syncTrigger,
    roleAwareTriggers: roleAwareTriggers,
    userValidations: userValidations,
    queueValidations: queueValidations,
    rawUsersValidations: rawUsersValidations,
    templateRepair: templateRepair,
    sweep: sweep,
    triggersBefore: beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));
  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.16 نصب شد</b>' : '❌ <b>نصب کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n📬 Queue Validation: <b>اصلاح شد</b>' +
    '\n👥 Users Validation: <b>اصلاح شد</b>' +
    '\n⚙️ Queue Worker: <b>هر 1 دقیقه</b>' +
    '\n🔄 Workspace Sync: <b>هر 5 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.17 — DIRECT CUSTOMER SHEET FOLDER AUTOMATION
 * ----------------------------------------------------------
 * Direct edits in sheet "مشتریان" now support:
 * - automatic Customer ID creation
 * - automatic Drive folder creation
 * - creation of 00-اسناد پایه + پرونده‌ها subfolders
 * - automatic folder URL write-back
 * - default active flag / creation date
 ************************************************************/

function getCustomerRowObjectV417_(rowNumber) {
  const cfg = SHEETS.customers;
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const values = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const obj = {};
  headers.forEach(function(h, i) { obj[h] = values[i]; });
  return { sheet: sh, headers: headers, row: obj };
}

function patchCustomerRowV417_(rowNumber, patch) {
  const cfg = SHEETS.customers;
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  Object.keys(patch || {}).forEach(function(key) {
    const idx = headers.indexOf(key);
    if (idx < 0) return;
    sh.getRange(rowNumber, idx + 1).setValue(patch[key]);
  });
}

function provisionCustomerRowV417_(rowNumber, source) {
  if (rowNumber <= SHEETS.customers.headerRow) {
    return { ok:false, skipped:true, reason:'header' };
  }

  const data = getCustomerRowObjectV417_(rowNumber).row;
  const type = String(data['نوع مشتری'] || '').trim();
  const name = String(data['نام / عنوان مشتری'] || '').trim();
  const mobile = String(data['موبایل'] || '').trim();

  if (!type && !name && !mobile) {
    return { ok:false, skipped:true, reason:'empty' };
  }

  if (!type || !name || !mobile) {
    return {
      ok:false,
      skipped:true,
      reason:'برای ساخت خودکار پوشه، نوع مشتری، نام/عنوان مشتری و موبایل باید تکمیل شوند.'
    };
  }

  let customerId = String(data['مشتری ID'] || '').trim();
  if (!customerId) {
    customerId = nextId('customers', 'CUS-', 3);
    patchCustomerRowV417_(rowNumber, { 'مشتری ID': customerId });
  }

  let folderUrl = String(data['📁 پوشه اسناد'] || '').trim();
  if (!folderUrl) {
    const folder = createCustomerFolder(customerId, name);
    folderUrl = folder ? folder.getUrl() : '';
  }

  const patch = {
    '📁 پوشه اسناد': folderUrl,
    'تاریخ ایجاد': data['تاریخ ایجاد'] || nowFa()
  };

  if (data['فعال؟'] === '' || data['فعال؟'] === null || typeof data['فعال؟'] === 'undefined') {
    patch['فعال؟'] = true;
  }

  if (String(data['پایان وکالت'] || '').trim() && !String(data['وضعیت وکالت'] || '').trim()) {
    patch['وضعیت وکالت'] = 'فعال';
  }

  patchCustomerRowV417_(rowNumber, patch);

  try {
    logSystem(
      'customer_sheet_provision',
      customerId + ' | row=' + rowNumber + ' | ' + (source || 'SHEET_EDIT')
    );
  } catch (_) {}

  return {
    ok:true,
    row:rowNumber,
    customerId:customerId,
    folderUrl:folderUrl
  };
}

function handleCustomerSheetEditV417_(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (!sh || sh.getName() !== SHEETS.customers.name) return;

  const startRow = Math.max(e.range.getRow(), SHEETS.customers.headerRow + 1);
  const endRow = e.range.getLastRow();

  for (let row = startRow; row <= endRow; row++) {
    try { provisionCustomerRowV417_(row, 'SHEET_EDIT'); }
    catch (err) {
      try {
        logSystem(
          'customer_sheet_provision_error',
          'row=' + row + ' | ' + String(err && err.stack ? err.stack : err)
        );
      } catch (_) {}
    }
  }
}

// Final unified installable onEdit handler.
function handleUserSheetEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (!sheet) return;

  if (sheet.getName() === SHEETS.customers.name) {
    return handleCustomerSheetEditV417_(e);
  }

  if (sheet.getName() !== SHEETS.users.name) return;

  const range = e.range;
  const firstRow = Math.max(range.getRow(), SHEETS.users.headerRow + 1);
  const lastRow = range.getLastRow();

  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber++) {
    try { provisionUserRowFromSheet_(rowNumber, 'SHEET_EDIT'); }
    catch (err) {
      try {
        logSystem(
          'sheet_user_provision_error',
          'row=' + rowNumber + ' | ' + String(err && err.stack ? err.stack : err)
        );
      } catch (_) {}
    }
  }
}

function repairCustomerFoldersV417() {
  const cfg = SHEETS.customers;
  const rows = readRows(cfg);
  const result = { ok:true, version:APP_VERSION, scanned:0, repaired:0, skipped:0, errors:[] };

  rows.forEach(function(r, i) {
    result.scanned++;
    const rowNumber = cfg.headerRow + 1 + i;
    const type = String(r['نوع مشتری'] || '').trim();
    const name = String(r['نام / عنوان مشتری'] || '').trim();
    const mobile = String(r['موبایل'] || '').trim();

    if (!type || !name || !mobile) {
      result.skipped++;
      return;
    }

    if (String(r['📁 پوشه اسناد'] || '').trim()) {
      result.skipped++;
      return;
    }

    try {
      const p = provisionCustomerRowV417_(rowNumber, 'REPAIR');
      if (p && p.ok) result.repaired++;
      else result.skipped++;
    } catch (err) {
      result.errors.push({ row:rowNumber, error:String(err) });
    }
  });

  result.ok = result.errors.length === 0;
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testV417CustomerAutomation() {
  const triggers = listProjectTriggers();
  const onEditTriggers = triggers.filter(function(t) {
    return t.handler === 'handleUserSheetEdit';
  });

  const result = {
    ok: onEditTriggers.length === 1,
    version: APP_VERSION,
    onEditTriggerCount: onEditTriggers.length,
    customerSheet: SHEETS.customers.name,
    requiredFields: ['نوع مشتری','نام / عنوان مشتری','موبایل'],
    triggers: onEditTriggers
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/************************************************************
 * V4.18 — CUSTOMER MANAGER COMPANY LINKING
 * ----------------------------------------------------------
 * هدف:
 * 1) ستون «شرکت» در مدیریت کاربران از لیست زنده مشتریان انتخاب شود.
 * 2) با انتخاب شرکت برای مدیر مشتری/کارمند مشتری، Customer ID خودکار پر شود.
 * 3) پس از تکمیل اطلاعات، همان مسیر Queue/Workspace اجرا شود.
 * 4) بعد از ساخت Workspace، linkCustomerManager اطلاعات مدیر را روی مشتری ثبت می‌کند.
 ************************************************************/

function repairCustomerCompanyDropdownV418_() {
  const ss = getCRMSpreadsheet();
  const usersSh = ss.getSheetByName(SHEETS.users.name);
  const customersSh = ss.getSheetByName(SHEETS.customers.name);
  if (!usersSh || !customersSh) throw new Error('شیت مدیریت کاربران یا مشتریان پیدا نشد.');

  const startRow = SHEETS.users.headerRow + 1; // 5
  const rows = Math.max(1, usersSh.getMaxRows() - startRow + 1);

  // H = شرکت. منبع زنده: نام/عنوان مشتری در C2:C شیت مشتریان
  const sourceRange = customersSh.getRange(
    SHEETS.customers.headerRow + 1,
    3,
    Math.max(1, customersSh.getMaxRows() - SHEETS.customers.headerRow),
    1
  );

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(sourceRange, true)
    .setAllowInvalid(false)
    .build();

  usersSh.getRange(startRow, 8, rows, 1).setDataValidation(rule);
  usersSh.getRange(startRow, 8, rows, 1)
    .setNote('برای نقش مدیر مشتری یا کارمند مشتری، شرکت را از فهرست مشتریان انتخاب کنید.');

  usersSh.getRange(startRow, 7, rows, 1)
    .setNote('Customer ID سیستمی است و پس از انتخاب شرکت به‌صورت خودکار تکمیل می‌شود.');

  return {
    ok: true,
    sheet: SHEETS.users.name,
    companyColumn: 'H',
    customerIdColumn: 'G',
    source: SHEETS.customers.name + '!C2:C'
  };
}

function normalizeCompanyNameV418_(value) {
  return String(value || '')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findCustomerByCompanyNameV418_(companyName) {
  const target = normalizeCompanyNameV418_(companyName);
  if (!target) return { ok:false, reason:'empty_company', matches:[] };

  const rows = readRows(SHEETS.customers);
  const matches = rows.filter(function(r) {
    return normalizeCompanyNameV418_(r['نام / عنوان مشتری']) === target;
  });

  if (matches.length === 1) return { ok:true, customer:matches[0], matches:matches };
  if (!matches.length) return { ok:false, reason:'not_found', matches:[] };
  return { ok:false, reason:'duplicate_name', matches:matches };
}

function syncCustomerSelectionToUserRowV418_(rowNumber) {
  const row = getUserUiRowObject_(rowNumber);
  if (!row) return { ok:false, skipped:true, reason:'row_not_found' };

  const role = normalizeRole(String(row['نقش'] || '').trim());
  const isCustomerRole = role === 'مدیر مشتری' || role === 'کارمند مشتری';
  if (!isCustomerRole) return { ok:true, skipped:true, reason:'not_customer_role' };

  let customerId = String(row['Customer ID'] || '').trim();
  let company = String(row['شرکت'] || '').trim();

  if (company) {
    const found = findCustomerByCompanyNameV418_(company);
    if (!found.ok) {
      if (found.reason === 'duplicate_name') {
        throw new Error('نام شرکت تکراری است. برای این شرکت Customer ID را مشخص کنید.');
      }
      throw new Error('شرکت انتخاب‌شده در شیت مشتریان پیدا نشد.');
    }

    const customer = found.customer;
    customerId = String(customer['مشتری ID'] || '').trim();
    if (!customerId) throw new Error('مشتری انتخاب‌شده Customer ID ندارد.');

    company = String(customer['نام / عنوان مشتری'] || '').trim();
    patchUserUiRow_(rowNumber, {
      'Customer ID': customerId,
      'شرکت': company
    });

    return {
      ok:true,
      customerId:customerId,
      company:company,
      source:'company_selection'
    };
  }

  if (customerId) {
    const customer = getEntityById('customers', customerId);
    if (!customer) throw new Error('Customer ID واردشده معتبر نیست.');

    company = String(customer['نام / عنوان مشتری'] || '').trim();
    patchUserUiRow_(rowNumber, {
      'شرکت': company
    });

    return {
      ok:true,
      customerId:customerId,
      company:company,
      source:'customer_id'
    };
  }

  return {
    ok:false,
    waiting:true,
    reason:'برای نقش مشتری، شرکت را از ستون «شرکت» انتخاب کنید.'
  };
}

// Override نهایی: ثبت مستقیم کاربر از شیت با انتخاب شرکت.
function handleUserSheetEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (!sheet) return;

  // ثبت/ویرایش مشتری: پوشه اسناد + حفظ Dropdown زنده شرکت
  if (sheet.getName() === SHEETS.customers.name) {
    const result = handleCustomerSheetEditV417_(e);
    try { repairCustomerCompanyDropdownV418_(); } catch (_) {}
    return result;
  }

  if (sheet.getName() !== SHEETS.users.name) return;

  const firstRow = Math.max(e.range.getRow(), SHEETS.users.headerRow + 1);
  const lastRow = e.range.getLastRow();

  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber++) {
    try {
      const row = getUserUiRowObject_(rowNumber);
      if (!row) continue;

      const role = normalizeRole(String(row['نقش'] || '').trim());

      if (role === 'مدیر مشتری' || role === 'کارمند مشتری') {
        const linked = syncCustomerSelectionToUserRowV418_(rowNumber);
        if (linked && linked.waiting) {
          patchUserUiRow_(rowNumber, { 'Provisioning': 'منتظر تکمیل اطلاعات' });
          continue;
        }
      }

      provisionUserRowFromSheet_(rowNumber, 'SHEET_EDIT');
    } catch (err) {
      try {
        patchUserUiRow_(rowNumber, { 'Provisioning': 'نیازمند بررسی' });
      } catch (_) {}
      try {
        logSystem(
          'sheet_user_customer_link_error',
          'row=' + rowNumber + ' | ' + String(err && err.stack ? err.stack : err)
        );
      } catch (_) {}
    }
  }
}

function repairExistingCustomerUserLinksV418_() {
  const rows = readRows(SHEETS.users);
  const result = { ok:true, scanned:0, linked:0, skipped:0, errors:[] };

  rows.forEach(function(r, i) {
    result.scanned++;
    const role = normalizeRole(String(r['نقش'] || '').trim());
    if (role !== 'مدیر مشتری' && role !== 'کارمند مشتری') {
      result.skipped++;
      return;
    }

    const rowNumber = SHEETS.users.headerRow + 1 + i;
    try {
      const linked = syncCustomerSelectionToUserRowV418_(rowNumber);
      if (linked && linked.ok) result.linked++;
      else result.skipped++;
    } catch (err) {
      result.errors.push({ row:rowNumber, error:String(err) });
    }
  });

  result.ok = result.errors.length === 0;
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testV418CustomerManagerLinking() {
  const validation = repairCustomerCompanyDropdownV418_();
  const customers = readRows(SHEETS.customers).map(function(r) {
    return {
      customerId: r['مشتری ID'] || '',
      company: r['نام / عنوان مشتری'] || '',
      active: r['فعال؟']
    };
  });

  const result = {
    ok:true,
    version:APP_VERSION,
    dropdown:validation,
    customers:customers
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// Final installer override for V4.18.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:webhookOk,
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    templateRepair:templateRepair,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));
  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.18 نصب شد</b>' : '❌ <b>نصب کامل نشد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n🏢 Dropdown شرکت مدیر مشتری: <b>فعال</b>' +
    '\n🔗 Customer ID خودکار: <b>فعال</b>' +
    '\n📬 Queue Worker: <b>هر 1 دقیقه</b>' +
    '\n🔄 Workspace Sync: <b>هر 5 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.19 — ROLE-AWARE TELEGRAM ACCESS
 * ----------------------------------------------------------
 * Fixes:
 * - Previously Telegram bot authorized only ADMIN_TELEGRAM_ID.
 * - Active users in Users/مدیریت کاربران were still rejected.
 * - Non-admin users now receive a safe role-specific Telegram home.
 * - Admin panel remains unchanged and admin-only.
 ************************************************************/

function getTelegramUserContextV419_(telegramId) {
  telegramId = String(telegramId || '').trim();

  if (telegramId === String(ADMIN_TELEGRAM_ID)) {
    return {
      authorized: true,
      isAdmin: true,
      role: 'مدیر',
      user: {
        'User ID': 'USR-ADMIN-TELEGRAM',
        'نام کامل': 'مدیر',
        'Telegram User ID': telegramId,
        'نقش': 'مدیر',
        'وضعیت': 'فعال',
        'پروفایل دسترسی': 'پیشرفته'
      }
    };
  }

  const sources = [SHEETS.usersRaw, SHEETS.users];
  let found = null;

  for (let s = 0; s < sources.length && !found; s++) {
    const rows = readRows(sources[s]);
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i]['Telegram User ID'] || '').trim() === telegramId) {
        found = rows[i];
        break;
      }
    }
  }

  if (!found) {
    return { authorized:false, isAdmin:false, reason:'telegram_id_not_found', telegramId:telegramId };
  }

  const status = String(found['وضعیت'] || '').trim();
  if (status === 'غیرفعال' || status === 'آرشیو') {
    return {
      authorized:false,
      isAdmin:false,
      reason:'inactive',
      telegramId:telegramId,
      user:found
    };
  }

  const role = normalizeRole(String(found['نقش'] || '').trim());
  if (!role) {
    return {
      authorized:false,
      isAdmin:false,
      reason:'role_missing',
      telegramId:telegramId,
      user:found
    };
  }

  return {
    authorized:true,
    isAdmin:role === 'مدیر',
    role:role,
    user:found
  };
}

function markTelegramLinkedV419_(ctx) {
  if (!ctx || !ctx.user || !ctx.user['User ID']) return;
  const userId = String(ctx.user['User ID']);

  try {
    updateRowById(SHEETS.usersRaw, userId, {
      'Telegram Linked':'بله',
      'آخرین فعالیت':nowFa(),
      'آخرین بروزرسانی':nowFa()
    });
  } catch (_) {}

  try {
    updateRowById(SHEETS.users, userId, {
      'Telegram Linked':'بله',
      'آخرین فعالیت':nowFa()
    });
  } catch (_) {}
}

function getUserWorkspaceUrlV419_(user) {
  if (!user) return '';

  let url = String(user['Workspace'] || user['Workspace URL'] || '').trim();
  if (url) return url;

  const userId = String(user['User ID'] || '').trim();
  if (!userId) return '';

  try {
    const rows = readRows(SHEETS.mapping);
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i]['User ID'] || '').trim() === userId) {
        url = String(rows[i]['Workspace URL'] || '').trim();
        if (url) return url;
      }
    }
  } catch (_) {}

  return '';
}

function buildRoleTelegramHomeV419_(ctx) {
  const user = ctx.user || {};
  const role = ctx.role || normalizeRole(user['نقش'] || '');
  const name = String(user['نام کامل'] || 'کاربر');
  const profile = String(user['پروفایل دسترسی'] || defaultProfile(role));
  const company = String(user['شرکت'] || '').trim();
  const customerId = String(user['Customer ID'] || '').trim();
  const workspace = getUserWorkspaceUrlV419_(user);

  let title = '👤 <b>کاراترخیص | میز کار من</b>';
  if (role === 'مدیر مشتری') title = '🏢 <b>کاراترخیص | پنل مدیر مشتری</b>';
  else if (role === 'کارمند مشتری') title = '👥 <b>کاراترخیص | پنل کارمند مشتری</b>';
  else if (role === 'کارمند داخلی') title = '🧰 <b>کاراترخیص | پنل کارمند داخلی</b>';

  let body =
    title + '\n\n' +
    '👤 نام: <b>' + escapeHtml(name) + '</b>\n' +
    '🔐 نقش: <b>' + escapeHtml(role) + '</b>\n' +
    '🧩 سطح دسترسی: <b>' + escapeHtml(profile) + '</b>\n' +
    '✅ وضعیت: <b>فعال</b>\n';

  if (company) body += '🏢 شرکت: <b>' + escapeHtml(company) + '</b>\n';
  if (customerId) body += '🆔 Customer ID: <code>' + escapeHtml(customerId) + '</code>\n';

  body += '\n';

  if (workspace) {
    body += '🔗 میز کار اختصاصی شما آماده است.\n';
  } else {
    body += '⏳ میز کار اختصاصی هنوز آماده نشده یا لینک آن ثبت نشده است.\n';
  }

  body += '\n<code>' + APP_VERSION + '</code>';

  const buttons = [];
  if (workspace) {
    buttons.push([{ text:'🔗 ورود به میز کار من', url:workspace }]);
  }

  return {
    text:body,
    kb:{ inline_keyboard:buttons }
  };
}

function showRoleTelegramHomeFreshV419_(chatId, ctx) {
  const oldPanelId = getPanelMessageId(chatId);
  const payload = buildRoleTelegramHomeV419_(ctx);
  const sent = sendMessage(chatId, payload.text, payload.kb);

  if (sent && sent.ok && sent.result && sent.result.message_id != null) {
    const newId = Number(sent.result.message_id);
    setPanelMessageId(chatId, newId);
    if (oldPanelId && Number(oldPanelId) !== newId) {
      try { deleteTelegramMessage(chatId, oldPanelId); } catch (_) {}
    }
  }

  return sent;
}

// Final role-aware message handler.
function handleMessage(message) {
  const chatId = message.chat.id;
  const telegramId = String(message.from && message.from.id);
  const text = String(message.text || '').trim();
  const incomingMessageId = message.message_id;

  const ctx = getTelegramUserContextV419_(telegramId);

  if (!ctx.authorized) {
    sendMessage(
      chatId,
      '⛔️ <b>دسترسی فعال برای این Telegram ID پیدا نشد.</b>\n\n' +
      'Telegram ID: <code>' + escapeHtml(telegramId) + '</code>\n\n' +
      'اگر در CRM ثبت شده‌اید، مدیر سیستم باید وضعیت شما را روی «فعال» قرار دهد.'
    );
    return;
  }

  markTelegramLinkedV419_(ctx);

  // مدیر اصلی همان پنل مدیریت کامل را می‌بیند.
  if (ctx.isAdmin || telegramId === String(ADMIN_TELEGRAM_ID)) {
    if (
      isBotCommand(text, 'start') ||
      isBotCommand(text, 'admin') ||
      isBotCommand(text, 'menu') ||
      text === 'مدیریت' ||
      text === 'پنل مدیریت'
    ) {
      clearState(telegramId);
      const sent = showAdminMenuFresh(chatId);
      if (sent && sent.ok) safeDeleteMessage(chatId, incomingMessageId);
      return;
    }

    if (isBotCommand(text, 'cancel') || text === 'لغو') {
      clearState(telegramId);
      const sent = showAdminMenuFresh(chatId);
      if (sent && sent.ok) safeDeleteMessage(chatId, incomingMessageId);
      return;
    }

    const state = getState(telegramId);
    if (state) {
      safeDeleteMessage(chatId, incomingMessageId);
      processStateInput(chatId, telegramId, text, state);
      return;
    }

    safeDeleteMessage(chatId, incomingMessageId);
    return;
  }

  // سایر نقش‌ها پنل امن و اختصاصی خودشان را می‌بینند.
  if (
    isBotCommand(text, 'start') ||
    isBotCommand(text, 'menu') ||
    isBotCommand(text, 'cancel') ||
    text === 'منو' ||
    text === 'میز کار'
  ) {
    clearState(telegramId);
    const sent = showRoleTelegramHomeFreshV419_(chatId, ctx);
    if (sent && sent.ok) safeDeleteMessage(chatId, incomingMessageId);
    return;
  }

  // پیام آزاد برای کاربران غیرمدیر باعث باز شدن دوباره میزکار می‌شود.
  safeDeleteMessage(chatId, incomingMessageId);
  showRoleTelegramHomeFreshV419_(chatId, ctx);
}

function testTelegramUserAccessV419() {
  const ids = ['5545027309','1199911025',String(ADMIN_TELEGRAM_ID)];
  const result = ids.map(function(id) {
    const ctx = getTelegramUserContextV419_(id);
    return {
      telegramId:id,
      authorized:!!ctx.authorized,
      isAdmin:!!ctx.isAdmin,
      role:ctx.role || '',
      userId:ctx.user ? (ctx.user['User ID'] || '') : '',
      name:ctx.user ? (ctx.user['نام کامل'] || '') : '',
      workspace:ctx.user ? getUserWorkspaceUrlV419_(ctx.user) : ''
    };
  });
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.20 — PERSONAL DAILY TASKS FOR EVERY WORKSPACE
 * ----------------------------------------------------------
 * - Adds visible tab "📅 تسک روزانه من" to every workspace.
 * - Each user sees only their own daily tasks.
 * - Users can create/edit tasks directly in their workspace.
 * - Existing 5-minute workspace sync pulls local edits first,
 *   then pushes canonical CRM data back to the personal tab.
 * - No per-user onEdit trigger is required.
 ************************************************************/

SHEETS.dailyTasks = { name: 'کارهای روزانه', headerRow: 1, idHeader: 'شناسه کار' };

const PERSONAL_DAILY_TAB_V420 = '📅 تسک روزانه من';
const PERSONAL_DAILY_HEADERS_V420 = [
  'شناسه کار','تاریخ','کار روزانه','دسته‌بندی','اولویت','موعد',
  'وضعیت','نتیجه','کار فردا','مرتبط با شرکت','شماره پرونده','یادداشت'
];

function todayV420_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Tehran', 'yyyy-MM-dd');
}

function normalizeTextV420_(v) {
  return String(v == null ? '' : v).replace(/\u200c/g, ' ').replace(/\s+/g, ' ').trim();
}

function getPersonalTaskOwnerTokensV420_(user) {
  return [user && user['User ID'], user && user['نام کامل'], user && user['Telegram User ID']]
    .map(normalizeTextV420_).filter(Boolean);
}

function personalTaskBelongsToUserV420_(row, user) {
  const userId = normalizeTextV420_(user && user['User ID']);
  const source = normalizeTextV420_(row && row['منبع']);
  if (userId && source === 'PERSONAL:' + userId) return true;

  const owner = normalizeTextV420_(row && row['مسئول']);
  if (!owner) return false;

  return getPersonalTaskOwnerTokensV420_(user).some(function(t) {
    return owner === t || owner.indexOf(t) >= 0;
  });
}

function getPersonalDailyTasksV420_(user) {
  const rows = readRows(SHEETS.dailyTasks).filter(function(r) {
    return personalTaskBelongsToUserV420_(r, user);
  });

  rows.sort(function(a, b) {
    const aDone = ['انجام شد','لغو شده'].indexOf(String(a['وضعیت'] || '')) >= 0 ? 1 : 0;
    const bDone = ['انجام شد','لغو شده'].indexOf(String(b['وضعیت'] || '')) >= 0 ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return String(b['تاریخ'] || '').localeCompare(String(a['تاریخ'] || ''));
  });

  return rows.slice(0, 250);
}

function ensurePersonalDailySheetV420_(ss) {
  let sh = ss.getSheetByName(PERSONAL_DAILY_TAB_V420);
  if (!sh) sh = ss.insertSheet(PERSONAL_DAILY_TAB_V420);

  ensureTargetSheetSizeV412_(sh, 300, PERSONAL_DAILY_HEADERS_V420.length);

  sh.getRange(1, 1, 1, PERSONAL_DAILY_HEADERS_V420.length)
    .setValues([PERSONAL_DAILY_HEADERS_V420]);

  sh.setFrozenRows(1);
  try { sh.setRightToLeft(true); } catch (_) {}
  try { sh.showSheet(); } catch (_) {}

  try {
    sh.getRange(1, 1, 1, PERSONAL_DAILY_HEADERS_V420.length)
      .setFontWeight('bold')
      .setBackground('#176B57')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('center');
  } catch (_) {}

  try {
    [110,100,300,140,100,120,120,220,220,180,130,240].forEach(function(w, i) {
      sh.setColumnWidth(i + 1, w);
    });
  } catch (_) {}

  const rows = Math.max(1, sh.getMaxRows() - 1);

  try {
    const priorityRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['فوری','بالا','متوسط','پایین'], true)
      .setAllowInvalid(false)
      .build();
    sh.getRange(2, 5, rows, 1).setDataValidation(priorityRule);
  } catch (_) {}

  try {
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['باز','در حال انجام','انجام شد','لغو شده'], true)
      .setAllowInvalid(false)
      .build();
    sh.getRange(2, 7, rows, 1).setDataValidation(statusRule);
  } catch (_) {}

  try {
    sh.getRange(1, 1).setNote('شناسه کار سیستمی است. برای تسک جدید فقط ستون «کار روزانه» را تکمیل کنید؛ شناسه در همگام‌سازی بعدی ساخته می‌شود.');
    sh.getRange(1, 3).setNote('تغییرات این تب حداکثر در چرخه همگام‌سازی ۵ دقیقه‌ای با CRM مرکزی همگام می‌شود.');
  } catch (_) {}

  return sh;
}

function workspaceLocalTaskObjectV420_(headers, values) {
  const obj = {};
  headers.forEach(function(h, i) { obj[h] = values[i]; });
  return obj;
}

function upsertPersonalTaskFromWorkspaceV420_(localRow, user) {
  const taskText = normalizeTextV420_(localRow['کار روزانه']);
  let taskId = normalizeTextV420_(localRow['شناسه کار']);
  if (!taskId && !taskText) return { skipped:true, reason:'empty' };

  let existing = taskId ? getRowById(SHEETS.dailyTasks, taskId) : null;
  if (existing && !personalTaskBelongsToUserV420_(existing, user)) {
    return { skipped:true, reason:'foreign_task_id', taskId:taskId };
  }

  if (!taskId) taskId = nextIdRaw(SHEETS.dailyTasks, 'شناسه کار', 'DAY-', 5);

  const userId = normalizeTextV420_(user['User ID']);
  const userName = normalizeTextV420_(user['نام کامل']) || userId;
  const status = normalizeTextV420_(localRow['وضعیت']) || 'باز';
  const oldStatus = existing ? normalizeTextV420_(existing['وضعیت']) : '';

  const candidate = Object.assign({}, existing || {}, {
    'شناسه کار':taskId,
    'تاریخ':localRow['تاریخ'] || (existing && existing['تاریخ']) || todayV420_(),
    'مسئول':userName,
    'دسته‌بندی':localRow['دسته‌بندی'] || '',
    'کار روزانه':localRow['کار روزانه'] || '',
    'مرتبط با شرکت':localRow['مرتبط با شرکت'] || user['شرکت'] || '',
    'اولویت':localRow['اولویت'] || 'متوسط',
    'موعد':localRow['موعد'] || '',
    'وضعیت':status,
    'نتیجه':localRow['نتیجه'] || '',
    'کار فردا':localRow['کار فردا'] || '',
    'یادداشت مدیریتی':localRow['یادداشت'] || '',
    'ایجاد شده در':(existing && existing['ایجاد شده در']) || nowFa(),
    'موعد دقیق':localRow['موعد'] || (existing && existing['موعد دقیق']) || '',
    'تعداد یادآوری':(existing && existing['تعداد یادآوری']) || 0,
    'آخرین تغییر وضعیت':oldStatus !== status ? nowFa() : ((existing && existing['آخرین تغییر وضعیت']) || nowFa()),
    'بسته شده در':status === 'انجام شد' ? ((existing && existing['بسته شده در']) || nowFa()) : '',
    'منبع':(existing && existing['منبع']) || ('PERSONAL:' + userId),
    'شماره پرونده':localRow['شماره پرونده'] || ''
  });

  if (existing) {
    const baseline = getDailyTaskBaselineV427_(userId, taskId);
    const centralHash = dailyTaskHashV427_(existing);
    const localHash = dailyTaskHashV427_(candidate);

    if (baseline) {
      const centralChanged = centralHash !== baseline;
      const localChanged = localHash !== baseline;

      if (centralChanged && localChanged) {
        try {
          logSystem('daily_task_conflict',
            taskId + ' | user=' + userId + ' | central=' + centralHash + ' | baseline=' + baseline);
        } catch (_) {}
        return { skipped:true, conflict:true, reason:'concurrent_change', taskId:taskId };
      }

      if (!localChanged) {
        return { skipped:true, reason:'no_local_change', taskId:taskId };
      }
    }

    updateRowById(SHEETS.dailyTasks, taskId, candidate);
  } else {
    appendObject(SHEETS.dailyTasks, candidate);
  }

  const saved = getRowById(SHEETS.dailyTasks, taskId) || candidate;
  setDailyTaskBaselineV427_(userId, taskId, dailyTaskHashV427_(saved));
  return { ok:true, taskId:taskId };
}

function pullPersonalDailyTasksFromWorkspaceV420_(sh, user) {
  const lastRow = Math.max(1, sh.getLastRow());
  if (lastRow <= 1) return { processed:0, saved:0, skipped:0, errors:[] };

  const headers = PERSONAL_DAILY_HEADERS_V420.slice();
  const values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const report = { processed:0, saved:0, skipped:0, errors:[] };

  values.forEach(function(rowValues) {
    const hasAny = rowValues.some(function(v){ return normalizeTextV420_(v) !== ''; });
    if (!hasAny) return;

    report.processed++;
    try {
      const local = workspaceLocalTaskObjectV420_(headers, rowValues);
      const r = upsertPersonalTaskFromWorkspaceV420_(local, user);
      if (r && r.ok) report.saved++;
      else report.skipped++;
    } catch (err) {
      report.errors.push(String(err && err.message ? err.message : err));
    }
  });

  return report;
}

function pushPersonalDailyTasksToWorkspaceV420_(sh, user) {
  const tasks = getPersonalDailyTasksV420_(user);

  const clearRows = Math.max(1, sh.getMaxRows() - 1);
  sh.getRange(2, 1, clearRows, PERSONAL_DAILY_HEADERS_V420.length).clearContent();

  if (tasks.length) {
    const matrix = tasks.map(function(r) {
      return [
        r['شناسه کار'] || '',
        r['تاریخ'] || '',
        r['کار روزانه'] || '',
        r['دسته‌بندی'] || '',
        r['اولویت'] || 'متوسط',
        r['موعد'] || '',
        r['وضعیت'] || 'باز',
        r['نتیجه'] || '',
        r['کار فردا'] || '',
        r['مرتبط با شرکت'] || '',
        r['شماره پرونده'] || '',
        r['یادداشت مدیریتی'] || ''
      ];
    });
    sh.getRange(2, 1, matrix.length, PERSONAL_DAILY_HEADERS_V420.length).setValues(matrix);
  }

  return { count:tasks.length };
}

function syncPersonalDailyTasksV420_(ss, user) {
  const sh = ensurePersonalDailySheetV420_(ss);
  const pulled = pullPersonalDailyTasksFromWorkspaceV420_(sh, user);
  const pushed = pushPersonalDailyTasksToWorkspaceV420_(sh, user);
  return { pulled:pulled, count:pushed.count };
}

function prepareDailyTaskTabsForTemplatesV420_() {
  const result = [];
  const seen = {};

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    const fileId = String(DASHBOARD_TEMPLATES[role] || '').trim();
    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    try {
      const ss = SpreadsheetApp.openById(fileId);
      ensurePersonalDailySheetV420_(ss);
      result.push({ role:role, fileId:fileId, ok:true });
    } catch (err) {
      result.push({ role:role, fileId:fileId, ok:false, error:String(err) });
    }
  });

  return result;
}

function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');

  const ss = ensureWorkspaceStructureV412_(fileId);
  const personalDaily = syncPersonalDailyTasksV420_(ss, user);
  const scoped = getScopedWorkspaceDataV412_(user);

  writeWorkspaceDataSheetV414_(ss, 'مشتریان', SHEETS.customers, scoped.customers, user);
  writeWorkspaceDataSheetV414_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks, user);
  writeWorkspaceDataSheetV414_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks, user);
  writeWorkspaceDataSheetV414_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments, user);

  repairWorkspaceDashboardFormulasV412_(ss);
  if (normalizeRole(user['نقش']) === 'مدیر مشتری') prepareCustomerManagerWorkspaceV414_(fileId);

  SpreadsheetApp.flush();

  return {
    customers:scoped.customers.length,
    cases:scoped.cases.length,
    tasks:scoped.tasks.length,
    leads:scoped.leads.length,
    customerTasks:scoped.customerTasks.length,
    caseDocuments:scoped.caseDocuments.length,
    personalDailyTasks:personalDaily.count,
    personalDailyPulled:personalDaily.pulled.saved
  };
}

function getAdminPersonalUserV420_() {
  const adminRows = readRows(SHEETS.usersRaw).filter(function(r) {
    return normalizeRole(r['نقش']) === 'مدیر' && String(r['وضعیت'] || '') !== 'غیرفعال';
  });

  if (adminRows.length) return adminRows[0];

  return {
    'User ID':'CRM_ADMIN',
    'نام کامل':'مدیر',
    'Telegram User ID':ADMIN_TELEGRAM_ID,
    'نقش':'مدیر',
    'پروفایل دسترسی':'پیشرفته',
    'وضعیت':'فعال',
    'شرکت':''
  };
}

function syncAllActiveWorkspacesV412(limit) {
  limit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return { ok:false, busy:true, version:APP_VERSION };

  const report = { ok:true, version:APP_VERSION, processed:0, synced:0, failed:0, adminDaily:false, results:[] };

  try {
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;

    const mappings = readRows(SHEETS.mapping)
      .filter(function(r){ return String(r['Workspace URL'] || '').trim(); })
      .slice(0, limit);

    mappings.forEach(function(m) {
      const userId = String(m['User ID'] || '').trim();
      const user = getRowById(SHEETS.usersRaw, userId);
      if (!user || String(user['وضعیت'] || '').trim() === 'غیرفعال') return;

      report.processed++;
      try {
        const workspace = {
          fileId:String(m['Spreadsheet ID'] || '') || parseDriveFileId_(m['Workspace URL']),
          url:String(m['Workspace URL'] || ''),
          type:m['نوع Workspace'] || user['نقش']
        };

        const counts = syncWorkspaceDataV412_(workspace, user);

        upsertObject(SHEETS.mapping, 'User ID', userId, Object.assign({}, m, {
          'User ID':userId,
          'آخرین Sync':nowFa(),
          'وضعیت Provisioning':'انجام شد'
        }));

        report.synced++;
        report.results.push({ userId:userId, ok:true, counts:counts });
      } catch (err) {
        report.failed++;
        report.ok = false;
        try { logSystem('workspace_sync_error', userId + ' | ' + String(err)); } catch (_) {}
        report.results.push({ userId:userId, ok:false, error:String(err) });
      }
    });

    try {
      const adminUser = getAdminPersonalUserV420_();
      const adminSs = SpreadsheetApp.openById(DASHBOARD_TEMPLATES['مدیر']);
      syncPersonalDailyTasksV420_(adminSs, adminUser);
      report.adminDaily = true;
    } catch (err) {
      report.ok = false;
      report.failed++;
      report.results.push({ userId:'CRM_ADMIN', ok:false, error:String(err) });
    }
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function repairExistingWorkspaceDailyTabsV420_() {
  const report = { ok:true, templates:prepareDailyTaskTabsForTemplatesV420_(), workspaces:[], errors:[] };
  const seen = {};

  readRows(SHEETS.mapping).forEach(function(m) {
    const fileId = String(m['Spreadsheet ID'] || parseDriveFileId_(m['Workspace URL'] || '') || '').trim();
    const userId = String(m['User ID'] || '').trim();
    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    const user = getRowById(SHEETS.usersRaw, userId) || getRowById(SHEETS.users, userId);
    if (!user) return;

    try {
      const ss = SpreadsheetApp.openById(fileId);
      const result = syncPersonalDailyTasksV420_(ss, user);
      report.workspaces.push({ fileId:fileId, userId:userId, ok:true, count:result.count });
    } catch (err) {
      report.ok = false;
      report.errors.push({ fileId:fileId, userId:userId, error:String(err) });
    }
  });

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testV420PersonalDailyTasks() {
  const report = {
    ok:true,
    version:APP_VERSION,
    sourceSheet:SHEETS.dailyTasks.name,
    workspaceTab:PERSONAL_DAILY_TAB_V420,
    syncMinutes:5,
    users:readRows(SHEETS.usersRaw)
      .filter(function(u){ return String(u['وضعیت'] || '') !== 'غیرفعال'; })
      .map(function(u){
        return {
          userId:u['User ID'] || '',
          name:u['نام کامل'] || '',
          role:u['نقش'] || '',
          personalTasks:getPersonalDailyTasksV420_(u).length
        };
      })
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  let dailyRepair = null;
  try { dailyRepair = repairExistingWorkspaceDailyTabsV420_(); }
  catch (err) { dailyRepair = { ok:false, error:String(err) }; }

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:webhookOk && (!dailyRepair || dailyRepair.ok !== false),
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    templateRepair:templateRepair,
    dailyRepair:dailyRepair,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));

  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (report.ok ? '✅ <b>V4.20 نصب شد</b>' : '⚠️ <b>V4.20 با هشدار نصب شد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n📅 تسک روزانه شخصی: <b>فعال برای همه Workspaceها</b>' +
    '\n🔄 همگام‌سازی تسک شخصی: <b>هر 5 دقیقه</b>' +
    '\n🏢 اتصال مدیر مشتری: <b>فعال</b>' +
    '\n📬 Queue Worker: <b>هر 1 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.21 — DAILY TASK CATEGORY LIBRARY + DROPDOWN
 * ----------------------------------------------------------
 * - Category column in "📅 تسک روزانه من" uses a dropdown.
 * - Dropdown shows all previous categories from the central CRM.
 * - Users can type a brand-new category directly in the same cell.
 * - New typed categories are automatically added to the central library
 *   on the next workspace sync, then appear in everyone's dropdown.
 ************************************************************/

SHEETS.dailyTaskCategories = {
  name: 'فهرست دسته‌بندی تسک روزانه',
  headerRow: 1,
  idHeader: 'دسته‌بندی'
};

const DAILY_TASK_CATEGORY_HELPER_V421 = '__DailyTaskCategories';

const DEFAULT_DAILY_TASK_CATEGORIES_V421 = [
  'پیگیری مشتری',
  'پرونده و گمرک',
  'اسناد و مدارک',
  'مکاتبات',
  'مالی و تسویه',
  'بازاریابی',
  'جلسه و تماس',
  'کار اداری',
  'یادآوری',
  'سایر'
];

function normalizeDailyCategoryV421_(value) {
  return String(value == null ? '' : value)
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureDailyTaskCategoryMasterV421_() {
  const ss = getCRMSpreadsheet();
  let sh = ss.getSheetByName(SHEETS.dailyTaskCategories.name);

  if (!sh) {
    sh = ss.insertSheet(SHEETS.dailyTaskCategories.name);
  }

  const headers = ['دسته‌بندی','فعال؟','تاریخ ایجاد','ایجادکننده','یادداشت'];
  ensureTargetSheetSizeV412_(sh, 200, headers.length);

  const currentHeader = sh.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  let needsHeader = false;
  for (let i = 0; i < headers.length; i++) {
    if (String(currentHeader[i] || '').trim() !== headers[i]) {
      needsHeader = true;
      break;
    }
  }

  if (needsHeader) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sh.setFrozenRows(1);

  try {
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#176B57')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('center');
  } catch (_) {}

  // Seed defaults only if missing.
  const lastRow = Math.max(1, sh.getLastRow());
  const existing = {};
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, 1).getDisplayValues().forEach(function(r) {
      const c = normalizeDailyCategoryV421_(r[0]);
      if (c) existing[c.toLowerCase()] = true;
    });
  }

  DEFAULT_DAILY_TASK_CATEGORIES_V421.forEach(function(category) {
    const key = category.toLowerCase();
    if (existing[key]) return;
    sh.appendRow([category, true, nowFa(), 'SYSTEM', 'دسته‌بندی پیش‌فرض']);
    existing[key] = true;
  });

  return sh;
}

function addDailyTaskCategoryV421_(category, actor) {
  category = normalizeDailyCategoryV421_(category);
  if (!category) return { ok:false, skipped:true, reason:'empty' };

  const sh = ensureDailyTaskCategoryMasterV421_();
  const lastRow = Math.max(1, sh.getLastRow());

  if (lastRow > 1) {
    const values = sh.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
    for (let i = 0; i < values.length; i++) {
      if (normalizeDailyCategoryV421_(values[i][0]).toLowerCase() === category.toLowerCase()) {
        // Reactivate an old category if it exists but was disabled.
        try { sh.getRange(i + 2, 2).setValue(true); } catch (_) {}
        return { ok:true, duplicate:true, category:category };
      }
    }
  }

  sh.appendRow([category, true, nowFa(), actor || 'WORKSPACE', 'ایجاد خودکار از تسک روزانه']);
  return { ok:true, duplicate:false, category:category };
}

function collectDailyTaskCategoriesV421_() {
  const categories = {};
  const list = [];

  function add(value) {
    const c = normalizeDailyCategoryV421_(value);
    if (!c) return;
    const key = c.toLowerCase();
    if (categories[key]) return;
    categories[key] = true;
    list.push(c);
  }

  // Master list
  const sh = ensureDailyTaskCategoryMasterV421_();
  const lastRow = Math.max(1, sh.getLastRow());
  if (lastRow > 1) {
    const values = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function(r) {
      const active = r[1];
      if (active === false || String(active).trim().toLowerCase() === 'false') return;
      add(r[0]);
    });
  }

  // Historical categories already used in daily tasks
  try {
    readRows(SHEETS.dailyTasks).forEach(function(r) {
      const c = normalizeDailyCategoryV421_(r['دسته‌بندی']);
      if (!c) return;
      add(c);
      try { addDailyTaskCategoryV421_(c, 'HISTORY'); } catch (_) {}
    });
  } catch (_) {}

  DEFAULT_DAILY_TASK_CATEGORIES_V421.forEach(add);

  list.sort(function(a, b) { return a.localeCompare(b, 'fa'); });
  return list;
}

function ensureWorkspaceCategoryHelperV421_(ss, categories) {
  let sh = ss.getSheetByName(DAILY_TASK_CATEGORY_HELPER_V421);
  if (!sh) sh = ss.insertSheet(DAILY_TASK_CATEGORY_HELPER_V421);

  categories = categories || [];
  ensureTargetSheetSizeV412_(sh, Math.max(50, categories.length + 5), 1);

  sh.clearContents();
  sh.getRange(1, 1).setValue('دسته‌بندی');

  if (categories.length) {
    sh.getRange(2, 1, categories.length, 1)
      .setValues(categories.map(function(c){ return [c]; }));
  }

  try { sh.hideSheet(); } catch (_) {}
  return sh;
}

function applyDailyTaskCategoryValidationV421_(ss, dailySh, categories) {
  categories = categories || collectDailyTaskCategoriesV421_();
  const helper = ensureWorkspaceCategoryHelperV421_(ss, categories);

  const lastCategoryRow = Math.max(2, categories.length + 1);
  const sourceRange = helper.getRange(2, 1, lastCategoryRow - 1, 1);

  // D = دسته‌بندی
  const rows = Math.max(1, dailySh.getMaxRows() - 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(sourceRange, true)
    // IMPORTANT: allow typing a brand-new category.
    .setAllowInvalid(true)
    .setHelpText('از دسته‌بندی‌های قبلی انتخاب کنید یا نام دسته‌بندی جدید را مستقیم تایپ کنید. دسته‌بندی جدید در همگام‌سازی بعدی به فهرست مرکزی اضافه می‌شود.')
    .build();

  dailySh.getRange(2, 4, rows, 1).setDataValidation(rule);

  try {
    dailySh.getRange(1, 4).setNote(
      'این ستون منوی کشویی دسته‌بندی‌های قبلی دارد. برای تعریف دسته‌بندی جدید، نام جدید را مستقیم در همان سلول تایپ کنید؛ حداکثر تا چرخه بعدی Sync در فهرست همه کاربران ظاهر می‌شود.'
    );
  } catch (_) {}

  return { ok:true, categories:categories.length };
}

function harvestWorkspaceCategoriesV421_(dailySh, user) {
  const lastRow = Math.max(1, dailySh.getLastRow());
  if (lastRow <= 1) return { found:0, added:0 };

  const values = dailySh.getRange(2, 4, lastRow - 1, 1).getDisplayValues();
  const seen = {};
  let found = 0;
  let added = 0;

  values.forEach(function(r) {
    const c = normalizeDailyCategoryV421_(r[0]);
    if (!c) return;
    const key = c.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    found++;

    const result = addDailyTaskCategoryV421_(
      c,
      (user && user['User ID']) ? ('USER:' + user['User ID']) : 'WORKSPACE'
    );

    if (result && result.ok && !result.duplicate) added++;
  });

  return { found:found, added:added };
}

// Final V4.21 personal daily sync override.
function syncPersonalDailyTasksV420_(ss, user) {
  const sh = ensurePersonalDailySheetV420_(ss);

  // First harvest any new free-typed categories.
  const harvested = harvestWorkspaceCategoriesV421_(sh, user);

  // Save task edits to CRM.
  const pulled = pullPersonalDailyTasksFromWorkspaceV420_(sh, user);

  // Rebuild the dropdown from the latest central category library.
  const categories = collectDailyTaskCategoriesV421_();
  applyDailyTaskCategoryValidationV421_(ss, sh, categories);

  // Refresh the user's task table from CRM.
  const pushed = pushPersonalDailyTasksToWorkspaceV420_(sh, user);

  return {
    pulled:pulled,
    count:pushed.count,
    categories:categories.length,
    newCategories:harvested.added
  };
}

function repairExistingWorkspaceCategoriesV421_() {
  const report = { ok:true, templates:[], workspaces:[], errors:[] };
  const categories = collectDailyTaskCategoriesV421_();
  const seen = {};

  // Templates
  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    const fileId = String(DASHBOARD_TEMPLATES[role] || '').trim();
    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    try {
      const ss = SpreadsheetApp.openById(fileId);
      const sh = ensurePersonalDailySheetV420_(ss);
      applyDailyTaskCategoryValidationV421_(ss, sh, categories);
      report.templates.push({ role:role, fileId:fileId, ok:true });
    } catch (err) {
      report.ok = false;
      report.errors.push({ type:'template', role:role, fileId:fileId, error:String(err) });
    }
  });

  // Existing personal workspaces
  readRows(SHEETS.mapping).forEach(function(m) {
    const fileId = String(m['Spreadsheet ID'] || parseDriveFileId_(m['Workspace URL'] || '') || '').trim();
    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    try {
      const ss = SpreadsheetApp.openById(fileId);
      const sh = ensurePersonalDailySheetV420_(ss);
      applyDailyTaskCategoryValidationV421_(ss, sh, categories);
      report.workspaces.push({
        userId:String(m['User ID'] || ''),
        fileId:fileId,
        ok:true
      });
    } catch (err) {
      report.ok = false;
      report.errors.push({
        type:'workspace',
        userId:String(m['User ID'] || ''),
        fileId:fileId,
        error:String(err)
      });
    }
  });

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testV421DailyCategories() {
  const categories = collectDailyTaskCategoriesV421_();
  const result = {
    ok:true,
    version:APP_VERSION,
    masterSheet:SHEETS.dailyTaskCategories.name,
    workspaceTab:PERSONAL_DAILY_TAB_V420,
    categoryColumn:'D',
    allowCustom:true,
    syncMinutes:5,
    categoryCount:categories.length,
    categories:categories
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// Final installer override for V4.21.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  let dailyRepair = null;
  try { dailyRepair = repairExistingWorkspaceDailyTabsV420_(); }
  catch (err) { dailyRepair = { ok:false, error:String(err) }; }

  let categoryRepair = null;
  try { categoryRepair = repairExistingWorkspaceCategoriesV421_(); }
  catch (err) { categoryRepair = { ok:false, error:String(err) }; }

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:webhookOk &&
      (!dailyRepair || dailyRepair.ok !== false) &&
      (!categoryRepair || categoryRepair.ok !== false),
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    templateRepair:templateRepair,
    dailyRepair:dailyRepair,
    categoryRepair:categoryRepair,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));

  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (report.ok ? '✅ <b>V4.21 نصب شد</b>' : '⚠️ <b>V4.21 با هشدار نصب شد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n📅 تسک روزانه شخصی: <b>فعال</b>' +
    '\n🏷 دسته‌بندی کشویی: <b>فعال</b>' +
    '\n➕ دسته‌بندی جدید: <b>قابل تعریف مستقیم</b>' +
    '\n🔄 انتشار دسته‌بندی جدید: <b>حداکثر 5 دقیقه</b>' +
    '\n📬 Queue Worker: <b>هر 1 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() { return repairBotInstallation(); }


/************************************************************
 * V4.22 — TELEGRAM FAST NAVIGATION
 * ----------------------------------------------------------
 * Goal: menu-to-menu navigation must not touch Google Sheets/Drive.
 * Fixes:
 * 1) Pure navigation callbacks use ONE parallel fetchAll round-trip
 *    (answerCallbackQuery + editMessageText together).
 * 2) Main menu uses cached/stable stats only; never scans sheets on click.
 * 3) Entity "list" reads only the last 20 rows, not the entire table.
 * 4) Heavy manual sync is queued in background instead of blocking webhook.
 * 5) Adds lightweight callback performance trace in CacheService.
 ************************************************************/

const V422_FAST_NAV = {
  'main': true,
  'dashboard': true,
  'customers': true,
  'cases': true,
  'tasks': true,
  'users': true,
  'dashboard:summary': true,
  'dashboard:links': true,
  'dashboard:sync': true
};

function perfTraceKeyV422_() {
  return 'KARATARHIS_TG_PERF_V422';
}

function setPerfTraceV422_(obj) {
  try {
    CacheService.getScriptCache().put(
      perfTraceKeyV422_(),
      JSON.stringify(Object.assign({ version: APP_VERSION, at: nowFa() }, obj || {})),
      21600
    );
  } catch (_) {}
}

function getLastTelegramPerformanceV422() {
  const raw = CacheService.getScriptCache().get(perfTraceKeyV422_());
  let result = null;
  try { result = raw ? JSON.parse(raw) : null; } catch (_) { result = { raw: raw }; }
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function stableStatsKeyV422_() {
  return 'KARATARHIS_STABLE_STATS_V422';
}

function refreshTelegramStatsV422() {
  const s = getFastDashboardStats();
  try {
    PropertiesService.getScriptProperties().setProperty(
      stableStatsKeyV422_(),
      JSON.stringify(s)
    );
  } catch (_) {}
  return s;
}

function getStableStatsV422_() {
  // Hot cache first.
  try {
    const hot = CacheService.getScriptCache().get('KARATARHIS_FAST_STATS_V48');
    if (hot) return JSON.parse(hot);
  } catch (_) {}

  // Persistent last-known stats: no Sheet read during navigation.
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(stableStatsKeyV422_());
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  return { customers:'…', cases:'…', tasks:'…', users:'…', attention:'…' };
}

function mainMenuPayloadV422_() {
  const s = getStableStatsV422_();
  return {
    text:
      '🎯 <b>کاراترخیص | پنل مدیریت</b>\n\n' +
      '📊 <b>وضعیت فعلی CRM</b>\n' +
      '🏢 مشتریان فعال: <b>' + s.customers + '</b>\n' +
      '📁 پرونده‌های باز: <b>' + s.cases + '</b>\n' +
      '✅ تسک‌های باز: <b>' + s.tasks + '</b>\n' +
      '👥 کاربران فعال: <b>' + s.users + '</b>\n\n' +
      'یکی از بخش‌ها را انتخاب کنید:\n\n' +
      '<code>' + APP_VERSION + '</code>',
    kb: {
      inline_keyboard: [
        [{ text:'📊 داشبورد مدیریتی', callback_data:'dashboard' }],
        [
          { text:'🏢 مشتریان', callback_data:'customers' },
          { text:'📁 پرونده‌ها', callback_data:'cases' }
        ],
        [
          { text:'✅ تسک‌ها', callback_data:'tasks' },
          { text:'👥 مدیریت کاربران', callback_data:'users' }
        ]
      ]
    }
  };
}

function dashboardMenuPayloadV422_() {
  return {
    text:'📊 <b>داشبورد مدیریتی</b>\n\nگزارش، هشدار و وضعیت همگام‌سازی را از این بخش مدیریت کنید.',
    kb:{
      inline_keyboard:[
        [
          { text:'📈 خلاصه وضعیت', callback_data:'dashboard:summary' },
          { text:'🗓 گزارش روزانه', callback_data:'dashboard:daily' }
        ],
        [
          { text:'⚠️ هشدارها', callback_data:'dashboard:alerts' },
          { text:'🔗 داشبوردها', callback_data:'dashboard:links' }
        ],
        [{ text:'🔄 همگام‌سازی و لینک‌سازی', callback_data:'dashboard:sync' }],
        [{ text:'⬅️ بازگشت', callback_data:'main' }]
      ]
    }
  };
}

function entityMenuPayloadV422_(entity) {
  const names = {
    customers:'🏢 مشتریان',
    cases:'📁 پرونده‌ها',
    tasks:'✅ تسک‌ها',
    users:'👥 مدیریت کاربران'
  };
  const rows = [
    [
      { text:'📋 لیست', callback_data:entity + ':list' },
      { text:'🔎 جستجو', callback_data:entity + ':search' }
    ],
    [
      { text:'➕ ثبت جدید', callback_data:entity + ':add' },
      { text:'✏️ اصلاح', callback_data:entity + ':edit' }
    ],
    [{
      text: entity === 'tasks' ? '✅ تکمیل تسک' : '🚫 غیرفعال/بایگانی',
      callback_data: entity + ':' + (entity === 'tasks' ? 'complete' : 'deactivate')
    }],
    [{ text:'🗑 حذف کامل', callback_data:entity + ':delete' }]
  ];

  if (entity === 'customers' || entity === 'cases') {
    rows.push([{ text:'📎 اسناد مرتبط', callback_data:entity + ':docs' }]);
  }
  if (entity === 'users') {
    rows.push([{ text:'🔗 وضعیت Workspace', callback_data:'users:workspace' }]);
  }
  rows.push([{ text:'⬅️ بازگشت', callback_data:'main' }]);

  return {
    text:(names[entity] || entity) + '\n\nعملیات موردنظر را انتخاب کنید:',
    kb:{ inline_keyboard:rows }
  };
}

function dashboardSummaryPayloadV422_() {
  const s = getStableStatsV422_();
  return {
    text:
      '📈 <b>خلاصه وضعیت CRM</b>\n\n' +
      '🏢 مشتریان فعال: <b>' + s.customers + '</b>\n\n' +
      '📁 پرونده‌های باز: <b>' + s.cases + '</b>\n\n' +
      '✅ تسک‌های باز: <b>' + s.tasks + '</b>\n\n' +
      '👥 کاربران فعال: <b>' + s.users + '</b>\n\n' +
      '⚠️ نیازمند توجه مدیر: <b>' + s.attention + '</b>',
    kb:{
      inline_keyboard:[
        [{ text:'⬅️ بازگشت', callback_data:'dashboard' }],
        [{ text:'🏠 منوی اصلی', callback_data:'main' }]
      ]
    }
  };
}

function dashboardLinksPayloadV422_() {
  return {
    text:
      '🔗 <b>داشبوردهای مجزا</b>\n\n' +
      '👑 <a href="' + LIVE_DASHBOARDS.admin + '">داشبورد مدیر</a>\n\n' +
      '👷 <a href="' + LIVE_DASHBOARDS.employee + '">داشبورد کارمند داخلی</a>\n\n' +
      '🏢 <a href="' + LIVE_DASHBOARDS.customerManager + '">داشبورد مدیر مشتری</a>\n\n' +
      '👤 <a href="' + LIVE_DASHBOARDS.customerEmployee + '">داشبورد کارمند مشتری</a>',
    kb:{
      inline_keyboard:[
        [{ text:'⬅️ بازگشت', callback_data:'dashboard' }],
        [{ text:'🏠 منوی اصلی', callback_data:'main' }]
      ]
    }
  };
}

function telegramRequestV422_(method, payload) {
  return {
    url:'https://api.telegram.org/bot' + BOT_TOKEN + '/' + method,
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify(payload || {}),
    muteHttpExceptions:true
  };
}

function parseTelegramResponseV422_(response, method) {
  let parsed;
  try {
    parsed = JSON.parse(response.getContentText());
  } catch (_) {
    parsed = {
      ok:false,
      description:'Telegram response is not valid JSON',
      raw:response.getContentText()
    };
  }
  parsed._httpCode = response.getResponseCode();
  parsed._method = method;
  return parsed;
}

function fastAckEditV422_(callback, payload) {
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;

  const started = Date.now();
  const responses = UrlFetchApp.fetchAll([
    telegramRequestV422_('answerCallbackQuery', {
      callback_query_id:callback.id
    }),
    telegramRequestV422_('editMessageText', {
      chat_id:chatId,
      message_id:messageId,
      text:payload.text,
      parse_mode:'HTML',
      disable_web_page_preview:true,
      reply_markup:payload.kb || { inline_keyboard:[] }
    })
  ]);

  const ack = parseTelegramResponseV422_(responses[0], 'answerCallbackQuery');
  const edit = parseTelegramResponseV422_(responses[1], 'editMessageText');

  const desc = String((edit && edit.description) || '');
  const editOk = !!(edit && edit.ok) || desc.indexOf('message is not modified') >= 0;

  if (editOk) {
    setPanelMessageId(chatId, messageId);
  } else {
    // Fallback only on actual Telegram edit failure.
    const sent = sendMessage(chatId, payload.text, payload.kb || { inline_keyboard:[] });
    if (sent && sent.ok && sent.result && sent.result.message_id != null) {
      const newId = Number(sent.result.message_id);
      setPanelMessageId(chatId, newId);
      try { deleteTelegramMessage(chatId, messageId); } catch (_) {}
    }
  }

  setPerfTraceV422_({
    path:'fast-nav',
    callback:String(callback.data || ''),
    ms:Date.now() - started,
    ackOk:!!(ack && ack.ok),
    editOk:editOk
  });

  return { ok:editOk, ack:ack, edit:edit };
}

function fastRejectStaleV422_(callback, activePanelId) {
  try {
    UrlFetchApp.fetchAll([
      telegramRequestV422_('answerCallbackQuery', {
        callback_query_id:callback.id,
        text:'این منو قدیمی است؛ از آخرین منوی ربات استفاده کنید.'
      }),
      telegramRequestV422_('editMessageReplyMarkup', {
        chat_id:callback.message.chat.id,
        message_id:callback.message.message_id,
        reply_markup:{ inline_keyboard:[] }
      })
    ]);
  } catch (_) {}
  setPerfTraceV422_({
    path:'stale-reject',
    callback:String(callback.data || ''),
    activePanelId:activePanelId,
    staleMessageId:callback.message.message_id,
    ms:0
  });
}

function manualSyncPendingKeyV422_() {
  return 'KARATARHIS_MANUAL_SYNC_PENDING_V422';
}

function queueManualSyncV422_() {
  const props = PropertiesService.getScriptProperties();
  const key = manualSyncPendingKeyV422_();
  const existing = Number(props.getProperty(key) || 0);
  const now = Date.now();

  // If a job was queued less than 10 minutes ago, don't create another.
  if (existing && now - existing < 10 * 60 * 1000) {
    return { queued:true, duplicate:true };
  }

  props.setProperty(key, String(now));
  ScriptApp.newTrigger('runManualSyncV422_')
    .timeBased()
    .after(1000)
    .create();

  return { queued:true, duplicate:false };
}

function runManualSyncV422_() {
  try {
    const result = syncAllActiveWorkspacesV412();
    try { refreshTelegramStatsV422(); } catch (_) {}
    return result;
  } finally {
    try {
      PropertiesService.getScriptProperties().deleteProperty(manualSyncPendingKeyV422_());
    } catch (_) {}
  }
}

function syncQueuedPayloadV422_(duplicate) {
  return {
    text:
      '🔄 <b>همگام‌سازی در پس‌زمینه قرار گرفت</b>\n\n' +
      (duplicate
        ? '⏳ یک همگام‌سازی از قبل در صف است.'
        : '✅ درخواست ثبت شد؛ منوی ربات منتظر پایان Sync نمی‌ماند.') +
      '\n\nمی‌توانید بدون توقف به کار با ربات ادامه دهید.',
    kb:{
      inline_keyboard:[
        [{ text:'⬅️ بازگشت', callback_data:'dashboard' }],
        [{ text:'🏠 منوی اصلی', callback_data:'main' }]
      ]
    }
  };
}

function handleFastNavigationV422_(callback) {
  if (!callback || !callback.message || !callback.message.chat) return false;

  const data = String(callback.data || '');
  if (!V422_FAST_NAV[data]) return false;

  // Admin navigation is the only callback menu currently exposed.
  const userId = String(callback.from && callback.from.id);
  if (!isAdmin(userId)) return false;

  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;

  const activePanelId = getPanelMessageId(chatId);
  if (activePanelId && Number(activePanelId) !== Number(messageId)) {
    fastRejectStaleV422_(callback, activePanelId);
    return true;
  }

  let payload = null;

  if (data === 'main') payload = mainMenuPayloadV422_();
  else if (data === 'dashboard') payload = dashboardMenuPayloadV422_();
  else if (['customers','cases','tasks','users'].indexOf(data) >= 0) {
    payload = entityMenuPayloadV422_(data);
  }
  else if (data === 'dashboard:summary') payload = dashboardSummaryPayloadV422_();
  else if (data === 'dashboard:links') payload = dashboardLinksPayloadV422_();
  else if (data === 'dashboard:sync') {
    const q = queueManualSyncV422_();
    payload = syncQueuedPayloadV422_(!!q.duplicate);
  }

  if (!payload) return false;

  fastAckEditV422_(callback, payload);
  return true;
}

function getRecentEntityRowsV422_(entity, limit) {
  limit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const cfg = SHEETS[entity];
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const dataStart = cfg.headerRow + 1;
  const lastRow = sh.getLastRow();

  if (lastRow < dataStart) return [];

  const startRow = Math.max(dataStart, lastRow - limit + 1);
  const count = lastRow - startRow + 1;

  const values = sh.getRange(startRow, 1, count, headers.length).getValues();

  return values
    .filter(function(row){
      return row.some(function(v){ return String(v).trim() !== ''; });
    })
    .map(function(row){
      const obj = {};
      headers.forEach(function(h, i){ if (h) obj[h] = row[i]; });
      return obj;
    })
    .reverse();
}

// Override: list no longer scans the whole sheet.
function showEntityList(chatId, messageId, entity) {
  const started = Date.now();
  const rows = getRecentEntityRowsV422_(entity, 20);
  const title = {
    customers:'🏢 آخرین مشتریان',
    cases:'📁 آخرین پرونده‌ها',
    tasks:'✅ آخرین تسک‌ها',
    users:'👥 آخرین کاربران'
  }[entity];

  let text = title + '\n\n';
  if (!rows.length) {
    text += 'رکوردی ثبت نشده است.';
  } else {
    rows.forEach(function(r, i) {
      text += formatEntityLine(entity, r, i + 1) + '\n\n';
    });
  }

  editMessage(chatId, messageId, truncateTelegram(text), entityBackKeyboard(entity));

  setPerfTraceV422_({
    path:'entity-list',
    entity:entity,
    rows:rows.length,
    ms:Date.now() - started
  });
}

// Final webhook override for V4.22.
function doPost(e) {
  let updateId = '';
  const started = Date.now();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok:true, version:APP_VERSION });
    }

    const raw = JSON.parse(e.postData.contents);

    if (raw && raw.internal_action) {
      return jsonResponse(handleInternalActionV414_(raw));
    }

    const update = raw;
    updateId = String(update.update_id || '');

    if (updateId && isDuplicateUpdate(updateId)) {
      return jsonResponse({
        ok:true,
        duplicate:true,
        version:APP_VERSION
      });
    }

    if (update.callback_query) {
      if (!handleFastNavigationV422_(update.callback_query)) {
        handleCallback(update.callback_query);
      }
    } else if (update.message) {
      handleMessage(update.message);
    }

    setPerfTraceV422_({
      path:'webhook',
      updateId:updateId,
      kind:update.callback_query ? 'callback' : (update.message ? 'message' : 'other'),
      ms:Date.now() - started
    });

    return jsonResponse({
      ok:true,
      version:APP_VERSION,
      ms:Date.now() - started
    });

  } catch (err) {
    if (updateId) {
      try {
        CacheService.getScriptCache().remove('TG_UPDATE_' + updateId);
      } catch (_) {}
    }

    try {
      logSystem(
        'telegram_v422_error',
        String(err && err.stack ? err.stack : err)
      );
    } catch (_) {}

    setPerfTraceV422_({
      path:'webhook-error',
      updateId:updateId,
      ms:Date.now() - started,
      error:String(err && err.message ? err.message : err)
    });

    // Return HTTP 200-compatible payload so Telegram does not aggressively retry.
    return jsonResponse({
      ok:true,
      handled_error:true,
      version:APP_VERSION,
      error:String(err && err.message ? err.message : err)
    });
  }
}

function installTelegramStatsTriggerV422_() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'refreshTelegramStatsV422') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });

  const trigger = ScriptApp
    .newTrigger('refreshTelegramStatsV422')
    .timeBased()
    .everyMinutes(10)
    .create();

  return {
    ok:true,
    handler:'refreshTelegramStatsV422',
    minutes:10,
    triggerId:trigger.getUniqueId(),
    removedDuplicates:removed
  };
}

function testV422FastNavigation() {
  const samples = [
    'main',
    'dashboard',
    'customers',
    'cases',
    'tasks',
    'users',
    'dashboard:summary',
    'dashboard:links',
    'dashboard:sync'
  ];

  const report = {
    ok:true,
    version:APP_VERSION,
    fastCallbacks:samples,
    stableStats:getStableStatsV422_(),
    lastPerformance:getLastTelegramPerformanceV422()
  };

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// Final installer override for V4.22.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();
  const telegramStatsTrigger = installTelegramStatsTriggerV422_();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  let templateRepair = [];
  try { templateRepair = ensureDashboardTemplatesReadyV412(); } catch (_) {}

  let dailyRepair = null;
  try { dailyRepair = repairExistingWorkspaceDailyTabsV420_(); }
  catch (err) { dailyRepair = { ok:false, error:String(err) }; }

  let categoryRepair = null;
  try { categoryRepair = repairExistingWorkspaceCategoriesV421_(); }
  catch (err) { categoryRepair = { ok:false, error:String(err) }; }

  let stats = null;
  try { stats = refreshTelegramStatsV422(); }
  catch (err) { stats = { error:String(err) }; }

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:webhookOk,
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    telegramStatsTrigger:telegramStatsTrigger,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    templateRepair:templateRepair,
    dailyRepair:dailyRepair,
    categoryRepair:categoryRepair,
    stats:stats,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));

  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.22 نصب شد</b>' : '⚠️ <b>V4.22 با هشدار نصب شد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n⚡ جابه‌جایی منوها: <b>Fast Navigation</b>' +
    '\n🚫 خواندن Sheet هنگام جابه‌جایی منو: <b>حذف شد</b>' +
    '\n🔄 Sync دستی: <b>پس‌زمینه</b>' +
    '\n📋 لیست‌ها: <b>فقط 20 ردیف آخر</b>' +
    '\n📊 کش آمار: <b>هر 10 دقیقه</b>'
  );

  return report;
}

function installTelegramBot() {
  return repairBotInstallation();
}


/************************************************************
 * V4.23 — TELEGRAM ESSENTIALS ONLY
 * ----------------------------------------------------------
 * Telegram is now a lightweight READ / ALERT interface.
 * Data entry, edit and delete stay in Google Sheets.
 *
 * Admin Telegram menu:
 *   📊 گزارش امروز
 *   ⚠️ هشدارهای مهم
 *   📁 پرونده‌های نیازمند اقدام
 *   ✅ تسک‌های مهم
 *   🔗 ورود به CRM
 *
 * User Telegram menu:
 *   📅 کارهای امروز من
 *   ⚠️ موارد مهم من
 *   🔗 میز کار من
 ************************************************************/

const CRM_MAIN_URL_V423 =
  'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit';

function buildAdminMenuPayloadFast() {
  return {
    text:
      '🎯 <b>کاراترخیص | گزارش سریع</b>\n\n' +
      'ربات فقط برای دریافت اطلاعات مهم و هشدارهاست.\n' +
      'ثبت، ویرایش و حذف اطلاعات از Google Sheet انجام می‌شود.\n\n' +
      '<code>' + APP_VERSION + '</code>',
    kb: {
      inline_keyboard: [
        [
          { text:'📊 گزارش امروز', callback_data:'brief:today' },
          { text:'⚠️ هشدارهای مهم', callback_data:'brief:alerts' }
        ],
        [
          { text:'📁 پرونده‌های مهم', callback_data:'brief:cases' },
          { text:'✅ تسک‌های مهم', callback_data:'brief:tasks' }
        ],
        [
          { text:'🔗 ورود به CRM', url:CRM_MAIN_URL_V423 }
        ]
      ]
    }
  };
}

function mainMenuPayloadV422_() {
  return buildAdminMenuPayloadFast();
}

function buildRoleTelegramHomeV419_(ctx) {
  const user = ctx.user || {};
  const role = ctx.role || normalizeRole(user['نقش'] || '');
  const name = String(user['نام کامل'] || 'کاربر');
  const company = String(user['شرکت'] || '').trim();
  const workspace = getUserWorkspaceUrlV419_(user);

  let title = '👤 <b>کاراترخیص | میز کار من</b>';
  if (role === 'مدیر مشتری') title = '🏢 <b>کاراترخیص | مدیر مشتری</b>';
  else if (role === 'کارمند مشتری') title = '👥 <b>کاراترخیص | کارمند مشتری</b>';
  else if (role === 'کارمند داخلی') title = '🧰 <b>کاراترخیص | کارمند داخلی</b>';

  let body =
    title + '\n\n' +
    '👤 <b>' + escapeHtml(name) + '</b>\n' +
    '🔐 ' + escapeHtml(role) + '\n';

  if (company) body += '🏢 ' + escapeHtml(company) + '\n';

  body +=
    '\nربات فقط موارد مهم شما را نمایش می‌دهد.\n' +
    'ثبت و ویرایش اطلاعات از میز کار Google Sheet انجام می‌شود.\n\n' +
    '<code>' + APP_VERSION + '</code>';

  const buttons = [
    [
      { text:'📅 کارهای امروز من', callback_data:'me:today' },
      { text:'⚠️ موارد مهم من', callback_data:'me:alerts' }
    ]
  ];

  if (workspace) {
    buttons.push([{ text:'🔗 ورود به میز کار من', url:workspace }]);
  }

  return {
    text:body,
    kb:{ inline_keyboard:buttons }
  };
}

function readRecentByCfgV423_(cfg, limit) {
  limit = Math.max(1, Math.min(Number(limit) || 60, 150));
  const sh = getSheet(cfg);
  const headers = getHeaders(cfg);
  const firstData = cfg.headerRow + 1;
  const last = sh.getLastRow();

  if (last < firstData) return [];

  const start = Math.max(firstData, last - limit + 1);
  const count = last - start + 1;
  const values = sh.getRange(start, 1, count, headers.length).getValues();

  return values.map(function(row) {
    const o = {};
    headers.forEach(function(h, i) {
      if (h) o[h] = row[i];
    });
    return o;
  }).filter(function(o) {
    return Object.keys(o).some(function(k) {
      return String(o[k] == null ? '' : o[k]).trim() !== '';
    });
  }).reverse();
}

function truthyV423_(value) {
  if (value === true) return true;
  const s = String(value == null ? '' : value).trim().toLowerCase();
  return ['true','1','yes','بله','فعال','نیازمند مدیر','نیازمند توجه'].indexOf(s) >= 0;
}

function isClosedTaskV423_(r) {
  const s = String(r['وضعیت'] || '').trim();
  return ['انجام شد','انجام شده','بسته شد','بسته شده','لغو شده'].indexOf(s) >= 0;
}

function isClosedCaseV423_(r) {
  const s = String(r['وضعیت'] || '').trim();
  return ['تکمیل شده','بسته شده','بایگانی','مختومه'].indexOf(s) >= 0;
}

function importanceScoreTaskV423_(r) {
  let score = 0;
  if (truthyV423_(r['نیازمند مدیر'])) score += 100;
  const p = String(r['اولویت'] || '').trim();
  if (p === 'فوری') score += 80;
  else if (p === 'بالا') score += 50;
  else if (p === 'متوسط') score += 20;
  if (String(r['موعد'] || '').trim()) score += 5;
  return score;
}

function importanceScoreCaseV423_(r) {
  let score = 0;
  if (truthyV423_(r['نیازمند توجه مدیر'])) score += 100;
  if (String(r['تسک باز'] || '').trim()) score += 30;
  const docs = String(r['وضعیت اسناد'] || '').trim();
  if (!docs || docs.indexOf('ناقص') >= 0 || docs.indexOf('منتظر') >= 0) score += 20;
  return score;
}

function briefBackKbV423_(admin) {
  return {
    inline_keyboard: [[{
      text:'⬅️ بازگشت',
      callback_data: admin ? 'main' : 'me:home'
    }]]
  };
}

function adminTodayPayloadV423_() {
  const stats = getStableStatsV422_();
  const tasks = readRecentByCfgV423_(SHEETS.tasks, 80)
    .filter(function(r){ return !isClosedTaskV423_(r); });
  const cases = readRecentByCfgV423_(SHEETS.cases, 80)
    .filter(function(r){ return !isClosedCaseV423_(r); });

  const urgentTasks = tasks.filter(function(r) {
    return importanceScoreTaskV423_(r) >= 50;
  }).length;

  const attentionCases = cases.filter(function(r) {
    return importanceScoreCaseV423_(r) >= 50;
  }).length;

  return {
    text:
      '📊 <b>گزارش امروز</b>\n\n' +
      '🏢 مشتریان فعال: <b>' + stats.customers + '</b>\n\n' +
      '📁 پرونده‌های باز: <b>' + stats.cases + '</b>\n' +
      '🚨 پرونده مهم در بررسی اخیر: <b>' + attentionCases + '</b>\n\n' +
      '✅ تسک‌های باز: <b>' + stats.tasks + '</b>\n' +
      '🔥 تسک فوری/بالا در بررسی اخیر: <b>' + urgentTasks + '</b>\n\n' +
      '⚠️ نیازمند توجه مدیر: <b>' + stats.attention + '</b>\n\n' +
      '🕒 ' + escapeHtml(nowFa()),
    kb:briefBackKbV423_(true)
  };
}

function adminAlertsPayloadV423_() {
  const tasks = readRecentByCfgV423_(SHEETS.tasks, 100)
    .filter(function(r){ return !isClosedTaskV423_(r); })
    .filter(function(r){ return importanceScoreTaskV423_(r) >= 50; })
    .sort(function(a,b){ return importanceScoreTaskV423_(b) - importanceScoreTaskV423_(a); })
    .slice(0, 6);

  const cases = readRecentByCfgV423_(SHEETS.cases, 100)
    .filter(function(r){ return !isClosedCaseV423_(r); })
    .filter(function(r){ return importanceScoreCaseV423_(r) >= 50; })
    .sort(function(a,b){ return importanceScoreCaseV423_(b) - importanceScoreCaseV423_(a); })
    .slice(0, 6);

  let text = '⚠️ <b>هشدارهای مهم</b>\n\n';

  if (!tasks.length && !cases.length) {
    text += '✅ مورد بحرانی در رکوردهای اخیر دیده نشد.';
  }

  if (tasks.length) {
    text += '🔥 <b>تسک‌ها</b>\n';
    tasks.forEach(function(r) {
      text +=
        '• ' + escapeHtml(String(r['موضوع'] || r['Task ID'] || 'تسک')) +
        (r['مسئول'] ? ' — 👤 ' + escapeHtml(String(r['مسئول'])) : '') +
        (r['موعد'] ? '\n  ⏰ ' + escapeHtml(String(r['موعد'])) : '') +
        '\n';
    });
    text += '\n';
  }

  if (cases.length) {
    text += '📁 <b>پرونده‌ها</b>\n';
    cases.forEach(function(r) {
      text +=
        '• ' + escapeHtml(String(r['مشتری'] || r['Case ID'] || 'پرونده')) +
        (r['وضعیت'] ? ' — ' + escapeHtml(String(r['وضعیت'])) : '') +
        '\n';
    });
  }

  return {
    text:truncateTelegram(text),
    kb:briefBackKbV423_(true)
  };
}

function adminCasesPayloadV423_() {
  const rows = readRecentByCfgV423_(SHEETS.cases, 100)
    .filter(function(r){ return !isClosedCaseV423_(r); })
    .sort(function(a,b){ return importanceScoreCaseV423_(b) - importanceScoreCaseV423_(a); })
    .slice(0, 10);

  let text = '📁 <b>پرونده‌های نیازمند اقدام</b>\n\n';

  if (!rows.length) {
    text += 'پرونده باز مهمی در رکوردهای اخیر نیست.';
  } else {
    rows.forEach(function(r, i) {
      text +=
        (i + 1) + '. <b>' +
        escapeHtml(String(r['مشتری'] || r['Case ID'] || 'پرونده')) +
        '</b>\n' +
        '   وضعیت: ' + escapeHtml(String(r['وضعیت'] || '-')) +
        (r['مسئول داخلی اصلی']
          ? '\n   👤 ' + escapeHtml(String(r['مسئول داخلی اصلی']))
          : '') +
        (truthyV423_(r['نیازمند توجه مدیر'])
          ? '\n   🚨 نیازمند توجه مدیر'
          : '') +
        '\n\n';
    });
  }

  return {
    text:truncateTelegram(text),
    kb:briefBackKbV423_(true)
  };
}

function adminTasksPayloadV423_() {
  const rows = readRecentByCfgV423_(SHEETS.tasks, 120)
    .filter(function(r){ return !isClosedTaskV423_(r); })
    .sort(function(a,b){ return importanceScoreTaskV423_(b) - importanceScoreTaskV423_(a); })
    .slice(0, 10);

  let text = '✅ <b>تسک‌های مهم</b>\n\n';

  if (!rows.length) {
    text += 'تسک بازی در رکوردهای اخیر نیست.';
  } else {
    rows.forEach(function(r, i) {
      text +=
        (i + 1) + '. <b>' +
        escapeHtml(String(r['موضوع'] || r['Task ID'] || 'تسک')) +
        '</b>\n' +
        '   🎯 ' + escapeHtml(String(r['اولویت'] || '-')) +
        (r['مسئول'] ? ' | 👤 ' + escapeHtml(String(r['مسئول'])) : '') +
        (r['موعد'] ? '\n   ⏰ ' + escapeHtml(String(r['موعد'])) : '') +
        (truthyV423_(r['نیازمند مدیر']) ? '\n   🚨 نیازمند مدیر' : '') +
        '\n\n';
    });
  }

  return {
    text:truncateTelegram(text),
    kb:briefBackKbV423_(true)
  };
}

function personalDailyRowsV423_(user, limit) {
  const tokens = [
    String(user['User ID'] || '').trim(),
    String(user['نام کامل'] || '').trim(),
    String(user['Telegram User ID'] || '').trim()
  ].filter(Boolean);

  return readRecentByCfgV423_(SHEETS.dailyTasks, limit || 120)
    .filter(function(r) {
      const owner = String(r['مسئول'] || '').trim();
      const source = String(r['منبع'] || '').trim();
      const mine = tokens.some(function(t) {
        return owner === t || owner.indexOf(t) >= 0 || source === 'PERSONAL:' + t;
      });
      if (!mine) return false;
      const status = String(r['وضعیت'] || '').trim();
      return ['انجام شد','لغو شده'].indexOf(status) < 0;
    });
}

function personalTodayPayloadV423_(ctx) {
  const user = ctx.user || {};
  const rows = personalDailyRowsV423_(user, 120).slice(0, 10);

  let text =
    '📅 <b>کارهای امروز من</b>\n\n' +
    '👤 ' + escapeHtml(String(user['نام کامل'] || 'کاربر')) + '\n\n';

  if (!rows.length) {
    text += '✅ تسک روزانه بازی برای شما ثبت نشده است.';
  } else {
    rows.forEach(function(r, i) {
      text +=
        (i + 1) + '. <b>' +
        escapeHtml(String(r['کار روزانه'] || r['شناسه کار'] || 'کار')) +
        '</b>\n' +
        '   🎯 ' + escapeHtml(String(r['اولویت'] || 'متوسط')) +
        (r['موعد'] ? ' | ⏰ ' + escapeHtml(String(r['موعد'])) : '') +
        '\n\n';
    });
  }

  return {
    text:truncateTelegram(text),
    kb:briefBackKbV423_(false)
  };
}

function personalAlertsPayloadV423_(ctx) {
  const user = ctx.user || {};
  const rows = personalDailyRowsV423_(user, 150)
    .filter(function(r) {
      const p = String(r['اولویت'] || '').trim();
      return p === 'فوری' || p === 'بالا';
    })
    .slice(0, 10);

  let text =
    '⚠️ <b>موارد مهم من</b>\n\n' +
    '👤 ' + escapeHtml(String(user['نام کامل'] || 'کاربر')) + '\n\n';

  if (!rows.length) {
    text += '✅ مورد فوری یا با اولویت بالا ندارید.';
  } else {
    rows.forEach(function(r, i) {
      text +=
        (i + 1) + '. <b>' +
        escapeHtml(String(r['کار روزانه'] || r['شناسه کار'] || 'کار')) +
        '</b>\n' +
        '   🔥 ' + escapeHtml(String(r['اولویت'] || '')) +
        (r['موعد'] ? ' | ⏰ ' + escapeHtml(String(r['موعد'])) : '') +
        '\n\n';
    });
  }

  return {
    text:truncateTelegram(text),
    kb:briefBackKbV423_(false)
  };
}

function quickLoadingV423_(callback, title) {
  try {
    fastAckEditV422_(callback, {
      text:'⏳ <b>' + escapeHtml(title) + '</b>\n\nدر حال دریافت اطلاعات...',
      kb:{ inline_keyboard:[] }
    });
  } catch (_) {
    try { answerCallback(callback.id); } catch (_) {}
  }
}

function handleEssentialCallbackV423_(callback) {
  if (!callback || !callback.message || !callback.message.chat) return false;

  const data = String(callback.data || '');
  const telegramId = String(callback.from && callback.from.id);
  const ctx = getTelegramUserContextV419_(telegramId);

  // Legacy operational buttons are intentionally removed.
  if (
    /^(customers|cases|tasks|users)(:|$)/.test(data) ||
    data === 'dashboard' ||
    /^dashboard:/.test(data)
  ) {
    if (!ctx.authorized) return false;

    if (ctx.isAdmin || telegramId === String(ADMIN_TELEGRAM_ID)) {
      fastAckEditV422_(callback, buildAdminMenuPayloadFast());
    } else {
      fastAckEditV422_(callback, buildRoleTelegramHomeV419_(ctx));
    }
    return true;
  }

  if (data === 'main') {
    if (!ctx.authorized) return false;
    if (ctx.isAdmin || telegramId === String(ADMIN_TELEGRAM_ID)) {
      fastAckEditV422_(callback, buildAdminMenuPayloadFast());
    } else {
      fastAckEditV422_(callback, buildRoleTelegramHomeV419_(ctx));
    }
    return true;
  }

  if (data === 'me:home') {
    if (!ctx.authorized || ctx.isAdmin) return false;
    fastAckEditV422_(callback, buildRoleTelegramHomeV419_(ctx));
    return true;
  }

  if (data === 'brief:today' && ctx.isAdmin) {
    quickLoadingV423_(callback, 'گزارش امروز');
    editMessage(
      callback.message.chat.id,
      callback.message.message_id,
      adminTodayPayloadV423_().text,
      briefBackKbV423_(true)
    );
    return true;
  }

  if (data === 'brief:alerts' && ctx.isAdmin) {
    quickLoadingV423_(callback, 'هشدارهای مهم');
    const p = adminAlertsPayloadV423_();
    editMessage(callback.message.chat.id, callback.message.message_id, p.text, p.kb);
    return true;
  }

  if (data === 'brief:cases' && ctx.isAdmin) {
    quickLoadingV423_(callback, 'پرونده‌های مهم');
    const p = adminCasesPayloadV423_();
    editMessage(callback.message.chat.id, callback.message.message_id, p.text, p.kb);
    return true;
  }

  if (data === 'brief:tasks' && ctx.isAdmin) {
    quickLoadingV423_(callback, 'تسک‌های مهم');
    const p = adminTasksPayloadV423_();
    editMessage(callback.message.chat.id, callback.message.message_id, p.text, p.kb);
    return true;
  }

  if (data === 'me:today' && ctx.authorized && !ctx.isAdmin) {
    quickLoadingV423_(callback, 'کارهای امروز من');
    const p = personalTodayPayloadV423_(ctx);
    editMessage(callback.message.chat.id, callback.message.message_id, p.text, p.kb);
    return true;
  }

  if (data === 'me:alerts' && ctx.authorized && !ctx.isAdmin) {
    quickLoadingV423_(callback, 'موارد مهم من');
    const p = personalAlertsPayloadV423_(ctx);
    editMessage(callback.message.chat.id, callback.message.message_id, p.text, p.kb);
    return true;
  }

  return false;
}

// Final webhook override for V4.23.
function doPost(e) {
  let updateId = '';

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok:true, version:APP_VERSION });
    }

    const raw = JSON.parse(e.postData.contents);

    if (raw && raw.internal_action) {
      return jsonResponse(handleInternalActionV414_(raw));
    }

    const update = raw;
    updateId = String(update.update_id || '');

    if (updateId && isDuplicateUpdate(updateId)) {
      return jsonResponse({ ok:true, duplicate:true, version:APP_VERSION });
    }

    if (update.callback_query) {
      if (!handleEssentialCallbackV423_(update.callback_query)) {
        if (!handleFastNavigationV422_(update.callback_query)) {
          handleCallback(update.callback_query);
        }
      }
    } else if (update.message) {
      handleMessage(update.message);
    }

    return jsonResponse({ ok:true, version:APP_VERSION });

  } catch (err) {
    if (updateId) {
      try { CacheService.getScriptCache().remove('TG_UPDATE_' + updateId); } catch (_) {}
    }

    try {
      logSystem('telegram_v423_error', String(err && err.stack ? err.stack : err));
    } catch (_) {}

    return jsonResponse({
      ok:true,
      handled_error:true,
      version:APP_VERSION,
      error:String(err && err.message ? err.message : err)
    });
  }
}

// Final installer override for V4.23.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties().deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl = info && info.ok && info.result ? String(info.result.url || '') : '';
  const webhookOk = !!(info && info.ok && actualUrl === expectedUrl);

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();
  const telegramStatsTrigger = installTelegramStatsTriggerV422_();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  let dailyRepair = null;
  try { dailyRepair = repairExistingWorkspaceDailyTabsV420_(); }
  catch (err) { dailyRepair = { ok:false, error:String(err) }; }

  let categoryRepair = null;
  try { categoryRepair = repairExistingWorkspaceCategoriesV421_(); }
  catch (err) { categoryRepair = { ok:false, error:String(err) }; }

  let stats = null;
  try { stats = refreshTelegramStatsV422(); }
  catch (err) { stats = { error:String(err) }; }

  const sweep = enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:webhookOk,
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    telegramStatsTrigger:telegramStatsTrigger,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    dailyRepair:dailyRepair,
    categoryRepair:categoryRepair,
    stats:stats,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));

  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (webhookOk ? '✅ <b>V4.23 نصب شد</b>' : '⚠️ <b>V4.23 با هشدار نصب شد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n🧹 منوی تلگرام: <b>خلوت و فقط دریافت اطلاعات</b>' +
    '\n📝 ثبت/ویرایش/حذف: <b>فقط Google Sheet</b>' +
    '\n⚡ منوی اصلی: <b>بدون خواندن Sheet</b>' +
    '\n📊 گزارش‌های مهم: <b>On-demand</b>'
  );

  return report;
}

function installTelegramBot() {
  return repairBotInstallation();
}


/************************************************************
 * V4.24 — TRUE ROLE-SPECIFIC WORKSPACES
 * ----------------------------------------------------------
 * UX separation:
 *
 * مدیر:
 *   داشبورد مدیریت / مشتریان / پرونده‌ها / تسک‌ها / تسک روزانه
 *
 * کارمند داخلی:
 *   داشبورد من / پرونده‌های من / تسک‌های من /
 *   اسناد پرونده‌های من / تسک روزانه من
 *
 * مدیر مشتری:
 *   داشبورد شرکت / اطلاعات شرکت / پرونده‌های شرکت /
 *   تسک‌های شرکت / تسک روزانه من
 *
 * کارمند مشتری:
 *   داشبورد من / پرونده‌های قابل مشاهده /
 *   تسک‌های من / تسک روزانه من
 *
 * Technical source tabs remain hidden and keep their canonical names,
 * so dashboard formulas and backend sync stay stable.
 ************************************************************/

const ROLE_VIEW_TITLES_V424 = [
  'پرونده‌های من',
  'تسک‌های من',
  'اسناد پرونده‌های من',
  'اطلاعات شرکت',
  'پرونده‌های شرکت',
  'تسک‌های شرکت',
  'پرونده‌های قابل مشاهده'
];

const ROLE_WORKSPACE_CONFIG_V424 = {
  'مدیر': {
    dashboard: 'داشبورد مدیریت',
    color: '#1F4E78',
    views: []
  },

  'کارمند داخلی': {
    dashboard: 'داشبورد من',
    color: '#176B57',
    views: [
      {
        title: 'پرونده‌های من',
        entity: 'cases',
        editable: true,
        columns: [
          'Case ID',
          'شماره کوتاژ',
          'مشتری',
          'نوع عملیات',
          'گمرک',
          'شماره پرونده واقعی',
          'وضعیت',
          'وضعیت اسناد',
          'تسک باز',
          'آخرین فعالیت',
          'وضعیت خروج',
          'تعداد کل',
          'وزن کل',
          'تعداد ترخیص‌شده',
          'وزن ترخیص‌شده',
          'تعداد مانده',
          'وزن مانده',
          'درصد ترخیص',
          'تاریخ کوتاژ',
          'تاریخ ترخیص قطعی/بیجک',
          'مدت ترخیص',
          'نیازمند توجه مدیر',
          'یادداشت'
        ]
      },
      {
        title: 'تسک‌های من',
        entity: 'tasks',
        editable: true,
        columns: [
          'Task ID',
          'شرکت/پرونده',
          'موضوع',
          'دسته‌بندی',
          'اولویت',
          'وضعیت',
          'موعد',
          'نیازمند مدیر',
          'آخرین پاسخ',
          'آخرین فعالیت',
          'نتیجه',
          'اقدام بعدی',
          'یادداشت'
        ]
      },
      {
        title: 'اسناد پرونده‌های من',
        entity: 'caseDocuments',
        editable: false,
        columns: [
          'Document ID',
          'Case ID',
          'کوتاژ',
          'مشتری',
          'نوع عملیات',
          'نوع سند',
          'الزام',
          'وضعیت سند',
          'نسخه جاری',
          'لینک فایل',
          'زمان بارگذاری',
          'بررسی‌کننده',
          'زمان بررسی',
          'دلیل رد/اصلاح',
          'آخرین بروزرسانی',
          'یادداشت'
        ]
      }
    ]
  },

  'مدیر مشتری': {
    dashboard: 'داشبورد شرکت',
    color: '#7A4E14',
    views: [
      {
        title: 'اطلاعات شرکت',
        entity: 'customers',
        editable: true,
        columns: [
          'مشتری ID',
          'نوع مشتری',
          'نام / عنوان مشتری',
          'شناسه ملی / کد ملی',
          'شماره ثبت',
          'کد اقتصادی',
          'شخص رابط',
          'موبایل',
          'تلفن',
          'ایمیل',
          'استان / شهر',
          'آدرس',
          'شروع وکالت',
          'پایان وکالت',
          'وضعیت وکالت',
          'روز مانده وکالت',
          '📁 پوشه اسناد',
          'لینک وکالت‌نامه',
          'یادداشت'
        ]
      },
      {
        title: 'پرونده‌های شرکت',
        entity: 'cases',
        editable: true,
        columns: [
          'Case ID',
          'شماره کوتاژ',
          'مشتری',
          'نوع عملیات',
          'گمرک',
          'شماره پرونده واقعی',
          'وضعیت',
          'وضعیت اسناد',
          'تسک باز',
          'آخرین فعالیت',
          'وضعیت خروج',
          'تعداد کل',
          'وزن کل',
          'تعداد ترخیص‌شده',
          'وزن ترخیص‌شده',
          'تعداد مانده',
          'وزن مانده',
          'درصد ترخیص',
          'تاریخ کوتاژ',
          'تاریخ ترخیص قطعی/بیجک',
          'مدت ترخیص',
          'یادداشت'
        ]
      },
      {
        title: 'تسک‌های شرکت',
        entity: 'tasks',
        editable: true,
        columns: [
          'Task ID',
          'شرکت/پرونده',
          'موضوع',
          'دسته‌بندی',
          'اولویت',
          'وضعیت',
          'موعد',
          'نیازمند مدیر',
          'آخرین پاسخ',
          'آخرین فعالیت',
          'نتیجه',
          'اقدام بعدی',
          'یادداشت'
        ]
      }
    ]
  },

  'کارمند مشتری': {
    dashboard: 'داشبورد من',
    color: '#5B4B8A',
    views: [
      {
        title: 'پرونده‌های قابل مشاهده',
        entity: 'cases',
        editable: false,
        columns: [
          'Case ID',
          'شماره کوتاژ',
          'مشتری',
          'نوع عملیات',
          'گمرک',
          'شماره پرونده واقعی',
          'وضعیت',
          'وضعیت اسناد',
          'آخرین فعالیت',
          'وضعیت خروج',
          'درصد ترخیص',
          'تاریخ کوتاژ',
          'تاریخ ترخیص قطعی/بیجک',
          'مدت ترخیص',
          'یادداشت'
        ]
      },
      {
        title: 'تسک‌های من',
        entity: 'tasks',
        editable: false,
        columns: [
          'Task ID',
          'شرکت/پرونده',
          'موضوع',
          'دسته‌بندی',
          'اولویت',
          'وضعیت',
          'موعد',
          'نتیجه',
          'اقدام بعدی',
          'یادداشت'
        ]
      }
    ]
  }
};

function roleConfigV424_(role) {
  role = normalizeRole(String(role || ''));
  return ROLE_WORKSPACE_CONFIG_V424[role] || ROLE_WORKSPACE_CONFIG_V424['کارمند مشتری'];
}

function sourceCfgForRoleEntityV424_(entity) {
  if (entity === 'customers') return SHEETS.customers;
  if (entity === 'cases') return SHEETS.cases;
  if (entity === 'tasks') return SHEETS.tasks;
  if (entity === 'caseDocuments') return SHEETS.caseDocumentsV2;
  return null;
}

function sourceRowsForRoleEntityV424_(scoped, entity) {
  if (entity === 'customers') return scoped.customers || [];
  if (entity === 'cases') return scoped.cases || [];
  if (entity === 'tasks') return scoped.tasks || [];
  if (entity === 'caseDocuments') return scoped.caseDocuments || [];
  return [];
}

function normalizeRoleViewTextV424_(v) {
  return String(v == null ? '' : v)
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getScopedWorkspaceDataV412_(user) {
  const src = getWorkspaceSourceSnapshotV412_();
  const role = normalizeRole(user['نقش']);

  if (role === 'مدیر') return src;

  const userTokens = [
    user['User ID'],
    user['نام کامل'],
    user['Telegram User ID']
  ].filter(Boolean);

  let cases = [];
  let customers = [];
  let tasks = [];
  let leads = [];
  let customerTasks = [];
  let caseDocuments = [];

  if (role === 'کارمند داخلی') {
    cases = src.cases.filter(function(r) {
      return textContainsAnyV412_(r['مسئول داخلی اصلی'], userTokens) ||
        textContainsAnyV412_(r['همکاران داخلی'], userTokens);
    });

    const caseIds = cases.map(function(r) {
      return String(r['Case ID'] || '').trim();
    }).filter(Boolean);

    const customerIds = cases.map(function(r) {
      return String(r['Customer ID'] || '').trim();
    }).filter(Boolean);

    customers = src.customers.filter(function(r) {
      return customerIds.indexOf(String(r['مشتری ID'] || '').trim()) >= 0;
    });

    tasks = src.tasks.filter(function(r) {
      return textContainsAnyV412_(r['مسئول'], userTokens) ||
        (
          String(r['نوع ارتباط'] || '') === 'پرونده' &&
          caseIds.indexOf(String(r['شناسه مرتبط'] || '').trim()) >= 0
        );
    });

    leads = src.leads.filter(function(r) {
      return textContainsAnyV412_(r['مسئول'], userTokens);
    });

    customerTasks = src.customerTasks.filter(function(r) {
      return textContainsAnyV412_(r['مسئول'], userTokens) ||
        caseIds.indexOf(String(r['شناسه پرونده'] || '').trim()) >= 0;
    });

    caseDocuments = src.caseDocuments.filter(function(r) {
      return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0;
    });

  } else if (role === 'مدیر مشتری' || role === 'کارمند مشتری') {
    const customerId = String(user['Customer ID'] || '').trim();

    customers = src.customers.filter(function(r) {
      return String(r['مشتری ID'] || '').trim() === customerId;
    });

    cases = src.cases.filter(function(r) {
      return String(r['Customer ID'] || '').trim() === customerId;
    });

    const caseIds = cases.map(function(r) {
      return String(r['Case ID'] || '').trim();
    }).filter(Boolean);

    const customerScopedTasks = src.tasks.filter(function(r) {
      const type = String(r['نوع ارتباط'] || '').trim();
      const rel = String(r['شناسه مرتبط'] || '').trim();
      return (
        (type === 'مشتری' && rel === customerId) ||
        (type === 'پرونده' && caseIds.indexOf(rel) >= 0)
      );
    });

    if (role === 'مدیر مشتری') {
      tasks = customerScopedTasks;
      customerTasks = src.customerTasks.filter(function(r) {
        return String(r['مشتری ID'] || '').trim() === customerId;
      });
    } else {
      // Customer Employee gets company cases but only personally assigned tasks.
      tasks = customerScopedTasks.filter(function(r) {
        return textContainsAnyV412_(r['مسئول'], userTokens);
      });

      customerTasks = src.customerTasks.filter(function(r) {
        return String(r['مشتری ID'] || '').trim() === customerId &&
          textContainsAnyV412_(r['مسئول'], userTokens);
      });
    }

    leads = [];

    caseDocuments = src.caseDocuments.filter(function(r) {
      return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0;
    });
  }

  return {
    customers: customers,
    cases: cases,
    tasks: tasks,
    leads: leads,
    customerTasks: customerTasks,
    caseDocuments: caseDocuments
  };
}

function dashboardCandidateNamesV424_() {
  return [
    'داشبورد مدیریت',
    'داشبورد من',
    'داشبورد شرکت',
    'داشبورد',
    'داشبورد کارمند داخلی',
    'داشبورد مدیر مشتری',
    'داشبورد کارمند مشتری'
  ];
}

function getWorkspaceDashboardSheetV412_(ss) {
  const candidates = dashboardCandidateNamesV424_();
  for (let i = 0; i < candidates.length; i++) {
    const sh = ss.getSheetByName(candidates[i]);
    if (sh) return sh;
  }

  const technical = {};
  WORKSPACE_DATA_TABS_V412.forEach(function(x) { technical[x.name] = true; });
  technical[PERSONAL_DAILY_TAB_V420] = true;
  technical[DAILY_TASK_CATEGORY_HELPER_V421] = true;
  ROLE_VIEW_TITLES_V424.forEach(function(name) { technical[name] = true; });

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (!technical[sheets[i].getName()]) return sheets[i];
  }

  return sheets.length ? sheets[0] : null;
}

function ensureDashboardNameV424_(ss, role) {
  const cfg = roleConfigV424_(role);
  let dashboard = ss.getSheetByName(cfg.dashboard);

  if (!dashboard) {
    const candidates = dashboardCandidateNamesV424_();
    for (let i = 0; i < candidates.length; i++) {
      const sh = ss.getSheetByName(candidates[i]);
      if (!sh) continue;

      // Do not steal another role-view sheet.
      if (ROLE_VIEW_TITLES_V424.indexOf(sh.getName()) >= 0) continue;
      if (sh.getName() === PERSONAL_DAILY_TAB_V420) continue;

      dashboard = sh;
      break;
    }
  }

  if (dashboard && dashboard.getName() !== cfg.dashboard) {
    try { dashboard.setName(cfg.dashboard); } catch (_) {}
  }

  if (dashboard) {
    try { dashboard.showSheet(); } catch (_) {}
    try { dashboard.setTabColor(cfg.color); } catch (_) {}
  }

  return dashboard;
}

function roleViewSpecV424_(role, sheetName) {
  const cfg = roleConfigV424_(role);
  const views = cfg.views || [];

  for (let i = 0; i < views.length; i++) {
    if (views[i].title === String(sheetName || '')) return views[i];
  }

  return null;
}

function styleRoleViewV424_(sh, spec, role) {
  const cfg = roleConfigV424_(role);

  try { sh.setRightToLeft(true); } catch (_) {}
  try { sh.setFrozenRows(1); } catch (_) {}
  try { sh.setTabColor(cfg.color); } catch (_) {}

  const cols = spec.columns || [];
  if (cols.length) {
    try {
      sh.getRange(1, 1, 1, cols.length)
        .setFontWeight('bold')
        .setFontColor('#FFFFFF')
        .setBackground(cfg.color)
        .setHorizontalAlignment('center')
        .setWrap(true);
    } catch (_) {}
  }

  try {
    sh.getRange(1, 1).setNote(
      spec.editable
        ? 'این تب مخصوص نقش شماست. فقط فیلدهای مجاز قابل ویرایش‌اند و تغییرات در CRM اصلی ثبت می‌شوند.'
        : 'این تب فقط برای مشاهده است. اطلاعات از CRM اصلی همگام می‌شود.'
    );
  } catch (_) {}

  try {
    if (sh.getFilter()) sh.getFilter().remove();
    const lastRow = Math.max(2, sh.getLastRow());
    if (cols.length) sh.getRange(1, 1, lastRow, cols.length).createFilter();
  } catch (_) {}

  // Practical widths; do not auto-resize the whole sheet on every sync.
  try {
    for (let c = 1; c <= cols.length; c++) {
      const header = cols[c - 1];
      let width = 130;

      if (
        header === 'موضوع' ||
        header === 'یادداشت' ||
        header === 'آدرس' ||
        header === 'نتیجه' ||
        header === 'اقدام بعدی' ||
        header === 'دلیل رد/اصلاح'
      ) width = 220;
      else if (
        header === 'نام / عنوان مشتری' ||
        header === 'شرکت/پرونده' ||
        header === 'لینک فایل' ||
        header === '📁 پوشه اسناد' ||
        header === 'لینک وکالت‌نامه'
      ) width = 180;
      else if (
        header.indexOf('تاریخ') >= 0 ||
        header === 'آخرین فعالیت' ||
        header === 'آخرین بروزرسانی'
      ) width = 145;

      sh.setColumnWidth(c, width);
    }
  } catch (_) {}
}

function writeRoleViewV424_(ss, role, spec, rows) {
  let sh = ss.getSheetByName(spec.title);
  if (!sh) sh = ss.insertSheet(spec.title);

  const columns = spec.columns || [];
  ensureTargetSheetSizeV412_(
    sh,
    Math.max(50, (rows || []).length + 5),
    Math.max(1, columns.length)
  );

  // Only clear the role-view columns. This keeps the sheet compact.
  sh.clearContents();

  if (columns.length) {
    sh.getRange(1, 1, 1, columns.length).setValues([columns]);

    if (rows && rows.length) {
      const matrix = rows.map(function(r) {
        return columns.map(function(h) {
          return Object.prototype.hasOwnProperty.call(r, h) ? r[h] : '';
        });
      });

      sh.getRange(2, 1, matrix.length, columns.length).setValues(matrix);
    }
  }

  styleRoleViewV424_(sh, spec, role);

  try { sh.showSheet(); } catch (_) {}

  return sh;
}

function allTechnicalWorkspaceTabsV424_() {
  const names = WORKSPACE_DATA_TABS_V412.map(function(x){ return x.name; });
  names.push(DAILY_TASK_CATEGORY_HELPER_V421);
  return names;
}

function hideNonRoleTabsV424_(ss, role) {
  role = normalizeRole(role);
  const cfg = roleConfigV424_(role);
  const allowed = {};
  allowed[cfg.dashboard] = true;
  allowed[PERSONAL_DAILY_TAB_V420] = true;

  (cfg.views || []).forEach(function(v) {
    allowed[v.title] = true;
  });

  if (role === 'مدیر') {
    ['مشتریان','پرونده‌ها','تسک‌ها'].forEach(function(n) { allowed[n] = true; });
  }

  const sheets = ss.getSheets();

  sheets.forEach(function(sh) {
    const name = sh.getName();

    if (allowed[name]) {
      try { sh.showSheet(); } catch (_) {}
      return;
    }

    if (
      allTechnicalWorkspaceTabsV424_().indexOf(name) >= 0 ||
      ROLE_VIEW_TITLES_V424.indexOf(name) >= 0 ||
      dashboardCandidateNamesV424_().indexOf(name) >= 0
    ) {
      try { sh.hideSheet(); } catch (_) {}
    }
  });
}

function orderRoleTabsV424_(ss, role) {
  const cfg = roleConfigV424_(role);
  const order = [cfg.dashboard]
    .concat((cfg.views || []).map(function(v){ return v.title; }))
    .concat([PERSONAL_DAILY_TAB_V420]);

  order.forEach(function(name, idx) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;

    try {
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(idx + 1);
    } catch (_) {}
  });
}

function prepareRoleWorkspaceV424_(ss, user, scoped) {
  const role = normalizeRole(user['نقش']);
  const cfg = roleConfigV424_(role);

  ensureDashboardNameV424_(ss, role);

  // Personal daily is common but remains the user's own sheet.
  const daily = ensurePersonalDailySheetV420_(ss);
  try { daily.setTabColor(cfg.color); } catch (_) {}
  try { daily.showSheet(); } catch (_) {}

  (cfg.views || []).forEach(function(spec) {
    const rows = sourceRowsForRoleEntityV424_(scoped, spec.entity);
    writeRoleViewV424_(ss, role, spec, rows);
  });

  // Admin dashboard remains broad; other roles see only role-facing views.
  if (role === 'مدیر') {
    ['مشتریان','پرونده‌ها','تسک‌ها'].forEach(function(name) {
      const sh = ss.getSheetByName(name);
      if (sh) {
        try { sh.showSheet(); } catch (_) {}
      }
    });
  }

  hideNonRoleTabsV424_(ss, role);
  orderRoleTabsV424_(ss, role);

  return {
    dashboard: cfg.dashboard,
    visibleViews: (cfg.views || []).map(function(v){ return v.title; })
      .concat([PERSONAL_DAILY_TAB_V420])
  };
}

function roleEntityRowIdV424_(entity, row) {
  const cfg = sourceCfgForRoleEntityV424_(entity);
  if (!cfg) return '';
  return String(row[cfg.idHeader] || '').trim();
}

function workspaceRoleRowV424_(sh, rowNumber, spec) {
  const columns = spec.columns || [];
  const values = sh.getRange(rowNumber, 1, 1, columns.length).getValues()[0];
  const row = {};

  columns.forEach(function(h, i) {
    row[h] = values[i];
  });

  return row;
}

function entityRowBelongsToUserScopeV424_(entity, row, user) {
  const scoped = getScopedWorkspaceDataV412_(user);
  const id = roleEntityRowIdV424_(entity, row);
  if (!id) return false;

  const rows = sourceRowsForRoleEntityV424_(scoped, entity);
  const cfg = sourceCfgForRoleEntityV424_(entity);

  return rows.some(function(r) {
    return String(r[cfg.idHeader] || '').trim() === id;
  });
}

function roleCanEditFieldV424_(role, entity, field) {
  role = normalizeRole(role);
  field = String(field || '');

  if (role === 'کارمند مشتری') return false;
  if (entity === 'caseDocuments') return false;

  const commonSystem = [
    'Customer ID',
    'Sync Version',
    'Sync Source',
    'Sync Updated At',
    'ایجادکننده',
    'تاریخ ایجاد'
  ];

  if (commonSystem.indexOf(field) >= 0) return false;

  if (entity === 'customers') {
    if (role !== 'مدیر مشتری') return false;

    return [
      'مشتری ID',
      'روز مانده وکالت',
      '📁 پوشه اسناد',
      'آخرین یادآوری وکالت',
      'فعال؟',
      'مدیر اصلی',
      'موبایل مدیر',
      'Gmail مدیر',
      'Telegram ID مدیر',
      'User ID مدیر',
      'Workspace مدیر',
      'وضعیت دسترسی مدیر'
    ].indexOf(field) < 0;
  }

  if (entity === 'cases') {
    if (['کارمند داخلی','مدیر مشتری'].indexOf(role) < 0) return false;

    const denied = [
      'Case ID',
      'Customer ID',
      'مشتری',
      'مسئول داخلی اصلی',
      'همکاران داخلی',
      'مسئول مشتری'
    ];

    // Customer manager must not change internal operational assignment.
    if (role === 'مدیر مشتری') {
      denied.push('نیازمند توجه مدیر');
    }

    return denied.indexOf(field) < 0;
  }

  if (entity === 'tasks') {
    if (['کارمند داخلی','مدیر مشتری'].indexOf(role) < 0) return false;

    return [
      'Task ID',
      'نوع ارتباط',
      'شناسه مرتبط',
      'شرکت/پرونده',
      'ایجادکننده',
      'مسئول',
      'تعداد پیام',
      'تاریخ ایجاد'
    ].indexOf(field) < 0;
  }

  return false;
}

function refreshSingleRoleWorkspaceV424_(ctx) {
  const user =
    getRowById(SHEETS.usersRaw, ctx.userId) ||
    getRowById(SHEETS.users, ctx.userId);

  if (!user) throw new Error('کاربر Workspace پیدا نشد.');

  return syncWorkspaceDataV412_(
    {
      fileId: ctx.spreadsheetId,
      url: 'https://docs.google.com/spreadsheets/d/' + ctx.spreadsheetId + '/edit',
      type: ctx.role
    },
    user
  );
}

function handleRoleWorkspaceEditV424_(e) {
  try {
    if (!e || !e.source || !e.range) return;

    const ss = e.source;
    const ctx = getWorkspaceContextV414_(ss.getId());

    if (!ctx || ctx.main) return;

    const user =
      getRowById(SHEETS.usersRaw, ctx.userId) ||
      getRowById(SHEETS.users, ctx.userId);

    if (!user) return;

    const role = normalizeRole(user['نقش']);
    const sh = e.range.getSheet();
    const sheetName = sh.getName();

    // Personal daily has its own bidirectional 5-minute sync.
    if (sheetName === PERSONAL_DAILY_TAB_V420) return;

    const spec = roleViewSpecV424_(role, sheetName);
    if (!spec) return;

    // Read-only role view.
    if (!spec.editable) {
      refreshSingleRoleWorkspaceV424_(ctx);
      try {
        ss.toast(
          'این بخش فقط برای مشاهده است.',
          'دسترسی محدود',
          4
        );
      } catch (_) {}
      return;
    }

    // One-cell edits only; prevents unsafe mass overwrite.
    if (
      e.range.getNumRows() !== 1 ||
      e.range.getNumColumns() !== 1 ||
      e.range.getRow() <= 1
    ) {
      refreshSingleRoleWorkspaceV424_(ctx);
      try {
        ss.toast(
          'ویرایش گروهی پشتیبانی نمی‌شود؛ هر سلول را جداگانه تغییر دهید.',
          'کاراترخیص',
          5
        );
      } catch (_) {}
      return;
    }

    const col = e.range.getColumn();
    const columns = spec.columns || [];

    if (col < 1 || col > columns.length) return;

    const field = columns[col - 1];

    if (!roleCanEditFieldV424_(role, spec.entity, field)) {
      refreshSingleRoleWorkspaceV424_(ctx);
      try {
        ss.toast(
          'این فیلد برای نقش شما قابل ویرایش نیست.',
          'دسترسی محدود',
          5
        );
      } catch (_) {}
      return;
    }

    const localRow = workspaceRoleRowV424_(
      sh,
      e.range.getRow(),
      spec
    );

    if (!entityRowBelongsToUserScopeV424_(spec.entity, localRow, user)) {
      refreshSingleRoleWorkspaceV424_(ctx);
      try {
        ss.toast(
          'این رکورد خارج از محدوده دسترسی شماست.',
          'دسترسی محدود',
          5
        );
      } catch (_) {}
      return;
    }

    const sourceCfg = sourceCfgForRoleEntityV424_(spec.entity);
    const id = String(localRow[sourceCfg.idHeader] || '').trim();

    if (!id) {
      refreshSingleRoleWorkspaceV424_(ctx);
      return;
    }

    const value = e.range.getValue();
    const ok = updateEntityField(spec.entity, id, field, value);

    if (!ok) {
      throw new Error('رکورد اصلی برای بروزرسانی پیدا نشد: ' + id);
    }

    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    clearFastCachesV413_();

    try {
      logSystem(
        'role_workspace_edit',
        role + ' | ' + spec.entity + ' | ' + id + ' | ' + field + ' | user=' + ctx.userId
      );
    } catch (_) {}

    try {
      ss.toast(
        'تغییر در CRM اصلی ثبت شد.',
        'کاراترخیص',
        3
      );
    } catch (_) {}

  } catch (err) {
    try {
      logSystem(
        'role_workspace_edit_error',
        String(err && err.stack ? err.stack : err)
      );
    } catch (_) {}
  }
}

function addRoleWorkspaceMenuV424_(ctx) {
  const ui = SpreadsheetApp.getUi();
  const role = normalizeRole(ctx.role);

  ui.createMenu('🧭 میز کار')
    .addItem('🔄 تازه‌سازی میز کار', 'refreshCurrentRoleWorkspaceV424')
    .addItem('ℹ️ راهنمای این پنل', 'showCurrentRoleWorkspaceHelpV424')
    .addToUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast(
      'پنل نقش «' + role + '» فعال است.',
      'کاراترخیص',
      3
    );
  } catch (_) {}
}

function handleRoleAwareSheetOpenV424_(e) {
  try {
    const ss =
      e && e.source
        ? e.source
        : SpreadsheetApp.getActiveSpreadsheet();

    const ctx = getWorkspaceContextV414_(ss.getId());
    if (!ctx) return;

    if (ctx.main) {
      addAdminSheetMenuV414_();
      return;
    }

    const user =
      getRowById(SHEETS.usersRaw, ctx.userId) ||
      getRowById(SHEETS.users, ctx.userId);

    if (!user) return;

    const scoped = getScopedWorkspaceDataV412_(user);
    prepareRoleWorkspaceV424_(ss, user, scoped);
    addRoleWorkspaceMenuV424_(ctx);

  } catch (_) {}
}

function refreshCurrentRoleWorkspaceV424() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ctx = getWorkspaceContextV414_(ss.getId());

  if (!ctx || ctx.main) {
    SpreadsheetApp.getUi().alert('این گزینه مخصوص Workspace کاربر است.');
    return;
  }

  try {
    const result = refreshSingleRoleWorkspaceV424_(ctx);

    SpreadsheetApp.getUi().alert(
      'میز کار تازه‌سازی شد',
      'اطلاعات این Workspace با CRM اصلی همگام شد.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return result;
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      'خطا در تازه‌سازی',
      String(err && err.message ? err.message : err),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function showCurrentRoleWorkspaceHelpV424() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ctx = getWorkspaceContextV414_(ss.getId());

  if (!ctx || ctx.main) {
    SpreadsheetApp.getUi().alert('این راهنما مخصوص Workspace کاربر است.');
    return;
  }

  const user =
    getRowById(SHEETS.usersRaw, ctx.userId) ||
    getRowById(SHEETS.users, ctx.userId);

  const role = normalizeRole(user && user['نقش']);
  const cfg = roleConfigV424_(role);

  let text =
    'نقش: ' + role + '\n\n' +
    'تب‌های قابل مشاهده:\n' +
    '• ' + cfg.dashboard + '\n';

  (cfg.views || []).forEach(function(v) {
    text += '• ' + v.title + (v.editable ? ' — قابل ویرایش در فیلدهای مجاز' : ' — فقط مشاهده') + '\n';
  });

  text +=
    '• ' + PERSONAL_DAILY_TAB_V420 + ' — شخصی و قابل ویرایش\n\n' +
    'تب‌های فنی سیستم مخفی هستند و نباید به‌صورت دستی تغییر داده شوند.';

  SpreadsheetApp.getUi().alert(
    'راهنمای میز کار',
    text,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function installTriggersForRoleWorkspaceV424_(fileId) {
  fileId = String(fileId || '').trim();

  if (!fileId) {
    return { ok:false, reason:'missing_file_id' };
  }

  const handlerNames = [
    'handleRoleAwareSheetOpenV414',
    'handleCustomerManagerWorkspaceEditV414',
    'handleRoleAwareSheetOpenV424_',
    'handleRoleWorkspaceEditV424_'
  ];

  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlerNames.indexOf(t.getHandlerFunction()) < 0) return;

    try {
      if (
        t.getTriggerSourceId &&
        String(t.getTriggerSourceId() || '') === fileId
      ) {
        ScriptApp.deleteTrigger(t);
        removed++;
      }
    } catch (_) {}
  });

  const openTrigger = ScriptApp
    .newTrigger('handleRoleAwareSheetOpenV424_')
    .forSpreadsheet(fileId)
    .onOpen()
    .create();

  const editTrigger = ScriptApp
    .newTrigger('handleRoleWorkspaceEditV424_')
    .forSpreadsheet(fileId)
    .onEdit()
    .create();

  return {
    ok:true,
    fileId:fileId,
    openTrigger:openTrigger.getUniqueId(),
    editTrigger:editTrigger.getUniqueId(),
    removedDuplicates:removed
  };
}

function installRoleAwareSheetTriggersV414() {
  const handlerNames = [
    'handleRoleAwareSheetOpenV414',
    'handleCustomerManagerWorkspaceEditV414',
    'handleRoleAwareSheetOpenV424_',
    'handleRoleWorkspaceEditV424_'
  ];

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlerNames.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  const report = {
    main:null,
    workspaces:[],
    errors:[]
  };

  report.main = ScriptApp
    .newTrigger('handleRoleAwareSheetOpenV424_')
    .forSpreadsheet(SPREADSHEET_ID)
    .onOpen()
    .create()
    .getUniqueId();

  const seen = {};

  readRows(SHEETS.mapping).forEach(function(r) {
    const fid = String(
      r['Spreadsheet ID'] ||
      parseDriveFileId_(r['Workspace URL'] || '') ||
      ''
    ).trim();

    if (!fid || seen[fid]) return;
    seen[fid] = true;

    try {
      report.workspaces.push(
        installTriggersForRoleWorkspaceV424_(fid)
      );
    } catch (err) {
      report.errors.push({
        fileId:fid,
        error:String(err)
      });
    }
  });

  return report;
}

// Final mapping upsert: every role workspace gets role-aware triggers.
function upsertWorkspaceMappingForUser_(user, workspace) {
  const existingRow =
    findRowNumber(
      SHEETS.mapping,
      'User ID',
      user['User ID']
    );

  let mappingId = '';

  if (existingRow) {
    const sh = getSheet(SHEETS.mapping);
    const headers = getHeaders(SHEETS.mapping);
    const idx = headers.indexOf('Mapping ID');

    if (idx >= 0) {
      mappingId = String(
        sh.getRange(existingRow, idx + 1).getDisplayValue() || ''
      ).trim();
    }
  }

  if (!mappingId) {
    mappingId = 'MAP-' + user['User ID'];
  }

  const fileId =
    workspace.fileId ||
    parseDriveFileId_(workspace.url);

  upsertObject(
    SHEETS.mapping,
    'User ID',
    user['User ID'],
    {
      'Mapping ID':mappingId,
      'User ID':user['User ID'],
      'نام کاربر':user['نام کامل'],
      'نقش':user['نقش'],
      'Customer ID':user['Customer ID'] || '',
      'نوع Workspace':workspace.type || user['نقش'],
      'Spreadsheet ID':fileId,
      'Workspace URL':workspace.url,
      'Gmail مشترک‌شده':user['Gmail / Email'] || '',
      'وضعیت Provisioning':'انجام شد',
      'آخرین Sync':nowFa(),
      'یادداشت':'Role Workspace | ' + APP_VERSION
    }
  );

  if (fileId) {
    try {
      installTriggersForRoleWorkspaceV424_(fileId);
    } catch (err) {
      try {
        logSystem(
          'role_trigger_install_error',
          String(err)
        );
      } catch (_) {}
    }

    try {
      const ss = SpreadsheetApp.openById(fileId);
      const scoped = getScopedWorkspaceDataV412_(user);
      prepareRoleWorkspaceV424_(ss, user, scoped);
    } catch (err) {
      try {
        logSystem(
          'role_workspace_prepare_error',
          String(err)
        );
      } catch (_) {}
    }
  }
}

function syncWorkspaceDataV412_(workspace, user) {
  const fileId =
    workspace.fileId ||
    parseDriveFileId_(workspace.url);

  if (!fileId) {
    throw new Error('Workspace File ID نامعتبر است.');
  }

  const ss = ensureWorkspaceStructureV412_(fileId);

  // Pull personal edits first, then push canonical data.
  const personalDaily =
    syncPersonalDailyTasksV420_(ss, user);

  const scoped =
    getScopedWorkspaceDataV412_(user);

  // Canonical technical tabs: always kept for formulas/backend, hidden later.
  writeWorkspaceDataSheetV414_(
    ss,
    'مشتریان',
    SHEETS.customers,
    scoped.customers,
    user
  );

  writeWorkspaceDataSheetV414_(
    ss,
    'پرونده‌ها',
    SHEETS.cases,
    scoped.cases,
    user
  );

  writeWorkspaceDataSheetV414_(
    ss,
    'تسک‌ها',
    SHEETS.tasks,
    scoped.tasks,
    user
  );

  writeWorkspaceDataSheetV414_(
    ss,
    'سرنخ‌ها',
    SHEETS.leads,
    scoped.leads,
    user
  );

  writeWorkspaceDataSheetV414_(
    ss,
    'تسک‌های مشتریان',
    SHEETS.customerTasks,
    scoped.customerTasks,
    user
  );

  writeWorkspaceDataSheetV414_(
    ss,
    'اسناد پرونده',
    SHEETS.caseDocumentsV2,
    scoped.caseDocuments,
    user
  );

  repairWorkspaceDashboardFormulasV412_(ss);

  const roleUx =
    prepareRoleWorkspaceV424_(
      ss,
      user,
      scoped
    );

  SpreadsheetApp.flush();

  return {
    customers:scoped.customers.length,
    cases:scoped.cases.length,
    tasks:scoped.tasks.length,
    leads:scoped.leads.length,
    customerTasks:scoped.customerTasks.length,
    caseDocuments:scoped.caseDocuments.length,
    personalDailyTasks:personalDaily.count,
    personalDailyPulled:personalDaily.pulled.saved,
    roleWorkspace:roleUx
  };
}

function prepareRoleTemplatesV424_() {
  const result = [];
  const seen = {};

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    const fileId =
      String(DASHBOARD_TEMPLATES[role] || '').trim();

    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    try {
      const ss =
        SpreadsheetApp.openById(fileId);

      // Template-safe user context; no private data.
      const templateUser = {
        'User ID':'TEMPLATE-' + role,
        'نام کامل':'Template',
        'Telegram User ID':'',
        'نقش':normalizeRole(role),
        'Customer ID':'',
        'پروفایل دسترسی':defaultProfile(normalizeRole(role)),
        'وضعیت':'فعال'
      };

      const emptyScoped = {
        customers:[],
        cases:[],
        tasks:[],
        leads:[],
        customerTasks:[],
        caseDocuments:[]
      };

      ensureWorkspaceStructureV412_(fileId);
      ensurePersonalDailySheetV420_(ss);
      prepareRoleWorkspaceV424_(ss, templateUser, emptyScoped);

      result.push({
        ok:true,
        role:role,
        fileId:fileId
      });

    } catch (err) {
      result.push({
        ok:false,
        role:role,
        fileId:fileId,
        error:String(err)
      });
    }
  });

  return result;
}

function repairExistingRoleWorkspacesV424_() {
  const report = {
    ok:true,
    version:APP_VERSION,
    templates:[],
    workspaces:[],
    errors:[]
  };

  report.templates =
    prepareRoleTemplatesV424_();

  readRows(SHEETS.mapping).forEach(function(m) {
    const userId =
      String(m['User ID'] || '').trim();

    const fileId =
      String(
        m['Spreadsheet ID'] ||
        parseDriveFileId_(m['Workspace URL'] || '') ||
        ''
      ).trim();

    if (!userId || !fileId) return;

    const user =
      getRowById(SHEETS.usersRaw, userId) ||
      getRowById(SHEETS.users, userId);

    if (!user) {
      report.errors.push({
        userId:userId,
        fileId:fileId,
        error:'user_not_found'
      });
      report.ok = false;
      return;
    }

    try {
      const workspace = {
        fileId:fileId,
        url:
          String(m['Workspace URL'] || '') ||
          ('https://docs.google.com/spreadsheets/d/' + fileId + '/edit'),
        type:m['نوع Workspace'] || user['نقش']
      };

      const sync =
        syncWorkspaceDataV412_(
          workspace,
          user
        );

      report.workspaces.push({
        ok:true,
        userId:userId,
        role:user['نقش'],
        fileId:fileId,
        sync:sync
      });

    } catch (err) {
      report.errors.push({
        userId:userId,
        fileId:fileId,
        error:String(err)
      });
      report.ok = false;
    }
  });

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}

function testV424RoleWorkspaces() {
  const mappings =
    readRows(SHEETS.mapping);

  const report = {
    ok:true,
    version:APP_VERSION,
    roles:{},
    mappedUsers:[]
  };

  Object.keys(ROLE_WORKSPACE_CONFIG_V424).forEach(function(role) {
    const cfg = ROLE_WORKSPACE_CONFIG_V424[role];
    report.roles[role] = {
      dashboard:cfg.dashboard,
      views:(cfg.views || []).map(function(v) {
        return {
          title:v.title,
          entity:v.entity,
          editable:!!v.editable,
          columns:v.columns.length
        };
      }),
      personalDaily:PERSONAL_DAILY_TAB_V420
    };
  });

  mappings.forEach(function(m) {
    report.mappedUsers.push({
      userId:m['User ID'] || '',
      role:m['نقش'] || '',
      workspace:m['Workspace URL'] || ''
    });
  });

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}

// Final installer override for V4.24.
function repairBotInstallation() {
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties()
    .deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const expectedUrl = rememberCurrentWebAppUrl();
  const webhook = resetTelegramWebhook();
  const info = webhook.info;
  const actualUrl =
    info && info.ok && info.result
      ? String(info.result.url || '')
      : '';

  const webhookOk =
    !!(
      info &&
      info.ok &&
      actualUrl === expectedUrl
    );

  const sheetEditTrigger =
    installUserSheetEditTrigger();

  const queueTrigger =
    installProvisioningWorkerTriggerV412();

  const syncTrigger =
    installWorkspaceSyncTriggerV412();

  const roleAwareTriggers =
    installRoleAwareSheetTriggersV414();

  const telegramStatsTrigger =
    installTelegramStatsTriggerV422_();

  const userValidations =
    repairUserManagementValidationsV414_();

  const queueValidations =
    repairProvisioningQueueValidationsV415_();

  const rawUsersValidations =
    repairRawUsersValidationsV416_();

  const customerCompanyDropdown =
    repairCustomerCompanyDropdownV418_();

  let dailyRepair = null;
  try {
    dailyRepair =
      repairExistingWorkspaceDailyTabsV420_();
  } catch (err) {
    dailyRepair = {
      ok:false,
      error:String(err)
    };
  }

  let categoryRepair = null;
  try {
    categoryRepair =
      repairExistingWorkspaceCategoriesV421_();
  } catch (err) {
    categoryRepair = {
      ok:false,
      error:String(err)
    };
  }

  let roleRepair = null;
  try {
    roleRepair =
      repairExistingRoleWorkspacesV424_();
  } catch (err) {
    roleRepair = {
      ok:false,
      error:String(err)
    };
  }

  let stats = null;
  try {
    stats =
      refreshTelegramStatsV422();
  } catch (err) {
    stats = {
      error:String(err)
    };
  }

  const sweep =
    enqueueUsersMissingWorkspaceV412_();

  const report = {
    ok:
      webhookOk &&
      (!roleRepair || roleRepair.ok !== false),
    version:APP_VERSION,
    webhookUrl:actualUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    telegramStatsTrigger:telegramStatsTrigger,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    dailyRepair:dailyRepair,
    categoryRepair:categoryRepair,
    roleRepair:roleRepair,
    stats:stats,
    sweep:sweep,
    triggersBefore:beforeTriggers
  };

  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  try { warmMenuCache(); } catch (_) {}
  try { setTelegramCommandsV410_(); } catch (_) {}

  sendMessage(
    ADMIN_TELEGRAM_ID,
    (report.ok
      ? '✅ <b>V4.24 نصب شد</b>'
      : '⚠️ <b>V4.24 با هشدار نصب شد</b>') +
    '\n\n🧩 نسخه: <code>' + APP_VERSION + '</code>' +
    '\n🧭 Workspace نقش‌محور: <b>فعال</b>' +
    '\n👷 کارمند داخلی: <b>پنل اختصاصی</b>' +
    '\n🏢 مدیر مشتری: <b>پنل شرکت</b>' +
    '\n👤 کارمند مشتری: <b>پنل محدود</b>' +
    '\n📅 تسک روزانه شخصی: <b>فعال</b>' +
    '\n🔒 تب‌های فنی: <b>مخفی</b>'
  );

  return report;
}

function installTelegramBot() {
  return repairBotInstallation();
}


/************************************************************
 * V4.25 — TRUE ROLE-SPECIFIC DASHBOARD TEMPLATES
 * ----------------------------------------------------------
 * Each role now has a different landing dashboard in addition
 * to different visible tabs and scoped data.
 *
 * مدیر:
 *   Executive overview across the whole CRM.
 *
 * کارمند داخلی:
 *   Personal operational workload, assigned cases/tasks/docs.
 *
 * مدیر مشتری:
 *   Company-centric view for the manager of one Customer ID.
 *
 * کارمند مشتری:
 *   Limited personal view: company cases + own tasks.
 ************************************************************/

function dashboardThemeV425_(role) {
  role = normalizeRole(role);

  if (role === 'مدیر') {
    return {
      color:'#1F4E78',
      title:'👑 داشبورد مدیریت کاراترخیص',
      subtitle:'نمای کلان عملیات، مشتریان، پرونده‌ها و نقاط نیازمند تصمیم مدیریتی',
      access:'سطح دسترسی: کامل | داده‌ها: کل سازمان'
    };
  }

  if (role === 'کارمند داخلی') {
    return {
      color:'#176B57',
      title:'🧰 میز کار عملیاتی من',
      subtitle:'تمرکز روی پرونده‌ها، تسک‌ها و اسناد تخصیص‌یافته به شما',
      access:'سطح دسترسی: عملیاتی | فقط موارد تخصیص‌یافته به شما'
    };
  }

  if (role === 'مدیر مشتری') {
    return {
      color:'#7A4E14',
      title:'🏢 داشبورد مدیریت شرکت',
      subtitle:'وضعیت پرونده‌ها، تعهدات و اسناد شرکت شما در کاراترخیص',
      access:'سطح دسترسی: مدیریتی شرکت | فقط داده‌های Customer ID شما'
    };
  }

  return {
    color:'#5B4B8A',
    title:'👤 میز کار کارمند شرکت',
    subtitle:'مشاهده وضعیت پرونده‌های شرکت و تسک‌های شخصی تخصیص‌یافته به شما',
    access:'سطح دسترسی: محدود | مشاهده شرکت + تسک‌های شخصی'
  };
}

function dashboardDefinitionV425_(role) {
  role = normalizeRole(role);

  if (role === 'مدیر') {
    return {
      labels1:['👥 مشتریان فعال','📁 پرونده‌های فعال','✅ تسک‌های باز'],
      formulas1:[
        '=COUNTIF(\'مشتریان\'!T2:T,TRUE)',
        '=COUNTIFS(\'پرونده‌ها\'!A2:A,"<>",\'پرونده‌ها\'!G2:G,"<>تکمیل شده",\'پرونده‌ها\'!G2:G,"<>بسته شده",\'پرونده‌ها\'!G2:G,"<>بایگانی")',
        '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!J2:J,"<>انجام شد",\'تسک‌ها\'!J2:J,"<>انجام شده",\'تسک‌ها\'!J2:J,"<>بسته شد",\'تسک‌ها\'!J2:J,"<>بسته شده",\'تسک‌ها\'!J2:J,"<>لغو شده")'
      ],
      desc1:['کل مشتریان فعال CRM','پرونده‌های جاری سیستم','تعهدات اجرایی باز'],
      labels2:['🔥 سرنخ‌های داغ','🗂️ اسناد منتظر اقدام','🚨 پرونده نیازمند مدیر'],
      formulas2:[
        '=COUNTIF(\'سرنخ‌ها\'!J2:J,">=80")',
        '=COUNTIFS(\'اسناد پرونده\'!A2:A,"<>",\'اسناد پرونده\'!H2:H,"<>تأیید شده",\'اسناد پرونده\'!H2:H,"<>تایید شده")',
        '=COUNTIF(\'پرونده‌ها\'!Y2:Y,TRUE)'
      ],
      desc2:['امتیاز ۸۰ و بالاتر','اسناد هنوز نهایی نشده','پرونده‌های علامت‌گذاری‌شده'],
      summary:'="اکنون "&B6&" مشتری فعال، "&E6&" پرونده فعال و "&H6&" تسک باز دارید. "&IF(H11>0,"توجه: "&H11&" پرونده نیازمند تصمیم مدیر است.","مورد بحرانی مدیریتی ثبت نشده است.")',
      quick:['👥 مشتریان','📁 پرونده‌ها','✅ تسک‌ها']
    };
  }

  if (role === 'کارمند داخلی') {
    return {
      labels1:['📁 پرونده‌های من','✅ تسک‌های باز من','🗂️ اسناد پرونده‌های من'],
      formulas1:[
        '=COUNTIFS(\'پرونده‌ها\'!A2:A,"<>",\'پرونده‌ها\'!G2:G,"<>تکمیل شده",\'پرونده‌ها\'!G2:G,"<>بسته شده",\'پرونده‌ها\'!G2:G,"<>بایگانی")',
        '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!J2:J,"<>انجام شد",\'تسک‌ها\'!J2:J,"<>انجام شده",\'تسک‌ها\'!J2:J,"<>بسته شد",\'تسک‌ها\'!J2:J,"<>بسته شده",\'تسک‌ها\'!J2:J,"<>لغو شده")',
        '=COUNTA(\'اسناد پرونده\'!A2:A)'
      ],
      desc1:['فقط پرونده‌های تخصیص‌یافته','فقط کارهای مرتبط با شما','اسناد پرونده‌های تحت مسئولیت'],
      labels2:['🔥 تسک فوری/بالا','📅 کار روزانه باز','🚨 پرونده نیازمند توجه'],
      formulas2:[
        '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!I2:I,"فوری",\'تسک‌ها\'!J2:J,"<>انجام شد")+COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!I2:I,"بالا",\'تسک‌ها\'!J2:J,"<>انجام شد")',
        '=COUNTIFS(\'📅 تسک روزانه من\'!C2:C,"<>",\'📅 تسک روزانه من\'!G2:G,"<>انجام شد",\'📅 تسک روزانه من\'!G2:G,"<>لغو شده")',
        '=COUNTIF(\'پرونده‌ها\'!Y2:Y,TRUE)'
      ],
      desc2:['اولویت اجرای امروز','برنامه شخصی شما','نیازمند هماهنگی یا مدیر'],
      summary:'="تمرکز امروز: "&B11&" تسک با اولویت بالا/فوری، "&E11&" کار روزانه باز و "&H11&" پرونده نیازمند توجه."',
      quick:['📁 پرونده‌های من','✅ تسک‌های من','🗂️ اسناد پرونده‌های من']
    };
  }

  if (role === 'مدیر مشتری') {
    return {
      labels1:['📁 پرونده‌های فعال شرکت','✅ تسک‌های باز شرکت','🗂️ اسناد در جریان'],
      formulas1:[
        '=COUNTIFS(\'پرونده‌ها\'!A2:A,"<>",\'پرونده‌ها\'!G2:G,"<>تکمیل شده",\'پرونده‌ها\'!G2:G,"<>بسته شده",\'پرونده‌ها\'!G2:G,"<>بایگانی")',
        '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!J2:J,"<>انجام شد",\'تسک‌ها\'!J2:J,"<>انجام شده",\'تسک‌ها\'!J2:J,"<>بسته شد",\'تسک‌ها\'!J2:J,"<>بسته شده",\'تسک‌ها\'!J2:J,"<>لغو شده")',
        '=COUNTIFS(\'اسناد پرونده\'!A2:A,"<>",\'اسناد پرونده\'!H2:H,"<>تأیید شده",\'اسناد پرونده\'!H2:H,"<>تایید شده")'
      ],
      desc1:['فقط پرونده‌های همین شرکت','تعهدات باز شرکت','اسناد هنوز نهایی نشده'],
      labels2:['📊 میانگین پیشرفت ترخیص','📜 روز مانده وکالت','📅 کار روزانه من'],
      formulas2:[
        '=IFERROR(ROUND(AVERAGE(\'پرونده‌ها\'!U2:U),0),0)',
        '=IFERROR(INDEX(\'مشتریان\'!P2:P,1),"—")',
        '=COUNTIFS(\'📅 تسک روزانه من\'!C2:C,"<>",\'📅 تسک روزانه من\'!G2:G,"<>انجام شد",\'📅 تسک روزانه من\'!G2:G,"<>لغو شده")'
      ],
      desc2:['میانگین درصد ثبت‌شده','بر اساس اطلاعات وکالت','برنامه شخصی مدیر شرکت'],
      summary:'=IFERROR(INDEX(\'مشتریان\'!C2:C,1),"شرکت")&" | "&B6&" پرونده فعال، "&E6&" تسک باز و "&H6&" سند در جریان."',
      quick:['🏢 اطلاعات شرکت','📁 پرونده‌های شرکت','✅ تسک‌های شرکت']
    };
  }

  return {
    labels1:['📁 پرونده‌های قابل مشاهده','✅ تسک‌های من','📅 کار روزانه من'],
    formulas1:[
      '=COUNTIFS(\'پرونده‌ها\'!A2:A,"<>",\'پرونده‌ها\'!G2:G,"<>تکمیل شده",\'پرونده‌ها\'!G2:G,"<>بسته شده",\'پرونده‌ها\'!G2:G,"<>بایگانی")',
      '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!J2:J,"<>انجام شد",\'تسک‌ها\'!J2:J,"<>انجام شده",\'تسک‌ها\'!J2:J,"<>بسته شد",\'تسک‌ها\'!J2:J,"<>بسته شده",\'تسک‌ها\'!J2:J,"<>لغو شده")',
      '=COUNTIFS(\'📅 تسک روزانه من\'!C2:C,"<>",\'📅 تسک روزانه من\'!G2:G,"<>انجام شد",\'📅 تسک روزانه من\'!G2:G,"<>لغو شده")'
    ],
    desc1:['نمایش وضعیت پرونده‌های شرکت','فقط تسک‌های تخصیص‌یافته','برنامه شخصی شما'],
    labels2:['🔥 تسک فوری/بالا','✅ پرونده تکمیل‌شده','🔐 سطح دسترسی'],
    formulas2:[
      '=COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!I2:I,"فوری",\'تسک‌ها\'!J2:J,"<>انجام شد")+COUNTIFS(\'تسک‌ها\'!A2:A,"<>",\'تسک‌ها\'!I2:I,"بالا",\'تسک‌ها\'!J2:J,"<>انجام شد")',
      '=COUNTIF(\'پرونده‌ها\'!G2:G,"تکمیل شده")+COUNTIF(\'پرونده‌ها\'!G2:G,"بسته شده")',
      '="محدود / مشاهده"'
    ],
    desc2:['موارد مهم شخصی','پرونده‌های پایان‌یافته','بدون دسترسی مدیریتی'],
    summary:'="برای شما "&E6&" تسک باز و "&B11&" مورد فوری/با اولویت بالا ثبت شده است. اطلاعات پرونده‌ها فقط جهت مشاهده است."',
    quick:['📁 پرونده‌های قابل مشاهده','✅ تسک‌های من','📅 تسک روزانه من']
  };
}

function safeBreakApartV425_(range) {
  try { range.breakApart(); } catch (_) {}
}

function setMergedValueV425_(sh, a1, value) {
  const range = sh.getRange(a1);
  safeBreakApartV425_(range);
  range.merge();
  range.getCell(1, 1).setValue(value);
  return range;
}

function renderRoleDashboardV425_(ss, user) {
  const role = normalizeRole(user['نقش']);
  const theme = dashboardThemeV425_(role);
  const def = dashboardDefinitionV425_(role);
  const cfg = roleConfigV424_(role);

  const sh = ensureDashboardNameV424_(ss, role);
  if (!sh) throw new Error('Dashboard sheet not found.');

  if (sh.getMaxRows() < 30) sh.insertRowsAfter(sh.getMaxRows(), 30 - sh.getMaxRows());
  if (sh.getMaxColumns() < 10) sh.insertColumnsAfter(sh.getMaxColumns(), 10 - sh.getMaxColumns());

  const canvas = sh.getRange('A1:J30');
  safeBreakApartV425_(canvas);
  canvas.clearContent();
  canvas.clearFormat();

  try { sh.setHiddenGridlines(true); } catch (_) {}
  try { sh.setRightToLeft(true); } catch (_) {}
  try { sh.setFrozenRows(3); } catch (_) {}
  try { sh.setTabColor(theme.color); } catch (_) {}

  sh.setColumnWidth(1, 22);
  for (let c = 2; c <= 9; c++) sh.setColumnWidth(c, 118);
  sh.setColumnWidth(10, 22);

  sh.setRowHeight(1, 42);
  sh.setRowHeights(2, 2, 28);
  sh.setRowHeights(5, 3, 34);
  sh.setRowHeights(10, 3, 34);
  sh.setRowHeights(15, 2, 34);

  const name = String(user['نام کامل'] || '').trim() || role;
  const company = String(user['شرکت'] || '').trim();

  setMergedValueV425_(sh, 'B1:I1', theme.title);
  setMergedValueV425_(sh, 'B2:I2', theme.subtitle);
  setMergedValueV425_(
    sh,
    'B3:I3',
    '👤 ' + name +
      '   |   🔐 ' + role +
      (company ? '   |   🏢 ' + company : '') +
      '   |   🟢 همگام‌سازی فعال'
  );

  ['B5','E5','H5'].forEach(function(a1, i) {
    sh.getRange(a1).setValue(def.labels1[i]);
  });
  ['B6','E6','H6'].forEach(function(a1, i) {
    sh.getRange(a1).setFormula(def.formulas1[i]);
  });
  ['B7:D7','E7:G7','H7:J7'].forEach(function(a1, i) {
    setMergedValueV425_(sh, a1, def.desc1[i]);
  });

  setMergedValueV425_(sh, 'B9:I9', '🎯 شاخص‌های مخصوص این نقش');

  ['B10','E10','H10'].forEach(function(a1, i) {
    sh.getRange(a1).setValue(def.labels2[i]);
  });
  ['B11','E11','H11'].forEach(function(a1, i) {
    sh.getRange(a1).setFormula(def.formulas2[i]);
  });
  ['B12:D12','E12:G12','H12:J12'].forEach(function(a1, i) {
    setMergedValueV425_(sh, a1, def.desc2[i]);
  });

  setMergedValueV425_(sh, 'B14:I14', '⚡ تمرکز امروز');
  const summary = setMergedValueV425_(sh, 'B15:I16', '');
  summary.getCell(1, 1).setFormula(def.summary);

  setMergedValueV425_(sh, 'B18:I18', '🚀 دسترسی سریع');
  ['B19','E19','H19'].forEach(function(a1, i) {
    sh.getRange(a1).setValue(def.quick[i]);
  });
  setMergedValueV425_(
    sh,
    'B20:I20',
    'از تب مربوطه در پایین فایل استفاده کنید'
  );

  setMergedValueV425_(sh, 'B22:I22', '🛡 محدوده دسترسی');
  setMergedValueV425_(sh, 'B23:I24', theme.access);

  setMergedValueV425_(
    sh,
    'B26:I26',
    'کاراترخیص | ' + role + ' | Role Dashboard ' + APP_VERSION
  );

  // Base formatting
  canvas
    .setFontFamily(VAZIR_FONT_FAMILY_V427)
    .setFontSize(10)
    .setFontColor('#222222')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBackground('#FFFFFF');

  sh.getRange('B1:I1')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B2:I3')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  sh.getRange('B5:J7')
    .setBackground('#F5F7F8')
    .setHorizontalAlignment('center');

  sh.getRangeList(['B6','E6','H6'])
    .setFontSize(17)
    .setFontWeight('bold')
    .setFontColor(theme.color);

  sh.getRange('B9:I9')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  sh.getRange('B10:J12')
    .setBackground('#FBFBFC')
    .setHorizontalAlignment('center');

  sh.getRangeList(['B11','E11','H11'])
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor(theme.color);

  sh.getRange('B14:I14')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B15:I16')
    .setBackground('#F5F7F8')
    .setFontColor(theme.color)
    .setFontSize(12)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B18:I18')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B19:J20')
    .setBackground('#FBFBFC')
    .setFontColor(theme.color)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B22:I24')
    .setBackground('#F5F7F8')
    .setFontColor(theme.color)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('B26:I26')
    .setBackground(theme.color)
    .setFontColor('#FFFFFF')
    .setFontSize(9)
    .setHorizontalAlignment('center');

  try {
    sh.getRange('B5:J7').setBorder(true, true, true, true, false, false, '#D9E0E5', SpreadsheetApp.BorderStyle.SOLID);
    sh.getRange('B10:J12').setBorder(true, true, true, true, false, false, '#E2E6EA', SpreadsheetApp.BorderStyle.SOLID);
  } catch (_) {}

  return {
    ok:true,
    role:role,
    dashboard:cfg.dashboard,
    user:name,
    company:company,
    theme:theme.color
  };
}

// Override V4.24 template preparation so templates themselves
// permanently carry the correct role-specific dashboard.
function prepareRoleTemplatesV424_() {
  const result = [];
  const seen = {};

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    const fileId = String(DASHBOARD_TEMPLATES[role] || '').trim();
    if (!fileId || seen[fileId]) return;
    seen[fileId] = true;

    try {
      const normalizedRole = normalizeRole(role);
      const ss = SpreadsheetApp.openById(fileId);

      const templateUser = {
        'User ID':'TEMPLATE-' + normalizedRole,
        'نام کامل':normalizedRole,
        'Telegram User ID':'',
        'نقش':normalizedRole,
        'Customer ID':'',
        'شرکت':normalizedRole === 'مدیر مشتری' || normalizedRole === 'کارمند مشتری'
          ? 'شرکت شما'
          : '',
        'پروفایل دسترسی':defaultProfile(normalizedRole),
        'وضعیت':'فعال'
      };

      const emptyScoped = {
        customers:[],
        cases:[],
        tasks:[],
        leads:[],
        customerTasks:[],
        caseDocuments:[]
      };

      ensureWorkspaceStructureV412_(fileId);
      ensurePersonalDailySheetV420_(ss);
      prepareRoleWorkspaceV424_(ss, templateUser, emptyScoped);
      renderRoleDashboardV425_(ss, templateUser);

      result.push({
        ok:true,
        role:normalizedRole,
        fileId:fileId
      });

    } catch (err) {
      result.push({
        ok:false,
        role:role,
        fileId:fileId,
        error:String(err)
      });
    }
  });

  return result;
}

// Final workspace sync override: canonical hidden data + role views +
// role-specific landing dashboard.
function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');

  const ss = ensureWorkspaceStructureV412_(fileId);

  const personalDaily = syncPersonalDailyTasksV420_(ss, user);
  const scoped = getScopedWorkspaceDataV412_(user);

  writeWorkspaceDataSheetV414_(ss, 'مشتریان', SHEETS.customers, scoped.customers, user);
  writeWorkspaceDataSheetV414_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks, user);
  writeWorkspaceDataSheetV414_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks, user);
  writeWorkspaceDataSheetV414_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments, user);

  const roleUx = prepareRoleWorkspaceV424_(ss, user, scoped);
  const dashboard = renderRoleDashboardV425_(ss, user);

  SpreadsheetApp.flush();

  return {
    customers:scoped.customers.length,
    cases:scoped.cases.length,
    tasks:scoped.tasks.length,
    leads:scoped.leads.length,
    customerTasks:scoped.customerTasks.length,
    caseDocuments:scoped.caseDocuments.length,
    personalDailyTasks:personalDaily.count,
    personalDailyPulled:personalDaily.pulled.saved,
    roleWorkspace:roleUx,
    roleDashboard:dashboard
  };
}

function repairExistingRoleDashboardsV425_() {
  const report = {
    ok:true,
    version:APP_VERSION,
    templates:[],
    workspaces:[],
    errors:[]
  };

  report.templates = prepareRoleTemplatesV424_();

  readRows(SHEETS.mapping).forEach(function(m) {
    const userId = String(m['User ID'] || '').trim();
    const fileId = String(
      m['Spreadsheet ID'] ||
      parseDriveFileId_(m['Workspace URL'] || '') ||
      ''
    ).trim();

    if (!userId || !fileId) return;

    const user =
      getRowById(SHEETS.usersRaw, userId) ||
      getRowById(SHEETS.users, userId);

    if (!user) {
      report.ok = false;
      report.errors.push({
        userId:userId,
        fileId:fileId,
        error:'user_not_found'
      });
      return;
    }

    try {
      const ss = SpreadsheetApp.openById(fileId);
      const scoped = getScopedWorkspaceDataV412_(user);

      prepareRoleWorkspaceV424_(ss, user, scoped);
      const dash = renderRoleDashboardV425_(ss, user);

      report.workspaces.push({
        ok:true,
        userId:userId,
        role:user['نقش'],
        fileId:fileId,
        dashboard:dash
      });

    } catch (err) {
      report.ok = false;
      report.errors.push({
        userId:userId,
        fileId:fileId,
        error:String(err)
      });
    }
  });

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testV425DashboardTemplates() {
  const roles = ['مدیر','کارمند داخلی','مدیر مشتری','کارمند مشتری'];
  const report = {
    ok:true,
    version:APP_VERSION,
    dashboards:{}
  };

  roles.forEach(function(role) {
    const theme = dashboardThemeV425_(role);
    const def = dashboardDefinitionV425_(role);

    report.dashboards[role] = {
      title:theme.title,
      subtitle:theme.subtitle,
      access:theme.access,
      primaryMetrics:def.labels1,
      secondaryMetrics:def.labels2,
      quick:def.quick
    };
  });

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}


/************************************************************
 * V4.26 — DRIVE STRUCTURE + TEMPLATE SOURCE OF TRUTH
 * ----------------------------------------------------------
 * Drive architecture:
 * - 00-هسته CRM
 * - تمپلیت                ← canonical raw role templates
 * - داشبوردهای LIVE
 * - Workspace کاربران
 *      ├─ مدیر
 *      ├─ کارمند داخلی
 *      ├─ مدیر مشتری
 *      └─ کارمند مشتری
 * - اسناد CRM
 * - ورژن
 * - گزارش‌ها و خروجی‌ها
 * - بکاپ و آرشیو
 * - راهنما و مستندات
 *
 * IMPORTANT:
 * DASHBOARD_TEMPLATES now points ONLY to files inside folder "تمپلیت".
 * New workspaces are copied from those files and are stored in the
 * role-specific Workspace folder.
 ************************************************************/

const CRM_CORE_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_CORE_FOLDER_ID') || '';
const CRM_TEMPLATE_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_TEMPLATE_FOLDER_ID') || '';
const CRM_LIVE_DASHBOARDS_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_LIVE_DASHBOARDS_FOLDER_ID') || '';
const CRM_WORKSPACES_ROOT_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_WORKSPACES_ROOT_FOLDER_ID') || '';
const CRM_REPORTS_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_REPORTS_FOLDER_ID') || '';
const CRM_ARCHIVE_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_ARCHIVE_FOLDER_ID') || '';
const CRM_GUIDES_FOLDER_ID_V426 = PropertiesService.getScriptProperties().getProperty('CRM_GUIDES_FOLDER_ID') || '';

const ROLE_WORKSPACE_FOLDERS_V426 = {
  'مدیر': PropertiesService.getScriptProperties().getProperty('WORKSPACE_FOLDER_ADMIN_ID') || '',
  'کارمند داخلی': PropertiesService.getScriptProperties().getProperty('WORKSPACE_FOLDER_INTERNAL_ID') || '',
  'کارمند': PropertiesService.getScriptProperties().getProperty('WORKSPACE_FOLDER_INTERNAL_ID') || '',
  'مدیر مشتری': PropertiesService.getScriptProperties().getProperty('WORKSPACE_FOLDER_CUSTOMER_MANAGER_ID') || '',
  'کارمند مشتری': PropertiesService.getScriptProperties().getProperty('WORKSPACE_FOLDER_CUSTOMER_EMPLOYEE_ID') || ''
};

const RAW_TEMPLATE_NAMES_V426 = {
  'مدیر': 'RAW | تمپلیت مدیر | کاراترخیص',
  'کارمند داخلی': 'RAW | تمپلیت کارمند داخلی | کاراترخیص',
  'مدیر مشتری': 'RAW | تمپلیت مدیر مشتری | کاراترخیص',
  'کارمند مشتری': 'RAW | تمپلیت کارمند مشتری | کاراترخیص'
};

function workspaceFolderIdForRoleV426_(role) {
  role = normalizeRole(role);
  return ROLE_WORKSPACE_FOLDERS_V426[role] ||
    ROLE_WORKSPACE_FOLDERS_V426['کارمند داخلی'];
}

// Final provisioning override.
// Every new user workspace is copied from the canonical RAW template
// and saved in the corresponding role folder.
function provisionWorkspace(user) {
  const role = normalizeRole(user['نقش']);
  const templateId = DASHBOARD_TEMPLATES[role];
  if (!templateId) return null;

  const destinationFolderId = workspaceFolderIdForRoleV426_(role);
  const folder = DriveApp.getFolderById(destinationFolderId);
  const template = DriveApp.getFileById(templateId);

  const name =
    'Workspace | ' +
    role +
    ' | ' +
    user['نام کامل'] +
    ' | ' +
    user['User ID'];

  const copy = template.makeCopy(name, folder);

  let shared = false;
  const email = String(user['Gmail / Email'] || '').trim();

  if (email && email.indexOf('@') > 0) {
    try {
      copy.addEditor(email);
      shared = true;
    } catch (err) {
      try {
        logSystem(
          'workspace_share_error',
          user['User ID'] + ' | ' + String(err)
        );
      } catch (_) {}
    }
  }

  return {
    fileId: copy.getId(),
    url: copy.getUrl(),
    shared: shared,
    type: role,
    templateId: templateId,
    destinationFolderId: destinationFolderId
  };
}

// Protect both RAW source templates and LIVE dashboards from cascade-trash.
function protectedDriveIdsV413_() {
  const o = {};

  o[SPREADSHEET_ID] = true;
  o[CRM_FOLDER_ID] = true;
  o[CRM_DOCUMENTS_ROOT_FOLDER_ID] = true;

  [
    CRM_CORE_FOLDER_ID_V426,
    CRM_TEMPLATE_FOLDER_ID_V426,
    CRM_LIVE_DASHBOARDS_FOLDER_ID_V426,
    CRM_WORKSPACES_ROOT_FOLDER_ID_V426,
    CRM_REPORTS_FOLDER_ID_V426,
    CRM_ARCHIVE_FOLDER_ID_V426,
    CRM_GUIDES_FOLDER_ID_V426
  ].forEach(function(id) {
    if (id) o[String(id)] = true;
  });

  Object.keys(ROLE_WORKSPACE_FOLDERS_V426).forEach(function(k) {
    o[String(ROLE_WORKSPACE_FOLDERS_V426[k])] = true;
  });

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(k) {
    o[String(DASHBOARD_TEMPLATES[k])] = true;
  });

  [
    '1RADxHUGzEfwrW76qb10ip-YcG6mogSXjhRVOyRGeImE',
    '1WzMyJbjSuUlTwjM6VSqK63UdEUY9x_vSK3tQPRNCbng',
    '1I2VsxnAHUOYrQyLGBqNblLR3u_oPKeh7URou2ocUxTc',
    '17o0uZVC1__LRQZiGRvM-oVeFrm9fHxo3a8TUAZ4JFBM'
  ].forEach(function(id) {
    o[id] = true;
  });

  return o;
}

function auditDriveStructureV426_() {
  const report = {
    ok: true,
    version: APP_VERSION,
    rootFolderId: CRM_FOLDER_ID,
    folders: {
      core: CRM_CORE_FOLDER_ID_V426,
      templates: CRM_TEMPLATE_FOLDER_ID_V426,
      liveDashboards: CRM_LIVE_DASHBOARDS_FOLDER_ID_V426,
      workspaces: CRM_WORKSPACES_ROOT_FOLDER_ID_V426,
      documents: CRM_DOCUMENTS_ROOT_FOLDER_ID,
      reports: CRM_REPORTS_FOLDER_ID_V426,
      archive: CRM_ARCHIVE_FOLDER_ID_V426,
      guides: CRM_GUIDES_FOLDER_ID_V426
    },
    templates: [],
    roleFolders: ROLE_WORKSPACE_FOLDERS_V426
  };

  Object.keys(RAW_TEMPLATE_NAMES_V426).forEach(function(role) {
    const templateId = DASHBOARD_TEMPLATES[role];
    try {
      const f = DriveApp.getFileById(templateId);
      report.templates.push({
        role: role,
        ok: true,
        fileId: templateId,
        name: f.getName(),
        expectedName: RAW_TEMPLATE_NAMES_V426[role]
      });
    } catch (err) {
      report.ok = false;
      report.templates.push({
        role: role,
        ok: false,
        fileId: templateId,
        error: String(err)
      });
    }
  });

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testV426TemplateSource() {
  const result = auditDriveStructureV426_();
  result.provisioning = {
    source: 'DASHBOARD_TEMPLATES → folder تمپلیت',
    destination: 'ROLE_WORKSPACE_FOLDERS_V426 → Workspace کاربران/<role>'
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/************************************************************
 * V4.27 — SECURITY / DATA-INTEGRITY HARDENING
 * ----------------------------------------------------------
 * This is the final override layer for the audit-remediation branch.
 * It intentionally keeps historical functions for rollback/reference,
 * while the definitions below are the active runtime implementations.
 ************************************************************/

const UI_FONT_FAMILY_V427 = 'Vazirmatn';
const RELAY_MAX_AGE_MS_V427 = 5 * 60 * 1000;
const RELAY_FUTURE_SKEW_MS_V427 = 60 * 1000;
const PROVISIONING_STALE_MS_V427 = 15 * 60 * 1000;
const DAILY_SYNC_STATE_TAB_V427 = '__DailyTaskSyncState';

function scriptPropertyV427_(key) {
  return String(PropertiesService.getScriptProperties().getProperty(key) || '').trim();
}

function normalizeIdentityV427_(value) {
  return String(value == null ? '' : value)
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitAssignmentTokensV427_(value) {
  const raw = normalizeIdentityV427_(value);
  if (!raw) return [];
  return raw
    .split(/[,\u060C;\n\r|]+/)
    .map(normalizeIdentityV427_)
    .filter(Boolean);
}

function looksLikeStableUserIdV427_(token) {
  token = normalizeIdentityV427_(token);
  return /^(USR[-_][A-Z0-9_-]+|CRM_ADMIN)$/i.test(token);
}

function assignmentFieldMatchesUserV427_(value, user) {
  return fieldMatchesUserIdentityV427_(value, user);
}

function textContainsAnyV412_(value, needles) {
  const tokens = splitAssignmentTokensV427_(value);
  const exact = (needles || []).map(normalizeIdentityV427_).filter(Boolean);
  if (!tokens.length || !exact.length) return false;
  return tokens.some(function(token) {
    return exact.some(function(needle) { return token === needle; });
  });
}

// Final scoped-data implementation: exact assignment ownership only.
function getScopedWorkspaceDataV412_(user) {
  const src = getWorkspaceSourceSnapshotV412_();
  const role = normalizeRole(user['نقش']);
  if (role === 'مدیر') return src;

  let cases = [], customers = [], tasks = [], leads = [], customerTasks = [], caseDocuments = [];

  if (role === 'کارمند داخلی') {
    cases = src.cases.filter(function(r) {
      return assignmentFieldMatchesUserV427_(r['مسئول داخلی اصلی'], user) ||
        assignmentFieldMatchesUserV427_(r['همکاران داخلی'], user);
    });

    const caseIds = cases.map(function(r){ return String(r['Case ID'] || '').trim(); }).filter(Boolean);
    const customerIds = cases.map(function(r){ return String(r['Customer ID'] || '').trim(); }).filter(Boolean);

    customers = src.customers.filter(function(r) {
      return customerIds.indexOf(String(r['مشتری ID'] || '').trim()) >= 0;
    });

    tasks = src.tasks.filter(function(r) {
      return assignmentFieldMatchesUserV427_(r['مسئول'], user) ||
        (String(r['نوع ارتباط'] || '').trim() === 'پرونده' &&
          caseIds.indexOf(String(r['شناسه مرتبط'] || '').trim()) >= 0);
    });

    leads = src.leads.filter(function(r) {
      return assignmentFieldMatchesUserV427_(r['مسئول'], user);
    });

    customerTasks = src.customerTasks.filter(function(r) {
      return assignmentFieldMatchesUserV427_(r['مسئول'], user) ||
        caseIds.indexOf(String(r['شناسه پرونده'] || '').trim()) >= 0;
    });

    caseDocuments = src.caseDocuments.filter(function(r) {
      return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0;
    });

  } else if (role === 'مدیر مشتری' || role === 'کارمند مشتری') {
    const customerId = String(user['Customer ID'] || '').trim();
    if (!customerId) {
      return { customers:[], cases:[], tasks:[], leads:[], customerTasks:[], caseDocuments:[] };
    }

    customers = src.customers.filter(function(r) {
      return String(r['مشتری ID'] || '').trim() === customerId;
    });

    cases = src.cases.filter(function(r) {
      return String(r['Customer ID'] || '').trim() === customerId;
    });

    const caseIds = cases.map(function(r){ return String(r['Case ID'] || '').trim(); }).filter(Boolean);
    const customerScopedTasks = src.tasks.filter(function(r) {
      const type = String(r['نوع ارتباط'] || '').trim();
      const rel = String(r['شناسه مرتبط'] || '').trim();
      return (type === 'مشتری' && rel === customerId) ||
        (type === 'پرونده' && caseIds.indexOf(rel) >= 0);
    });

    if (role === 'مدیر مشتری') {
      tasks = customerScopedTasks;
      customerTasks = src.customerTasks.filter(function(r) {
        return String(r['مشتری ID'] || '').trim() === customerId;
      });
    } else {
      tasks = customerScopedTasks.filter(function(r) {
        return assignmentFieldMatchesUserV427_(r['مسئول'], user);
      });
      customerTasks = src.customerTasks.filter(function(r) {
        return String(r['مشتری ID'] || '').trim() === customerId &&
          assignmentFieldMatchesUserV427_(r['مسئول'], user);
      });
    }

    leads = [];
    caseDocuments = src.caseDocuments.filter(function(r) {
      return caseIds.indexOf(String(r['Case ID'] || '').trim()) >= 0;
    });
  }

  return {
    customers:customers, cases:cases, tasks:tasks, leads:leads,
    customerTasks:customerTasks, caseDocuments:caseDocuments
  };
}

function permissionForUserV427_(userId) {
  userId = normalizeIdentityV427_(userId);
  if (!userId) return null;
  try {
    return getRowById(SHEETS.permissions, 'PERM-' + userId);
  } catch (_) {
    return null;
  }
}

function telegramScopeCompleteV427_(user, role) {
  const userId = normalizeIdentityV427_(user && user['User ID']);
  if (!userId) return false;

  if (role === 'مدیر') return true;
  if (['کارمند داخلی','مدیر مشتری','کارمند مشتری'].indexOf(role) < 0) return false;

  if (
    (role === 'مدیر مشتری' || role === 'کارمند مشتری') &&
    !normalizeIdentityV427_(user['Customer ID'])
  ) return false;

  const permission = permissionForUserV427_(userId);
  if (!permission) return false;
  if (String(permission['وضعیت'] || '').trim() !== 'فعال') return false;
  if (normalizeRole(String(permission['Role'] || '').trim()) !== role) return false;

  if (role === 'مدیر مشتری' || role === 'کارمند مشتری') {
    const customerId = normalizeIdentityV427_(user['Customer ID']);
    return String(permission['Scope Type'] || '').trim() === 'CUSTOMER' &&
      normalizeIdentityV427_(permission['Scope ID']) === customerId;
  }

  return String(permission['Scope Type'] || '').trim() === 'ASSIGNED' &&
    normalizeIdentityV427_(permission['Scope ID']) === 'OWN_ASSIGNMENTS';
}

// Final Telegram authorization: fail closed unless status is exactly فعال.
function getTelegramUserContextV419_(telegramId) {
  telegramId = String(telegramId || '').trim();

  if (telegramId === String(ADMIN_TELEGRAM_ID)) {
    return {
      authorized:true,
      isAdmin:true,
      role:'مدیر',
      user:{
        'User ID':'USR-ADMIN-TELEGRAM',
        'نام کامل':'مدیر',
        'Telegram User ID':telegramId,
        'نقش':'مدیر',
        'وضعیت':'فعال',
        'پروفایل دسترسی':'پیشرفته'
      }
    };
  }

  const sources = [SHEETS.usersRaw, SHEETS.users];
  let found = null;
  let readableSourceCount = 0;
  for (let s = 0; s < sources.length && !found; s++) {
    let rows = null;
    try {
      rows = readRows(sources[s]);
      readableSourceCount++;
    } catch (_) {
      rows = null;
    }
    if (!rows) continue;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i]['Telegram User ID'] || '').trim() === telegramId) {
        found = rows[i];
        break;
      }
    }
  }

  if (!found) {
    return {
      authorized:false,
      isAdmin:false,
      reason:readableSourceCount ? 'telegram_id_not_found' : 'rbac_source_unavailable',
      telegramId:telegramId
    };
  }

  const status = String(found['وضعیت'] || '').trim();
  if (status !== 'فعال') {
    return { authorized:false, isAdmin:false, reason:'status_not_active', telegramId:telegramId, user:found };
  }

  const role = normalizeRole(String(found['نقش'] || '').trim());
  const allowedRoles = ['مدیر','کارمند داخلی','مدیر مشتری','کارمند مشتری'];
  if (allowedRoles.indexOf(role) < 0) {
    return { authorized:false, isAdmin:false, reason:'invalid_role', telegramId:telegramId, user:found };
  }

  const userId = String(found['User ID'] || '').trim();
  if (!userId) return { authorized:false, isAdmin:false, reason:'missing_user_id', telegramId:telegramId, user:found };

  let permission = null;
  try {
    permission =
      getRowById(SHEETS.permissions, 'PERM-' + userId) ||
      readRows(SHEETS.permissions).find(function(r) {
        return String(r['User ID'] || '').trim() === userId;
      }) ||
      null;
  } catch (_) {
    return {
      authorized:false,
      isAdmin:false,
      reason:'permission_source_unavailable',
      telegramId:telegramId,
      user:found
    };
  }

  if (!permission || String(permission['وضعیت'] || '').trim() !== 'فعال') {
    return { authorized:false, isAdmin:false, reason:'permission_inactive_or_missing', telegramId:telegramId, user:found };
  }

  const permissionRole = normalizeRole(String(permission['Role'] || '').trim());
  if (permissionRole && permissionRole !== role) {
    return { authorized:false, isAdmin:false, reason:'permission_role_mismatch', telegramId:telegramId, user:found };
  }

  const scopeType = String(permission['Scope Type'] || '').trim();
  const scopeId = String(permission['Scope ID'] || '').trim();

  if (role === 'مدیر') {
    if (scopeType !== 'ALL' || scopeId !== '*') {
      return { authorized:false, isAdmin:false, reason:'invalid_admin_scope', telegramId:telegramId, user:found };
    }
  } else if (role === 'کارمند داخلی') {
    if (scopeType !== 'ASSIGNED' || !scopeId) {
      return { authorized:false, isAdmin:false, reason:'invalid_internal_scope', telegramId:telegramId, user:found };
    }
  } else {
    const customerId = String(found['Customer ID'] || '').trim();
    if (!customerId || scopeType !== 'CUSTOMER' || scopeId !== customerId) {
      return { authorized:false, isAdmin:false, reason:'missing_customer_scope', telegramId:telegramId, user:found };
    }
  }

  return { authorized:true, isAdmin:role === 'مدیر', role:role, user:found, permission:permission };
}

function bytesToHexV427_(bytes) {
  return (bytes || []).map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEqualsV427_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function relaySignatureV427_(timestamp, nonce, payloadJson, secret) {
  const material =
    String(timestamp) + '\n' +
    String(nonce) + '\n' +
    String(payloadJson);

  const bytes = Utilities.computeHmacSha256Signature(
    material,
    secret,
    Utilities.Charset.UTF_8
  );
  return bytesToHexV427_(bytes);
}

function verifyRelayEnvelopeV427_(envelope, nowMs) {
  const secret = scriptPropertyV427_('RELAY_SHARED_SECRET');
  if (!secret) return { ok:false, reason:'relay_secret_missing' };

  if (!envelope || !envelope.relay || !envelope.update) {
    return { ok:false, reason:'invalid_relay_envelope' };
  }

  const relay = envelope.relay;
  const timestamp = Number(relay.timestamp || 0);
  const nonce = String(relay.nonce || '');
  const signature = String(relay.signature || '').toLowerCase();
  const update = envelope.update;
  const nowSeconds = Math.floor(Number(nowMs || Date.now()) / 1000);
  const maxAgeSeconds = Math.floor(RELAY_MAX_AGE_MS_V427 / 1000);
  const futureSkewSeconds = Math.floor(RELAY_FUTURE_SKEW_MS_V427 / 1000);

  if (!timestamp || !nonce || !signature) {
    return { ok:false, reason:'relay_fields_missing' };
  }

  if (!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) {
    return { ok:false, reason:'invalid_nonce' };
  }

  if (timestamp > nowSeconds + futureSkewSeconds) {
    return { ok:false, reason:'timestamp_in_future' };
  }

  if (nowSeconds - timestamp > maxAgeSeconds) {
    return { ok:false, reason:'expired_request' };
  }

  let payloadJson;
  try {
    payloadJson = JSON.stringify(update);
  } catch (_) {
    return { ok:false, reason:'payload_json_invalid' };
  }

  const expected = relaySignatureV427_(
    timestamp,
    nonce,
    payloadJson,
    secret
  );

  if (!constantTimeEqualsV427_(expected, signature)) {
    return { ok:false, reason:'bad_signature' };
  }

  const replayKey = 'RELAY_NONCE_V427_' + nonce;
  const cache = CacheService.getScriptCache();

  if (cache.get(replayKey)) {
    return { ok:false, reason:'replay' };
  }

  cache.put(replayKey, '1', maxAgeSeconds + futureSkewSeconds + 60);

  return {
    ok:true,
    payload:update,
    update:update,
    timestamp:timestamp,
    nonce:nonce
  };
}

function getTelegramWebhookTargetV427_() {
  return scriptPropertyV427_('TELEGRAM_RELAY_URL');
}

function resetTelegramWebhook() {
  const relayUrl = getTelegramWebhookTargetV427_();
  const telegramSecret = scriptPropertyV427_('TELEGRAM_WEBHOOK_SECRET');

  if (!relayUrl || !telegramSecret) {
    return {
      expectedUrl:relayUrl,
      deleted:null,
      installed:{ ok:false, description:'TELEGRAM_RELAY_URL / TELEGRAM_WEBHOOK_SECRET missing' },
      info:getTelegramWebhookInfo()
    };
  }

  const del = telegramApi('deleteWebhook', { drop_pending_updates:false });
  const set = telegramApi('setWebhook', {
    url:relayUrl,
    secret_token:telegramSecret,
    allowed_updates:['message','callback_query'],
    drop_pending_updates:false
  });
  const info = getTelegramWebhookInfo();

  return {
    expectedUrl:relayUrl,
    deleted:del,
    installed:set,
    info:info
  };
}

function setTelegramWebhook() {
  const relayUrl = getTelegramWebhookTargetV427_();
  const telegramSecret = scriptPropertyV427_('TELEGRAM_WEBHOOK_SECRET');

  if (!relayUrl || !telegramSecret) {
    return {
      ok:false,
      description:'TELEGRAM_RELAY_URL / TELEGRAM_WEBHOOK_SECRET missing'
    };
  }

  return telegramApi('setWebhook', {
    url:relayUrl,
    secret_token:telegramSecret,
    allowed_updates:['message','callback_query'],
    drop_pending_updates:false
  });
}

// Final webhook: Telegram updates are accepted only from the signed relay.
// Internal actions remain on their pre-existing, separately authenticated path.
function doPost(e) {
  let updateId = '';

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        ok:false,
        rejected:true,
        reason:'empty_request',
        version:APP_VERSION
      });
    }

    const raw = JSON.parse(e.postData.contents);

    if (raw && raw.internal_action) {
      return jsonResponse(handleInternalActionV414_(raw));
    }

    const verified = verifyRelayEnvelopeV427_(raw);
    if (!verified.ok) {
      try {
        logSystem(
          'telegram_webhook_rejected',
          String(verified.reason || 'relay_verification_failed')
        );
      } catch (_) {}

      return jsonResponse({
        ok:false,
        rejected:true,
        reason:verified.reason || 'relay_verification_failed',
        version:APP_VERSION
      });
    }

    const update = verified.payload || {};
    updateId = String(update.update_id || '');

    if (updateId && isDuplicateUpdate(updateId)) {
      return jsonResponse({
        ok:true,
        duplicate:true,
        version:APP_VERSION
      });
    }

    if (update.callback_query) {
      if (!handleEssentialCallbackV423_(update.callback_query)) {
        if (!handleFastNavigationV422_(update.callback_query)) {
          handleCallback(update.callback_query);
        }
      }
    } else if (update.message) {
      handleMessage(update.message);
    }

    return jsonResponse({ ok:true, version:APP_VERSION });

  } catch (err) {
    if (updateId) {
      try {
        CacheService.getScriptCache().remove('TG_UPDATE_' + updateId);
      } catch (_) {}
    }

    try {
      logSystem(
        'telegram_v427_error',
        String(err && err.stack ? err.stack : err)
      );
    } catch (_) {}

    return jsonResponse({
      ok:false,
      handled_error:true,
      version:APP_VERSION,
      error:String(err && err.message ? err.message : err)
    });
  }
}

function mappingForWorkspaceV427_(workspace, userId) {
  const fileId = String(
    (workspace && workspace.fileId) ||
    parseDriveFileId_(workspace && workspace.url) ||
    ''
  ).trim();

  const uid = String(userId || '').trim();
  const rows = readRows(SHEETS.mapping);

  for (let i = rows.length - 1; i >= 0; i--) {
    const rowUser = String(rows[i]['User ID'] || '').trim();
    const rowFile = String(
      rows[i]['Spreadsheet ID'] ||
      parseDriveFileId_(rows[i]['Workspace URL'] || '') ||
      ''
    ).trim();

    if ((uid && rowUser === uid) || (fileId && rowFile === fileId)) {
      return rows[i];
    }
  }
  return null;
}

function emailsToRevokeV427_(oldEmail, newEmail) {
  const oldMail = String(oldEmail || '').trim().toLowerCase();
  const newMail = String(newEmail || '').trim().toLowerCase();
  if (!oldMail || oldMail === newMail) return [];
  return [oldMail];
}

function removeWorkspacePrincipalV427_(file, email) {
  email = String(email || '').trim();
  if (!email || !file) return false;
  let touched = false;

  try {
    file.removeEditor(email);
    touched = true;
  } catch (_) {}

  try {
    file.removeViewer(email);
    touched = true;
  } catch (_) {}

  return touched;
}

// Final share implementation removes stale mapped email before granting the new one.
function shareWorkspaceToUser_(workspace, email, user) {
  const mail = String(email || '').trim();
  if (!workspace || !workspace.url || !mail || mail.indexOf('@') <= 0) return false;

  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) return false;

  const file = DriveApp.getFileById(fileId);
  const userId = String(user && user['User ID'] || '').trim();
  const mapping = mappingForWorkspaceV427_(workspace, userId);
  const oldEmail = mapping ? String(mapping['Gmail مشترک‌شده'] || '').trim() : '';

  emailsToRevokeV427_(oldEmail, mail).forEach(function(staleEmail) {
    removeWorkspacePrincipalV427_(file, staleEmail);
  });

  try {
    file.addEditor(mail);
    return true;
  } catch (err) {
    try { logSystem('workspace_share_error', String(err)); } catch (_) {}
    return false;
  }
}

function revokeWorkspaceAccessForUserV427_(userId, user) {
  const workspace = findExistingWorkspaceForUser_(userId, user);
  if (!workspace || !workspace.url) {
    return { ok:true, skipped:true, reason:'workspace_missing' };
  }

  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) return { ok:false, reason:'workspace_file_id_missing' };

  const file = DriveApp.getFileById(fileId);
  const mapping = mappingForWorkspaceV427_(workspace, userId);

  const emails = {};
  [
    mapping && mapping['Gmail مشترک‌شده'],
    user && user['Gmail / Email']
  ].forEach(function(v) {
    const mail = String(v || '').trim().toLowerCase();
    if (mail) emails[mail] = true;
  });

  Object.keys(emails).forEach(function(mail) {
    removeWorkspacePrincipalV427_(file, mail);
  });

  if (mapping) {
    upsertObject(
      SHEETS.mapping,
      'User ID',
      userId,
      Object.assign({}, mapping, {
        'Gmail مشترک‌شده':'',
        'وضعیت Provisioning':'غیرفعال',
        'آخرین Sync':nowFa()
      })
    );
  }

  updateRowById(SHEETS.usersRaw, userId, {
    'Google Access':'قطع شده',
    'آخرین بروزرسانی':nowFa()
  });

  updateRowById(SHEETS.users, userId, {
    'Google Access':'قطع شده',
    'Provisioning':'غیرفعال',
    'آخرین فعالیت':nowFa()
  });

  return { ok:true, fileId:fileId, revoked:Object.keys(emails) };
}

function preferredWorkspaceRefV427_(requestRow, existingWorkspace) {
  const requestFileId = String(requestRow && requestRow['Workspace File ID'] || '').trim();
  const requestUrl = String(requestRow && requestRow['Workspace URL'] || '').trim();

  if (requestFileId || requestUrl) {
    return {
      fileId:requestFileId || parseDriveFileId_(requestUrl),
      url:requestUrl || (
        requestFileId
          ? 'https://docs.google.com/spreadsheets/d/' + requestFileId + '/edit'
          : ''
      ),
      source:'request'
    };
  }

  if (existingWorkspace && existingWorkspace.url) {
    return {
      fileId:existingWorkspace.fileId || parseDriveFileId_(existingWorkspace.url),
      url:existingWorkspace.url,
      type:existingWorkspace.type,
      source:'mapping'
    };
  }

  return null;
}

function recoverWorkspaceForRequestV427_(requestRow, user) {
  const existing = findExistingWorkspaceForUser_(user['User ID'], user);
  const ref = preferredWorkspaceRefV427_(requestRow, existing);
  if (!ref || !ref.fileId) return null;

  try {
    DriveApp.getFileById(ref.fileId);
    ref.type = normalizeRole(
      ref.type ||
      requestRow['Role'] ||
      user['نقش']
    );
    return ref;
  } catch (_) {
    return null;
  }
}

// Final provisioning: create a private copy only.
// Sharing is deliberately delayed until sanitize + scoped sync succeed.
function provisionWorkspace(user) {
  const role = normalizeRole(user['نقش']);
  const templateId = DASHBOARD_TEMPLATES[role];
  if (!templateId) return null;

  const destinationFolderId = workspaceFolderIdForRoleV426_(role);
  const folder = DriveApp.getFolderById(destinationFolderId);
  const template = DriveApp.getFileById(templateId);
  const name = 'Workspace | ' + role + ' | ' + user['نام کامل'] + ' | ' + user['User ID'];
  const copy = template.makeCopy(name, folder);

  // SECURITY: never share before the first scoped sync succeeds.
  return {
    fileId:copy.getId(),
    url:copy.getUrl(),
    shared:false,
    type:role,
    templateId:templateId,
    destinationFolderId:destinationFolderId
  };
}

function sanitizeNewWorkspaceV427_(workspace) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');

  const ss = SpreadsheetApp.openById(fileId);
  const names = {};

  WORKSPACE_DATA_TABS_V412.forEach(function(x) {
    names[x.name] = true;
  });

  [
    PERSONAL_DAILY_TAB_V420,
    'پرونده‌های من',
    'تسک‌های من',
    'اسناد پرونده‌های من',
    'اطلاعات شرکت',
    'پرونده‌های شرکت',
    'تسک‌های شرکت',
    'پرونده‌های قابل مشاهده'
  ].forEach(function(name) {
    names[name] = true;
  });

  Object.keys(names).forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
  });

  SpreadsheetApp.flush();
  return true;
}

function provisioningHeartbeatKeyV427_(requestId) {
  return 'PROV_HEARTBEAT_V427_' + String(requestId || '');
}

function touchProvisioningHeartbeatV427_(requestId) {
  PropertiesService.getScriptProperties().setProperty(
    provisioningHeartbeatKeyV427_(requestId),
    String(Date.now())
  );
}

function clearProvisioningHeartbeatV427_(requestId) {
  PropertiesService.getScriptProperties().deleteProperty(
    provisioningHeartbeatKeyV427_(requestId)
  );
}

function isProvisioningStaleV427_(requestId, nowMs) {
  const raw = PropertiesService.getScriptProperties().getProperty(
    provisioningHeartbeatKeyV427_(requestId)
  );
  if (!raw) return true;
  return Number(nowMs || Date.now()) - Number(raw || 0) > PROVISIONING_STALE_MS_V427;
}

function provisioningQueueCandidatesV427_(limit) {
  const now = Date.now();

  return readRows(SHEETS.provisioningQueue)
    .filter(function(r) {
      const status = String(r['وضعیت'] || '').trim();

      if (status === 'در صف') return true;

      if (
        status === 'در حال پردازش' ||
        status === 'در حال ساخت' ||
        status === 'Workspace ساخته شد'
      ) {
        return isProvisioningStaleV427_(r['Request ID'], now);
      }

      return false;
    })
    .slice(0, limit);
}

function processProvisioningQueue(limit) {
  limit = Math.max(1, Math.min(Number(limit) || 3, 10));
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    return { ok:false, busy:true, version:APP_VERSION };
  }

  const report = {
    ok:true,
    version:APP_VERSION,
    processed:0,
    succeeded:0,
    failed:0,
    recovered:0,
    results:[]
  };

  try {
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    resetIdentityDirectoryV427_();

    const queue = provisioningQueueCandidatesV427_(limit);

    queue.forEach(function(req) {
      const requestId = String(req['Request ID'] || '').trim();
      const userId = String(req['User ID'] || '').trim();
      const requestType = String(req['نوع درخواست'] || '').trim();

      let user = null;
      let workspace = null;

      report.processed++;
      touchProvisioningHeartbeatV427_(requestId);

      try {
        patchProvisioningRequestV412_(requestId, {
          'وضعیت':'در حال پردازش',
          'خطا/یادداشت':'Worker ' + APP_VERSION
        });

        user = getRowById(SHEETS.usersRaw, userId);
        if (!user) throw new Error('User در Users پیدا نشد: ' + userId);

        appendProvisioningLogV412_(
          requestId,
          user,
          'PROCESS',
          String(req['وضعیت'] || ''),
          'در حال پردازش',
          null,
          'worker_start'
        );

        if (requestType === 'غیرفعال‌سازی دسترسی') {
          const revoked = revokeWorkspaceAccessForUserV427_(userId, user);

          patchProvisioningRequestV412_(requestId, {
            'وضعیت':'انجام شد',
            'خطا/یادداشت':'Access revoked'
          });

          appendProvisioningLogV412_(
            requestId,
            user,
            'ACCESS_REVOKE',
            'در حال پردازش',
            'انجام شد',
            null,
            JSON.stringify(revoked)
          );

          clearProvisioningHeartbeatV427_(requestId);
          report.succeeded++;
          report.results.push({
            requestId:requestId,
            userId:userId,
            ok:true,
            action:'access_revoked'
          });
          return;
        }

        if (String(user['وضعیت'] || '').trim() !== 'فعال') {
          throw new Error('User is not active: ' + userId);
        }

        workspace = recoverWorkspaceForRequestV427_(req, user);

        if (workspace) {
          report.recovered++;
        } else {
          workspace = provisionWorkspace(user);

          if (!workspace || !workspace.url) {
            throw new Error('ساخت Workspace ناموفق بود.');
          }

          workspace.fileId =
            workspace.fileId ||
            parseDriveFileId_(workspace.url);

          workspace.type = normalizeRole(user['نقش']);

          // Persist identity immediately. Any retry must reuse this file.
          patchProvisioningRequestV412_(requestId, {
            'وضعیت':'Workspace ساخته شد',
            'Workspace File ID':workspace.fileId,
            'Workspace URL':workspace.url,
            'خطا/یادداشت':'Workspace created privately; pending sanitize/sync'
          });

          appendProvisioningLogV412_(
            requestId,
            user,
            'WORKSPACE_CREATED',
            'در حال پردازش',
            'Workspace ساخته شد',
            workspace,
            'persisted_before_sync'
          );
        }

        workspace.fileId =
          workspace.fileId ||
          parseDriveFileId_(workspace.url);

        workspace.type = normalizeRole(user['نقش']);

        // A request-owned workspace may have failed immediately after copy.
        // Always sanitize it before scoped sync. Existing mapped workspaces
        // without a request-owned file ID are not destructively sanitized.
        const requestOwnsWorkspace =
          String(req['Workspace File ID'] || '').trim() ||
          String(req['Workspace URL'] || '').trim() ||
          !mappingForWorkspaceV427_(workspace, userId);

        if (requestOwnsWorkspace) {
          sanitizeNewWorkspaceV427_(workspace);
        }

        const syncCounts = syncWorkspaceDataV412_(workspace, user);

        // Share only after sanitize + scoped sync succeeded.
        const accessResult = reconcileWorkspaceAccessV427_(workspace, user);
        workspace.shared = !!accessResult.shared;

        const access = accessResult.shared ? 'فعال' : 'ایجاد شد';

        updateRowById(SHEETS.usersRaw, userId, {
          'Workspace URL':workspace.url,
          'Google Access':access,
          'Telegram Linked':'بله',
          'آخرین بروزرسانی':nowFa(),
          'آخرین فعالیت':nowFa()
        });

        updateRowById(SHEETS.users, userId, {
          'Workspace':workspace.url,
          'Google Access':access,
          'Telegram Linked':'بله',
          'Provisioning':'انجام شد',
          'آخرین فعالیت':nowFa()
        });

        upsertWorkspaceMappingForUser_(user, workspace);

        if (normalizeRole(user['نقش']) === 'مدیر مشتری') {
          linkCustomerManager(user, workspace);
        }

        patchProvisioningRequestV412_(requestId, {
          'وضعیت':'انجام شد',
          'Workspace File ID':workspace.fileId,
          'Workspace URL':workspace.url,
          'خطا/یادداشت':'Sync: ' + JSON.stringify(syncCounts)
        });

        appendProvisioningLogV412_(
          requestId,
          user,
          'DONE',
          'در حال پردازش',
          'انجام شد',
          workspace,
          JSON.stringify(syncCounts)
        );

        clearProvisioningHeartbeatV427_(requestId);
        report.succeeded++;

        report.results.push({
          requestId:requestId,
          userId:userId,
          ok:true,
          recovered:!!workspace.source,
          workspaceUrl:workspace.url,
          sync:syncCounts,
          access:accessResult
        });

      } catch (err) {
        report.failed++;
        report.ok = false;

        patchProvisioningRequestV412_(requestId, {
          'وضعیت':'خطا',
          'Workspace File ID':
            workspace
              ? (workspace.fileId || '')
              : String(req['Workspace File ID'] || ''),
          'Workspace URL':
            workspace
              ? (workspace.url || '')
              : String(req['Workspace URL'] || ''),
          'خطا/یادداشت':String(err && err.message ? err.message : err)
        });

        if (user) {
          updateRowById(SHEETS.users, userId, {
            'Provisioning':'خطا',
            'آخرین فعالیت':nowFa()
          });
        }

        appendProvisioningLogV412_(
          requestId,
          user || {'User ID':userId},
          'ERROR',
          'در حال پردازش',
          'خطا',
          workspace,
          String(err)
        );

        clearProvisioningHeartbeatV427_(requestId);

        try {
          logSystem(
            'provision_worker_error',
            requestId + ' | ' + String(err && err.stack ? err.stack : err)
          );
        } catch (_) {}

        report.results.push({
          requestId:requestId,
          userId:userId,
          ok:false,
          error:String(err)
        });
      }
    });

  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function dailyTaskVisibleRecordV427_(row) {
  return {
    id:normalizeTextV420_(row && row['شناسه کار']),
    date:String(row && row['تاریخ'] || ''),
    task:normalizeTextV420_(row && row['کار روزانه']),
    category:normalizeTextV420_(row && row['دسته‌بندی']),
    priority:normalizeTextV420_(row && row['اولویت']),
    due:String(row && (row['موعد'] || row['موعد دقیق']) || ''),
    status:normalizeTextV420_(row && row['وضعیت']),
    result:normalizeTextV420_(row && row['نتیجه']),
    tomorrow:normalizeTextV420_(row && row['کار فردا']),
    company:normalizeTextV420_(row && row['مرتبط با شرکت']),
    caseNo:normalizeTextV420_(row && row['شماره پرونده']),
    note:normalizeTextV420_(
      row && (
        Object.prototype.hasOwnProperty.call(row, 'یادداشت')
          ? row['یادداشت']
          : row['یادداشت مدیریتی']
      )
    )
  };
}

function stableJsonV427_(obj) {
  const keys = Object.keys(obj || {}).sort();
  const out = {};
  keys.forEach(function(k) { out[k] = obj[k]; });
  return JSON.stringify(out);
}

function sha256HexV427_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );
  return bytesToHexV427_(bytes);
}

function dailyTaskHashV427_(row) {
  return sha256HexV427_(
    stableJsonV427_(dailyTaskVisibleRecordV427_(row))
  );
}

function ensureDailyTaskSyncStateV427_(ss) {
  let sh = ss.getSheetByName(DAILY_SYNC_STATE_TAB_V427);
  if (!sh) sh = ss.insertSheet(DAILY_SYNC_STATE_TAB_V427);

  const headers = [
    'Task ID',
    'Local Hash',
    'Central Hash',
    'Last Sync At'
  ];

  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(
      sh.getMaxColumns(),
      headers.length - sh.getMaxColumns()
    );
  }

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  try { sh.hideSheet(); } catch (_) {}
  return sh;
}

function readDailyTaskSyncStateV427_(ss) {
  const sh = ensureDailyTaskSyncStateV427_(ss);
  const lastRow = sh.getLastRow();
  const out = {};

  if (lastRow <= 1) return out;

  const values = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  values.forEach(function(r) {
    const id = normalizeTextV420_(r[0]);
    if (!id) return;
    out[id] = {
      localHash:String(r[1] || ''),
      centralHash:String(r[2] || ''),
      lastSyncAt:String(r[3] || '')
    };
  });

  return out;
}

function writeDailyTaskSyncStateV427_(ss, states) {
  const sh = ensureDailyTaskSyncStateV427_(ss);
  const last = Math.max(1, sh.getMaxRows() - 1);
  sh.getRange(2, 1, last, 4).clearContent();

  const rows = Object.keys(states || {}).sort().map(function(id) {
    const s = states[id];
    return [
      id,
      s.localHash || '',
      s.centralHash || '',
      s.lastSyncAt || nowFa()
    ];
  });

  if (rows.length) {
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

function resolveDailyTaskConflictV427_(baseline, localHash, centralHash) {
  if (!baseline) {
    return localHash === centralHash ? 'in_sync' : 'baseline_missing';
  }

  const localChanged = localHash !== String(baseline.localHash || '');
  const centralChanged = centralHash !== String(baseline.centralHash || '');

  if (!localChanged && !centralChanged) return 'in_sync';
  if (!localChanged && centralChanged) return 'pull_central';
  if (localChanged && !centralChanged) return 'push_local';
  if (localHash === centralHash) return 'in_sync';

  return 'conflict';
}

// PERSONAL:<User ID> is authoritative. A mismatched source can never fall
// through to a fuzzy/legacy owner match.
function personalTaskBelongsToUserV420_(row, user) {
  const userId = normalizeTextV420_(user && user['User ID']);
  if (!userId) return false;

  const source = normalizeTextV420_(row && row['منبع']);
  if (source.indexOf('PERSONAL:') === 0) {
    return source === 'PERSONAL:' + userId;
  }

  const owner = normalizeTextV420_(row && row['مسئول']);
  if (!owner) return false;

  // Legacy fallback is exact equality only; substring ownership is forbidden.
  return assignmentFieldMatchesUserV427_(owner, user);
}

function localTaskRowsByIdV427_(sh) {
  const lastRow = Math.max(1, sh.getLastRow());
  const result = {
    rows:[],
    byId:{}
  };

  if (lastRow <= 1) return result;

  const headers = PERSONAL_DAILY_HEADERS_V420.slice();
  const values = sh.getRange(
    2,
    1,
    lastRow - 1,
    headers.length
  ).getValues();

  values.forEach(function(rowValues, idx) {
    const hasAny = rowValues.some(function(v) {
      return normalizeTextV420_(v) !== '';
    });
    if (!hasAny) return;

    const local = workspaceLocalTaskObjectV420_(
      headers,
      rowValues
    );

    const id = normalizeTextV420_(local['شناسه کار']);
    const entry = {
      sheetRow:idx + 2,
      values:rowValues,
      object:local,
      id:id
    };

    result.rows.push(entry);
    if (id) result.byId[id] = entry;
  });

  return result;
}

function buildCentralDailyTaskRowV427_(localRow, user, existing, taskId) {
  const userId = normalizeTextV420_(user['User ID']);
  const userName = normalizeTextV420_(user['نام کامل']) || userId;
  const status = normalizeTextV420_(localRow['وضعیت']) || 'باز';
  const oldStatus = existing ? normalizeTextV420_(existing['وضعیت']) : '';

  return Object.assign({}, existing || {}, {
    'شناسه کار':taskId,
    'تاریخ':localRow['تاریخ'] || (existing && existing['تاریخ']) || todayV420_(),
    'مسئول':userName,
    'دسته‌بندی':localRow['دسته‌بندی'] || '',
    'کار روزانه':localRow['کار روزانه'] || '',
    'مرتبط با شرکت':localRow['مرتبط با شرکت'] || user['شرکت'] || '',
    'اولویت':localRow['اولویت'] || 'متوسط',
    'موعد':localRow['موعد'] || '',
    'وضعیت':status,
    'نتیجه':localRow['نتیجه'] || '',
    'کار فردا':localRow['کار فردا'] || '',
    'یادداشت مدیریتی':localRow['یادداشت'] || '',
    'ایجاد شده در':(existing && existing['ایجاد شده در']) || nowFa(),
    'موعد دقیق':localRow['موعد'] || (existing && existing['موعد دقیق']) || '',
    'تعداد یادآوری':(existing && existing['تعداد یادآوری']) || 0,
    'آخرین تغییر وضعیت':
      oldStatus !== status
        ? nowFa()
        : ((existing && existing['آخرین تغییر وضعیت']) || nowFa()),
    'بسته شده در':
      status === 'انجام شد'
        ? ((existing && existing['بسته شده در']) || nowFa())
        : '',
    'منبع':(existing && existing['منبع']) || ('PERSONAL:' + userId),
    'شماره پرونده':localRow['شماره پرونده'] || ''
  });
}

function pullPersonalDailyTasksFromWorkspaceV420_(sh, user, ss) {
  const state = readDailyTaskSyncStateV427_(ss);
  const localRows = localTaskRowsByIdV427_(sh);

  const report = {
    processed:0,
    saved:0,
    skipped:0,
    conflicts:[],
    preserveLocalById:{},
    errors:[]
  };

  localRows.rows.forEach(function(entry) {
    report.processed++;

    try {
      const local = entry.object;
      let taskId = entry.id;

      if (!taskId) {
        if (!normalizeTextV420_(local['کار روزانه'])) {
          report.skipped++;
          return;
        }

        taskId = nextIdRaw(
          SHEETS.dailyTasks,
          'شناسه کار',
          'DAY-',
          5
        );

        const row = buildCentralDailyTaskRowV427_(
          local,
          user,
          null,
          taskId
        );

        appendObject(SHEETS.dailyTasks, row);
        report.saved++;
        return;
      }

      const existing = getRowById(SHEETS.dailyTasks, taskId);

      if (!existing) {
        // Never recreate an arbitrary existing-looking ID from a workspace.
        report.skipped++;
        report.preserveLocalById[taskId] = entry.values;
        report.errors.push('missing_central_task:' + taskId);
        return;
      }

      if (!personalTaskBelongsToUserV420_(existing, user)) {
        report.skipped++;
        report.preserveLocalById[taskId] = entry.values;
        report.errors.push('foreign_task_id:' + taskId);
        return;
      }

      const localHash = dailyTaskHashV427_(local);
      const centralHash = dailyTaskHashV427_(existing);
      const decision = resolveDailyTaskConflictV427_(
        state[taskId],
        localHash,
        centralHash
      );

      if (decision === 'push_local') {
        const row = buildCentralDailyTaskRowV427_(
          local,
          user,
          existing,
          taskId
        );
        updateRowById(SHEETS.dailyTasks, taskId, row);
        report.saved++;
        return;
      }

      if (decision === 'conflict' || decision === 'baseline_missing') {
        report.conflicts.push({
          taskId:taskId,
          reason:decision
        });
        report.preserveLocalById[taskId] = entry.values;
        return;
      }

      report.skipped++;

    } catch (err) {
      report.errors.push(
        String(err && err.message ? err.message : err)
      );
    }
  });

  return report;
}

function taskMatrixRowV427_(r) {
  return [
    r['شناسه کار'] || '',
    r['تاریخ'] || '',
    r['کار روزانه'] || '',
    r['دسته‌بندی'] || '',
    r['اولویت'] || 'متوسط',
    r['موعد'] || '',
    r['وضعیت'] || 'باز',
    r['نتیجه'] || '',
    r['کار فردا'] || '',
    r['مرتبط با شرکت'] || '',
    r['شماره پرونده'] || '',
    r['یادداشت مدیریتی'] || ''
  ];
}

function pushPersonalDailyTasksToWorkspaceV420_(sh, user, ss, preserveLocalById) {
  preserveLocalById = preserveLocalById || {};

  const oldState = readDailyTaskSyncStateV427_(ss);
  const tasks = getPersonalDailyTasksV420_(user);
  const clearRows = Math.max(1, sh.getMaxRows() - 1);

  sh.getRange(
    2,
    1,
    clearRows,
    PERSONAL_DAILY_HEADERS_V420.length
  ).clearContent();

  const matrix = [];
  const nextState = {};

  tasks.forEach(function(r) {
    const id = normalizeTextV420_(r['شناسه کار']);

    if (id && preserveLocalById[id]) {
      matrix.push(preserveLocalById[id]);
      if (oldState[id]) nextState[id] = oldState[id];
      return;
    }

    matrix.push(taskMatrixRowV427_(r));

    if (id) {
      const hash = dailyTaskHashV427_(r);
      nextState[id] = {
        localHash:hash,
        centralHash:hash,
        lastSyncAt:nowFa()
      };
    }
  });

  // Preserve local-only conflicting rows that are no longer returned by the
  // central query rather than silently deleting them.
  Object.keys(preserveLocalById).forEach(function(id) {
    const already = tasks.some(function(r) {
      return normalizeTextV420_(r['شناسه کار']) === id;
    });
    if (already) return;

    matrix.push(preserveLocalById[id]);
    if (oldState[id]) nextState[id] = oldState[id];
  });

  if (matrix.length) {
    sh.getRange(
      2,
      1,
      matrix.length,
      PERSONAL_DAILY_HEADERS_V420.length
    ).setValues(matrix);
  }

  writeDailyTaskSyncStateV427_(ss, nextState);

  return {
    count:tasks.length,
    preservedConflicts:Object.keys(preserveLocalById).length
  };
}

function syncPersonalDailyTasksV420_(ss, user) {
  const sh = ensurePersonalDailySheetV420_(ss);

  let harvested = { found:0, added:0 };
  try {
    harvested = harvestWorkspaceCategoriesV421_(sh, user);
  } catch (_) {}

  const pulled = pullPersonalDailyTasksFromWorkspaceV420_(sh, user, ss);

  try {
    const categories = collectDailyTaskCategoriesV421_();
    applyDailyTaskCategoryValidationV421_(ss, sh, categories);
  } catch (_) {}

  const pushed = pushPersonalDailyTasksToWorkspaceV420_(
    sh,
    user,
    ss,
    pulled.preserveLocalById
  );

  return {
    pulled:pulled,
    count:pushed.count,
    conflicts:pulled.conflicts.length,
    newCategories:harvested.added || 0
  };
}

function syncEpochV427_(value) {
  if (!value) return 0;
  const t = Date.parse(String(value).replace(' ', 'T'));
  return isNaN(t) ? 0 : t;
}

function selectMappingsForSyncV427_(mappings, limit) {
  return (mappings || [])
    .filter(function(r) {
      return String(r['Workspace URL'] || '').trim();
    })
    .slice()
    .sort(function(a, b) {
      return syncEpochV427_(a['آخرین Sync']) -
        syncEpochV427_(b['آخرین Sync']);
    })
    .slice(0, limit);
}


function selectMappingsRoundRobinV427_(mappings, limit, cursor) {
  const rows = (mappings || []).filter(function(r) {
    return String(r['Workspace URL'] || '').trim();
  });

  if (!rows.length) {
    return { selected:[], startCursor:0, nextCursor:0, total:0 };
  }

  limit = Math.max(1, Math.min(Number(limit) || 20, rows.length));
  cursor = Number(cursor || 0);
  if (!isFinite(cursor) || cursor < 0) cursor = 0;
  cursor = cursor % rows.length;

  const selected = [];
  for (let i = 0; i < Math.min(limit, rows.length); i++) {
    selected.push(rows[(cursor + i) % rows.length]);
  }

  return {
    selected:selected,
    startCursor:cursor,
    nextCursor:(cursor + selected.length) % rows.length,
    total:rows.length
  };
}

// Final fair workspace scheduler. No RAW template receives operational data.
function syncAllActiveWorkspacesV412(limit) {
  limit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(3000)) {
    return { ok:false, busy:true, version:APP_VERSION };
  }

  const report = {
    ok:true,
    version:APP_VERSION,
    processed:0,
    synced:0,
    failed:0,
    revoked:0,
    cursorStart:0,
    cursorNext:0,
    results:[]
  };

  try {
    __WORKSPACE_SOURCE_SNAPSHOT_V412 = null;
    resetIdentityDirectoryV427_();

    const props = PropertiesService.getScriptProperties();
    const page = selectMappingsRoundRobinV427_(
      readRows(SHEETS.mapping),
      limit,
      Number(props.getProperty(WORKSPACE_SYNC_CURSOR_KEY_V427) || 0)
    );

    if (!page.total) return report;

    report.cursorStart = page.startCursor;
    report.cursorNext = page.nextCursor;

    props.setProperty(
      WORKSPACE_SYNC_CURSOR_KEY_V427,
      String(page.nextCursor)
    );

    page.selected.forEach(function(m) {
      const userId = String(m['User ID'] || '').trim();
      const user = getRowById(SHEETS.usersRaw, userId);
      if (!user) return;

      const workspace = {
        fileId:
          String(m['Spreadsheet ID'] || '') ||
          parseDriveFileId_(m['Workspace URL']),
        url:String(m['Workspace URL'] || ''),
        type:m['نوع Workspace'] || user['نقش']
      };

      report.processed++;

      try {
        if (String(user['وضعیت'] || '').trim() !== 'فعال') {
          const access = reconcileWorkspaceAccessV427_(workspace, user);

          upsertObject(
            SHEETS.mapping,
            'User ID',
            userId,
            Object.assign({}, m, {
              'User ID':userId,
              'Gmail مشترک‌شده':'',
              'وضعیت Provisioning':'غیرفعال',
              'آخرین Sync':nowFa()
            })
          );

          report.revoked++;
          report.results.push({
            userId:userId,
            ok:true,
            revoked:true
        });
          return;
        }

        const counts = syncWorkspaceDataV412_(workspace, user);
        const access = reconcileWorkspaceAccessV427_(workspace, user);

        upsertObject(
          SHEETS.mapping,
          'User ID',
          userId,
          Object.assign({}, m, {
            'User ID':userId,
            'Gmail مشترک‌شده':String(user['Gmail / Email'] || '').trim(),
            'آخرین Sync':nowFa(),
            'وضعیت Provisioning':'انجام شد'
          })
        );

        report.synced++;
        report.results.push({
          userId:userId,
          ok:true,
          counts:counts,
          access:access
        });

      } catch (err) {
        report.failed++;
        report.ok = false;

        try {
          logSystem(
            'workspace_sync_error',
            userId + ' | ' + String(err)
          );
        } catch (_) {}

        report.results.push({
          userId:userId,
          ok:false,
          error:String(err)
        });
      }
    });

    // RAW templates are never operational data destinations.

  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function applyVazirmatnToSpreadsheetV427_(ss) {
  ss.getSheets().forEach(function(sh) {
    const lastRow = Math.max(1, sh.getLastRow());
    const lastCol = Math.max(1, sh.getLastColumn());
    sh.getRange(1, 1, lastRow, lastCol)
      .setFontFamily(VAZIR_FONT_FAMILY_V427);
  });
  return true;
}

// Final workspace sync: role-scoped data + conflict-safe daily tasks + Vazirmatn.
function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');

  const ss = ensureWorkspaceStructureV412_(fileId);
  const personalDaily = syncPersonalDailyTasksV420_(ss, user);
  const scoped = getScopedWorkspaceDataV412_(user);

  writeWorkspaceDataSheetV414_(ss, 'مشتریان', SHEETS.customers, scoped.customers, user);
  writeWorkspaceDataSheetV414_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks, user);
  writeWorkspaceDataSheetV414_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks, user);
  writeWorkspaceDataSheetV414_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments, user);

  const roleUx = prepareRoleWorkspaceV424_(ss, user, scoped);
  const dashboard = renderRoleDashboardV425_(ss, user);

  applyVazirmatnToSpreadsheetV427_(ss);
  SpreadsheetApp.flush();

  return {
    customers:scoped.customers.length,
    cases:scoped.cases.length,
    tasks:scoped.tasks.length,
    leads:scoped.leads.length,
    customerTasks:scoped.customerTasks.length,
    caseDocuments:scoped.caseDocuments.length,
    personalDailyTasks:personalDaily.count,
    personalDailyPulled:personalDaily.pulled.saved,
    personalDailyConflicts:personalDaily.conflicts || 0,
    roleWorkspace:roleUx,
    roleDashboard:dashboard
  };
}

function repairProvisioningSettingsV427_(dryRun) {
  dryRun = dryRun !== false;
  const ss = getCRMSpreadsheet();
  const sh = ss.getSheetByName('Provisioning Settings');

  if (!sh) {
    return { ok:false, reason:'sheet_missing', dryRun:dryRun };
  }

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { ok:true, dryRun:dryRun, changed:0, rows:[] };
  }

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(function(v) { return String(v || '').trim(); });
  const roleCol = headers.indexOf('Role');
  const templateCol = headers.indexOf('Template File ID');

  if (roleCol < 0 || templateCol < 0) {
    return {
      ok:false,
      reason:'required_columns_missing',
      dryRun:dryRun
    };
  }

  const changes = [];

  for (let i = 1; i < values.length; i++) {
    const role = normalizeRole(String(values[i][roleCol] || '').trim());
    const expected = String(DASHBOARD_TEMPLATES[role] || '').trim();
    const current = String(values[i][templateCol] || '').trim();

    if (!expected || expected === current) continue;

    changes.push({
      row:i + 1,
      role:role,
      oldTemplateFileId:current,
      newTemplateFileId:expected
    });

    if (!dryRun) {
      sh.getRange(i + 1, templateCol + 1).setValue(expected);
    }
  }

  return {
    ok:true,
    dryRun:dryRun,
    changed:changes.length,
    rows:changes
  };
}

function validateRuntimeConfigV427_() {
  const required = [
    'BOT_TOKEN',
    'ADMIN_TELEGRAM_ID',
    'WEB_APP_URL',
    'SPREADSHEET_ID',
    'CRM_FOLDER_ID',
    'CRM_DOCUMENTS_ROOT_FOLDER_ID',
    'TELEGRAM_RELAY_URL',
    'TELEGRAM_WEBHOOK_SECRET',
    'RELAY_SHARED_SECRET',
    'TEMPLATE_ADMIN_ID',
    'TEMPLATE_INTERNAL_EMPLOYEE_ID',
    'TEMPLATE_CUSTOMER_MANAGER_ID',
    'TEMPLATE_CUSTOMER_EMPLOYEE_ID',
    'WORKSPACE_FOLDER_ADMIN_ID',
    'WORKSPACE_FOLDER_INTERNAL_ID',
    'WORKSPACE_FOLDER_CUSTOMER_MANAGER_ID',
    'WORKSPACE_FOLDER_CUSTOMER_EMPLOYEE_ID'
  ];

  const missing = required.filter(function(key) {
    return !scriptPropertyV427_(key);
  });

  return {
    ok:missing.length === 0,
    version:APP_VERSION,
    missing:missing,
    relayConfigured:
      !!scriptPropertyV427_('TELEGRAM_RELAY_URL') &&
      !!scriptPropertyV427_('TELEGRAM_WEBHOOK_SECRET') &&
      !!scriptPropertyV427_('RELAY_SHARED_SECRET')
  };
}

function repairKnownFontsV427_(dryRun) {
  dryRun = dryRun !== false;

  const ids = {};
  ids[SPREADSHEET_ID] = 'CRM';

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    ids[String(DASHBOARD_TEMPLATES[role])] = 'Template:' + role;
  });

  Object.keys(LIVE_DASHBOARDS).forEach(function(key) {
    const id = parseDriveFileId_(LIVE_DASHBOARDS[key]);
    if (id) ids[id] = 'LIVE:' + key;
  });

  try {
    readRows(SHEETS.mapping).forEach(function(m) {
      const id = String(
        m['Spreadsheet ID'] ||
        parseDriveFileId_(m['Workspace URL'] || '') ||
        ''
      ).trim();
      if (id) ids[id] = 'Workspace:' + String(m['User ID'] || '');
    });
  } catch (_) {}

  const report = {
    ok:true,
    dryRun:dryRun,
    font:UI_FONT_FAMILY_V427,
    files:[]
  };

  Object.keys(ids).forEach(function(id) {
    if (dryRun) {
      report.files.push({ id:id, label:ids[id], wouldApply:true });
      return;
    }

    try {
      const ss = SpreadsheetApp.openById(id);
      applyVazirmatnToSpreadsheetV427_(ss);
      report.files.push({ id:id, label:ids[id], ok:true });
    } catch (err) {
      report.ok = false;
      report.files.push({
        id:id,
        label:ids[id],
        ok:false,
        error:String(err)
      });
    }
  });

  return report;
}

// Safer final installer for staging/explicit administrator execution.
function repairBotInstallation() {
  const config = validateRuntimeConfigV427_();
  const beforeTriggers = listProjectTriggers();
  const removedTriggers = removeAllProjectTriggers();

  clearState(ADMIN_TELEGRAM_ID);
  PropertiesService.getScriptProperties()
    .deleteProperty('TG_STATE_' + ADMIN_TELEGRAM_ID);
  clearPanelMessageId(ADMIN_TELEGRAM_ID);

  const webhook = config.relayConfigured
    ? resetTelegramWebhook()
    : {
        expectedUrl:'',
        installed:{ ok:false, description:'relay configuration incomplete' },
        info:getTelegramWebhookInfo()
      };

  const actualUrl =
    webhook.info && webhook.info.ok && webhook.info.result
      ? String(webhook.info.result.url || '')
      : '';

  const expectedUrl = getTelegramWebhookTargetV427_();
  const webhookOk =
    !!(
      expectedUrl &&
      webhook.info &&
      webhook.info.ok &&
      actualUrl === expectedUrl
    );

  const sheetEditTrigger = installUserSheetEditTrigger();
  const queueTrigger = installProvisioningWorkerTriggerV412();
  const syncTrigger = installWorkspaceSyncTriggerV412();
  const roleAwareTriggers = installRoleAwareSheetTriggersV414();
  const telegramStatsTrigger = installTelegramStatsTriggerV422_();

  const userValidations = repairUserManagementValidationsV414_();
  const queueValidations = repairProvisioningQueueValidationsV415_();
  const rawUsersValidations = repairRawUsersValidationsV416_();
  const customerCompanyDropdown = repairCustomerCompanyDropdownV418_();

  // Explicit installer execution is the migration point for canonical RAW IDs.
  const provisioningSettings = repairProvisioningSettingsV427_(false);

  const report = {
    ok:config.ok && webhookOk && provisioningSettings.ok,
    version:APP_VERSION,
    config:config,
    webhookUrl:actualUrl,
    expectedWebhookUrl:expectedUrl,
    removedTriggers:removedTriggers.length,
    sheetEditTrigger:sheetEditTrigger,
    queueTrigger:queueTrigger,
    syncTrigger:syncTrigger,
    roleAwareTriggers:roleAwareTriggers,
    telegramStatsTrigger:telegramStatsTrigger,
    userValidations:userValidations,
    queueValidations:queueValidations,
    rawUsersValidations:rawUsersValidations,
    customerCompanyDropdown:customerCompanyDropdown,
    provisioningSettings:provisioningSettings,
    triggersBefore:beforeTriggers
  };

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testV427SecurityAndSyncHelpers() {
  return {
    version:APP_VERSION,
    exactIdentity:{
      aliVsAlireza:
        assignmentFieldMatchesUserV427_(
          'Alireza',
          {'User ID':'USR-001','نام کامل':'Ali','Telegram User ID':'100'}
        ),
      exactAli:
        assignmentFieldMatchesUserV427_(
          'Ali',
          {'User ID':'USR-001','نام کامل':'Ali','Telegram User ID':'100'}
        )
    },
    taskOwnership:{
      mismatch:
        personalTaskBelongsToUserV420_(
          {'منبع':'PERSONAL:USR-002','مسئول':'Ali'},
          {'User ID':'USR-001','نام کامل':'Ali'}
        )
    },
    config:validateRuntimeConfigV427_(),
    provisioningSettingsDryRun:repairProvisioningSettingsV427_(true)
  };
}

/************************************************************
 * V4.28 — AUDIT CLOSURE HELPERS
 * ----------------------------------------------------------
 * Exact identity directory + Google access reconciliation.
 * No production-readiness claim; staging E2E remains mandatory.
 ************************************************************/
let __IDENTITY_DIRECTORY_V427 = null;

function resetIdentityDirectoryV427_() {
  __IDENTITY_DIRECTORY_V427 = null;
}

function identityDirectoryV427_() {
  if (__IDENTITY_DIRECTORY_V427) return __IDENTITY_DIRECTORY_V427;

  let rows = [];
  try { rows = readRows(SHEETS.usersRaw) || []; } catch (_) {}

  const byId = {};
  const byTelegram = {};
  const nameCounts = {};

  rows.forEach(function(r) {
    const id = normalizeIdentityV427_(r['User ID']);
    const name = normalizeIdentityV427_(r['نام کامل']);
    const tg = normalizeIdentityV427_(r['Telegram User ID']);

    if (id) byId[id] = (byId[id] || 0) + 1;
    if (tg) byTelegram[tg] = (byTelegram[tg] || 0) + 1;
    if (name) nameCounts[name] = (nameCounts[name] || 0) + 1;
  });

  __IDENTITY_DIRECTORY_V427 = {
    byId:byId,
    byTelegram:byTelegram,
    nameCounts:nameCounts
  };
  return __IDENTITY_DIRECTORY_V427;
}

function fieldMatchesUserIdentityV427_(value, user) {
  const tokens = splitAssignmentTokensV427_(value);
  if (!tokens.length || !user) return false;

  const userId = normalizeIdentityV427_(user['User ID']);
  const fullName = normalizeIdentityV427_(user['نام کامل']);
  const telegramId = normalizeIdentityV427_(user['Telegram User ID']);
  const dir = identityDirectoryV427_();

  return tokens.some(function(token) {
    // Stable IDs are authoritative and exact.
    if (looksLikeStableUserIdV427_(token)) {
      return !!userId && token === userId;
    }

    // Numeric Telegram identifiers are exact and must be unique when known.
    if (telegramId && token === telegramId) {
      return !dir.byTelegram[telegramId] || dir.byTelegram[telegramId] === 1;
    }

    // Legacy names are accepted only when exact AND unambiguous.
    if (fullName && token === fullName) {
      return !dir.nameCounts[fullName] || dir.nameCounts[fullName] === 1;
    }

    return false;
  });
}

function reconcileWorkspaceAccessV427_(workspace, user) {
  if (!workspace || !workspace.url || !user) {
    return { ok:false, shared:false, reason:'missing_workspace_or_user' };
  }

  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) {
    return { ok:false, shared:false, reason:'missing_file_id' };
  }

  const file = DriveApp.getFileById(fileId);
  const userId = String(user['User ID'] || '').trim();
  const desiredEmail = String(user['Gmail / Email'] || '').trim().toLowerCase();
  const active = String(user['وضعیت'] || '').trim() === 'فعال';
  const mapping = mappingForWorkspaceV427_(workspace, userId);
  const previousEmail = mapping
    ? String(mapping['Gmail مشترک‌شده'] || '').trim().toLowerCase()
    : '';

  const revoked = [];

  if (previousEmail && (!active || previousEmail !== desiredEmail)) {
    if (removeWorkspacePrincipalV427_(file, previousEmail)) revoked.push(previousEmail);
  }

  if (!active) {
    if (desiredEmail && desiredEmail !== previousEmail) {
      if (removeWorkspacePrincipalV427_(file, desiredEmail)) revoked.push(desiredEmail);
    }
    return {
      ok:true,
      shared:false,
      active:false,
      previousEmail:previousEmail,
      desiredEmail:desiredEmail,
      revoked:revoked
    };
  }

  if (!desiredEmail || desiredEmail.indexOf('@') <= 0) {
    return {
      ok:false,
      shared:false,
      active:true,
      reason:'invalid_email',
      previousEmail:previousEmail,
      desiredEmail:desiredEmail,
      revoked:revoked
    };
  }

  try {
    file.addEditor(desiredEmail);
  } catch (err) {
    return {
      ok:false,
      shared:false,
      active:true,
      reason:'share_failed',
      error:String(err && err.message ? err.message : err),
      previousEmail:previousEmail,
      desiredEmail:desiredEmail,
      revoked:revoked
    };
  }

  return {
    ok:true,
    shared:true,
    active:true,
    previousEmail:previousEmail,
    desiredEmail:desiredEmail,
    revoked:revoked
  };
}

function testV428AuditClosureHelpers() {
  return {
    version:APP_VERSION,
    font:UI_FONT_FAMILY_V427,
    productionReady:false,
    note:'Live staging E2E remains required before production approval.'
  };
}



/************************************************************
 * V4.28 — PROVISIONING CRASH-WINDOW IDEMPOTENCY
 * ----------------------------------------------------------
 * If Apps Script stops after Drive makeCopy() but before the
 * Queue row is patched, retry reuses the deterministic file name
 * instead of creating a second Workspace.
 ************************************************************/

function findWorkspaceCopyByDeterministicNameV428_(folder, name) {
  if (!folder || !name) return null;

  try {
    const files = folder.getFilesByName(name);
    if (files && files.hasNext()) {
      return files.next();
    }
  } catch (_) {}

  return null;
}

// Final provisioning override: private, deterministic and retry-safe.
function provisionWorkspace(user) {
  const role = normalizeRole(user['نقش']);
  const templateId = DASHBOARD_TEMPLATES[role];
  if (!templateId) return null;

  const destinationFolderId = workspaceFolderIdForRoleV426_(role);
  const folder = DriveApp.getFolderById(destinationFolderId);
  const template = DriveApp.getFileById(templateId);

  const name =
    'Workspace | ' +
    role +
    ' | ' +
    user['نام کامل'] +
    ' | ' +
    user['User ID'];

  let copy = findWorkspaceCopyByDeterministicNameV428_(folder, name);
  const reusedExistingCopy = !!copy;

  if (!copy) {
    copy = template.makeCopy(name, folder);
  }

  // Never share here. Sharing happens only after sanitize + scoped sync.
  return {
    fileId:copy.getId(),
    url:copy.getUrl(),
    shared:false,
    type:role,
    templateId:templateId,
    destinationFolderId:destinationFolderId,
    reusedExistingCopy:reusedExistingCopy
  };
}


/************************************************************
 * V4.29 — SEMANTIC SHEET STYLING
 * ----------------------------------------------------------
 * Preserves each sheet's existing tab color and derives a
 * coordinated palette from it. Applies Vazirmatn everywhere,
 * separates headers/column groups/row bands, and avoids
 * changing values, formulas, validations or protections.
 ************************************************************/

const SHEET_STYLE_DEFAULT_COLOR_V429 = '#1F4E78';
const SHEET_STYLE_GROUP_SIZE_V429 = 4;

function clampColorChannelV429_(n) {
  return Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
}

function normalizeHexColorV429_(hex, fallback) {
  const raw = String(hex || '').trim().replace('#', '');
  const fb = String(fallback || SHEET_STYLE_DEFAULT_COLOR_V429).trim().replace('#', '');
  const candidate = /^[0-9a-fA-F]{6}$/.test(raw) ? raw : fb;
  return '#' + candidate.toUpperCase();
}

function mixHexColorV429_(hex, targetHex, amount) {
  const a = normalizeHexColorV429_(hex, SHEET_STYLE_DEFAULT_COLOR_V429).slice(1);
  const b = normalizeHexColorV429_(targetHex, '#FFFFFF').slice(1);
  const t = Math.max(0, Math.min(1, Number(amount) || 0));
  const out = [];

  for (let i = 0; i < 3; i++) {
    const av = parseInt(a.slice(i * 2, i * 2 + 2), 16);
    const bv = parseInt(b.slice(i * 2, i * 2 + 2), 16);
    out.push(
      ('0' + clampColorChannelV429_(av + (bv - av) * t).toString(16)).slice(-2)
    );
  }

  return '#' + out.join('').toUpperCase();
}

function sheetBaseColorV429_(sh) {
  let tabColor = '';
  try { tabColor = sh.getTabColor(); } catch (_) {}

  if (tabColor) {
    return normalizeHexColorV429_(tabColor, SHEET_STYLE_DEFAULT_COLOR_V429);
  }

  const name = String(sh && sh.getName ? sh.getName() : '');
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }

  const palette = [
    '#1F4E78', '#176B57', '#7A4E14', '#5B4B8A',
    '#8B3A3A', '#2B6F8A', '#566B2F', '#7B5A3D'
  ];
  return palette[Math.abs(hash) % palette.length];
}

function sheetPaletteV429_(sh) {
  const base = sheetBaseColorV429_(sh);
  return {
    base:base,
    header:mixHexColorV429_(base, '#000000', 0.12),
    section:mixHexColorV429_(base, '#FFFFFF', 0.80),
    bandA:mixHexColorV429_(base, '#FFFFFF', 0.94),
    bandB:mixHexColorV429_(base, '#FFFFFF', 0.88),
    bandC:mixHexColorV429_(base, '#FFFFFF', 0.82),
    border:mixHexColorV429_(base, '#FFFFFF', 0.62),
    text:mixHexColorV429_(base, '#000000', 0.48)
  };
}

function styleUsedRangeV429_(sh) {
  if (!sh) return { ok:false, reason:'sheet_missing' };

  const lastRow = Math.max(1, sh.getLastRow());
  const lastCol = Math.max(1, sh.getLastColumn());
  const palette = sheetPaletteV429_(sh);
  const whole = sh.getRange(1, 1, lastRow, lastCol);
  const name = String(sh.getName() || '');

  whole
    .setFontFamily(VAZIR_FONT_FAMILY_V427)
    .setVerticalAlignment('middle')
    .setWrap(true);

  try { sh.setRightToLeft(true); } catch (_) {}
  try { if (!sh.getTabColor()) sh.setTabColor(palette.base); } catch (_) {}

  // Dashboard canvas owns its visual hierarchy. Only enforce the global font
  // so its deliberate card colors and merged regions are never overwritten.
  if (name.indexOf('داشبورد') >= 0 || name.indexOf('Dashboard') >= 0) {
    renderDashboardFontOnlyV429_(sh);
    return {
      ok:true,
      sheet:name,
      rows:lastRow,
      columns:lastCol,
      baseColor:palette.base,
      dashboard:true
    };
  }

  try { sh.setHiddenGridlines(true); } catch (_) {}

  const header = sh.getRange(1, 1, 1, lastCol);
  header
    .setBackground(palette.header)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  try { sh.setFrozenRows(Math.max(1, sh.getFrozenRows())); } catch (_) {}

  if (lastRow > 1) {
    const dataRows = lastRow - 1;
    const body = sh.getRange(2, 1, dataRows, lastCol);
    body.setFontColor('#222222');

    // Column groups: coordinated shades derived from the original sheet color.
    for (let startCol = 1, group = 0; startCol <= lastCol; startCol += SHEET_STYLE_GROUP_SIZE_V429, group++) {
      const width = Math.min(SHEET_STYLE_GROUP_SIZE_V429, lastCol - startCol + 1);
      const fill = [palette.bandA, palette.bandB, palette.bandC][group % 3];
      sh.getRange(2, startCol, dataRows, width).setBackground(fill);
    }

    // Horizontal level separation every 5 rows; this keeps dense CRM tables readable.
    for (let row = 2; row <= lastRow; row += 5) {
      const h = Math.min(5, lastRow - row + 1);
      const section = sh.getRange(row, 1, h, lastCol);
      try {
        section.setBorder(
          row === 2, true, true, true, false, false,
          palette.border,
          SpreadsheetApp.BorderStyle.SOLID
        );
      } catch (_) {}
    }
  }

  try {
    header.setBorder(
      true, true, true, true, false, false,
      palette.border,
      SpreadsheetApp.BorderStyle.SOLID_MEDIUM
    );
  } catch (_) {}

  return {
    ok:true,
    sheet:name,
    rows:lastRow,
    columns:lastCol,
    baseColor:palette.base
  };
}

function renderDashboardFontOnlyV429_(sh) {
  if (!sh) return false;
  const lastRow = Math.max(1, sh.getLastRow());
  const lastCol = Math.max(1, sh.getLastColumn());
  sh.getRange(1, 1, lastRow, lastCol).setFontFamily(VAZIR_FONT_FAMILY_V427);
  return true;
}

function styleSpreadsheetSemanticallyV429_(ss) {
  const report = {
    ok:true,
    font:VAZIR_FONT_FAMILY_V427,
    sheets:[]
  };

  ss.getSheets().forEach(function(sh) {
    try {
      report.sheets.push(styleUsedRangeV429_(sh));
    } catch (err) {
      report.ok = false;
      report.sheets.push({
        ok:false,
        sheet:String(sh.getName() || ''),
        error:String(err && err.message ? err.message : err)
      });
    }
  });

  return report;
}

function repairKnownSheetStylesV429_(dryRun) {
  dryRun = dryRun !== false;

  const ids = {};
  ids[SPREADSHEET_ID] = 'CRM';

  Object.keys(DASHBOARD_TEMPLATES).forEach(function(role) {
    const id = String(DASHBOARD_TEMPLATES[role] || '').trim();
    if (id) ids[id] = 'Template:' + role;
  });

  Object.keys(LIVE_DASHBOARDS).forEach(function(key) {
    const id = parseDriveFileId_(LIVE_DASHBOARDS[key]);
    if (id) ids[id] = 'LIVE:' + key;
  });

  try {
    readRows(SHEETS.mapping).forEach(function(m) {
      const id = String(
        m['Spreadsheet ID'] ||
        parseDriveFileId_(m['Workspace URL'] || '') ||
        ''
      ).trim();
      if (id) ids[id] = 'Workspace:' + String(m['User ID'] || '');
    });
  } catch (_) {}

  const report = {
    ok:true,
    dryRun:dryRun,
    font:VAZIR_FONT_FAMILY_V427,
    files:[]
  };

  Object.keys(ids).forEach(function(id) {
    if (dryRun) {
      report.files.push({ id:id, label:ids[id], wouldApply:true });
      return;
    }

    try {
      const ss = SpreadsheetApp.openById(id);
      const styled = styleSpreadsheetSemanticallyV429_(ss);
      report.files.push({
        id:id,
        label:ids[id],
        ok:styled.ok,
        sheetCount:styled.sheets.length,
        sheets:styled.sheets
      });
      if (!styled.ok) report.ok = false;
    } catch (err) {
      report.ok = false;
      report.files.push({
        id:id,
        label:ids[id],
        ok:false,
        error:String(err && err.message ? err.message : err)
      });
    }
  });

  return report;
}

// Final workspace sync override: keep functional sync logic from V4.28 and
// apply semantic styling after all writers/renderers have finished.
function syncWorkspaceDataV412_(workspace, user) {
  const fileId = workspace.fileId || parseDriveFileId_(workspace.url);
  if (!fileId) throw new Error('Workspace File ID نامعتبر است.');

  const ss = ensureWorkspaceStructureV412_(fileId);
  const personalDaily = syncPersonalDailyTasksV420_(ss, user);
  const scoped = getScopedWorkspaceDataV412_(user);

  writeWorkspaceDataSheetV414_(ss, 'مشتریان', SHEETS.customers, scoped.customers, user);
  writeWorkspaceDataSheetV414_(ss, 'پرونده‌ها', SHEETS.cases, scoped.cases, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌ها', SHEETS.tasks, scoped.tasks, user);
  writeWorkspaceDataSheetV414_(ss, 'سرنخ‌ها', SHEETS.leads, scoped.leads, user);
  writeWorkspaceDataSheetV414_(ss, 'تسک‌های مشتریان', SHEETS.customerTasks, scoped.customerTasks, user);
  writeWorkspaceDataSheetV414_(ss, 'اسناد پرونده', SHEETS.caseDocumentsV2, scoped.caseDocuments, user);

  const roleUx = prepareRoleWorkspaceV424_(ss, user, scoped);
  const dashboard = renderRoleDashboardV425_(ss, user);

  const styling = styleSpreadsheetSemanticallyV429_(ss);
  SpreadsheetApp.flush();

  return {
    customers:scoped.customers.length,
    cases:scoped.cases.length,
    tasks:scoped.tasks.length,
    leads:scoped.leads.length,
    customerTasks:scoped.customerTasks.length,
    caseDocuments:scoped.caseDocuments.length,
    personalDailyTasks:personalDaily.count,
    personalDailyPulled:personalDaily.pulled.saved,
    personalDailyConflicts:personalDaily.conflicts || 0,
    roleWorkspace:roleUx,
    roleDashboard:dashboard,
    styling:styling
  };
}
