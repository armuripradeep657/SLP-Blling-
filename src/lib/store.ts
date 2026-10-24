'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from './defaultData';
import { computeTotals, getStatus, priceForSize } from './billing';
import type {
  BillConfig,
  BusinessSettings,
  CartItem,
  Customer,
  Invoice,
  MainTab,
  Product,
} from './types';

interface BillingStore {
  hydrated: boolean;
  settings: BusinessSettings;
  products: Product[];
  cart: CartItem[];
  invoices: Invoice[];
  billConfig: BillConfig;
  customer: Customer;
  activeTab: MainTab;
  lastInvoice: Invoice | null;

  setActiveTab: (t: MainTab) => void;
  saveSettings: (s: Partial<BusinessSettings>) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addToCart: (product: Product, size: string) => void;
  addCustomItem: (name: string, size: string, price: number, qty: number) => void;
  incQty: (key: string) => void;
  decQty: (key: string) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;

  setCustomer: (c: Partial<Customer>) => void;
  setBillConfig: (c: Partial<BillConfig>) => void;
  resetBillConfig: () => void;

  completeInvoice: () => Invoice | null;
  clearLastInvoice: () => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, paidAmount: number) => void;
}

const DEFAULT_CONFIG: BillConfig = {
  discountType: 'amount',
  discountValue: 0,
  taxRate: 0,
  roundOff: true,
  paymentMode: 'Cash',
  paidAmount: 0,
};

export const useStore = create<BillingStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      settings: DEFAULT_SETTINGS,
      products: DEFAULT_PRODUCTS,
      cart: [],
      invoices: [],
      billConfig: DEFAULT_CONFIG,
      customer: { name: '', phone: '', address: '' },
      activeTab: 'bill',
      lastInvoice: null,

      setActiveTab: (t) => set({ activeTab: t }),

      saveSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

      addProduct: (p) => set((st) => ({ products: [p, ...st.products] })),

      updateProduct: (id, p) =>
        set((st) => ({ products: st.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

      deleteProduct: (id) => set((st) => ({ products: st.products.filter((x) => x.id !== id) })),

      addToCart: (product, size) => {
        const price = priceForSize(product.price, product.sizePrices, size);
        const key = `${product.id}::${size}`;
        set((st) => {
          const existing = st.cart.find((c) => c.key === key);
          if (existing) {
            return {
              cart: st.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)),
            };
          }
          return {
            cart: [
              ...st.cart,
              { key, productId: product.id, name: product.name, size, price, qty: 1 },
            ],
          };
        });
      },

      addCustomItem: (name, size, price, qty) => {
        const key = `custom::${Date.now()}::${Math.random().toString(36).slice(2, 7)}`;
        set((st) => ({
          cart: [...st.cart, { key, productId: 'custom', name, size, price, qty }],
        }));
      },

      incQty: (key) =>
        set((st) => ({
          cart: st.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)),
        })),

      decQty: (key) =>
        set((st) => ({
          cart: st.cart
            .map((c) => (c.key === key ? { ...c, qty: c.qty - 1 } : c))
            .filter((c) => c.qty > 0),
        })),

      removeFromCart: (key) => set((st) => ({ cart: st.cart.filter((c) => c.key !== key) })),

      clearCart: () => set({ cart: [] }),

      setCustomer: (c) => set((st) => ({ customer: { ...st.customer, ...c } })),

      setBillConfig: (c) => set((st) => ({ billConfig: { ...st.billConfig, ...c } })),

      resetBillConfig: () =>
        set((st) => ({
          billConfig: { ...DEFAULT_CONFIG, taxRate: st.settings.defaultTaxRate ?? 0 },
        })),

      completeInvoice: () => {
        const { cart, customer, billConfig, settings, products } = get();
        if (cart.length === 0) return null;
        const totals = computeTotals(cart, billConfig);
        const no = `${settings.invoicePrefix}${settings.nextInvoiceNo}`;
        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          no,
          dateISO: new Date().toISOString(),
          customer: { ...customer },
          items: cart.map((c) => ({ ...c })),
          totals,
          taxRate: billConfig.taxRate,
          discountType: billConfig.discountType,
          discountValue: billConfig.discountValue,
          roundOff: billConfig.roundOff,
          paymentMode: billConfig.paymentMode,
          status: getStatus(totals.total, totals.paid),
        };
        // deduct stock where tracked
        const updatedProducts = products.map((p) => {
          const sold = cart.filter((c) => c.productId === p.id).reduce((s, c) => s + c.qty, 0);
          if (sold > 0 && typeof p.stock === 'number') return { ...p, stock: Math.max(p.stock - sold, 0) };
          return p;
        });
        set((st) => ({
          invoices: [invoice, ...st.invoices],
          products: updatedProducts,
          cart: [],
          lastInvoice: invoice,
          settings: { ...st.settings, nextInvoiceNo: st.settings.nextInvoiceNo + 1 },
        }));
        return invoice;
      },

      clearLastInvoice: () => set({ lastInvoice: null }),

      deleteInvoice: (id) => set((st) => ({ invoices: st.invoices.filter((i) => i.id !== id) })),

      updateInvoiceStatus: (id, paidAmount) =>
        set((st) => ({
          invoices: st.invoices.map((i) => {
            if (i.id !== id) return i;
            const paid = Math.min(paidAmount, i.totals.total);
            return {
              ...i,
              status: getStatus(i.totals.total, paid),
              totals: { ...i.totals, paid, balance: Math.max(i.totals.total - paid, 0) },
            };
          }),
        })),
    }),
    {
      name: 'slp-cement-billing-v1',
      storage: createJSONStorage(() => localStorage),
      // Rehydrate manually after mount (page.tsx) — prevents SSR hydration mismatch
      skipHydration: true,
      // Deep-merge persisted slices over defaults so partial/old saved data
      // never wipes new fields (e.g. companyName, upiId)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BillingStore>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          billConfig: { ...current.billConfig, ...(p.billConfig ?? {}) },
          customer: { ...current.customer, ...(p.customer ?? {}) },
        };
      },
      partialize: (st) => ({
        settings: st.settings,
        products: st.products,
        cart: st.cart,
        invoices: st.invoices,
        billConfig: st.billConfig,
        customer: st.customer,
        activeTab: st.activeTab,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
