/**
 * Time Formatting Utilities
 * 
 * Provides functions for formatting time and dates consistently
 * throughout the application.
 */

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Pad number with leading zero if needed
 * @param {number} n - Number to pad
 * @returns {string} Zero-padded string
 */
export const pad = n => String(n).padStart(2, '0');

// =============================================================================
// Time Formatters
// =============================================================================

/**
 * Format milliseconds to HH:MM:SS
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export const fmtHMS = (ms) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

/**
 * Format Date object to HH:MM
 * @param {Date} d - Date object
 * @returns {string} Formatted time string
 */
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Format Date object to YYYY-MM-DD
 * @param {Date} d - Date object
 * @returns {string} ISO date string
 */
export const fmtDate = (d) => d.toISOString().slice(0, 10);

