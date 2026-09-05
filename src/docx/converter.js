import { sanitizeForXml, parseTable, parseHtmlTable } from '../markdown/parser.js';
import { createTableParagraph } from './tables.js';
import { NUMBERED_LIST_REFERENCE, processInlineFormatting, createBulletParagraph, createNumberedParagraph } from './lists.js';
import { buildCodeBlockParagraph, buildMermaidImageParagraph, buildGraphvizImageParagraph, buildPlantUmlImageParagraph } from './code.js';
import { extractAlert, buildAlertParagraph } from './alerts.js';

// Convert markdown source into an array of docx elements (Paragraphs/Tables)
export async function markdownToDocx(markdown) {
    try {
        const lines = markdown.split('\n');
        const elements = [];
        let codeBlock = '';
        let codeLanguage = '';
        let inCodeBlock = false;
        let i = 0;

        while (i < lines.length) {
            try {
                const line = lines[i];

                // Handle code blocks
                if (line.trim().startsWith('```')) {
                    if (inCodeBlock) {
                        // End code block
                        if (codeBlock.trim() && codeLanguage === 'mermaid') {
                            elements.push(await buildMermaidImageParagraph(codeBlock));
                        } else if (codeBlock.trim() && (codeLanguage === 'dot' || codeLanguage === 'graphviz')) {
                            elements.push(await buildGraphvizImageParagraph(codeBlock));
                        } else if (codeBlock.trim() && (codeLanguage === 'plantuml' || codeLanguage === 'puml')) {
                            elements.push(await buildPlantUmlImageParagraph(codeBlock));
                        } else if (codeBlock.trim()) {
                            elements.push(buildCodeBlockParagraph(codeBlock));
                        }
                        codeBlock = '';
                        codeLanguage = '';
                        inCodeBlock = false;
                    } else {
                        // Start code block
                        inCodeBlock = true;
                        codeLanguage = line.trim().replace('```', '').trim();
                        codeBlock = '';
                    }
                    i++;
                    continue;
                }

                if (inCodeBlock) {
                    codeBlock += line + '\n';
                    i++;
                    continue;
                }

                // Handle tables
                if (/<table\b/i.test(line) || /<tr\b/i.test(line)) {
                    const { table, endIndex } = parseHtmlTable(lines, i);
                    if (table.isTable) {
                        elements.push(createTableParagraph(table));
                        i = endIndex + 1;
                        continue;
                    }
                }

                if (line.trim().startsWith('|')) {
                    const { table, endIndex } = parseTable(lines, i);
                    if (table.isTable) {
                        elements.push(createTableParagraph(table));
                        i = endIndex + 1;
                        continue;
                    }
                }

                // Handle block quotes
                if (line.trim().startsWith('>')) {
                    let quoteLines = [];
                    let quoteIndex = i;
                    while (quoteIndex < lines.length && lines[quoteIndex].trim().startsWith('>')) {
                        quoteLines.push(lines[quoteIndex].replace(/^>\s?/, ''));
                        quoteIndex++;
                    }

                    const alert = extractAlert(quoteLines);
                    if (alert) {
                        elements.push(buildAlertParagraph(alert, sanitizeForXml));
                        i = quoteIndex;
                        continue;
                    }

                    const quoteRuns = quoteLines.map((quoteLine, idx) => new docx.TextRun({
                        text: sanitizeForXml(quoteLine),
                        italics: true,
                        color: '4B5563',
                        break: idx > 0 ? 1 : 0
                    }));
                    elements.push(new docx.Paragraph({
                        children: quoteRuns,
                        indent: { left: 720 },
                        shading: {
                            type: docx.ShadingType.CLEAR,
                            color: 'FFFFFF',
                            fill: 'EFF6FF'
                        },
                        border: {
                            left: { color: '0066CC', space: 24, value: 'single', size: 24 }
                        },
                        spacing: { before: 200, after: 200 }
                    }));
                    i = quoteIndex;
                    continue;
                }

                // Handle headings
                if (line.startsWith('# ')) {
                    elements.push(new docx.Paragraph({
                        heading: docx.HeadingLevel.HEADING_1,
                        children: [new docx.TextRun({
                            text: sanitizeForXml(line.replace('# ', '').trim()),
                            bold: true,
                            size: 32,
                            color: '1E3A8A'
                        })],
                        spacing: { after: 200, before: 100 }
                    }));
                } else if (line.startsWith('## ')) {
                    elements.push(new docx.Paragraph({
                        heading: docx.HeadingLevel.HEADING_2,
                        children: [new docx.TextRun({
                            text: sanitizeForXml(line.replace('## ', '').trim()),
                            bold: true,
                            size: 28,
                            color: '2563EB'
                        })],
                        spacing: { after: 150, before: 100 }
                    }));
                } else if (line.startsWith('### ')) {
                    elements.push(new docx.Paragraph({
                        heading: docx.HeadingLevel.HEADING_3,
                        children: [new docx.TextRun({
                            text: sanitizeForXml(line.replace('### ', '').trim()),
                            bold: true,
                            size: 24,
                            color: '3B82F6'
                        })],
                        spacing: { after: 100, before: 80 }
                    }));
                } else if (line.startsWith('#### ')) {
                    elements.push(new docx.Paragraph({
                        heading: docx.HeadingLevel.HEADING_4,
                        children: [new docx.TextRun({
                            text: sanitizeForXml(line.replace('#### ', '').trim()),
                            bold: true,
                            size: 22,
                            color: '60A5FA'
                        })],
                        spacing: { after: 100, before: 80 }
                    }));
                }
                // Handle unordered lists
                else if (line.trim().match(/^[-*+]\s/)) {
                    const listItem = line.replace(/^[-*+]\s/, '').trim();
                    elements.push(createBulletParagraph(listItem));
                }
                // Handle ordered lists
                else if (line.trim().match(/^\d+\.\s/)) {
                    const match = line.trim().match(/^(\d+)\.\s(.*)$/);
                    if (match) {
                        elements.push(createNumberedParagraph(match[2].trim()));
                    }
                }
                // Handle horizontal rules
                else if (line.trim().match(/^[-*_]{3,}$/)) {
                    elements.push(new docx.Paragraph({
                        border: {
                            bottom: { color: '999999', space: 1, value: 'single', size: 6 }
                        },
                        spacing: { before: 200, after: 200 }
                    }));
                }
                // Handle regular paragraphs
                else {
                    const trimmedLine = line.trim();
                    if (trimmedLine.length > 0) {
                        elements.push(new docx.Paragraph({
                            children: processInlineFormatting(trimmedLine),
                            spacing: { line: 280, after: 120 }
                        }));
                    } else if (elements.length > 0) {
                        elements.push(new docx.Paragraph(''));
                    }
                }

                i++;
            } catch (lineError) {
                console.error('Error processing line', i, ':', lineError);
                i++;
            }
        }

        return elements.length > 0 ? elements : [new docx.Paragraph('No content')];
    } catch (error) {
        console.error('Error in markdownToDocx:', error);
        throw error;
    }
}

