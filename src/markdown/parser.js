// Strip characters that are illegal in XML 1.0; if left in, Word cannot parse document.xml
export function sanitizeForXml(value) {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '');
}

export function stripHtmlTags(value) {
    if (!value || typeof value !== 'string') return '';

    let sanitized = value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#0*160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, '/');

    sanitized = sanitized
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '');

    sanitized = sanitized
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s*\n\s*/g, '\n')
        .replace(/[\t ]+\n/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return sanitizeForXml(sanitized);
}

// Parse a GitHub-flavored markdown pipe table starting at lines[startIndex]
export function parseTable(lines, startIndex) {
    const table = {
        rows: [],
        isTable: false
    };

    if (startIndex >= lines.length - 1) return { table, endIndex: startIndex };

    const headerLine = lines[startIndex].trim();
    const separatorLine = lines[startIndex + 1].trim();

    // Check if it's a valid table
    if (!headerLine.startsWith('|') || !separatorLine.includes('---')) {
        return { table, endIndex: startIndex };
    }

    // Parse header
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    table.rows.push(headers);
    table.isTable = true;

    let endIndex = startIndex + 2;

    // Parse body rows
    while (endIndex < lines.length) {
        const line = lines[endIndex].trim();
        if (!line.startsWith('|') || line === '') break;

        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length === headers.length) {
            table.rows.push(cells);
        }
        endIndex++;
    }

    return { table, endIndex: endIndex - 1 };
}

// Parse a raw <table>...</table> HTML block starting at lines[startIndex]
export function parseHtmlTable(lines, startIndex) {
    const table = { rows: [], isTable: false };
    if (startIndex >= lines.length) return { table, endIndex: startIndex };

    const startLine = lines[startIndex].trim();
    if (!/<table\b/i.test(startLine)) {
        return { table, endIndex: startIndex };
    }

    const htmlLines = [];
    let endIndex = startIndex;

    while (endIndex < lines.length) {
        htmlLines.push(lines[endIndex]);
        if (/<\/table>/i.test(lines[endIndex])) break;
        endIndex++;
    }

    if (!htmlLines.length || !/<\/table>/i.test(htmlLines[htmlLines.length - 1])) {
        return { table, endIndex: startIndex };
    }

    const fullHtml = htmlLines.join('\n');
    const rowMatches = [...fullHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (!rowMatches.length) {
        return { table, endIndex: startIndex };
    }

    const rows = rowMatches.map((match) => {
        const cells = [...match[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map((cellMatch) => stripHtmlTags(cellMatch[1]));
        return cells.filter((cell) => cell.length > 0 || cells.length > 0);
    }).filter((row) => row.length > 0);

    if (!rows.length) {
        return { table, endIndex: startIndex };
    }

    table.rows = rows;
    table.isTable = true;
    return { table, endIndex };
}
