'use client';

/**
 * Read an image File into a small base64 data-URL — profile photos and the
 * forgot-password identity shots must stay tiny (SQLite rows, sync payloads).
 * Downscaled to fit 480×480 and re-encoded as JPEG q0.72 (~60-90 KB).
 */
export function fileToSmallDataUrl(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('readFailed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decodeFailed'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvasFailed'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
