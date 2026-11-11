'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { Header, BottomNav, DesktopTabs } from '@/components/Navigation';
import BillTab from '@/components/BillTab';
import ProductsView from '@/components/ProductsView';
import LedgerView from '@/components/LedgerView';
import LabourView from '@/components/LabourView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import BillPanel from '@/components/BillPanel';
import InvoiceModal, { type DocView } from '@/components/InvoiceModal';
import PwaInstall, { ServiceWorkerRegister } from '@/components/PwaInstall';
import ConnectivityToast from '@/components/ConnectivityToast';
import LockScreen from '@/components/LockScreen';
import { useStore } from '@/lib/store';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import { computeTotals, fmt } from '@/lib/billing';
import { apiPullVault, isUnlocked, lockApp } from '@/lib/cloud';
import { startSyncEngine } from '@/lib/sync';
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
  /** app gate: checking → locked (OTP + PIN) or ready (unlocked device) */
  const [gate, setGate] = useState<'checking' | 'locked' | 'ready'>('checking');

  // Rehydrate persisted store AFTER mount (skipHydration) — avoids SSR mismatch
  useEffect(() => {
    useStore.persist.rehydrate();
    let cancelled = false;
    (async () => {
      // first-time use (or after "Lock app"): the OTP + PIN gate stands in front
      if (!isUnlocked()) {
        setGate('locked');
        return;
      }
      // device remembers itself — validate the 30-day session (works offline too)
      const pull = await apiPullVault();
      if (cancelled) return;
      if (pull.kind === 'auth') {
        lockApp(); // session expired → lock again
        setGate('locked');
        return;
      }
      setGate('ready');
      startSyncEngine(); // encrypted auto-sync across the owner's phones
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlocked = () => {
    setGate('ready');
    startSyncEngine();
  };

  // true on client after hydration, false on the server (avoids SSR mismatch)
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

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

  /* ----- gate: OTP + PIN lock stands in front of the whole app ----- */
  if (gate === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-100">
        {showSplash && <Splash logoSrc={logoSrc} name={companyName} />}
        <p className="text-sm text-muted-foreground">{t('page.loading')}</p>
      </div>
    );
  }
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
                  <BillTab onCompleted={onBillCompleted} />
                </div>
                {/* Desktop live bill panel */}
                <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm lg:block">
                  <h3 className="mb-3 text-base font-bold text-neutral-800">{t('page.currentBill')}</h3>
                  <BillPanel onComplete={onBillCompleted} />
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

            {activeTab === 'labour' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('labour.title')}</h2>
                <LabourView />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-3 text-base font-bold text-neutral-800">{t('nav.invoiceHistory')}</h2>
                <HistoryView onOpenInvoice={openInvoice} />
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
