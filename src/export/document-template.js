const EXPORT_STYLES = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem auto; max-width: 52rem; color: #172033; background: #ffffff; }
html.dark body { background: #0f172a; color: #e5e9f2; }
h1, h2, h3, h4 { font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; }
h1 { font-size: 1.875rem; color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 0.5rem; }
h2 { font-size: 1.5rem; color: #2563eb; border-bottom: 2px solid #60a5fa; padding-bottom: 0.375rem; }
h3 { font-size: 1.25rem; color: #3b82f6; border-bottom: 1px solid #93c5fd; padding-bottom: 0.25rem; }
h4 { font-size: 1.125rem; color: #60a5fa; }
html.dark h1, html.dark h2, html.dark h3, html.dark h4 { color: #93c5fd; border-color: #334155; }
p { margin-bottom: 1rem; line-height: 1.6; }
ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; }
li { margin-bottom: 0.5rem; }
code { background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; color: #dc2626; }
html.dark code { background-color: #1e293b; color: #fca5a5; }
pre { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
html.dark pre { background-color: #1e293b; border-color: #334155; }
pre code { background-color: transparent; color: inherit; padding: 0; }
blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin-left: 0; margin-bottom: 1rem; font-style: italic; color: #4b5563; }
table { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 1rem; }
th, td { border: 1px solid #000000; padding: 0.75rem; text-align: left; }
th { background-color: #3b82f6; color: white; }
hr { border: none; border-top: 2px solid #d1d5db; margin: 1.5rem 0; }
.mermaid { display: flex; justify-content: center; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
.mermaid svg { max-width: 100%; height: auto; }
.md-alert { border-left-width: 4px; border-left-style: solid; padding: 0.75rem 1rem; margin-bottom: 1rem; font-style: normal; border-radius: 0.375rem; }
.md-alert-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; margin-bottom: 0.35rem; }
.md-alert-title svg { width: 1.1rem; height: 1.1rem; }
.md-alert-note { border-color: #2563eb; background: #eff6ff; color: #1e3a8a; }
.md-alert-tip { border-color: #16a34a; background: #f0fdf4; color: #14532d; }
.md-alert-important { border-color: #7c3aed; background: #f5f3ff; color: #4c1d95; }
.md-alert-warning { border-color: #d97706; background: #fffbeb; color: #92400e; }
.md-alert-caution { border-color: #dc2626; background: #fef2f2; color: #7f1d1d; }
@media print {
  body { margin: 0; max-width: none; }
  .mermaid, pre, table { break-inside: avoid; }
}
`;

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

// Build a standalone HTML document that reproduces the preview's visual styling
export function buildStandaloneHtml(title, bodyHtml, isDark) {
    return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>${EXPORT_STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
