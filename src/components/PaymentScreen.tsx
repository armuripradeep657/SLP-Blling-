'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Banknote, Loader2, QrCode, X } from 'lucide-react';
import { useQrDataUrl } from '@/hooks/use-qr';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import { apiPaymentsStatus } from '@/lib/cloud';
import { fmt } from '@/lib/billing';

/** How often the bill screen asks the server whether the money arrived */
const POLL_MS = 3000;

/**
 * The UPI collection screen — the owner taps "Complete bill" on a UPI bill
 * and this full-screen QR takes over:
 *
 *   1. the customer scans the QR (any UPI app — the amount + bill ref are
 *      embedded in the payment) and pays
 *   2. the payment gateway webhook records the event on the server
 *   3. this screen polls every 3 s, sees the money, and calls onPaid() —
 *      the bill completes ITSELF: slip opens, stock moves, WhatsApp/SMS go
 *      to the customer. Nothing is pressed.
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

  const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(companyName)}&am=${amount.toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(billRef)}`;
  const qr = useQrDataUrl(uri);

  const [waiting, setWaiting] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  /** guards against a double completion (poll + render race) */
  const paidRef = useRef(false);
  /** latest onPaid without re-arming the poll interval */
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => {
      if (paidRef.current) return;
      const events = await apiPaymentsStatus([billRef]);
      const hit = events.find((e) => e.billRef === billRef);
      if (hit && alive && !paidRef.current) {
        paidRef.current = true;
        setWaiting(false);
        onPaidRef.current(hit.amount);
      }
    };
    const iv = setInterval(tick, POLL_MS);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    void tick();
    return () => {
      alive = false;
      clearInterval(iv);
      clearInterval(clock);
    };
  }, [waiting, billRef]);

  return (
    <div
      data-payment-screen
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-blue-50 via-white to-blue-50 px-5 py-6"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
        <QrCode className="size-5" />
        {t('pay.scanTitle')}
      </div>

      <div className="text-4xl font-extrabold tabular-nums text-blue-900">₹{fmt(amount)}</div>

      <div className="rounded-2xl border-4 border-blue-600 bg-white p-3 shadow-lg">
        {qr ? (
          <img src={qr} alt={`UPI QR for ₹${fmt(amount)} — ref ${billRef}`} className="size-60" />
        ) : (
          <div className="flex size-60 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-blue-400" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t('pay.qrHint')}</p>

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
