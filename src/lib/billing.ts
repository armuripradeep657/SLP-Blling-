import type { BillConfig, CartItem, Invoice, LabourWork, PaymentMode, PaymentRecord, Totals } from './types';

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

/** Open the customer's WhatsApp chat with NO pre-filled text — bill goes as IMAGE only */
export function waChatLink(phone: string): string {
  const p = normalizePhone(phone);
  return p ? `https://wa.me/91${p}` : 'https://wa.me/';
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

/* ------------------------------------------------------------------ */
/* Money-in ledger helpers — income = payments actually received       */
/* ------------------------------------------------------------------ */

/** Local (not UTC) YYYY-MM-DD key for grouping income / expenses by day */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Local YYYY-MM key for grouping by month */
export function localMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * All money-in records for an invoice. Old invoices saved before payments
 * tracking existed get their paid amount synthesized as one payment on the
 * bill date (mode Due advances were received in cash).
 */
export function paymentsOf(inv: Invoice): PaymentRecord[] {
  if (inv.payments && inv.payments.length > 0) return inv.payments;
  if (inv.totals.paid > 0) {
    return [
      {
        id: 'init',
        dateISO: inv.dateISO,
        amount: inv.totals.paid,
        mode: inv.paymentMode === 'Due' ? 'Cash' : inv.paymentMode,
      },
    ];
  }
  return [];
}

/**
 * Add a payment against an invoice's balance — returns a NEW invoice or null
 * when nothing to apply. Updates paid/balance/status and appends the record.
 */
export function applyPayment(
  inv: Invoice,
  amount: number,
  mode: PaymentMode,
  dateISO: string,
  pid?: string
): Invoice | null {
  const add = Math.round(Math.min(Math.max(amount, 0), inv.totals.balance) * 100) / 100;
  if (add <= 0) return null;
  const paid = Math.round((inv.totals.paid + add) * 100) / 100;
  const payments = [
    ...paymentsOf(inv),
    {
      id: pid ?? `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dateISO,
      amount: add,
      mode,
    },
  ];
  return {
    ...inv,
    status: getStatus(inv.totals.total, paid),
    totals: { ...inv.totals, paid, balance: Math.max(inv.totals.total - paid, 0) },
    payments,
  };
}

/** Money summary of one labour entry — works for new (payments list) and legacy rows */
export interface LabourMoney {
  /** total wage agreed for the work */
  wage: number;
  /** total money given so far (includes extra money beyond the wage) */
  paid: number;
  /** balance still to pay (0 when fully paid or overpaid) */
  balance: number;
  /** money given beyond the wage (bonus / extra) */
  extra: number;
}

const r2 = (n: number): number => Math.round(n * 100) / 100;

export function labourMoney(e: LabourWork): LabourMoney {
  const legacyPaid = r2(e.paid ?? e.amount ?? 0);
  const legacyBal = r2(e.balance ?? 0);
  if (e.payments && e.payments.length > 0) {
    const paid = r2(e.payments.reduce((s, p) => s + p.amount, 0));
    const wage = r2(e.wage ?? legacyPaid + legacyBal);
    return {
      wage,
      paid,
      balance: Math.max(0, r2(wage - paid)),
      extra: Math.max(0, r2(paid - wage)),
    };
  }
  // legacy row — only paid/balance/amount fields exist
  return { wage: r2(legacyPaid + legacyBal), paid: legacyPaid, balance: legacyBal, extra: 0 };
}
