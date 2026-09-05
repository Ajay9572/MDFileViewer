import { stripHtmlTags } from '../markdown/parser.js';

// Reference id shared with the docx.Document numbering config in converter.js
export const NUMBERED_LIST_REFERENCE = 'markdown-numbered-list';

// Process inline formatting (bold, italic, code) into docx TextRuns
export function processInlineFormatting(text) {
    try {
        if (!text || typeof text !== 'string') {
            return [new docx.TextRun('')];
        }

        text = stripHtmlTags(text);

        const runs = [];
        let currentText = '';
        let i = 0;

        while (i < text.length) {
            // Bold (**text**)
            if (text[i] === '*' && text[i + 1] === '*') {
                if (currentText) {
                    runs.push(new docx.TextRun(currentText));
                    currentText = '';
                }
                i += 2;
                let boldText = '';
                while (i < text.length && !(text[i] === '*' && text[i + 1] === '*')) {
                    boldText += text[i];
                    i++;
                }
                if (boldText) {
                    runs.push(new docx.TextRun({
                        text: boldText,
                        bold: true
                    }));
                }
                i += 2;
            }
            // Italic (*text*)
            else if (text[i] === '*' && text[i + 1] !== '*') {
                if (currentText) {
                    runs.push(new docx.TextRun(currentText));
                    currentText = '';
                }
                i++;
                let italicText = '';
                while (i < text.length && text[i] !== '*') {
                    italicText += text[i];
                    i++;
                }
                if (italicText) {
                    runs.push(new docx.TextRun({
                        text: italicText,
                        italic: true
                    }));
                }
                i++;
            }
            // Bold (__text__)
            else if (text[i] === '_' && text[i + 1] === '_') {
                if (currentText) {
                    runs.push(new docx.TextRun(currentText));
                    currentText = '';
                }
                i += 2;
                let boldText = '';
                while (i < text.length && !(text[i] === '_' && text[i + 1] === '_')) {
                    boldText += text[i];
                    i++;
                }
                if (boldText) {
                    runs.push(new docx.TextRun({
                        text: boldText,
                        bold: true
                    }));
                }
                i += 2;
            }
            // Italic (_text_)
            else if (text[i] === '_' && text[i + 1] !== '_') {
                if (currentText) {
                    runs.push(new docx.TextRun(currentText));
                    currentText = '';
                }
                i++;
                let italicText = '';
                while (i < text.length && text[i] !== '_') {
                    italicText += text[i];
                    i++;
                }
                if (italicText) {
                    runs.push(new docx.TextRun({
                        text: italicText,
                        italic: true
                    }));
                }
                i++;
            }
            // Inline code (`code`)
            else if (text[i] === '`') {
                if (currentText) {
                    runs.push(new docx.TextRun(currentText));
                    currentText = '';
                }
                i++;
                let codeText = '';
                while (i < text.length && text[i] !== '`') {
                    codeText += text[i];
                    i++;
                }
                if (codeText) {
                    runs.push(new docx.TextRun({
                        text: codeText,
                        font: 'Courier New',
                        shading: {
                            type: docx.ShadingType.CLEAR,
                            color: 'F0F0F0',
                            fill: 'EEEEEE'
                        }
                    }));
                }
                i++;
            }
            else {
                currentText += text[i];
                i++;
            }
        }

        if (currentText) {
            runs.push(new docx.TextRun(currentText));
        }

        return runs.length > 0 ? runs : [new docx.TextRun('')];
    } catch (error) {
        console.error('Error in processInlineFormatting:', error);
        return [new docx.TextRun(text)];
    }
}

export function createBulletParagraph(text) {
    return new docx.Paragraph({
        children: processInlineFormatting(text),
        bullet: { level: 0 },
        spacing: { line: 240, after: 100 }
    });
}

export function createNumberedParagraph(text) {
    return new docx.Paragraph({
        children: processInlineFormatting(text),
        numbering: {
            reference: NUMBERED_LIST_REFERENCE,
            level: 0
        },
        spacing: { line: 240, after: 100 }
    });
}
