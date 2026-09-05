import { markdownInput, updatePreview } from '../ui/preview.js';
import { showStatus } from '../ui/notifications.js';

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error(`Error reading file "${file.name}"`));
        reader.readAsText(file);
    });
}

async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    try {
        const contents = await Promise.all(files.map(readFileAsText));
        const combined = files.length === 1
            ? contents[0]
            : files.map((file, idx) => `## ${file.name}\n\n${contents[idx]}`).join('\n\n---\n\n');

        markdownInput.value = combined;
        updatePreview();
        showStatus(
            files.length === 1
                ? `File "${files[0].name}" loaded successfully!`
                : `${files.length} files loaded successfully!`,
            'success'
        );
    } catch (error) {
        showStatus(error.message || 'Error reading file', 'error');
    }
}

export function initFileHandler() {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-100');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500', 'bg-blue-100');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-100');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}
