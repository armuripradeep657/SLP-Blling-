'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * CODE 128 — the ONLY barcode format in this app (no QR anywhere).
 * Renders a real, scannable 1D barcode as an inline SVG via JsBarcode, so
 * it prints sharply, captures cleanly into the bill PNG/PDF and works with
 * USB / Bluetooth / camera scanners.
 */
export default function Barcode({
  value,
  height = 56,
  width = 1.6,
  margin = 10,
  className,
}: {
  value: string;
  height?: number;
  width?: number;
  /** quiet zone in modules — Code 128 REQUIRES ~10 clear modules on each side */
  margin?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        displayValue: false,
        margin,
        height,
        width,
        background: '#ffffff',
        lineColor: '#111111',
      });
    } catch {
      /* invalid character for CODE128 — the SVG stays empty */
    }
  }, [value, height, width, margin]);

  if (!value) return null;
  return <svg ref={ref} data-barcode={value} className={className} role="img" aria-label={`Code 128 barcode ${value}`} />;
}
