/**
 * Export constellation SVG as PNG or SVG file.
 */

const DARK_BG = '#050710';
const EXPORT_SIZE = 2400; // 2400px for high-res PNG

/**
 * Clone the SVG, optionally inject a background rect, and return a serialized string.
 */
function prepareSvg(svgEl, { transparent = false } = {}) {
  const clone = svgEl.cloneNode(true);

  // Remove hit-area circles (transparent fill, large radius, cursor-pointer)
  clone.querySelectorAll('circle[fill="transparent"]').forEach(el => el.remove());

  // Ensure dimensions are set for standalone SVG
  const vb = clone.getAttribute('viewBox') || '0 0 800 800';
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('width', EXPORT_SIZE);
  clone.setAttribute('height', EXPORT_SIZE);

  if (!transparent) {
    const [x, y, w, h] = vb.split(' ').map(Number);
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', x);
    bg.setAttribute('y', y);
    bg.setAttribute('width', w);
    bg.setAttribute('height', h);
    bg.setAttribute('fill', DARK_BG);
    clone.insertBefore(bg, clone.firstChild);
  }

  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export constellation as SVG file.
 */
export function exportSvg(svgEl, { filename = 'constellation.svg', transparent = false } = {}) {
  const svgString = prepareSvg(svgEl, { transparent });
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Export constellation as PNG file.
 */
export function exportPng(svgEl, { filename = 'constellation.png', transparent = false } = {}) {
  const svgString = prepareSvg(svgEl, { transparent });
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!transparent) {
      ctx.fillStyle = DARK_BG;
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    }

    ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) downloadBlob(pngBlob, filename);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('Failed to render constellation to PNG');
  };
  img.src = url;
}
