const STORAGE_KEY = "campusNotes_v2";
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeFilter = "all";
let editingId = null;

const notesList = document.getElementById("notesList");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("noteModal");
const form = document.getElementById("noteForm");
const titleInput = document.getElementById("noteTitle");
const contentInput = document.getElementById("noteContent");
const categoryInput = document.getElementById("noteCategory");

const sampleNotes = [
  { id: crypto.randomUUID(), title: "What is Git?", category: "Git Basics", content: "Git is a distributed version control system. It helps track changes in files and makes it easier for developers to work together.", createdAt: Date.now() - 300000 },
  { id: crypto.randomUUID(), title: "Useful Git commands", category: "Git Basics", content: "git init — start a repository\\ngit add . — stage changes\\ngit commit -m — save a snapshot\\ngit push — upload commits to a remote", createdAt: Date.now() - 200000 },
  { id: crypto.randomUUID(), title: "Remote repositories", category: "GitHub", content: "A remote is a version of your project hosted elsewhere, often on GitHub. Use git remote -v to view configured remotes.", createdAt: Date.now() - 100000 }
];

if (!localStorage.getItem(STORAGE_KEY)) {
  notes = sampleNotes;
  saveNotes();
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function categorySymbol(category) {
  return ({ "Git Basics": "⌘", "GitHub": "⌁", "Branching": "⑂", "Other": "✳" })[category] || "✳";
}

function renderNotes() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const sort = document.getElementById("sortSelect").value;

  let filtered = notes.filter(note => {
    const matchesCategory = activeFilter === "all" || note.category === activeFilter;
    const matchesSearch = (note.title + " " + note.content + " " + note.category).toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  if (sort === "newest") filtered.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === "oldest") filtered.sort((a, b) => a.createdAt - b.createdAt);
  if (sort === "az") filtered.sort((a, b) => a.title.localeCompare(b.title));

  notesList.innerHTML = filtered.map(note => `
    <article class="note-card">
      <div class="note-card-top">
        <span class="note-symbol">${categorySymbol(note.category)}</span>
        <span class="note-category">${escapeHTML(note.category)}</span>
      </div>
      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.content)}</p>
      <div class="note-card-bottom">
        <span>${new Date(note.createdAt).toLocaleDateString()}</span>
        <span class="card-actions">
          <button data-action="edit" data-id="${note.id}">Edit</button>
          <button data-action="delete" data-id="${note.id}">Delete</button>
        </span>
      </div>
    </article>
  `).join("");

  emptyState.classList.toggle("show", filtered.length === 0);
  notesList.style.display = filtered.length === 0 ? "none" : "grid";
  document.getElementById("totalCount").textContent = notes.length;
  document.getElementById("allCount").textContent = notes.length;
  document.getElementById("sectionTitle").textContent = activeFilter === "all" ? "RECENT NOTES" : activeFilter.toUpperCase();
  document.getElementById("breadcrumbLabel").textContent = activeFilter === "all" ? "All notes" : activeFilter;
}

function openModal(note = null) {
  editingId = note ? note.id : null;
  document.getElementById("modalTitle").textContent = note ? "Edit your note" : "Create a note";
  titleInput.value = note ? note.title : "";
  contentInput.value = note ? note.content : "";
  categoryInput.value = note ? note.category : "Git Basics";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  titleInput.focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  form.reset();
  editingId = null;
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderNotes();
}

document.getElementById("newNoteBtn").addEventListener("click", () => openModal());
document.getElementById("emptyCreateBtn").addEventListener("click", () => openModal());
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("searchInput").addEventListener("input", renderNotes);
document.getElementById("sortSelect").addEventListener("change", renderNotes);

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return;

  if (editingId) {
    const note = notes.find(item => item.id === editingId);
    if (note) Object.assign(note, { title, content, category: categoryInput.value });
  } else {
    notes.push({
      id: crypto.randomUUID(),
      title,
      content,
      category: categoryInput.value,
      createdAt: Date.now()
    });
  }

  saveNotes();
  closeModal();
  renderNotes();
});

notesList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const note = notes.find(item => item.id === button.dataset.id);
  if (!note) return;

  if (button.dataset.action === "edit") openModal(note);
  if (button.dataset.action === "delete") {
    if (confirm(`Delete "${note.title}"?`)) {
      notes = notes.filter(item => item.id !== note.id);
      saveNotes();
      renderNotes();
    }
  }
});

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

renderNotes();
