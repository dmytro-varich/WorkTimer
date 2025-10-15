// src/ui/render.js
import { fmtHMS, fmtTime, fmtDate } from '../utils/time.js';
import { state, sumIntervals } from '../state/session.js';
import { t } from '../i18n/lang.js';

const el = (id) => document.getElementById(id);

/* =========================
   Человеческий формат отчёта (i18n)
   ========================= */
function humanDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(t('human_h', h));
  if (m) parts.push(t('human_m', m));
  // показываем секунды только если нет часов и минут (как раньше)
  if (!h && !m) parts.push(t('human_s', sec));
  return parts.join(' ');
}

/**
 * Возвращает { display, full }:
 * - display — с обрезкой интервалов (limit)
 * - full — полный текст (для копирования)
 */
export function summaryHuman(entry, limit = 5) {
  const d = new Date(entry.from);
  const dd = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  const total = humanDuration(entry.totalMs);
  const from = fmtTime(new Date(entry.from));
  const to   = fmtTime(new Date(entry.to));

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

/* =========================
   UI обновление
   ========================= */
export function updateUI({ withHistory = false } = {}) {
  const { current, history } = state;

  const ms = sumIntervals(current.intervals ?? []);
  el('display').textContent = fmtHMS(ms);
  el('intervalCount').textContent = (current.intervals?.length ?? 0).toString();

  const map = {
    idle:   { text: t('idle'),    color:'#a7aab3', btn: t('play')   },
    running:{ text: t('running'), color:'#4d79ff', btn: t('pause')  },
    paused: { text: t('paused'),  color:'#ffcc66', btn: t('resume') },
    stopped:{ text: t('stopped'), color:'#a7aab3', btn: t('play')   }
  };
  const st = map[current.state ?? 'idle'];
  el('stateText').textContent = st.text;
  el('stateDot').style.color = st.color;
  el('playPauseBtn').textContent = st.btn;

  const today = fmtDate(new Date());
  const todayMs = (history ?? []).filter(h => h.date === today)
    .reduce((acc, h) => acc + h.totalMs, 0) + (current.day === today ? ms : 0);
  el('todayTotal').textContent = fmtHMS(todayMs);

  // Если какие-то подписи статичны и идут из JS:
  const todayLabel = el('todayLabel');
  if (todayLabel) todayLabel.textContent = t('today');
  const intervalsLabel = el('intervalsLabel');
  if (intervalsLabel) intervalsLabel.textContent = t('intervals');

  renderCurrentIntervals();
  if (withHistory) renderHistory(); // теперь рендерим details-версию
}

function renderCurrentIntervals() {
  const box = el('intervalList');
  if (!box) return;
  const ints = state.current?.intervals ?? [];
  if (!ints.length) { box.innerHTML = ''; return; }

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

/* =========================
   История: details + пагинация внутри
   ========================= */
// const PAGE_SIZE = 3;
let histPage = 0; // 0 — первая (самые свежие)

function getPageSize(){
  return window.matchMedia('(max-width: 560px)').matches ? 4 : 1;
}

export function renderHistory() {
  const root = document.getElementById('history');
  const all = (state.history ?? []).slice().reverse(); // новые сверху
  const total = all.length;

  if (!root) return;
  if (!total) { root.innerHTML = ''; return; }

  const wasOpen = root.querySelector('details')?.open ?? true;

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
            const to   = fmtTime(new Date(item.to));
            const dateObj = new Date(item.from);
            const dd = `${String(dateObj.getDate()).padStart(2,'0')}.${String(dateObj.getMonth()+1).padStart(2,'0')}.${dateObj.getFullYear()}`;
    
            return `
            <div class="history-item" data-id="${item.from}">
              <div class="history-item__meta"><strong>${dd}</strong> (${from}–${to})</div>
              <div class="badge">${fmtHMS(item.totalMs)}</div>
            </div>
          `;
          }).join('')}
        </div>

        <!-- только нижняя панель -->
        <div class="hist-controls bottom">
          <button id="histPrev" class="ghost" ${histPage<=0?'disabled':''}>${t('prev')}</button>
          <div class="hist-page-indicator">${histPage+1}/${pages}</div>
          <button id="histNext" class="ghost" ${histPage>=pages-1?'disabled':''}>${t('next')}</button>
        </div>
      </div>
    </details>
  `;
}
export function historyPrev() {
  if (histPage > 0) { histPage--; renderHistory(); }
}
export function historyNext() {
  const total = (state.history ?? []).length;
  const pages = Math.max(1, Math.ceil(total / getPageSize()));
  if (histPage < pages - 1) { histPage++; renderHistory(); }
}

/* ===== Совместимость со старым main.js (можно удалить после обновления main.js) ===== */
export function renderHistoryPaged(reset = false) { 
  // просто перерисуем details-версию; reset игнорируем — текущая страница уже сохраняется
  renderHistory(); 
}
export function historyPrevPage(){ historyPrev(); }
export function historyNextPage(){ historyNext(); }

/* ===== Старый текстовый формат (на всякий случай, если где-то используется) ===== */
export function summaryString(entry){
  const from = fmtTime(new Date(entry.from));
  const to   = fmtTime(new Date(entry.to));
  const total = fmtHMS(entry.totalMs);
  const parts = entry.intervals
    .map((it,i)=>`  ${String(i+1).padStart(2,'0')}) ${fmtTime(new Date(it.start))}–${fmtTime(new Date(it.end))}`)
    .join('\n');
  // Локализованный заголовок и "Intervals:"
  return `${t('worked_head', { date: entry.date, total, from, to })}\n${t('intervals_title')}\n${parts}`;
}
