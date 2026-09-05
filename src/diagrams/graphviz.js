import { svgToPngBuffer } from './svg-to-image.js';

let vizInstancePromise = null;

function getViz() {
    if (typeof Viz === 'undefined') {
        return Promise.reject(new Error('Graphviz (viz.js) library not available'));
    }
    vizInstancePromise ??= Viz.instance();
    return vizInstancePromise;
}

// Replace ```dot / ```graphviz code blocks inside containerEl with rendered SVG diagrams
export async function renderGraphvizDiagrams(containerEl) {
    const codeBlocks = containerEl.querySelectorAll('code.language-dot, code.language-graphviz');
    if (!codeBlocks.length) return;

    let viz;
    try {
        viz = await getViz();
    } catch (error) {
        console.error('Graphviz library unavailable:', error);
        return;
    }

    codeBlocks.forEach((codeEl) => {
        const dot = codeEl.textContent;
        const pre = codeEl.closest('pre') || codeEl;
        try {
            const svgElement = viz.renderSVGElement(dot);
            svgElement.classList.add('graphviz-diagram');
            const container = document.createElement('div');
            container.className = 'graphviz';
            container.appendChild(svgElement);
            pre.replaceWith(container);
        } catch (error) {
            console.error('Error rendering graphviz diagram:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mermaid-error';
            errorDiv.textContent = `Graphviz diagram error: ${error.message || error}`;
            pre.replaceWith(errorDiv);
        }
    });
}

// Render a DOT definition to a PNG image buffer for embedding in the docx
export async function renderGraphvizToImage(dot) {
    const viz = await getViz();
    const svg = viz.renderString(dot, { format: 'svg' });
    return svgToPngBuffer(svg);
}
