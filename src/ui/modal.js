export const modal = {
  el: null, textEl: null, copyBtn: null, closeBtn: null,
  init() {
    this.el = document.getElementById('modalBackdrop');
    this.textEl = document.getElementById('summaryText');
    this.copyBtn = document.getElementById('copyBtn');
    this.closeBtn = document.getElementById('closeModalBtn');

    this.closeBtn.addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    this.copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.textEl.textContent);
        this.copyBtn.textContent = 'Copied ✓';
        setTimeout(() => this.copyBtn.textContent = 'Copy', 1200);
      } catch { }
    });
  },
  open(text) {
    if (!this.el || !this.textEl) return;
    this.textEl.textContent = text;
    this.el.classList.add('is-open');
  },
  close() {
    if (this.el) this.el.classList.remove('is-open');
  }
};
