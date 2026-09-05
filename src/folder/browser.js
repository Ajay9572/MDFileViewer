const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.txt'];

export function isFolderBrowserSupported() {
    return typeof window.showDirectoryPicker === 'function';
}

function isMarkdownFile(name) {
    return MARKDOWN_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
}

// Recursively walk a directory handle, returning [{ path, handle }] for markdown files
async function collectFiles(dirHandle, basePath = '') {
    const results = [];
    for await (const [name, handle] of dirHandle.entries()) {
        const path = basePath ? `${basePath}/${name}` : name;
        if (handle.kind === 'file' && isMarkdownFile(name)) {
            results.push({ path, handle });
        } else if (handle.kind === 'directory') {
            results.push(...await collectFiles(handle, path));
        }
    }
    return results;
}

export async function pickFolder() {
    const dirHandle = await window.showDirectoryPicker();
    const files = await collectFiles(dirHandle);
    return { dirHandle, files };
}

export async function readFileEntry(entry) {
    const file = await entry.handle.getFile();
    const content = await file.text();
    return { content, lastModified: file.lastModified };
}
