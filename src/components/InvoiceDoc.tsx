'use client';

import { useMemo } from 'react';
import { fmt, fmtShort, upiUri } from '@/lib/billing';
import { labels, fill, companyNameFor, itemLabel } from '@/lib/i18n';
import { useQrDataUrl } from '@/hooks/use-qr';
import type { BusinessSettings, Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice;
  settings: BusinessSettings;
  /** ref to the outer node for html-to-image capture */
  rootRef?: (node: HTMLDivElement | null) => void;
}

const BLUE = '#1d4ed8';

/**
 * Formal invoice document (A4-style) rendered with INLINE styles so
 * html-to-image rasterizes it perfectly. Used in History — the owner can view,
 * share and print the full invoice as well as the compact thermal slip.
 */
export default function InvoiceDoc({ invoice, settings, rootRef }: Props) {
  const w = 430;
  const lang = invoice.language;
  const L = labels(lang);
  const isTe = lang === 'te';
  const font = isTe
    ? '"Noto Sans Telugu", Arial, Helvetica, sans-serif'
    : 'Arial, Helvetica, sans-serif';
  const company = companyNameFor(settings, lang);

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

  const cell: React.CSSProperties = {
    padding: '7px 8px',
    verticalAlign: 'top',
  };
  const cellRight: React.CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };
  const cellCenter: React.CSSProperties = { ...cell, textAlign: 'center' };

  const totalRow = (label: string, value: string, opts?: { bold?: boolean; minus?: boolean; big?: boolean }) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: opts?.big ? '8px 0 2px' : '2.5px 0',
        borderTop: opts?.big ? `2px solid ${BLUE}` : undefined,
        marginTop: opts?.big ? 6 : undefined,
        fontWeight: opts?.bold || opts?.big ? 700 : 400,
        fontSize: opts?.big ? 19 : 12.5,
        color: '#111',
      }}
    >
      <span>{label}</span>
      <span style={{ whiteSpace: 'nowrap' }}>
        {opts?.minus ? '- ' : ''}
        {isTe ? 'రూ.' : 'Rs.'} {value}
      </span>
    </div>
  );

  return (
    <div
      ref={rootRef}
      style={{
        width: w,
        minHeight: 560,
        background: '#ffffff',
        color: '#111111',
        fontFamily: font,
        fontSize: 12.5,
        lineHeight: 1.5,
        padding: '22px 20px 18px',
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Company logo watermark — faint, behind the whole invoice */}
      <img
        src="/narasimha-logo.jpg"
        alt=""
        aria-hidden
        width={300}
        height={300}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          objectFit: 'cover',
          borderRadius: '50%',
          opacity: 0.06,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Header: logo + company | INVOICE title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img
          src="/narasimha-logo.jpg"
          alt="Sri Lakshmi Penchil Narasimha Swamy"
          width={58}
          height={58}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            border: `2.5px solid ${BLUE}`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.25 }}>{company}</div>
          {settings.address ? (
            <div style={{ fontSize: 10.5, color: '#333', whiteSpace: 'pre-wrap' }}>{settings.address}</div>
          ) : null}
          {settings.phone ? <div style={{ fontSize: 10.5, color: '#333' }}>Ph: {settings.phone}</div> : null}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: BLUE, letterSpacing: isTe ? 0.5 : 1.5 }}>
            {L.mInvoice}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>{invoice.no}</div>
          <div style={{ fontSize: 10.5, color: '#333' }}>
            {dateStr} · {timeStr}
          </div>
        </div>
      </div>

      <div style={{ height: 3, background: BLUE, borderRadius: 2, margin: '10px 0 12px' }} />

      {/* Bill To + proprietor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: BLUE }}>
            {L.billTo}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 1 }}>
            {invoice.customer.name || (isTe ? 'నామవాచక కస్టమర్' : 'Walk-in customer')}
          </div>
          {invoice.customer.phone ? <div style={{ fontSize: 11.5 }}>{L.mMobile}: {invoice.customer.phone}</div> : null}
          {invoice.customer.address ? (
            <div style={{ fontSize: 11, color: '#333', whiteSpace: 'pre-wrap' }}>{invoice.customer.address}</div>
          ) : null}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11 }}>
          <div style={{ fontWeight: 700 }}>{settings.ownerName}</div>
          <div style={{ color: '#333' }}>{L.proprietor}</div>
        </div>
      </div>

      {/* Items table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 11.5,
          border: '1.5px solid #d4d4d8',
        }}
      >
        <thead>
          <tr style={{ background: BLUE, color: '#ffffff' }}>
            <th style={{ ...cellCenter, fontWeight: 700, width: 34, fontSize: 10.5, padding: '6px 4px' }}>{L.tSno}</th>
            <th style={{ ...cell, fontWeight: 700, textAlign: 'left', fontSize: 10.5, padding: '6px 8px' }}>{L.tItem}</th>
            <th style={{ ...cellCenter, fontWeight: 700, fontSize: 10.5, padding: '6px 4px' }}>{L.size}</th>
            <th style={{ ...cellCenter, fontWeight: 700, fontSize: 10.5, padding: '6px 4px' }}>{L.tQty}</th>
            <th style={{ ...cellRight, fontWeight: 700, fontSize: 10.5, padding: '6px 8px' }}>{L.tRate}</th>
            <th style={{ ...cellRight, fontWeight: 700, fontSize: 10.5, padding: '6px 8px' }}>{L.amount}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => (
            <tr key={idx} style={{ borderTop: '1px solid #e4e4e7' }}>
              <td style={cellCenter}>{idx + 1}</td>
              <td style={cell}>
                <div style={{ fontWeight: 700 }}>{itemLabel(it, lang)}</div>
                {(it.discount || 0) > 0 ? (
                  <div style={{ fontSize: 10, color: '#b91c1c' }}>
                    {L.lessDiscount} - {isTe ? 'రూ.' : 'Rs.'} {fmt(it.discount)}
                  </div>
                ) : null}
              </td>
              <td style={cellCenter}>{it.size}</td>
              <td style={cellCenter}>{it.qty}</td>
              <td style={cellRight}>{fmtShort(it.price)}</td>
              <td style={{ ...cellRight, fontWeight: 700 }}>{fmt(it.price * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginLeft: 'auto', width: 235, marginTop: 10 }}>
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
        {totalRow(L.total, fmt(invoice.totals.total), { big: true })}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2.5px 0', fontSize: 12.5 }}>
          <span>{L.payment}</span>
          <span style={{ fontWeight: 700 }}>{L.modes[invoice.paymentMode] || invoice.paymentMode}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2.5px 0', fontSize: 12.5 }}>
          <span>{L.paid}</span>
          <span>
            {isTe ? 'రూ.' : 'Rs.'} {fmt(invoice.totals.paid)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2.5px 0', fontSize: 12.5, fontWeight: 700 }}>
          <span>{invoice.totals.balance > 0 ? L.balanceDue : L.balance}</span>
          <span style={{ color: invoice.totals.balance > 0 ? '#b91c1c' : '#15803d' }}>
            {isTe ? 'రూ.' : 'Rs.'} {fmt(invoice.totals.balance)}
          </span>
        </div>
        {invoice.status !== 'Paid' ? (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 11.5, color: invoice.status === 'Partial' ? BLUE : '#b91c1c', marginTop: 2 }}>
            * {invoice.status === 'Partial' ? L.statusPartial : L.statusDue} *
          </div>
        ) : null}
      </div>

      {/* PAID stamp when fully settled — QR for the balance otherwise */}
      {isFullyPaid ? (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div
            style={{
              display: 'inline-block',
              border: `3px double ${BLUE}`,
              color: BLUE,
              borderRadius: 8,
              padding: `${isTe ? 7 : 6}px ${isTe ? 18 : 26}px`,
              fontWeight: 700,
              fontSize: isTe ? 16 : 18,
              letterSpacing: isTe ? 0.5 : 3,
            }}
          >
            {L.amountPaid}
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#333' }}>
            {fill(L.receivedThanks, {
              rs: fmt(invoice.totals.paid),
              mode: L.modes[invoice.paymentMode] || invoice.paymentMode,
            })}
          </div>
        </div>
      ) : qr && qrString ? (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <img
            src={qr}
            alt={isUpiQr ? 'UPI QR code' : 'WhatsApp QR code'}
            width={120}
            height={120}
            style={{ display: 'block', margin: '0 auto', imageRendering: 'pixelated' }}
          />
          <div style={{ fontSize: 10.5, marginTop: 3 }}>
            {isUpiQr
              ? fill(L.scanPay, { rs: fmt(invoice.totals.balance), upi: settings.upiId })
              : L.scanChat}
          </div>
        </div>
      ) : null}

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
        <div style={{ textAlign: 'center', minWidth: 170 }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>
            {fill(L.sigFor, { company })}
          </div>
          <div style={{ borderTop: '1px solid #111', marginTop: 30, paddingTop: 3, fontSize: 11.5, fontWeight: 700 }}>
            {settings.ownerName}
          </div>
          <div style={{ fontSize: 10, color: '#333' }}>{L.proprietor}</div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1.5px dashed #a1a1aa',
          marginTop: 14,
          paddingTop: 8,
          textAlign: 'center',
          fontSize: 10.5,
          color: '#333',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 12 }}>
          {isTe ? L.thankYou : settings.thankYouNote || L.thankYou}
        </div>
        {(isTe ? L.policy : settings.returnPolicy || L.policy) ? (
          <div style={{ marginTop: 1 }}>{isTe ? L.policy : settings.returnPolicy || L.policy}</div>
        ) : null}
      </div>
    </div>
  );
}
