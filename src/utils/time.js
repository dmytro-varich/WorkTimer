export const pad = n => String(n).padStart(2,'0');

export const fmtHMS = (ms) => {
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const fmtDate = (d) => d.toISOString().slice(0,10); // YYYY-MM-DD
