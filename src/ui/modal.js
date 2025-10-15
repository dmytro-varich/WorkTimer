/**
 * Modal Dialog Component
 * 
 * Manages session summary modal with:
 * - Localized text support
 * - Copy to clipboard functionality
 * - Keyboard navigation and focus trapping
 * - Accessibility features
 */

import { t, onLangChange } from '../i18n/lang.js';

// =============================================================================
// Modal Component
// =============================================================================

export const modal = {
  // DOM elements
  el: null,
  textEl: null,
  copyBtn: null,
  closeBtn: null,
  titleEl: null,
  
  // State
  _copyPayload: null,    // Full text for copying (may differ from display)
  _lastFocused: null,    // Element to restore focus to on close

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  /**
   * Initialize modal component and event handlers
   */
  init() {
    // Get DOM references
    this.el = document.getElementById('modalBackdrop');
    this.textEl = document.getElementById('summaryText');
    this.copyBtn = document.getElementById('copyBtn');
    this.closeBtn = document.getElementById('closeModalBtn');
    this.titleEl = document.getElementById('modalTitle');

    // Validate required elements
    if (!this.el || !this.textEl || !this.copyBtn || !this.closeBtn) {
      console.warn('[modal] Missing elements:', {
        backdrop: !!this.el,
        text: !!this.textEl,
        copy: !!this.copyBtn,
        close: !!this.closeBtn
      });
      return;
    }

    // Apply initial localized text
    this.refreshTexts();

    // Update text when language changes
    onLangChange(() => this.refreshTexts());

    // Setup event handlers
    this.setupEvents();
  },

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  /**
   * Setup all event handlers
   */
  setupEvents() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());

    // Click outside to close
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab') this.trapFocus(e);
    });

    // Copy button with feedback
    this.copyBtn.addEventListener('click', async () => {
      const text = this._copyPayload ?? this.textEl.textContent ?? '';
      
      try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const base = t('copy');
        this.copyBtn.textContent = `${base} ✓`;
        setTimeout(() => this.copyBtn.textContent = t('copy'), 1200);
      } catch {
        // Silently ignore errors (could add fallback with execCommand)
      }
    });
  },

  // -------------------------------------------------------------------------
  // Localization
  // -------------------------------------------------------------------------

  /**
   * Update all localized text in modal
   */
  refreshTexts() {
    if (this.titleEl) this.titleEl.textContent = t('session_summary');
    if (this.copyBtn) this.copyBtn.textContent = t('copy');
    if (this.closeBtn) this.closeBtn.textContent = t('close');
  },

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Open modal with content
   * @param {string} displayText - Text to display (may be truncated)
   * @param {string} [copyText] - Text to copy (full version). Defaults to displayText
   */
  open(displayText, copyText) {
    if (!this.el || !this.textEl) return;
    
    // Save current focus for restoration
    this._lastFocused = document.activeElement;
    
    // Set content
    this.textEl.textContent = displayText;
    this._copyPayload = copyText ?? displayText;
    
    // Show modal
    this.el.classList.add('is-open');
    
    // Focus copy button for keyboard accessibility
    setTimeout(() => this.copyBtn?.focus(), 0);
  },

  /**
   * Close modal and restore focus
   */
  close() {
    if (!this.el) return;
    
    // Hide modal
    this.el.classList.remove('is-open');
    this._copyPayload = null;
    
    // Restore focus to element that opened modal
    if (this._lastFocused && typeof this._lastFocused.focus === 'function') {
      this._lastFocused.focus();
    }
    this._lastFocused = null;
  },

  /**
   * Check if modal is currently open
   * @returns {boolean} True if modal is open
   */
  isOpen() {
    return this.el?.classList.contains('is-open');
  },

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  /**
   * Trap focus within modal for keyboard navigation
   * @param {KeyboardEvent} e - Tab key event
   */
  trapFocus(e) {
    const focusables = this.el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusables.length) return;
    
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    
    // Shift+Tab on first element - go to last
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    }
    // Tab on last element - go to first
    else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
};

