'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Render a string into a QR PNG data URL (shared by thermal slip + invoice) */
export function useQrDataUrl(value: string): string {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    // empty value → nothing to render (callers guard with `qr && value`)
    if (!value) return;
    let alive = true;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [value]);

  return url;
}
