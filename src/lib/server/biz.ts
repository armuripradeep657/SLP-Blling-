import crypto from 'crypto';
import { db } from '@/lib/db';
import type { Invoice, CartItem, Product } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Central business data — the ONE online database (online-only app).  */
/* Every write goes through here: bump the global revision so every    */
/* authorized device's state poll picks the change up within seconds.  */
/* ------------------------------------------------------------------ */

export const num = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : d;
};

/** The BizState singleton row (rev counter) */
export async function ensureBizState() {
  return db.bizState.upsert({ where: { id: 'owner' }, update: {}, create: { id: 'owner' } });
}

/** Bump the global revision — call after EVERY successful central write */
export async function bumpRev(): Promise<number> {
  const st = await ensureBizState();
  const next = st.rev + 1;
  await db.bizState.update({ where: { id: 'owner' }, data: { rev: next } });
  return next;
}

/** Central shop settings JSON (with sensible defaults when never saved) */
export const DEFAULT_SETTINGS_JSON = JSON.stringify({
  companyName: 'SLP Cement Works',
  companyNameTe: '',
  ownerName: 'Owner',
  phone: '',
  whatsappNumber: '',
  address: '',
  upiId: '',
  invoicePrefix: 'SLP-INV-',
  nextInvoiceNo: 1,
  slipWidthMm: 58,
  thankYouNote: '',
  returnPolicy: '',
  appLang: 'en',
  gstPercent: 0,
});

export async function readSettings(): Promise<Record<string, unknown>> {
  const row = await db.bizSettings.findUnique({ where: { id: 'owner' } });
  try {
    return row ? (JSON.parse(row.settingsJson) as Record<string, unknown>) : JSON.parse(DEFAULT_SETTINGS_JSON);
  } catch {
    return JSON.parse(DEFAULT_SETTINGS_JSON);
  }
}

export async function readAppearance(): Promise<Record<string, unknown>> {
  const row = await db.bizSettings.findUnique({ where: { id: 'owner' } });
  try {
    return row ? (JSON.parse(row.appearanceJson) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Invoice prefix — from the central settings (fallback SLP-INV-) */
export async function invoicePrefix(): Promise<string> {
  const s = (await readSettings()) as { invoicePrefix?: string };
  const p = String(s.invoicePrefix ?? '').trim();
  return p || 'SLP-INV-';
}

/* ------------------------------------------------------------------ */
/* Bill validation + server-side totals recomputation — the server is  */
/* the source of truth for every amount printed on a bill.             */
/* ------------------------------------------------------------------ */

/** Verify code shape — SLP-XXXXXXXX-XXXX, unambiguous Crockford alphabet */
export const CODE_RE = /^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/;

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRTUVWXY';

/** Mint a fresh verification code server-side (crypto-random) */
export function mintVerifyCode(): string {
  const bytes = crypto.randomBytes(12);
  let s = '';
  for (let i = 0; i < 12; i++) s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `SLP-${s.slice(0, 8)}-${s.slice(8)}`;
}

export interface RecomputedBill {
  items: Array<{
    key?: string;
    productId?: string;
    name: string;
    nameTe?: string;
    size: string;
    price: number;
    origPrice: number;
    qty: number;
    discountType: 'amount' | 'percent';
    discountValue: number;
    discount: number;
  }>;
  subtotal: number;
  itemDiscounts: number;
  discount: number;
  labourCharge: number;
  autoCharge: number;
  gstPercent: number;
  gst: number;
  total: number;
  paid: number;
  balance: number;
}

/**
 * Recompute EVERY amount from the raw lines — the client's totals are
 * never trusted. Mirrors computeTotals() on the client exactly.
 */
export function recomputeBill(
  rawItems: Array<Record<string, unknown>>,
  opts: {
    discountType: unknown;
    discountValue: unknown;
    labourCharge: unknown;
    autoCharge: unknown;
    paid: unknown;
    gstPercent: number;
  }
): RecomputedBill {
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, 200).map((it): RecomputedBill['items'][number] => {
    const price = num(it.price, 0);
    const qty = num(it.qty, 0);
    const discountType = it.discountType === 'percent' ? 'percent' : 'amount';
    const discountValue = num(it.discountValue, 0);
    const gross = Math.round(price * qty * 100) / 100;
    const discountAmount =
      discountType === 'percent'
        ? Math.min(gross, Math.round(((gross * discountValue) / 100) * 100) / 100)
        : Math.min(gross, num(it.discount, discountValue));
    return {
      key: typeof it.key === 'string' ? it.key.slice(0, 80) : undefined,
      productId: typeof it.productId === 'string' ? it.productId.slice(0, 60) : undefined,
      name: String(it.name ?? '').slice(0, 80),
      nameTe: typeof it.nameTe === 'string' && it.nameTe ? String(it.nameTe).slice(0, 80) : undefined,
      size: String(it.size ?? '').slice(0, 40),
      price,
      origPrice: num(it.origPrice, price),
      qty,
      discountType,
      discountValue,
      discount: discountAmount,
    };
  });

  const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty, 0) * 100) / 100;
  const itemDiscounts = Math.round(items.reduce((s, it) => s + it.discount, 0) * 100) / 100;
  const billBase = Math.max(subtotal - itemDiscounts, 0);
  const billDiscountType = opts.discountType === 'percent' ? 'percent' : 'amount';
  const billDiscountValue = num(opts.discountValue, 0);
  const discount =
    billDiscountType === 'percent'
      ? Math.min(billBase, Math.round(((billBase * billDiscountValue) / 100) * 100) / 100)
      : Math.min(billBase, billDiscountValue);
  const labourCharge = num(opts.labourCharge);
  const autoCharge = num(opts.autoCharge);
  const taxable = Math.max(billBase - discount + labourCharge + autoCharge, 0);
  const gst = Math.round(taxable * (opts.gstPercent || 0)) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;
  const paid = Math.min(num(opts.paid), total);
  const balance = Math.max(total - paid, 0);
  return {
    items,
    subtotal,
    itemDiscounts,
    discount,
    labourCharge,
    autoCharge,
    gstPercent: opts.gstPercent || 0,
    gst,
    total,
    paid,
    balance,
  };
}

