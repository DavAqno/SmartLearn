const storageKey = 'notes-system-data';
const sessionStorageKey = 'notes-session-data';
let notes = [];
let selectedNoteId = null;
let saveTimeout = null;
let sessions = [];
let activeSession = null;
let timerInterval = null;

const noteListEl = document.getElementById('noteList');
const subjectListEl = document.getElementById('subjectList');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const startSessionBtn = document.getElementById('startSessionBtn');
const pauseSessionBtn = document.getElementById('pauseSessionBtn');
const endSessionBtn = document.getElementById('endSessionBtn');

const titleInput = document.getElementById('noteTitle');
const subjectInput = document.getElementById('noteSubject');
const contentInput = document.getElementById('noteContent');
const createdAtEl = document.getElementById('createdAt');
const updatedAtEl = document.getElementById('updatedAt');
const sessionSubjectInput = document.getElementById('sessionSubject');
const sessionTimerEl = document.getElementById('sessionTimer');
const sessionListEl = document.getElementById('sessionList');

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

function loadSessions() {
  const saved = localStorage.getItem(sessionStorageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse sessions', err);
  }
  return [];
}

function persistNotes() {
  localStorage.setItem(storageKey, JSON.stringify(notes));
}

function persistSessions() {
  localStorage.setItem(sessionStorageKey, JSON.stringify(sessions));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function formatDuration(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
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

function renderSessionHistory() {
  sessionListEl.innerHTML = '';
  if (sessions.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No sessions yet';
    empty.classList.add('empty');
    sessionListEl.appendChild(empty);
    return;
  }

  const sorted = [...sessions].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
  sorted.forEach((session) => {
    const li = document.createElement('li');
    li.classList.add('session-item');

    const title = document.createElement('div');
    title.className = 'label';
    title.textContent = session.subject || 'General';

    const meta = document.createElement('div');
    meta.className = 'session-meta';

    const dateTag = document.createElement('span');
    dateTag.className = 'tag';
    dateTag.textContent = new Date(session.endTime).toLocaleDateString();

    const durationTag = document.createElement('span');
    durationTag.className = 'tag';
    durationTag.textContent = formatDuration(session.durationInSeconds);

    meta.appendChild(dateTag);
    meta.appendChild(durationTag);

    li.appendChild(title);
    li.appendChild(meta);
    sessionListEl.appendChild(li);
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
  if (!sessionSubjectInput.value.trim()) {
    sessionSubjectInput.value = note.subject || 'General';
  }
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

function computeActiveSeconds() {
  if (!activeSession) return 0;
  const base = activeSession.elapsedSeconds || 0;
  if (activeSession.isRunning && activeSession.startTime) {
    const now = Date.now();
    const delta = Math.floor((now - activeSession.startTime) / 1000);
    return base + delta;
  }
  return base;
}

function updateTimerDisplay() {
  if (!activeSession) {
    sessionTimerEl.textContent = '00:00:00';
    return;
  }
  sessionTimerEl.textContent = formatDuration(computeActiveSeconds());
}

function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimerDisplay, 300);
}

function startSession() {
  const subject = sessionSubjectInput.value.trim() || subjectInput.value.trim() || 'General';
  if (activeSession && activeSession.isRunning) return;

  if (activeSession && !activeSession.isRunning) {
    activeSession.subject = subject;
    activeSession.isRunning = true;
    activeSession.startTime = Date.now();
  } else {
    const startTime = Date.now();
    activeSession = {
      id: startTime.toString(),
      subject,
      startedAt: startTime,
      startTime,
      elapsedSeconds: 0,
      isRunning: true,
    };
  }

  sessionSubjectInput.value = subject;
  startTimerLoop();
  updateTimerDisplay();
}

function pauseSession() {
  if (!activeSession || !activeSession.isRunning) return;
  activeSession.elapsedSeconds = computeActiveSeconds();
  activeSession.isRunning = false;
  activeSession.startTime = null;
  updateTimerDisplay();
}

function endSession() {
  if (!activeSession) return;
  const totalSeconds = computeActiveSeconds();
  const now = new Date();
  const sessionRecord = {
    id: activeSession.id,
    subject: activeSession.subject,
    startTime: new Date(activeSession.startedAt).toISOString(),
    endTime: now.toISOString(),
    durationInSeconds: totalSeconds,
  };
  sessions.push(sessionRecord);
  persistSessions();
  renderSessionHistory();
  activeSession = null;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  updateTimerDisplay();
}

function initialize() {
  notes = loadFromStorage();
  sessions = loadSessions();
  renderSubjects();
  renderNotes();
  renderSessionHistory();
  if (notes.length > 0) {
    selectNote(notes[0].id);
  }
  updateTimerDisplay();
}

newNoteBtn.addEventListener('click', createNote);
deleteNoteBtn.addEventListener('click', deleteNote);
titleInput.addEventListener('input', scheduleSave);
subjectInput.addEventListener('input', scheduleSave);
contentInput.addEventListener('input', scheduleSave);
startSessionBtn.addEventListener('click', startSession);
pauseSessionBtn.addEventListener('click', pauseSession);
endSessionBtn.addEventListener('click', endSession);

initialize();
