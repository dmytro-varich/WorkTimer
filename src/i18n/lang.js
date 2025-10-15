/**
 * Internationalization (i18n) Module
 * 
 * Lightweight i18n system with localStorage persistence and live updates.
 * Supports translation functions, language switching, and DOM text stamping.
 */

// =============================================================================
// Configuration
// =============================================================================

const LS_KEY = 'worktimer.lang';
let current = localStorage.getItem(LS_KEY) || 'en';
const subscribers = new Set();

// =============================================================================
// Translation Dictionary
// =============================================================================

const dict = {
  en: {
    // States & Controls
    idle: 'Idle',
    running: 'Running',
    paused: 'Paused',
    stopped: 'Stopped',
    play: '▶️ Play',
    pause: '⏸️ Pause',
    resume: '▶️ Resume',
    stop: '■ Stop',
    reset: '↺ Reset',
    clearToday: '✖️ Clear today',
    clearAll: '🗑 Clear all',
    today: 'Today',
    intervals: 'Intervals',
    history_last: (n) => `History (${n})`,
    prev: '◀️ Prev',
    next: 'Next ▶️',

    // Modal
    session_summary: 'Session summary',
    copy: 'Copy',
    close: 'Close',

    // Report
    worked_head: ({ date, total, from, to }) => 
      `${date} — Worked ${total} (from ${from} to ${to}).`,
    intervals_title: 'Intervals:',
    human_h: (n) => `${n} hour${n === 1 ? '' : 's'}`,
    human_m: (n) => `${n} minute${n === 1 ? '' : 's'}`,
    human_s: (n) => `${n} s`,
    more: (n) => `…${n} more`,

    // Confirmations
    confirm_clear_today: "Clear today's history and reset today's time?",
    confirm_clear_all: "Delete ALL history and reset current session?",
  },

  uk: {
    // States & Controls
    idle: 'Неактивно',
    running: 'Працюю',
    paused: 'Пауза',
    stopped: 'Зупинено',
    play: '▶️ Старт',
    pause: '⏸️ Пауза',
    resume: '▶️ Продовжити',
    stop: '■ Стоп',
    reset: '↺ Скинути',
    clearToday: '✖️ Очистити день',
    clearAll: '🗑 Очистити все',
    today: 'Сьогодні',
    intervals: 'Інтервали',
    history_last: (n) => `Історія (${n})`,
    prev: '◀️ Назад',
    next: 'Далі ▶️',

    // Modal
    session_summary: 'Підсумок сесії',
    copy: 'Копіювати',
    close: 'Закрити',

    // Report
    worked_head: ({ date, total, from, to }) => 
      `${date} — Відпрацьовано ${total} (з ${from} до ${to}).`,
    intervals_title: 'Інтервали:',
    human_h: (n) => `${n} год`,
    human_m: (n) => `${n} хв`,
    human_s: (n) => `${n} с`,
    more: (n) => `…ще ${n}`,

    // Confirmations
    confirm_clear_today: 'Очистити історію за сьогодні і скинути час?',
    confirm_clear_all: 'Видалити ВСЮ історію та скинути поточну сесію?',
  }
};

// =============================================================================
// Translation API
// =============================================================================

/**
 * Get translation for key in current language
 * @param {string} key - Translation key
 * @param {*} params - Parameters for function-based translations
 * @returns {string} Translated text or key if not found
 */
export function t(key, params) {
  const value = dict[current]?.[key];
  if (typeof value === 'function') return value(params ?? {});
  return (value ?? key);
}

/**
 * Get current language code
 * @returns {string} Current language code
 */
export function getLang() {
  return current;
}

/**
 * Set language and notify subscribers
 * @param {string} code - Language code (en, uk, etc.)
 */
export function setLang(code) {
  if (!dict[code]) return;
  current = code;
  localStorage.setItem(LS_KEY, current);
  subscribers.forEach(fn => fn(current));
}

/**
 * Subscribe to language changes
 * @param {Function} fn - Callback function
 * @returns {Function} Unsubscribe function
 */
export function onLangChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Initialize i18n system
 * @returns {string} Current language code
 */
export function initI18n() {
  if (!dict[current]) current = 'en';
  return current;
}

// =============================================================================
// DOM Text Stamping
// =============================================================================

/**
 * Apply translations to DOM elements with data-i18n attributes
 * @param {HTMLElement} root - Root element to search from (default: document)
 */
export function applyI18n(root = document) {
  // Translate textContent via [data-i18n]
  root.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    const paramsAttr = node.getAttribute('data-i18n-params');
    const params = paramsAttr ? JSON.parse(paramsAttr) : undefined;
    node.textContent = t(key, params);
  });

  // Translate attributes via [data-i18n-attr]
  // Format: {"title":"key1","aria-label":"key2"}
  root.querySelectorAll('[data-i18n-attr]').forEach(node => {
    try {
      const map = JSON.parse(node.getAttribute('data-i18n-attr') || '{}');
      Object.entries(map).forEach(([attr, key]) => {
        node.setAttribute(attr, t(key));
      });
    } catch {
      // Silently ignore malformed JSON
    }
  });
}

