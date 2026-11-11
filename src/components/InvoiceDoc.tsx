'use client';

import { useMemo } from 'react';
import { fmt, fmtShort, upiUri } from '@/lib/billing';
import { labels, fill, slipFontFamily, companyLines, itemLabel, cur } from '@/lib/i18n';
import { useQrDataUrl } from '@/hooks/use-qr';
import type { BusinessSettings, Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice;
  settings: BusinessSettings;
  /** ref to the outer node for html-to-image capture */
  rootRef?: (node: HTMLDivElement | null) => void;
}

const NAVY = '#1e3a8a';
const BLUE = '#1d4ed8';
const BLUE_BRIGHT = '#3b82f6';
const GOLD = '#f59e0b';
const INK = '#111111';

/**
 * Signature invoice design — a premium one-of-a-kind bill document:
 * navy→blue gradient header with a gold underline, a rotated status stamp,
 * rounded zebra items table, gradient TOTAL banner and a scan-to-pay card.
 * The owner's UPI ID is NEVER printed — only the QR carries it.
 * Rendered with INLINE styles so html-to-image rasterizes it perfectly.
 */
export default function InvoiceDoc({ invoice, settings, rootRef }: Props) {
  const w = 430;
  const lang = invoice.language;
  const L = labels(lang);
  const isTe = lang !== 'en'; // tighter spacing when Telugu glyphs are used
  const font = slipFontFamily(lang);
  const rupee = cur(lang);

  const isFullyPaid = invoice.totals.balance <= 0;

  /** UPI QR for the remaining balance only (hidden once fully paid) */
  const upiString = useMemo(() => {
    if (isFullyPaid || !settings.upiId) return '';
    return upiUri(settings.upiId, invoice.totals.balance, invoice.no);
  }, [isFullyPaid, settings.upiId, invoice]);

  const waString = useMemo(() => {
    if (isFullyPaid || settings.upiId) return '';
    const shop = (settings.whatsappNumber || settings.phone || '').replace(/\D/g, '');
    const ten = shop.length > 10 ? shop.slice(-10) : shop;
    return ten.length === 10 ? `https://wa.me/91${ten}?text=${encodeURIComponent(`Hi, regarding bill ${invoice.no}`)}` : '';
  }, [isFullyPaid, settings.upiId, settings.whatsappNumber, settings.phone, invoice.no]);

  const qrString = upiString || waString;
  const isUpiQr = !!upiString;
  const qr = useQrDataUrl(qrString);

  const d = new Date(invoice.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const totalQty = invoice.items.reduce((s, it) => s + it.qty, 0);

  const cell: React.CSSProperties = {
    padding: '7px 8px',
    verticalAlign: 'top',
  };
  const cellRight: React.CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };
  const cellCenter: React.CSSProperties = { ...cell, textAlign: 'center' };

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  const totalRow = (label: string, value: string, opts?: { bold?: boolean; minus?: boolean }) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: '2.5px 0',
        fontWeight: opts?.bold ? 700 : 400,
        fontSize: 12,
        color: opts?.minus ? '#b91c1c' : '#334155',
      }}
    >
      <span>{label}</span>
      <span style={{ whiteSpace: 'nowrap' }}>
        {opts?.minus ? '- ' : ''}
        {rupee} {value}
      </span>
    </div>
  );

  /** Rotated rubber stamp over the header seam */
  const stampText = isFullyPaid ? L.amountPaid : invoice.status === 'Partial' ? L.statusPartial : L.statusDue;
  const stampColor = isFullyPaid ? '#15803d' : invoice.status === 'Partial' ? BLUE : '#dc2626';

  /** Scan-to-pay hint (no UPI ID on the document, ever) */
  const upiHint =
    lang === 'en'
      ? 'Open any UPI app & scan to pay'
      : lang === 'te'
        ? 'ఏదైనా UPI యాప్‌తో స్కాన్ చేసి చెల్లించండి'
        : 'Open any UPI app · ఏదైనా UPI యాప్‌తో స్కాన్ చేయండి';

  return (
    <div
      ref={rootRef}
      style={{
        width: w,
        background: '#ffffff',
        color: INK,
        fontFamily: font,
        fontSize: 12.5,
        lineHeight: 1.5,
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        zIndex: 0,
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
      }}
    >
      {/* ================= HEADER BAND — navy gradient + gold underline ================= */}
      <div
        style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 58%, ${BLUE_BRIGHT} 100%)`,
          borderBottom: `3px solid ${GOLD}`,
          padding: '18px 18px 14px',
          overflow: 'hidden',
        }}
      >
        {/* decorative faint rupee glyph */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -6,
            top: -26,
            fontSize: 120,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.09)',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          ₹
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
          <img
            src="/narasimha-logo.jpg"
            alt="Sri Lakshmi Penchil Narasimha Swamy"
            width={56}
            height={56}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid rgba(255,255,255,0.95)',
              boxShadow: '0 0 0 3px rgba(245,158,11,0.55)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {companyLines(settings, lang).map((line, i) => (
              <div
                key={i}
                style={{
                  fontWeight: 700,
                  fontSize: i === 0 ? 15 : 11.5,
                  lineHeight: 1.3,
                  color: i === 0 ? '#ffffff' : '#dbeafe',
                }}
              >
                {line}
              </div>
            ))}
            {settings.address ? (
              <div style={{ fontSize: 9.8, color: '#bfdbfe', whiteSpace: 'pre-wrap', marginTop: 2 }}>{settings.address}</div>
            ) : null}
            {settings.phone ? <div style={{ fontSize: 9.8, color: '#bfdbfe' }}>Ph: {settings.phone}</div> : null}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, position: 'relative' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5, color: GOLD, textTransform: 'uppercase' }}>
              {L.mInvoice}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>{invoice.no}</div>
            <div style={{ fontSize: 9.8, color: '#dbeafe', marginTop: 1 }}>
              {dateStr} · {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* Rotated status stamp riding the header seam */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 96,
          right: 14,
          transform: 'rotate(-8deg)',
          border: `3px double ${stampColor}`,
          color: stampColor,
          borderRadius: 8,
          padding: `${isTe ? 5 : 4}px ${isTe ? 14 : 18}px`,
          fontWeight: 700,
          fontSize: isTe ? 13 : 14.5,
          letterSpacing: isTe ? 0.5 : 2.5,
          background: 'rgba(255,255,255,0.82)',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {stampText}
      </div>

      {/* ================= BODY ================= */}
      <div style={{ padding: '12px 18px 0', position: 'relative' }}>
        {/* meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, paddingRight: isTe ? 130 : 150 }}>
          <div style={chip}>
            {L.payment}: {L.modes[invoice.paymentMode] || invoice.paymentMode}
          </div>
          <div style={chip}>
            {L.tItem}: {invoice.items.length}
          </div>
          <div style={chip}>
            {L.tQty}: {totalQty}
          </div>
        </div>

        {/* Bill To card */}
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            padding: '9px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: BLUE }}>
              {L.billTo}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 1, color: '#0f172a' }}>
              {invoice.customer.name || (lang === 'en' ? 'Walk-in customer' : 'నామవాచక కస్టమర్ / Walk-in')}
            </div>
            {invoice.customer.phone ? (
              <div style={{ fontSize: 11, color: '#334155' }}>
                {L.mMobile}: {invoice.customer.phone}
              </div>
            ) : null}
            {invoice.customer.address ? (
              <div style={{ fontSize: 10.5, color: '#334155', whiteSpace: 'pre-wrap' }}>{invoice.customer.address}</div>
            ) : null}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 10.5 }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{settings.ownerName}</div>
            <div style={{ color: '#475569' }}>{L.proprietor}</div>
          </div>
        </div>

        {/* Items table — rounded, navy header, zebra rows */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 11,
            border: '1.5px solid #dbe3ef',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ background: NAVY, color: '#ffffff' }}>
              <th style={{ ...cellCenter, fontWeight: 700, width: 30, fontSize: 9.8, padding: '6px 4px' }}>{L.tSno}</th>
              <th style={{ ...cell, fontWeight: 700, textAlign: 'left', fontSize: 9.8, padding: '6px 8px' }}>{L.tItem}</th>
              <th style={{ ...cellCenter, fontWeight: 700, fontSize: 9.8, padding: '6px 4px' }}>{L.size}</th>
              <th style={{ ...cellCenter, fontWeight: 700, fontSize: 9.8, padding: '6px 4px' }}>{L.tQty}</th>
              <th style={{ ...cellRight, fontWeight: 700, fontSize: 9.8, padding: '6px 8px' }}>{L.tRate}</th>
              <th style={{ ...cellRight, fontWeight: 700, fontSize: 9.8, padding: '6px 8px' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => (
              <tr
                key={idx}
                style={{
                  borderTop: '1px solid #e4e9f2',
                  background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                }}
              >
                <td style={{ ...cellCenter, color: '#64748b', fontSize: 10.5 }}>{idx + 1}</td>
                <td style={cell}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{itemLabel(it, lang)}</div>
                  {(it.discount || 0) > 0 ? (
                    <div style={{ fontSize: 9.5, color: '#dc2626' }}>
                      {L.lessDiscount} - {rupee} {fmt(it.discount || 0)}
                    </div>
                  ) : null}
                </td>
                <td style={{ ...cellCenter, fontSize: 10.5 }}>{it.size}</td>
                <td style={{ ...cellCenter, fontWeight: 600 }}>{it.qty}</td>
                <td style={{ ...cellRight, color: '#475569' }}>{fmtShort(it.price)}</td>
                <td style={{ ...cellRight, fontWeight: 700, color: '#0f172a' }}>{fmt(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + gradient TOTAL banner */}
        <div style={{ marginLeft: 'auto', width: 250, marginTop: 12 }}>
          {totalRow(L.subtotal, fmt(invoice.totals.subtotal))}
          {(invoice.totals.itemDiscounts || 0) > 0
            ? totalRow(L.itemDiscounts, fmt(invoice.totals.itemDiscounts), { minus: true })
            : null}
          {invoice.totals.discount > 0
            ? totalRow(
                `${L.discount}${invoice.discountType === 'percent' ? ` (${invoice.discountValue}%)` : ''}`,
                fmt(invoice.totals.discount),
                { minus: true }
              )
            : null}
          {(invoice.labourCharge || 0) > 0 ? totalRow(L.labour, fmt(invoice.labourCharge)) : null}
          {(invoice.autoCharge || 0) > 0 ? totalRow(L.auto, fmt(invoice.autoCharge)) : null}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
              background: `linear-gradient(135deg, ${NAVY}, ${BLUE_BRIGHT})`,
              color: '#ffffff',
              borderRadius: 10,
              padding: '8px 12px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: isTe ? 12.5 : 13, letterSpacing: isTe ? 0.3 : 0.8 }}>{L.total}</span>
            <span style={{ fontWeight: 800, fontSize: 20, whiteSpace: 'nowrap' }}>
              {rupee} {fmt(invoice.totals.total)}
            </span>
          </div>

          <div
            style={{
              marginTop: 6,
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '6px 10px',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2px 0', fontSize: 11.5 }}>
              <span style={{ color: '#475569' }}>{L.paid}</span>
              <span style={{ fontWeight: 700, color: '#15803d' }}>
                {rupee} {fmt(invoice.totals.paid)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2px 0', fontSize: 11.5, fontWeight: 700 }}>
              <span style={{ color: '#475569' }}>{invoice.totals.balance > 0 ? L.balanceDue : L.balance}</span>
              <span style={{ color: invoice.totals.balance > 0 ? '#dc2626' : '#15803d' }}>
                {rupee} {fmt(invoice.totals.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* PAID banner / scan-to-pay card — UPI ID never printed */}
        {isFullyPaid ? (
          <div
            style={{
              marginTop: 14,
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11.5, marginTop: 2, color: '#166534', fontWeight: 600 }}>
              {fill(L.receivedThanks, {
                rs: fmt(invoice.totals.paid),
                mode: L.modes[invoice.paymentMode] || invoice.paymentMode,
              })}
            </div>
          </div>
        ) : qr && qrString ? (
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1.5px dashed ${BLUE_BRIGHT}`,
              background: '#f0f7ff',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <img
              src={qr}
              alt={isUpiQr ? 'UPI QR code' : 'WhatsApp QR code'}
              width={104}
              height={104}
              style={{ display: 'block', imageRendering: 'pixelated', flexShrink: 0, background: '#ffffff', padding: 4, borderRadius: 8 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, lineHeight: 1.35 }}>
                {isUpiQr ? fill(L.scanPay, { rs: fmt(invoice.totals.balance) }) : L.scanChat}
              </div>
              {isUpiQr ? <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{upiHint}</div> : null}
            </div>
          </div>
        ) : null}

        {/* Signature */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingBottom: 16 }}>
          <div style={{ textAlign: 'center', minWidth: 170 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>
              {fill(L.sigFor, { company: companyLines(settings, lang).join(' / ') })}
            </div>
            <div style={{ borderTop: '1px solid #111', marginTop: 28, paddingTop: 3, fontSize: 11.5, fontWeight: 700 }}>
              {settings.ownerName}
            </div>
            <div style={{ fontSize: 9.5, color: '#475569' }}>{L.proprietor}</div>
          </div>
        </div>
      </div>

      {/* Company logo watermark — faint, behind the body content */}
      <img
        src="/narasimha-logo.jpg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        style={{
          position: 'absolute',
          top: '58%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          objectFit: 'cover',
          borderRadius: '50%',
          opacity: 0.055,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* ================= FOOTER BAND — navy ================= */}
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
          borderTop: `2.5px solid ${GOLD}`,
          padding: '11px 18px 12px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 12 }}>
          {isTe ? L.thankYou : settings.thankYouNote || L.thankYou}
        </div>
        {(isTe ? L.policy : settings.returnPolicy || L.policy) ? (
          <div style={{ marginTop: 1, fontSize: 9.8, color: 'rgba(255,255,255,0.85)' }}>
            {isTe ? L.policy : settings.returnPolicy || L.policy}
          </div>
        ) : null}
        <div style={{ marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>{L.powered}</div>
      </div>
    </div>
  );
}
