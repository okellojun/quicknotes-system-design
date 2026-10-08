const API_URL = 'https://jsonplaceholder.typicode.com/posts';

const loadBtn = document.getElementById('load-btn');
const submitBtn = document.getElementById('submit-btn');
const noteForm = document.getElementById('note-form');
const titleInput = document.getElementById('title-input');
const bodyInput = document.getElementById('body-input');
const titleCount = document.getElementById('title-count');
const statusParam = document.getElementById('status');
const notesList = document.getElementById('notes-list');

titleInput.addEventListener('input', () => {
    titleCount.textContent = titleInput.value.length;
});

/**
 * Reusable helper to update status UI
 * @param {string} message - Text to render using textContent
 * @param {'loading'|'success'|'error'|'info'} type - Status type for CSS styling
 */

function setStatus(message, type = 'info') {
    statusParam.textContent = message;
    statusParam.className = 'status-message' + type;
}

/**
 * Reusable async HTTP wrapper with error handling
 * @param {string} url - Target URL
 * @param {Object} [options={}] - Fetch configuration options
 * @returns {Promise<any>} Parsed response data or null on 204 No Content
 */

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    if (response.status === 204) {
        return null;
    }
    return await response.json();
}

/**
 * Render an array of notes in the DOM
 * Uses textContent exclusively to prevent XSS attacks.
 * @param {Array} notes - Array of note objects
 */

function renderNotes(notes) {
    notesList.textContent = '';

    if (!notes || notes.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-state';
        emptyLi.textContent = 'No Notes Found...'
        notesList.appendChild(emptyLi);
        return;
    }

    notes.forEach((note) => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.setAttribute('data-id', note.id);
    
        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';
    
        const h3 = document.createElement('h3');
        h3.className = 'note-title';
        h3.textContent = note.title; // Safe text insertion
    
        const p = document.createElement('p');
        p.className = 'note-body';
        p.textContent = note.body || 'No body content';
    
        noteContent.appendChild(h3);
        noteContent.appendChild(p);
    
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteNote(note.id, li));
    
        li.appendChild(noteContent);
        li.appendChild(deleteBtn);
        notesList.appendChild(li);
    });
}


async function loadNotes() {
    loadBtn.disabled = true;
    submitBtn.disabled = true;
    setStatus('Loading notes...', 'loading');

    try {
        const notes = await request(`${API_URL}?_limit=10`);
        renderNotes(notes);
        setStatus(`Loaded ${notes.length} notes from the server.`, 'success');
      } catch (error) {
        console.error('Failed to load notes:', error);
        setStatus(`Failed to load notes: ${error.message}`, 'error');
      } finally {
        loadBtn.disabled = false;
        submitBtn.disabled = false;
    }
}

loadBtn.addEventListener('click', loadNotes);

