// Точка входа: загрузка данных, первая отрисовка и обработка всех кликов по data-act.
import { $ } from './utils.js';
import { load, toggleReminder } from './store.js';
import { nav, render, dismissTip } from './views.js';
import {
  close, initOverlay, folderSheet, pickColor, submitFolder, confirmDeleteFolder, performDeleteFolder,
  noteSheet, submitNote, deleteNote, reminderSheet, submitReminder, deleteReminder
} from './sheets.js';
import { registerServiceWorker } from './pwa.js';

const actions = {
  // навигация
  tab: (el) => { nav.tab = el.dataset.v; nav.fid = null; render(); $('#app').scrollTop = 0; },
  'open-folder': (el) => { nav.fid = el.dataset.id; render(); },
  back: () => { nav.fid = null; render(); },
  'close-tip': () => { dismissTip(); render(); },
  compose: () => (nav.tab === 'n' ? noteSheet() : reminderSheet()),

  // разделы
  'new-folder': () => folderSheet(),
  'edit-folder': () => folderSheet(nav.fid),
  'pick-color': (el) => pickColor(el.dataset.c),
  'save-folder': (el) => submitFolder(el.dataset.id),
  'delete-folder': (el) => confirmDeleteFolder(el.dataset.id),
  'confirm-delete-folder': (el) => performDeleteFolder(el.dataset.id),

  // заметки
  'open-note': (el) => noteSheet(el.dataset.id),
  'save-note': (el) => submitNote(el.dataset.id),
  'delete-note': (el) => deleteNote(el.dataset.id),
  'note-from-empty': () => { close(); nav.tab = 'n'; nav.fid = null; render(); noteSheet(); },

  // напоминания
  'open-rem': (el) => reminderSheet(el.dataset.id),
  'toggle-rem': (el) => { toggleReminder(el.dataset.id); render(); },
  'save-reminder': (el) => submitReminder(el.dataset.id),
  'delete-reminder': (el) => deleteReminder(el.dataset.id),

  close
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act]) actions[el.dataset.act](el);
});

load();
initOverlay();
render();
registerServiceWorker();
