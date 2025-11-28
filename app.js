const storageKey = 'notes-system-data';
let notes = [];
let selectedNoteId = null;
let saveTimeout = null;

const noteListEl = document.getElementById('noteList');
const subjectListEl = document.getElementById('subjectList');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

const titleInput = document.getElementById('noteTitle');
const subjectInput = document.getElementById('noteSubject');
const contentInput = document.getElementById('noteContent');
const createdAtEl = document.getElementById('createdAt');
const updatedAtEl = document.getElementById('updatedAt');

function loadFromStorage() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse notes', err);
  }
  return [];
}

function persistNotes() {
  localStorage.setItem(storageKey, JSON.stringify(notes));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function renderSubjects() {
  subjectListEl.innerHTML = '';
  const subjects = [...new Set(notes.map((n) => n.subject.trim() || 'Untitled'))];

  if (subjects.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No subjects yet';
    empty.classList.add('empty');
    subjectListEl.appendChild(empty);
    return;
  }

  subjects.sort((a, b) => a.localeCompare(b));
  subjects.forEach((subject) => {
    const li = document.createElement('li');
    li.textContent = subject;
    const count = notes.filter((n) => (n.subject.trim() || 'Untitled') === subject).length;
    const meta = document.createElement('span');
    meta.className = 'meta-text';
    meta.textContent = count;
    li.appendChild(meta);
    subjectListEl.appendChild(li);
  });
}

function renderNotes() {
  noteListEl.innerHTML = '';
  if (notes.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No notes yet';
    empty.classList.add('empty');
    noteListEl.appendChild(empty);
    clearEditor();
    return;
  }

  const sorted = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  sorted.forEach((note) => {
    const li = document.createElement('li');
    li.dataset.id = note.id;
    li.classList.toggle('active', note.id === selectedNoteId);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = note.title.trim() || 'Untitled note';

    const meta = document.createElement('div');
    meta.className = 'meta-text';
    meta.textContent = `${note.subject.trim() || 'No subject'} • ${formatDate(note.updatedAt)}`;

    li.appendChild(label);
    li.appendChild(meta);
    li.addEventListener('click', () => selectNote(note.id));
    noteListEl.appendChild(li);
  });
}

function clearEditor() {
  selectedNoteId = null;
  titleInput.value = '';
  subjectInput.value = '';
  contentInput.value = '';
  createdAtEl.textContent = '—';
  updatedAtEl.textContent = '—';
}

function populateEditor(note) {
  selectedNoteId = note.id;
  titleInput.value = note.title;
  subjectInput.value = note.subject;
  contentInput.value = note.content;
  createdAtEl.textContent = formatDate(note.createdAt);
  updatedAtEl.textContent = formatDate(note.updatedAt);
}

function selectNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  clearTimeout(saveTimeout);
  populateEditor(note);
  renderNotes();
}

function createNote() {
  const now = new Date().toISOString();
  const newNote = {
    id: Date.now().toString(),
    title: '',
    subject: 'General',
    content: '',
    createdAt: now,
    updatedAt: now,
  };
  notes.unshift(newNote);
  persistNotes();
  selectNote(newNote.id);
  renderSubjects();
}

function scheduleSave() {
  if (!selectedNoteId) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentNote, 1000);
}

function saveCurrentNote() {
  const note = notes.find((n) => n.id === selectedNoteId);
  if (!note) return;
  note.title = titleInput.value;
  note.subject = subjectInput.value;
  note.content = contentInput.value;
  note.updatedAt = new Date().toISOString();
  updatedAtEl.textContent = formatDate(note.updatedAt);
  persistNotes();
  renderNotes();
  renderSubjects();
}

function deleteNote() {
  if (!selectedNoteId) return;
  const note = notes.find((n) => n.id === selectedNoteId);
  const confirmed = window.confirm(`Delete note "${note.title || 'Untitled note'}"?`);
  if (!confirmed) return;
  notes = notes.filter((n) => n.id !== selectedNoteId);
  persistNotes();
  selectedNoteId = null;
  if (notes.length > 0) {
    selectNote(notes[0].id);
    renderSubjects();
  } else {
    clearEditor();
    renderNotes();
    renderSubjects();
  }
}

function initialize() {
  notes = loadFromStorage();
  renderSubjects();
  renderNotes();
  if (notes.length > 0) {
    selectNote(notes[0].id);
  }
}

newNoteBtn.addEventListener('click', createNote);
deleteNoteBtn.addEventListener('click', deleteNote);
titleInput.addEventListener('input', scheduleSave);
subjectInput.addEventListener('input', scheduleSave);
contentInput.addEventListener('input', scheduleSave);

initialize();
