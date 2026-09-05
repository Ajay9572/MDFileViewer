// Split markdown into slides on lines that are exactly a horizontal rule (`---`)
export function splitSlides(markdown) {
    const lines = markdown.split('\n');
    const slides = [];
    let current = [];

    lines.forEach((line) => {
        if (/^\s*---\s*$/.test(line) && current.some((l) => l.trim())) {
            slides.push(current.join('\n'));
            current = [];
        } else {
            current.push(line);
        }
    });

    if (current.some((l) => l.trim())) {
        slides.push(current.join('\n'));
    }

    return slides.length ? slides : [markdown];
}
