'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from './defaultData';
import { computeTotals, priceForSize } from './billing';
import { newVerifyCode } from './verify-id';
import {
  apiBillSave,
  apiBillPatch,
  apiBillDelete,
  apiBillsResetAll,
  apiProductPut,
  apiProductPatch,
  apiProductDelete,
  apiSettingsPut,
  apiLabourPut,
  apiLabourDelete,
  apiLedgerPut,
  apiLedgerDelete,
  apiStateGet,
  apiStateImport,
  apiStaffMe,
  apiStaffChangePassword,
  authRole,
  type StaffMe,
} from './cloud';
import type {
  Appearance,
  BillConfig,
  BillLanguage,
  BusinessSettings,
  CartItem,
  Customer,
  Expense,
  IncomeEntry,
  Invoice,
  LabourPayment,
  LabourWork,
  LabourWorker,
  MainTab,
  PaymentMode,
  Product,
} from './types';

/* ------------------------------------------------------------------ */
/* ONLINE-ONLY STORE — the server's central database is the ONLY       */
/* source of truth. Nothing business-related is persisted on the       */
/* device: this store is a MIRROR of the server, refreshed by a short  */
/* poll (every device sees every change within seconds, no manual      */
/* refresh) and updated locally only AFTER the server confirms a       */
/* write. A bill is never shown as saved before the server confirmed   */
/* it, and with no internet NOTHING can be saved.                      */
/*                                                                     */
/* Only device-local UI state persists (cart in progress, bill config, */
/* customer being typed, open tab) — never business data.              */
/* ------------------------------------------------------------------ */

const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Error codes thrown by every mutation — the UI maps them to messages */
export type SaveError = 'offline' | 'saveFailed' | 'unauthorized';
export class StoreError extends Error {
  code: SaveError;
  constructor(code: SaveError) {
    super(code);
    this.code = code;
  }
}

/**
 * Normalise a labour entry: guarantees the wage + payments list exist (legacy
 * rows are converted once) and keeps the stored paid/balance fields in sync
 * so the server, the notebook and every device always agree.
 */
function normalizeLabourWork(e: LabourWork): LabourWork {
  const legacyPaid = r2(e.paid ?? e.amount ?? 0);
  const legacyBal = r2(e.balance ?? 0);
  const wage = r2(e.wage ?? legacyPaid + legacyBal);
  const payments = e.payments
    ? e.payments
    : legacyPaid > 0
      ? [{ id: `${e.id}-pay0`, dateISO: e.dateISO, amount: legacyPaid, mode: e.mode }]
      : [];
  const paid = r2(payments.reduce((s, p) => s + p.amount, 0));
  const balance = Math.max(0, r2(wage - paid));
  return {
    ...e,
    wage,
    payments,
    paid: paid > 0 ? paid : undefined,
    balance: balance > 0 ? balance : undefined,
  };
}

interface BillingStore {
  /** true once the first successful central-state pull happened */
  synced: boolean;
  /** connectivity + server reachability — drives the offline banner */
  online: boolean;
  /** the server revision this device has already applied */
  rev: number;
  /** v52 save-status for the header chip: idle → saving → saved / failed */
  saveState: 'idle' | 'saving' | 'saved' | 'failed';
  /** re-runs the last failed IDEMPOTENT save — set while saveState='failed' */
  retrySave: (() => Promise<void>) | null;

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
  /** Saved labourers — the notebook picks them instead of retyping names */
  labourWorkers: LabourWorker[];
  /** App look — background theme, header colour, owner's watermark photo */
  appearance: Appearance;

  /** Central server config mirror (UPI ID + GST — authoritative on the server) */
  srvConfig: { upiId: string; gstPercent: number; nextBillNo: number };
  /** signed-in staff member (null = owner mode) — v39 */
  staff: StaffMe | null;

  /* ---- lifecycle ---- */
  /** pull the central state once (login / manual refresh) — imports the
   *  device's old offline-era data when the central db starts empty */
  bootstrap: () => Promise<void>;
  /** the background poll — keeps every device in sync without any refresh */
  startSync: () => void;
  stopSync: () => void;
  /** apply a server snapshot to this device's mirror */
  applySnapshot: (s: {
    settings?: Partial<BusinessSettings>;
    appearance?: Partial<Appearance>;
    products?: Product[];
    invoices?: Invoice[];
    expenses?: Expense[];
    incomes?: IncomeEntry[];
    labourWorks?: LabourWork[];
    labourWorkers?: LabourWorker[];
    config?: { upiId: string; gstPercent: number; nextBillNo?: number };
    rev?: number;
  }) => void;

