'use client';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WifiOff, ReceiptText, Package, History, Settings, BookText, Languages, ScanLine, LayoutDashboard, KeyRound } from 'lucide-react';
import { useSyncExternalStore, useState } from 'react';
import { useStore } from '@/lib/store';
import { useIdentity } from '@/lib/role';
import { apiStaffMePassword } from '@/lib/cloud';
import { deriveKek, exportDek, importDek, randomB64, wrapDek } from '@/lib/crypto';
import { getDeviceDek } from '@/lib/cloud';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import type { HeaderThemeId, MainTab } from '@/lib/types';

/** Header colour themes — applied to the top bar from Settings → Appearance */
const HEADER_STYLES: Record<HeaderThemeId, string> = {
  blue: 'from-blue-700 to-blue-600',
  green: 'from-emerald-700 to-emerald-600',
  maroon: 'from-rose-900 to-rose-800',
  navy: 'from-slate-900 to-slate-800',
  teal: 'from-teal-700 to-teal-600',
};

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
  const identity = useIdentity();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const headerTheme = useStore((s) => s.appearance.headerTheme);
  const watermark = useStore((s) => s.appearance.watermark);
  const [logoOpen, setLogoOpen] = useState(false);
  // SSR snapshot true matches most clients; updates reactively after hydration
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  // company name follows the app language — Telugu name in Telugu mode
  const companyName = appLang === 'te' && settings.companyNameTe ? settings.companyNameTe : settings.companyName;
  const logoSrc = watermark || '/narasimha-logo.jpg';

  return (
    <>
      <header
        data-header
        className={`sticky top-0 z-50 border-b bg-gradient-to-r ${HEADER_STYLES[headerTheme]} text-white shadow-md`}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setLogoOpen(true)}
            aria-label="Open logo"
            title={t('header.proprietor')}
            className="shrink-0 rounded-full transition-transform active:scale-90"
          >
            <img
              src={logoSrc}
              alt="Company logo"
              className="size-10 rounded-full object-cover ring-2 ring-white/60"
            />
          </button>
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
          {/* STAFF: change their own password right from the header */}
          {identity.role === 'staff' && <StaffPasswordButton />}
          {!online && (
            <Badge variant="secondary" className="shrink-0 gap-1 bg-white/20 text-white">
              <WifiOff className="size-3" /> {t('header.offline')}
            </Badge>
          )}
        </div>
      </header>

      {/* Tap the header logo → full logo view */}
      <Dialog open={logoOpen} onOpenChange={setLogoOpen}>
        <DialogContent className="max-w-xs rounded-2xl" aria-label="Logo preview">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">{companyName}</DialogTitle>
          </DialogHeader>
          <img
            src={logoSrc}
            alt="Company logo full view"
            className="mx-auto max-h-[60vh] w-auto max-w-full rounded-xl object-contain shadow-md"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BottomNav() {
  const t = useT();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const cart = useStore((s) => s.cart);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const identity = useIdentity();
  const unreadNotifs = useStore((s) => s.unreadNotifs);

  /** staff sees billing, verification and their own history — nothing else;
   *  the owner leads with the Admin Dashboard (live staff bill monitor) */
  const tabs = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: DashIcon, ownerOnly: true },
    { id: 'bill', label: t('nav.bill'), icon: ReceiptIcon, ownerOnly: false },
    { id: 'products', label: t('nav.products'), icon: PackageIcon, ownerOnly: true },
    { id: 'ledger', label: t('nav.ledger'), icon: LedgerIcon, ownerOnly: true },
    { id: 'history', label: t('nav.history'), icon: HistoryIcon, ownerOnly: false },
    { id: 'verify', label: t('nav.verify'), icon: ScanIcon, ownerOnly: false },
    { id: 'settings', label: t('nav.settings'), icon: SettingsIcon, ownerOnly: true },
  ].filter((x) => !x.ownerOnly || identity.role === 'owner') as Array<{
    id: MainTab;
    label: string;
    icon: (p: { className?: string; active?: boolean }) => React.ReactNode;
    ownerOnly: boolean;
  }>;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
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
              {x.id === 'dashboard' && identity.role === 'owner' && unreadNotifs > 0 && (
                <span
                  key={`n-${unreadNotifs}`}
                  data-nav-unread
                  className="anim-badge absolute right-[18%] top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white"
                >
                  {unreadNotifs}
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
  const identity = useIdentity();
  const tabs = [
    { id: 'dashboard', label: t('nav.dashboard'), ownerOnly: true },
    { id: 'bill', label: t('nav.newBill'), ownerOnly: false },
    { id: 'products', label: t('nav.products'), ownerOnly: true },
    { id: 'ledger', label: t('nav.ledger'), ownerOnly: true },
    { id: 'history', label: t('nav.invoiceHistory'), ownerOnly: false },
    { id: 'verify', label: t('nav.verify'), ownerOnly: false },
    { id: 'settings', label: t('nav.settings'), ownerOnly: true },
  ].filter((x) => !x.ownerOnly || identity.role === 'owner') as Array<{ id: MainTab; label: string; ownerOnly: boolean }>;

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

/**
 * STAFF self-service password change (v35) — the current password is
 * proven, the new one is re-hashed server-side and the vault key is
 * re-wrapped under the new password on THIS device.
 */
function StaffPasswordButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    if (busy || next.length < 4 || !current) return;
    setBusy(true);
    try {
      const dekB64 = getDeviceDek();
      let material;
      if (dekB64) {
        const dek = await importDek(dekB64).catch(() => null);
        if (dek) {
          const salt = randomB64(16);
          const { kek } = await deriveKek(next, salt);
          const { wrapped, iv } = await wrapDek(dek, kek);
          material = { dekSalt: salt, dekIv: iv, dekWrapped: wrapped };
        }
      }
      if (!material) return;
      const res = await apiStaffMePassword({
        currentPassword: current,
        password: next,
        ...material,
      });
      if (res.ok) {
        setDone(true);
        setCurrent('');
        setNext('');
        setTimeout(() => {
          setOpen(false);
          setDone(false);
        }, 1600);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change my password"
        data-staff-password-btn
        className="flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/15 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/25"
      >
        <KeyRound className="size-3.5" />
        {t('settings.staffChangePwd')}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-2xl" aria-label="Change my password">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">{t('staffPwd.title')}</DialogTitle>
          </DialogHeader>
          {done ? (
            <p className="py-3 text-center text-sm font-bold text-green-700">{t('staffPwd.changed')}</p>
          ) : (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label htmlFor="staff-pwd-cur" className="text-xs text-muted-foreground">
                  {t('staffPwd.current')}
                </Label>
                <Input
                  id="staff-pwd-cur"
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  aria-label="Current password"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="staff-pwd-new" className="text-xs text-muted-foreground">
                  {t('staffPwd.new')}
                </Label>
                <Input
                  id="staff-pwd-new"
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  aria-label="New password"
                  className="h-10"
                />
              </div>
              <Button
                onClick={() => void save()}
                disabled={busy || next.length < 4 || !current}
                className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Save new password"
              >
                {t('staffPwd.btn')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// tiny inline icon wrappers to keep this file self-contained
function DashIcon({ className, active }: { className?: string; active?: boolean }) {
  return <LayoutDashboard className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
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
function ScanIcon({ className, active }: { className?: string; active?: boolean }) {
  return <ScanLine className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
function SettingsIcon({ className, active }: { className?: string; active?: boolean }) {
  return <Settings className={`${className} ${active ? 'fill-blue-100' : ''}`} />;
}
