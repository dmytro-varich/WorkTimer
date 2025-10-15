/**
 * UI Rendering Module
 * 
 * Handles all UI updates including:
 * - Timer display and state indicators
 * - Current session intervals
 * - History list with pagination
 * - Session summary formatting
 */

import { fmtHMS, fmtTime, fmtDate } from '../utils/time.js';
import { state, sumIntervals } from '../state/session.js';
import { t, applyI18n } from '../i18n/lang.js';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get DOM element by ID
 */
const el = (id) => document.getElementById(id);

/**
 * Format milliseconds to human-readable duration (localized)
 * @param {number} ms - Milliseconds to format
 * @returns {string} Human-readable duration
 */
function humanDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  
  const parts = [];
  if (h) parts.push(t('human_h', h));
  if (m) parts.push(t('human_m', m));
  // Only show seconds if no hours and minutes
  if (!h && !m) parts.push(t('human_s', sec));
  
  return parts.join(' ');
}

// =============================================================================
// Session Summary Formatting
// =============================================================================

/**
 * Generate human-readable session summary with interval truncation
 * @param {Object} entry - Session entry object
 * @param {number} limit - Max intervals to show in display version
 * @returns {Object} {display, full} - Display and full text versions
 */
export function summaryHuman(entry, limit = 5) {
  const d = new Date(entry.from);
  const dd = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const total = humanDuration(entry.totalMs);
  const from = fmtTime(new Date(entry.from));
  const to = fmtTime(new Date(entry.to));

  const linesAll = entry.intervals.map((it, i) =>
    `  ${String(i + 1).padStart(2, '0')}) ${fmtTime(new Date(it.start))}–${fmtTime(new Date(it.end))}`
  );

  const head = `${t('worked_head', { date: dd, total, from, to })}\n\n${t('intervals_title')}\n`;
  const full = head + linesAll.join('\n');

  let display = full;
  if (entry.intervals.length > limit) {
    const rest = entry.intervals.length - limit;
    display = head + linesAll.slice(0, limit).join('\n') + `\n\n  ${t('more', rest)}`;
  }

  return { display, full };
}

/**
 * Legacy text format summary (for backwards compatibility)
 */
export function summaryString(entry) {
  const from = fmtTime(new Date(entry.from));
  const to = fmtTime(new Date(entry.to));
  const total = fmtHMS(entry.totalMs);
  const parts = entry.intervals
    .map((it, i) => `  ${String(i + 1).padStart(2, '0')}) ${fmtTime(new Date(it.start))}–${fmtTime(new Date(it.end))}`)
    .join('\n');
  return `${t('worked_head', { date: entry.date, total, from, to })}\n${t('intervals_title')}\n${parts}`;
}

// =============================================================================
// Main UI Update
// =============================================================================

/**
 * Update all UI elements
 * @param {Object} options - Update options
 * @param {boolean} options.withHistory - Whether to re-render history
 */
export function updateUI({ withHistory = false } = {}) {
  const { current, history } = state;

  // Update timer display
  const ms = sumIntervals(current.intervals ?? []);
  el('display').textContent = fmtHMS(ms);
  el('intervalCount').textContent = (current.intervals?.length ?? 0).toString();

  // Update state indicator and button
  const map = {
    idle: { text: t('idle'), color: '#a7aab3', btn: t('play') },
    running: { text: t('running'), color: '#4d79ff', btn: t('pause') },
    paused: { text: t('paused'), color: '#ffcc66', btn: t('resume') },
    stopped: { text: t('stopped'), color: '#a7aab3', btn: t('play') }
  };
  const st = map[current.state ?? 'idle'];
  el('stateText').textContent = st.text;
  el('stateDot').style.color = st.color;
  el('playPauseBtn').textContent = st.btn;

  // Update today's total
  const today = fmtDate(new Date());
  const todayMs = (history ?? []).filter(h => h.date === today)
    .reduce((acc, h) => acc + h.totalMs, 0) + (current.day === today ? ms : 0);
  el('todayTotal').textContent = fmtHMS(todayMs);

  // Update labels (if not using data-i18n in HTML)
  const todayLabel = el('todayLabel');
  if (todayLabel) todayLabel.textContent = t('today');
  const intervalsLabel = el('intervalsLabel');
  if (intervalsLabel) intervalsLabel.textContent = t('intervals');

  renderCurrentIntervals();
  if (withHistory) renderHistory();
}

