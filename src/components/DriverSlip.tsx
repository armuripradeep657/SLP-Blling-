'use client';

import { fmt } from '@/lib/billing';
import { driverLabels, slipFontFamily, companyLines, itemLabel } from '@/lib/i18n';
import type { BusinessSettings, Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice;
  settings: BusinessSettings;
  /** ref to the outer node for html-to-image capture */
  rootRef?: (node: HTMLDivElement | null) => void;
}

/**
 * Driver / delivery slip — carries ITEMS AND QUANTITIES ONLY (no prices),
 * plus the driver, vehicle and delivery address. Rendered with INLINE styles
 * so html-to-image rasterizes it perfectly, same as the thermal slip.
 */
export default function DriverSlip({ invoice, settings, rootRef }: Props) {
  const w = settings.slipWidthMm === 58 ? 220 : 304;
  const baseFont = settings.slipWidthMm === 58 ? 9.5 : 11;
  const lang = invoice.language;
  const D = driverLabels(lang);
  const isTe = lang !== 'en';
  const font = slipFontFamily(lang);

  const delivery = invoice.delivery;
  const totalQty = invoice.items.reduce((s, it) => s + it.qty, 0);

  const dash: React.CSSProperties = {
    borderTop: '1.5px dashed #1a1a1a',
    margin: `${baseFont * 0.55}px 0`,
  };
  const d = new Date(delivery?.dateISO || invoice.dateISO);
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
        fontFamily: font,
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
              fontWeight: i === 0 ? 700 : 600,
              fontSize: i === 0 ? baseFont + 2.5 : baseFont + 0.5,
              textTransform: i === 0 ? 'uppercase' : 'none',
              letterSpacing: 0.2,
            }}
          >
            {line}
          </div>
        ))}
        {settings.phone ? <div>Ph: {settings.phone}</div> : null}
        {/* Title band */}
        <div
          style={{
            marginTop: 6,
            display: 'inline-block',
            border: '2.5px solid #1d4ed8',
            color: '#1d4ed8',
            borderRadius: 6,
            padding: `${baseFont * 0.35}px ${baseFont * 1.4}px`,
            fontWeight: 700,
            fontSize: baseFont + 2,
            letterSpacing: isTe ? 0.5 : 1.5,
          }}
        >
          {D.title}
        </div>
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
          <span style={{ color: '#444' }}>{D.customer}: </span>
          <span style={{ fontWeight: 700 }}>{invoice.customer.name}</span>
        </div>
      ) : null}
      {invoice.customer.phone ? <div>{D.mobile}: {invoice.customer.phone}</div> : null}

      <div style={dash} />

      {/* Delivery details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {delivery?.driver ? (
          <div style={row}>
            <span style={{ color: '#444' }}>{D.driver}</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{delivery.driver}</span>
          </div>
        ) : null}
        {delivery?.vehicle ? (
          <div style={row}>
            <span style={{ color: '#444' }}>{D.vehicle}</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{delivery.vehicle}</span>
          </div>
        ) : null}
        {delivery?.address ? (
          <div style={{ fontSize: baseFont - 1, whiteSpace: 'pre-wrap' }}>
            <span style={{ color: '#444' }}>{D.address}: </span>
            {delivery.address}
          </div>
        ) : null}
      </div>

      <div style={dash} />

      {/* Items + quantities ONLY — no prices anywhere on this slip */}
      <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
        <span>{D.item}</span>
        <span>{D.qty}</span>
      </div>
      {invoice.items.map((it, idx) => (
        <div key={idx} style={{ ...row, marginTop: idx === 0 ? 3 : 6 }}>
          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 0 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{idx + 1}.</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {itemLabel(it, lang)}
            </span>
            <span style={{ color: '#333', whiteSpace: 'nowrap', fontWeight: 600 }}>({it.size})</span>
          </span>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>x {it.qty}</span>
        </div>
      ))}

      <div style={dash} />

      <div style={{ ...row, fontWeight: 700, fontSize: baseFont + 2 }}>
        <span>{D.totalQty}</span>
        <span>{fmt(totalQty)}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: baseFont - 1.5, color: '#333', marginTop: 3 }}>{D.note}</div>

      <div style={dash} />

      {/* Driver signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <div style={{ borderTop: '1px solid #111', paddingTop: 2, minWidth: 130, textAlign: 'center' }}>
          <div style={{ fontSize: baseFont - 1.5 }}>{D.driverSign}</div>
        </div>
      </div>
    </div>
  );
}
