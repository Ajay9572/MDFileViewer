let transformer;

function getTransformer() {
    if (typeof markmap === 'undefined') {
        throw new Error('Markmap library not available');
    }
    transformer ??= new markmap.Transformer();
    return transformer;
}

// Render markdown headings/lists as an interactive mind map inside svgEl; returns the Markmap instance
export function renderMindmap(markdown, svgEl) {
    const { root } = getTransformer().transform(markdown);
    svgEl.innerHTML = '';
    return markmap.Markmap.create(svgEl, { autoFit: true }, root);
}
