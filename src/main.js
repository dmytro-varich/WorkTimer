import { state, startOrResume, pause, stop, reset, clearToday, clearAll } from './state/session.js';
import { updateUI, summaryHuman, renderHistory, historyPrev, historyNext } from './ui/render.js';
import { modal } from './ui/modal.js';

let rafId = null;

function tick() {
  if (state.current.state !== 'running') return;
  updateUI({ withHistory: false });
  rafId = requestAnimationFrame(tick);
}

function boot() {
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
      const ok = confirm('Delete ALL history and reset current session?');
      if (!ok) return;
      cancelAnimationFrame(rafId); rafId = null;
      clearAll();
      updateUI({ withHistory: true });
    });
  }

  // Пагинация стрелками внутри выпадающего списка (верх и низ)
  document.addEventListener('click', (e) => {
    const id = e.target?.id;
    if (id === 'histPrev') historyPrev();
    if (id === 'histNext') historyNext();
  });


  // Дополнительно: листание стрелками с клавиатуры
  document.addEventListener('keydown', (e) => {
    const detailsOpen = document.getElementById('histDetails')?.open;
    if (!detailsOpen) return;
    if (e.key === 'ArrowLeft') { historyPrev(); }
    if (e.key === 'ArrowRight') { historyNext(); }
  });

  // Клик по записи истории -> модалка с отчётом
  const historyRoot = document.getElementById('history');
  historyRoot.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const entry = (state.history || []).find(h => h.from === item.dataset.id);
    if (!entry) return;
    const { display, full } = summaryHuman(entry, 5);
    modal.open(display, full);
  });

  if (state.current.state === 'running') tick();
}

window.addEventListener('DOMContentLoaded', boot);
