import { markdownInput } from './preview.js';
import { renderMarkdownInto } from '../markdown/renderer.js';
import { splitSlides } from '../presentation/slides.js';

const presentBtn = document.getElementById('presentBtn');
const overlay = document.getElementById('presentationOverlay');
const slideEl = document.getElementById('presentationSlide');
const counterEl = document.getElementById('presentationCounter');
const prevBtn = document.getElementById('presentationPrevBtn');
const nextBtn = document.getElementById('presentationNextBtn');
const closeBtn = document.getElementById('presentationCloseBtn');

let slides = [];
let index = 0;

async function renderSlide() {
    await renderMarkdownInto(slides[index] || '', slideEl);
    counterEl.textContent = `${index + 1} / ${slides.length}`;
}

function openPresentation() {
    slides = splitSlides(markdownInput.value);
    index = 0;
    overlay.classList.remove('hidden');
    renderSlide();
}

function closePresentation() {
    overlay.classList.add('hidden');
}

function goTo(delta) {
    index = Math.min(Math.max(index + delta, 0), slides.length - 1);
    renderSlide();
}

export function initPresentation() {
    presentBtn.addEventListener('click', openPresentation);
    closeBtn.addEventListener('click', closePresentation);
    prevBtn.addEventListener('click', () => goTo(-1));
    nextBtn.addEventListener('click', () => goTo(1));

    document.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden')) return;
        if (e.key === 'Escape') closePresentation();
        else if (e.key === 'ArrowRight' || e.key === ' ') goTo(1);
        else if (e.key === 'ArrowLeft') goTo(-1);
    });
}
