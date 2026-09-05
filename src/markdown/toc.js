function slugify(text, usedSlugs) {
    let slug = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') || 'section';

    let unique = slug;
    let suffix = 1;
    while (usedSlugs.has(unique)) {
        unique = `${slug}-${suffix++}`;
    }
    usedSlugs.add(unique);
    return unique;
}

// Assign anchor ids to headings inside containerEl and return a flat outline
export function buildToc(containerEl) {
    const headings = containerEl.querySelectorAll('h1, h2, h3, h4');
    const usedSlugs = new Set();
    const outline = [];

    headings.forEach((heading) => {
        const text = heading.textContent.trim();
        if (!text) return;
        heading.id = slugify(text, usedSlugs);
        outline.push({
            level: Number(heading.tagName.slice(1)),
            text,
            id: heading.id
        });
    });

    return outline;
}