export function statusOf(total: number, paid: number): string {
  if (paid >= total) return 'Paid';
  if (paid <= 0) return 'Due';
  return 'Partial';
}

/* ------------------------------------------------------------------ */
/* Barcode verification registry — written ONLY here (bills save,      */
/* payments, cancels, import). One code per bill, one bill per code.   */
/* ------------------------------------------------------------------ */

export interface RegistryInput {
  code: string;
  billNo: string;
  companyName: string;
  billDateISO: Date;
  customerName: string;
  bill: RecomputedBill;
  paymentMode: string;
  createdBy: string;
  cancelled?: boolean;
}

export async function upsertRegistry(input: RegistryInput) {
  const { bill } = input;
  const data = {
    code: input.code,
    billNo: input.billNo,
    slot: 'owner',
    companyName: input.companyName.slice(0, 80) || 'SLP Cement Works',
    billDateISO: input.billDateISO,
    customerName: input.customerName.slice(0, 80),
    itemsJson: JSON.stringify(bill.items),
    gstPercent: bill.gstPercent,
    gstAmount: bill.gst,
    discount: bill.discount,
    labourCharge: bill.labourCharge,
    autoCharge: bill.autoCharge,
    subtotal: bill.subtotal,
    total: bill.total,
    paid: bill.paid,
    balance: bill.balance,
    paymentMode: input.paymentMode.slice(0, 10),
    paymentStatus: statusOf(bill.total, bill.paid),
    createdBy: input.createdBy.slice(0, 40) || 'Owner',
    cancelled: input.cancelled ?? false,
  };
  return db.verifiedBill.upsert({
    where: { billNo: input.billNo },
    update: {
      paid: data.paid,
      balance: data.balance,
      paymentMode: data.paymentMode,
      paymentStatus: data.paymentStatus,
      gstPercent: data.gstPercent,
      gstAmount: data.gstAmount,
      cancelled: data.cancelled,
      itemsJson: data.itemsJson,
    },
    create: data,
  });
}

