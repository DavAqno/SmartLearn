const storageKey = 'notes';
const sessionStorageKey = 'studySessions';
const planStorageKey = 'studyPlans';
const legacyNoteKey = 'notes-system-data';
const legacySessionKey = 'notes-session-data';
const legacyPlanKey = 'study-plans-data';
const sidebarStateKey = 'sidebarCollapsed';
let notes = [];
let selectedNoteId = null;
let saveTimeout = null;
let sessions = [];
let activeSession = null;
let timerInterval = null;
let plans = [];
let activePlanId = null;

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
const newPlanBtn = document.getElementById('newPlanBtn');
const savePlanBtn = document.getElementById('savePlanBtn');
const deletePlanBtn = document.getElementById('deletePlanBtn');
const planTitleInput = document.getElementById('planTitle');
const planSubjectInput = document.getElementById('planSubject');
const planDescriptionInput = document.getElementById('planDescription');
const planDeadlineInput = document.getElementById('planDeadline');
const planPriorityInput = document.getElementById('planPriority');
const planCompletedInput = document.getElementById('planCompleted');
const planListEl = document.getElementById('planList');
const planFilterSubject = document.getElementById('planFilterSubject');
const planFilterPriority = document.getElementById('planFilterPriority');
const planFilterStatus = document.getElementById('planFilterStatus');
const globalSearchInput = document.getElementById('globalSearch');
const searchResultsEl = document.getElementById('searchResults');
const appContainer = document.getElementById('appContainer');
const sidebarEl = document.getElementById('sidebar');
const navButtons = {
  'section-notes': document.getElementById('nav-notes'),
  'section-sessions': document.getElementById('nav-sessions'),
  'section-planner': document.getElementById('nav-planner'),
  'section-search': document.getElementById('nav-search'),
  'section-settings': document.getElementById('nav-settings'),
};
const sections = {
  'section-notes': document.getElementById('section-notes'),
  'section-sessions': document.getElementById('section-sessions'),
  'section-planner': document.getElementById('section-planner'),
  'section-search': document.getElementById('section-search'),
  'section-settings': document.getElementById('section-settings'),
};
const toggleSidebarBtn = document.getElementById('toggleSidebar');

function parseArrayFromStorage(key, fallbackKey) {
  const saved = localStorage.getItem(key) || (fallbackKey ? localStorage.getItem(fallbackKey) : null);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error(`Failed to parse data for ${key}`, err);
  }
  return [];
}

function loadFromStorage() {
  return parseArrayFromStorage(storageKey, legacyNoteKey);
}

function loadSessions() {
  return parseArrayFromStorage(sessionStorageKey, legacySessionKey);
}

function loadPlans() {
  return parseArrayFromStorage(planStorageKey, legacyPlanKey);
}

function persistNotes() {
  const payload = JSON.stringify(notes);
  localStorage.setItem(storageKey, payload);
  localStorage.setItem(legacyNoteKey, payload);
}

function persistSessions() {
  const payload = JSON.stringify(sessions);
  localStorage.setItem(sessionStorageKey, payload);
  localStorage.setItem(legacySessionKey, payload);
}

function persistPlans() {
  const payload = JSON.stringify(plans);
  localStorage.setItem(planStorageKey, payload);
  localStorage.setItem(legacyPlanKey, payload);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function showSection(sectionId) {
  Object.entries(sections).forEach(([id, element]) => {
    element.style.display = id === sectionId ? 'block' : 'none';
  });

  Object.entries(navButtons).forEach(([id, btn]) => {
    btn.classList.toggle('active', id === sectionId);
  });
}

function applySidebarState(collapsed) {
  if (collapsed) {
    appContainer.classList.add('collapsed');
    sidebarEl.classList.add('collapsed');
  } else {
    appContainer.classList.remove('collapsed');
    sidebarEl.classList.remove('collapsed');
  }
  localStorage.setItem(sidebarStateKey, JSON.stringify(collapsed));
}

function loadSidebarState() {
  const saved = localStorage.getItem(sidebarStateKey);
  if (!saved) return false;
  try {
    return JSON.parse(saved);
  } catch (err) {
    return false;
  }
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

function renderPlanFilters() {
  const current = planFilterSubject.value || 'all';
  const uniqueSubjects = [...new Set(plans.map((plan) => plan.subject?.trim() || 'General'))].sort((a, b) =>
    a.localeCompare(b)
  );

  planFilterSubject.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All';
  planFilterSubject.appendChild(allOption);

  uniqueSubjects.forEach((subject) => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    planFilterSubject.appendChild(option);
  });

  if ([...planFilterSubject.options].some((opt) => opt.value === current)) {
    planFilterSubject.value = current;
  }
}

function resetPlanForm() {
  activePlanId = null;
  planTitleInput.value = '';
  planSubjectInput.value = '';
  planDescriptionInput.value = '';
  planDeadlineInput.value = '';
  planPriorityInput.value = 'medium';
  planCompletedInput.checked = false;
  deletePlanBtn.disabled = true;
}

function populatePlanForm(plan) {
  activePlanId = plan.id;
  planTitleInput.value = plan.title || '';
  planSubjectInput.value = plan.subject || '';
  planDescriptionInput.value = plan.description || '';
  planDeadlineInput.value = plan.deadline || '';
  planPriorityInput.value = plan.priority || 'medium';
  planCompletedInput.checked = Boolean(plan.completed);
  deletePlanBtn.disabled = false;
}

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return date.toLocaleDateString();
}

