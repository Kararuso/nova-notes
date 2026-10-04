// Данные и работа с localStorage. Формат хранения: { fo: разделы, no: заметки, re: напоминания }.
import { STORAGE_KEY, DEFAULT_FOLDER } from './config.js';
import { uid } from './utils.js';

export const state = { fo: [{ ...DEFAULT_FOLDER }], no: [], re: [] };

export function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.fo) {
      state.fo = data.fo;
      state.no = data.no || [];
      state.re = data.re || [];
    }
  } catch { /* повреждённые данные игнорируем */ }
}

export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* хранилище недоступно */ }
}

export const getFolder = (id) => state.fo.find((f) => f.id === id);
export const getNote = (id) => state.no.find((n) => n.id === id);
export const getReminder = (id) => state.re.find((r) => r.id === id);
export const reminderOf = (noteId) => state.re.find((r) => r.noteId === noteId);
export const notesIn = (fid) => (fid === 'all' ? state.no : state.no.filter((n) => n.fid === fid));

// ---- Разделы ----
export function saveFolder({ id, name, color }) {
  const folder = getFolder(id);
  if (folder) Object.assign(folder, { name, color });
  else state.fo.push({ id: uid(), name, color });
  save();
}

export function removeFolder(id) {
  const noteIds = state.no.filter((n) => n.fid === id).map((n) => n.id);
  state.no = state.no.filter((n) => n.fid !== id);
  state.re = state.re.filter((r) => !noteIds.includes(r.noteId));
  state.fo = state.fo.filter((f) => f.id !== id);
  if (!state.fo.length) state.fo.push({ ...DEFAULT_FOLDER, id: uid() });
  save();
}

// ---- Заметки (напоминание необязательно: when = { date, time } или null) ----
export function saveNote({ id, title, text, fid }, when) {
  let note = getNote(id);
  if (note) Object.assign(note, { title, text, fid });
  else { note = { id: uid(), title, text, fid }; state.no.unshift(note); }

  const rem = reminderOf(note.id);
  if (when && when.date) {
    if (rem) Object.assign(rem, { date: when.date, time: when.time });
    else state.re.push({ id: uid(), noteId: note.id, date: when.date, time: when.time, done: false });
  } else if (rem) {
    state.re = state.re.filter((r) => r !== rem);
  }
  save();
}

export function removeNote(id) {
  state.no = state.no.filter((n) => n.id !== id);
  state.re = state.re.filter((r) => r.noteId !== id);
  save();
}

// ---- Напоминания (у одной заметки не больше одного) ----
export function saveReminder({ id, noteId, date, time }) {
  const rem = getReminder(id) || reminderOf(noteId);
  if (rem) Object.assign(rem, { noteId, date, time });
  else state.re.push({ id: uid(), noteId, date, time, done: false });
  state.re = state.re.filter((r, i, a) => a.findIndex((x) => x.noteId === r.noteId) === i);
  save();
}

export function toggleReminder(id) {
  const rem = getReminder(id);
  if (rem) { rem.done = !rem.done; save(); }
}

export function removeReminder(id) {
  state.re = state.re.filter((r) => r.id !== id);
  save();
}
