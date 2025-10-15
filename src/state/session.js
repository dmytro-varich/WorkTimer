/**
 * Session State Management
 * 
 * Manages the current work session and history of completed sessions.
 * Handles session lifecycle: start, pause, resume, stop, reset.
 * Persists data to localStorage via storage module.
 */

import { fmtDate } from '../utils/time.js';
import { loadCurrent, saveCurrent, loadHistory, saveHistory } from '../storage/local.js';

// =============================================================================
// Application State
// =============================================================================

export const state = {
  current: loadCurrent(),
  history: loadHistory(),
  rafId: null
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate total milliseconds from array of time intervals
 * @param {Array} intervals - Array of {start, end?} objects
 * @returns {number} Total milliseconds
 */
export const sumIntervals = (intervals = []) =>
  intervals.reduce((acc, it) => acc + ((it.end ?? Date.now()) - it.start), 0);

/**
 * Get today's date as string (YYYY-MM-DD)
 */
const todayStr = () => fmtDate(new Date());

// =============================================================================
// Session Control Functions
// =============================================================================

/**
 * Start a new session or resume from paused state
 */
export function startOrResume() {
  const now = Date.now();
  
  if (['idle', 'stopped'].includes(state.current.state) || !state.current.state) {
    // Start new session
    state.current = {
      state: 'running',
      startedAt: now,
      intervals: [{ start: now }],
      day: fmtDate(new Date())
    };
  } else if (state.current.state === 'paused') {
    // Resume from pause - add new interval
    state.current.state = 'running';
    state.current.intervals.push({ start: now });
  }
  
  saveCurrent(state.current);
}

/**
 * Pause the current running session
 */
export function pause() {
  if (state.current.state !== 'running') return;
  
  const now = Date.now();
  const intervals = state.current.intervals || [];
  const last = intervals[intervals.length - 1];
  
  // Close the current interval
  if (last && !last.end) last.end = now;
  
  state.current.state = 'paused';
  saveCurrent(state.current);
}

/**
 * Stop the session and save to history
 * @returns {Object|null} Session entry or null if idle
 */
export function stop() {
  if (state.current.state === 'idle') return null;

  // If still running, close the last interval
  if (state.current.state === 'running') {
    const now = Date.now();
    const intervals = state.current.intervals || [];
    const last = intervals[intervals.length - 1];
    if (last && !last.end) last.end = now;
  }

  // Create history entry
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

  // Add to history
  const hist = loadHistory();
  hist.push(entry);
  state.history = hist;
  saveHistory(hist);

  // Reset current session
  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
  
  return entry;
}

/**
 * Reset current session without saving to history
 */
export function reset() {
  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
}

// =============================================================================
// History Management Functions
// =============================================================================

/**
 * Clear all entries for today and reset current session
 * @returns {Object} Object with clearedDate property
 */
export function clearToday() {
  const today = todayStr();

  // Remove today's entries from history
  const nextHistory = (loadHistory() || []).filter(h => h.date !== today);
  state.history = nextHistory;
  saveHistory(nextHistory);

  // Reset current session if it belongs to today
  if (state.current?.day === today || 
      state.current?.state === 'running' || 
      state.current?.state === 'paused') {
    state.current = { state: 'idle', intervals: [] };
    saveCurrent(state.current);
  }

  return { clearedDate: today };
}

/**
 * Clear all history and reset current session
 */
export function clearAll() {
  state.history = [];
  saveHistory([]);
  state.current = { state: 'idle', intervals: [] };
  saveCurrent(state.current);
}

