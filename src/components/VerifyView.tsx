'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Ban, Camera, CameraOff, Loader2, ScanLine, Search, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiVerifyLookup, type VerifyLookupResult } from '@/lib/cloud';
import { normalizeVerifyCode } from '@/lib/verify-id';
import { fmt } from '@/lib/billing';
import { fill, appT, type AppLangKey } from '@/lib/i18n';
import { useT } from '@/hooks/use-app-lang';
import type { AppLanguage } from '@/lib/types';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

type DetectCtor = new (opts: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
};

/** ZXing hints — Code 128 ONLY (no false QR reads), harder try per frame */
const hints = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]],
  [DecodeHintType.TRY_HARDER, true],
]);

/**
 * The barcode scanner and bill verification UI — shared by the in-app
 * "Verify" tab and the PUBLIC /verify page.
 *
 * Three ways in (all Code 128, no QR anywhere):
 *   1. USB / Bluetooth barcode scanners — they "type" the code and press
 *      Enter; the auto-focused scan box receives it as keystrokes
 *   2. the phone camera — Code 128 via the BarcodeDetector API where the
 *      browser supports it (graceful manual fallback elsewhere)
 *   3. manual entry — typing the verification number
 *
 * The barcode itself is NEVER trusted: every scan sends the value to the
 * server, and the bill details come back from the database registry.
 */


