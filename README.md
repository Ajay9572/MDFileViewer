# MD to Word Converter 📄

A beautiful, modern web application that converts Markdown and text files into Word documents with a live preview and copy-to-clipboard functionality. Built with a clean light theme for comfortable viewing.

## Features ✨

- **📝 Markdown to Word Conversion** - Convert your markdown content into professional Word documents
- **📤 File Upload Support** - Upload `.md` and `.txt` files directly (drag & drop or click to browse)
- **👁️ Live Preview** - See your markdown rendered in real-time
- **📋 Copy to Clipboard** - Quickly copy your content to clipboard
- **📊 Table Support** - Full markdown table support with proper formatting in Word documents
- **💻 Code Blocks & Snippets** - Syntax highlighting and proper code block formatting in exports
- **💬 Block Quotes** - Beautiful formatted quotes with left border styling
- **📝 Headers & Lists** - Multiple heading levels (H1-H4), ordered and unordered lists
- **💾 Custom Filenames** - Choose your document filename when downloading
- **🎨 Light Theme UI** - Beautiful gradient design with Tailwind CSS (light mode)
- **⚡ No Server Needed** - Runs entirely in the browser (all libraries via CDN)
- **📱 Responsive Design** - Works on desktop and mobile devices

## How to Use 🚀

### Method 1: Drag and Drop
1. Drag a `.md` or `.txt` file onto the "Upload Markdown File" area
2. Your content will automatically load into the editor
3. The preview will update in real-time
4. Click "Download Word Document" to save as `.docx`
5. Enter your desired filename in the popup
6. Confirm to download

### Method 2: Click to Upload
1. Click on the upload area to browse your files
2. Select a `.md` or `.txt` file
3. Your content will load and preview will update
4. Download or copy as needed

### Method 3: Paste Content
1. Paste your markdown content directly in the text area
2. Watch the live preview update in real-time
3. Use the action buttons to download or copy

## Supported Markdown Syntax 📚

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

### Text Formatting
- **Bold**: `**bold text**` or `__bold text__`
- *Italic*: `*italic text*` or `_italic text_`
- `Inline Code`: `` `code` ``

### Code Blocks
````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

Supports language specification for better formatting.

### Tables
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

Tables are converted with:
- Blue header row
- Proper cell spacing
- Border styling for better readability

### Block Quotes
```markdown
> This is a block quote
> It can span multiple lines
> and will be italicized with a left border
```

### Lists
```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
```

### Horizontal Rules
```markdown
---
```

## Action Buttons 🎯

- **📥 Download Word Document** - Creates and downloads a `.docx` file with your content
  - Opens a popup to choose your filename
  - Converts all markdown formatting to Word format
- **📋 Copy to Clipboard** - Copies the markdown text to your clipboard
- **🗑️ Clear** - Clears all content (with confirmation)

## File Requirements 📋

- Supported formats: `.md`, `.txt`
- Maximum file size: Limited by browser memory (typically several MB)
- Encoding: UTF-8

## Technical Details 🔧

### Technologies Used
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework via CDN (light theme)
- **JavaScript (ES6+)** - Interactive functionality
- **marked.js** - Markdown parsing
- **docx.js** - Word document generation
- **highlight.js** - Code syntax highlighting

### Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### What Gets Converted

When exporting to Word, the following elements are preserved:
- ✅ Heading levels (H1-H4) with proper sizing
- ✅ Bold and italic formatting
- ✅ Inline code with background color
- ✅ Code blocks with border and background
- ✅ Tables with header styling and borders
- ✅ Block quotes with left border accent
- ✅ Ordered and unordered lists
- ✅ Horizontal rules
- ✅ Paragraph spacing and line breaks

## Installation 💻

### Option 1: Direct Usage
Simply open `index.html` in your web browser. No installation required!

```bash
# If you want to serve it locally with Python:
python -m http.server 8000
# Then open http://localhost:8000
```

### Option 2: With Node.js HTTP Server
```bash
# Install http-server globally
npm install -g http-server

# Run from the project directory
http-server

# Open http://localhost:8080
```

## File Structure 📁

```
MDFileViewer/
├── index.html          # Main HTML file with UI structure (light theme)
├── script.js           # JavaScript functionality with table & quote support
└── README.md          # This file
```

