const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

function encode6bit(b) {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return '-';
    if (b === 1) return '_';
    return '?';
}

function append3bytes(b1, b2, b3) {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3F;
    return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
}

function encode64(data) {
    let result = '';
    for (let i = 0; i < data.length; i += 3) {
        if (i + 2 === data.length) {
            result += append3bytes(data[i], data[i + 1], 0);
        } else if (i + 1 === data.length) {
            result += append3bytes(data[i], 0, 0);
        } else {
            result += append3bytes(data[i], data[i + 1], data[i + 2]);
        }
    }
    return result;
}

// PlantUML's public server expects utf8 text deflated (raw, no zlib header) then custom base64
function encodePlantUml(text) {
    if (typeof pako === 'undefined') {
        throw new Error('pako library not available');
    }
    const utf8Bytes = new TextEncoder().encode(text);
    const compressed = pako.deflateRaw(utf8Bytes, { level: 9 });
    return encode64(compressed);
}

function getPlantUmlImageUrl(text, format) {
    return `${PLANTUML_SERVER}/${format}/${encodePlantUml(text)}`;
}

// Replace ```plantuml / ```puml code blocks inside containerEl with rendered diagram images
export function renderPlantUmlDiagrams(containerEl) {
    const codeBlocks = containerEl.querySelectorAll('code.language-plantuml, code.language-puml');
    codeBlocks.forEach((codeEl) => {
        const text = codeEl.textContent;
        const pre = codeEl.closest('pre') || codeEl;
        try {
            const img = document.createElement('img');
            img.src = getPlantUmlImageUrl(text, 'svg');
            img.alt = 'PlantUML diagram';
            img.className = 'plantuml-diagram';
            img.onerror = () => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'mermaid-error';
                errorDiv.textContent = 'PlantUML diagram could not be loaded (requires network access to plantuml.com)';
                img.replaceWith(errorDiv);
            };
            const container = document.createElement('div');
            container.className = 'plantuml';
            container.appendChild(img);
            pre.replaceWith(container);
        } catch (error) {
            console.error('Error rendering PlantUML diagram:', error);
        }
    });
}

function getImageDimensions(buffer) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([buffer], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to read PlantUML image dimensions'));
        };
        img.src = url;
    });
}

// Fetch a PlantUML diagram as a PNG buffer for embedding in the docx
export async function renderPlantUmlToImage(text) {
    const response = await fetch(getPlantUmlImageUrl(text, 'png'));
    if (!response.ok) {
        throw new Error(`PlantUML server returned ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const { width, height } = await getImageDimensions(buffer);
    return { buffer, width, height };
}
