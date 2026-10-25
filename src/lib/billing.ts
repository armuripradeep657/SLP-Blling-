import type { BillConfig, CartItem, Totals } from './types';

export const fmt = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtShort = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

/** Net amount of one cart line after its own per-item discount (never below 0) */
export function lineNet(it: CartItem): number {
  const gross = it.price * it.qty;
  const d = Math.min(Math.max(it.discount || 0, 0), gross);
  return Math.round((gross - d) * 100) / 100;
}

export function computeTotals(items: CartItem[], cfg: BillConfig): Totals {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const itemDiscounts = items.reduce((s, it) => s + (it.price * it.qty - lineNet(it)), 0);
  const base = subtotal - itemDiscounts;
  const discount =
    cfg.discountType === 'percent'
      ? Math.min(base, (base * (cfg.discountValue || 0)) / 100)
      : Math.min(base, cfg.discountValue || 0);
  const labourCharge = cfg.labourCharge || 0;
  const autoCharge = cfg.autoCharge || 0;
  // Exact total — round off removed
  const total = Math.round((base - discount + labourCharge + autoCharge) * 100) / 100;
  const paid = Math.min(cfg.paidAmount || 0, total);
  const balance = Math.max(total - paid, 0);
  return { subtotal, itemDiscounts, discount, labourCharge, autoCharge, roundOff: 0, total, paid, balance };
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

export function upiUri(upiId: string, amount: number, note: string): string {
  // QR is based on the UPI ID only — no payee name (company name) so every
  // UPI app resolves the handle directly without name-mismatch warnings.
  const params = new URLSearchParams({
    pa: upiId,
    am: fmtShort(amount),
    cu: 'INR',
  });
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
}
