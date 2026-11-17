'use client';

import { fmt, fmtShort, isValidUpiId, upiUri } from '@/lib/billing';
import { labels, fill, slipFontFamily, companyLines, itemLabel } from '@/lib/i18n';
import Barcode from './Barcode';
import QrCode from './QrCode';
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
 * Carries the CODE 128 verification barcode on every bill (paid or not).
 */
export default function ThermalSlip({ invoice, settings, rootRef }: Props) {
  const w = settings.slipWidthMm === 58 ? 220 : 304;
  const baseFont = settings.slipWidthMm === 58 ? 9.5 : 11;

  /** Bill language — Telugu when selected, English otherwise, Both = bilingual */
  const lang = invoice.language;
  const L = labels(lang);
  const isTe = lang !== 'en'; // tighter spacing when Telugu glyphs are on the slip

  /** Bill fully settled — PAID stamp shows; the barcode prints on EVERY bill */
  const isFullyPaid = invoice.totals.balance <= 0;

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
        {companyLines(settings, lang).map((line, i) => (
          <div
            key={i}
            style={{
              fontWeight: 700,
              fontSize: i === 0 ? baseFont + 2.5 : baseFont + 1,
              textTransform: i === 0 ? 'uppercase' : 'none',
              letterSpacing: 0.2,
            }}
          >
            {line}
          </div>
        ))}
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
            <div style={{ color: '#333' }}>&nbsp;&nbsp;{L.lessDiscount} - Rs. {fmt(it.discount || 0)}</div>
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
      {(invoice.totals.gst || 0) > 0 ? (
        <div style={row}>
          <span>
            {L.gstLabel} {settings.gstPercent || 0}%
          </span>
          <span>Rs. {fmt(invoice.totals.gst || 0)}</span>
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

      {/* PAID stamp when fully settled — the barcode prints on every bill */}
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
      ) : null}
      {isValidUpiId(settings.upiId || '') ? (
        /* UPI PAYMENT QR from the SAVED UPI ID + the ID as text — on every
           slip, paid or not (a fully-paid re-print carries the bill TOTAL,
           exactly like the formal invoice). This is a PAYMENT QR — the
           bill-verification Code 128 barcode is printed separately below
           and is never a QR. */
        <div data-slip-payment-qr style={{ textAlign: 'center', marginTop: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <QrCode
              value={upiUri(settings.upiId, invoice.totals.balance > 0 ? invoice.totals.balance : invoice.totals.total, invoice.no)}
              size={settings.slipWidthMm === 58 ? 96 : 128}
              label="QR CODE – MAKE PAYMENT"
            />
          </div>
          <div style={{ fontSize: baseFont - 1.5, fontWeight: 700, letterSpacing: 0.4, color: '#111', marginTop: 2 }}>
            {L.payQrLabel}
          </div>
          <div style={{ marginTop: 2, fontSize: baseFont - 0.5 }}>
            {fill(L.balancePay, { rs: fmt(invoice.totals.balance > 0 ? invoice.totals.balance : invoice.totals.total) })} <b>{settings.upiId}</b>
          </div>
        </div>
      ) : null}

      {/* CODE 128 verification barcode — on EVERY bill, paid or not */}
      {invoice.verifyCode ? (
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <div style={{ fontSize: baseFont - 1.5, fontWeight: 700, letterSpacing: 0.6, color: '#111', textTransform: 'uppercase' }}>
            {L.verifyLabel}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Barcode value={invoice.verifyCode} height={settings.slipWidthMm === 58 ? 30 : 38} width={settings.slipWidthMm === 58 ? 0.8 : 1.15} />
          </div>
          <div style={{ fontSize: baseFont - 1.5, marginTop: 2, letterSpacing: 0.5, color: '#111' }}>
            {invoice.verifyCode}
          </div>
          <div style={{ fontSize: baseFont - 2.5, color: '#555' }}>{L.verifyHint}</div>
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
