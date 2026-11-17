'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/**
 * UPI PAYMENT QR — the ONLY QR in this app, and it is always a PAYMENT QR:
 * it encodes the `upi://pay?pa=<saved UPI ID>&am=<amount>&tn=<billRef>` URI
 * built from the UPI ID saved in Settings, so any UPI app (GPay / PhonePe /
 * Paytm / BHIM) opens a pre-filled payment to the shop.
 *
 * Strictly separate from bill verification — verification is the small CODE
 * 128 1-D barcode (Barcode.tsx), never a QR.
 *
 * The UPI ID is validated first (name@bank shape): a malformed ID would
 * produce a QR every payment app rejects, so this component refuses to
 * render one and the caller shows the plain UPI ID text instead.
 * Rendered as an inline SVG so html-to-image captures it into the bill PNG
 * crisply at any print size.
 */
export default function QrCode({
  value,
  size = 120,
  className,
  label,
}: {
  value: string;
  size?: number;
  className?: string;
  /** short caption printed under the code (e.g. "QR CODE – MAKE PAYMENT") */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    // the dark colour keeps contrast high for phone cameras; white quiet zone
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((s) => {
        if (live) setSvg(s);
      })
      .catch(() => {
        if (live) setSvg(null);
      });
    return () => {
      live = false;
    };
  }, [value, size]);

  if (!svg) return null;
  return (
    <div
      ref={ref}
      data-qr={value}
      data-qr-label={label || undefined}
      className={className}
      style={{ width: size, lineHeight: 0, background: '#ffffff' }}
      role="img"
      aria-label={label || `UPI payment QR code ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
