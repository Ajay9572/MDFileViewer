import { preview } from './preview.js';
import { buildToc } from '../markdown/toc.js';

const tocToggleBtn = document.getElementById('tocToggleBtn');
const tocPanel = document.getElementById('tocPanel');
const tocList = document.getElementById('tocList');

const LEVEL_INDENT = {
    1: 'pl-0 font-semibold',
    2: 'pl-3',
    3: 'pl-6 text-xs',
    4: 'pl-9 text-xs'
};

function renderTocList() {
    const outline = buildToc(preview);
    tocList.innerHTML = '';

    if (!outline.length) {
        tocList.innerHTML = '<p class="text-xs text-gray-500 dark:text-slate-400">No headings found</p>';
        return;
    }

    outline.forEach(({ level, text, id }) => {
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = text;
        link.className = `block truncate text-blue-700 dark:text-blue-300 hover:underline ${LEVEL_INDENT[level] || 'pl-0'}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        tocList.appendChild(link);
    });
}

function hideToc() {
    tocPanel.classList.add('hidden');
}

export function initToc() {
    tocToggleBtn.addEventListener('click', () => {
        const isHidden = tocPanel.classList.contains('hidden');
        if (isHidden) {
            renderTocList();
        }
        tocPanel.classList.toggle('hidden');
    });

    preview.addEventListener('preview:updated', () => {
        if (!tocPanel.classList.contains('hidden')) {
            renderTocList();
        }
    });

    document.addEventListener('click', (e) => {
        if (!tocPanel.contains(e.target) && !tocToggleBtn.contains(e.target) && !tocPanel.classList.contains('hidden')) {
            hideToc();
        }
    });
}
