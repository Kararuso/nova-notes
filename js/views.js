// Отрисовка основных экранов. Все действия помечены атрибутами data-act (см. main.js).
import { $, esc, pluralNotes, formatWhen, isLate } from './utils.js';
import { TIP_KEY, PALETTE } from './config.js';
import { state, getFolder, getNote, reminderOf, notesIn } from './store.js';
import { FOLDER_ICON, NOTE_ICON } from './icons.js';
import { isIosBrowser } from './pwa.js';

// Состояние навигации: вкладка ('n' — заметки, 'r' — напоминания) и открытый раздел.
export const nav = { tab: 'n', fid: null, tipOff: false };
try { nav.tipOff = !!localStorage.getItem(TIP_KEY); } catch { /* ignore */ }

export function dismissTip() {
  nav.tipOff = true;
  try { localStorage.setItem(TIP_KEY, '1'); } catch { /* ignore */ }
}

export const emptyState = (text) => `<div class="empty"><i>${NOTE_ICON}</i>${text}</div>`;

const colorOf = (folder) => (folder ? folder.color : PALETTE[0]);
const chip = (r) => `<span class="chip ${isLate(r) ? 'late' : ''}">${formatWhen(r)}</span>`;

function noteCard(note, showFolder) {
  const rem = reminderOf(note.id), folder = getFolder(note.fid);
  const meta = (showFolder && folder ? `${folder.name} · ` : '') + (note.text || 'Нет текста');
  return `<div class="card mk" style="--c:${colorOf(folder)}" data-act="open-note" data-id="${note.id}">
    <div class="n">${esc(note.title || 'Без названия')}<div class="sn">${esc(meta)}</div>${rem ? chip(rem) : ''}</div></div>`;
}

function homeView() {
  const tip = isIosBrowser && !nav.tipOff
    ? `<div class="tip"><div><b>Установите как приложение.</b> Нажмите «Поделиться» в Safari и выберите «На экран „Домой“».</div>
       <button class="x" data-act="close-tip" aria-label="Закрыть">✕</button></div>` : '';
  const folders = state.fo.map((f) => `
    <div class="card" style="--c:${f.color}" data-act="open-folder" data-id="${f.id}">
      <i class="bd">${FOLDER_ICON}</i><div class="n">${esc(f.name)}</div>
      <span class="cnt">${notesIn(f.id).length}</span><span class="ch">›</span></div>`).join('');
  return `<div class="top"><span></span><button class="btn" data-act="new-folder">Новый раздел</button></div>
    <h1>Заметки</h1><div class="sub">${pluralNotes(state.no.length)}</div>${tip}
    <div class="card" style="--c:#7C83FD" data-act="open-folder" data-id="all">
      <i class="bd">${NOTE_ICON}</i><div class="n">Все заметки</div>
      <span class="cnt">${state.no.length}</span><span class="ch">›</span></div>
    <div class="lbl">Разделы</div>${folders}`;
}

function folderView() {
  const folder = getFolder(nav.fid), list = notesIn(nav.fid);
  return `<div class="top"><button class="btn" data-act="back">‹ Разделы</button>
    ${folder ? '<button class="btn" data-act="edit-folder">Изменить</button>' : ''}</div>
    <h1>${folder ? esc(folder.name) : 'Все заметки'}</h1><div class="sub">${pluralNotes(list.length)}</div>
    ${list.length ? list.map((n) => noteCard(n, nav.fid === 'all')).join('')
      : emptyState('Здесь пока пусто.<br>Нажмите «+», чтобы создать заметку')}`;
}

function remindersView() {
  const list = [...state.re].sort((a, b) =>
    (a.done - b.done) || `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const cards = list.map((r) => {
    const note = getNote(r.noteId);
    if (!note) return '';
    const folder = getFolder(note.fid);
    return `<div class="card ${r.done ? 'done' : ''}" style="--c:${colorOf(folder)}">
      <div class="chk" data-act="toggle-rem" data-id="${r.id}">${r.done ? '✓' : ''}</div>
      <div class="n" data-act="open-rem" data-id="${r.id}">${esc(note.title || 'Без названия')}
        <div class="sn">${esc(note.text || '')}</div>${chip(r)}</div></div>`;
  }).join('');
  return `<div class="top"><span></span><span></span></div><h1>Напоминания</h1>
    <div class="sub">${state.re.filter((r) => !r.done).length} активных · ${state.re.filter(isLate).length} просрочено</div>
    ${cards || emptyState('Нет напоминаний.<br>Нажмите «+» и выберите заметку')}`;
}

export function render() {
  $('#t1').classList.toggle('on', nav.tab === 'n');
  $('#t2').classList.toggle('on', nav.tab === 'r');
  $('#main').innerHTML = nav.tab === 'r' ? remindersView() : nav.fid ? folderView() : homeView();
}
