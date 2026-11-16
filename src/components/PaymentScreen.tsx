'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Banknote, Copy, Loader2, Share2, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import { apiPaymentsStatus, apiPaymentsWebhook } from '@/lib/cloud';
import { markUnlockActive } from '@/lib/idle-lock';
import { fmt, upiUri } from '@/lib/billing';

/** How often the bill screen asks the server whether the money arrived */
const POLL_MS = 3000;

/**
 * The UPI collection screen — the owner taps "Complete bill" on a UPI bill
 * and this full-screen payment view takes over:
 *
 *   1. the customer pays the shown amount to the shop's UPI ID (typed in
 *      their UPI app, or the shared pay-link opened on their phone —
 *      NO QR anywhere in this app)
 *   2. the payment gateway webhook records the event on the server
 *   3. this screen polls every 3 s, sees the money, and calls onPaid() —
 *      the bill completes ITSELF: slip opens, stock moves, WhatsApp/SMS go
 *      to the customer. Nothing is pressed.
 *   4. money paid without any gateway (straight to the personal UPI ID)?
 *      One tap on "Money received" records the payment and completes the
 *      bill exactly the same way.
 *
 * Fallbacks stay one tap away: cash instead, or cancel back to the bill.
 */
export default function PaymentScreen({
  amount,
  billRef,
  onPaid,
  onCashInstead,
  onCancel,
}: {
  amount: number;
  billRef: string;
  onPaid: (paid: number) => void;
  onCashInstead: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const upiId = useStore((s) => s.settings.upiId);
  const companyName = useStore((s) => s.settings.companyName);

  const [waiting, setWaiting] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  /** guards against a double completion (poll + render race) */
  const paidRef = useRef(false);
  /** latest onPaid without re-arming the poll interval */
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  /** the pay-link the customer opens on THEIR phone — opens any UPI app
   *  with the amount and the bill ref pre-filled (a link, not a QR) */
  const payLink = upiId ? upiUri(upiId, amount, billRef) : '';

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => {
      if (paidRef.current) return;
      // waiting for the money IS using the app — the idle lock must never
      // lock the owner out mid-collection (locking unmounts this screen and
      // the payment would never complete the bill)
      markUnlockActive();
      try {
        const events = await apiPaymentsStatus([billRef]);
        const hit = events.find((e) => e.billRef === billRef);
        if (hit && alive && !paidRef.current) {
          paidRef.current = true;
          setWaiting(false);
          onPaidRef.current(hit.amount);
        }
      } catch {
        /* transient network error — the next tick retries */
      }
    };
    const iv = setInterval(tick, POLL_MS);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    // mobile browsers throttle background timers — catch up the instant the
    // owner looks back at the screen
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    void tick();
    return () => {
      alive = false;
      clearInterval(iv);
      clearInterval(clock);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [waiting, billRef]);

  /** The owner saw the money land in the personal UPI ID — no gateway in the
   *  middle, so no webhook ever fires. One tap records the payment and
   *  completes the bill the same way auto-detection does: slip, stock,
   *  income, WhatsApp/SMS. */
  const confirmReceived = async () => {
    if (paidRef.current) return;
    paidRef.current = true;
    setWaiting(false);
    // record the event FIRST — the customer notification fired by onPaid
    // attaches its WhatsApp/SMS status to it; capped so an offline device
    // still completes the bill within ~1.5 s
    await Promise.race([
      apiPaymentsWebhook({ billRef, amount }),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    onPaidRef.current(amount);
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the ID is on screen to retype */
    }
  };

  const sharePayLink = () => {
    const text = `${t('pay.shareText')} ₹${fmt(amount)} — ${companyName}: ${payLink}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => undefined);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div
      data-payment-screen
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-blue-50 via-white to-blue-50 px-5 py-6"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
        <Banknote className="size-5" />
        {t('pay.upiTitle')}
      </div>

      <div data-payment-amount className="text-4xl font-extrabold tabular-nums text-blue-900">
        ₹{fmt(amount)}
      </div>

      <div className="w-full max-w-xs rounded-2xl border-2 border-blue-600 bg-white p-4 text-center shadow-lg">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('pay.payTo')}</p>
        <p data-payment-upi className="mt-1 break-all text-lg font-extrabold text-blue-900 select-all">
          {upiId || t('pay.noUpiShort')}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('pay.typeHint')}</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={copyUpi} aria-label="Copy UPI ID">
            <Copy className="size-3.5" />
            {copied ? t('pay.copied') : t('pay.copyUpi')}
          </Button>
          {payLink && (
            <Button variant="outline" size="sm" className="h-9" onClick={sharePayLink} aria-label="Share payment link">
              <Share2 className="size-3.5" />
              {t('pay.shareLink')}
            </Button>
          )}
        </div>
      </div>

      {waiting ? (
        <div data-payment-waiting className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow">
            <Loader2 className="size-4 animate-spin" />
            {t('pay.waiting')}
          </div>
          <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground">
            {t('pay.autoNote')}
          </p>
          <p className="text-[10px] tabular-nums text-muted-foreground">
            {t('pay.refLabel')}: <span data-bill-ref>{billRef}</span> · {Math.floor(elapsed / 60)}:
            {String(elapsed % 60).padStart(2, '0')}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white shadow">
          <Banknote className="size-4" />
          {t('pay.paidToast')}
        </div>
      )}

      {waiting && (
        <Button
          data-payment-received
          className="h-12 w-full max-w-xs bg-green-600 text-base font-bold text-white shadow hover:bg-green-700"
          onClick={confirmReceived}
          aria-label="Money received"
        >
          <Banknote className="size-5" />
          {t('pay.received')}
        </Button>
      )}

      {!upiId && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-[11px] font-semibold text-amber-800">
          {t('pay.noUpi')}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="h-11" onClick={onCashInstead} aria-label="Pay by cash instead">
          <Banknote className="size-4" />
          {t('pay.cashInstead')}
        </Button>
        <Button variant="ghost" className="h-11" onClick={onCancel} aria-label="Cancel payment">
          <X className="size-4" />
          {t('pay.cancel')}
        </Button>
      </div>
    </div>
  );
}
