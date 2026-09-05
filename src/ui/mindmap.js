import { markdownInput } from './preview.js';
import { renderMindmap } from '../mindmap/renderer.js';
import { showStatus } from './notifications.js';

const mindmapBtn = document.getElementById('mindmapBtn');
const overlay = document.getElementById('mindmapOverlay');
const svgEl = document.getElementById('mindmapSvg');
const closeBtn = document.getElementById('mindmapCloseBtn');

export function initMindmap() {
    mindmapBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        try {
            renderMindmap(markdownInput.value, svgEl);
        } catch (error) {
            console.error('Error rendering mind map:', error);
            showStatus(`Error rendering mind map: ${error.message}`, 'error');
        }
    });

    closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
}
