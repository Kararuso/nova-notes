// Всплывающие окна: разделы, заметки, напоминания, подтверждение удаления.
import { $, esc, today } from './utils.js';
import { PALETTE } from './config.js';
import {
  state, getFolder, getNote, getReminder, reminderOf,
  saveFolder, removeFolder, saveNote, removeNote, saveReminder, removeReminder
} from './store.js';
import { nav, render, emptyState } from './views.js';

const overlay = $('#ov');
const sheet = $('#sheet');
let pickedColor = PALETTE[0];

export function open(html, full = false) {
  sheet.className = 'sheet' + (full ? ' full' : '');
  sheet.innerHTML = html;
  overlay.classList.add('on');
}
export const close = () => overlay.classList.remove('on');

// Закрываем по клику на фон, только если и нажатие, и отпускание были на фоне
// (иначе выделение текста мышью за пределы окна закрывало бы его).
export function initOverlay() {
  let pressedOnBackdrop = false;
  overlay.addEventListener('pointerdown', (e) => { pressedOnBackdrop = e.target === overlay; });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && pressedOnBackdrop) close();
    pressedOnBackdrop = false;
  });
}

const header = (title, saveAct, id = '') => `<div class="sh">
  <button class="btn" data-act="close">Отмена</button><h2>${title}</h2>
  <button class="btn" data-act="${saveAct}" data-id="${id}">Готово</button></div>`;

const deleteBtn = (act, id, label) => `<button class="btn del" data-act="${act}" data-id="${id}">${label}</button>`;

// ---------- Раздел ----------
export function folderSheet(id) {
  const folder = getFolder(id);
  pickedColor = folder ? folder.color : PALETTE[state.fo.length % PALETTE.length];
  const colors = PALETTE.map((c) =>
    `<div class="col ${c === pickedColor ? 'on' : ''}" style="--c:${c}" data-act="pick-color" data-c="${c}"></div>`).join('');
  open(`${header(folder ? 'Раздел' : 'Новый раздел', 'save-folder', id)}
    <input id="fn" placeholder="Название" value="${esc(folder && folder.name)}">
    <div class="cols">${colors}</div>
    ${folder ? deleteBtn('delete-folder', id, 'Удалить раздел') : ''}`);
}

export function pickColor(color) {
  pickedColor = color;
  document.querySelectorAll('.col').forEach((el) => el.classList.toggle('on', el.dataset.c === color));
}

export function submitFolder(id) {
  const name = $('#fn').value.trim();
  if (!name) return;
  saveFolder({ id, name, color: pickedColor });
  close(); render();
}

export function confirmDeleteFolder(id) {
  const folder = getFolder(id);
  const count = state.no.filter((n) => n.fid === id).length;
  open(`<div class="sh"><span></span><h2>Удалить раздел?</h2><span></span></div>
    <div class="empty" style="padding:8px 8px 22px">Раздел «${esc(folder && folder.name)}»${count ? ` и все его заметки (${count}) будут удалены` : ' будет удалён'} без возможности восстановления.</div>
    <button class="dg" data-act="confirm-delete-folder" data-id="${id}">Удалить</button>
    <button class="btn del" style="color:var(--acd)" data-act="close">Отмена</button>`);
}

export function performDeleteFolder(id) {
  removeFolder(id);
  nav.fid = null;
  close(); render();
}

// ---------- Заметка ----------
export function noteSheet(id) {
  const note = getNote(id), rem = note && reminderOf(id);
  const current = note ? note.fid : (getFolder(nav.fid) ? nav.fid : state.fo[0].id);
  const options = state.fo.map((f) =>
    `<option value="${f.id}" ${f.id === current ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  open(`${header(note ? 'Заметка' : 'Новая заметка', 'save-note', id)}
    <input id="nt" placeholder="Заголовок" value="${esc(note && note.title)}">
    <div class="tw"><textarea id="nx" placeholder="Текст заметки">${esc(note && note.text)}</textarea><i class="sb"><b></b></i></div>
    <select id="nf">${options}</select>
    <div class="hint">Напоминание (необязательно)</div>
    <div class="two"><input id="nd" type="date" value="${rem ? rem.date : ''}"><input id="nm" type="time" value="${rem ? rem.time || '' : ''}"></div>
    ${note ? deleteBtn('delete-note', id, 'Удалить заметку') : ''}`, true);
  initScrollbar();
}

export function submitNote(id) {
  const title = $('#nt').value.trim(), text = $('#nx').value.trim();
  if (!title && !text) return;
  const date = $('#nd').value;
  saveNote({ id, title, text, fid: $('#nf').value }, date ? { date, time: $('#nm').value } : null);
  close(); render();
}

export function deleteNote(id) { removeNote(id); close(); render(); }

// Свой ползунок для текстового поля (системный скрыт в CSS).
function initScrollbar() {
  const area = $('#nx'), bar = $('.sb');
  if (!area || !bar) return;
  const thumb = bar.firstElementChild;
  const update = () => {
    const view = area.clientHeight, full = area.scrollHeight;
    if (full <= view + 2) { bar.style.opacity = 0; return; }
    const h = Math.max(40, (bar.clientHeight * view) / full);
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${(area.scrollTop / (full - view)) * (bar.clientHeight - h)}px)`;
    bar.style.opacity = 1;
  };
  area.addEventListener('scroll', update);
  area.addEventListener('input', update);
  setTimeout(update, 60);
}

// ---------- Напоминание ----------
export function reminderSheet(id) {
  if (!state.no.length) {
    open(`<div class="sh"><span></span><h2>Напоминание</h2><button class="btn" data-act="close">Закрыть</button></div>
      ${emptyState('Сначала создайте заметку —<br>напоминание привязывается к ней')}
      <button class="btn del" style="color:var(--acd)" data-act="note-from-empty">Создать заметку</button>`);
    return;
  }
  const rem = getReminder(id);
  const options = state.no.map((n) => {
    const folder = getFolder(n.fid);
    const label = n.title || (n.text || '').slice(0, 30) || 'Без названия';
    return `<option value="${n.id}" ${rem && rem.noteId === n.id ? 'selected' : ''}>${esc(folder ? folder.name : '')} · ${esc(label)}</option>`;
  }).join('');
  open(`${header(rem ? 'Напоминание' : 'Новое напоминание', 'save-reminder', id)}
    <div class="hint">Заметка</div><select id="rn">${options}</select>
    <div class="hint">Дата и время</div>
    <div class="two"><input id="rd" type="date" value="${rem ? rem.date : today()}"><input id="rm" type="time" value="${rem ? rem.time || '' : ''}"></div>
    ${rem ? deleteBtn('delete-reminder', id, 'Удалить напоминание') : ''}`);
}

export function submitReminder(id) {
  const date = $('#rd').value;
  if (!date) return;
  saveReminder({ id, noteId: $('#rn').value, date, time: $('#rm').value });
  close(); render();
}

export function deleteReminder(id) { removeReminder(id); close(); render(); }
