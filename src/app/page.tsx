'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { Header, BottomNav, DesktopTabs } from '@/components/Navigation';
import BillTab from '@/components/BillTab';
import ProductsView from '@/components/ProductsView';
import LedgerView from '@/components/LedgerView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import VerifyView from '@/components/VerifyView';
import BillPanel from '@/components/BillPanel';
import PaymentScreen from '@/components/PaymentScreen';
import InvoiceModal, { type DocView } from '@/components/InvoiceModal';
import PwaInstall, { ServiceWorkerRegister } from '@/components/PwaInstall';
import ConnectivityToast from '@/components/ConnectivityToast';
import LockScreen from '@/components/LockScreen';
import { useStore } from '@/lib/store';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import { computeTotals, fmt } from '@/lib/billing';
import { apiNotifySend } from '@/lib/cloud';
import { smsMessage, whatsappMessage } from '@/lib/messages';
import { normalizePhone } from '@/lib/billing';
import {
  clearUnlockSession,
  hasFreshUnlockSession,
  idleTooLong,
  markUnlockActive,
} from '@/lib/idle-lock';
import type { BgThemeId, Invoice } from '@/lib/types';

const subscribeNoop = () => () => undefined;

/** Background themes — applied to the whole app from Settings → Appearance */
const BG_STYLES: Record<BgThemeId, string> = {
  blue: 'from-blue-50/70 to-neutral-100',
  cream: 'from-amber-50/90 to-stone-100',
  mint: 'from-emerald-50/80 to-neutral-100',
  lavender: 'from-violet-50/80 to-neutral-100',
  slate: 'from-slate-200/80 to-slate-100',
};

/**
 * Opening splash — the company logo zooms in for a moment when the app starts,
 * then the overlay fades away into the app.
 */
