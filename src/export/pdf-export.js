import { buildStandaloneHtml } from './document-template.js';

// Print the current preview content via a hidden iframe so the user can save it as a PDF
export function exportPdf(previewEl, filename, isDark) {
    return new Promise((resolve, reject) => {
        const html = buildStandaloneHtml(filename || 'document', previewEl.innerHTML, isDark);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';

        iframe.onload = () => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                setTimeout(() => iframe.remove(), 1000);
            }
        };

        document.body.appendChild(iframe);
        iframe.srcdoc = html;
    });
}
