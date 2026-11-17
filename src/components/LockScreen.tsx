'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Eye, EyeOff, KeyRound, Lock, RefreshCw, ScanFace, ScanLine, ShieldCheck, UserRound, UserCog } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import {
  apiAuthState,
  apiMpinSetup,
  apiMpinUnlock,
  apiOwnerLogin,
  apiOwnerPassword,
  apiStaffLogin,
  apiStaffForgot,
  getAuth,
  getDeviceDek,
  getRecoverMaterial,
  setAuth,
  setDeviceDek,
  setRecoverMaterial,
  lockApp,
} from '@/lib/cloud';
import { FaceCameraError, getFaceProfile, matchFace, openFaceCamera } from '@/lib/face';
import { fileToSmallDataUrl } from '@/lib/photo';
import { hasFreshUnlockSession } from '@/lib/idle-lock';
import {
  deriveKek,
  exportDek,
  generateDek,
  importDek,
  randomB64,
  unwrapDek,
  wrapDek,
} from '@/lib/crypto';
/** Documented initial Admin credentials — seeded silently on first unlock */
const OWNER_DEFAULT_USERNAME = 'Pradeep';
const OWNER_DEFAULT_PASSWORD = '2125';

type Step = 'checking' | 'setup' | 'unlock' | 'reclaim' | 'owner' | 'staff' | 'staff-forgot';

/** Forgot-password sub-steps: photo (identity proof) → staff ID → new password */
type ForgotStep = 'photo' | 'uid' | 'newpass' | 'done';

/**
 * MPIN entry with the digits HIDDEN (the owner asked for that) — the field is
 * still a plain text input (no password-manager hijacking, number pad opens),
 * the discs come from CSS text-security. The eye shows what was typed.
 */
function PinInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  autoFocus,
  ariaLabel,
  toggleAriaLabel,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
  ariaLabel: string;
  toggleAriaLabel: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="h-11 pl-11 pr-11 text-center text-lg font-bold tracking-[0.4em]"
        style={show ? undefined : ({ WebkitTextSecurity: 'disc' } as CSSProperties)}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleAriaLabel}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-blue-700"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

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
 * Full-screen gate in front of the app (variant="gate") or a small card used
 * inside dialogs (variant="sheet").
 *
 * The MPIN is created ONCE and only ever ASKED after that — never created
 * again. It is asked when the app OPENS: a refresh of a page keeps the app
 * open (tab-scoped unlock session + 5-minute idle lock live in page.tsx),
 * closing the app asks the MPIN again.
 *
 * mode="auto"    — gate on app open. The device keeps its own copy of the
 *                  credentials (salt + verifier + wrapped key), so the MPIN is
 *                  verified right on the phone (works offline, instantly) and
 *                  the "Create MPIN" screen can never reappear. Without a local
 *                  copy (new browser / cleared storage) the server decides.
 * mode="reclaim" — the device ALREADY holds its data key; the server lost the
 *                  account (restart / reset), so one MPIN entry re-connects the
 *                  encrypted sync WITHOUT creating anything new.
 *
 * "Forgot MPIN?" — the owner forgot the MPIN. The device re-wraps its own
 *                  data key under a NEW MPIN and replaces the server's
 *                  credential chain (/api/auth/reset). All data survives.
 */
