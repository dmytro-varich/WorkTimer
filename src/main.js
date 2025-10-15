/**
 * WorkTimer - Main Entry Point
 * 
 * Initializes the application, sets up event handlers,
 * manages the timer tick loop, and coordinates between
 * state management, UI rendering, and i18n localization.
 */

import { state, startOrResume, pause, stop, reset, clearToday, clearAll } from './state/session.js';
import { updateUI, summaryHuman, historyPrev, historyNext } from './ui/render.js';
import { initI18n, getLang, setLang, onLangChange, applyI18n } from './i18n/lang.js';
import { modal } from './ui/modal.js';

let rafId = null;

// =============================================================================
// Viewport Height Fix (mobile Safari compatibility)
// =============================================================================

function setVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVhVar();
window.addEventListener('resize', setVhVar);
window.addEventListener('orientationchange', setVhVar);

// =============================================================================
// Timer Tick Loop
// =============================================================================

/**
 * Main animation loop that updates UI while timer is running
 */
function tick() {
  if (state.current.state !== 'running') return;
  updateUI({ withHistory: false });
  rafId = requestAnimationFrame(tick);
}

// =============================================================================
// Application Bootstrap
// =============================================================================

function boot() {
  // ---------------------------------------------------------------------------
  // I18n Initialization
  // ---------------------------------------------------------------------------
  initI18n();
  applyI18n(document);

  // Language selector setup
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = getLang();
  langSel?.addEventListener('change', (e) => setLang(e.target.value));

  // Re-apply translations when language changes
  onLangChange(() => {
    applyI18n(document);
    try { modal.init(); } catch {}
    updateUI({ withHistory: true });
  });

  // ---------------------------------------------------------------------------
  // Modal and Initial UI Render
  // ---------------------------------------------------------------------------
  modal.init();
  updateUI({ withHistory: true });

  // ---------------------------------------------------------------------------
  // Main Control Buttons
  // ---------------------------------------------------------------------------

  // Play/Pause Button
  document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (state.current.state === 'running') {
      pause();
      cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      startOrResume();
      tick();
    }
    updateUI({ withHistory: false });
  });

  // Stop Button - saves session and shows summary modal
  document.getElementById('stopBtn').addEventListener('click', () => {
    const entry = stop();
    if (entry) {
      const { display, full } = summaryHuman(entry, 5);
      modal.open(display, full);
      cancelAnimationFrame(rafId);
      rafId = null;
      updateUI({ withHistory: true });
    }
  });

  // Reset Button - clears current session without saving
  document.getElementById('resetBtn').addEventListener('click', () => {
    reset();
    cancelAnimationFrame(rafId);
    rafId = null;
    updateUI({ withHistory: true });
  });

  // ---------------------------------------------------------------------------
  // Clear History Buttons
  // ---------------------------------------------------------------------------

  // Clear Today's History
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const ok = confirm('Clear today\'s history and reset today\'s time?');
      if (!ok) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      clearToday();
      updateUI({ withHistory: true });
    });
  }

  // Clear All History
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const ok = confirm('Delete ALL history and reset current session?');
      if (!ok) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      clearAll();
      updateUI({ withHistory: true });
    });
  }

  // ---------------------------------------------------------------------------
  // History Pagination Controls
  // ---------------------------------------------------------------------------

  // Button click pagination
  document.addEventListener('click', (e) => {
    const id = e.target?.id;
    if (id === 'histPrev') historyPrev();
    if (id === 'histNext') historyNext();
  });

  // Keyboard navigation (Arrow keys when history details open)
  document.addEventListener('keydown', (e) => {
    const detailsOpen = document.getElementById('histDetails')?.open;
    if (!detailsOpen) return;
    if (e.key === 'ArrowLeft') historyPrev();
    if (e.key === 'ArrowRight') historyNext();
  });

  // ---------------------------------------------------------------------------
  // History Item Click - Show Summary Modal
  // ---------------------------------------------------------------------------

  const historyRoot = document.getElementById('history');
  if (historyRoot) {
    historyRoot.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (!item) return;
      const entry = (state.history || []).find(h => String(h.from) === String(item.dataset.id));
      if (!entry) return;
      const { display, full } = summaryHuman(entry, 5);
      modal.open(display, full);
    });
  }

  // ---------------------------------------------------------------------------
  // Resume Running Timer (if page was reloaded during active session)
  // ---------------------------------------------------------------------------

  if (state.current.state === 'running') tick();
}

// =============================================================================
// Start Application
// =============================================================================

window.addEventListener('DOMContentLoaded', boot);

