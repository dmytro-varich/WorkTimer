// src/i18n/lang.js
// Lightweight i18n helper with localStorage + live subscribers

const LS_KEY = 'worktimer.lang';
let current = localStorage.getItem(LS_KEY) || 'en';
const subscribers = new Set();

const dict = {
  en: {
    // states & controls
    idle: 'Idle', running: 'Running', paused: 'Paused', stopped: 'Stopped',
    play: '▶️ Play', pause: '⏸️ Pause', resume: '▶️ Resume',
    stop: '■ Stop', reset: '↺ Reset',
    clearToday: '✖️ Clear today', clearAll: '🗑 Clear all',
    today: 'Today', intervals: 'Intervals',
    history_last: (n)=>`History (${n})`,
    prev: '◀️ Prev', next: 'Next ▶️',

    // modal
    session_summary: 'Session summary',
    copy: 'Copy', close: 'Close',

    // report
    worked_head: ({date, total, from, to}) => `${date} — Worked ${total} (from ${from} to ${to}).`,
    intervals_title: 'Intervals:',
    human_h: (n)=>`${n} hour${n===1?'':'s'}`,
    human_m: (n)=>`${n} minute${n===1?'':'s'}`,
    human_s: (n)=>`${n} s`,
    more: (n)=>`…${n} more`,

    // optional confirms
    confirm_clear_today: "Clear today's history and reset today's time?",
    confirm_clear_all: "Delete ALL history and reset current session?",
  },

  uk: {
    idle: 'Неактивно', running: 'Працюю', paused: 'Пауза', stopped: 'Зупинено',
    play: '▶️ Старт', pause: '⏸️ Пауза', resume: '▶️ Продовжити',
    stop: '■ Стоп', reset: '↺ Скинути',
    clearToday: '✖️ Очистити день', clearAll: '🗑 Очистити все',
    today: 'Сьогодні', intervals: 'Інтервали',
    history_last: (n)=>`Історія (${n})`,
    prev: '◀️ Назад', next: 'Далі ▶️',

    session_summary: 'Підсумок сесії',
    copy: 'Копіювати', close: 'Закрити',

    worked_head: ({date, total, from, to}) => `${date} — Відпрацьовано ${total} (з ${from} до ${to}).`,
    intervals_title: 'Інтервали:',
    human_h: (n)=>`${n} год`,
    human_m: (n)=>`${n} хв`,
    human_s: (n)=>`${n} с`,
    more: (n)=>`…ще ${n}`,

    confirm_clear_today: 'Очистити історію за сьогодні і скинути час?',
    confirm_clear_all: 'Видалити ВСЮ історію та скинути поточну сесію?',
  }
};

export function t(key, params) {
  const value = dict[current]?.[key];
  if (typeof value === 'function') return value(params ?? {});
  return (value ?? key);
}
export function getLang(){ return current; }
export function setLang(code){
  if (!dict[code]) return;
  current = code;
  localStorage.setItem(LS_KEY, current);
  subscribers.forEach(fn => fn(current));
}
export function onLangChange(fn){ subscribers.add(fn); return ()=>subscribers.delete(fn); }
export function initI18n(){
  if (!dict[current]) current = 'en';
  return current;
}

// Stamp texts for elements with [data-i18n] and attributes via [data-i18n-attr]
export function applyI18n(root=document){
  root.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    const paramsAttr = node.getAttribute('data-i18n-params');
    const params = paramsAttr ? JSON.parse(paramsAttr) : undefined;
    node.textContent = t(key, params);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach(node => {
    try {
      const map = JSON.parse(node.getAttribute('data-i18n-attr') || '{}'); // {"title":"copy","aria-label":"stop"}
      Object.entries(map).forEach(([attr, key]) => node.setAttribute(attr, t(key)));
    } catch {}
  });
}