// Wrap converted elements in a docx.Document with the shared numbered-list config
export function createDocxDocument(elements) {
    return new docx.Document({
        numbering: {
            config: [{
                reference: NUMBERED_LIST_REFERENCE,
                levels: [{
                    level: 0,
                    format: docx.LevelFormat.DECIMAL,
                    text: '%1.',
                    alignment: docx.AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 720, hanging: 360 }
                        }
                    }
                }]
            }]
        },
        sections: [{
            properties: {},
            children: elements
        }]
    });
}

// Verify the generated docx is a valid zip with well-formed document.xml before letting the user download it
export async function validateDocxBlob(blob) {
    if (typeof JSZip === 'undefined') {
        console.warn('JSZip not available, skipping docx validation');
        return { valid: true };
    }

    try {
        const zip = await JSZip.loadAsync(blob);
        const documentXmlFile = zip.file('word/document.xml');
        if (!documentXmlFile) {
            return { valid: false, error: 'Missing word/document.xml in generated package' };
        }

        const xml = await documentXmlFile.async('string');
        const parser = new DOMParser();
        const parsed = parser.parseFromString(xml, 'application/xml');
        const parserError = parsed.querySelector('parsererror');
        if (parserError) {
            return { valid: false, error: 'document.xml is not well-formed XML' };
        }

        const numberingXmlFile = zip.file('word/numbering.xml');
        if (numberingXmlFile) {
            const numberingXml = await numberingXmlFile.async('string');
            const numbering = parser.parseFromString(numberingXml, 'application/xml');
            if (numbering.querySelector('parsererror')) {
                return { valid: false, error: 'numbering.xml is not well-formed XML' };
            }

            const definedIds = new Set(
                Array.from(numbering.getElementsByTagNameNS('*', 'num'))
                    .map((num) => num.getAttribute('w:numId') || num.getAttributeNS('*', 'numId'))
                    .filter(Boolean)
            );
            const referencedIds = Array.from(parsed.getElementsByTagNameNS('*', 'numId'))
                .map((numId) => numId.getAttribute('w:val') || numId.getAttributeNS('*', 'val'))
                .filter(Boolean);
            const missingId = referencedIds.find((id) => !definedIds.has(id));
            if (missingId) {
                return { valid: false, error: `document.xml references undefined numbering ID ${missingId}` };
            }
        }

        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml)) {
            return { valid: false, error: 'document.xml contains invalid control characters' };
        }

        return { valid: true };
    } catch (error) {
        console.error('Docx validation error:', error);
        return { valid: false, error: error.message || 'Unknown validation error' };
    }
}
