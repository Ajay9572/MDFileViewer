// Render $...$ and $$...$$ math expressions inside containerEl using KaTeX
export function renderMath(containerEl) {
    if (typeof renderMathInElement === 'undefined') return;

    renderMathInElement(containerEl, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    });
}
