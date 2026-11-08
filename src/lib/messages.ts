import { fmtShort, fmt } from './billing';
import { labels, fill, companyNameFor, companyLines, itemLabel, cur } from './i18n';
import type { Invoice, BusinessSettings } from './types';

/** Detailed message used for WhatsApp (emojis + itemized list with sizes) */
export function whatsappMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const L = labels(inv.language);
  const rupee = cur(inv.language);

  const lines: string[] = [];
  // Company name — Telugu bills print the Telugu name, "Both" prints both lines
  companyLines(s, inv.language).forEach((line, i) => {
    lines.push(i === 0 ? `*${line}*` : line);
  });
  if (s.phone) lines.push(`${inv.language === 'te' ? 'ఫోన్' : 'Ph'}: ${s.phone}`);
  lines.push('');
  lines.push(`*${L.mInvoice}:* ${inv.no}`);
  lines.push(`${L.mDate}: ${dateStr}, ${timeStr}`);
  if (inv.customer.name) lines.push(`${L.mCustomer}: ${inv.customer.name}`);
  if (inv.customer.phone) lines.push(`${L.mMobile}: ${inv.customer.phone}`);
  lines.push('------------------------------');
  inv.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${itemLabel(it, inv.language)}`);
    lines.push(`   ${L.size}: ${it.size} | ${it.qty} x ${fmtShort(it.price)} = *${fmt(it.price * it.qty)}*`);
    if ((it.discount || 0) > 0) lines.push(`   ${L.mDiscount}: -${fmt(it.discount)}`);
  });
  lines.push('------------------------------');
  lines.push(`${L.mSubtotal}: ${fmt(inv.totals.subtotal)}`);
  if ((inv.totals.itemDiscounts || 0) > 0) lines.push(`${L.itemDiscounts}: -${fmt(inv.totals.itemDiscounts)}`);
  if (inv.totals.discount > 0) lines.push(`${L.mDiscount}: -${fmt(inv.totals.discount)}`);
  if ((inv.labourCharge || 0) > 0) lines.push(`${L.labour}: ${fmt(inv.labourCharge)}`);
  if ((inv.autoCharge || 0) > 0) lines.push(`${L.auto}: ${fmt(inv.autoCharge)}`);
  lines.push(`*${L.total}: ${rupee} ${fmt(inv.totals.total)}*`);
  lines.push(`${L.payment}: ${L.modes[inv.paymentMode] || inv.paymentMode}`);
  lines.push(fill(L.mPaidBal, { paid: fmt(inv.totals.paid), balance: fmt(inv.totals.balance) }));
  if (inv.status === 'Paid') lines.push('');
  lines.push('');
  // UPI ID is intentionally NOT printed — the balance QR in the bill image carries it
  lines.push(inv.language === 'en' ? s.returnPolicy || L.policy : L.policy);
  lines.push('');
  lines.push(`${L.mThanks} \u{1F64F}`);
  lines.push(`- ${s.ownerName || ''}`);
  lines.push(`${inv.language === 'en' ? 'Proprietor' : L.proprietor}, ${companyNameFor(s, inv.language)}`);
  lines.push('');
  lines.push(`_${L.mImageSeparately}_`);
  return lines.join('\n');
}

/** Short caption sent TOGETHER WITH the bill image (WhatsApp share sheet / file share) */
export function whatsappCaption(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const L = labels(inv.language);
  const rupee = cur(inv.language);
  const te = inv.language === 'te';
  const lines: string[] = [];
  companyLines(s, inv.language).forEach((line, i) => {
    lines.push(i === 0 ? `*${line}*` : line);
  });
  lines.push(`${L.mInvoice} *${inv.no}* · ${L.mDate} ${dateStr}`);
  if (inv.customer.name) lines.push(`${L.mCustomer}: ${inv.customer.name}`);
  lines.push(
    `*${L.total}: ${rupee} ${fmt(inv.totals.total)}*${
      inv.totals.balance > 0
        ? ` (${te ? 'బాకీ' : 'Balance'}: ${rupee} ${fmt(inv.totals.balance)})`
        : ` (${te ? 'చెల్లించారు' : 'Paid'})`
    }`
  );
  lines.push('');
  lines.push(
    inv.totals.balance > 0
      ? `${L.capAttachedDue} \u{1F9FE} \u{1F64F}`
      : `${L.capAttachedPaid} \u{1F9FE} \u{1F64F}`
  );
  lines.push(`- ${s.ownerName || ''}`);
  return lines.join('\n');
}

/** Compact plain-text summary used for SMS (160-char friendly-ish) */
export function smsMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const L = labels(inv.language);
  const te = inv.language === 'te';
  const rupee = cur(inv.language);
  const companyFull = companyNameFor(s, inv.language);
  const company = companyFull.split(' ').slice(0, 4).join(' ');
  const items = inv.items
    .map((it) => `${itemLabel(it, inv.language)} ${it.size} x${it.qty}=${fmtShort(it.price * it.qty)}`)
    .join('; ');
  const extras =
    (inv.totals.itemDiscounts || 0) > 0 || (inv.labourCharge || 0) > 0 || (inv.autoCharge || 0) > 0
      ? ` (${te ? 'త' : 'D'}:${fmtShort(inv.totals.itemDiscounts || 0)}, ${te ? 'కూ' : 'L'}:${fmtShort(
          inv.labourCharge || 0
        )}, ${te ? 'ఆ' : 'A'}:${fmtShort(inv.autoCharge || 0)})`
      : '';
  const totals = ` ${te ? 'ఉప' : 'Sub'}:${fmtShort(inv.totals.subtotal)}${extras} ${
    te ? 'మొత్తం' : 'TOTAL'
  }:${rupee}${fmtShort(inv.totals.total)}. ${L.modes[inv.paymentMode] || inv.paymentMode}, ${
    te ? 'చెల్లించినది' : 'Paid'
  }:${fmtShort(inv.totals.paid)}, ${te ? 'బాకీ' : 'Bal'}:${fmtShort(inv.totals.balance)}.`;
  const tail = ` ${L.mThanks} - ${s.ownerName || ''}`;
  return `${company}${inv.customer.name ? ` ${te ? 'కస్టమర్' : 'Cust'}: ${inv.customer.name}.` : ''} ${
    te ? 'బిల్లు' : 'Inv'
  } ${inv.no} (${dateStr})\n${items}\n${totals}${tail}`;
}
