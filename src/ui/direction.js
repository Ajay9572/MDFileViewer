const STORAGE_KEY = 'md-viewer-direction';

const markdownInput = document.getElementById('markdownInput');
const preview = document.getElementById('preview');
const rtlToggleBtn = document.getElementById('rtlToggleBtn');

function applyDirection(isRtl) {
    const dir = isRtl ? 'rtl' : 'ltr';
    markdownInput.dir = dir;
    preview.dir = dir;
    rtlToggleBtn.setAttribute('aria-pressed', String(isRtl));
    rtlToggleBtn.classList.toggle('bg-blue-600', isRtl);
    rtlToggleBtn.classList.toggle('text-white', isRtl);
}

export function initDirection() {
    const stored = localStorage.getItem(STORAGE_KEY);
    applyDirection(stored === 'rtl');

    rtlToggleBtn.addEventListener('click', () => {
        const next = markdownInput.dir !== 'rtl';
        localStorage.setItem(STORAGE_KEY, next ? 'rtl' : 'ltr');
        applyDirection(next);
    });
}
