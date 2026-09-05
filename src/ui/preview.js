import { renderMarkdownInto, initMarked } from '../markdown/renderer.js';
import { showStatus } from './notifications.js';

export const markdownInput = document.getElementById('markdownInput');
export const preview = document.getElementById('preview');

export async function updatePreview() {
    await renderMarkdownInto(markdownInput.value, preview);
    preview.dispatchEvent(new CustomEvent('preview:updated'));
}

export function resetPreview() {
    preview.innerHTML = '<p class="text-gray-500">Preview will appear here...</p>';
}

function createClipboardHtml() {
    const copyRoot = preview.cloneNode(true);

    copyRoot.querySelectorAll('table').forEach((table) => {
        table.setAttribute('border', '1');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '8');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = '1px solid #000000';
        table.style.marginBottom = '16px';
    });

    copyRoot.querySelectorAll('th, td').forEach((cell) => {
        cell.setAttribute('border', '1');
        cell.style.border = '1px solid #000000';
        cell.style.padding = '8px 12px';
        cell.style.textAlign = 'left';
    });

    copyRoot.querySelectorAll('th').forEach((header) => {
        header.style.backgroundColor = '#eff6ff';
        header.style.fontWeight = '600';
    });

    return copyRoot.innerHTML;
}

// Copy the rendered preview as rich text so Word and Excel receive formatted content
export async function copyFormattedPreview(button) {
    const markdown = markdownInput.value;

    if (!markdown.trim()) {
        showStatus('Nothing to copy', 'error');
        return;
    }

    const html = createClipboardHtml();
    const plainText = preview.innerText;

    try {
        if (window.ClipboardItem && navigator.clipboard.write) {
            const item = new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([plainText], { type: 'text/plain' })
            });
            await navigator.clipboard.write([item]);
        } else {
            await navigator.clipboard.writeText(plainText);
        }

        showStatus('Formatted content copied to clipboard! 📋', 'success');

        if (button) {
            const originalHtml = button.innerHTML;
            const iconSize = button.id === 'copyPreviewBtn' ? 'w-4 h-4' : 'w-5 h-5';
            button.innerHTML = `<svg class="${iconSize}" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg> Copied!`;
            setTimeout(() => {
                button.innerHTML = originalHtml;
            }, 2000);
        }
    } catch (error) {
        console.error('Error copying formatted content:', error);
        showStatus('Failed to copy to clipboard', 'error');
    }
}

export function initPreview() {
    initMarked();
    markdownInput.addEventListener('input', updatePreview);

    const copyPreviewBtn = document.getElementById('copyPreviewBtn');
    copyPreviewBtn.addEventListener('click', () => copyFormattedPreview(copyPreviewBtn));
}
