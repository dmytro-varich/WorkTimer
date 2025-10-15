/**
 * LocalStorage Persistence Layer
 * 
 * Provides safe read/write operations for localStorage.
 * Handles JSON serialization and gracefully handles errors.
 */

// =============================================================================
// Safe Storage Operations
// =============================================================================

/**
 * Safely get and parse value from localStorage
 * @param {string} k - Storage key
 * @param {*} fallback - Default value if key not found or parse fails
 * @returns {*} Parsed value or fallback
 */
const safeGet = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safely stringify and set value to localStorage
 * @param {string} k - Storage key
 * @param {*} v - Value to store
 */
const safeSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // Silently fail (e.g., quota exceeded, private browsing)
  }
};

// =============================================================================
// Storage Keys
// =============================================================================

export const keys = {
  current: 'wt_current_v1',
  history: 'wt_history_v1'
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Load current session from storage
 * @returns {Object} Current session object
 */
export const loadCurrent = () => safeGet(keys.current, { state: 'idle', intervals: [] });

/**
 * Save current session to storage
 * @param {Object} val - Session object to save
 */
export const saveCurrent = (val) => safeSet(keys.current, val);

/**
 * Load history from storage
 * @returns {Array} Array of completed sessions
 */
export const loadHistory = () => safeGet(keys.history, []);

/**
 * Save history to storage
 * @param {Array} val - Array of sessions to save
 */
export const saveHistory = (val) => safeSet(keys.history, val);

