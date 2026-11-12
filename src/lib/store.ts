'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from './defaultData';
import { computeTotals, getStatus, priceForSize, applyPayment } from './billing';
import type {
  Appearance,
  BillConfig,
  BillLanguage,
  BusinessSettings,
  CartItem,
  Customer,
  DeletedIds,
  Expense,
  IncomeEntry,
  Invoice,
  LabourWork,
  MainTab,
  PaymentMode,
  Product,
} from './types';

const EMPTY_DELETED: DeletedIds = {
  invoices: [],
  expenses: [],
  incomes: [],
  labours: [],
  products: [],
};

/** Helper: mark an id deleted (tombstone) so sync never resurrects it */
function tomb(all: DeletedIds, key: keyof DeletedIds, id: string): DeletedIds {
  const list = all[key];
  return list.includes(id) ? all : { ...all, [key]: [id, ...list] };
}

/** Helper: bump the sync LWW clock (config-level changes) */
function touch(now = Date.now()): number {
  return now;
}

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

  expenses: Expense[];
  /** Manual income entries (money received outside bills) */
  incomes: IncomeEntry[];
  /** Labour work register — who worked, what quantity, money paid now + balance */
  labourWorks: LabourWork[];
  /** App look — background theme, header colour, owner's watermark photo */
  appearance: Appearance;
  /** Tombstones — ids deleted anywhere, so cloud sync never brings them back */
  deletedIds: DeletedIds;
  /** Sync LWW clock — bumped whenever settings/appearance/products/bills numbering change */
  dataUpdatedAt: number;

  setActiveTab: (t: MainTab) => void;
  saveSettings: (s: Partial<BusinessSettings>) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addToCart: (product: Product, size: string) => void;
  addCustomItem: (name: string, size: string, price: number, qty: number, nameTe?: string) => void;
  updateCartItem: (key: string, patch: Partial<Pick<CartItem, 'price' | 'discount' | 'qty'>>) => void;
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
  updateInvoiceLanguage: (id: string, language: BillLanguage) => void;
  /** Receive a dues payment — recorded as income on the day received */
  receiveDuePayment: (id: string, amount: number, mode: PaymentMode) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  /** Add a manual income entry (name + Cash/UPI mode) — counts in the ledger day/month */
  addIncome: (e: Omit<IncomeEntry, 'id'>) => void;
  deleteIncome: (id: string) => void;
  /** Add a labour work entry (worker, date, work done, product) */
  addLabourWork: (e: Omit<LabourWork, 'id'>) => void;
  deleteLabourWork: (id: string) => void;
  /** Change the app look — background theme / header colour / watermark photo */
  setAppearance: (a: Partial<Appearance>) => void;
}

