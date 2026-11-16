'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Ban, Camera, CameraOff, Loader2, ScanLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiVerifyLookup, type VerifyLookupResult } from '@/lib/cloud';
import { normalizeVerifyCode } from '@/lib/verify-id';
import { fmt } from '@/lib/billing';
import { fill } from '@/lib/i18n';
import { useT } from '@/hooks/use-app-lang';

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

type DetectCtor = new (opts: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
};

export default function VerifyView({ autoFocus = true }: { autoFocus?: boolean }) {
  const t = useT();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyLookupResult | null>(null);
  const [searched, setSearched] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraMsg, setCameraMsg] = useState<string | null>(null);
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

  /** Camera scanning — Code 128 through BarcodeDetector where available */
  const startCamera = useCallback(async () => {
    setCameraMsg(null);
    const Ctor = (window as unknown as { BarcodeDetector?: DetectCtor }).BarcodeDetector;
    if (!Ctor) {
      setCameraMsg(t('verify.noCameraSupport'));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMsg(t('verify.noCameraSupport'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOn(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      const detector = new Ctor({ formats: ['code_128'] });
      let live = true;
      stopRef.current = () => {
        live = false;
      };
      const loop = async () => {
        while (live) {
          try {
            if (video.readyState >= 2) {
              const hits = await detector.detect(video);
              const raw = hits.find((h) => h.rawValue)?.rawValue;
              if (raw) {
                stopCamera();
                setCode(normalizeVerifyCode(raw) || raw);
                void lookup(raw);
                return;
              }
            }
          } catch {
            /* frame not ready — keep sweeping */
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      };
      void loop();
    } catch {
      setCameraMsg(t('verify.cameraDenied'));
    }
  }, [t, lookup, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

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
          {cameraMsg && <span className="text-[11px] font-semibold text-muted-foreground">{cameraMsg}</span>}
        </div>
        {cameraOn && (
          <div className="mt-3 overflow-hidden rounded-xl border">
            <video ref={videoRef} playsInline muted className="max-h-64 w-full bg-black object-cover" />
            <p className="bg-muted px-3 py-1.5 text-center text-[10px] text-muted-foreground">{t('verify.cameraHint')}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* ---- result ---- */}
      {result && searched && <VerifyResult result={result} code={searched} />}
    </div>
  );
}

/** The verification verdict card — genuine / cancelled / invalid */
function VerifyResult({ result, code }: { result: VerifyLookupResult; code: string }) {
  const t = useT();
  const bill = result.bill;

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
        <BillDetails bill={bill} history={result.history} tone="cancelled" />
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

  return (
    <div data-verify-result="valid" className="rounded-2xl border-2 border-green-300 bg-white shadow-sm">
      <div className="flex items-center justify-center gap-2 rounded-t-2xl bg-green-600 py-3 text-white">
        <BadgeCheck className="size-5" />
        <p className="text-base font-extrabold">{t('verify.validTitle')}</p>
      </div>
      <BillDetails bill={bill} history={result.history} tone="valid" />
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
}: {
  bill: NonNullable<VerifyLookupResult['bill']>;
  history?: VerifyLookupResult['history'];
  tone: 'valid' | 'cancelled';
}) {
  const t = useT();
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
