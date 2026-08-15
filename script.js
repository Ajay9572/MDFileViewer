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
const copyBtn = document.getElementById('copyBtn');
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

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scale = 2;
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth * scale;
            canvas.height = img.naturalHeight * scale;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert diagram to image'));
                    return;
                }
                blob.arrayBuffer().then((buffer) => {
                    resolve({ buffer, width: img.naturalWidth, height: img.naturalHeight });
                }).catch(reject);
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load diagram image'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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
                                const maxWidth = 500;
                                const displayWidth = Math.min(width, maxWidth);
                                const displayHeight = displayWidth * (height / width);
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
                                text: codeLine.length > 0 ? codeLine : ' ',
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
                        text: quoteLine,
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
                            text: line.replace('# ', '').trim(),
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
                            text: line.replace('## ', '').trim(),
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
                            text: line.replace('### ', '').trim(),
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
                            text: line.replace('#### ', '').trim(),
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
                            numbering: { level: 0, instance: 0 },
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
                return new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: cell,
                            bold: isHeaderRow,
                            color: isHeaderRow ? 'FFFFFF' : '1F2937'
                        })],
                        spacing: { line: 240 }
                    })],
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
            top: { color: '999999', space: 1, value: 'single', size: 6 },
            bottom: { color: '999999', space: 1, value: 'single', size: 6 },
            left: { color: '999999', space: 1, value: 'single', size: 6 },
            right: { color: '999999', space: 1, value: 'single', size: 6 },
            insideHorizontal: { color: '999999', space: 1, value: 'single', size: 6 },
            insideVertical: { color: '999999', space: 1, value: 'single', size: 6 }
        }
    });
}

// Process inline formatting (bold, italic, links, code)
function processInlineFormatting(text) {
    try {
        if (!text || typeof text !== 'string') {
            return [new docx.TextRun('')];
        }

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

// Copy to Clipboard
copyBtn.addEventListener('click', async () => {
    const markdown = markdownInput.value;
    
    if (!markdown.trim()) {
        showStatus('Nothing to copy', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(markdown);
        showStatus('Content copied to clipboard! 📋', 'success');
        
        // Animate button
        copyBtn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> Copy to Clipboard';
        }, 2000);
    } catch (error) {
        showStatus('Failed to copy to clipboard', 'error');
    }
});

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
