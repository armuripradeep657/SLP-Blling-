'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import {
  apiAuthState,
  apiMpinSetup,
  apiMpinUnlock,
  apiPullVault,
  setAuth,
  setDeviceDek,
  lockApp,
} from '@/lib/cloud';
import { deriveKek, exportDek, generateDek, randomB64, unwrapDek, wrapDek } from '@/lib/crypto';
import { mergeVaultBlob, pushVaultNow } from '@/lib/sync';

type Step = 'checking' | 'setup' | 'unlock';

/**
 * Draft of the MPIN being typed, kept in sessionStorage so a page reload
 * (the preview frame refreshes itself often) never wipes what was typed.
 * Tab-scoped and cleared the moment the MPIN is accepted.
 */
const DRAFT_KEY = 'slp-mpin-draft';

/** Hard ceiling for any lock-screen wait — the button can never stick on "Opening…" */
const WATCHDOG_MS = 15000;

const errKey = (code: string | undefined): 'lock.errWrongPin' | 'lock.errTooMany' | 'lock.errNetwork' | 'lock.errExists' => {
  if (code === 'wrongMpin') return 'lock.errWrongPin';
  if (code === 'rateLimited') return 'lock.errTooMany';
  if (code === 'exists' || code === 'noMpin') return 'lock.errExists';
  return 'lock.errNetwork'; // network / offline / unknown
};

/**
 * Full-screen gate in front of the app: the owner's MPIN is the only login.
 * First use creates the MPIN (it wraps the end-to-end encryption key);
 * every later time the MPIN opens the encrypted data. The device stays
 * unlocked until "Lock app".
 */
