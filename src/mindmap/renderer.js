let transformer;

function getTransformer() {
    if (typeof markmap === 'undefined') {
        throw new Error('Markmap library not available');
    }
    transformer ??= new markmap.Transformer();
    return transformer;
}

// Render markdown headings/lists as an interactive mind map inside svgEl
export function renderMindmap(markdown, svgEl) {
    const { root } = getTransformer().transform(markdown);
    svgEl.innerHTML = '';
    markmap.Markmap.create(svgEl, undefined, root);
}
