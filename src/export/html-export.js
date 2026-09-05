import { buildStandaloneHtml } from './document-template.js';

// Download the current preview content as a standalone HTML file
export function exportHtml(previewEl, filename, isDark) {
    const name = filename || 'document';
    const html = buildStandaloneHtml(name, previewEl.innerHTML, isDark);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.html`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
}
