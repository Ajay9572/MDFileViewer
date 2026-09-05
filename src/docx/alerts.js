// Shared with markdown/alerts.js but kept separate since docx needs plain-text markers, not HTML
const ALERT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i;

const ALERT_STYLES = {
    note: { label: 'Note', border: '2563EB', fill: 'EFF6FF', text: '1E3A8A' },
    tip: { label: 'Tip', border: '16A34A', fill: 'F0FDF4', text: '14532D' },
    important: { label: 'Important', border: '7C3AED', fill: 'F5F3FF', text: '4C1D95' },
    warning: { label: 'Warning', border: 'D97706', fill: 'FFFBEB', text: '92400E' },
    caution: { label: 'Caution', border: 'DC2626', fill: 'FEF2F2', text: '7F1D1D' }
};

// Detect a `[!NOTE]`-style marker on the first quote line; returns null if this isn't an alert
export function extractAlert(quoteLines) {
    if (!quoteLines.length) return null;

    const match = quoteLines[0].trim().match(ALERT_MARKER);
    if (!match) return null;

    const type = match[1].toLowerCase();
    const style = ALERT_STYLES[type];
    if (!style) return null;

    const remainder = match[2].trim();
    const contentLines = remainder ? [remainder, ...quoteLines.slice(1)] : quoteLines.slice(1);
    return { style, contentLines };
}

// Build a styled callout paragraph equivalent to a GitHub alert blockquote
export function buildAlertParagraph(alert, sanitizeForXml) {
    const { style, contentLines } = alert;
    const runs = [new docx.TextRun({
        text: style.label,
        bold: true,
        color: style.text,
        break: 0
    })];

    contentLines.forEach((line) => {
        runs.push(new docx.TextRun({
            text: sanitizeForXml(line),
            color: style.text,
            break: 1
        }));
    });

    return new docx.Paragraph({
        children: runs,
        indent: { left: 720 },
        shading: {
            type: docx.ShadingType.CLEAR,
            color: 'FFFFFF',
            fill: style.fill
        },
        border: {
            left: { color: style.border, space: 24, value: 'single', size: 24 }
        },
        spacing: { before: 200, after: 200 }
    });
}
