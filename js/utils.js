// Вспомогательные функции без побочных эффектов.
export const $ = (selector, root = document) => root.querySelector(selector);
export const uid = () => Math.random().toString(36).slice(2, 9);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ESCAPES[c]);

const pad = (n) => String(n).padStart(2, '0');

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function pluralNotes(n) {
  const m = n % 10, c = n % 100;
  const word = m === 1 && c !== 11 ? 'заметка'
    : m >= 2 && m <= 4 && (c < 10 || c >= 20) ? 'заметки' : 'заметок';
  return `${n} ${word}`;
}

// «Сегодня, 18:30» или «12 окт., 09:00»
export function formatWhen(r) {
  const day = r.date === today()
    ? 'Сегодня'
    : new Date(`${r.date}T00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return r.time ? `${day}, ${r.time}` : day;
}

export function isLate(r) {
  return !r.done && `${r.date} ${r.time || '23:59'}` < `${today()} ${nowTime()}`;
}
