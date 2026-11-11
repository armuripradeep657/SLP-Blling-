'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '@/lib/defaultData';
import { normalizePhone } from '@/lib/billing';
import InstallAppSection from '@/components/InstallAppSection';
import { useT, useAppLang } from '@/hooks/use-app-lang';
import { Download, ImageUp, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import type {
  Appearance,
  BgThemeId,
  BusinessSettings,
  Expense,
  HeaderThemeId,
  IncomeEntry,
  Invoice,
  LabourWork,
  Product,
} from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Draft shapes — edits stay LOCAL until the owner presses Update      */
/* ------------------------------------------------------------------ */

/** Business Identity card fields (company name, owner, contact & UPI) */
interface IdentityDraft {
  companyName: string;
  companyNameTe: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  upiId: string;
}

const identityOf = (s: BusinessSettings): IdentityDraft => ({
  companyName: s.companyName,
  companyNameTe: s.companyNameTe ?? '',
  ownerName: s.ownerName,
  phone: s.phone,
  whatsappNumber: s.whatsappNumber,
  address: s.address,
  upiId: s.upiId,
});

/** Billing & Slip card fields */
interface BillingDraft {
  invoicePrefix: string;
  nextInvoiceNo: string;
  slipWidthMm: 58 | 80;
  thankYouNote: string;
  returnPolicy: string;
}

const billingOf = (s: BusinessSettings): BillingDraft => ({
  invoicePrefix: s.invoicePrefix,
  nextInvoiceNo: String(s.nextInvoiceNo),
  slipWidthMm: s.slipWidthMm,
  thankYouNote: s.thankYouNote,
  returnPolicy: s.returnPolicy,
});

/** Shape of the backup file the app writes & reads back */
interface BackupFile {
  app: string;
  backupVersion: number;
  exportedAt: string;
  settings: BusinessSettings;
  products: Product[];
  invoices?: Invoice[];
  expenses?: Expense[];
  incomes?: IncomeEntry[];
  labourWorks?: LabourWork[];
  appearance?: Appearance;
}

/** Background themes shown in Settings → Appearance */
const BG_THEMES: { id: BgThemeId; en: string; te: string; swatch: string }[] = [
  { id: 'blue', en: 'Blue', te: 'నీలం', swatch: 'from-blue-50 to-neutral-100' },
  { id: 'cream', en: 'Cream', te: 'క్రీమ్', swatch: 'from-amber-50 to-stone-100' },
  { id: 'mint', en: 'Mint', te: 'మింట్', swatch: 'from-emerald-50 to-neutral-100' },
  { id: 'lavender', en: 'Lavender', te: 'లావెండర్', swatch: 'from-violet-50 to-neutral-100' },
  { id: 'slate', en: 'Grey', te: 'గ్రే', swatch: 'from-slate-200 to-slate-100' },
];

/** Header colour themes shown in Settings → Appearance */
const HEADER_COLOURS: { id: HeaderThemeId; en: string; te: string; swatch: string }[] = [
  { id: 'blue', en: 'Blue', te: 'నీలం', swatch: 'from-blue-700 to-blue-600' },
  { id: 'green', en: 'Green', te: 'ఆకుపచ్చ', swatch: 'from-emerald-700 to-emerald-600' },
  { id: 'maroon', en: 'Maroon', te: 'మరూన్', swatch: 'from-rose-900 to-rose-800' },
  { id: 'navy', en: 'Navy', te: 'నేవీ', swatch: 'from-slate-900 to-slate-800' },
  { id: 'teal', en: 'Teal', te: 'టీల్', swatch: 'from-teal-700 to-teal-600' },
];

export default function SettingsView() {
  const t = useT();
  const appLang = useAppLang();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const { toast } = useToast();

  const set = (patch: Partial<typeof settings>) => saveSettings(patch);

  return (
    <div className="space-y-5">
      {/* App language — the whole app switches between English and తెలుగు */}
      <section aria-label="App language" className="space-y-2">
        <h3 className="text-sm font-bold text-blue-800">{t('settings.appLang')}</h3>
        <p className="text-xs text-muted-foreground">{t('settings.appLangDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'en', label: 'English' },
            { id: 'te', label: 'తెలుగు' },
          ] as const).map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => set({ appLang: l.id })}
              className={`h-11 rounded-lg border text-sm font-semibold transition-colors ${
                appLang === l.id
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'bg-card hover:bg-accent'
              }`}
              aria-pressed={appLang === l.id}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <BusinessIdentitySection />

      <Separator />

      <BillingSlipSection />

      <Separator />

      <AppearanceSection />

      <Separator />

      <InstallAppSection />

      <Separator />

      <AppUpdatesSection />

      <Separator />

      <BackupSection />

      <Separator />

      <section aria-label="Data management" className="space-y-2">
        <h3 className="text-sm font-bold text-blue-800">{t('settings.data')}</h3>
        <p className="text-xs text-muted-foreground">
          All data (products, bills, settings) is stored on this device only — the app works fully offline.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              {t('settings.resetCatalog')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset catalog?</AlertDialogTitle>
              <AlertDialogDescription>
                Your custom products will be replaced with the default cement product list. Bills & settings are kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  saveSettings(DEFAULT_SETTINGS);
                  useStore.setState({ products: DEFAULT_PRODUCTS });
                  toast({ title: 'Catalog reset to defaults' });
                }}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              {t('settings.eraseAll')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle>Erase everything?</AlertDialogTitle>
              <AlertDialogDescription>
                All products, invoices and settings on this device will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  localStorage.removeItem('slp-cement-billing-v1');
                  location.reload();
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Erase
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business Identity — edit freely, save only with "Update details"    */
/* ------------------------------------------------------------------ */

function BusinessIdentitySection() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const { toast } = useToast();

  const [draft, setDraft] = useState<IdentityDraft>(() => identityOf(settings));
  // re-sync the draft whenever saved settings change (Update pressed / backup restored)
  useEffect(() => setDraft(identityOf(settings)), [settings]);

  const saved = identityOf(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const upd = (patch: Partial<IdentityDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    saveSettings({
      ...draft,
      companyName: draft.companyName.trim(),
      companyNameTe: draft.companyNameTe.trim(),
      ownerName: draft.ownerName.trim(),
      phone: normalizePhone(draft.phone),
      whatsappNumber: normalizePhone(draft.whatsappNumber),
      address: draft.address.trim(),
      upiId: draft.upiId.trim(),
    });
    toast({
      title: t('settings.updatedToast'),
      description: draft.companyName.trim() || undefined,
    });
  };

  return (
    <section aria-label="Business identity" className="space-y-3">
      <h3 className="text-sm font-bold text-blue-800">{t('settings.businessIdentity')}</h3>
      <p className="text-xs text-muted-foreground">{t('settings.updateHint')}</p>
      <Field
        ariaLabel="Company name"
        label={t('settings.companyName')}
        value={draft.companyName}
        onChange={(v) => upd({ companyName: v })}
        textarea
      />
      <Field
        ariaLabel="Company name in Telugu"
        label={t('settings.companyNameTe')}
        value={draft.companyNameTe}
        onChange={(v) => upd({ companyNameTe: v })}
        textarea
        placeholder="శ్రీ లక్ష్మీ పెంచిల నరసింహ స్వామి సిమెంట్ వర్క్స్"
      />
      <Field
        ariaLabel="Owner name"
        label={t('settings.ownerName')}
        value={draft.ownerName}
        onChange={(v) => upd({ ownerName: v })}
        placeholder="A. Prasad"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field
          ariaLabel="Phone"
          label={t('settings.phone')}
          value={draft.phone}
          onChange={(v) => upd({ phone: v })}
          type="tel"
          placeholder="98765 43210"
        />
        <Field
          ariaLabel="WhatsApp number"
          label={t('settings.whatsapp')}
          value={draft.whatsappNumber}
          onChange={(v) => upd({ whatsappNumber: v })}
          type="tel"
          placeholder="Used on bills"
        />
      </div>
      <Field
        ariaLabel="Shop address"
        label={t('settings.address')}
        value={draft.address}
        onChange={(v) => upd({ address: v })}
        textarea
        placeholder="Main Road, Village, District"
      />
      <Field
        ariaLabel="UPI ID"
        label={t('settings.upi')}
        value={draft.upiId}
        onChange={(v) => upd({ upiId: v })}
        placeholder="name@upi"
      />
      <Button
        onClick={save}
        disabled={!dirty}
        className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
        aria-label="Update details"
      >
        {t('settings.updateDetails')}
      </Button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Billing & Slip — edit freely, save only with "Update bill settings" */
/* ------------------------------------------------------------------ */

function BillingSlipSection() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const { toast } = useToast();

  const [draft, setDraft] = useState<BillingDraft>(() => billingOf(settings));
  useEffect(() => setDraft(billingOf(settings)), [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(billingOf(settings));
  const upd = (patch: Partial<BillingDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    saveSettings({
      invoicePrefix: draft.invoicePrefix.trim() || 'SLP-INV-',
      nextInvoiceNo: Math.max(1, Number(draft.nextInvoiceNo.replace(/\D/g, '')) || 1),
      slipWidthMm: draft.slipWidthMm,
      thankYouNote: draft.thankYouNote,
      returnPolicy: draft.returnPolicy,
    });
    toast({ title: t('settings.billingUpdatedToast') });
  };

  return (
    <section aria-label="Billing preferences" className="space-y-3">
      <h3 className="text-sm font-bold text-blue-800">{t('settings.billingSlip')}</h3>
      <div className="grid grid-cols-2 gap-2">
        <Field
          ariaLabel="Invoice prefix"
          label={t('settings.invoicePrefix')}
          value={draft.invoicePrefix}
          onChange={(v) => upd({ invoicePrefix: v })}
          placeholder="SLP-INV-"
        />
        <Field
          ariaLabel="Next invoice no."
          label={t('settings.nextInvoiceNo')}
          value={draft.nextInvoiceNo}
          onChange={(v) => upd({ nextInvoiceNo: v.replace(/\D/g, '') })}
          type="number"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('settings.slipWidth')}</Label>
        <div className="flex gap-2">
          {([58, 80] as const).map((mm) => (
            <button
              key={mm}
              onClick={() => upd({ slipWidthMm: mm })}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                draft.slipWidthMm === mm ? 'border-blue-600 bg-blue-600 text-white' : 'bg-card hover:bg-accent'
              }`}
            >
              {mm} mm {mm === 58 ? '(small)' : '(standard)'}
            </button>
          ))}
        </div>
      </div>
      <Field
        ariaLabel="Thank-you note"
        label={t('settings.thankYouNote')}
        value={draft.thankYouNote}
        onChange={(v) => upd({ thankYouNote: v })}
      />
      <Field
        ariaLabel="Return policy"
        label={t('settings.returnPolicy')}
        value={draft.returnPolicy}
        onChange={(v) => upd({ returnPolicy: v })}
      />
      <Button
        onClick={save}
        disabled={!dirty}
        className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
        aria-label="Update bill settings"
      >
        {t('settings.updateBilling')}
      </Button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Appearance — background theme, header colour & owner's own photo     */
/* Changes apply instantly so the owner sees the look right away.       */
/* ------------------------------------------------------------------ */

function AppearanceSection() {
  const t = useT();
  const appLang = useAppLang();
  const appearance = useStore((s) => s.appearance);
  const setAppearance = useStore((s) => s.setAppearance);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  /** Downscale the picked photo so it stays small enough for local storage */
  const pickWatermark = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = URL.createObjectURL(f);
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('bad image'));
        im.src = url;
      });
      const max = 640;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(url);
      setAppearance({ watermark: dataUrl });
      toast({ title: t('settings.watermarkDone') });
    } catch {
      toast({ title: t('settings.watermarkFailed') });
    }
  };

  return (
    <section aria-label="Appearance" className="space-y-3">
      <h3 className="text-sm font-bold text-blue-800">{t('settings.appearance')}</h3>
      <p className="text-xs text-muted-foreground">{t('settings.appearanceDesc')}</p>

      {/* Background theme */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('settings.bgTheme')}</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_THEMES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setAppearance({ bgTheme: b.id })}
              aria-label={`Background theme ${b.id}`}
              aria-pressed={appearance.bgTheme === b.id}
              className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all active:scale-95 ${
                appearance.bgTheme === b.id ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-border'
              }`}
            >
              <span className={`h-8 w-full rounded bg-gradient-to-b ${b.swatch}`} />
              <span className="text-[10px] font-medium">{appLang === 'te' ? b.te : b.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header colour */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('settings.headerColour')}</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {HEADER_COLOURS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setAppearance({ headerTheme: c.id })}
              aria-label={`Header colour ${c.id}`}
              aria-pressed={appearance.headerTheme === c.id}
              className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all active:scale-95 ${
                appearance.headerTheme === c.id ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-border'
              }`}
            >
              <span className={`h-8 w-full rounded bg-gradient-to-r ${c.swatch}`} />
              <span className="text-[10px] font-medium">{appLang === 'te' ? c.te : c.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Watermark photo from the owner's device */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('settings.watermark')}</Label>
        <p className="text-xs text-muted-foreground">{t('settings.watermarkDesc')}</p>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appearance.watermark || '/narasimha-logo.jpg'}
            alt="Watermark preview"
            className="size-14 shrink-0 rounded-full border object-cover"
            data-watermark-preview
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Button variant="outline" className="h-10 w-full" onClick={() => fileRef.current?.click()} aria-label="Pick watermark photo">
              <ImageUp className="size-4" />
              {t('settings.watermarkPick')}
            </Button>
            {appearance.watermark && (
              <Button variant="ghost" className="h-9 w-full" onClick={() => setAppearance({ watermark: '' })} aria-label="Reset watermark">
                <RotateCcw className="size-4" />
                {t('settings.watermarkReset')}
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Watermark photo file"
          onChange={pickWatermark}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Backup & restore — one file with company details, products, bills   */
/* and the whole ledger. Download it, keep it safe, restore anywhere.  */
/* ------------------------------------------------------------------ */

function BackupSection() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const products = useStore((s) => s.products);
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const incomes = useStore((s) => s.incomes);
  const labourWorks = useStore((s) => s.labourWorks);
  const appearance = useStore((s) => s.appearance);
  const saveSettings = useStore((s) => s.saveSettings);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doBackup = () => {
    const data: BackupFile = {
      app: 'slp-billing',
      backupVersion: 2,
      exportedAt: new Date().toISOString(),
      settings,
      products,
      invoices,
      expenses,
      incomes,
      labourWorks,
      appearance,
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast({
        title: t('settings.backupDone'),
        description: `${products.length} ${t('settings.backupProducts')} · ${invoices.length} ${t('settings.backupBills')}`,
      });
    } catch {
      toast({ title: t('settings.backupFailed') });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as BackupFile;
      if (data?.app !== 'slp-billing' || typeof data.settings !== 'object' || !Array.isArray(data.products)) {
        throw new Error('not a valid backup');
      }
      setPending(data);
    } catch {
      toast({ title: t('settings.backupInvalid') });
    }
  };

  const doRestore = () => {
    if (!pending) return;
    saveSettings(pending.settings);
    useStore.setState({
      products: pending.products,
      invoices: pending.invoices ?? [],
      expenses: pending.expenses ?? [],
      incomes: pending.incomes ?? [],
      labourWorks: pending.labourWorks ?? [],
      ...(pending.appearance ? { appearance: { ...useStore.getState().appearance, ...pending.appearance } } : {}),
    });
    toast({
      title: t('settings.restoredToast'),
      description: `${pending.products.length} ${t('settings.backupProducts')} · ${(pending.invoices ?? []).length} ${t('settings.backupBills')}`,
    });
    setPending(null);
  };

  return (
    <section aria-label="Backup and restore" className="space-y-2">
      <h3 className="text-sm font-bold text-blue-800">{t('settings.backup')}</h3>
      <p className="text-xs text-muted-foreground">{t('settings.backupDesc')}</p>
      <Button
        onClick={doBackup}
        className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
        aria-label="Backup data"
      >
        <Download className="size-4" />
        {t('settings.backupBtn')}
      </Button>
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => fileRef.current?.click()}
        aria-label="Restore backup"
      >
        <Upload className="size-4" />
        {t('settings.restoreBtn')}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Restore backup file"
        onChange={onFile}
      />

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.restoreConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.restoreConfirmDesc')}
              {pending && (
                <span className="mt-1 block font-semibold text-foreground">
                  {pending.settings.companyName} · {pending.products.length} {t('settings.backupProducts')} ·{' '}
                  {(pending.invoices ?? []).length} {t('settings.backupBills')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doRestore}
              className="bg-blue-600 text-white hover:bg-blue-700"
              aria-label="Confirm restore"
            >
              {t('settings.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/**
 * Every device runs the SAME app link — when the owner (or we) change anything,
 * installed phones pick it up automatically: the app checks for updates while
 * open (and on every open/focus/back-online) and refreshes itself. This button
 * lets the owner force the check right now.
 */
function AppUpdatesSection() {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  const checkNow = async () => {
    if (!('serviceWorker' in navigator)) {
      toast({ title: 'You are on the latest version' });
      return;
    }
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast({ title: 'You are on the latest version' });
        return;
      }
      let found = false;
      const onUpdateFound = () => {
        found = true;
      };
      reg.addEventListener('updatefound', onUpdateFound, { once: true });
      await reg.update();
      // give a freshly found worker a moment to install (skipWaiting applies it)
      await new Promise((r) => setTimeout(r, 1200));
      reg.removeEventListener('updatefound', onUpdateFound);
      if (found || reg.waiting || reg.installing) {
        toast({
          title: 'Update found',
          description: 'The app refreshes to the latest version in a moment…',
        });
      } else {
        toast({ title: 'You are on the latest version' });
      }
    } catch {
      toast({
        title: 'Cannot check right now',
        description: 'Go online once and tap again — the app will update itself.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <section aria-label="App updates" className="space-y-2">
      <h3 className="text-sm font-bold text-blue-800">App updates</h3>
      <p className="text-xs text-muted-foreground">
        The same app link works on every phone. When anything is updated here, all installed
        devices get the change automatically — no reinstall needed. Bills stay safe on each
        device.
      </p>
      <Button variant="outline" className="w-full" onClick={checkNow} disabled={checking}>
        {checking ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        Check for updates now
      </Button>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  ariaLabel?: string;
}) {
  const isPhone = type === 'tel';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {textarea ? (
        <textarea
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      ) : (
        <Input
          aria-label={ariaLabel}
          type={type}
          inputMode={isPhone ? 'numeric' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={isPhone ? (e) => onChange(normalizePhone(e.target.value)) : undefined}
          placeholder={placeholder}
          className="h-11"
        />
      )}
    </div>
  );
}
