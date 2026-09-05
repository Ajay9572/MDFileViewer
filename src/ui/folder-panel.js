import { markdownInput, updatePreview } from './preview.js';
import { showStatus } from './notifications.js';
import { isFolderBrowserSupported, pickFolder, readFileEntry } from '../folder/browser.js';

const openFolderBtn = document.getElementById('openFolderBtn');
const folderPanel = document.getElementById('folderPanel');
const folderTree = document.getElementById('folderTree');
const folderSearchInput = document.getElementById('folderSearchInput');
const folderSearchResults = document.getElementById('folderSearchResults');

let entries = [];
let activeEntry = null;
let pollTimer = null;

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderTree() {
    folderTree.innerHTML = '';
    if (!entries.length) {
        folderTree.innerHTML = '<p class="text-xs text-gray-500 dark:text-slate-400">No markdown files found</p>';
        return;
    }

    entries.forEach((entry) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = entry.path;
        btn.className = 'block w-full text-left truncate text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300';
        btn.addEventListener('click', () => openEntry(entry));
        folderTree.appendChild(btn);
    });
}

function openEntry(entry) {
    markdownInput.value = entry.content;
    updatePreview();
    activeEntry = entry;
    showStatus(`Opened "${entry.path}"`, 'success');
}

async function loadAllContents() {
    await Promise.all(entries.map(async (entry) => {
        try {
            const { content, lastModified } = await readFileEntry(entry);
            entry.content = content;
            entry.lastModified = lastModified;
        } catch (error) {
            console.error(`Error reading ${entry.path}:`, error);
        }
    }));
}

function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
}

// Auto-refresh the editor if the active file changes on disk (and hasn't been locally edited)
function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
        if (!activeEntry) return;
        try {
            const file = await activeEntry.handle.getFile();
            if (file.lastModified !== activeEntry.lastModified && markdownInput.value === activeEntry.content) {
                const content = await file.text();
                activeEntry.content = content;
                activeEntry.lastModified = file.lastModified;
                markdownInput.value = content;
                updatePreview();
                showStatus(`"${activeEntry.path}" refreshed from disk`, 'info');
            }
        } catch (error) {
            console.error('Live refresh error:', error);
        }
    }, 2000);
}

function renderSearchResults(term) {
    folderSearchResults.innerHTML = '';
    if (!term) return;

    const lowerTerm = term.toLowerCase();
    const matches = entries.filter((entry) => entry.content?.toLowerCase().includes(lowerTerm));

    if (!matches.length) {
        folderSearchResults.innerHTML = '<p class="text-xs text-gray-500 dark:text-slate-400">No matches</p>';
        return;
    }

    matches.forEach((entry) => {
        const count = (entry.content.toLowerCase().match(new RegExp(escapeRegExp(lowerTerm), 'g')) || []).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'block w-full text-left text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700';
        btn.innerHTML = `<span class="text-blue-700 dark:text-blue-300">${entry.path}</span> <span class="text-xs text-gray-400">(${count})</span>`;
        btn.addEventListener('click', () => openEntry(entry));
        folderSearchResults.appendChild(btn);
    });
}

export function initFolderBrowser() {
    if (!isFolderBrowserSupported()) {
        openFolderBtn.title = 'Folder browser requires a Chromium-based browser (Chrome/Edge)';
        openFolderBtn.addEventListener('click', () => {
            showStatus('Folder browser requires a Chromium-based browser (Chrome/Edge)', 'error');
        });
        return;
    }

    openFolderBtn.addEventListener('click', async () => {
        try {
            const { files } = await pickFolder();
            entries = files;
            await loadAllContents();
            renderTree();
            folderPanel.classList.remove('hidden');
            startPolling();
            showStatus(`Loaded ${entries.length} markdown file(s) from folder`, 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening folder:', error);
                showStatus(`Error opening folder: ${error.message}`, 'error');
            }
        }
    });

    folderSearchInput.addEventListener('input', () => renderSearchResults(folderSearchInput.value.trim()));
}