/* ------------------------------------------------------------------ */
/* Product row <-> client Product shape                                */
/* ------------------------------------------------------------------ */

export function productToRow(p: Product) {
  return {
    id: String(p.id).slice(0, 60),
    name: String(p.name ?? '').slice(0, 80),
    nameTe: p.nameTe ? String(p.nameTe).slice(0, 80) : null,
    category: String(p.category ?? '').slice(0, 40),
    price: num(p.price),
    // v50: raised 20 -> 60 — the owner's Selupu Ralu line alone needs 23
    // sizes (2ft/18in/14in/9in/1ft widths); the old cap silently truncated it
    sizesJson: JSON.stringify(Array.isArray(p.sizes) ? p.sizes.slice(0, 60) : []),
    sizePricesJson: JSON.stringify(p.sizePrices ?? {}),
    image: typeof p.image === 'string' ? p.image.slice(0, 3_000_000) : null,
    stock: typeof p.stock === 'number' ? Math.round(p.stock) : null,
  };
}

export function rowToProduct(r: {
  id: string;
  name: string;
  nameTe: string | null;
  category: string;
  price: number;
  sizesJson: string;
  sizePricesJson: string;
  image: string | null;
  stock: number | null;
}): Product {
  return {
    id: r.id,
    name: r.name,
    nameTe: r.nameTe ?? undefined,
    category: r.category,
    price: r.price,
    sizes: safeParseArr(r.sizesJson),
    sizePrices: safeParseObj(r.sizePricesJson),
    image: r.image ?? undefined,
    stock: r.stock ?? undefined,
  };
}

export function safeParseArr(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function safeParseObj(s: string): Record<string, number> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** The FULL central snapshot — what GET /api/state answers with */
export async function snapshot(): Promise<{
  settings: Record<string, unknown>;
  appearance: Record<string, unknown>;
  products: Product[];
  invoices: Invoice[];
  expenses: unknown[];
  incomes: unknown[];
  labourWorks: unknown[];
  labourWorkers: unknown[];
  config: { upiId: string; gstPercent: number; nextBillNo: number };
}> {
  const [settings, appearance, products, invoices, expenses, incomes, labourWorks, labourWorkers, cfg] =
    await Promise.all([
      readSettings(),
      readAppearance(),
      // v49: order by CREATION time, never updatedAt — editing a product
      // (name/photo/price/sizes) must not move it in the catalogue. The old
      // updatedAt-desc order jumped every edited product to the top on the
      // next poll, so the list kept reshuffling after each save. name-asc is
      // only a deterministic tie-break for identical creation timestamps.
      db.bizProduct.findMany({ orderBy: [{ createdAt: 'desc' }, { name: 'asc' }] }),
      db.bizInvoice.findMany({ orderBy: [{ dateISO: 'desc' }, { createdAt: 'desc' }] }),
      db.bizExpense.findMany({ orderBy: { dateISO: 'desc' } }),
      db.bizIncome.findMany({ orderBy: { dateISO: 'desc' } }),
      db.bizLabourWork.findMany({ orderBy: { dateISO: 'desc' } }),
      db.bizLabourWorker.findMany({ orderBy: { updatedAt: 'desc' } }),
      db.appConfig.findUnique({ where: { slot: 'owner' } }),
    ]);
  return {
    settings,
    appearance,
    products: products.map(rowToProduct),
    invoices: invoices.map((r) => JSON.parse(r.payloadJson) as Invoice),
    expenses: expenses.map((r) => JSON.parse(r.payloadJson)),
    incomes: incomes.map((r) => JSON.parse(r.payloadJson)),
    labourWorks: labourWorks.map((r) => JSON.parse(r.payloadJson)),
    labourWorkers: labourWorkers.map((r) => JSON.parse(r.payloadJson)),
    config: { upiId: cfg?.upiId ?? '', gstPercent: cfg?.gstPercent ?? 0, nextBillNo: cfg?.nextBillNo ?? 0 },
  };
}
