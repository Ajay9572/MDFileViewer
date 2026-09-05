import { renderMermaidDiagrams } from '../mermaid/renderer.js';
import { renderGraphvizDiagrams } from '../diagrams/graphviz.js';
import { renderPlantUmlDiagrams } from '../diagrams/plantuml.js';
import { applyGithubAlerts } from './alerts.js';
import { renderMath } from './math.js';

const DIAGRAM_LANGUAGES = ['mermaid', 'dot', 'graphviz', 'plantuml', 'puml'];
const DIAGRAM_SKIP_SELECTOR = DIAGRAM_LANGUAGES.map((lang) => `:not(.language-${lang})`).join('');

export function initMarked() {
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }
}

// Parse markdown to HTML inside containerEl, then syntax-highlight code and render diagrams/math
export async function renderMarkdownInto(markdown, containerEl) {
    if (typeof marked === 'undefined') return;

    containerEl.innerHTML = marked.parse(markdown);
    applyGithubAlerts(containerEl);
    // Highlight code blocks (skip diagram languages, they get rendered as images instead)
    containerEl.querySelectorAll(`pre code${DIAGRAM_SKIP_SELECTOR}`).forEach((block) => {
        hljs.highlightElement(block);
    });
    await renderMermaidDiagrams(containerEl);
    await renderGraphvizDiagrams(containerEl);
    renderPlantUmlDiagrams(containerEl);
    renderMath(containerEl);
}
