import { sanitizeForXml } from '../markdown/parser.js';
import { renderMermaidToImage } from '../mermaid/renderer.js';
import { renderGraphvizToImage } from '../diagrams/graphviz.js';
import { renderPlantUmlToImage } from '../diagrams/plantuml.js';

// Shared by all diagram languages: render to {buffer,width,height}, fit to a max box, embed as an image paragraph
async function buildDiagramImageParagraph(renderFn, codeBlock, label) {
    try {
        const { buffer, width, height } = await renderFn(codeBlock.trim());
        const maxWidth = 600;
        const maxHeight = 680;
        const fitScale = Math.min(1, maxWidth / width, maxHeight / height);
        const displayWidth = Math.max(1, Math.round(width * fitScale));
        const displayHeight = Math.max(1, Math.round(height * fitScale));
        return new docx.Paragraph({
            children: [new docx.ImageRun({
                data: buffer,
                transformation: { width: displayWidth, height: displayHeight }
            })],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
        });
    } catch (error) {
        console.error(`${label} export error:`, error);
        return new docx.Paragraph({
            children: [new docx.TextRun({
                text: `[${label} diagram could not be rendered: ${error.message}]`,
                italics: true,
                color: 'B91C1C'
            })],
            spacing: { before: 200, after: 200 }
        });
    }
}

// Render a fenced ```mermaid code block as an embedded image paragraph
export function buildMermaidImageParagraph(codeBlock) {
    return buildDiagramImageParagraph(renderMermaidToImage, codeBlock, 'Mermaid');
}

// Render a fenced ```dot / ```graphviz code block as an embedded image paragraph
export function buildGraphvizImageParagraph(codeBlock) {
    return buildDiagramImageParagraph(renderGraphvizToImage, codeBlock, 'Graphviz');
}

// Render a fenced ```plantuml / ```puml code block as an embedded image paragraph
export function buildPlantUmlImageParagraph(codeBlock) {
    return buildDiagramImageParagraph(renderPlantUmlToImage, codeBlock, 'PlantUML');
}

// Render a fenced ```code block as a monospaced, shaded paragraph
export function buildCodeBlockParagraph(codeBlock) {
    const codeLines = codeBlock.replace(/\n$/, '').split('\n');
    const codeRuns = codeLines.map((codeLine, idx) => new docx.TextRun({
        text: sanitizeForXml(codeLine) || ' ',
        font: 'Courier New',
        size: 20,
        color: '1F2937',
        break: idx > 0 ? 1 : 0
    }));
    return new docx.Paragraph({
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
    });
}
