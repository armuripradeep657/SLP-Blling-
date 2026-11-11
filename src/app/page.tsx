'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { Header, BottomNav, DesktopTabs } from '@/components/Navigation';
import BillTab from '@/components/BillTab';
import ProductsView from '@/components/ProductsView';
import LedgerView from '@/components/LedgerView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import BillPanel from '@/components/BillPanel';
import InvoiceModal, { type DocView } from '@/components/InvoiceModal';
import PwaInstall, { ServiceWorkerRegister } from '@/components/PwaInstall';
import ConnectivityToast from '@/components/ConnectivityToast';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import { computeTotals, fmt } from '@/lib/billing';
import type { Invoice } from '@/lib/types';

const subscribeNoop = () => () => undefined;

export default function Home() {
  const t = useT();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const cart = useStore((s) => s.cart);
  const cfg = useStore((s) => s.billConfig);

  const [modalInvoice, setModalInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<DocView>('slip');

  // Rehydrate persisted store AFTER mount (skipHydration) — avoids SSR mismatch
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  // true on client after hydration, false on the server (avoids SSR mismatch)
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const totals = computeTotals(cart, cfg);

  const openInvoice = (inv: Invoice, view: DocView = 'slip') => {
    setModalInvoice(inv);
    setModalView(view);
    setModalOpen(true);
  };

  const onBillCompleted = () => {
    const inv = useStore.getState().lastInvoice;
    if (inv) openInvoice(inv);
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-blue-50/70 to-neutral-100">
      {/* Company logo watermark — centred ON the whole app like a printed seal:
          floats over content, never blocks touches, sits under header/nav/sheets */}
      <div
        aria-hidden
        data-watermark="logo"
        className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center overflow-hidden"
      >
        <img
          src="/narasimha-logo.jpg"
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
