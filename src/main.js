// src/main.js
import { state, startOrResume, pause, stop, reset, clearToday, clearAll } from './state/session.js';
import { updateUI, summaryHuman, historyPrev, historyNext } from './ui/render.js';
import { initI18n, getLang, setLang, onLangChange, applyI18n /*, t*/ } from './i18n/lang.js';
import { modal } from './ui/modal.js';

let rafId = null;

function tick() {
  if (state.current.state !== 'running') return;
  updateUI({ withHistory: false });
  rafId = requestAnimationFrame(tick);
}

function boot() {
  // ---- i18n: инициализация и первичная разметка текстов
  initI18n();
  applyI18n(document);

  // если есть селект языка — выставим и подпишемся
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = getLang();
  langSel?.addEventListener('change', (e) => setLang(e.target.value));

  // при смене языка: обновить тексты в DOM + перерендерить UI/историю
  onLangChange(() => {
    applyI18n(document);                // проставит data-i18n тексты
    try { modal.init(); } catch {}       // обновит подписи в модалке, если завязаны на i18n
    updateUI({ withHistory: true });     // чтобы перерисовать кнопки/заголовки/историю
  });
  // ---- конец i18n-блока

  modal.init();
  updateUI({ withHistory: true }); // отрисуем всё, включая history (details+пагинация)

  // Play/Pause
  document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (state.current.state === 'running') {
      pause();
      cancelAnimationFrame(rafId); rafId = null;
    } else {
      startOrResume();
      tick();
    }
    updateUI({ withHistory: false });
  });

  // Stop -> модалка + запись в историю
  document.getElementById('stopBtn').addEventListener('click', () => {
    const entry = stop();
    if (entry) {
      const { display, full } = summaryHuman(entry, 5); // показываем 5, копируем всё
      modal.open(display, full);
      cancelAnimationFrame(rafId); rafId = null;
      updateUI({ withHistory: true }); // история обновится внутри
    }
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    reset();
    cancelAnimationFrame(rafId); rafId = null;
    updateUI({ withHistory: true });
  });

  // Clear Today
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // При желании локализуй это через t('confirm_clear_today')
      const ok = confirm('Clear today\'s history and reset today\'s time?');
      if (!ok) return;
      cancelAnimationFrame(rafId); rafId = null;
      clearToday();
      updateUI({ withHistory: true });
    });
  }

  // Clear All
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      // При желании локализуй это через t('confirm_clear_all')
      const ok = confirm('Delete ALL history and reset current session?');
      if (!ok) return;
      cancelAnimationFrame(rafId); rafId = null;
      clearAll();
      updateUI({ withHistory: true });
    });
  }

  // Пагинация кнопками
  document.addEventListener('click', (e) => {
    const id = e.target?.id;
    if (id === 'histPrev') historyPrev();
    if (id === 'histNext') historyNext();
  });

  // Листание стрелками
  document.addEventListener('keydown', (e) => {
    const detailsOpen = document.getElementById('histDetails')?.open;
    if (!detailsOpen) return;
    if (e.key === 'ArrowLeft')  historyPrev();
    if (e.key === 'ArrowRight') historyNext();
  });

  // Клик по записи истории -> модалка с отчётом
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

  if (state.current.state === 'running') tick();
}

window.addEventListener('DOMContentLoaded', boot);
