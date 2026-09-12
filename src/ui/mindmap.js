import { markdownInput } from './preview.js';
import { renderMindmap } from '../mindmap/renderer.js';
import { showStatus } from './notifications.js';
import { isDarkMode } from './theme.js';

const mindmapBtn = document.getElementById('mindmapBtn');
const overlay = document.getElementById('mindmapOverlay');
const svgEl = document.getElementById('mindmapSvg');
const closeBtn = document.getElementById('mindmapCloseBtn');
const toolbarContainer = document.getElementById('mindmapToolbar');

let mm = null;
let resizeObserver = null;

function attachToolbar() {
    if (typeof markmap === 'undefined' || !markmap.Toolbar) return;
    toolbarContainer.innerHTML = '';
    toolbarContainer.classList.toggle('markmap-dark', isDarkMode());
    const toolbar = markmap.Toolbar.create(mm);
    toolbar.setBrand(false);
    toolbarContainer.appendChild(toolbar.el);
}

export function initMindmap() {
    mindmapBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        // Wait a frame so the just-unhidden overlay has its final size before markmap measures it
        requestAnimationFrame(() => {
            try {
                mm = renderMindmap(markdownInput.value, svgEl);
                attachToolbar();
                mm.fit();

                resizeObserver?.disconnect();
                resizeObserver = new ResizeObserver(() => mm?.fit());
                resizeObserver.observe(overlay);
            } catch (error) {
                console.error('Error rendering mind map:', error);
                showStatus(`Error rendering mind map: ${error.message}`, 'error');
            }
        });
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        resizeObserver?.disconnect();
        resizeObserver = null;
    });
}
