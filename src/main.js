import { state, startOrResume, pause, stop, reset, clearToday, clearAll } from './state/session.js';
import { updateUI, summaryString } from './ui/render.js';
import { modal } from './ui/modal.js';

let rafId = null;

function tick() {
  if (state.current.state !== 'running') return;
  updateUI({ withHistory: false }); // обновляем только цифры/статусы
  rafId = requestAnimationFrame(tick);
}

function boot() {
  modal.init();
  updateUI({ withHistory: true }); // первичный рендер, отрисуем историю

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
      modal.open(summaryString(entry));
      cancelAnimationFrame(rafId); rafId = null;
      updateUI({ withHistory: true });
    }
  });

  // Reset (полный сброс текущей сессии)
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

  // Клик по истории -> открыть модалку с отчётом за выбранную сессию
  const historyRoot = document.getElementById('history');
  historyRoot.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const id = item.dataset.id; // ISO 'from' уникален для записи
    const entry = (state.history || []).find(h => h.from === id);
    if (!entry) return;
    modal.open(summaryString(entry)); // тот же формат, что и при Stop
  });

  if (state.current.state === 'running') tick();
}

window.addEventListener('DOMContentLoaded', boot);
