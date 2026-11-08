'use client';

import { Badge } from '@/components/ui/badge';
import { WifiOff, ReceiptText, Package, History, Settings, BookText, Languages } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';
import { useAppLang, useT } from '@/hooks/use-app-lang';

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export function Header() {
  const t = useT();
  const appLang = useAppLang();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  // SSR snapshot true matches most clients; updates reactively after hydration
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const companyName = appLang === 'te' && settings.companyNameTe ? settings.companyNameTe : settings.companyName;

  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <img
          src="/narasimha-logo.jpg"
          alt="Sri Lakshmi Penchil Narasimha Swamy logo"
          className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white/60"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight sm:text-base">{companyName}</h1>
          <p className="truncate text-[11px] text-blue-100">
            {t('header.proprietor')}: {settings.ownerName}
            {settings.phone ? ` · ${settings.phone}` : ''}
          </p>
        </div>
        {/* Quick app-language switch: English ↔ తెలుగు */}
        <button
          onClick={() => saveSettings({ appLang: appLang === 'te' ? 'en' : 'te' })}
          aria-label="Switch app language"
          title="Switch app language · భాష మార్చు"
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/15 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/25"
        >
          <Languages className="size-3.5" />
          {appLang === 'te' ? 'English' : 'తెలుగు'}
        </button>
        {!online && (
          <Badge variant="secondary" className="shrink-0 gap-1 bg-white/20 text-white">
            <WifiOff className="size-3" /> {t('header.offline')}
          </Badge>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  const t = useT();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const cart = useStore((s) => s.cart);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const tabs = [
    { id: 'bill', label: t('nav.bill'), icon: ReceiptIcon },
    { id: 'products', label: t('nav.products'), icon: PackageIcon },
    { id: 'ledger', label: t('nav.ledger'), icon: LedgerIcon },
    { id: 'history', label: t('nav.history'), icon: HistoryIcon },
    { id: 'settings', label: t('nav.settings'), icon: SettingsIcon },
  ] as const;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((x) => {
          const Icon = x.icon;
          const active = activeTab === x.id;
          return (
            <button
              key={x.id}
              onClick={() => setActiveTab(x.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-90 ${
                active ? 'text-blue-700' : 'text-neutral-500'
              }`}
            >
              <Icon className="size-5" active={active} />
              {x.id === 'bill' && count > 0 && (
                <span key={count} className="anim-badge absolute right-[18%] top-2 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
              {x.label}
              {active && <span className="anim-fade-up absolute top-0 h-0.5 w-10 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopTabs() {
  const t = useT();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const tabs = [
    { id: 'bill', label: t('nav.newBill') },
    { id: 'products', label: t('nav.products') },
    { id: 'ledger', label: t('nav.ledger') },
    { id: 'history', label: t('nav.invoiceHistory') },
    { id: 'settings', label: t('nav.settings') },
  ] as const;

  return (
    <div className="mx-auto mb-4 hidden max-w-5xl gap-1.5 lg:flex" role="tablist" aria-label="Sections">
      {tabs.map((x) => (
        <button
          key={x.id}
          role="tab"
          aria-selected={activeTab === x.id}
          onClick={() => setActiveTab(x.id)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95 ${
            activeTab === x.id ? 'bg-blue-600 text-white shadow' : 'border bg-card hover:bg-accent'
          }`}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

// tiny inline icon wrappers to keep this file self-contained
function ReceiptIcon({ className, active }: { className?: string; active?: boolean }) {
  return <ReceiptText className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function PackageIcon({ className, active }: { className?: string; active?: boolean }) {
  return <Package className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function LedgerIcon({ className, active }: { className?: string; active?: boolean }) {
  return <BookText className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function HistoryIcon({ className, active }: { className?: string; active?: boolean }) {
  return <History className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function SettingsIcon({ className, active }: { className?: string; active?: boolean }) {
  return <Settings className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
