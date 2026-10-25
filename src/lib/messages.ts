import { fmtShort, fmt } from './billing';
import type { Invoice, BusinessSettings } from './types';

/** Detailed message used for WhatsApp (emojis + itemized list with sizes) */
export function whatsappMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const company = s.companyName || 'Cement Works';

  const lines: string[] = [];
  lines.push(`*${company}*`);
  if (s.phone) lines.push(`Ph: ${s.phone}`);
  lines.push('');
  lines.push(`*INVOICE:* ${inv.no}`);
  lines.push(`Date: ${dateStr}, ${timeStr}`);
  if (inv.customer.name) lines.push(`Customer: ${inv.customer.name}`);
  if (inv.customer.phone) lines.push(`Mobile: ${inv.customer.phone}`);
  lines.push('------------------------------');
  inv.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.name}`);
    lines.push(`   Size: ${it.size} | ${it.qty} x ${fmtShort(it.price)} = *${fmt(it.price * it.qty)}*`);
    if ((it.discount || 0) > 0) lines.push(`   Discount: -${fmt(it.discount)}`);
  });
  lines.push('------------------------------');
  lines.push(`Subtotal: ${fmt(inv.totals.subtotal)}`);
  if ((inv.totals.itemDiscounts || 0) > 0) lines.push(`Item Discounts: -${fmt(inv.totals.itemDiscounts)}`);
  if (inv.totals.discount > 0) lines.push(`Discount: -${fmt(inv.totals.discount)}`);
  if ((inv.labourCharge || 0) > 0) lines.push(`Labour Charges: ${fmt(inv.labourCharge)}`);
  if ((inv.autoCharge || 0) > 0) lines.push(`Auto Charges: ${fmt(inv.autoCharge)}`);
  lines.push(`*TOTAL: Rs. ${fmt(inv.totals.total)}*`);
  lines.push(`Payment: ${inv.paymentMode}`);
  lines.push(`Paid: ${fmt(inv.totals.paid)} | Balance: ${fmt(inv.totals.balance)}`);
  if (inv.status === 'Paid') lines.push('');
  lines.push('');
  if (s.upiId) lines.push(`UPI ID: ${s.upiId}`);
  if (s.returnPolicy) lines.push(`${s.returnPolicy}`);
  lines.push('');
  lines.push(`Thank you! Visit Again \u{1F64F}`);
  lines.push(`- ${s.ownerName || ''}`);
  lines.push(`Proprietor, ${company}`);
  lines.push('');
  lines.push('_Bill image shared separately_');
  return lines.join('\n');
}

/** Short caption sent TOGETHER WITH the bill image (WhatsApp share sheet / file share) */
export function whatsappCaption(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const company = s.companyName || 'Cement Works';
  const lines: string[] = [];
  lines.push(`*${company}*`);
  lines.push(`Invoice *${inv.no}* · ${dateStr}`);
  if (inv.customer.name) lines.push(`Customer: ${inv.customer.name}`);
  lines.push(`*Total: Rs. ${fmt(inv.totals.total)}*${inv.totals.balance > 0 ? ` (Balance: Rs. ${fmt(inv.totals.balance)})` : ' (Paid)'}`);
  lines.push('');
  lines.push(
    inv.totals.balance > 0
      ? 'Bill image attached \u{1F9FE} — scan the UPI QR in it to pay the balance \u{1F64F}'
      : 'Bill image attached \u{1F9FE} — amount fully paid, thank you \u{1F64F}'
  );
  lines.push(`- ${s.ownerName || ''}`);
  return lines.join('\n');
}

/** Compact plain-text summary used for SMS (160-char friendly-ish) */
export function smsMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const company = (s.companyName || 'Cement Works').split(' ').slice(0, 4).join(' ');
  const items = inv.items.map((it) => `${it.name} ${it.size} x${it.qty}=${fmtShort(it.price * it.qty)}`).join('; ');
  const extras =
    (inv.labourCharge || 0) > 0 || (inv.autoCharge || 0) > 0
      ? ` (L:${fmtShort(inv.labourCharge || 0)}, A:${fmtShort(inv.autoCharge || 0)})`
      : '';
  const totals = ` Sub:${fmtShort(inv.totals.subtotal)}${extras} TOTAL:Rs.${fmtShort(inv.totals.total)}. ${inv.paymentMode}, Paid:${fmtShort(inv.totals.paid)}, Bal:${fmtShort(inv.totals.balance)}.`;
  const tail = ` Thank you! - ${s.ownerName || ''}`;
  return `${company}${inv.customer.name ? ` Cust: ${inv.customer.name}.` : ''} Inv ${inv.no} (${dateStr})\n${items}\n${totals}${tail}`;
}
