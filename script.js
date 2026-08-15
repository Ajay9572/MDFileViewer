// Add markdown.js library
const markdownScript = document.createElement('script');
markdownScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(markdownScript);

// Check if docx library is loaded
function checkLibraries() {
    if (!window.docx) {
        console.warn('docx library not loaded yet');
    }
    if (!window.marked) {
        console.warn('marked library not loaded yet');
    }
    if (!window.hljs) {
        console.warn('hljs library not loaded yet');
    }
    console.log('Available libraries:', {
        docx: !!window.docx,
        marked: !!window.marked,
        hljs: !!window.hljs
    });
}

// DOM Elements
const markdownInput = document.getElementById('markdownInput');
const preview = document.getElementById('preview');
const downloadBtn = document.getElementById('downloadBtn');
const copyPreviewBtn = document.getElementById('copyPreviewBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const statusMessage = document.getElementById('statusMessage');
const filenameModal = document.getElementById('filenameModal');
const filenameInput = document.getElementById('filenameInput');
const confirmFilenameBtn = document.getElementById('confirmFilenameBtn');
const cancelFilenameBtn = document.getElementById('cancelFilenameBtn');

let pendingDocxData = null;

// Initialize marked
markdownScript.onload = () => {
    marked.setOptions({
        breaks: true,
        gfm: true,
    });
};

// File Upload Handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-100');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-100');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-100');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Handle File Upload
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        markdownInput.value = e.target.result;
        updatePreview();
        showStatus(`File "${file.name}" loaded successfully!`, 'success');
    };
    reader.onerror = () => {
        showStatus('Error reading file', 'error');
    };
    reader.readAsText(file);
}

// Update Preview
markdownInput.addEventListener('input', updatePreview);

let mermaidRenderCount = 0;

if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
}

function updatePreview() {
    const markdown = markdownInput.value;
    if (typeof marked !== 'undefined') {
        const html = marked.parse(markdown);
        preview.innerHTML = html;
        // Highlight code blocks (skip mermaid, it gets rendered as a diagram instead)
        document.querySelectorAll('pre code:not(.language-mermaid)').forEach((block) => {
            hljs.highlightElement(block);
        });
        renderMermaidDiagrams();
    }
}

// Replace ```mermaid code blocks with rendered diagrams
async function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') {
        console.warn('mermaid library not loaded yet');
        return;
    }

    const codeBlocks = preview.querySelectorAll('code.language-mermaid');
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


// Strip characters that are illegal in XML 1.0; if left in, Word cannot parse document.xml
function sanitizeForXml(value) {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '');
}

