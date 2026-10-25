// Core types for SLP Cement Works billing app

export interface BusinessSettings {
  companyName: string;
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
}

export interface Product {
  id: string;
  name: string;
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

export interface BillConfig {
  discountType: DiscountType;
  discountValue: number;
  labourCharge: number;
  autoCharge: number;
  paymentMode: PaymentMode;
  paidAmount: number;
  language: BillLanguage; // bill language for slip image + text
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
}

export type MainTab = 'bill' | 'products' | 'history' | 'settings';

/** Language the bill (thermal slip image + bill text) is rendered in */
export type BillLanguage = 'en' | 'te';