function Splash({ logoSrc, name }: { logoSrc: string; name: string }) {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 1600);
    const t2 = setTimeout(() => setPhase('gone'), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div
      data-splash="logo"
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-white via-blue-50 to-blue-100 ${
        phase === 'out' ? 'anim-splash-fade' : ''
      }`}
    >
      <img
        src={logoSrc}
        alt=""
        className="anim-splash-zoom size-44 rounded-full object-cover shadow-2xl ring-4 ring-white"
      />
      <p className="anim-fade-up max-w-xs px-6 text-center text-lg font-extrabold leading-snug text-blue-900" style={{ animationDelay: '250ms' }}>
        {name}
      </p>
    </div>
  );
}

export default function Home() {
  const t = useT();
  const appLang = useAppLang();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const cart = useStore((s) => s.cart);
  const cfg = useStore((s) => s.billConfig);
  const bgTheme = useStore((s) => s.appearance.bgTheme);
  const watermark = useStore((s) => s.appearance.watermark);
  const settings = useStore((s) => s.settings);

  const [modalInvoice, setModalInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<DocView>('slip');
  const [showSplash, setShowSplash] = useState(true); // opening zoom — plays once per app open
  /**
   * App gate. The MPIN is created ONCE; it is asked when the app OPENS — not
   * on every refresh (owner's request: refreshing a page must not throw the
   * owner back to the lock). A tab-scoped unlock session keeps the app open
   * across reloads and locks it again after 5 minutes WITHOUT any touch
   * (idle lock). Closing the app ends the session → the next open asks the
   * MPIN again.
   */
  const [gate, setGate] = useState<'locked' | 'ready'>('locked');

  // Rehydrate persisted store AFTER mount (skipHydration) — avoids SSR mismatch.
  // A refresh (fresh unlock session in this tab) simply re-opens the app on the
  // tab the user was on; a real app open (no session) lands on the Bill tab so
  // product selection is one tap away, and shows the MPIN gate.
  useEffect(() => {
    const fresh = hasFreshUnlockSession();
    // flip the gate in a microtask (runs before the next paint): a refresh
    // opens the app right away, a locked open drops the splash zoom and
    // shows only the lock screen
    Promise.resolve().then(() => {
      if (fresh) setGate('ready');
      else setShowSplash(false);
    });
    Promise.resolve(useStore.persist.rehydrate()).then(() => {
      if (fresh) {
        void useStore
          .getState()
          .bootstrap()
          .catch(() => undefined); // offline entry — the banner explains it
        useStore.getState().startSync();
      } else useStore.setState({ activeTab: 'bill' });
    });
  }, []);

  /* ----- idle lock: 5 minutes without a touch → the MPIN gate returns ----- */
  useEffect(() => {
    if (gate !== 'ready') return;
    markUnlockActive();
    const onActivity = () => markUnlockActive();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && idleTooLong()) {
        clearUnlockSession();
        setGate('locked');
      }
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const iv = setInterval(() => {
      if (idleTooLong()) {
        clearUnlockSession();
        setGate('locked');
      }
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(iv);
    };
  }, [gate]);

  const handleUnlocked = () => {
    markUnlockActive();
    setGate('ready');
    void useStore
      .getState()
      .bootstrap()
      .catch(() => undefined); // offline entry — the banner explains it
    useStore.getState().startSync();
  };

  // the SERVER ended the session (expired/revoked) — lock immediately
  useEffect(() => {
    const onForceLock = () => {
      clearUnlockSession();
      setShowSplash(false);
      setGate('locked');
    };
    window.addEventListener('slp-forcelock', onForceLock);
    return () => window.removeEventListener('slp-forcelock', onForceLock);
  }, []);

  // "Lock app" (Settings) flips the gate the instant it is pressed — the
  // activity listeners unmount, so nothing can re-mark the unlock session
  // in the window before the page reloads (a hot reload used to re-mark it
  // and the app came back unlocked).
  useEffect(() => {
    const onLock = () => {
      clearUnlockSession();
      setShowSplash(false);
      setGate('locked');
    };
    window.addEventListener('slp-lock', onLock);
    return () => window.removeEventListener('slp-lock', onLock);
  }, []);

  // true on client after hydration, false on the server (avoids SSR mismatch)
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  /* pre-barcode bills (billed before v32) get verification IDs + registry
     entries once the vault is open — a re-printed old bill scans too */
  useEffect(() => {
    if (gate !== 'ready' || !mounted) return;
    useStore.getState().migrateVerifyCodes();
  }, [gate, mounted]);

  // the Labour work page moved INSIDE the Ledger tab (v33) — a device that
  // was last on 'labour' opens on Ledger (its sticky chip remembers the view)
  useEffect(() => {
    if (mounted && activeTab === 'labour') setActiveTab('ledger');
  }, [mounted, activeTab, setActiveTab]);

  const totals = computeTotals(cart, cfg);

  // company name follows the app language (same rule as the header)
  const companyName =
    appLang === 'te' && settings.companyNameTe ? settings.companyNameTe : settings.companyName;
  const logoSrc = watermark || '/narasimha-logo.jpg';

  const openInvoice = (inv: Invoice, view: DocView = 'slip') => {
    setModalInvoice(inv);
    setModalView(view);
    setModalOpen(true);
  };

  const onBillCompleted = () => {
    const inv = useStore.getState().lastInvoice;
    if (inv) openInvoice(inv);
  };

  /* ----- save errors: an offline save NEVER pretends to have succeeded ----- */
  const [saveError, setSaveError] = useState<string | null>(null);
  const showSaveError = (e: unknown) => {
    const code = e instanceof Error ? e.message : 'saveFailed';
    setSaveError(code === 'offline' ? t('net.required') : t('net.saveFailed'));
    setTimeout(() => setSaveError(null), 5000);
  };

  /* ----- UPI auto-payment: QR screen → money arrives → bill completes itself ----- */
  const [pendingPayment, setPendingPayment] = useState<{ billRef: string; amount: number } | null>(null);

  const startUpiPayment = (amount: number) => {
    setPendingPayment({
      billRef: `SLP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      amount,
    });
  };

  /** After the money is detected: complete the bill, open the slip and send
   *  the WhatsApp/SMS notification to the customer — no button pressed. */
  const finishUpiPayment = async (paid: number) => {
    const pending = pendingPayment;
    setPendingPayment(null);
    if (!pending) return;
    try {
      const inv = await useStore.getState().completeInvoice({ paymentRef: pending.billRef, paidAmount: paid });
      openInvoice(inv);
      void notifyCustomer(inv);
    } catch (e) {
      showSaveError(e);
    }
  };

  const cancelUpiPayment = () => setPendingPayment(null);

  /** customer paid cash instead — complete the bill on the spot as Cash */
  const upiCashInstead = async () => {
    setPendingPayment(null);
    useStore.getState().setBillConfig({ paymentMode: 'Cash' });
    try {
      const inv = await useStore.getState().completeInvoice();
      openInvoice(inv);
      void notifyCustomer(inv);
    } catch (e) {
      showSaveError(e);
    }
  };

  /** Auto-share the slip with the customer: server-side WhatsApp/SMS first
   *  (Meta Cloud API / SMS gateway — zero taps), then the wa.me deep link
   *  attempt on this phone; the slip's share buttons are the last resort. */
  const notifyCustomer = async (inv: Invoice) => {
    const phone = inv.customer.phone?.trim();
    if (!phone || !/\d{10}/.test(phone.replace(/\D/g, ''))) return;
    const settings = useStore.getState().settings;
    try {
      const res = await apiNotifySend({
        billRef: inv.paymentRef,
        phone: normalizePhone(phone),
        whatsappText: whatsappMessage(inv, settings),
        smsText: smsMessage(inv, settings),
      });
      if (res.ok && (res.whatsapp === 'skipped' || res.whatsapp.startsWith('failed'))) {
        // no provider configured — open WhatsApp directly on this phone
        const digits = phone.replace(/\D/g, '');
        const to = digits.length === 10 ? `91${digits}` : digits;
        window.open(`https://wa.me/${to}?text=${encodeURIComponent(whatsappMessage(inv, settings))}`, '_blank');
      }
    } catch {
      /* the slip's share buttons are always there as the last resort */
    }
  };

  /* ----- gate: the MPIN lock stands in front of the whole app ----- */
  if (gate === 'locked') {
    return (
      <>
        {showSplash && <Splash logoSrc={logoSrc} name={companyName} />}
        <LockScreen onUnlocked={handleUnlocked} />
      </>
    );
  }

  return (
    <div data-app-root className={`relative min-h-dvh bg-gradient-to-b ${BG_STYLES[bgTheme]}`}>
      {showSplash && <Splash logoSrc={logoSrc} name={companyName} />}
      {/* Company logo watermark — centred ON the whole app like a printed seal:
          floats over content, never blocks touches, sits under header/nav/sheets */}
      <div
        aria-hidden
        data-watermark="logo"
        className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center overflow-hidden"
      >
        <img
          src={logoSrc}
          alt=""
          className="w-[74vmin] max-w-[420px] min-w-[260px] select-none rounded-full object-cover opacity-[0.06]"
        />
      </div>
      <ServiceWorkerRegister />
      <Header />
      <PwaInstall />
      <ConnectivityToast />

      {/* the online-only save error — the bill did NOT save, say so plainly */}
      {saveError && (
        <div
          data-save-error
          role="alert"
          className="fixed left-1/2 top-16 z-[90] -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-xl"
        >
          {saveError}
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 lg:pb-10">
        <DesktopTabs />

        {!mounted ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">{t('page.loading')}</div>
        ) : (
          <div key={activeTab} className="anim-fade-up">
            {activeTab === 'bill' && (
              <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start">
                <div>
                  <h2 className="mb-3 text-base font-bold text-neutral-800">{t('products.tapSize')}</h2>
                  <BillTab onCompleted={onBillCompleted} onUpi={startUpiPayment} />
                </div>
                {/* Desktop live bill panel */}
                <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm lg:block">
                  <h3 className="mb-3 text-base font-bold text-neutral-800">{t('page.currentBill')}</h3>
                  <BillPanel onComplete={onBillCompleted} onUpi={startUpiPayment} onError={showSaveError} />
                </aside>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('products.catalog')}</h2>
                <ProductsView />
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('ledger.title')}</h2>
                <LedgerView />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('nav.invoiceHistory')}</h2>
                <HistoryView onOpenInvoice={openInvoice} />
              </div>
            )}

            {activeTab === 'verify' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-neutral-800">
                  {t('nav.verify')}
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">Code 128</span>
                </h2>
                <VerifyView />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="mx-auto max-w-2xl pb-4">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('nav.settings')}</h2>
                <SettingsView />
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      {pendingPayment && (
        <PaymentScreen
          amount={pendingPayment.amount}
          billRef={pendingPayment.billRef}
          onPaid={finishUpiPayment}
          onCashInstead={upiCashInstead}
          onCancel={cancelUpiPayment}
        />
      )}

      <InvoiceModal invoice={modalInvoice} open={modalOpen} view={modalView} onOpenChange={setModalOpen} />

      {/* mobile sticky total chip when scrolled in other tabs */}
      {activeTab !== 'bill' && cart.length > 0 && (
        <button
          onClick={() => setActiveTab('bill')}
          className="fixed right-4 top-[4.5rem] z-40 rounded-full bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg lg:hidden"
        >
          {cart.length} {t('bill.items')} · ₹{fmt(totals.total)}
        </button>
      )}
    </div>
  );
}
