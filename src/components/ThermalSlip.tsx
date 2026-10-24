'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { fmt, fmtShort, upiUri } from '@/lib/billing';
import type { BusinessSettings, Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice;
  settings: BusinessSettings;
  /** ref to the outer node for html-to-image capture */
  rootRef?: (node: HTMLDivElement | null) => void;
}

/**
 * Thermal receipt rendered with INLINE styles + hex colors only,
 * so html-to-image rasterizes it perfectly (no Tailwind/oklch issues).
 */
export default function ThermalSlip({ invoice, settings, rootRef }: Props) {
  const w = settings.slipWidthMm === 58 ? 220 : 304;
  const baseFont = settings.slipWidthMm === 58 ? 9.5 : 11;

  /** Bill fully settled — show PAID stamp instead of any QR */
  const isFullyPaid = invoice.totals.balance <= 0;

  /** UPI QR for the remaining BALANCE only (hidden once fully paid) — UPI ID only, no payee name */
  const upiString = useMemo(() => {
    if (isFullyPaid || !settings.upiId) return '';
    return upiUri(settings.upiId, invoice.totals.balance, invoice.no);
  }, [isFullyPaid, settings.upiId, invoice]);

  /** Fallback QR: shop WhatsApp chat link (when no UPI ID is configured) */
  const waString = useMemo(() => {
    if (isFullyPaid || settings.upiId) return '';
    const shop = (settings.whatsappNumber || settings.phone || '').replace(/\D/g, '');
    const ten = shop.length > 10 ? shop.slice(-10) : shop;
    return ten.length === 10 ? `https://wa.me/91${ten}?text=${encodeURIComponent(`Hi, regarding bill ${invoice.no}`)}` : '';
  }, [isFullyPaid, settings.upiId, settings.whatsappNumber, settings.phone, invoice.no]);

  const qrString = upiString || waString;
  const isUpiQr = !!upiString;

  const [qr, setQr] = useState<string>('');
  useEffect(() => {
    if (!qrString) return;
    let alive = true;
    QRCode.toDataURL(qrString, {
      margin: 1,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (alive) setQr(url);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [qrString]);

  const dash: React.CSSProperties = {
    borderTop: '1.5px dashed #1a1a1a',
    margin: `${baseFont * 0.55}px 0`,
  };
  const d = new Date(invoice.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
  };

  return (
    <div
      ref={rootRef}
      style={{
        width: w,
        background: '#ffffff',
        color: '#111111',
        fontFamily: '"Courier New", Courier, ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: baseFont,
        lineHeight: 1.45,
        padding: '12px 10px 14px',
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <img
          src="/narasimha-logo.jpg"
          alt="Sri Lakshmi Penchil Narasimha Swamy"
          width={Math.round(w * 0.24)}
          height={Math.round(w * 0.24)}
          style={{
            display: 'block',
            margin: '0 auto 5px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #1d4ed8',
          }}
        />
        <div style={{ fontWeight: 700, fontSize: baseFont + 2.5, textTransform: 'uppercase', letterSpacing: 0.2 }}>
          {settings.companyName}
        </div>
        {settings.address ? (
          <div style={{ fontSize: baseFont - 1, whiteSpace: 'pre-wrap' }}>{settings.address}</div>
        ) : null}
        {settings.phone ? <div>Ph: {settings.phone}</div> : null}
        <div style={{ fontSize: baseFont - 0.5, marginTop: 2 }}>Proprietor: {settings.ownerName}</div>
      </div>

      <div style={dash} />

      {/* Meta */}
      <div style={row}>
        <span style={{ fontWeight: 700 }}>{invoice.no}</span>
        <span>
          {dateStr} {timeStr}
        </span>
      </div>
      {invoice.customer.name ? (
        <div style={{ marginTop: 2 }}>
          <span style={{ color: '#444' }}>Customer: </span>
          <span style={{ fontWeight: 700 }}>{invoice.customer.name}</span>
        </div>
      ) : null}
      {invoice.customer.phone ? <div>Mobile: {invoice.customer.phone}</div> : null}
      {invoice.customer.address ? (
        <div style={{ fontSize: baseFont - 1 }}>{invoice.customer.address}</div>
      ) : null}

      <div style={dash} />

      {/* Items */}
      <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
        <span>ITEM / SIZE</span>
        <span>AMOUNT</span>
      </div>
      {invoice.items.map((it, idx) => (
        <div key={idx} style={{ marginTop: idx === 0 ? 3 : 6 }}>
          <div style={row}>
            <span style={{ fontWeight: 700 }}>
              {idx + 1}. {it.name}
            </span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(it.price * it.qty)}</span>
          </div>
          <div style={{ color: '#333' }}>
            Size: {it.size} &nbsp;|&nbsp; {it.qty} x {fmtShort(it.price)}
          </div>
        </div>
      ))}

      <div style={dash} />

      {/* Totals */}
      <div style={row}>
        <span>Subtotal</span>
        <span>Rs. {fmt(invoice.totals.subtotal)}</span>
      </div>
      {invoice.totals.discount > 0 ? (
        <div style={row}>
          <span>
            Discount{invoice.discountType === 'percent' ? ` (${invoice.discountValue}%)` : ''}
          </span>
          <span>- Rs. {fmt(invoice.totals.discount)}</span>
        </div>
      ) : null}
      {(invoice.labourCharge || 0) > 0 ? (
        <div style={row}>
          <span>Labour Charges</span>
          <span>Rs. {fmt(invoice.labourCharge)}</span>
        </div>
      ) : null}
      {(invoice.autoCharge || 0) > 0 ? (
        <div style={row}>
          <span>Auto Charges</span>
          <span>Rs. {fmt(invoice.autoCharge)}</span>
        </div>
      ) : null}
      {invoice.roundOff && Math.abs(invoice.totals.roundOff) >= 0.005 ? (
        <div style={row}>
          <span>Round Off</span>
          <span>{invoice.totals.roundOff >= 0 ? '+' : '-'} Rs. {fmt(Math.abs(invoice.totals.roundOff))}</span>
        </div>
      ) : null}

      <div
        style={{
          ...row,
          marginTop: 5,
          paddingTop: 5,
          borderTop: '2px solid #111',
          fontWeight: 700,
          fontSize: baseFont + 4.5,
        }}
      >
        <span>TOTAL</span>
        <span>Rs. {fmt(invoice.totals.total)}</span>
      </div>

      <div style={{ ...row, marginTop: 4 }}>
        <span>Payment</span>
        <span style={{ fontWeight: 700 }}>{invoice.paymentMode}</span>
      </div>
      <div style={row}>
        <span>Paid</span>
        <span>Rs. {fmt(invoice.totals.paid)}</span>
      </div>
      <div style={{ ...row, fontWeight: 700 }}>
        <span>{invoice.totals.balance > 0 ? 'Balance Due' : 'Balance'}</span>
        <span>Rs. {fmt(invoice.totals.balance)}</span>
      </div>
      {invoice.status !== 'Paid' ? (
        <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 3 }}>* {invoice.status} *</div>
      ) : null}

      {/* PAID stamp when fully settled — no QR after payment is complete */}
      {isFullyPaid ? (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div
            style={{
              display: 'inline-block',
              border: '3px double #1d4ed8',
              color: '#1d4ed8',
              borderRadius: 6,
              padding: `${baseFont * 0.5}px ${baseFont * 2}px`,
              fontWeight: 700,
              fontSize: baseFont + 3.5,
              letterSpacing: 2.5,
            }}
          >
            AMOUNT PAID
          </div>
          <div style={{ fontSize: baseFont - 1, marginTop: 3, color: '#333' }}>
            Received with thanks — Rs. {fmt(invoice.totals.paid)} ({invoice.paymentMode})
          </div>
        </div>
      ) : qr && qrString ? (
        /* Balance due — UPI QR for the balance (or WhatsApp chat QR when no UPI) */
        <div style={{ textAlign: 'center', marginTop: 7 }}>
          <img
            src={qr}
            alt={isUpiQr ? 'UPI QR code' : 'WhatsApp QR code'}
            width={w * 0.42}
            height={w * 0.42}
            style={{ display: 'block', margin: '0 auto', imageRendering: 'pixelated' }}
          />
          <div style={{ fontSize: baseFont - 1.2, marginTop: 2 }}>
            {isUpiQr
              ? `Scan to Pay Balance Rs. ${fmt(invoice.totals.balance)} · UPI: ${settings.upiId}`
              : 'Scan to chat on WhatsApp'}
          </div>
        </div>
      ) : null}

      <div style={dash} />

      {/* Footer */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: baseFont + 1 }}>{settings.thankYouNote}</div>
        {settings.returnPolicy ? (
          <div style={{ fontSize: baseFont - 1.5, color: '#333', marginTop: 1 }}>{settings.returnPolicy}</div>
        ) : null}
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ borderTop: '1px solid #111', paddingTop: 2, minWidth: 110, textAlign: 'center' }}>
            {settings.ownerName}
            <div style={{ fontSize: baseFont - 1.5 }}>Proprietor</div>
          </div>
        </div>
        <div style={{ fontSize: baseFont - 2, color: '#555', marginTop: 6 }}>
          Powered by SLP Billing App
        </div>
      </div>
    </div>
  );
}
