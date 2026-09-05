import { preview } from './preview.js';

const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const searchPrevBtn = document.getElementById('searchPrevBtn');
const searchNextBtn = document.getElementById('searchNextBtn');
const searchCloseBtn = document.getElementById('searchCloseBtn');
const searchCount = document.getElementById('searchCount');

let matches = [];
let currentIndex = -1;

function clearHighlights() {
    preview.querySelectorAll('mark.search-mark').forEach((mark) => {
        const text = document.createTextNode(mark.textContent);
        mark.replaceWith(text);
    });
    preview.normalize();
    matches = [];
    currentIndex = -1;
}

function highlightTerm(term) {
    if (!term) {
        updateCount();
        return;
    }

    const lowerTerm = term.toLowerCase();
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.closest('mark.search-mark')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
        const value = textNode.nodeValue;
        const lowerValue = value.toLowerCase();
        if (!lowerValue.includes(lowerTerm)) return;

        const fragment = document.createDocumentFragment();
        let cursor = 0;
        let idx;
        while ((idx = lowerValue.indexOf(lowerTerm, cursor)) !== -1) {
            if (idx > cursor) {
                fragment.appendChild(document.createTextNode(value.slice(cursor, idx)));
            }
            const mark = document.createElement('mark');
            mark.className = 'search-mark';
            mark.textContent = value.slice(idx, idx + term.length);
            fragment.appendChild(mark);
            matches.push(mark);
            cursor = idx + term.length;
        }
        if (cursor < value.length) {
            fragment.appendChild(document.createTextNode(value.slice(cursor)));
        }
        textNode.replaceWith(fragment);
    });
}

function goToMatch(index) {
    if (!matches.length) return;
    matches[currentIndex]?.classList.remove('search-mark-current');
    currentIndex = ((index % matches.length) + matches.length) % matches.length;
    const current = matches[currentIndex];
    current.classList.add('search-mark-current');
    current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateCount();
}

function updateCount() {
    searchCount.textContent = matches.length ? `${currentIndex + 1}/${matches.length}` : '0/0';
}

function runSearch() {
    clearHighlights();
    highlightTerm(searchInput.value.trim());
    if (matches.length) {
        goToMatch(0);
    } else {
        updateCount();
    }
}

function closeSearch() {
    clearHighlights();
    updateCount();
    searchPanel.classList.add('hidden');
}

export function initSearch() {
    searchToggleBtn.addEventListener('click', () => {
        const isHidden = searchPanel.classList.contains('hidden');
        searchPanel.classList.toggle('hidden');
        if (isHidden) {
            searchInput.focus();
        }
    });

    searchCloseBtn.addEventListener('click', closeSearch);
    searchInput.addEventListener('input', runSearch);
    searchNextBtn.addEventListener('click', () => goToMatch(currentIndex + 1));
    searchPrevBtn.addEventListener('click', () => goToMatch(currentIndex - 1));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            goToMatch(currentIndex + (e.shiftKey ? -1 : 1));
        } else if (e.key === 'Escape') {
            closeSearch();
        }
    });

    // Re-apply the active search after the preview content changes
    preview.addEventListener('preview:updated', () => {
        if (!searchPanel.classList.contains('hidden') && searchInput.value.trim()) {
            runSearch();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchPanel.contains(e.target) && !searchToggleBtn.contains(e.target) && !searchPanel.classList.contains('hidden') && !searchInput.value.trim()) {
            searchPanel.classList.add('hidden');
        }
    });
}