// =============================================================================
// Current Session Intervals
// =============================================================================

/**
 * Render list of current session intervals
 */
function renderCurrentIntervals() {
  const box = el('intervalList');
  if (!box) return;
  
  const ints = state.current?.intervals ?? [];
  if (!ints.length) {
    box.innerHTML = '';
    return;
  }

  const html = ints.map((it, i) => {
    const idx = String(i + 1).padStart(2, '0');
    const s = fmtTime(new Date(it.start));
    const end = it.end ? new Date(it.end) : new Date();
    const e = fmtTime(end);
    const dur = fmtHMS((it.end ?? Date.now()) - it.start);
    const live = it.end ? '' : ' •';
    
    return `
      <div class="int-row">
        <div><strong>${idx}</strong>) ${s}–${e}${live}</div>
        <div>${dur}</div>
      </div>`;
  }).join('');

  box.innerHTML = html;
}

// =============================================================================
// History with Pagination
// =============================================================================

let histPage = 0; // Current page (0-indexed)

/**
 * Get page size based on viewport width
 * @returns {number} Number of items per page
 */
function getPageSize() {
  return window.matchMedia('(max-width: 560px)').matches ? 4 : 1;
}

/**
 * Render history section with pagination
 */
export function renderHistory() {
  const root = document.getElementById('history');
  const all = (state.history ?? []).slice().reverse(); // Newest first
  const total = all.length;

  if (!root) return;
  if (!total) {
    root.innerHTML = ` 
      <div class="history-empty" data-i18n="history_empty"> 
        No history yet 
      </div> 
    `; 
    applyI18n(root); 
    return; 
  }

  // Preserve details open state
  const wasOpen = root.querySelector('details')?.open ?? true;

  // Calculate pagination
  const pages = Math.max(1, Math.ceil(total / getPageSize()));
  histPage = Math.max(0, Math.min(histPage, pages - 1));

  const start = histPage * getPageSize();
  const pageItems = all.slice(start, start + getPageSize());

  root.innerHTML = `
    <details ${wasOpen ? 'open' : ''} id="histDetails">
      <summary>
        <span class="carret" aria-hidden="true"></span>
        ${t('history_last', total)}
      </summary>

      <div class="hist-panel">
        <div class="history-list" id="historyList">
          ${pageItems.map(item => {
            const from = fmtTime(new Date(item.from));
            const to = fmtTime(new Date(item.to));
            const dateObj = new Date(item.from);
            const dd = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;

            return `
            <div class="history-item" data-id="${item.from}">
              <div class="history-item__meta"><strong>${dd}</strong> (${from}–${to})</div>
              <div class="badge">${fmtHMS(item.totalMs)}</div>
            </div>
          `;
          }).join('')}
        </div>

        <!-- Pagination controls -->
        <div class="hist-controls bottom">
          <button id="histPrev" class="ghost" ${histPage <= 0 ? 'disabled' : ''}>${t('prev')}</button>
          <div class="hist-page-indicator">${histPage + 1}/${pages}</div>
          <button id="histNext" class="ghost" ${histPage >= pages - 1 ? 'disabled' : ''}>${t('next')}</button>
        </div>
      </div>
    </details>
  `;
}

// =============================================================================
// Pagination Navigation
// =============================================================================

/**
 * Navigate to previous page
 */
export function historyPrev() {
  if (histPage > 0) {
    histPage--;
    renderHistory();
  }
}

/**
 * Navigate to next page
 */
export function historyNext() {
  const total = (state.history ?? []).length;
  const pages = Math.max(1, Math.ceil(total / getPageSize()));
  if (histPage < pages - 1) {
    histPage++;
    renderHistory();
  }
}

// =============================================================================
// Backwards Compatibility (Legacy API)
// =============================================================================

export function renderHistoryPaged(reset = false) {
  renderHistory();
}

export function historyPrevPage() {
  historyPrev();
}

export function historyNextPage() {
  historyNext();
}

