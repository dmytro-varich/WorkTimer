import { fmtDate } from '../utils/time.js';
import { loadCurrent, saveCurrent, loadHistory, saveHistory } from '../storage/local.js';

export const state = {
  current: loadCurrent(),
  history: loadHistory(),
  rafId: null
};

export const sumIntervals = (intervals = []) =>
  intervals.reduce((acc, it) => acc + ((it.end ?? Date.now()) - it.start), 0);

const todayStr = () => fmtDate(new Date());

export function startOrResume() {
  const now = Date.now();
  if (['idle', 'stopped'].includes(state.current.state) || !state.current.state) {
    state.current = {
      state: 'running',
      startedAt: now,
      intervals: [{ start: now }],
      day: fmtDate(new Date())
    };
  } else if (state.current.state === 'paused') {
    state.current.state = 'running';
    state.current.intervals.push({ start: now });
  }
  saveCurrent(state.current);
}

export function pause() {
  if (state.current.state !== 'running') return;
  const now = Date.now();
  const intervals = state.current.intervals || [];
  const last = intervals[intervals.length - 1];
  if (last && !last.end) last.end = now;
  state.current.state = 'paused';
  saveCurrent(state.current);
}

export function stop() {
  if (state.current.state === 'idle') return null;

  if (state.current.state === 'running') {
    const now = Date.now();
    const intervals = state.current.intervals || [];
    const last = intervals[intervals.length - 1];
    if (last && !last.end) last.end = now;
  }

  const totalMs = sumIntervals(state.current.intervals);
  const first = state.current.intervals[0];
  const lastIt = state.current.intervals[state.current.intervals.length - 1];

  const entry = {
    date: fmtDate(new Date(first.start)),
    totalMs,
    from: new Date(first.start).toISOString(),
    to: new Date(lastIt.end).toISOString(),
    intervals: state.current.intervals
  };

  const hist = loadHistory();
  hist.push(entry);
  state.history = hist;
  saveHistory(hist);

  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
  return entry;
}

export function reset() {
  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
}

/**
 * Очистить все записи за сегодня и сбросить текущую сегодняшнюю сессию.
 * Возвращает { clearedDate: 'YYYY-MM-DD' }.
 */
export function clearToday() {
  const today = todayStr();

  // очистка истории за сегодня
  const nextHistory = (loadHistory() || []).filter(h => h.date !== today);
  state.history = nextHistory;
  saveHistory(nextHistory);

  // если текущая сессия относится к сегодняшнему дню — сбросим её
  if (state.current?.day === today || state.current?.state === 'running' || state.current?.state === 'paused') {
    state.current = { state: 'idle', intervals: [] };
    saveCurrent(state.current);
  }

  return { clearedDate: today };
}

/** Полная очистка (если понадобится) */
export function clearAll() {
  state.history = [];
  saveHistory([]);
  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
}