## Features in Detail 🎨

### Live Preview
- Real-time rendering of your markdown
- Syntax highlighting for code blocks
- Styled output matching professional documents
- Light theme for comfortable viewing

### Word Document Export
- Converts markdown formatting to Word formatting
- Preserves heading levels (H1, H2, H3, H4)
- Maintains text formatting (bold, italic, inline code)
- Converts tables with proper borders and styling
- Formats block quotes with left border
- Generates proper Word document structure
- **New**: Filename customization before download

### Table Conversion
- Markdown tables are parsed and converted accurately
- Header rows have blue background color
- All cells properly spaced and bordered
- Column widths auto-calculated

### Code Block Formatting
- Separate code blocks with bordered boxes
- Background color for visibility
- Language-specific syntax highlighting support
- Inline code highlighted with background color

### Copy to Clipboard
- One-click copy functionality
- Browser notification feedback
- Supports all text content

## Tips & Tricks 💡

1. **Multiple Headings**: Use different heading levels to organize your content
2. **Code Blocks**: Wrap code with triple backticks for better formatting
   ```javascript
   // Specify language for syntax highlighting
   const example = "code";
   ```
3. **Tables**: Use pipe characters `|` to create properly formatted tables
4. **Quotes**: Use `>` to create block quotes that span multiple lines
5. **Quick Copy**: Use the copy button to share content via messaging apps
6. **File Size**: For best performance, keep files under 1MB
7. **Backup**: Always keep backups of important documents
8. **Filename**: The popup lets you rename your document before saving

## Troubleshooting 🔧

### Word document won't download
- Check browser download settings
- Ensure JavaScript is enabled
- Try a different browser
- Check console for error messages (F12)

### Preview not updating
- Check for console errors (F12)
- Ensure markdown syntax is correct
- Try refreshing the page
- Clear browser cache

### File upload not working
- Ensure file is `.md` or `.txt` format
- Check file permissions
- Try drag-and-drop if click upload fails
- Check file encoding (UTF-8 recommended)

### Tables not converting properly
- Ensure table format uses pipes `|` as separators
- Check that separator row uses `---` (at least 3 hyphens)
- Verify all rows have same number of cells as header
- Add spaces around cell content

### Filename popup not appearing
- Ensure JavaScript is enabled
- Clear browser cache and reload
- Try with a smaller markdown content
- Check console for errors (F12)

## Browser Console Errors? 🐛

If you encounter any issues:
1. Press `F12` to open Developer Tools
2. Check the Console tab for error messages
3. Verify internet connection (CDN resources need it)
4. Clear browser cache and reload

## Performance Notes ⚡

- All processing happens in your browser (no server needed)
- Files are not uploaded anywhere - everything stays local
- Conversion speed depends on file size and your device
- CDN resources are cached by your browser for faster loads
- Light theme uses optimized colors for fast rendering

## Future Enhancements 🚀

Potential features for future versions:
- PDF export option
- Dark mode toggle
- Multiple theme options
- Syntax highlighting customization
- Document styling options (fonts, colors, margins)
- Batch file processing
- Import from cloud storage
- Real-time collaboration

## Light Theme Design 🌅

The converter features a beautiful light theme with:
- Soft gradient backgrounds (blue to purple tones)
- White content areas with subtle borders
- High contrast text for readability
- Color-coded buttons for different actions
- Smooth hover animations and transitions
- Responsive padding and spacing

## License 📄

This project is open source and free to use for personal and commercial purposes.

## Support 💬

For issues or suggestions, feel free to create an issue or contribute to the project.

## Changelog 📝

### Version 2.0 (Current)
- ✨ Added table support with proper formatting
- ✨ Added block quote support with styling
- ✨ Improved code block formatting with borders
- ✨ Added H4 heading support
- ✨ Filename popup dialog for downloads
- 🎨 Changed UI to light theme
- ✨ Better inline code formatting
- ✨ Support for ordered and unordered lists
- ✨ Horizontal rule support
- 🐛 Improved markdown parsing accuracy

### Version 1.0
- Initial release with basic markdown to Word conversion
- Copy to clipboard functionality
- File upload and drag-and-drop
- Live preview

---

**Enjoy converting your markdown documents!** ✨