export default function VerifyView({
  autoFocus = true,
  lang,
}: {
  autoFocus?: boolean;
  /** PUBLIC page override — a customer's phone has no vault/store language */
  lang?: AppLanguage;
}) {
  const storeT = useT();
  const t = (k: AppLangKey) => (lang ? appT(lang, k) : storeT(k));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyLookupResult | null>(null);
  const [searched, setSearched] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraMsg, setCameraMsg] = useState<string | null>(null);
  /** permission refused — show the "enable in Settings" help */
  const [cameraDenied, setCameraDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /** one lookup — the ONLY source of truth is the server's registry */
  const lookup = useCallback(
    async (raw: string) => {
      const normalized = normalizeVerifyCode(raw);
      if (!normalized) {
        setError(t('verify.badFormat'));
        return;
      }
      setError(null);
      setBusy(true);
      setSearched(normalized);
      setResult(null);
      try {
        const res = await apiVerifyLookup(normalized);
        setResult(res);
      } catch {
        setError(t('verify.network'));
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  const stopCamera = useCallback(() => {
    stopRef.current?.();
    stopRef.current = () => undefined;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  /** Camera scanning — Code 128, REAL decoding on every browser:
   *  the native BarcodeDetector API where the browser has it (Chrome /
   *  Android), the ZXing wasm-free decoder everywhere else (Safari, iOS,
   *  Firefox, older WebViews). The camera STOPS the moment a code reads. */
  const startCamera = useCallback(async () => {
    setCameraMsg(null);
    setCameraDenied(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMsg(t('verify.noCameraSupport'));
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err) {
      const name = (err as DOMException)?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        // permission refused — tell the user HOW to fix it, keep manual entry
        setCameraDenied(true);
        setCameraMsg(t('verify.cameraDenied'));
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraMsg(t('verify.cameraNotFound'));
      } else {
        setCameraMsg(t('verify.cameraDenied'));
      }
      return;
    }
    streamRef.current = stream;
    setCameraOn(true);
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => undefined);

    let live = true;
    stopRef.current = () => {
      live = false;
    };
    const onCode = (raw: string) => {
      if (!live) return;
      live = false;
      stopCamera(); // camera OFF the instant a barcode reads — no wasted battery
      setCode(normalizeVerifyCode(raw) || raw);
      void lookup(raw);
    };

    // fast path: the browser's own detector
    const Ctor = (window as unknown as { BarcodeDetector?: DetectCtor }).BarcodeDetector;
    if (Ctor) {
      const detector = new Ctor({ formats: ['code_128'] });
      const loop = async () => {
        while (live) {
          try {
            if (video.readyState >= 2) {
              const hits = await detector.detect(video);
              const raw = hits.find((h) => h.rawValue)?.rawValue;
              if (raw) {
                onCode(raw);
                return;
              }
            }
          } catch {
            /* frame not ready — keep sweeping */
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      };
      void loop();
      return;
    }

    // fallback path: ZXing decodes Code 128 from the live stream
    const reader = new BrowserMultiFormatReader(hints as Map<DecodeHintType, unknown>, 200);
    reader
      .decodeFromStream(stream, video, (result) => {
        if (result && live) onCode(result.getText());
      })
      .catch(() => {
        if (live) setCameraMsg(t('verify.noCameraSupport'));
      });
    stopRef.current = () => {
      live = false;
      try {
        reader.reset();
      } catch {
        /* already released */
      }
    };
  }, [t, lookup, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // PUBLIC page (autoFocus=false): USB / BT keyboard-wedge scanners "type" the
  // code + press Enter with NOTHING focused — capture their keystrokes
  // page-wide so a scan works without tapping the box first, while the
  // on-screen keyboard stays hidden for customers who type manually.
  // The buffer + latest lookup live in refs: a keystroke re-render must never
  // reset the half-typed code (the handler below is bound exactly once).
  const wedgeBuf = useRef('');
  const lookupRef = useRef(lookup);
  lookupRef.current = lookup;
  useEffect(() => {
    if (autoFocus) return;
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (typing(e.target)) return; // manual typing flows through the input itself
      if (e.key === 'Enter') {
        // the wedge OWNS Enter — without this, the press also re-activates a
        // still-focused button (e.g. Retry) and fires a second racing lookup
        e.preventDefault();
        const raw = wedgeBuf.current;
        wedgeBuf.current = '';
        if (raw) {
          setCode('');
          void lookupRef.current(raw);
        }
        return;
      }
      if (e.key === 'Backspace') {
        wedgeBuf.current = wedgeBuf.current.slice(0, -1);
        setCode(wedgeBuf.current);
        return;
      }
      if (e.key.length === 1) {
        wedgeBuf.current += e.key;
        setCode(wedgeBuf.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [autoFocus]);

  return (
    <div className="space-y-4">
      {/* ---- scan / type box ---- */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-bold text-blue-900">
          <ScanLine className="size-4" />
          {t('verify.scanTitle')}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('verify.scanDesc')}</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(code);
            // clear for the NEXT scan — USB/BT scanners just keep "typing",
            // a used code must never append to the previous one
            setCode('');
            inputRef.current?.focus();
          }}
        >
          <Input
            ref={inputRef}
            data-verify-input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            // autoFocus pulls the keyboard on phones — owners type, scanners type too
            autoFocus={autoFocus}
            placeholder="SLP-XXXXXXXX-XXXX"
            aria-label="Barcode value"
            className="h-11 font-mono text-sm uppercase tracking-wider"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={busy} className="h-11 shrink-0 bg-blue-600 text-white hover:bg-blue-700" aria-label="Verify barcode">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {t('verify.btn')}
          </Button>
        </form>

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => (cameraOn ? stopCamera() : void startCamera())}
            aria-label={cameraOn ? 'Stop camera' : 'Scan with camera'}
          >
            {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
            {cameraOn ? t('verify.cameraStop') : t('verify.cameraStart')}
          </Button>
          {cameraMsg && <span data-camera-msg className="text-[11px] font-semibold text-muted-foreground">{cameraMsg}</span>}
        </div>
        {/* ALWAYS MOUNTED (hidden when off): startCamera attaches the stream
            to videoRef right after setCameraOn(true) — if the <video> only
            mounted WITH cameraOn, videoRef.current was still null at that
            moment and the stream never attached (the "camera never opens"
            bug). A hidden element costs nothing; a null ref costs scanning. */}
        <div className={cameraOn ? 'mt-3 overflow-hidden rounded-xl border' : 'hidden'} aria-hidden={!cameraOn}>
          <video ref={videoRef} playsInline muted className="max-h-64 w-full bg-black object-cover" />
          <p className="bg-muted px-3 py-1.5 text-center text-[10px] text-muted-foreground">{t('verify.cameraHint')}</p>
        </div>
        {cameraDenied && (
          <div data-camera-denied className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
            <p className="flex items-center gap-1.5">
              <TriangleAlert className="size-3.5 shrink-0" />
              {t('verify.cameraDeniedHelp')}
            </p>
            <p className="mt-1">{t('verify.cameraDeniedSteps')}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* ---- result ---- */}
      {result && searched && (
        <VerifyResult result={result} code={searched} lang={lang} onRetry={() => void lookup(searched)} />
      )}
    </div>
  );
}

/** The verification verdict card — genuine / cancelled / invalid */
function VerifyResult({
  result,
  code,
  lang,
  onRetry,
}: {
  result: VerifyLookupResult;
  code: string;
  lang?: AppLanguage;
  onRetry: () => void;
}) {
  const storeT = useT();
  const t = (k: AppLangKey) => (lang ? appT(lang, k) : storeT(k));
  const bill = result.bill;

  // bill-less verdicts FIRST — a result without a bill is NOT automatically
  // invalid: rate-limited and offline answers must never render INVALID BILL
  // (a genuine bill must not be declared fake just because the network or
  // the rate limiter got in the way)
  if (result.status === 'offline') {
    return (
      <div
        data-verify-result="offline"
        className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center shadow-sm"
      >
        <p className="text-base font-extrabold text-amber-800">{t('verify.network')}</p>
        <p className="mt-1 font-mono text-[11px] text-amber-700">{code}</p>
        <Button
          type="button"
          onClick={onRetry}
          className="mt-3 h-10 bg-amber-600 text-white hover:bg-amber-700"
          aria-label="Retry verification"
        >
          {t('verify.retry')}
        </Button>
      </div>
    );
  }

  if (result.status === 'rate_limited') {
    return (
      <div className="rounded-2xl border bg-card p-5 text-center text-sm font-semibold text-muted-foreground shadow-sm">
        {t('verify.rateLimited')}
      </div>
    );
  }

  if (result.status === 'not_found' || !bill) {
    return (
      <div data-verify-result="invalid" className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-center shadow-sm">
        <p className="text-lg font-extrabold text-red-700">{t('verify.invalidTitle')}</p>
        <p className="mt-1 text-xs font-semibold text-red-600">{t('verify.invalidDesc')}</p>
        <p className="mt-2 font-mono text-[11px] text-red-500">{code}</p>
      </div>
    );
  }

  if (result.status === 'cancelled') {
    return (
      <div data-verify-result="cancelled" className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-sm">
        <p className="flex items-center justify-center gap-2 text-center text-lg font-extrabold text-red-700">
          <Ban className="size-5" />
          {t('verify.cancelledTitle')}
        </p>
        <p className="mt-1 text-center text-xs font-semibold text-red-600">{t('verify.cancelledDesc')}</p>
        <BillDetails bill={bill} history={result.history} tone="cancelled" lang={lang} />
      </div>
    );
  }

  return (
    <div data-verify-result="valid" className="rounded-2xl border-2 border-green-300 bg-white shadow-sm">
      <div className="flex items-center justify-center gap-2 rounded-t-2xl bg-green-600 py-3 text-white">
        <BadgeCheck className="size-5" />
        <p className="text-base font-extrabold">{t('verify.validTitle')}</p>
      </div>
      <BillDetails bill={bill} history={result.history} tone="valid" lang={lang} />
    </div>
  );
}

/** The original bill details — everything comes from the database, never the barcode */
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <span className={`text-right text-xs font-bold text-neutral-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function BillDetails({
  bill,
  history,
  tone,
  lang,
}: {
  bill: NonNullable<VerifyLookupResult['bill']>;
  history?: VerifyLookupResult['history'];
  tone: 'valid' | 'cancelled';
  lang?: AppLanguage;
}) {
  const storeT = useT();
  const t = (k: AppLangKey) => (lang ? appT(lang, k) : storeT(k));
  const d = new Date(bill.billDateISO);

  return (
    <div className="p-4">
      <div className="text-center">
        <p className="text-sm font-extrabold text-neutral-900">{bill.companyName}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {t('verify.billNo')}: {bill.billNo}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ·{' '}
          {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {tone === 'cancelled' && (
          <p className="mt-2 rounded-lg bg-red-100 px-3 py-1.5 text-[11px] font-extrabold text-red-700">
            {t('verify.cancelledTitle')}
          </p>
        )}
      </div>

      <div className="mt-3 rounded-xl border bg-slate-50 p-3">
        <DetailRow label={t('verify.customer')} value={bill.customerName || t('verify.walkin')} />
        <DetailRow label={t('verify.billedBy')} value={bill.createdBy} />
        <DetailRow label={t('verify.payment')} value={`${bill.paymentMode} · ${bill.paymentStatus}`} />
        <DetailRow label={t('verify.total')} value={`₹${fmt(bill.total)}`} />
        <DetailRow label={t('verify.paid')} value={`₹${fmt(bill.paid)}`} />
        {bill.balance > 0 ? <DetailRow label={t('verify.balance')} value={`₹${fmt(bill.balance)}`} />
          : null}
        {(bill.discount || 0) > 0 ? <DetailRow label={t('verify.discount')} value={`- ₹${fmt(bill.discount)}`} /> : null}
        {(bill.labourCharge || 0) > 0 ? <DetailRow label={t('verify.labour')} value={`₹${fmt(bill.labourCharge)}`} /> : null}
        <DetailRow
          label={t('verify.gst')}
          value={bill.gstAmount > 0 ? `${bill.gstPercent}% · ₹${fmt(bill.gstAmount)}` : t('verify.gstNone')}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5">{t('verify.item')}</th>
              <th className="px-2 py-1.5">{t('verify.size')}</th>
              <th className="px-2 py-1.5 text-right">{t('verify.qty')}</th>
              <th className="px-2 py-1.5 text-right">{t('verify.rate')}</th>
              <th className="px-2 py-1.5 text-right">{t('verify.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1.5 font-semibold text-neutral-800">{it.name}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{it.size}</td>
                <td className="px-2 py-1.5 text-right">{it.qty}</td>
                <td className="px-2 py-1.5 text-right text-muted-foreground">₹{fmt(it.price)}</td>
                <td className="px-2 py-1.5 text-right font-bold">₹{fmt(it.price * it.qty - (it.discount || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history && (
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          {fill(t('verify.historyCount'), { n: String(history.count) })}
        </p>
      )}

      {/* the honest security note — a genuine scan proves the DB record, not the paper */}
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed font-semibold text-amber-800">
        {t('verify.dbNote')}
      </p>
    </div>
  );
}
