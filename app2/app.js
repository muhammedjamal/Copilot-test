const storageKey = 'keepwell-notes-v1';
const defaultNotes = [
  { id: 1, title: 'Weekend reset', content: '', items: [{ text: 'Book a long walk', done: true }, { text: 'Pick up flowers', done: false }, { text: 'Try the new ramen place', done: false }], label: 'Personal', pinned: true, archived: false, trashed: false, created: 'Today' },
  { id: 2, title: 'Things worth exploring', content: 'A tiny list of places and ideas that made me pause this week.', items: [], label: 'Ideas', pinned: false, archived: false, trashed: false, created: 'Yesterday' },
  { id: 3, title: 'Q3 planning', content: 'Keep the next quarter focused: fewer projects, deeper work, better handoffs.', items: [], label: 'Work', pinned: false, archived: false, trashed: false, created: 'Sep 10' },
  { id: 4, title: 'Read later', content: 'The best ideas usually arrive when there is enough quiet to notice them.', items: [], label: '', pinned: false, archived: false, trashed: false, created: 'Sep 08' },
  { id: 5, title: 'Grocery run', content: '', items: [{ text: 'Oat milk', done: false }, { text: 'Basil and lemons', done: false }, { text: 'Dark chocolate', done: true }], label: 'Personal', pinned: false, archived: false, trashed: false, created: 'Sep 06' }
];

let notes = loadNotes();
let currentView = 'notes';
let currentFilter = 'all';
let selectedLabel = '';
let composerPinned = false;
let composerChecklist = false;
let toastTimer;

