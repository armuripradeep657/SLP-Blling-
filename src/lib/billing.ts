import type { BillConfig, CartItem, Totals } from './types';

export const fmt = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtShort = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export function computeTotals(items: CartItem[], cfg: BillConfig): Totals {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const discount =
    cfg.discountType === 'percent'
      ? Math.min(subtotal, (subtotal * (cfg.discountValue || 0)) / 100)
      : Math.min(subtotal, cfg.discountValue || 0);
  const taxable = subtotal - discount;
  const tax = (taxable * (cfg.taxRate || 0)) / 100;
  const raw = taxable + tax;
  const total = cfg.roundOff ? Math.round(raw) : Math.round(raw * 100) / 100;
  const roundOff = total - raw;
  const paid = Math.min(cfg.paidAmount || 0, total);
  const balance = Math.max(total - paid, 0);
  return { subtotal, discount, taxable, tax, roundOff, total, paid, balance };
}

export function getStatus(total: number, paid: number): 'Paid' | 'Due' | 'Partial' {
  if (paid >= total) return 'Paid';
  if (paid <= 0) return 'Due';
  return 'Partial';
}

export function priceForSize(price: number, sizePrices: Record<string, number> | undefined, size: string): number {
  if (sizePrices && sizePrices[size] !== undefined && sizePrices[size] !== null) return sizePrices[size];
  return price;
}

export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  // strip leading country code 91 if the rest is 10 digits
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(-10);
  return digits.slice(-10);
}

export function waLink(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return p ? `https://wa.me/91${p}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function smsLink(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const body = encodeURIComponent(message);
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return p ? `sms:${p}&body=${body}` : `sms:&body=${body}`;
  }
  return p ? `sms:${p}?body=${body}` : `sms:?body=${body}`;
}

export function upiUri(upiId: string, payeeName: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: fmtShort(amount),
    cu: 'INR',
  });
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
}
