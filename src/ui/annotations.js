import { preview } from './preview.js';
import { loadAnnotations, addAnnotation, removeAnnotation } from '../annotations/store.js';

let popup;

function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'annotationPopup';
    popup.className = 'hidden fixed z-50 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl p-2';
    popup.innerHTML = '<button id="annotationAddBtn" type="button" class="text-xs font-semibold text-amber-600 border border-amber-300 rounded px-2 py-1 hover:bg-amber-50">\uD83D\uDCAC Annotate</button>';
    document.body.appendChild(popup);

    popup.querySelector('#annotationAddBtn').addEventListener('click', () => {
        const text = popup.dataset.selectedText;
        if (!text) return;
        const note = window.prompt('Add a note for the selected text:');
        if (note) {
            addAnnotation(text, note);
            applyAnnotationHighlights();
        }
        hidePopup();
        window.getSelection()?.removeAllRanges();
    });

    return popup;
}

function hidePopup() {
    popup?.classList.add('hidden');
}

function applyAnnotationHighlights() {
    preview.querySelectorAll('mark.annotation-mark').forEach((mark) => {
        const text = document.createTextNode(mark.textContent);
        mark.replaceWith(text);
    });
    preview.normalize();

    const annotations = loadAnnotations();
    annotations.forEach((annotation) => {
        const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            const idx = node.nodeValue.indexOf(annotation.text);
            if (idx === -1) continue;
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + annotation.text.length);
            const mark = document.createElement('mark');
            mark.className = 'annotation-mark';
            mark.title = annotation.note;
            mark.dataset.annotationId = annotation.id;
            range.surroundContents(mark);
            break;
        }
    });
}

export function initAnnotations() {
    ensurePopup();

    preview.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (!text || !preview.contains(selection.anchorNode)) {
            hidePopup();
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const el = ensurePopup();
        el.style.top = `${window.scrollY + rect.bottom + 6}px`;
        el.style.left = `${window.scrollX + rect.left}px`;
        el.classList.remove('hidden');
        el.dataset.selectedText = text;
    });

    document.addEventListener('mousedown', (e) => {
        if (popup && !popup.contains(e.target) && !preview.contains(e.target)) {
            hidePopup();
        }
    });

    preview.addEventListener('click', (e) => {
        const mark = e.target.closest('mark.annotation-mark');
        if (!mark) return;
        const id = Number(mark.dataset.annotationId);
        const annotation = loadAnnotations().find((a) => a.id === id);
        if (annotation && confirm(`Note: ${annotation.note}\n\nRemove this annotation?`)) {
            removeAnnotation(id);
            applyAnnotationHighlights();
        }
    });

    preview.addEventListener('preview:updated', applyAnnotationHighlights);
}
