export const modal = {
  el: null, textEl: null, copyBtn: null, closeBtn: null,
  _copyPayload: null,

  init() {
    this.el       = document.getElementById('modalBackdrop');
    this.textEl   = document.getElementById('summaryText');
    this.copyBtn  = document.getElementById('copyBtn');
    this.closeBtn = document.getElementById('closeModalBtn');

    if (!this.el || !this.textEl || !this.copyBtn || !this.closeBtn) {
      console.warn('[modal] Missing elements:', {
        backdrop: !!this.el, text: !!this.textEl, copy: !!this.copyBtn, close: !!this.closeBtn
      });
      return;
    }

    this.closeBtn.addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    this.copyBtn.addEventListener('click', async () => {
      const text = this._copyPayload ?? this.textEl.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        this.copyBtn.textContent = 'Copied ✓';
        setTimeout(() => this.copyBtn.textContent = 'Copy', 1200);
      } catch {}
    });
  },

  /**
   * Открыть модалку.
   * @param {string} displayText — то, что показываем на экране (может быть урезано)
   * @param {string} [copyText]  — то, что копируем (полная версия). Если не передать — копируется displayText.
   */
  open(displayText, copyText) {
    if (!this.el || !this.textEl) return;
    this.textEl.textContent = displayText;
    this._copyPayload = copyText ?? displayText;
    this.el.classList.add('is-open');
  },

  close(){ if (this.el) this.el.classList.remove('is-open'); this._copyPayload = null; }
};