function renderPlans() {
  planListEl.innerHTML = '';

  const subjectFilter = planFilterSubject.value || 'all';
  const priorityFilter = planFilterPriority.value || 'all';
  const statusFilter = planFilterStatus.value || 'all';

  const filtered = plans
    .filter((plan) => {
      const subjectMatch =
        subjectFilter === 'all' || (plan.subject?.trim() || 'General').toLowerCase() === subjectFilter.toLowerCase();
      const priorityMatch = priorityFilter === 'all' || plan.priority === priorityFilter;
      const statusMatch =
        statusFilter === 'all' || (statusFilter === 'completed' ? plan.completed : !plan.completed);
      return subjectMatch && priorityMatch && statusMatch;
    })
    .sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (deadlineA !== deadlineB) return deadlineA - deadlineB;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.title || '').localeCompare(b.title || '');
    });

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = plans.length === 0 ? 'No plans yet' : 'No plans match the filters';
    empty.classList.add('empty');
    planListEl.appendChild(empty);
    return;
  }

  filtered.forEach((plan) => {
    const li = document.createElement('li');

    const titleRow = document.createElement('div');
    titleRow.className = 'plan-title';
    const statusDot = document.createElement('span');
    statusDot.className = `status-dot ${plan.completed ? 'completed' : 'pending'}`;
    const titleText = document.createElement('span');
    titleText.textContent = plan.title?.trim() || 'Untitled plan';
    titleRow.appendChild(statusDot);
    titleRow.appendChild(titleText);

    const description = document.createElement('div');
    description.className = 'muted';
    description.textContent = plan.description?.trim() || 'No description yet';

    const meta = document.createElement('div');
    meta.className = 'plan-meta';

    const subjectTag = document.createElement('span');
    subjectTag.className = 'pill';
    subjectTag.textContent = plan.subject?.trim() || 'General';

    const priorityTag = document.createElement('span');
    priorityTag.className = `pill ${plan.priority || 'medium'}`;
    priorityTag.textContent = `${(plan.priority || 'medium').charAt(0).toUpperCase()}${(plan.priority || 'medium').slice(1)}`;

    const deadlineTag = document.createElement('span');
    deadlineTag.className = 'pill';
    deadlineTag.textContent = `Due: ${formatDeadline(plan.deadline)}`;

    const statusTag = document.createElement('span');
    statusTag.className = 'pill';
    statusTag.textContent = plan.completed ? 'Completed' : 'Active';

    meta.appendChild(subjectTag);
    meta.appendChild(priorityTag);
    meta.appendChild(deadlineTag);
    meta.appendChild(statusTag);

    const actions = document.createElement('div');
    actions.className = 'plan-actions';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'secondary-btn';
    completeBtn.textContent = plan.completed ? 'Mark Active' : 'Mark Completed';
    completeBtn.addEventListener('click', () => togglePlanCompletion(plan.id));

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => populatePlanForm(plan));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePlan(plan.id));

    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(titleRow);
    li.appendChild(description);
    li.appendChild(meta);
    li.appendChild(actions);
    planListEl.appendChild(li);
  });
}

function togglePlanCompletion(planId) {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.completed = !plan.completed;
  if (plan.id === activePlanId) {
    planCompletedInput.checked = plan.completed;
  }
  persistPlans();
  renderPlans();
}

function savePlan() {
  const payload = {
    id: activePlanId || Date.now().toString(),
    title: planTitleInput.value.trim() || 'Untitled plan',
    subject: planSubjectInput.value.trim() || 'General',
    description: planDescriptionInput.value.trim(),
    deadline: planDeadlineInput.value,
    priority: planPriorityInput.value || 'medium',
    completed: planCompletedInput.checked,
  };

  const existingIndex = plans.findIndex((p) => p.id === activePlanId);
  if (existingIndex >= 0) {
    plans[existingIndex] = { ...plans[existingIndex], ...payload };
  } else {
    plans.push(payload);
  }

  activePlanId = payload.id;
  deletePlanBtn.disabled = false;
  persistPlans();
  renderPlanFilters();
  renderPlans();
}

