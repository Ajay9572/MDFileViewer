import { initPreview, updatePreview, resetPreview, markdownInput, preview } from './ui/preview.js';
import { initModal, showFilenameModal } from './ui/modal.js';
import { initFileHandler } from './file/file-handler.js';
import { showStatus } from './ui/notifications.js';
import { markdownToDocx, createDocxDocument } from './docx/converter.js';
import { initTheme, isDarkMode } from './ui/theme.js';
import { initToc } from './ui/toc.js';
import { initSearch } from './ui/search.js';
import { exportHtml } from './export/html-export.js';
import { exportPdf } from './export/pdf-export.js';
import { initDirection } from './ui/direction.js';
import { initPresentation } from './ui/presentation.js';
import { initMindmap } from './ui/mindmap.js';
import { initAnnotations } from './ui/annotations.js';
import { initFolderBrowser } from './ui/folder-panel.js';

const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const exportHtmlBtn = document.getElementById('exportHtmlBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

const DOWNLOAD_BTN_DEFAULT_HTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg> Download Word Document';
const DOWNLOAD_BTN_LOADING_HTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Converting...';

const EXAMPLE_MARKDOWN = `# Welcome to MD to Word Converter

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

// Convert Markdown to Word Document
downloadBtn.addEventListener('click', async () => {
    const markdown = markdownInput.value;

    if (!markdown.trim()) {
        showStatus('Please enter some markdown content', 'error');
        return;
    }

    try {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = DOWNLOAD_BTN_LOADING_HTML;

        console.log('Starting markdown to docx conversion...');
        console.log('Input markdown length:', markdown.length);

        const docxElements = await markdownToDocx(markdown);
        console.log('Generated elements:', docxElements.length);

        const doc = createDocxDocument(docxElements);
        console.log('Document object created successfully');

        showFilenameModal(doc);
    } catch (error) {
        console.error('Error during conversion:', error);
        console.error('Error stack:', error.stack);
        showStatus(`Error creating Word document: ${error.message}`, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = DOWNLOAD_BTN_DEFAULT_HTML;
    }
});

// Clear All
clearBtn.addEventListener('click', () => {
    if (markdownInput.value.trim()) {
        if (confirm('Are you sure you want to clear all content?')) {
            markdownInput.value = '';
            updatePreview();
            resetPreview();
            showStatus('Content cleared', 'info');
        }
    }
});

exportHtmlBtn.addEventListener('click', () => {
    if (!markdownInput.value.trim()) {
        showStatus('Please enter some markdown content', 'error');
        return;
    }
    exportHtml(preview, 'document', isDarkMode());
    showStatus('HTML file downloaded successfully! 🌐', 'success');
});

exportPdfBtn.addEventListener('click', async () => {
    if (!markdownInput.value.trim()) {
        showStatus('Please enter some markdown content', 'error');
        return;
    }
    try {
        await exportPdf(preview, 'document', isDarkMode());
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showStatus(`Error exporting PDF: ${error.message}`, 'error');
    }
});

initTheme();
initPreview();
initModal();
initFileHandler();
initToc();
initSearch();
initDirection();
initPresentation();
initMindmap();
initAnnotations();
initFolderBrowser();

// Initialize preview on load
window.addEventListener('load', () => {
    if (!markdownInput.value) {
        markdownInput.value = EXAMPLE_MARKDOWN;
        updatePreview();
    }
});
