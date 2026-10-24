import { fmtShort, fmt } from './billing';
import type { Invoice, BusinessSettings } from './types';

/** Detailed message used for WhatsApp (emojis + itemized list with sizes) */
export function whatsappMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [];
  lines.push(`*${s.companyName}*`);
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
  });
  lines.push('------------------------------');
  lines.push(`Subtotal: ${fmt(inv.totals.subtotal)}`);
  if (inv.totals.discount > 0) lines.push(`Discount: -${fmt(inv.totals.discount)}`);
  if (inv.taxRate > 0) lines.push(`GST (${inv.taxRate}%): ${fmt(inv.totals.tax)}`);
  if (inv.roundOff && inv.totals.roundOff !== 0) lines.push(`Round Off: ${fmt(inv.totals.roundOff)}`);
  lines.push(`*TOTAL: Rs. ${fmt(inv.totals.total)}*`);
  lines.push(`Payment: ${inv.paymentMode}`);
  lines.push(`Paid: ${fmt(inv.totals.paid)} | Balance: ${fmt(inv.totals.balance)}`);
  if (inv.status === 'Paid') lines.push('');
  lines.push('');
  if (s.upiId) lines.push(`UPI ID: ${s.upiId}`);
  if (s.returnPolicy) lines.push(`${s.returnPolicy}`);
  lines.push('');
  lines.push(`Thank you! Visit Again \u{1F64F}`);
  lines.push(`- ${s.ownerName}`);
  lines.push(`Proprietor, ${s.companyName}`);
  lines.push('');
  lines.push('_Bill image shared separately_');
  return lines.join('\n');
}

/** Compact plain-text summary used for SMS (160-char friendly-ish) */
export function smsMessage(inv: Invoice, s: BusinessSettings): string {
  const d = new Date(inv.dateISO);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const head = `${s.companyName.split(' ').slice(0, 4).join(' ')} - Invoice ${inv.no} (${dateStr})`;
  const cust = inv.customer.name ? ` Cust: ${inv.customer.name}.` : '';
  const items = inv.items.map((it) => `${it.name} ${it.size} x${it.qty}=${fmtShort(it.price * it.qty)}`).join('; ');
  const totals = ` Sub:${fmtShort(inv.totals.subtotal)}${inv.taxRate > 0 ? ` GST:${fmtShort(inv.totals.tax)}` : ''} TOTAL:Rs.${fmtShort(inv.totals.total)}. ${inv.paymentMode}, Paid:${fmtShort(inv.totals.paid)}, Bal:${fmtShort(inv.totals.balance)}.`;
  const tail = ` Thank you! - ${s.ownerName}`;
  return `${head}${cust}\n${items}\n${totals}${tail}`;
}
