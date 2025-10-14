const safeGet = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const keys = {
  current: 'wt_current_v1',
  history: 'wt_history_v1'
};

export const loadCurrent = () => safeGet(keys.current, { state:'idle', intervals:[] });
export const saveCurrent = (val) => safeSet(keys.current, val);

export const loadHistory = () => safeGet(keys.history, []);
export const saveHistory = (val) => safeSet(keys.history, val);