function stripHtmlTags(value) {
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

// Parse markdown tables
function parseTable(lines, startIndex) {
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

function parseHtmlTable(lines, startIndex) {
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

// Convert Markdown to Word Document
downloadBtn.addEventListener('click', async () => {
    const markdown = markdownInput.value;
    
    if (!markdown.trim()) {
        showStatus('Please enter some markdown content', 'error');
        return;
    }

    try {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Converting...';
        
        console.log('Starting markdown to docx conversion...');
        console.log('Input markdown length:', markdown.length);
        
        const docxElements = await markdownToDocx(markdown);
        console.log('Generated elements:', docxElements.length);
        
        const doc = new docx.Document({
            numbering: {
                config: [{
                    reference: 'markdown-numbered-list',
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
                children: docxElements
            }]
        });

        console.log('Document object created successfully');
        pendingDocxData = doc;
        showFilenameModal();
    } catch (error) {
        console.error('Error during conversion:', error);
        console.error('Error stack:', error.stack);
        showStatus(`Error creating Word document: ${error.message}`, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg> Download Word Document';
    }
});

// Show filename modal
function showFilenameModal() {
    filenameModal.classList.remove('hidden');
    filenameInput.focus();
    filenameInput.select();
}

// Hide filename modal
function hideFilenameModal() {
    filenameModal.classList.add('hidden');
    pendingDocxData = null;
}

// Verify the generated docx is a valid zip with well-formed document.xml before letting the user download it
async function validateDocxBlob(blob) {
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

// Confirm filename and download
confirmFilenameBtn.addEventListener('click', async () => {
    const filename = filenameInput.value.trim() || 'document';
    if (!pendingDocxData) {
        showStatus('No document data available', 'error');
        return;
    }

    try {
        console.log('Starting document conversion to blob...');
        const blob = await docx.Packer.toBlob(pendingDocxData);
        console.log('Blob created successfully:', blob.size, 'bytes');

        const validation = await validateDocxBlob(blob);
        if (!validation.valid) {
            console.error('Generated docx failed validation:', validation.error);
            showStatus(`Export failed validation (${validation.error}). Please try again.`, 'error');
            hideFilenameModal();
            return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        showStatus(`Word document "${filename}.docx" downloaded successfully! 📄`, 'success');
        hideFilenameModal();
    } catch (error) {
        console.error('Error downloading document:', error);
        console.error('Error stack:', error.stack);
        showStatus(`Error downloading document: ${error.message}`, 'error');
        hideFilenameModal();
    }
});

cancelFilenameBtn.addEventListener('click', hideFilenameModal);

// Allow Enter key to confirm
filenameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        confirmFilenameBtn.click();
    }
});

let mermaidExportCount = 0;

// Render a mermaid diagram definition to a PNG image buffer for embedding in the docx
async function renderMermaidToImage(graphDefinition) {
    if (typeof mermaid === 'undefined') {
        throw new Error('Mermaid library not available');
    }
    const renderId = `mermaid-export-${mermaidExportCount++}`;
    const { svg } = await mermaid.render(renderId, graphDefinition);

    const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const svgElement = svgDocument.documentElement;
    const viewBox = svgElement.getAttribute('viewBox');
    const viewBoxParts = viewBox ? viewBox.trim().split(/[\s,]+/).map(Number) : [];
    const sourceWidth = viewBoxParts[2] > 0 ? viewBoxParts[2] : Number.parseFloat(svgElement.getAttribute('width')) || 800;
    const sourceHeight = viewBoxParts[3] > 0 ? viewBoxParts[3] : Number.parseFloat(svgElement.getAttribute('height')) || 600;
    const renderScale = Math.min(2, 1600 / sourceWidth, 1200 / sourceHeight);
    const renderWidth = Math.max(1, Math.round(sourceWidth * renderScale));
    const renderHeight = Math.max(1, Math.round(sourceHeight * renderScale));
    svgElement.setAttribute('width', String(renderWidth));
    svgElement.setAttribute('height', String(renderHeight));
    svgElement.removeAttribute('style');
    const normalizedSvg = new XMLSerializer().serializeToString(svgElement);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert diagram to image'));
                    return;
                }
                blob.arrayBuffer().then((buffer) => {
                    resolve({ buffer, width: renderWidth, height: renderHeight });
                }).catch(reject);
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load diagram image'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(normalizedSvg);
    });
}

// Convert Markdown to Docx Elements
async function markdownToDocx(markdown) {
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
                            try {
                                const { buffer, width, height } = await renderMermaidToImage(codeBlock.trim());
                                const maxWidth = 600;
                                const maxHeight = 680;
                                const fitScale = Math.min(1, maxWidth / width, maxHeight / height);
                                const displayWidth = Math.max(1, Math.round(width * fitScale));
                                const displayHeight = Math.max(1, Math.round(height * fitScale));
                                elements.push(new docx.Paragraph({
                                    children: [new docx.ImageRun({
                                        data: buffer,
                                        transformation: { width: displayWidth, height: displayHeight }
                                    })],
                                    alignment: docx.AlignmentType.CENTER,
                                    spacing: { before: 200, after: 200 }
                                }));
                            } catch (mermaidError) {
                                console.error('Mermaid export error:', mermaidError);
                                elements.push(new docx.Paragraph({
                                    children: [new docx.TextRun({
                                        text: `[Mermaid diagram could not be rendered: ${mermaidError.message}]`,
                                        italics: true,
                                        color: 'B91C1C'
                                    })],
                                    spacing: { before: 200, after: 200 }
                                }));
                            }
                        } else if (codeBlock.trim()) {
                            const codeLines = codeBlock.replace(/\n$/, '').split('\n');
                            const codeRuns = codeLines.map((codeLine, idx) => new docx.TextRun({
                                text: sanitizeForXml(codeLine) || ' ',
                                font: 'Courier New',
                                size: 20,
                                color: '1F2937',
                                break: idx > 0 ? 1 : 0
                            }));
                            elements.push(new docx.Paragraph({
                                children: codeRuns,
                                shading: {
                                    type: docx.ShadingType.CLEAR,
                                    color: 'F0F0F0',
                                    fill: 'F3F4F6'
                                },
                                border: {
                                    top: { color: 'CCCCCC', space: 4, value: 'single', size: 6 },
                                    bottom: { color: 'CCCCCC', space: 4, value: 'single', size: 6 },
                                    left: { color: 'CCCCCC', space: 4, value: 'single', size: 6 },
                                    right: { color: 'CCCCCC', space: 4, value: 'single', size: 6 }
                                },
                                spacing: { before: 200, after: 200 }
                            }));
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
                    elements.push(new docx.Paragraph({
                        children: processInlineFormatting(listItem),
                        bullet: { level: 0 },
                        spacing: { line: 240, after: 100 }
                    }));
                }
                // Handle ordered lists
                else if (line.trim().match(/^\d+\.\s/)) {
                    const match = line.trim().match(/^(\d+)\.\s(.*)$/);
                    if (match) {
                        elements.push(new docx.Paragraph({
                            children: processInlineFormatting(match[2].trim()),
                            numbering: {
                                reference: 'markdown-numbered-list',
                                level: 0
                            },
                            spacing: { line: 240, after: 100 }
                        }));
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

// Create table paragraph
function createTableParagraph(table) {
    const rows = table.rows.map((row, rowIndex) => {
        const isHeaderRow = rowIndex === 0;
        return new docx.TableRow({
            tableHeader: isHeaderRow,
            children: row.map(cell => {
                const cleanCell = stripHtmlTags(cell || '');
                return new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: cleanCell || '',
                            bold: isHeaderRow,
                            color: isHeaderRow ? 'FFFFFF' : '1F2937'
                        })],
                        spacing: { line: 240 }
                    })],
                    borders: {
                        top: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        bottom: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        left: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        right: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 }
                    },
                    shading: isHeaderRow ? {
                        type: docx.ShadingType.CLEAR,
                        color: 'FFFFFF',
                        fill: '2563EB'
                    } : undefined
                });
            })
        });
    });

    return new docx.Table({
        rows: rows,
        width: {
            size: 100,
            type: 'pct'
        },
        borders: {
            top: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            bottom: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            left: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            right: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            insideHorizontal: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            insideVertical: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 }
        }
    });
}

