const STORAGE_KEY = 'md-viewer-annotations';

export function loadAnnotations() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveAnnotations(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addAnnotation(text, note) {
    const list = loadAnnotations();
    list.push({ id: Date.now(), text, note });
    saveAnnotations(list);
    return list;
}

export function removeAnnotation(id) {
    const list = loadAnnotations().filter((a) => a.id !== id);
    saveAnnotations(list);
    return list;
}