const els = {
  board: document.querySelector('#notes-board'),
  empty: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyCopy: document.querySelector('#empty-copy'),
  search: document.querySelector('#search-input'),
  composer: document.querySelector('#composer-form'),
  title: document.querySelector('#note-title'),
  content: document.querySelector('#note-content'),
  label: document.querySelector('#note-label'),
  checklistEditor: document.querySelector('#checklist-editor'),
  composerPin: document.querySelector('#composer-pin'),
  notesCount: document.querySelector('#notes-count'),
  resultCount: document.querySelector('#result-count'),
  pageTitle: document.querySelector('#page-title'),
  viewKicker: document.querySelector('#view-kicker'),
  labels: document.querySelector('#labels-list'),
  toast: document.querySelector('#toast')
};

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || defaultNotes; } catch { return defaultNotes; }
}
function saveNotes() { localStorage.setItem(storageKey, JSON.stringify(notes)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add('show'); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200); }
function labelClass(label) { return label.toLowerCase(); }
function visibleNotes() {
  const query = els.search.value.trim().toLowerCase();
  return notes.filter((note) => {
    if (currentView === 'archive' && (!note.archived || note.trashed)) return false;
    if (currentView === 'trash' && !note.trashed) return false;
    if (currentView === 'notes' && (note.archived || note.trashed)) return false;
    if (currentView === 'reminders' && (!note.items.length || note.items.every((item) => item.done) || note.archived || note.trashed)) return false;
    if (selectedLabel && note.label !== selectedLabel) return false;
    if (currentFilter === 'pinned' && !note.pinned) return false;
    if (currentFilter === 'label' && !note.label) return false;
    return !query || `${note.title} ${note.content} ${note.label}`.toLowerCase().includes(query);
  });
}
function noteMarkup(note) {
  const checklist = note.items.length ? `<div class="note-checklist">${note.items.map((item, index) => `<label class="check-row ${item.done ? 'done' : ''}"><input type="checkbox" data-check-id="${note.id}" data-check-index="${index}" ${item.done ? 'checked' : ''}><span>${escapeHtml(item.text)}</span></label>`).join('')}</div>` : '';
  const content = note.content ? `<p class="note-content">${escapeHtml(note.content)}</p>` : '';
  const label = note.label ? `<span class="note-label ${labelClass(note.label)}">${escapeHtml(note.label)}</span>` : '';
  const archiveLabel = note.archived ? 'Restore' : 'Archive';
  const trashLabel = note.trashed ? 'Restore' : 'Delete';
  return `<article class="note-card ${note.pinned ? 'pinned' : ''}" data-color="${note.id % 3 === 0 ? 'blue' : note.id % 2 === 0 ? 'yellow' : 'coral'}"><div class="note-inner">${note.pinned ? '<span class="note-pin" aria-label="Pinned">★</span>' : ''}<h2 class="note-title">${escapeHtml(note.title || 'Untitled note')}</h2>${content}${checklist}<div class="note-meta">${label}<span class="note-date">${escapeHtml(note.created)}</span></div></div><div class="note-actions"><button class="note-action" data-action="pin" data-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin'}">${note.pinned ? 'Unpin' : 'Pin'}</button><button class="note-action" data-action="archive" data-id="${note.id}">${archiveLabel}</button><button class="note-action" data-action="trash" data-id="${note.id}">${trashLabel}</button></div></article>`;
}
function render() {
  const shown = visibleNotes();
  els.board.innerHTML = shown.map(noteMarkup).join('');
  els.notesCount.textContent = notes.filter((note) => !note.archived && !note.trashed).length;
  els.resultCount.textContent = `${shown.length} ${shown.length === 1 ? 'note' : 'notes'}`;
  els.empty.hidden = shown.length > 0;
  els.emptyTitle.textContent = currentView === 'trash' ? 'Trash is empty' : currentView === 'archive' ? 'Nothing archived' : 'Nothing here yet';
  els.emptyCopy.textContent = currentView === 'notes' ? 'Capture a thought, make a list, or save an idea for later.' : 'The quiet is a feature. You can always add something new.';
  renderLabels();
}
function renderLabels() {
  const labels = [...new Set(notes.map((note) => note.label).filter(Boolean))];
  els.labels.innerHTML = labels.map((label) => `<button class="label-link" data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('') || '<span style="color:#aeb6ba;font-size:.7rem">No labels yet</span>';
}
function setView(view) {
  currentView = view; selectedLabel = ''; currentFilter = 'all';
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  const titles = { notes: 'Notes', reminders: 'Reminders', archive: 'Archive', trash: 'Trash' };
  els.pageTitle.textContent = titles[view]; els.viewKicker.textContent = titles[view].toUpperCase();
  document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === 'all'));
  render();
}
function resetComposer() { els.composer.reset(); composerPinned = false; composerChecklist = false; els.composerPin.textContent = '☆'; els.composerPin.classList.remove('selected'); els.checklistEditor.hidden = true; els.checklistEditor.innerHTML = ''; }
function saveComposer(event) {
  event.preventDefault();
  const title = els.title.value.trim(); const content = els.content.value.trim();
  const items = [...els.checklistEditor.querySelectorAll('input[type=text]')].map((input) => input.value.trim()).filter(Boolean).map((text) => ({ text, done: false }));
  if (!title && !content && !items.length) { showToast('Add a title, thought, or checklist item first'); els.title.focus(); return; }
  notes.unshift({ id: Date.now(), title: title || 'Untitled note', content, items, label: els.label.value, pinned: composerPinned, archived: false, trashed: false, created: 'Just now' });
  saveNotes(); resetComposer(); render(); showToast('Note saved');
}
function toggleComposerChecklist() {
  composerChecklist = !composerChecklist; els.checklistEditor.hidden = !composerChecklist;
  if (composerChecklist && !els.checklistEditor.children.length) addChecklistInput();
}
function addChecklistInput() { const row = document.createElement('div'); row.className = 'check-item'; row.innerHTML = '<span>□</span><input type="text" placeholder="List item"><button type="button" aria-label="Remove item">×</button>'; row.querySelector('button').addEventListener('click', () => row.remove()); els.checklistEditor.append(row); }
function mutateNote(id, action) {
  const note = notes.find((item) => item.id === id); if (!note) return;
  if (action === 'pin') note.pinned = !note.pinned;
  if (action === 'archive') { note.archived = !note.archived; note.trashed = false; }
  if (action === 'trash') { note.trashed = !note.trashed; note.archived = false; }
  saveNotes(); render(); showToast(action === 'pin' ? (note.pinned ? 'Pinned note' : 'Unpinned note') : action === 'trash' ? (note.trashed ? 'Moved to trash' : 'Restored note') : (note.archived ? 'Archived note' : 'Restored note'));
}

els.composer.addEventListener('submit', saveComposer);
els.composerPin.addEventListener('click', () => { composerPinned = !composerPinned; els.composerPin.textContent = composerPinned ? '★' : '☆'; els.composerPin.classList.toggle('selected', composerPinned); });
document.querySelector('#checklist-toggle').addEventListener('click', toggleComposerChecklist);
document.querySelector('#focus-composer').addEventListener('click', () => els.title.focus());
els.search.addEventListener('input', render);
document.querySelector('#refresh-button').addEventListener('click', () => { notes = loadNotes(); render(); showToast('Notes refreshed'); });
document.querySelector('#view-button').addEventListener('click', () => { els.board.classList.toggle('compact'); showToast(els.board.classList.contains('compact') ? 'Compact view' : 'Comfortable view'); });
document.querySelector('#menu-button').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
document.querySelector('#add-label-button').addEventListener('click', () => {
  const label = prompt('Name your new label')?.trim();
  if (!label) return;
  const exists = [...els.label.options].some((option) => option.value.toLowerCase() === label.toLowerCase());
  if (exists) { els.label.value = label; showToast('That label already exists'); return; }
  els.label.add(new Option(label, label));
  els.label.value = label;
  showToast(`Label "${label}" added`);
});
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => { setView(item.dataset.view); document.querySelector('#sidebar').classList.remove('open'); }));
document.querySelectorAll('.filter-chip').forEach((chip) => chip.addEventListener('click', () => { currentFilter = chip.dataset.filter; selectedLabel = ''; document.querySelectorAll('.filter-chip').forEach((item) => item.classList.toggle('active', item === chip)); render(); }));
els.labels.addEventListener('click', (event) => { const button = event.target.closest('[data-label]'); if (!button) return; selectedLabel = button.dataset.label; currentView = 'notes'; els.pageTitle.textContent = selectedLabel; els.viewKicker.textContent = 'LABEL'; render(); });
els.board.addEventListener('click', (event) => { const button = event.target.closest('[data-action]'); if (button) mutateNote(Number(button.dataset.id), button.dataset.action); });
els.board.addEventListener('change', (event) => { if (!event.target.matches('[data-check-id]')) return; const note = notes.find((item) => item.id === Number(event.target.dataset.checkId)); note.items[Number(event.target.dataset.checkIndex)].done = event.target.checked; saveNotes(); render(); });
document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') els.composer.requestSubmit(); if (event.key === '/' && document.activeElement !== els.search && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); els.search.focus(); } });
render();
