import { initMermaid } from '../mermaid/renderer.js';
import { updatePreview } from './preview.js';

const STORAGE_KEY = 'md-viewer-theme';
const HLJS_LIGHT_HREF = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-light.min.css';
const HLJS_DARK_HREF = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css';

const themeToggleBtn = document.getElementById('themeToggleBtn');
const hljsThemeLink = document.getElementById('hljsTheme');

export function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}

function applyThemeClasses(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    hljsThemeLink.href = isDark ? HLJS_DARK_HREF : HLJS_LIGHT_HREF;
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    initMermaid(isDark ? 'dark' : 'default');
}

export function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyThemeClasses(stored ? stored === 'dark' : !!prefersDark);

    themeToggleBtn.addEventListener('click', () => {
        const next = !isDarkMode();
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
        applyThemeClasses(next);
        updatePreview();
    });
}
