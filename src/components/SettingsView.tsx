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
import StaffSection from '@/components/StaffSection';
import { useT, useAppLang } from '@/hooks/use-app-lang';
import {
  apiAuthState,
  apiOwnerPassword,
  getAuth,
  getDeviceDek,
  lockApp,
} from '@/lib/cloud';
import { deriveKek, exportDek, importDek, randomB64, wrapDek } from '@/lib/crypto';
import {
  clearFaceProfile,
  enrollFace,
  ensureFaceLandmarker,
  getFaceProfile,
  openFaceCamera,
  saveFaceProfile,
  type FaceProfile,
} from '@/lib/face';
import { CloudUpload, Download, ImageUp, KeyRound, Lock, Plus, RefreshCw, RotateCcw, ScanFace, ShieldCheck, Trash2, TriangleAlert, Upload, UserRound } from 'lucide-react';
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
  /** owner-managed GST rate — applied to every new bill's taxable value */
  gstPercent: string;
}

const billingOf = (s: BusinessSettings): BillingDraft => ({
  invoicePrefix: s.invoicePrefix,
  nextInvoiceNo: String(s.nextInvoiceNo),
  slipWidthMm: s.slipWidthMm,
  thankYouNote: s.thankYouNote,
  returnPolicy: s.returnPolicy,
  gstPercent: String(s.gstPercent ?? 0),
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


      <SecuritySection />

      <Separator />

      <FaceUnlockSection />

      <Separator />

      <AppearanceSection />

      <Separator />


      <StaffSection />

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
  // re-sync the draft when the SERVER's identity values actually change —
  // a poll that only replaces the settings object identity (any other save
  // bumped the rev) must NOT wipe what the owner is typing right now
  const [serverIdentity, setServerIdentity] = useState(() => JSON.stringify(identityOf(settings)));
  const [draftSync, setDraftSync] = useState(settings);
  if (draftSync !== settings) {
    setDraftSync(settings);
    const now = JSON.stringify(identityOf(settings));
    if (now !== serverIdentity) {
      setServerIdentity(now);
      setDraft(identityOf(settings));
    }
  }

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
    })
      .then(() =>
        toast({
          title: t('settings.updatedToast'),
          description: draft.companyName.trim() || undefined,
        })
      )
      .catch((e: unknown) =>
        toast({
          title: e instanceof Error && e.message === 'offline' ? t('net.required') : t('net.saveFailed'),
          variant: 'destructive',
        })
      );
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
  // same guard as the identity section: object-identity poll updates must not
  // discard an in-progress GST/slip edit (the disabled Save bug)
  const [serverBilling, setServerBilling] = useState(() => JSON.stringify(billingOf(settings)));
  const [billingSync, setBillingSync] = useState(settings);
  if (billingSync !== settings) {
    setBillingSync(settings);
    const now = JSON.stringify(billingOf(settings));
    if (now !== serverBilling) {
      setServerBilling(now);
      setDraft(billingOf(settings));
    }
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(billingOf(settings));
  const upd = (patch: Partial<BillingDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    const gstPercent = Math.min(Math.max(Number(draft.gstPercent.replace(/[^\d.]/g, '')) || 0, 0), 28);
    saveSettings({
      invoicePrefix: draft.invoicePrefix.trim() || 'SLP-INV-',
      nextInvoiceNo: Math.max(1, Number(draft.nextInvoiceNo.replace(/\D/g, '')) || 1),
      slipWidthMm: draft.slipWidthMm,
      thankYouNote: draft.thankYouNote,
      returnPolicy: draft.returnPolicy,
      gstPercent,
    })
      .then(() => toast({ title: t('settings.billingUpdatedToast') }))
      .catch((e: unknown) =>
        toast({
          title: e instanceof Error && e.message === 'offline' ? t('net.required') : t('net.saveFailed'),
          variant: 'destructive',
        })
      );
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
      <Field
        ariaLabel="GST percent"
        label={t('settings.gstPercent')}
        value={draft.gstPercent}
        onChange={(v) => upd({ gstPercent: v.replace(/[^\d.]/g, '') })}
        placeholder="0"
        type="number"
      />
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
/* Security — the Owner/Admin username + password (v35). Seeded with   */
/* the initial credentials; the nag stays until the password changes.  */
/* ------------------------------------------------------------------ */

function SecuritySection() {
  const t = useT();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void apiAuthState().then((st) => {
      if (st.ok) {
        setUsername(st.ownerUsername || '');
        setIsDefault(Boolean(st.ownerPasswordIsDefault));
      }
      setLoaded(true);
    });
  }, []);

  const change = async () => {
    if (busy) return;
    if (next.length < 4) {
      toast({ title: t('settings.changePasswordBtn'), description: t('lock.staffErr'), variant: 'destructive' });
      return;
    }
    if (isDefault && current.length === 0 && false) {
      // (default password IS the current one — no need to retype it)
    }
    setBusy(true);
    try {
      const dekB64 = getDeviceDek();
      if (!dekB64) {
        toast({ title: t('settings.changePasswordBtn'), description: 'locked', variant: 'destructive' });
        return;
      }
      const dek = await importDek(dekB64).catch(() => null);
      if (!dek) return;
      const salt = randomB64(16);
      const { kek } = await deriveKek(next, salt);
      const { wrapped, iv } = await wrapDek(dek, kek);
      const res = await apiOwnerPassword({
        username: username.trim() || 'Pradeep',
        password: next,
        currentPassword: current || undefined,
        dekSalt: salt,
        dekIv: iv,
        dekWrapped: wrapped,
      });
      if (!res.ok) {
        toast({ title: t('settings.changePasswordBtn'), description: res.error, variant: 'destructive' });
        return;
      }
      setCurrent('');
      setNext('');
      setIsDefault(false);
      toast({ title: t('settings.passwordChanged') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Security" className="space-y-3" data-security-section>
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
        <KeyRound className="size-4" />
        {t('settings.security')}
      </h3>
      <p className="text-xs text-muted-foreground">{t('settings.securityDesc')}</p>
      {loaded && isDefault && (
        <p data-default-password-warn className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {t('settings.defaultPasswordWarn')}
        </p>
      )}
      <Field
        ariaLabel="Admin username"
        label={t('settings.adminUsername')}
        value={username}
        onChange={setUsername}
      />
      {!isDefault && (
        <Field
          ariaLabel="Current password"
          label={t('settings.currentPassword')}
          value={current}
          onChange={setCurrent}
          type="password"
        />
      )}
      <Field
        ariaLabel="New password"
        label={t('settings.newPassword')}
        value={next}
        onChange={setNext}
        type="password"
      />
      <Button
        onClick={() => void change()}
        disabled={busy || next.length < 4}
        className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
        aria-label="Change owner password"
      >
        <KeyRound className="size-4" />
        {t('settings.changePasswordBtn')}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t('sync.e2eeNote')}</p>
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => {
          // wipe the session on this device — every other device keeps running
          lockApp();
          window.dispatchEvent(new Event('slp-lock'));
        }}
        aria-label="Lock app"
      >
        <Lock className="size-4" />
        {t('settings.lockBtn')}
      </Button>
    </section>
  );
}

/* Face Unlock (v40) — enroll the owner's face on THIS device. Samples    */
/* become normalized landmark embeddings stored in localStorage only; the */
/* server never receives a face. Enabled here, the lock screen opens      */
/* without the MPIN when the camera matches (MPIN stays as fallback).     */
function FaceUnlockSection() {
  const t = useT();
  const { toast } = useToast();
  const [profile, setProfile] = useState<FaceProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const videoHostRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setProfile(getFaceProfile());
    return () => stopRef.current?.();
  }, []);

  const enroll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setProgress(t('settings.faceStarting'));
      const cam = await openFaceCamera();
      stopRef.current = cam.stop;
      const host = videoHostRef.current;
      if (host) {
        host.replaceChildren(cam.video);
        cam.video.style.width = '100%';
        cam.video.style.height = '100%';
        cam.video.style.objectFit = 'cover';
        cam.video.style.transform = 'scaleX(-1)'; // selfie mirror
      }
      setProgress(t('settings.faceModel'));
      await ensureFaceLandmarker(); // loads wasm + model (same-origin, cached)
      setProgress(t('settings.faceCapturing'));
      const samples = await enrollFace(cam.video, 4, (done, total) => {
        setProgress(`${t('settings.faceCapturing')} ${done}/${total}`);
      });
      const next: FaceProfile = { enabled: true, samples, enrolledAt: Date.now() };
      saveFaceProfile(next);
      setProfile(next);
      toast({ title: t('settings.faceUnlock'), description: t('settings.faceDone') });
    } catch {
      toast({ title: t('settings.faceUnlock'), description: t('face.errCamera'), variant: 'destructive' });
    } finally {
      stopRef.current?.();
      stopRef.current = null;
      setBusy(false);
      setProgress('');
      videoHostRef.current?.replaceChildren();
    }
  };

  const disable = () => {
    clearFaceProfile();
    setProfile(null);
    toast({ title: t('settings.faceUnlock'), description: t('settings.faceRemoved') });
  };

  return (
    <section aria-label="Face unlock" className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
        <ScanFace className="size-4" />
        {t('settings.faceUnlock')}
      </h3>
      <p className="text-xs text-muted-foreground">{t('settings.faceUnlockDesc')}</p>
      {profile?.enabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            {t('settings.faceEnrolled')}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={disable}>
            <Trash2 className="size-4" />
            {t('settings.faceDisable')}
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => void enroll()} disabled={busy} className="h-10">
          <ScanFace className="size-4" />
          {t('settings.faceEnroll')}
        </Button>
      )}
      {(busy || progress) && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-blue-800">{progress}</p>
          <div ref={videoHostRef} className="h-40 w-56 overflow-hidden rounded-lg bg-slate-900" />
        </div>
      )}
    </section>
  );
}

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
/* Sync & security — encrypted cloud sync between the owner's phones   */
/* (MPIN login, MPIN-protected data) and the manual lock.              */
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
