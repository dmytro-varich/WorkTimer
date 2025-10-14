import { fmtHMS, fmtTime, fmtDate } from '../utils/time.js';
import { state, sumIntervals } from '../state/session.js';

const el = (id) => document.getElementById(id);

export function updateUI({ withHistory = false } = {}) {
  const { current, history } = state;

  const ms = sumIntervals(current.intervals ?? []);
  el('display').textContent = fmtHMS(ms);
  el('intervalCount').textContent = (current.intervals?.length ?? 0).toString();

  const map = {
    idle:   { text:'Idle',    color:'#a7aab3', btn:'▶ Play' },
    running:{ text:'Running', color:'#4d79ff', btn:'⏸ Pause' },
    paused: { text:'Paused',  color:'#ffcc66', btn:'▶ Resume' },
    stopped:{ text:'Stopped', color:'#a7aab3', btn:'▶ Play' }
  };
  const st = map[current.state ?? 'idle'];
  el('stateText').textContent = st.text;
  el('stateDot').style.color = st.color;
  el('playPauseBtn').textContent = st.btn;

  const today = fmtDate(new Date());
  const todayMs = (history ?? []).filter(h => h.date === today)
    .reduce((acc, h) => acc + h.totalMs, 0) + (current.day === today ? ms : 0);
  el('todayTotal').textContent = fmtHMS(todayMs);

  if (withHistory) renderHistory();
}

export function renderHistory() {
  const historyEl = el('history');
  const list = (state.history ?? []).slice(-10).reverse();
  if (!list.length) { historyEl.innerHTML = ''; return; }

  const wasOpen = historyEl.querySelector('details')?.open;

  historyEl.innerHTML = `
    <details ${wasOpen ? 'open' : ''}>
      <summary>History (last ${list.length})</summary>
      <div style="margin-top:10px; display:grid; gap:8px;">
        ${list.map(item => {
          const from = fmtTime(new Date(item.from));
          const to   = fmtTime(new Date(item.to));
          return `
            <div class="history-item" data-id="${item.from}"
                 style="display:flex; justify-content:space-between; gap:10px; align-items:center; background:#0b0e15; border:1px solid var(--ring); padding:10px 12px; border-radius:10px; cursor:pointer;">
              <div class="history-item__meta"><strong>${item.date}</strong> — ${from}–${to}</div>
              <div class="badge">${fmtHMS(item.totalMs)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </details>`;
}

export function summaryString(entry){
  const from = fmtTime(new Date(entry.from));
  const to   = fmtTime(new Date(entry.to));
  const total = fmtHMS(entry.totalMs);
  const parts = entry.intervals
    .map((it,i)=>`  ${String(i+1).padStart(2,'0')}) ${fmtTime(new Date(it.start))}–${fmtTime(new Date(it.end))}`)
    .join('\n');
  return `${entry.date} — Worked ${total} (from ${from} to ${to}).\nIntervals:\n${parts}`;
}
