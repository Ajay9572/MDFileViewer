import { svgToPngBuffer } from '../diagrams/svg-to-image.js';

export function initMermaid(theme = 'default') {
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'loose' });
    }
}

let mermaidRenderCount = 0;
let mermaidExportCount = 0;

// Replace ```mermaid code blocks inside containerEl with rendered diagrams
export async function renderMermaidDiagrams(containerEl) {
    if (typeof mermaid === 'undefined') {
        console.warn('mermaid library not loaded yet');
        return;
    }

    const codeBlocks = containerEl.querySelectorAll('code.language-mermaid');
    const containers = [];

    codeBlocks.forEach((codeEl) => {
        const graphDefinition = codeEl.textContent;
        const pre = codeEl.closest('pre') || codeEl;
        const container = document.createElement('div');
        container.className = 'mermaid';
        container.id = `mermaid-diagram-${mermaidRenderCount++}`;
        container.textContent = graphDefinition;
        pre.replaceWith(container);
        containers.push(container);
    });

    if (containers.length === 0) {
        return;
    }

    try {
        await mermaid.run({ nodes: containers });
    } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        containers.forEach((container) => {
            if (!container.querySelector('svg')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'mermaid-error';
                errorDiv.textContent = `Mermaid diagram error: ${error.message || error}`;
                container.replaceWith(errorDiv);
            }
        });
    }
}

// Render a mermaid diagram definition to a PNG image buffer for embedding in the docx
export async function renderMermaidToImage(graphDefinition) {
    if (typeof mermaid === 'undefined') {
        throw new Error('Mermaid library not available');
    }
    const renderId = `mermaid-export-${mermaidExportCount++}`;
    const { svg } = await mermaid.render(renderId, graphDefinition);
    return svgToPngBuffer(svg);
}