// Process inline formatting (bold, italic, links, code)
function processInlineFormatting(text) {
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

function createClipboardHtml() {
    const copyRoot = preview.cloneNode(true);

    copyRoot.querySelectorAll('table').forEach((table) => {
        table.setAttribute('border', '1');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '8');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = '1px solid #000000';
        table.style.marginBottom = '16px';
    });

    copyRoot.querySelectorAll('th, td').forEach((cell) => {
        cell.setAttribute('border', '1');
        cell.style.border = '1px solid #000000';
        cell.style.padding = '8px 12px';
        cell.style.textAlign = 'left';
    });

    copyRoot.querySelectorAll('th').forEach((header) => {
        header.style.backgroundColor = '#eff6ff';
        header.style.fontWeight = '600';
    });

    return copyRoot.innerHTML;
}

// Copy the rendered preview as rich text so Word and Excel receive formatted content
async function copyFormattedPreview(button) {
    const markdown = markdownInput.value;

    if (!markdown.trim()) {
        showStatus('Nothing to copy', 'error');
        return;
    }

    const html = createClipboardHtml();
    const plainText = preview.innerText;

    try {
        if (window.ClipboardItem && navigator.clipboard.write) {
            const item = new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([plainText], { type: 'text/plain' })
            });
            await navigator.clipboard.write([item]);
        } else {
            await navigator.clipboard.writeText(plainText);
        }

        showStatus('Formatted content copied to clipboard! 📋', 'success');

        if (button) {
            const originalHtml = button.innerHTML;
            const iconSize = button.id === 'copyPreviewBtn' ? 'w-4 h-4' : 'w-5 h-5';
            button.innerHTML = `<svg class="${iconSize}" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg> Copied!`;
            setTimeout(() => {
                button.innerHTML = originalHtml;
            }, 2000);
        }
    } catch (error) {
        console.error('Error copying formatted content:', error);
        showStatus('Failed to copy to clipboard', 'error');
    }
}

copyPreviewBtn.addEventListener('click', () => copyFormattedPreview(copyPreviewBtn));

// Clear All
clearBtn.addEventListener('click', () => {
    if (markdownInput.value.trim()) {
        if (confirm('Are you sure you want to clear all content?')) {
            markdownInput.value = '';
            updatePreview();
            preview.innerHTML = '<p class="text-gray-500">Preview will appear here...</p>';
            showStatus('Content cleared', 'info');
        }
    }
});

// Show Status Message
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'text-green-500', 'text-red-500', 'text-blue-500');
    
    if (type === 'success') {
        statusMessage.classList.add('text-green-500');
    } else if (type === 'error') {
        statusMessage.classList.add('text-red-500');
    } else {
        statusMessage.classList.add('text-blue-500');
    }

    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 4000);
}

// Initialize preview on load
window.addEventListener('load', () => {
    // Add some example markdown
    if (!markdownInput.value) {
        markdownInput.value = `# Welcome to MD to Word Converter

## Features ✨
- **Convert Markdown to Word** documents
- **Copy content** to clipboard
- **Upload .md files** directly
- **Live preview** of your content
- **Table support** with formatting
- **Code blocks** with syntax highlighting
- **Block quotes** and special formatting
- **Choose filename** when downloading

## Supported Markdown

### Headings
\`\`\`
# H1
## H2
### H3
#### H4
\`\`\`

### Text Formatting
- **Bold text** with \`**text**\`
- *Italic text* with \`*text*\`
- \`Inline code\` with backticks
- [Links](https://example.com)

### Tables
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Code Blocks
\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

### Quotes
> This is a block quote
> It can span multiple lines

### Lists
- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2

---

*Made with ✨ Tailwind CSS and docx.js*`;
        updatePreview();
    }
});