export default function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const t = useT();
  const companyName =
    useStore((s) => s.settings.companyName) || 'Sri Lakshmi Cement Works';
  const logoSrc = useStore((s) => s.appearance.watermark) || '/narasimha-logo.jpg';

  const [step, setStep] = useState<Step>('checking');
  const [salt, setSalt] = useState<string | null>(null);
  const [mpin, setMpin] = useState('');
  const [mpin2, setMpin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Instant double-submit guard — state alone is too slow for fast double-taps */
  const busyRef = useRef(false);
  const probingRef = useRef(false);
  const restoredRef = useRef(false);

  const setBusyBoth = (v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  };

  /**
   * Ask the server whether this app already has an MPIN (setup vs unlock).
   * Runs ONCE per mount through a ref — re-renders (typing!) can never
   * re-trigger it, and it NEVER wipes what the user already typed.
   */
  const probe = useCallback(async () => {
    if (probingRef.current) return;
    probingRef.current = true;
    setError(null);
    setBusyBoth(true);
    const res = await apiAuthState();
    setBusyBoth(false);
    probingRef.current = false;
    if (!res.ok) {
      setStep('checking');
      setError(t('lock.errNetwork'));
      return;
    }
    setSalt(res.dekSalt ?? null);
    setStep(res.hasMpin ? 'unlock' : 'setup');
  }, [t]);
  const probeRef = useRef(probe);
  probeRef.current = probe;

  useEffect(() => {
    // restore an interrupted draft BEFORE probing (a reload mid-typing keeps the digits)
    if (!restoredRef.current) {
      restoredRef.current = true;
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw) as { mpin?: string; mpin2?: string };
          if (typeof d?.mpin === 'string') setMpin(d.mpin.replace(/\D/g, '').slice(0, 8));
          if (typeof d?.mpin2 === 'string') setMpin2(d.mpin2.replace(/\D/g, '').slice(0, 8));
        }
      } catch {
        /* storage unavailable */
      }
    }
    void probeRef.current?.();
  }, []);

  // persist the draft on every keystroke — typing survives any reload
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ mpin, mpin2 }));
    } catch {
      /* storage unavailable */
    }
  }, [mpin, mpin2]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  /** Wrap a submit so the button can NEVER stay stuck on "Opening…" */
  const withWatchdog = async (fn: () => Promise<void>) => {
    const wd = setTimeout(() => {
      if (busyRef.current) {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    }, WATCHDOG_MS);
    try {
      await fn();
    } finally {
      clearTimeout(wd);
    }
  };

  /** First use: create MPIN, generate DEK, wrap it with MPIN — server gets the wrapped key only */
  const setupMpin = async () => {
    if (busyRef.current) return; // one submit at a time — double-taps are ignored
    setError(null);
    if (!/^\d{4,8}$/.test(mpin)) {
      setError(t('lock.errPin'));
      return;
    }
    if (mpin !== mpin2) {
      setError(t('lock.errPinMatch'));
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const newSalt = randomB64(16);
        const dek = await generateDek();
        const { kek, proof } = await deriveKek(mpin, newSalt);
        const { wrapped, iv } = await wrapDek(dek, kek);
        const saved = await apiMpinSetup(`${iv}.${wrapped}`, newSalt, proof);
        if (!saved.ok) {
          setBusyBoth(false);
          if (saved.error === 'exists') {
            // the MPIN was already created (here or on another device) — keep
            // the typed digits and let the owner open with them
            await probe();
            setStep('unlock');
            setError(t('lock.errExists'));
            return;
          }
          setError(t(errKey(saved.error)));
          return;
        }
        setAuth(saved.token ?? '');
        // keep the raw key on THIS device only — it stays unlocked until "Lock app"
        setDeviceDek(await exportDek(dek));
        clearDraft();
        setBusyBoth(false);
        void pushVaultNow(); // upload whatever this device already has
        onUnlocked();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /** Every later login: MPIN → proof → session → unwrap the DEK → open the encrypted data */
  const unlockData = async () => {
    if (busyRef.current) return; // one submit at a time — double-taps are ignored
    setError(null);
    if (!/^\d{4,8}$/.test(mpin)) {
      setError(t('lock.errPin'));
      return;
    }
    if (!salt) {
      // no salt from the probe — re-probe (server may have restarted / state changed)
      await probe();
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const { kek, proof } = await deriveKek(mpin, salt);
        const res = await apiMpinUnlock(proof);
        if (!res.ok || !res.token) {
          setBusyBoth(false);
          if (res.error === 'noMpin') {
            await probe();
            return;
          }
          setError(t(errKey(res.error)));
          return;
        }
        setAuth(res.token);
        const pull = await apiPullVault();
        if (pull.kind === 'auth') {
          lockApp();
          setBusyBoth(false);
          setError(t(errKey('wrongMpin')));
          return;
        }
        if (pull.kind === 'offline') {
          setBusyBoth(false);
          setError(t('lock.errNetwork'));
          return;
        }
        if (pull.kind === 'empty') {
          // no data pushed yet — open the SAME wrapped key (if any) so devices stay compatible
          const wrappedEmpty = pull.dekWrapped ?? '';
          const dotE = wrappedEmpty.indexOf('.');
          if (dotE > 0 && pull.dekSalt) {
            const dekSame = await unwrapDek(
              wrappedEmpty.slice(dotE + 1),
              wrappedEmpty.slice(0, dotE),
              kek
            ).catch(() => null);
            if (dekSame) {
              setDeviceDek(await exportDek(dekSame));
              clearDraft();
              setBusyBoth(false);
              void pushVaultNow();
              onUnlocked();
              return;
            }
          }
          // nothing stored at all — start with a fresh key
          const dekNew = await generateDek();
          setDeviceDek(await exportDek(dekNew));
          clearDraft();
          setBusyBoth(false);
          void pushVaultNow();
          onUnlocked();
          return;
        }
        const dot = pull.dekWrapped.indexOf('.');
        if (dot <= 0) {
          setBusyBoth(false);
          setError(t('lock.errNetwork'));
          return;
        }
        const dek = await unwrapDek(
          pull.dekWrapped.slice(dot + 1),
          pull.dekWrapped.slice(0, dot),
          kek
        ).catch(() => null);
        if (!dek) {
          setBusyBoth(false);
          setError(t('lock.errWrongPin'));
          return;
        }
        setDeviceDek(await exportDek(dek));
        const opened = await mergeVaultBlob(pull.ciphertext, pull.dataIv, dek);
        setBusyBoth(false);
        if (!opened) {
          setError(t('lock.errWrongPin'));
          return;
        }
        clearDraft();
        onUnlocked();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /** Explicit retry is the only thing that wipes the form */
  const retryProbe = () => {
    setMpin('');
    setMpin2('');
    clearDraft();
    void probe();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-100 px-4 py-8">
      <div className="w-full max-w-sm space-y-5">
        {/* logo + name */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={logoSrc}
            alt="Company logo"
            className="size-20 rounded-full object-cover shadow-md ring-2 ring-white"
          />
          <div>
            <h1 className="text-lg font-extrabold leading-snug text-blue-900">{companyName}</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Lock className="size-3.5" />
              {t('lock.subtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
          {step === 'checking' && (
            <>
              <p className="text-center text-sm text-muted-foreground">{t('lock.checking')}</p>
              <Button
                onClick={retryProbe}
                disabled={busy}
                variant="outline"
                className="h-11 w-full"
                aria-label="Retry"
              >
                <RefreshCw className="size-4" />
                {t('lock.retry')}
              </Button>
            </>
          )}

          {step === 'setup' && (
            <>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
                  <KeyRound className="size-4" />
                  {t('lock.setPinTitle')}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t('lock.setPinDesc')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lock-mpin" className="text-xs text-muted-foreground">
                  {t('lock.pinLabel')}
                </Label>
                <Input
                  id="lock-mpin"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  maxLength={8}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="New MPIN"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lock-mpin2" className="text-xs text-muted-foreground">
                  {t('lock.pinConfirm')}
                </Label>
                <Input
                  id="lock-mpin2"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={mpin2}
                  onChange={(e) => setMpin2(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="Confirm MPIN"
                />
              </div>
              <Button
                onClick={setupMpin}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Save MPIN"
              >
                <KeyRound className="size-4" />
                {busy ? t('lock.saving') : t('lock.saveBtn')}
              </Button>
            </>
          )}

          {step === 'unlock' && (
            <>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
                  <KeyRound className="size-4" />
                  {t('lock.unlockTitle')}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t('lock.unlockDesc')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lock-unlockmpin" className="text-xs text-muted-foreground">
                  {t('lock.pinLabel')}
                </Label>
                <Input
                  id="lock-unlockmpin"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  maxLength={8}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="MPIN"
                />
              </div>
              <Button
                onClick={unlockData}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Open app"
              >
                <Lock className="size-4" />
                {busy ? t('lock.verifying') : t('lock.unlockBtn')}
              </Button>
            </>
          )}

          {error && (
            <p role="alert" data-lock-error className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <p className="flex items-start justify-center gap-1.5 px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          {t('lock.secureNote')}
        </p>
      </div>
    </div>
  );
}
