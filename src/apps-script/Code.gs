/************************************************************
 * PUBLIC REPOSITORY MIRROR: secrets are loaded from Apps Script Script Properties.
 * KARATARHIS / TEJARATYAAR CRM — V4.7 STABLE CALLBACK + SHEET SYNC
 * Telegram Bot + Google Sheets + Drive Provisioning
 * Source of truth: CRM | ترخیص یزد | V1.5
 ************************************************************/

const BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN') || '';
const ADMIN_TELEGRAM_ID = PropertiesService.getScriptProperties().getProperty('ADMIN_TELEGRAM_ID') || '';
const WEB_APP_URL = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') || '';
const SPREADSHEET_ID = '1hpDV0ikEldIqnnICnfzULhmxABHxQLS9A3gXG9loeUM';
const CRM_FOLDER_ID = '17LGzt2z04D9KhlXrW1YJc_AmEtA1g-ZM';
const CRM_DOCUMENTS_ROOT_FOLDER_ID = '13h-NyW6CQgJAAB3EtBGjowNypHLZn2-s';
const APP_VERSION = 'V4.26-2026-09-19';

const DASHBOARD_TEMPLATES = {
  'مدیر': '1Zt890HbsaHUS20ldmzWSrH0rRIEAuDgpavr8dqxxHBw',
  'کارمند داخلی': '1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0',
  'کارمند': '1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0',
  'مدیر مشتری': '1m_Ao7XQMVlhhsMx4AR82b60GCK0XHKXhTW_S5BxKIAI',
  'کارمند مشتری': '1eesSiyEhUr4qJkp4rK3qtRnt3w3X0yXH08dfZ08cXiE'
};

const LIVE_DASHBOARDS = {
  admin: 'https://docs.google.com/spreadsheets/d/1RADxHUGzEfwrW76qb10ip-YcG6mogSXjhRVOyRGeImE/edit',
  employee: 'https://docs.google.com/spreadsheets/d/1WzMyJbjSuUlTwjM6VSqK63UdEUY9x_vSK3tQPRNCbng/edit',
  customerManager: 'https://docs.google.com/spreadsheets/d/1I2VsxnAHUOYrQyLGBqNblLR3u_oPKeh7URou2ocUxTc/edit',
  customerEmployee: 'https://docs.google.com/spreadsheets/d/17o0uZVC1__LRQZiGRvM-oVeFrm9fHxo3a8TUAZ4JFBM/edit'
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