export default function LockScreen({
  onUnlocked,
  mode = 'auto',
  variant = 'gate',
}: {
  onUnlocked: () => void;
  mode?: 'auto' | 'reclaim';
  variant?: 'gate' | 'sheet';
}) {
  const t = useT();
  const companyName =
    useStore((s) => s.settings.companyName) || 'Sri Lakshmi Cement Works';
  const logoSrc = useStore((s) => s.appearance.watermark) || '/narasimha-logo.jpg';

  const [step, setStep] = useState<Step>('checking');
  const [salt, setSalt] = useState<string | null>(null);
  /** legacy account (verifier broken by the old zero-proof bug) — its wrapped key
   *  lets the device verify the MPIN locally and then repair the server account */
  const [legacy, setLegacy] = useState<{ salt: string; wrapped: string } | null>(null);
  const [mpin, setMpin] = useState('');
  const [mpin2, setMpin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** digits are hidden while typing (owner's request); the eye reveals them */
  const [showPin, setShowPin] = useState(false);
  /** OWNER (Admin) sign-in — username + password (Pradeep / 2125 until changed) */
  const [ownerPasswordReady, setOwnerPasswordReady] = useState(false);
  const [ownerUser, setOwnerUser] = useState('');
  const [ownerPass, setOwnerPass] = useState('');

  /** STAFF sign-in (v39) — Staff ID + password or MPIN, then forgot flow */
  const [staffUser, setStaffUser] = useState('');
  const [staffSecret, setStaffSecret] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('photo');
  const [forgotPhoto, setForgotPhoto] = useState('');
  const [forgotUid, setForgotUid] = useState('');
  const [forgotPass, setForgotPass] = useState('');
  const forgotFileRef = useRef<HTMLInputElement>(null);

  /** Instant double-submit guard — state alone is too slow for fast double-taps */
  const busyRef = useRef(false);
  const probingRef = useRef(false);
  const restoredRef = useRef(false);

  const setBusyBoth = (v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  };

  /**
   * Ask the server whether it already has an MPIN. Runs through a ref so
   * re-renders (typing!) can never re-trigger it, and it NEVER wipes what
   * the user already typed.
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
    setOwnerPasswordReady(Boolean(res.hasOwnerPassword));
    setSalt(res.dekSalt ?? null);
    setLegacy(
      res.legacy && res.dekSalt && res.dekWrapped
        ? { salt: res.dekSalt, wrapped: res.dekWrapped }
        : null
    );
    if (mode === 'reclaim') {
      // device already holds the data key — the MPIN only re-connects sync
      setStep(res.hasMpin ? 'unlock' : 'reclaim');
    } else {
      setStep(res.hasMpin ? 'unlock' : 'setup');
    }
  }, [t, mode]);
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
    // The device keeps its OWN copy of the MPIN credentials (salt + verifier +
    // wrapped key). With it the MPIN is verified right here on the phone —
    // offline, instantly — and "Create your MPIN" can NEVER come back.
    const mat = getRecoverMaterial();
    if (mat) {
      setSalt(mat.salt);
      setStep('unlock');
      // the gate still needs the SERVER state for its links (owner password
      // seeded? staff accounts exist?) — quiet background fetch, the MPIN
      // entry itself stays offline and instant
      void apiAuthState()
        .then((res) => {
          if (res.ok) setOwnerPasswordReady(Boolean(res.hasOwnerPassword));
        })
        .catch(() => undefined);
      return;
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
        // keep the device's existing data key when it has one (upgrade path), else mint one
        const dekB64 = getDeviceDek();
        const existing = dekB64 ? await importDek(dekB64).catch(() => null) : null;
        const dek = existing ?? (await generateDek());
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
        // keep the raw key on THIS device only
        setDeviceDek(await exportDek(dek));
        // remember the credentials here too — the MPIN was created ONCE; from
        // now on every app open asks THIS MPIN to log in, never to create again
        setRecoverMaterial({ salt: newSalt, verifier: proof, wrapped: `${iv}.${wrapped}` });
        clearDraft();
        setBusyBoth(false);
        finishOwner();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /**
   * Re-connect flow: the device ALREADY holds the data key. The server lost
   * its account (restart/reset) — re-register THE SAME key under the MPIN.
   * Nothing is created and no data moves; sync simply continues.
   */
  const reclaimSync = async () => {
    if (busyRef.current) return;
    setError(null);
    if (!/^\d{4,8}$/.test(mpin)) {
      setError(t('lock.errPin'));
      return;
    }
    const dekB64 = getDeviceDek();
    if (!dekB64) {
      // no local key (paranoia) — fall back to the normal unlock probe
      await probe();
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const newSalt = randomB64(16);
        const dek = await importDek(dekB64);
        const { kek, proof } = await deriveKek(mpin, newSalt);
        const { wrapped, iv } = await wrapDek(dek, kek);
        const saved = await apiMpinSetup(`${iv}.${wrapped}`, newSalt, proof);
        if (!saved.ok) {
          setBusyBoth(false);
          if (saved.error === 'exists') {
            // the server got an MPIN meanwhile — just log in with the typed one
            await probe();
            setError(t(errKey('exists')));
            return;
          }
          setError(t(errKey(saved.error)));
          return;
        }
        setAuth(saved.token ?? '');
        setRecoverMaterial({ salt: newSalt, verifier: proof, wrapped: `${iv}.${wrapped}` });
        clearDraft();
        setBusyBoth(false);
        finishOwner();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /**
   * "Forgot MPIN" — the owner forgot the MPIN. The device re-wraps the data
   * key it holds under a NEW MPIN and replaces the server credential chain;
   * all data (here and in the cloud) survives. When this device has no key
   * (fresh browser), a fresh key is minted after a clear warning — the old
   * encrypted backup cannot be opened without the old MPIN.
   */
  /** "Forgot MPIN" — recovery now goes through the Admin username +
   *  password gate (the MPIN itself cannot be reset without the server). */
  const startForgot = () => {
    setError(null);
    setMpin('');
    setMpin2('');
    if (ownerPasswordReady) {
      setOwnerPass('');
      setStep('owner');
    } else {
      setError(t('lock.forgotNoOwnerPwd'));
    }
  };

  /** Every later login: the MPIN opens the app — verified locally first
   *  (instant wrong-PIN feedback), then the server issues the session. */
  const unlockData = async () => {
    if (busyRef.current) return; // one submit at a time — double-taps are ignored
    setError(null);
    if (!/^\d{4,8}$/.test(mpin)) {
      setError(t('lock.errPin'));
      return;
    }
    /* ---- instant local check when this device holds its credentials ---- */
    const mat = getRecoverMaterial();
    if (mat?.salt && mat?.verifier) {
      const local = await deriveKek(mpin, mat.salt).catch(() => null);
      if (local && local.proof !== mat.verifier) {
        setError(t('lock.errWrongPin'));
        return;
      }
    }
    /* ---- the server issues the session (online-only app) ---- */
    if (!salt) {
      // no salt from the probe — re-probe (server may have restarted / state changed)
      await probe();
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const { proof } = await deriveKek(mpin, salt);
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
        // remember the credentials here — the MPIN was created ONCE
        setRecoverMaterial({ salt, verifier: proof, wrapped: '' });
        clearDraft();
        setBusyBoth(false);
        finishOwner();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /**
   * OWNER PASSWORD SEEDING (silent, once). The documented initial Admin
   * credentials (Pradeep / 2125) are registered the first time the owner
   * unlocks with the MPIN after this update: the DEK is re-wrapped under a
   * key derived from that password HERE on the owner's device and the server
   * stores only the scrypt hash + wrapped key. The owner is nudged to change
   * the password (Settings → Security). Failing silently is fine — the next
   * MPIN unlock retries.
   */
  const ensureOwnerPassword = async () => {
    try {
      const st = await apiAuthState();
      if (!st.ok || st.hasOwnerPassword) return;
      const dekB64 = getDeviceDek();
      if (!dekB64) return;
      const dek = await importDek(dekB64).catch(() => null);
      if (!dek) return;
      const salt = randomB64(16);
      const { kek } = await deriveKek(OWNER_DEFAULT_PASSWORD, salt);
      const { wrapped, iv } = await wrapDek(dek, kek);
      await apiOwnerPassword({
        username: OWNER_DEFAULT_USERNAME,
        password: OWNER_DEFAULT_PASSWORD,
        isDefault: true,
        dekSalt: salt,
        dekIv: iv,
        dekWrapped: wrapped,
      });
    } catch {
      /* retried on the next owner unlock */
    }
  };

  /** OWNER (Admin) sign-in — username + password. The session token alone
   *  opens the app; all data comes from the central database. */
  const ownerSignIn = async () => {
    if (busyRef.current) return;
    setError(null);
    const username = ownerUser.trim();
    if (!username || !ownerPass) {
      setError(t('ownerLogin.errWrong'));
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const res = await apiOwnerLogin(username, ownerPass);
        if (!res.ok || !res.token) {
          setBusyBoth(false);
          setError(
            res.error === 'noOwnerPassword'
              ? t('ownerLogin.errNotSeeded')
              : res.error === 'rateLimited'
                ? t('lock.errTooMany')
                : t('ownerLogin.errWrong')
          );
          return;
        }
        setAuth(res.token);
        setBusyBoth(false);
        setOwnerPass('');
        finishOwner();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /** STAFF sign-in — the server issues a staff session; the app opens in
   *  staff mode (Bill + History + Profile only, filtered central data). */
  const staffSignIn = async () => {
    if (busyRef.current) return;
    setError(null);
    const uid = staffUser.trim();
    if (!uid || !staffSecret) {
      setError(t('staff.errWrong'));
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const res = await apiStaffLogin(uid, staffSecret);
        if (!res.ok || !res.token || !res.staff) {
          setBusyBoth(false);
          setError(
            res.error === 'rateLimited'
              ? t('lock.errTooMany')
              : res.error === 'notFound'
                ? t('staff.errNotFound')
                : res.error === 'network'
                  ? t('staff.errNetwork')
                  : t('staff.errWrong')
          );
          return;
        }
        setAuth(res.token, 'staff');
        useStore.setState({ staff: res.staff });
        setStaffSecret('');
        setBusyBoth(false);
        onUnlocked();
      } catch {
        setBusyBoth(false);
        setError(t('lock.errNetwork'));
      }
    });
  };

  /** forgot flow step 1: the identity photo is captured from the camera roll */
  const pickForgotPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const url = await fileToSmallDataUrl(file);
      setForgotPhoto(url);
      setForgotStep('uid');
    } catch {
      setError(t('staff.errNetwork'));
    }
  };

  /** forgot flow final: userId + photo + new password → audited reset */
  const submitForgot = async () => {
    if (busyRef.current) return;
    setError(null);
    const uid = forgotUid.trim();
    if (!uid || forgotPass.length < 3 || !forgotPhoto) {
      setError(t('staff.errNotFound'));
      return;
    }
    await withWatchdog(async () => {
      setBusyBoth(true);
      try {
        const res = await apiStaffForgot({ userId: uid, photo: forgotPhoto, newPassword: forgotPass });
        setBusyBoth(false);
        if (!res.ok) {
          setError(
            res.error === 'notFound'
              ? t('staff.errNotFound')
              : res.error === 'rateLimited'
                ? t('lock.errTooMany')
                : res.error === 'network'
                  ? t('staff.errNetwork')
                  : t('staff.errNotFound')
          );
          return;
        }
        setForgotStep('done');
        setForgotPass('');
      } catch {
        setBusyBoth(false);
        setError(t('staff.errNetwork'));
      }
    });
  };

  const openStaffForgot = () => {
    setError(null);
    setForgotPhoto('');
    setForgotUid(staffUser.trim());
    setForgotPass('');
    setForgotStep('photo');
    setStep('staff-forgot');
  };

  const finishOwner = () => {
    void ensureOwnerPassword();
    onUnlocked();
  };

  /* ---------------- FACE UNLOCK (v40) ----------------
     Device-local convenience gate: when the owner enrolled their face in
     Settings, the unlock step auto-opens the camera and matches. A match
     reuses the session token already stored on THIS device — the exact
     same "opened" state a correct MPIN produces. The MPIN stays below it
     (fallback + root of security). */
  const faceVideoRef = useRef<HTMLDivElement | null>(null);
  const faceStopRef = useRef<(() => void) | null>(null);
  const faceBusyRef = useRef(false);
  const [faceEnabled] = useState(() => getFaceProfile()?.enabled === true);
  const [faceState, setFaceState] = useState<'idle' | 'scanning' | 'matched' | 'denied'>('idle');

  const stopFaceCam = useCallback(() => {
    faceStopRef.current?.();
    faceStopRef.current = null;
  }, []);

  const runFaceUnlock = useCallback(async () => {
    if (faceBusyRef.current || busy) return;
    const profile = getFaceProfile();
    if (!profile?.enabled) return;
    faceBusyRef.current = true;
    setError(null);
    setFaceState('scanning');
    try {
      // v41: the video element attaches to the card BEFORE play (detached
      // elements refuse to play in several WebViews) and the FRONT camera is
      // requested explicitly, with a typed error when permission is missing
      const cam = await openFaceCamera(faceVideoRef.current);
      faceStopRef.current = cam.stop;
      const res = await matchFace(cam.video, profile);
      if (!res.ok) {
        setFaceState('denied');
        setError(t('face.errNoMatch'));
        return;
      }
      const auth = getAuth();
      if (!auth?.token) {
        setFaceState('denied');
        setError(t('face.errNoSession'));
        return;
      }
      // an EXPIRED session must not open the app — verify when reachable
      try {
        const st = await apiAuthState();
        if (st && st.ok === false) {
          lockApp();
          setFaceState('denied');
          setError(t('face.errExpired'));
          return;
        }
      } catch {
        /* server unreachable — reuse the stored session (offline unlock) */
      }
      setFaceState('matched');
      finishOwner();
    } catch (e) {
      setFaceState('denied');
      setError(e instanceof FaceCameraError && e.kind === 'denied' ? t('face.errPerm') : t('face.errCamera'));
    } finally {
      faceBusyRef.current = false;
      stopFaceCam();
    }
  }, [busy, t, stopFaceCam]);

  // auto-attempt on every appearance of the MPIN step; camera dies with it.
  // Runs through a ref so busy/language changes never re-open the camera mid-scan.
  const runFaceUnlockRef = useRef(runFaceUnlock);
  runFaceUnlockRef.current = runFaceUnlock;
  useEffect(() => {
    if (step === 'unlock' && faceEnabled) void runFaceUnlockRef.current?.();
    return () => stopFaceCam();
  }, [step, faceEnabled, stopFaceCam]);

  /** Explicit retry is the only thing that wipes the form */
  const retryProbe = () => {
    setMpin('');
    setMpin2('');
    clearDraft();
    void probeRef.current?.();
  };

  const card = (
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
            <PinInput
              id="lock-mpin"
              value={mpin}
              onChange={setMpin}
              show={showPin}
              onToggle={() => setShowPin((v) => !v)}
              autoFocus
              ariaLabel="New MPIN"
              toggleAriaLabel={showPin ? t('lock.hidePin') : t('lock.showPin')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-mpin2" className="text-xs text-muted-foreground">
              {t('lock.pinConfirm')}
            </Label>
            <PinInput
              id="lock-mpin2"
              value={mpin2}
              onChange={setMpin2}
              show={showPin}
              onToggle={() => setShowPin((v) => !v)}
              ariaLabel="Confirm MPIN"
              toggleAriaLabel={showPin ? t('lock.hidePin') : t('lock.showPin')}
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

      {(step === 'unlock' || step === 'reclaim') && (
        <>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
              <KeyRound className="size-4" />
              {step === 'reclaim' ? t('reauth.title') : t('lock.unlockTitle')}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {step === 'reclaim' ? t('reauth.desc') : t('lock.unlockDesc')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-unlockmpin" className="text-xs text-muted-foreground">
              {t('lock.pinLabel')}
            </Label>
            <PinInput
              id="lock-unlockmpin"
              value={mpin}
              onChange={setMpin}
              show={showPin}
              onToggle={() => setShowPin((v) => !v)}
              autoFocus
              ariaLabel="MPIN"
              toggleAriaLabel={showPin ? t('lock.hidePin') : t('lock.showPin')}
            />
          </div>
          <Button
            onClick={step === 'reclaim' ? reclaimSync : unlockData}
            disabled={busy}
            className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
            aria-label={step === 'reclaim' ? 'Re-connect' : 'Open app'}
          >
            <Lock className="size-4" />
            {busy
              ? t('lock.verifying')
              : step === 'reclaim'
                ? t('reauth.btn')
                : t('lock.unlockBtn')}
          </Button>
          {step === 'unlock' && faceEnabled && (
            <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900">
                <ScanFace className="size-4" />
                {t('face.title')}
              </p>
              <div
                ref={faceVideoRef}
                className="mx-auto h-28 w-44 overflow-hidden rounded-lg bg-slate-900"
                aria-label="Face camera"
              />
              <p className="text-center text-[11px] text-muted-foreground">
                {faceState === 'scanning'
                  ? t('face.scanning')
                  : faceState === 'matched'
                    ? t('face.matched')
                    : faceState === 'denied'
                      ? t('face.denied')
                      : t('face.hint')}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void runFaceUnlock()}
                disabled={busy || faceState === 'scanning'}
                className="h-9 w-full"
                aria-label={t('face.tryBtn')}
              >
                <ScanFace className="size-4" />
                {faceState === 'scanning' ? t('face.scanning') : t('face.tryBtn')}
              </Button>
            </div>
          )}
          {step === 'unlock' && (
            <button
              type="button"
              onClick={startForgot}
              disabled={busy}
              aria-label="Forgot MPIN"
              className="mx-auto block text-xs font-semibold text-blue-700 underline-offset-2 hover:underline disabled:opacity-40"
            >
              {t('lock.forgot')}
            </button>
          )}
          {step === 'unlock' && ownerPasswordReady && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setOwnerPass('');
                setStep('owner');
              }}
              disabled={busy}
              aria-label="Owner admin login"
              data-owner-login-link
              className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline disabled:opacity-40"
            >
              <UserCog className="size-3.5" />
              {t('ownerLogin.link')}
            </button>
          )}

        </>
      )}

      {(step === 'setup' || step === 'unlock' || step === 'reclaim') && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStaffSecret('');
            setStep('staff');
          }}
          disabled={busy}
          aria-label="Staff login"
          data-staff-login-link
          className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline disabled:opacity-40"
        >
          <UserRound className="size-3.5" />
          {t('staff.link')}
        </button>
      )}

      {step === 'owner' && (
        <>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
              <UserCog className="size-4" />
              {t('ownerLogin.title')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-owner-user" className="text-xs text-muted-foreground">
              {t('ownerLogin.username')}
            </Label>
            <Input
              id="lock-owner-user"
              type="text"
              autoComplete="username"
              value={ownerUser}
              onChange={(e) => setOwnerUser(e.target.value)}
              aria-label="Owner username"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-owner-pass" className="text-xs text-muted-foreground">
              {t('ownerLogin.password')}
            </Label>
            <Input
              id="lock-owner-pass"
              type="password"
              autoComplete="current-password"
              value={ownerPass}
              onChange={(e) => setOwnerPass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void ownerSignIn();
              }}
              aria-label="Owner password"
              className="h-11"
            />
          </div>
          <Button
            onClick={ownerSignIn}
            disabled={busy}
            className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Owner sign in"
          >
            <Lock className="size-4" />
            {busy ? t('lock.verifying') : t('ownerLogin.btn')}
          </Button>
          <Button
            onClick={() => {
              setError(null);
              void probeRef.current?.();
            }}
            disabled={busy}
            variant="ghost"
            className="h-9 w-full text-xs"
            aria-label="Back to MPIN"
          >
            <ArrowLeft className="size-3.5" />
            {t('lock.back')}
          </Button>
        </>
      )}

      {step === 'staff' && (
        <>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
              <UserRound className="size-4" />
              {t('staffLogin.title')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-staff-user" className="text-xs text-muted-foreground">
              {t('staff.userId')}
            </Label>
            <Input
              id="lock-staff-user"
              type="text"
              autoCapitalize="characters"
              autoComplete="username"
              value={staffUser}
              onChange={(e) => setStaffUser(e.target.value)}
              aria-label="Staff ID"
              className="h-11 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-staff-secret" className="text-xs text-muted-foreground">
              {t('staff.secret')}
            </Label>
            <Input
              id="lock-staff-secret"
              type="password"
              autoComplete="current-password"
              value={staffSecret}
              onChange={(e) => setStaffSecret(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void staffSignIn();
              }}
              aria-label="Staff password or MPIN"
              className="h-11"
            />
          </div>
          <Button
            onClick={staffSignIn}
            disabled={busy}
            className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Staff sign in"
          >
            <Lock className="size-4" />
            {busy ? t('lock.verifying') : t('staff.btn')}
          </Button>
          <button
            type="button"
            onClick={openStaffForgot}
            disabled={busy}
            aria-label="Staff forgot password"
            className="mx-auto block text-xs font-semibold text-blue-700 underline-offset-2 hover:underline disabled:opacity-40"
          >
            {t('staff.forgot')}
          </button>
          <Button
            onClick={() => {
              setError(null);
              setStep(hasFreshUnlockSession() || getRecoverMaterial() ? 'unlock' : 'setup');
            }}
            disabled={busy}
            variant="ghost"
            className="h-9 w-full text-xs"
            aria-label="Back to MPIN"
          >
            <ArrowLeft className="size-3.5" />
            {t('lock.back')}
          </Button>
        </>
      )}

      {step === 'staff-forgot' && (
        <>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900">
              <Camera className="size-4" />
              {t('staff.forgotTitle')}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('staff.forgotDesc')}</p>
          </div>

          {forgotStep !== 'done' && (
            <div className="flex flex-col items-center gap-2">
              {forgotPhoto ? (
                      <img src={forgotPhoto} alt="Identity photo" className="size-24 rounded-full object-cover ring-2 ring-blue-200" />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-blue-50 text-blue-300">
                  <Camera className="size-8" />
                </div>
              )}
              <input
                ref={forgotFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void pickForgotPhoto(e.target.files?.[0])}
                aria-label="Capture identity photo"
              />
              {forgotStep === 'photo' && (
                <Button onClick={() => forgotFileRef.current?.click()} disabled={busy} variant="outline" className="h-10" aria-label="Take photo or choose image">
                  <Camera className="size-4" />
                  {t('staff.photoBtn')}
                </Button>
              )}
            </div>
          )}

          {forgotStep === 'uid' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-uid" className="text-xs text-muted-foreground">
                  {t('staff.uidLabel')}
                </Label>
                <Input
                  id="forgot-uid"
                  type="text"
                  autoCapitalize="characters"
                  value={forgotUid}
                  onChange={(e) => setForgotUid(e.target.value)}
                  aria-label="Your Staff ID"
                  className="h-11 uppercase"
                />
              </div>
              <Button onClick={() => forgotUid.trim() && setForgotStep('newpass')} disabled={busy || !forgotUid.trim()} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700" aria-label="Continue to new password">
                {t('staff.photoNext')}
              </Button>
            </>
          )}

          {forgotStep === 'newpass' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-pass" className="text-xs text-muted-foreground">
                  {t('staff.newPass')}
                </Label>
                <Input
                  id="forgot-pass"
                  type="password"
                  autoComplete="new-password"
                  value={forgotPass}
                  onChange={(e) => setForgotPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitForgot();
                  }}
                  aria-label="New password"
                  className="h-11"
                />
              </div>
              <Button onClick={submitForgot} disabled={busy || forgotPass.length < 3} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700" aria-label="Set new password">
                <KeyRound className="size-4" />
                {busy ? t('lock.saving') : t('staff.resetBtn')}
              </Button>
            </>
          )}

          {forgotStep === 'done' && (
            <p data-forgot-ok className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
              {t('staff.resetOk')}
            </p>
          )}

          <Button
            onClick={() => {
              setError(null);
              setStep('staff');
            }}
            disabled={busy}
            variant="ghost"
            className="h-9 w-full text-xs"
            aria-label="Back to staff login"
          >
            <ArrowLeft className="size-3.5" />
            {t('lock.back')}
          </Button>
        </>
      )}

      {error && (
        <p role="alert" data-lock-error className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );

  if (variant === 'sheet') {
    return <div className="w-full max-w-sm">{card}</div>;
  }

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

        {card}

        <p className="flex items-start justify-center gap-1.5 px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          {t('lock.secureNote')}
        </p>
      </div>
    </div>
  );
}
