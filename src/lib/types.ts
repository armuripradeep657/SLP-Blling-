// Core types for SLP Cement Works billing app

export interface BusinessSettings {
  companyName: string;
  /** Company name printed on Telugu bills (తెలుగు బిల్లు పేరు) */
  companyNameTe: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  slipWidthMm: 58 | 80;
  thankYouNote: string;
  returnPolicy: string;
  /** App UI language — the whole app (nav, buttons, panels) switches between English and Telugu */
  appLang: AppLanguage;
}

export interface Product {
  id: string;
  name: string;
  /** Product name in Telugu — printed on Telugu bills when set */
  nameTe?: string;
  category: string;
  price: number; // default unit price
  sizes: string[];
  sizePrices?: Record<string, number>; // optional per-size override
  image?: string; // path under /products or base64 data URL
  stock?: number;
}

export interface CartItem {
  key: string; // productId + '::' + size
  productId: string;
  name: string;
  /** Telugu name snapshot (from product) — used when bill language is Telugu */
  nameTe?: string;
  size: string;
  price: number; // unit price — editable per bill while billing
  qty: number;
  discount?: number; // per-item flat ₹ discount for this line
}

export interface Customer {
  name: string;
  phone: string;
  address?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Due';
export type DiscountType = 'amount' | 'percent';

/** Language the bill (thermal slip image + bill text) is rendered in — 'both' = bilingual */
export type BillLanguage = 'en' | 'te' | 'both';
/** Language of the app UI itself (navigation, panels, buttons) */
export type AppLanguage = 'en' | 'te';

export interface BillConfig {
  discountType: DiscountType;
  discountValue: number;
  labourCharge: number;
  autoCharge: number;
  paymentMode: PaymentMode;
  paidAmount: number;
  language: BillLanguage; // bill language for slip image + text
  /** Delivery details — tick "Delivered" while billing to attach driver info */
  delivery: DeliveryInfo;
}

/** Delivery / driver details attached to a bill when it is delivered */
export interface DeliveryInfo {
  delivered: boolean;
  driver: string;
  vehicle: string;
  address: string;
  /** set when the bill is completed */
  dateISO?: string;
}

/** One money-in record on an invoice (initial payment or a later dues receipt) */
export interface PaymentRecord {
  id: string;
  dateISO: string;
  amount: number;
  mode: PaymentMode;
}

export interface Totals {
  subtotal: number;
  itemDiscounts: number; // sum of per-item discounts
  discount: number; // bill-level discount
  labourCharge: number;
  autoCharge: number;
  roundOff: number; // always 0 — round off removed
  total: number;
  paid: number;
  balance: number;
}

export interface Invoice {
  id: string;
  no: string;
  dateISO: string;
  customer: Customer;
  items: CartItem[];
  totals: Totals;
  discountType: DiscountType;
  discountValue: number;
  labourCharge: number;
  autoCharge: number;
  paymentMode: PaymentMode;
  language: BillLanguage; // saved per invoice — History re-share keeps it
  status: 'Paid' | 'Due' | 'Partial';
  /** Driver / delivery details — set when the bill was marked Delivered */
  delivery?: DeliveryInfo;
  /** Money received against this invoice (bill date + dues receipts) */
  payments?: PaymentRecord[];
}

/** Ledger expense categories */
export type ExpenseCategory = 'Labour wages' | 'Diesel' | 'Raw material' | 'Other';

export interface Expense {
  id: string;
  dateISO: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  /** How the money was paid out — shown in the ledger (Cash / UPI / Card) */
  mode?: PaymentMode;
}

/** Manual income entry — money received outside a bill (name + Cash/UPI mode) */
export interface IncomeEntry {
  id: string;
  dateISO: string;
  /** What the money was for / from whom — shown as the ledger row name */
  name: string;
  amount: number;
  /** Cash / UPI / Card — shown as a chip in the ledger */
  mode?: PaymentMode;
}

export type MainTab = 'bill' | 'products' | 'ledger' | 'history' | 'settings';
