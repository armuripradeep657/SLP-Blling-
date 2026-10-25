'use client';

import { useMemo } from 'react';
import { fmt, fmtShort, upiUri } from '@/lib/billing';
import { labels, fill, slipFontFamily, companyNameFor, itemLabel } from '@/lib/i18n';
import { useQrDataUrl } from '@/hooks/use-qr';
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

  /** Bill language — Telugu when selected, English otherwise */
  const lang = invoice.language;
  const L = labels(lang);
  const isTe = lang === 'te';

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

  const qr = useQrDataUrl(qrString);

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
        fontFamily: slipFontFamily(lang),
        fontSize: baseFont,
        lineHeight: 1.45,
        padding: '12px 10px 14px',
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Company logo watermark — faint, behind the whole slip */}
      <img
        src="/narasimha-logo.jpg"
        alt=""
        aria-hidden
        width={Math.round(w * 0.66)}
        height={Math.round(w * 0.66)}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${Math.round(w * 0.66)}px`,
          height: `${Math.round(w * 0.66)}px`,
          objectFit: 'cover',
          borderRadius: '50%',
          opacity: 0.08,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
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
          {companyNameFor(settings, lang)}
        </div>
        {settings.address ? (
          <div style={{ fontSize: baseFont - 1, whiteSpace: 'pre-wrap' }}>{settings.address}</div>
        ) : null}
        {settings.phone ? <div>Ph: {settings.phone}</div> : null}
        <div style={{ fontSize: baseFont - 0.5, marginTop: 2 }}>{L.proprietor}: {settings.ownerName}</div>
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
          <span style={{ color: '#444' }}>{L.mCustomer}: </span>
          <span style={{ fontWeight: 700 }}>{invoice.customer.name}</span>
        </div>
      ) : null}
      {invoice.customer.phone ? <div>{L.mMobile}: {invoice.customer.phone}</div> : null}
      {invoice.customer.address ? (
        <div style={{ fontSize: baseFont - 1 }}>{invoice.customer.address}</div>
      ) : null}

      <div style={dash} />

      {/* Items */}
      <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
        <span>{L.itemSize}</span>
        <span>{L.amount}</span>
      </div>
      {invoice.items.map((it, idx) => (
        <div key={idx} style={{ marginTop: idx === 0 ? 3 : 6 }}>
          <div style={row}>
            <span style={{ fontWeight: 700 }}>
              {idx + 1}. {itemLabel(it, lang)}
            </span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(it.price * it.qty)}</span>
          </div>
          <div style={{ color: '#333' }}>
            {L.size}: {it.size} &nbsp;|&nbsp; {it.qty} x {fmtShort(it.price)}
          </div>
          {(it.discount || 0) > 0 ? (
            <div style={{ color: '#333' }}>&nbsp;&nbsp;{L.lessDiscount} - Rs. {fmt(it.discount)}</div>
          ) : null}
        </div>
      ))}

      <div style={dash} />

      {/* Totals */}
      <div style={row}>
        <span>{L.subtotal}</span>
        <span>Rs. {fmt(invoice.totals.subtotal)}</span>
      </div>
      {(invoice.totals.itemDiscounts || 0) > 0 ? (
        <div style={row}>
          <span>{L.itemDiscounts}</span>
          <span>- Rs. {fmt(invoice.totals.itemDiscounts)}</span>
        </div>
      ) : null}
      {invoice.totals.discount > 0 ? (
        <div style={row}>
          <span>
            {L.discount}{invoice.discountType === 'percent' ? ` (${invoice.discountValue}%)` : ''}
          </span>
          <span>- Rs. {fmt(invoice.totals.discount)}</span>
        </div>
      ) : null}
      {(invoice.labourCharge || 0) > 0 ? (
        <div style={row}>
          <span>{L.labour}</span>
          <span>Rs. {fmt(invoice.labourCharge)}</span>
        </div>
      ) : null}
      {(invoice.autoCharge || 0) > 0 ? (
        <div style={row}>
          <span>{L.auto}</span>
          <span>Rs. {fmt(invoice.autoCharge)}</span>
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
        <span>{L.total}</span>
        <span>Rs. {fmt(invoice.totals.total)}</span>
      </div>

      <div style={{ ...row, marginTop: 4 }}>
        <span>{L.payment}</span>
        <span style={{ fontWeight: 700 }}>{L.modes[invoice.paymentMode] || invoice.paymentMode}</span>
      </div>
      <div style={row}>
        <span>{L.paid}</span>
        <span>Rs. {fmt(invoice.totals.paid)}</span>
      </div>
      <div style={{ ...row, fontWeight: 700 }}>
        <span>{invoice.totals.balance > 0 ? L.balanceDue : L.balance}</span>
        <span>Rs. {fmt(invoice.totals.balance)}</span>
      </div>
      {invoice.status !== 'Paid' ? (
        <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 3 }}>
          * {invoice.status === 'Partial' ? L.statusPartial : L.statusDue} *
        </div>
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
              padding: `${baseFont * 0.5}px ${baseFont * (isTe ? 1.2 : 2)}px`,
              fontWeight: 700,
              fontSize: baseFont + (isTe ? 2.5 : 3.5),
              letterSpacing: isTe ? 0.5 : 2.5,
            }}
          >
            {L.amountPaid}
          </div>
          <div style={{ fontSize: baseFont - 1, marginTop: 3, color: '#333' }}>
            {fill(L.receivedThanks, {
              rs: fmt(invoice.totals.paid),
              mode: L.modes[invoice.paymentMode] || invoice.paymentMode,
            })}
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
              ? fill(L.scanPay, { rs: fmt(invoice.totals.balance), upi: settings.upiId })
              : L.scanChat}
          </div>
        </div>
      ) : null}

      <div style={dash} />

      {/* Footer */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: baseFont + 1 }}>
          {isTe ? L.thankYou : settings.thankYouNote || L.thankYou}
        </div>
        {(isTe ? L.policy : settings.returnPolicy || L.policy) ? (
          <div style={{ fontSize: baseFont - 1.5, color: '#333', marginTop: 1 }}>
            {isTe ? L.policy : settings.returnPolicy || L.policy}
          </div>
        ) : null}
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ borderTop: '1px solid #111', paddingTop: 2, minWidth: 110, textAlign: 'center' }}>
            {settings.ownerName}
            <div style={{ fontSize: baseFont - 1.5 }}>{L.proprietor}</div>
          </div>
        </div>
        <div style={{ fontSize: baseFont - 2, color: '#555', marginTop: 6 }}>{L.powered}</div>
      </div>
    </div>
  );
}
