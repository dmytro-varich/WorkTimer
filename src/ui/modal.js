// src/ui/modal.js
import { t, onLangChange } from '../i18n/lang.js';

export const modal = {
  el: null,
  textEl: null,
  copyBtn: null,
  closeBtn: null,
  titleEl: null,
  _copyPayload: null,
  _lastFocused: null,

  init() {
    this.el       = document.getElementById('modalBackdrop');
    this.textEl   = document.getElementById('summaryText');
    this.copyBtn  = document.getElementById('copyBtn');
    this.closeBtn = document.getElementById('closeModalBtn');
    this.titleEl  = document.getElementById('modalTitle');

    if (!this.el || !this.textEl || !this.copyBtn || !this.closeBtn) {
      console.warn('[modal] Missing elements:', {
        backdrop: !!this.el, text: !!this.textEl, copy: !!this.copyBtn, close: !!this.closeBtn
      });
      return;
    }

    // первичная установка локализованных текстов
    this.refreshTexts();

    // обновлять подписи при смене языка
    onLangChange(() => this.refreshTexts());

    // события
    this.closeBtn.addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab') this.trapFocus(e);
    });

    this.copyBtn.addEventListener('click', async () => {
      const text = this._copyPayload ?? this.textEl.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        // Показать короткое подтверждение локализованно
        const base = t('copy');
        this.copyBtn.textContent = `${base} ✓`;
        setTimeout(() => this.copyBtn.textContent = t('copy'), 1200);
      } catch {
        // молча игнорируем; можно дополнить fallback (выделение + execCommand)
      }
    });
  },

  refreshTexts() {
    if (this.titleEl) this.titleEl.textContent = t('session_summary');
    if (this.copyBtn) this.copyBtn.textContent = t('copy');
    if (this.closeBtn) this.closeBtn.textContent = t('close');
    // по желанию: подсказки через data-i18n-attr можно ставить в HTML
  },

  /**
   * Открыть модалку.
   * @param {string} displayText — то, что показываем на экране (может быть урезано)
   * @param {string} [copyText]  — то, что копируем (полная версия). Если не передать — копируется displayText.
   */
  open(displayText, copyText) {
    if (!this.el || !this.textEl) return;
    this._lastFocused = document.activeElement;
    this.textEl.textContent = displayText;
    this._copyPayload = copyText ?? displayText;
    this.el.classList.add('is-open');
    // фокус на кнопку копирования для удобства
    setTimeout(() => this.copyBtn?.focus(), 0);
  },

  close(){
    if (!this.el) return;
    this.el.classList.remove('is-open');
    this._copyPayload = null;
    // вернуть фокус куда был
    if (this._lastFocused && typeof this._lastFocused.focus === 'function') {
      this._lastFocused.focus();
    }
    this._lastFocused = null;
  },

  isOpen(){ return this.el?.classList.contains('is-open'); },

  // Примитивная ловушка фокуса внутри модалки
  trapFocus(e){
    const focusables = this.el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }
};
