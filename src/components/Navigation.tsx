'use client';

import { Badge } from '@/components/ui/badge';
import { WifiOff, ReceiptText, Package, History, Settings } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export function Header() {
  const settings = useStore((s) => s.settings);
  // SSR snapshot true matches most clients; updates reactively after hydration
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <img
          src="/narasimha-logo.jpg"
          alt="Sri Lakshmi Penchil Narasimha Swamy logo"
          className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white/60"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight sm:text-base">{settings.companyName}</h1>
          <p className="truncate text-[11px] text-blue-100">
            Proprietor: {settings.ownerName}
            {settings.phone ? ` · ${settings.phone}` : ''}
          </p>
        </div>
        {!online && (
          <Badge variant="secondary" className="shrink-0 gap-1 bg-white/20 text-white">
            <WifiOff className="size-3" /> Offline
          </Badge>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const cart = useStore((s) => s.cart);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const tabs = [
    { id: 'bill', label: 'Bill', icon: ReceiptIcon },
    { id: 'products', label: 'Products', icon: PackageIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-blue-700' : 'text-neutral-500'
              }`}
            >
              <Icon className="size-5" active={active} />
              {t.id === 'bill' && count > 0 && (
                <span className="absolute right-[22%] top-2 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
              {t.label}
              {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopTabs() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const tabs = [
    { id: 'bill', label: 'New Bill' },
    { id: 'products', label: 'Products' },
    { id: 'history', label: 'Invoice History' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="mx-auto mb-4 hidden max-w-5xl gap-1.5 lg:flex" role="tablist" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => setActiveTab(t.id)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'border bg-card hover:bg-accent'
          }`}
        >
          {t.label}
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
function HistoryIcon({ className, active }: { className?: string; active?: boolean }) {
  return <History className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function SettingsIcon({ className, active }: { className?: string; active?: boolean }) {
  return <Settings className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
