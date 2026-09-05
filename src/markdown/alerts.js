const ALERT_ICONS = {
    note: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.75 12h-1.5V7h1.5v5zm0-6.5h-1.5V4h1.5v1.5z"></path></svg>',
    tip: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a5 5 0 00-3 9v1.5A1.5 1.5 0 006.5 13h3A1.5 1.5 0 0011 11.5V10a5 5 0 00-3-9zM6.5 15h3v.5A1.5 1.5 0 018 17h0a1.5 1.5 0 01-1.5-1.5V15z"></path></svg>',
    important: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm9-4H7v5h2V4zM7 11v2h2v-2H7z"></path></svg>',
    warning: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.9 1.5c.5-.9 1.7-.9 2.2 0l6.2 11.1c.5.9-.1 2-1.1 2H1.8c-1 0-1.6-1.1-1.1-2L6.9 1.5zM8 5.5a.9.9 0 00-.9.9V9.4a.9.9 0 001.8 0V6.4A.9.9 0 008 5.5zm0 6.6a1 1 0 100 2 1 1 0 000-2z"></path></svg>',
    caution: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.7.5h6.6c.3 0 .5.1.7.3l3.2 3.2c.2.2.3.4.3.7v6.6c0 .3-.1.5-.3.7l-3.2 3.2c-.2.2-.4.3-.7.3H4.7c-.3 0-.5-.1-.7-.3L.8 11.9c-.2-.2-.3-.4-.3-.7V4.7c0-.3.1-.5.3-.7L4 .8c.2-.2.4-.3.7-.3zM7 4v5h2V4H7zm0 6.5V12h2v-1.5H7z"></path></svg>'
};

const ALERT_LABELS = {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution'
};

const ALERT_MARKER = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>|\n)?/i;

// Turn GitHub-style `> [!NOTE]` blockquotes into styled callouts
export function applyGithubAlerts(containerEl) {
    containerEl.querySelectorAll('blockquote').forEach((blockquote) => {
        const firstParagraph = blockquote.querySelector('p');
        if (!firstParagraph) return;

        const match = firstParagraph.innerHTML.match(ALERT_MARKER);
        if (!match) return;

        const type = match[1].toLowerCase();
        if (!ALERT_LABELS[type]) return;

        firstParagraph.innerHTML = firstParagraph.innerHTML.slice(match[0].length);
        if (!firstParagraph.innerHTML.trim()) {
            firstParagraph.remove();
        }

        blockquote.classList.add('md-alert', `md-alert-${type}`);

        const title = document.createElement('p');
        title.className = 'md-alert-title';
        title.innerHTML = `${ALERT_ICONS[type]}<span>${ALERT_LABELS[type]}</span>`;
        blockquote.insertBefore(title, blockquote.firstChild);
    });
}