const DEFAULT_CONFIG: BillConfig = {
  discountType: 'amount',
  discountValue: 0,
  labourCharge: 0,
  autoCharge: 0,
  paymentMode: 'Cash',
  paidAmount: 0,
  language: 'en',
  delivery: { delivered: false, driver: '', vehicle: '', address: '' },
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
      expenses: [],
      incomes: [],
      labourWorks: [],
      appearance: { bgTheme: 'blue', headerTheme: 'blue', watermark: '' },
      deletedIds: EMPTY_DELETED,
      dataUpdatedAt: 0,

      setActiveTab: (t) => set({ activeTab: t }),

      saveSettings: (s) =>
        set((st) => ({ settings: { ...st.settings, ...s }, dataUpdatedAt: touch() })),

      addProduct: (p) => set((st) => ({ products: [p, ...st.products], dataUpdatedAt: touch() })),

      updateProduct: (id, p) =>
        set((st) => ({
          products: st.products.map((x) => (x.id === id ? { ...x, ...p } : x)),
          dataUpdatedAt: touch(),
        })),

      deleteProduct: (id) =>
        set((st) => ({
          products: st.products.filter((x) => x.id !== id),
          deletedIds: tomb(st.deletedIds, 'products', id),
          dataUpdatedAt: touch(),
        })),

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
              { key, productId: product.id, name: product.name, nameTe: product.nameTe, size, price, qty: 1 },
            ],
          };
        });
      },

      addCustomItem: (name, size, price, qty, nameTe) => {
        const norm = size.trim() || 'Standard';
        const key = `custom::${Date.now()}::${Math.random().toString(36).slice(2, 7)}`;
        const teName = nameTe?.trim() || undefined;
        set((st) => {
          const cart = [...st.cart, { key, productId: 'custom', name, nameTe: teName, size: norm, price, qty }];

          // Auto-save the custom item into the product catalog — matched by
          // name (case-insensitive); new size/price merges into the product so
          // it can be billed again with one tap from the catalog.
          const nameL = name.trim().toLowerCase();
          const idx = st.products.findIndex((p) => p.name.toLowerCase() === nameL);
          let products = st.products;
          if (idx >= 0) {
            const p = st.products[idx];
            const sizes = p.sizes.includes(norm) ? p.sizes : [...p.sizes, norm];
            products = [...st.products];
            products[idx] = {
              ...p,
              nameTe: p.nameTe ?? teName,
              sizes,
              sizePrices: { ...p.sizePrices, [norm]: price },
            };
          } else {
            products = [
              {
                id: `p-${Date.now()}`,
                name: name.trim(),
                nameTe: teName,
                category: 'Custom',
                price,
                sizes: [norm],
                sizePrices: { [norm]: price },
              },
              ...st.products,
            ];
          }
          return { cart, products };
        });
      },

      // Owner edits while billing: change the unit price directly on the line
      // and/or apply a discount for that specific item (catalog stays untouched)
      updateCartItem: (key, patch) =>
        set((st) => ({
          cart: st.cart.map((c) => (c.key === key ? { ...c, ...patch } : c)),
        })),

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
          // keep the chosen bill language sticky across bills; delivery details reset
          billConfig: { ...DEFAULT_CONFIG, language: st.billConfig.language },
        })),

      completeInvoice: () => {
        const { cart, customer, billConfig, settings, products } = get();
        if (cart.length === 0) return null;
        const totals = computeTotals(cart, billConfig);
        const no = `${settings.invoicePrefix}${settings.nextInvoiceNo}`;
        const dateISO = new Date().toISOString();
        // Delivery / driver details only when the bill is marked Delivered
        const delivery =
          billConfig.delivery?.delivered
            ? { ...billConfig.delivery, dateISO }
            : undefined;
        // Money received at bill time counts as income on the bill date
        // (Due-mode advances were received in cash)
        const payments =
          totals.paid > 0
            ? [
                {
                  id: `pay-${Date.now()}`,
                  dateISO,
                  amount: totals.paid,
                  mode: (billConfig.paymentMode === 'Due' ? 'Cash' : billConfig.paymentMode) as PaymentMode,
                },
              ]
            : undefined;
        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          no,
          dateISO,
          customer: { ...customer },
          items: cart.map((c) => ({ ...c })),
          totals,
          discountType: billConfig.discountType,
          discountValue: billConfig.discountValue,
          labourCharge: billConfig.labourCharge || 0,
          autoCharge: billConfig.autoCharge || 0,
          paymentMode: billConfig.paymentMode,
          language: billConfig.language,
          status: getStatus(totals.total, totals.paid),
          delivery,
          payments,
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
          // fresh customer for the next bill — name & mobile are entered new every time
          customer: { name: '', phone: '', address: '' },
          // fresh config for the next bill (Cash mode, no leftover discount/charges;
          // chosen bill language stays sticky)
          billConfig: { ...DEFAULT_CONFIG, language: billConfig.language },
          settings: { ...st.settings, nextInvoiceNo: st.settings.nextInvoiceNo + 1 },
          dataUpdatedAt: touch(),
        }));
        return invoice;
      },

      clearLastInvoice: () => set({ lastInvoice: null }),

      deleteInvoice: (id) =>
        set((st) => ({
          invoices: st.invoices.filter((i) => i.id !== id),
          deletedIds: tomb(st.deletedIds, 'invoices', id),
        })),

      // Marking paid records the newly-received amount as income today
      updateInvoiceStatus: (id, paidAmount) =>
        set((st) => {
          const patchOne = (i: Invoice): Invoice => {
            if (i.id !== id) return i;
            const paid = Math.min(paidAmount, i.totals.total);
            const added = Math.round((paid - i.totals.paid) * 100) / 100;
            if (added <= 0) return i;
            return (
              applyPayment(i, added, 'Cash', new Date().toISOString()) ?? i
            );
          };
          return {
            invoices: st.invoices.map(patchOne),
            lastInvoice: st.lastInvoice ? patchOne(st.lastInvoice) : st.lastInvoice,
            dataUpdatedAt: touch(),
          };
        }),

      // Flip the bill language (also from the invoice modal while sharing) —
      // updates the saved invoice so History re-shares in the same language
      updateInvoiceLanguage: (id, language) =>
        set((st) => ({
          invoices: st.invoices.map((i) => (i.id === id ? { ...i, language } : i)),
          lastInvoice:
            st.lastInvoice && st.lastInvoice.id === id ? { ...st.lastInvoice, language } : st.lastInvoice,
          dataUpdatedAt: touch(),
        })),

      // Dues list: receive a balance payment — counts as income TODAY
      receiveDuePayment: (id, amount, mode) =>
        set((st) => {
          const now = new Date().toISOString();
          const patchOne = (i: Invoice): Invoice =>
            i.id === id ? (applyPayment(i, amount, mode, now) ?? i) : i;
          return {
            invoices: st.invoices.map(patchOne),
            lastInvoice: st.lastInvoice ? patchOne(st.lastInvoice) : st.lastInvoice,
            dataUpdatedAt: touch(),
          };
        }),

      addExpense: (e) =>
        set((st) => ({
          expenses: [
            { ...e, id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ...st.expenses,
          ],
        })),

      deleteExpense: (id) =>
        set((st) => ({
          expenses: st.expenses.filter((x) => x.id !== id),
          deletedIds: tomb(st.deletedIds, 'expenses', id),
        })),

      addIncome: (e) =>
        set((st) => ({
          incomes: [
            { ...e, id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ...st.incomes,
          ],
        })),

      deleteIncome: (id) =>
        set((st) => ({
          incomes: st.incomes.filter((x) => x.id !== id),
          deletedIds: tomb(st.deletedIds, 'incomes', id),
        })),

      addLabourWork: (e) =>
        set((st) => ({
          labourWorks: [
            { ...e, id: `lw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ...st.labourWorks,
          ],
        })),

      deleteLabourWork: (id) =>
        set((st) => ({
          labourWorks: st.labourWorks.filter((x) => x.id !== id),
          deletedIds: tomb(st.deletedIds, 'labours', id),
        })),

      setAppearance: (a) =>
        set((st) => ({ appearance: { ...st.appearance, ...a }, dataUpdatedAt: touch() })),
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
          appearance: { ...current.appearance, ...(p.appearance ?? {}) },
        };
      },
      partialize: (st) => ({
        settings: st.settings,
        products: st.products,
        cart: st.cart,
        invoices: st.invoices,
        billConfig: st.billConfig,
        customer: st.customer,
        // activeTab intentionally NOT persisted — a fresh app open always lands on Bill
        expenses: st.expenses,
        incomes: st.incomes,
        labourWorks: st.labourWorks,
        appearance: st.appearance,
        deletedIds: st.deletedIds,
        dataUpdatedAt: st.dataUpdatedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
