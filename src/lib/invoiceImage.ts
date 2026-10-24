'use client';

import { toPng } from 'html-to-image';

/**
 * Capture a DOM node (thermal slip) into a high-res PNG blob.
 * pixelRatio 3 gives crisp result on mobile screens & WhatsApp.
 */
export async function captureSlipPng(node: HTMLElement, pixelRatio = 3): Promise<Blob> {
  const dataUrl = await toPng(node, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
    skipFonts: false,
  });
  const res = await fetch(dataUrl);
  return await res.blob();
}

export function slipFileName(invoiceNo: string): string {
  const safe = invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${safe}.png`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareFiles(files: File[]): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Share invoice image via the native mobile share sheet (WhatsApp, SMS, etc.).
 * Returns 'shared' if the sheet opened, 'unsupported' otherwise.
 */
export async function shareImage(
  blob: Blob,
  fileName: string,
  text: string
): Promise<'shared' | 'unsupported'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (canShareFiles([file])) {
    await navigator.share({ files: [file], text });
    return 'shared';
  }
  return 'unsupported';
}

/** Print an invoice image via a popup window (works on desktop + Android Chrome). */
export function printImage(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open('', '_blank', 'width=420,height=680');
  if (!w) return false;
  w.document.write(
    `<html><head><title>Print Bill</title><style>
      @page { margin: 4mm; }
      body { margin:0; display:flex; justify-content:center; }
      img { max-width:100%; }
    </style></head><body><img src="${url}" onload="window.focus();window.print();" /></body></html>`
  );
  w.document.close();
  return true;
}