function deletePlan(id) {
  const targetId = id || activePlanId;
  if (!targetId) return;
  const plan = plans.find((p) => p.id === targetId);
  if (!plan) return;
  const confirmed = window.confirm(`Delete plan "${plan.title || 'Untitled plan'}"?`);
  if (!confirmed) return;
  plans = plans.filter((p) => p.id !== targetId);
  if (targetId === activePlanId) {
    resetPlanForm();
  }
  persistPlans();
  renderPlanFilters();
  renderPlans();
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

function formatDateOnly(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().slice(0, 10);
}

function buildSnippet(text, query) {
  const safeText = text || '';
  const lowerText = safeText.toLowerCase();
  const idx = lowerText.indexOf(query);
  if (idx === -1) {
    return safeText.slice(0, 100);
  }
  const start = Math.max(0, idx - 20);
  return safeText.slice(start, start + 100);
}

function renderSearchResults(items, query) {
  searchResultsEl.innerHTML = '';
  if (!query) return;

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-result';
    empty.textContent = 'No matches found';
    searchResultsEl.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const block = document.createElement('div');
    block.className = 'search-result';

    const meta = document.createElement('div');
    meta.className = 'result-meta';
    const typeLabel = document.createElement('span');
    typeLabel.className = 'result-type';
    typeLabel.textContent = item.type;
    const dateLabel = document.createElement('span');
    dateLabel.textContent = formatDateOnly(item.date);
    meta.appendChild(typeLabel);
    meta.appendChild(dateLabel);

    const title = document.createElement('div');
    title.className = 'result-title';
    title.textContent = item.title || 'Untitled';

    const snippet = document.createElement('div');
    snippet.className = 'result-snippet';
    snippet.textContent = buildSnippet(item.snippetText, query);

    block.appendChild(meta);
    block.appendChild(title);
    block.appendChild(snippet);
    searchResultsEl.appendChild(block);
  });
}

function handleGlobalSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  if (!query) {
    searchResultsEl.innerHTML = '';
    return;
  }

  const noteData = parseArrayFromStorage(storageKey, legacyNoteKey);
  const planData = parseArrayFromStorage(planStorageKey, legacyPlanKey);
  const sessionData = parseArrayFromStorage(sessionStorageKey, legacySessionKey);

  const results = [];

  noteData.forEach((note) => {
    const searchable = `${note.title || ''} ${note.subject || ''} ${note.content || ''}`.toLowerCase();
    if (searchable.includes(query)) {
      results.push({
        type: 'NOTE',
        title: note.title || 'Untitled note',
        snippetText: note.content || note.title || '',
        date: note.updatedAt || note.createdAt || note.id,
      });
    }
  });

  planData.forEach((plan) => {
    const searchable = `${plan.title || ''} ${plan.subject || ''} ${plan.description || ''}`.toLowerCase();
    if (searchable.includes(query)) {
      results.push({
        type: 'PLAN',
        title: plan.title || 'Untitled plan',
        snippetText: plan.description || plan.title || '',
        date: plan.deadline || plan.updatedAt || plan.id,
      });
    }
  });

  sessionData.forEach((session) => {
    const searchable = `${session.subject || ''} ${session.title || ''}`.toLowerCase();
    if (searchable.includes(query)) {
      results.push({
        type: 'SESSION',
        title: session.subject || session.title || 'Session',
        snippetText: session.subject || session.title || '',
        date: session.endTime || session.startTime || session.id,
      });
    }
  });

  results.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
  });

  renderSearchResults(results, query);
}

function initialize() {
  notes = loadFromStorage();
  sessions = loadSessions();
  plans = loadPlans();
  applySidebarState(loadSidebarState());
  renderSubjects();
  renderNotes();
  renderSessionHistory();
  renderPlanFilters();
  renderPlans();
  resetPlanForm();
  if (notes.length > 0) {
    selectNote(notes[0].id);
  }
  updateTimerDisplay();
  showSection('section-notes');
}

newNoteBtn.addEventListener('click', createNote);
deleteNoteBtn.addEventListener('click', deleteNote);
titleInput.addEventListener('input', scheduleSave);
subjectInput.addEventListener('input', scheduleSave);
contentInput.addEventListener('input', scheduleSave);
startSessionBtn.addEventListener('click', startSession);
pauseSessionBtn.addEventListener('click', pauseSession);
endSessionBtn.addEventListener('click', endSession);
newPlanBtn.addEventListener('click', resetPlanForm);
savePlanBtn.addEventListener('click', savePlan);
deletePlanBtn.addEventListener('click', () => deletePlan());
planFilterSubject.addEventListener('change', renderPlans);
planFilterPriority.addEventListener('change', renderPlans);
planFilterStatus.addEventListener('change', renderPlans);
globalSearchInput.addEventListener('input', handleGlobalSearch);
toggleSidebarBtn.addEventListener('click', () => applySidebarState(!appContainer.classList.contains('collapsed')));
navButtons['section-notes'].addEventListener('click', () => showSection('section-notes'));
navButtons['section-sessions'].addEventListener('click', () => showSection('section-sessions'));
navButtons['section-planner'].addEventListener('click', () => showSection('section-planner'));
navButtons['section-search'].addEventListener('click', () => showSection('section-search'));
navButtons['section-settings'].addEventListener('click', () => showSection('section-settings'));

initialize();