  setActiveTab: (t: MainTab) => void;
  saveSettings: (s: Partial<BusinessSettings>) => Promise<void>;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addToCart: (product: Product, size: string) => void;
  addCustomItem: (name: string, size: string, price: number, qty: number, nameTe?: string) => void;
  updateCartItem: (
    key: string,
    patch: Partial<Pick<CartItem, 'price' | 'discount' | 'qty' | 'discountType' | 'discountValue'>>
  ) => void;
  incQty: (key: string) => void;
  decQty: (key: string) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;

  setCustomer: (c: Partial<Customer>) => void;
  setBillConfig: (c: Partial<BillConfig>) => void;
  resetBillConfig: () => void;

  /** save the bill — RESOLVED ONLY WHEN THE SERVER CONFIRMS IT; returns the
   *  canonical bill (server number, server totals, registry-registered code) */
  completeInvoice: (opts?: { paymentRef?: string; paidAmount?: number }) => Promise<Invoice>;
  clearLastInvoice: () => void;
  /** adopt the registry's winning code after a registration race (unused — kept for compat) */
  setInvoiceVerifyCode: (id: string, code: string) => void;
  deleteInvoice: (id: string) => Promise<void>;
  resetInvoices: () => Promise<void>;
  /** staff session helpers (v39) */
  refreshStaff: () => Promise<StaffMe | null>;
  staffChangePassword: (body: { action?: 'keep'; current?: string; newPassword?: string }) => Promise<void>;
  /** cancel a bill — verification answers CANCELLED for its barcode */
  cancelInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, paidAmount: number) => Promise<void>;
  updateInvoiceLanguage: (id: string, language: BillLanguage) => Promise<void>;
  /** Receive a dues payment — recorded as income on the day received */
  receiveDuePayment: (id: string, amount: number, mode: PaymentMode) => Promise<void>;
  /** give pre-barcode bills (imported old data) a verification ID + register it */
  migrateVerifyCodes: () => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  /** Add a manual income entry (name + Cash/UPI mode) — counts in the ledger day/month */
  addIncome: (e: Omit<IncomeEntry, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  /** Add a labour work entry (worker, date, work done, product) — unknown
   *  worker names are saved to the labourers list automatically */
  addLabourWork: (e: Omit<LabourWork, 'id'>) => Promise<void>;
  addLabourWorker: (name: string, nameTe?: string, phone?: string) => Promise<void>;
  deleteLabourWorker: (id: string) => Promise<void>;
  deleteLabourWork: (id: string) => Promise<void>;
  /** Edit the details of an entered labour work (date, name, work, qty, wage, mode) */
  updateLabourWork: (
    id: string,
    patch: Partial<Pick<LabourWork, 'dateISO' | 'name' | 'work' | 'qty' | 'wage' | 'mode'>>
  ) => Promise<void>;
  /** Record money given to the labour later — balance paid or extra money */
  addLabourPayment: (id: string, p: { amount: number; mode?: PaymentMode; note?: string; dateISO?: string }) => Promise<void>;
  /** Remove a wrongly-entered payment */
  deleteLabourPayment: (id: string, paymentId: string) => Promise<void>;
  /** Change the app look — background theme / header colour / watermark photo */
  setAppearance: (a: Partial<Appearance>) => Promise<void>;
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
    (set, get) => {
      /* v52 SAVE STATUS — every idempotent save flows through runSave: the
         header chip shows Saving… / Saved / Failed, and a failed save keeps
         a RETRY closure (the dialogs also stay open, so nothing the owner
         typed is ever lost). Non-idempotent flows (bill save, dues payment)
         keep their own confirmation UX — a blind retry there could print a
         bill twice. */
      let savedTimer: number | undefined;
      const markSaved = () => {
        set({ saveState: 'saved', retrySave: null });
        if (typeof window !== 'undefined') {
          if (savedTimer) window.clearTimeout(savedTimer);
          savedTimer = window.setTimeout(() => set({ saveState: 'idle' }), 2500);
        }
      };
      const runSave = (fn: () => Promise<void>): Promise<void> => {
        set({ saveState: 'saving' });
        const p = (async () => {
          await fn();
          markSaved();
        })();
        p.catch(() => {
          set({
            saveState: 'failed',
            retrySave: async () => {
              set({ saveState: 'saving' });
              try {
                await fn();
                markSaved();
              } catch {
                set({ saveState: 'failed' });
              }
            },
          });
        });
        return p;
      };

      return ({
      synced: false,
      online: true,
      rev: -1,
      saveState: 'idle',
      retrySave: null,

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
      labourWorkers: [],
      appearance: { bgTheme: 'blue', headerTheme: 'blue', watermark: '' },
      srvConfig: { upiId: '', gstPercent: 0, nextBillNo: 0 },
      staff: null,

      /* ---------------------------------------------------------- */
      /* LIFECYCLE — bootstrap + poll                                */
      /* ---------------------------------------------------------- */

      applySnapshot: (s) =>
        set((st) => ({
          ...(s.settings ? { settings: { ...st.settings, ...s.settings } } : {}),
          ...(s.appearance ? { appearance: { ...st.appearance, ...s.appearance } } : {}),
          ...(s.products ? { products: s.products } : {}),
          ...(s.invoices ? { invoices: s.invoices } : {}),
          ...(s.expenses ? { expenses: s.expenses } : {}),
          ...(s.incomes ? { incomes: s.incomes } : {}),
          ...(s.labourWorks ? { labourWorks: s.labourWorks } : {}),
          ...(s.labourWorkers ? { labourWorkers: s.labourWorkers } : {}),
          ...(s.config
            ? { srvConfig: { upiId: s.config.upiId ?? '', gstPercent: s.config.gstPercent ?? 0, nextBillNo: s.config.nextBillNo ?? 0 } }
            : {}),
          ...(s.rev !== undefined ? { rev: s.rev } : {}),
          online: true,
          synced: true,
        })),

      bootstrap: async () => {
        // staff devices refresh their profile and pull the FILTERED snapshot
        // (products + bills only); the owner-only migration below never runs
        if (authRole() === 'staff') {
          const me = await apiStaffMe();
          if (!me.ok || !me.staff) throw new StoreError('unauthorized');
          set({ staff: me.staff });
          const res = await apiStateGet(get().rev);
          if (res.kind === 'offline') {
            set({ online: false });
            throw new StoreError('offline');
          }
          if (res.kind === 'auth') throw new StoreError('unauthorized');
          if (res.kind === 'data') get().applySnapshot(res.state as never);
          set({ online: true, synced: true });
          return;
        }
        const res = await apiStateGet(get().rev);
        if (res.kind === 'offline') {
          set({ online: false });
          throw new StoreError('offline');
        }
        if (res.kind === 'auth') throw new StoreError('unauthorized');
        if (res.kind === 'data') {
          get().applySnapshot(res.state);
          // FIRST RUN on the central db: migrate this device's old offline-era
          // data (the previous app kept everything in localStorage), or seed
          // the defaults for a brand-new business. Either way the central db
          // ends up with the full catalog + history, and every other device
          // picks it up on their next poll.
          const empty =
            res.state.products.length === 0 &&
            res.state.invoices.length === 0 &&
            res.state.expenses.length === 0 &&
            res.state.incomes.length === 0 &&
            res.state.labourWorks.length === 0;
          if (empty) {
            await migrateOldData();
            const after = await apiStateGet(-1);
            if (after.kind === 'data') get().applySnapshot(after.state);
          }
        }
      },

      startSync: () => {
        if (typeof window === 'undefined') return;
        stopSyncInternal();
        const timer = window.setInterval(() => {
          void pollOnce();
        }, 4000);
        const onVis = () => {
          if (document.visibilityState === 'visible') void pollOnce();
        };
        window.addEventListener('visibilitychange', onVis);
        window.addEventListener('online', onVis);
        syncHandle = { timer, onVis };
      },

      stopSync: () => stopSyncInternal(),

      /* ---------------------------------------------------------- */
      /* SETTINGS + PRODUCTS — saved centrally, confirmed before use */
      /* ---------------------------------------------------------- */

      setActiveTab: (t) => set({ activeTab: t }),

      saveSettings: async (s) => {
        // resetBillNo (v41) + setNextBillNo (v55) are transient COMMANDS — the
        // server consumes them and never stores them. v54 FIX: they must
        // actually REACH the server — the old code stripped resetBillNo from
        // the PUT, so "Start bills from 1" silently did nothing.
        const { resetBillNo, setNextBillNo, ...persist } = s as Partial<BusinessSettings> & {
          resetBillNo?: boolean;
          setNextBillNo?: boolean;
        };
        // v41/v52: the settings route MERGES this patch over the stored
        // settings — only the fields the owner changed are rewritten
        await runSave(async () => {
          const ok = await apiSettingsPut(
            resetBillNo || setNextBillNo
              ? { ...persist, ...(resetBillNo ? { resetBillNo: true } : {}), ...(setNextBillNo ? { setNextBillNo: true } : {}) }
              : persist
          );
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ settings: { ...st.settings, ...persist } }));
        });
        // the owner's "next invoice no" lifts the central counter — reflect it
        // on the billing screen INSTANTLY (the poll confirms the same value);
        // the "Start from 1" reset is the one path allowed to go DOWN.
        // v55: an explicit "Next bill no." edit points the sequence at ANY
        // number (up or down) — the next bill gets exactly that number.
        const entered = Math.round(Number(s.nextInvoiceNo ?? 0));
        if (resetBillNo) {
          set((st) => ({ srvConfig: { ...st.srvConfig, nextBillNo: Math.max(0, entered - 1) } }));
        } else if (setNextBillNo && Number.isFinite(entered) && entered > 0) {
          set((st) => ({ srvConfig: { ...st.srvConfig, nextBillNo: entered - 1 } }));
        } else if (Number.isFinite(entered) && entered > 1) {
          set((st) => ({ srvConfig: { ...st.srvConfig, nextBillNo: Math.max(st.srvConfig.nextBillNo, entered - 1) } }));
        }
        await pollOnce();
      },

      addProduct: (p) =>
        runSave(async () => {
          const ok = await apiProductPut(p);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ products: [p, ...st.products.filter((x) => x.id !== p.id)] }));
          // v47: the product is saved AND shown — do NOT await the state poll
          // here. On the shop's slow link the 20s poll blocked the dialog close
          // and the catalogue looked frozen ("new product shows only after a
          // refresh"); the background poll still reconciles rev + catalog.
          void pollOnce();
        }),

      updateProduct: async (id, p) => {
        // v52 — "update only what I change": diff the form against the SAVED
        // record and PATCH only the differing fields. Cleared optional fields
        // go out as explicit nulls (JSON.stringify would otherwise drop them
        // and the server would keep the old value). Fields the owner did not
        // touch are never sent, so the server leaves them byte-identical.
        await runSave(async () => {
          const cur = get().products.find((x) => x.id === id);
          let patch: Record<string, unknown> = {};
          if (cur) {
            const keys = ['name', 'nameTe', 'category', 'price', 'sizes', 'sizePrices', 'image', 'stock'] as const;
            for (const k of keys) {
              const nv = p[k];
              const cv = cur[k];
              const same = JSON.stringify(nv ?? null) === JSON.stringify(cv ?? null);
              if (!same) {
                // cleared optional field (undefined now, had a value) → explicit null
                patch[k] = nv === undefined && cv !== undefined ? null : nv;
              }
            }
          } else {
            patch = { ...p };
          }
          if (Object.keys(patch).length === 0) return; // nothing actually changed
          const ok = await apiProductPatch(id, patch);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ products: st.products.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        });
        void pollOnce();
      },

      deleteProduct: (id) =>
        runSave(async () => {
          const ok = await apiProductDelete(id);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ products: st.products.filter((x) => x.id !== id) }));
          void pollOnce();
        }),

      /* ---------------------------------------------------------- */
      /* CART — device-local by design (a bill half-typed on this    */
      /* phone is nobody else's business)                            */
      /* ---------------------------------------------------------- */

      addToCart: (product, size) => {
        const price = priceForSize(product.price, product.sizePrices, size);
        const key = `${product.id}::${size}`;
        // the bill number is assigned by the SERVER at SAVE time (atomic,
        // strictly sequential). Reserving at cart-start punched gaps into the
        // sequence whenever a cart was abandoned (v38 fix).
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
              {
                key,
                productId: product.id,
                name: product.name,
                nameTe: product.nameTe,
                size,
                price,
                // the product's SAVED price — a bill-line edit never touches it
                origPrice: price,
                qty: 1,
              },
            ],
          };
        });
      },

      addCustomItem: (name, size, price, qty, nameTe) => {
        const norm = size.trim() || 'Standard';
        const key = `custom::${Date.now()}::${Math.random().toString(36).slice(2, 7)}`;
        const teName = nameTe?.trim() || undefined;
        set((st) => {
          const cart = [
            ...st.cart,
            { key, productId: 'custom', name, nameTe: teName, size: norm, price, origPrice: price, qty },
          ];

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
          // persist the merged/created product centrally (fire-and-forget —
          // the poll reconciles the catalog on the next tick if it fails)
          const toSave = idx >= 0 ? products[idx] : products[0];
          void apiProductPut(toSave).catch(() => undefined);
          return { cart, products };
        });
      },

      // The ADMIN edits while billing: change the unit price directly on
      // the line (origPrice stays as proof) and/or discount that one item —
      // ₹ flat or % of the line. The catalog itself is never touched.
      updateCartItem: (key, patch) =>
        set((st) => ({
          cart: st.cart.map((c) => {
            if (c.key !== key) return c;
            const next = { ...c, ...patch };
            // keep the legacy flat field equal to the ACTUAL discount amount
            // so old views, slip rendering and totals all agree
            const gross = next.price * next.qty;
            const amt =
              next.discountType === 'percent'
                ? Math.min(gross, Math.round(((gross * (next.discountValue || 0)) / 100) * 100) / 100)
                : next.discount ?? 0;
            return { ...next, discount: Math.min(amt, gross) };
          }),
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

      /* ---------------------------------------------------------- */
      /* THE BILL SAVE — online-only, server-confirmed               */
      /* ---------------------------------------------------------- */

      completeInvoice: async (opts) => {
        const { cart, customer, billConfig, settings } = get();
        if (cart.length === 0) throw new StoreError('saveFailed');
        const totals = computeTotals(cart, billConfig, settings.gstPercent || 0);
        // UPI auto-detection: the customer paid (maybe partially) while the
        // QR was on screen — the detected amount becomes the paid amount
        if (opts?.paidAmount !== undefined) {
          totals.paid = Math.min(opts.paidAmount, totals.total);
          totals.balance = Math.max(totals.total - totals.paid, 0);
        }
        // GST comes from the SERVER's AppConfig at save time — the response
        // totals are authoritative (the server recomputes everything anyway)
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

        const draft: Partial<Invoice> = {
          id: `inv-${Date.now()}`,
          dateISO,
          customer: { ...customer },
          items: cart.map((c) => ({ ...c })),
          discountType: billConfig.discountType,
          discountValue: billConfig.discountValue,
          labourCharge: billConfig.labourCharge || 0,
          autoCharge: billConfig.autoCharge || 0,
          paymentMode: billConfig.paymentMode,
          language: billConfig.language,
          paymentRef: opts?.paymentRef,
          verifyCode: newVerifyCode(),
          delivery,
          payments,
          totals,
        };

        // THE SAVE — the server recomputes, numbers, registers and stores.
        // No server confirmation = no saved bill, no slip, no QR.
        const res = await apiBillSave(draft, get().billConfig.reservedNo);
        if (!res.ok || !res.invoice) {
          throw new StoreError(res.error === 'offline' ? 'offline' : 'saveFailed');
        }
        const invoice = res.invoice;
        // v40: the "Next Bill #" banner advances the moment a bill is saved —
        // the saved bill's own number IS the new counter (no poll wait)
        const savedNo = Number(invoice.no.replace(/\D/g, ''));

        // stock: the SERVER deducts it from the central catalog at save time;
        // the local mirror gets the authoritative stock on the next poll
        set((st) => ({
          invoices: [invoice, ...st.invoices],
          srvConfig:
            Number.isFinite(savedNo) && savedNo > st.srvConfig.nextBillNo
              ? { ...st.srvConfig, nextBillNo: savedNo }
              : st.srvConfig,
          products: get().products.map((p) => {
            const sold = cart.filter((c) => c.productId === p.id).reduce((s, c) => s + c.qty, 0);
            if (sold > 0 && typeof p.stock === 'number') return { ...p, stock: Math.max(p.stock - sold, 0) };
            return p;
          }),
          cart: [],
          lastInvoice: invoice,
          // fresh customer for the next bill — name & mobile are entered new every time
          customer: { name: '', phone: '', address: '' },
          // fresh config for the next bill (Cash mode, no leftover discount/charges;
          // chosen bill language stays sticky)
          billConfig: { ...DEFAULT_CONFIG, language: billConfig.language },
          settings: { ...st.settings, gstPercent: st.srvConfig.gstPercent || st.settings.gstPercent },
          rev: res.rev ?? st.rev,
        }));
        return invoice;
      },

      clearLastInvoice: () => set({ lastInvoice: null }),

      setInvoiceVerifyCode: (id, code) =>
        set((st) => ({
          invoices: st.invoices.map((i) => (i.id === id ? { ...i, verifyCode: code } : i)),
          lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? { ...st.lastInvoice, verifyCode: code } : st.lastInvoice,
        })),

      /* ---------------------------------------------------------- */
      /* BILL MUTATIONS — every change hits the central database,    */
      /* the registry entry follows, other devices see it instantly  */
      /* ---------------------------------------------------------- */

      refreshStaff: async () => {
        const me = await apiStaffMe();
        if (me.ok && me.staff) set({ staff: me.staff });
        return me.ok ? me.staff ?? null : null;
      },

      staffChangePassword: async (body: { action?: 'keep'; current?: string; newPassword?: string }) => {
        const res = await apiStaffChangePassword(body);
        if (!res.ok || !res.staff) throw new StoreError(res.error === 'wrong' ? 'unauthorized' : 'saveFailed');
        set({ staff: res.staff });
      },

      deleteInvoice: (id) =>
        runSave(async () => {
          const ok = await apiBillDelete(id);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({
            invoices: st.invoices.filter((i) => i.id !== id),
            // a deleted bill is gone EVERYWHERE — including the "last bill" banner
            lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? null : st.lastInvoice,
          }));
          await pollOnce();
        }),

      // v57: owner "Reset bills" — every bill tombstoned on the server in one
      // action; products, settings and the labour register are untouched
      resetInvoices: () =>
        runSave(async () => {
          const res = await apiBillsResetAll();
          if (!res.ok) throw new StoreError(res.error === 'offline' ? 'offline' : 'saveFailed');
          set({ invoices: [], lastInvoice: null });
          await pollOnce();
        }),

      cancelInvoice: (id) =>
        runSave(async () => {
          const res = await apiBillPatch(id, { action: 'cancel' });
          if (!res.ok || !res.invoice) throw new StoreError(res.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({
            invoices: st.invoices.map((i) => (i.id === id ? res.invoice! : i)),
            lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? res.invoice! : st.lastInvoice,
            rev: res.rev ?? st.rev,
          }));
          await pollOnce();
        }),

      updateInvoiceStatus: async (id, paidAmount) => {
        const inv = get().invoices.find((i) => i.id === id);
        if (!inv) return;
        const paid = Math.min(paidAmount, inv.totals.total);
        const added = Math.round((paid - inv.totals.paid) * 100) / 100;
        if (added <= 0) return;
        await get().receiveDuePayment(id, added, 'Cash');
      },

      updateInvoiceLanguage: async (id, language) => {
        const res = await apiBillPatch(id, { action: 'language', language });
        if (!res.ok || !res.invoice) throw new StoreError(res.error === 'offline' ? 'offline' : 'saveFailed');
        set((st) => ({
          invoices: st.invoices.map((i) => (i.id === id ? res.invoice! : i)),
          lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? res.invoice! : st.lastInvoice,
          rev: res.rev ?? st.rev,
        }));
        await pollOnce();
      },

      // Dues list: receive a balance payment — counts as income TODAY
      receiveDuePayment: async (id, amount, mode) => {
        const res = await apiBillPatch(id, { action: 'pay', amount, mode, dateISO: new Date().toISOString() });
        if (!res.ok || !res.invoice) throw new StoreError(res.error === 'offline' ? 'offline' : 'saveFailed');
        set((st) => ({
          invoices: st.invoices.map((i) => (i.id === id ? res.invoice! : i)),
          lastInvoice: st.lastInvoice && st.lastInvoice.id === id ? res.invoice! : st.lastInvoice,
          rev: res.rev ?? st.rev,
        }));
        await pollOnce();
      },

      migrateVerifyCodes: async () => {
        const missing = get().invoices.filter((i) => !i.verifyCode);
        if (missing.length === 0) return;
        const patched = missing.map((i) => ({ ...i, verifyCode: newVerifyCode() }));
        await apiStateImport({ invoices: patched, dataUpdatedAt: Date.now() });
        set((st) => ({
          invoices: st.invoices.map((i) => patched.find((p) => p.id === i.id) ?? i),
        }));
        await pollOnce();
      },

      /* ---------------------------------------------------------- */
      /* LEDGER — money out / money in, centrally                    */
      /* ---------------------------------------------------------- */

      addExpense: (e) =>
        runSave(async () => {
          const entry = { ...e, id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` } as Expense;
          const ok = await apiLedgerPut('expense', entry);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ expenses: [entry, ...st.expenses] }));
          await pollOnce();
        }),

      deleteExpense: (id) =>
        runSave(async () => {
          const ok = await apiLedgerDelete('expense', id);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ expenses: st.expenses.filter((x) => x.id !== id) }));
          await pollOnce();
        }),

      addIncome: (e) =>
        runSave(async () => {
          const entry = { ...e, id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` } as IncomeEntry;
          const ok = await apiLedgerPut('income', entry);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ incomes: [entry, ...st.incomes] }));
          await pollOnce();
        }),

      deleteIncome: (id) =>
        runSave(async () => {
          const ok = await apiLedgerDelete('income', id);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ incomes: st.incomes.filter((x) => x.id !== id) }));
          await pollOnce();
        }),

      /* ---------------------------------------------------------- */
      /* LABOUR — the work register + the labourer notebook          */
      /* ---------------------------------------------------------- */

      addLabourWork: (e) =>
        runSave(async () => {
          const name = e.name.trim();
          const entry = normalizeLabourWork({ ...e, id: `lw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` } as LabourWork);
          const ok = await apiLabourPut({ work: entry });
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({
            labourWorks: [entry, ...st.labourWorks],
            labourWorkers:
              name && !st.labourWorkers.some((w) => w.name.toLowerCase() === name.toLowerCase())
                ? [{ id: `worker-${Date.now()}`, name }, ...st.labourWorkers]
                : st.labourWorkers,
          }));
          await pollOnce();
        }),

      addLabourWorker: (name, nameTe, phone) =>
        runSave(async () => {
          const trimmed = name.trim();
          if (!trimmed || get().labourWorkers.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) return;
          const worker: LabourWorker = { id: `worker-${Date.now()}`, name: trimmed, nameTe, phone };
          const ok = await apiLabourPut({ worker });
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorkers: [worker, ...st.labourWorkers] }));
          await pollOnce();
        }),

      deleteLabourWorker: (id) =>
        runSave(async () => {
          const ok = await apiLabourDelete(id, true);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorkers: st.labourWorkers.filter((w) => w.id !== id) }));
          await pollOnce();
        }),

      deleteLabourWork: (id) =>
        runSave(async () => {
          const ok = await apiLabourDelete(id);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorks: st.labourWorks.filter((x) => x.id !== id) }));
          await pollOnce();
        }),

      updateLabourWork: (id, patch) =>
        runSave(async () => {
          const current = get().labourWorks.find((x) => x.id === id);
          if (!current) return;
          const entry = normalizeLabourWork({ ...current, ...patch });
          const ok = await apiLabourPut({ work: entry });
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorks: st.labourWorks.map((x) => (x.id === id ? entry : x)) }));
          await pollOnce();
        }),

      addLabourPayment: (id, p) =>
        runSave(async () => {
          const current = get().labourWorks.find((x) => x.id === id);
          if (!current) return;
          const base = normalizeLabourWork(current);
          const pay: LabourPayment = {
            id: `lwp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dateISO: p.dateISO ?? new Date().toISOString(),
            amount: p.amount,
            mode: p.mode,
            note: p.note,
          };
          const entry = normalizeLabourWork({ ...base, payments: [...(base.payments ?? []), pay] });
          const ok = await apiLabourPut({ work: entry });
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorks: st.labourWorks.map((x) => (x.id === id ? entry : x)) }));
          await pollOnce();
        }),

      deleteLabourPayment: (id, paymentId) =>
        runSave(async () => {
          const current = get().labourWorks.find((x) => x.id === id);
          if (!current) return;
          const base = normalizeLabourWork(current);
          const entry = normalizeLabourWork({
            ...base,
            payments: (base.payments ?? []).filter((p) => p.id !== paymentId),
          });
          const ok = await apiLabourPut({ work: entry });
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ labourWorks: st.labourWorks.map((x) => (x.id === id ? entry : x)) }));
          await pollOnce();
        }),

      /* ---------------------------------------------------------- */
      /* APPEARANCE — theme/watermark, saved centrally               */
      /* ---------------------------------------------------------- */

      setAppearance: (a) =>
        runSave(async () => {
          const ok = await apiSettingsPut({}, a);
          if (!ok.ok) throw new StoreError(ok.error === 'offline' ? 'offline' : 'saveFailed');
          set((st) => ({ appearance: { ...st.appearance, ...a } }));
          await pollOnce();
        }),
      });
    },
    {
      name: 'slp-device-ui-v1',
      storage: createJSONStorage(() => localStorage),
      // Rehydrate manually after mount (page.tsx) — prevents SSR hydration mismatch
      skipHydration: true,
      // ONLY device-local UI state persists. Business data NEVER touches
      // localStorage — the central server database is the only store.
      partialize: (st) => ({
        cart: st.cart,
        billConfig: st.billConfig,
        customer: st.customer,
        // persisted so a REFRESH re-opens the tab the user was on
        activeTab: st.activeTab,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.synced = state.synced;
      },
    }
  )
);

/* ------------------------------------------------------------------ */
/* Sync engine internals                                               */
/* ------------------------------------------------------------------ */

let syncHandle: { timer: number; onVis: () => void } | null = null;
let polling = false;

function stopSyncInternal(): void {
  if (syncHandle && typeof window !== 'undefined') {
    window.clearInterval(syncHandle.timer);
    window.removeEventListener('visibilitychange', syncHandle.onVis);
    window.removeEventListener('online', syncHandle.onVis);
  }
  syncHandle = null;
}

/** One state poll — applies the server snapshot when the revision moved */
export async function pollOnce(): Promise<void> {
  if (polling) return;
  polling = true;
  try {
    const res = await apiStateGet(useStore.getState().rev);
    if (res.kind === 'unchanged') {
      useStore.setState({ online: true });
    } else if (res.kind === 'data') {
      useStore.getState().applySnapshot(res.state);
    } else if (res.kind === 'offline') {
      useStore.setState({ online: false });
    } else if (res.kind === 'auth') {
      // session expired — lock the app (page.tsx listens)
      window.dispatchEvent(new CustomEvent('slp-forcelock'));
    }
  } catch {
    useStore.setState({ online: false });
  } finally {
    polling = false;
  }
}

/**
 * FIRST-RUN MIGRATION — read the old offline-era store from localStorage
 * (the previous app kept the whole business in `slp-cement-billing-v1`)
 * and push it into the central database. Old bills without verification
 * codes get minted codes first, so every OLD printed barcode verifies too.
 * After a successful import the old local store is removed — the central
 * database is then the ONLY copy (online-only requirement).
 */
async function migrateOldData(): Promise<void> {
  try {
    const raw = localStorage.getItem('slp-cement-billing-v1');
    const parsed = raw ? (JSON.parse(raw) as { state?: Record<string, unknown> }) : null;
    const old = parsed?.state as
      | {
          settings?: Partial<BusinessSettings>;
          appearance?: Partial<Appearance>;
          products?: Product[];
          invoices?: Invoice[];
          expenses?: Expense[];
          incomes?: IncomeEntry[];
          labourWorks?: LabourWork[];
          labourWorkers?: LabourWorker[];
          dataUpdatedAt?: number;
        }
      | undefined;

    const hasOld =
      old &&
      ((old.invoices?.length ?? 0) > 0 ||
        (old.products?.length ?? 0) > 0 ||
        (old.expenses?.length ?? 0) > 0 ||
        (old.labourWorks?.length ?? 0) > 0);
    if (hasOld && old) {
      // mint verification codes for pre-barcode bills so old prints verify
      const invoices = (old.invoices ?? []).map((i) => (i.verifyCode ? i : { ...i, verifyCode: newVerifyCode() }));
      await apiStateImport({
        settings: old.settings,
        appearance: old.appearance,
        products: old.products,
        invoices,
        expenses: old.expenses,
        incomes: old.incomes,
        labourWorks: old.labourWorks,
        labourWorkers: old.labourWorkers,
        dataUpdatedAt: old.dataUpdatedAt ?? Date.now(),
      });
      localStorage.removeItem('slp-cement-billing-v1');
      return;
    }

    // brand-new business (no old data anywhere) — seed the defaults so the
    // catalog exists on every device from the start
    await apiStateImport({
      settings: DEFAULT_SETTINGS,
      products: DEFAULT_PRODUCTS,
      dataUpdatedAt: Date.now(),
    });
  } catch {
    /* migration is best-effort — the poll will reconcile */
  }
}
