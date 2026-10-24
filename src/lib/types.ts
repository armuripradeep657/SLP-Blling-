// Core types for SLP Cement Works billing app

export interface BusinessSettings {
  companyName: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  gstin: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  defaultTaxRate: number;
  roundOffEnabled: boolean;
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
  price: number; // unit price captured at add time
  qty: number;
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
  taxRate: number;
  roundOff: boolean;
  paymentMode: PaymentMode;
  paidAmount: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  roundOff: number;
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
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
  roundOff: boolean;
  paymentMode: PaymentMode;
  status: 'Paid' | 'Due' | 'Partial';
}

export type MainTab = 'bill' | 'products' | 'history' | 'settings';
