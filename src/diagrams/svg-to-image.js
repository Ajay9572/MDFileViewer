// Rasterize an SVG string to a PNG buffer for embedding in docx.ImageRun
export async function svgToPngBuffer(svgString, { maxRenderWidth = 1600, maxRenderHeight = 1200 } = {}) {
    const svgDocument = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDocument.documentElement;
    const viewBox = svgElement.getAttribute('viewBox');
    const viewBoxParts = viewBox ? viewBox.trim().split(/[\s,]+/).map(Number) : [];
    const sourceWidth = viewBoxParts[2] > 0 ? viewBoxParts[2] : Number.parseFloat(svgElement.getAttribute('width')) || 800;
    const sourceHeight = viewBoxParts[3] > 0 ? viewBoxParts[3] : Number.parseFloat(svgElement.getAttribute('height')) || 600;
    const renderScale = Math.min(2, maxRenderWidth / sourceWidth, maxRenderHeight / sourceHeight);
    const renderWidth = Math.max(1, Math.round(sourceWidth * renderScale));
    const renderHeight = Math.max(1, Math.round(sourceHeight * renderScale));
    svgElement.setAttribute('width', String(renderWidth));
    svgElement.setAttribute('height', String(renderHeight));
    svgElement.removeAttribute('style');
    const normalizedSvg = new XMLSerializer().serializeToString(svgElement);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert diagram to image'));
                    return;
                }
                blob.arrayBuffer().then((buffer) => {
                    resolve({ buffer, width: renderWidth, height: renderHeight });
                }).catch(reject);
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load diagram image'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(normalizedSvg);
    });
}
