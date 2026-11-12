'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import {
  apiPullVault,
  apiRequestOtp,
  apiSavePin,
  apiVerifyOtp,
  setAuth,
  setDeviceDek,
  lockApp,
} from '@/lib/cloud';
import {
  deriveKek,
  exportDek,
  generateDek,
  randomB64,
  unwrapDek,
  wrapDek,
} from '@/lib/crypto';
import { buildPayload, mergeVaultBlob, pushVaultNow } from '@/lib/sync';

type Step = 'phone' | 'otp' | 'pin-setup' | 'pin-unlock';

const errKey = (code: string | undefined): 'lock.errOtp' | 'lock.errTooMany' | 'lock.errNetwork' => {
  if (code === 'wrongOtp' || code === 'otpExpired' || code === 'noOtp' || code === 'otpKilled')
    return 'lock.errOtp';
  if (code === 'tooManySends' || code === 'resendCooldown') return 'lock.errTooMany';
  return 'lock.errNetwork'; // network / offline / unknown
};

/**
 * Full-screen gate in front of the app: mobile number + real OTP login the
 * first time (or on a new phone), then the security PIN that unlocks the
 * end-to-end encrypted data. The device stays unlocked until "Lock app".
 */
export default function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const t = useT();
  const companyName =
    useStore((s) => s.settings.companyName) || 'Sri Lakshmi Cement Works';
  const logoSrc = useStore((s) => s.appearance.watermark) || '/narasimha-logo.jpg';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // resend cooldown ticker
  useEffect(() => {
    if (resendIn <= 0) return;
    const iv = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [resendIn]);

  const sendOtp = async () => {
    setError(null);
    const p = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(p)) {
      setError(t('lock.errPhone'));
      return;
    }
    setBusy(true);
    const res = await apiRequestOtp(p);
    setBusy(false);
    if (!res.ok) {
      setError(t(errKey(res.error)));
      return;
    }
    setPhone(p);
    setDemoOtp(res.demo ? res.otp ?? null : null);
    setOtp('');
    setStep('otp');
    setResendIn(30);
  };

  const verifyOtp = async () => {
    setError(null);
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError(t('lock.errOtp'));
      return;
    }
    setBusy(true);
    const res = await apiVerifyOtp(phone, code);
    setBusy(false);
    if (!res.ok || !res.token) {
      setError(t(errKey(res.error)));
      return;
    }
    setAuth(res.phone ?? phone, res.token);
    if (res.hasPin) {
      // returning device / new device: ask the PIN that opens the data
      setPin('');
      setStep('pin-unlock');
    } else {
      // first time ever: create the PIN that encrypts everything
      setPin('');
      setPin2('');
      setStep('pin-setup');
    }
  };

  /** First login: create DEK, wrap it with phone+PIN, hand the server only the wrapped key */
  const setupPin = async () => {
    setError(null);
    if (!/^\d{4,8}$/.test(pin)) {
      setError(t('lock.errPin'));
      return;
    }
    if (pin !== pin2) {
      setError(t('lock.errPinMatch'));
      return;
    }
    setBusy(true);
    try {
      const salt = randomB64(16);
      const dek = await generateDek();
      const kek = await deriveKek(phone, pin, salt);
      const { wrapped, iv } = await wrapDek(dek, kek);
      const saved = await apiSavePin(`${iv}.${wrapped}`, salt);
      if (!saved.ok) {
        setBusy(false);
        setError(t(errKey(saved.error)));
        return;
      }
      // keep the raw key on THIS device only — it stays unlocked until "Lock app"
      setDeviceDek(await exportDek(dek));
      setBusy(false);
      void pushVaultNow(); // upload whatever this device already has
      onUnlocked();
    } catch {
      setBusy(false);
      setError(t('lock.errNetwork'));
    }
  };

  /** Returning login: PIN → unwrap the DEK → open the encrypted data */
  const unlockData = async () => {
    setError(null);
    if (!/^\d{4,8}$/.test(pin)) {
      setError(t('lock.errPin'));
      return;
    }
    setBusy(true);
    try {
      const pull = await apiPullVault();
      if (pull.kind === 'auth') {
        // session died — start the login over
        lockApp();
        setBusy(false);
        setStep('phone');
        setError(t('lock.errOtp'));
        return;
      }
      if (pull.kind === 'offline') {
        setBusy(false);
        setError(t('lock.errNetwork'));
        return;
      }
      if (pull.kind === 'empty' || !pull.dekWrapped || !pull.dekSalt) {
        setBusy(false);
        setError(t('lock.errWrongPin'));
        return;
      }
      const dot = pull.dekWrapped.indexOf('.');
      if (dot <= 0) {
        setBusy(false);
        setError(t('lock.errNetwork'));
        return;
      }
      const kek = await deriveKek(phone, pin, pull.dekSalt);
      const dek = await unwrapDek(
        pull.dekWrapped.slice(dot + 1),
        pull.dekWrapped.slice(0, dot),
        kek
      ).catch(() => null);
      if (!dek) {
        setBusy(false);
        setError(t('lock.errWrongPin'));
        return;
      }
      setDeviceDek(await exportDek(dek));
      const opened = await mergeVaultBlob(pull.ciphertext, pull.dataIv, dek);
      setBusy(false);
      if (!opened) {
        setError(t('lock.errWrongPin'));
        return;
      }
      onUnlocked();
    } catch {
      setBusy(false);
      setError(t('lock.errNetwork'));
    }
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
          {step === 'phone' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="lock-phone" className="text-xs text-muted-foreground">
                  {t('lock.phoneLabel')}
                </Label>
                <Input
                  id="lock-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('lock.phonePlaceholder')}
                  className="h-11 text-base tracking-wide"
                  aria-label="Login mobile number"
                  onKeyDown={(e) => e.key === 'Enter' && !busy && sendOtp()}
                />
              </div>
              <Button
                onClick={sendOtp}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Send OTP"
              >
                <Smartphone className="size-4" />
                {busy ? t('lock.sending') : t('lock.sendOtp')}
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                {t('lock.needInternet')}
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-xs text-muted-foreground">
                {t('lock.otpSentTo').replace('{phone}', phone)}
              </p>
              {demoOtp && (
                <div
                  data-demo-otp={demoOtp}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900"
                >
                  {t('lock.demoOtp').replace('{otp}', demoOtp)}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="lock-otp" className="text-xs text-muted-foreground">
                  {t('lock.otpLabel')}
                </Label>
                <Input
                  id="lock-otp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="OTP code"
                  onKeyDown={(e) => e.key === 'Enter' && !busy && verifyOtp()}
                />
              </div>
              <Button
                onClick={verifyOtp}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Verify OTP"
              >
                <ShieldCheck className="size-4" />
                {busy ? t('lock.verifying') : t('lock.verify')}
              </Button>
              <button
                onClick={sendOtp}
                disabled={resendIn > 0 || busy}
                className="w-full text-center text-xs font-semibold text-blue-700 underline-offset-2 disabled:text-muted-foreground disabled:no-underline"
                aria-label="Resend OTP"
              >
                {resendIn > 0 ? t('lock.resendIn').replace('{s}', String(resendIn)) : t('lock.resend')}
              </button>
            </>
          )}

          {step === 'pin-setup' && (
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
                <Label htmlFor="lock-pin" className="text-xs text-muted-foreground">
                  {t('lock.pinLabel')}
                </Label>
                <Input
                  id="lock-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="New security PIN"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lock-pin2" className="text-xs text-muted-foreground">
                  {t('lock.pinConfirm')}
                </Label>
                <Input
                  id="lock-pin2"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={8}
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="Confirm security PIN"
                  onKeyDown={(e) => e.key === 'Enter' && !busy && setupPin()}
                />
              </div>
              <Button
                onClick={setupPin}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Save PIN"
              >
                <KeyRound className="size-4" />
                {busy ? t('lock.verifying') : t('lock.unlockBtn')}
              </Button>
            </>
          )}

          {step === 'pin-unlock' && (
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
                <Label htmlFor="lock-unlockpin" className="text-xs text-muted-foreground">
                  {t('lock.pinLabel')}
                </Label>
                <Input
                  id="lock-unlockpin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="h-11 text-center text-lg font-bold tracking-[0.4em]"
                  aria-label="Security PIN"
                  onKeyDown={(e) => e.key === 'Enter' && !busy && unlockData()}
                />
              </div>
              <Button
                onClick={unlockData}
                disabled={busy}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Unlock data"
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
