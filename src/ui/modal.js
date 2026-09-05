import { validateDocxBlob } from '../docx/converter.js';
import { showStatus } from './notifications.js';

const filenameModal = document.getElementById('filenameModal');
const filenameInput = document.getElementById('filenameInput');
const confirmFilenameBtn = document.getElementById('confirmFilenameBtn');
const cancelFilenameBtn = document.getElementById('cancelFilenameBtn');

let pendingDocxData = null;

export function showFilenameModal(doc) {
    pendingDocxData = doc;
    filenameModal.classList.remove('hidden');
    filenameInput.focus();
    filenameInput.select();
}

function hideFilenameModal() {
    filenameModal.classList.add('hidden');
    pendingDocxData = null;
}

async function confirmDownload() {
    const filename = filenameInput.value.trim() || 'document';
    if (!pendingDocxData) {
        showStatus('No document data available', 'error');
        return;
    }

    try {
        console.log('Starting document conversion to blob...');
        const blob = await docx.Packer.toBlob(pendingDocxData);
        console.log('Blob created successfully:', blob.size, 'bytes');

        const validation = await validateDocxBlob(blob);
        if (!validation.valid) {
            console.error('Generated docx failed validation:', validation.error);
            showStatus(`Export failed validation (${validation.error}). Please try again.`, 'error');
            hideFilenameModal();
            return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        showStatus(`Word document "${filename}.docx" downloaded successfully! 📄`, 'success');
        hideFilenameModal();
    } catch (error) {
        console.error('Error downloading document:', error);
        console.error('Error stack:', error.stack);
        showStatus(`Error downloading document: ${error.message}`, 'error');
        hideFilenameModal();
    }
}

export function initModal() {
    confirmFilenameBtn.addEventListener('click', confirmDownload);
    cancelFilenameBtn.addEventListener('click', hideFilenameModal);

    // Allow Enter key to confirm
    filenameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmFilenameBtn.click();
        }
    });
}
