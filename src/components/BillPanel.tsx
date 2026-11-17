'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, UserRound, ReceiptText, Tag, Truck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { computeTotals, fmt, lineNet, normalizePhone, itemDiscountAmount } from '@/lib/billing';
import { BILL_LANGUAGES } from '@/lib/i18n';
import { useT } from '@/hooks/use-app-lang';
import type { BillLanguage, DeliveryInfo, DiscountType, PaymentMode } from '@/lib/types';

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Due'];

export default function BillPanel({
  onComplete,
  onUpi,
  onError,
}: {
  onComplete: () => void;
  /** UPI bills go to the scan-and-pay screen first — the bill completes
   *  itself when the money arrives (auto-detected payment) */
  onUpi?: (amount: number) => void;
  /** a failed save is reported to the app-level error toast */
  onError?: (e: unknown) => void;
}) {
  const t = useT();
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cfg = useStore((s) => s.billConfig);
  const invoices = useStore((s) => s.invoices);
  const settings = useStore((s) => s.settings);
  const srvConfig = useStore((s) => s.srvConfig);
  const setCustomer = useStore((s) => s.setCustomer);
  const setBillConfig = useStore((s) => s.setBillConfig);
  const incQty = useStore((s) => s.incQty);
  const decQty = useStore((s) => s.decQty);
  const updateCartItem = useStore((s) => s.updateCartItem);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const completeInvoice = useStore((s) => s.completeInvoice);

  // Delivery draft — old persisted configs may not have it
  const delivery: DeliveryInfo = cfg.delivery ?? { delivered: false, driver: '', vehicle: '', address: '' };
  const setDelivery = (patch: Partial<DeliveryInfo>) =>
    setBillConfig({ delivery: { ...delivery, ...patch } });

  // Auto-paid full amount for non-Due modes unless user is doing partial
  useEffect(() => {
    if (cfg.paymentMode === 'Due') return;
    const t = computeTotals(cart, cfg);
    if (cfg.paidAmount !== t.total) {
      setBillConfig({ paidAmount: t.total });
    }
  }, [cfg, cart, setBillConfig]);

  const totals = computeTotals(cart, cfg);

  // recent customers quick-pick
  const seen = new Set<string>();
  const recent: { name: string; phone: string }[] = [];
  for (const inv of invoices) {
    const key = `${inv.customer.name}|${inv.customer.phone}`;
    if (inv.customer.name && !seen.has(key)) {
      seen.add(key);
      recent.push({ name: inv.customer.name, phone: inv.customer.phone });
    }
    if (recent.length >= 4) break;
  }

  const onCompleteClick = async () => {
    // UPI → open the scan-and-pay QR; the bill completes itself when the
    // payment is detected (no extra button pressed)
    if (cfg.paymentMode === 'UPI' && onUpi && cart.length > 0) {
      onUpi(totals.total);
      return;
    }
    // ONLINE-ONLY: the bill saves ONLY when the server confirms it — a
    // failed save throws and is reported; nothing is shown as saved.
    try {
      await completeInvoice();
      onComplete();
    } catch (e) {
      onError?.(e);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
        <ReceiptText className="size-10 opacity-40" />
        <p className="font-medium">{t('bill.noItems')}</p>
        <p className="text-sm">{t('bill.noItemsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer */}
      <section aria-label="Customer details" className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <UserRound className="size-4" /> {t('bill.customer')}
          </Label>
          {recent.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto max-w-[65%]">
              {recent.map((r) => (
                <button
                  key={`${r.name}|${r.phone}`}
                  onClick={() => setCustomer(r)}
                  className="shrink-0 rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={t('bill.customerName')}
            value={customer.name}
            onChange={(e) => setCustomer({ name: e.target.value })}
            className="h-11"
          />
          <Input
            placeholder={t('bill.mobile')}
            type="tel"
            inputMode="numeric"
            value={customer.phone}
            onChange={(e) => setCustomer({ phone: e.target.value })}
            onBlur={(e) => setCustomer({ phone: normalizePhone(e.target.value) })}
            className="h-11"
          />
        </div>
        <Input
          placeholder={t('bill.addressOptional')}
          value={customer.address ?? ''}
          onChange={(e) => setCustomer({ address: e.target.value })}
          className="h-10"
        />
      </section>

      {/* Bill language — English / తెలుగు / Both (applies to slip image + bill text) */}
      <section aria-label="Bill language" className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('bill.language')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {BILL_LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setBillConfig({ language: l.value as BillLanguage })}
              className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                cfg.language === l.value
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'bg-card hover:bg-accent'
              }`}
              aria-pressed={cfg.language === l.value}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Items */}
      <section aria-label="Bill items" className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">
            {t('bill.items')} ({cart.length})
          </Label>
          <Button variant="ghost" size="sm" onClick={clearCart} className="h-8 text-xs text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" /> {t('bill.clear')}
          </Button>
        </div>
        <ul className="space-y-2">
          {cart.map((it, i) => {
            const net = lineNet(it);
            const shownName = cfg.language === 'te' && it.nameTe ? it.nameTe : it.name;
            return (
              <li
                key={it.key}
                className="anim-fade-up rounded-lg border bg-card p-2.5"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{shownName}</p>
                    {cfg.language === 'te' && it.nameTe ? (
                      <p className="truncate text-[11px] text-muted-foreground leading-tight">{it.name}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('bill.size')}: <span className="font-medium text-foreground">{it.size}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(it.key)}
                    aria-label={`Remove ${it.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {/* Owner AND staff can change the cost of THIS bill line and
                    discount that item (₹ or %) — the product catalog itself
                    never changes: the next customer bills at the saved price. */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t('bill.priceUnit')}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={it.price || ''}
                      onChange={(e) =>
                        updateCartItem(it.key, { price: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="h-9"
                      aria-label={`Unit price for ${it.name}`}
                    />
                    {it.origPrice !== undefined && Math.abs(it.origPrice - it.price) > 0.001 ? (
                      <p data-orig-price className="text-[10px] font-semibold text-amber-700">
                        {t('bill.savedPrice')} ₹{fmt(it.origPrice)}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Tag className="size-2.5" /> {t('bill.discountItem')}
                    </Label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(it.key, {
                            discountType: (it.discountType === 'percent' ? 'amount' : 'percent') as DiscountType,
                            discountValue: it.discountType === 'percent' ? (it.discountValue || 0) : (it.discount || 0),
                          })
                        }
                        className="h-9 w-9 shrink-0 rounded-md border text-sm font-bold hover:bg-accent"
                        aria-label={`Discount type for ${it.name}: ${it.discountType === 'percent' ? 'rupees' : 'percent'}`}
                        title={it.discountType === 'percent' ? 'Switch to ₹' : 'Switch to %'}
                      >
                        {it.discountType === 'percent' ? '%' : '₹'}
                      </button>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={it.discountType === 'percent' ? (it.discountValue || '') : (it.discount || '')}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          if (it.discountType === 'percent') {
                            updateCartItem(it.key, { discountType: 'percent', discountValue: v });
                          } else {
                            updateCartItem(it.key, { discountType: 'amount', discountValue: v, discount: v });
                          }
                        }}
                        placeholder="0"
                        className="h-9"
                        aria-label={`Discount for ${it.name}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => decQty(it.key)} aria-label="Decrease quantity">
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">{it.qty}</span>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => incQty(it.key)} aria-label="Increase quantity">
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold tabular-nums">₹{fmt(net)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Separator />

      {/* Discount / extra charges / payment */}
      <section aria-label="Discount and charges" className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('bill.discount')}</Label>
            <div className="flex gap-1.5">
              <Select value={cfg.discountType} onValueChange={(v) => setBillConfig({ discountType: v as 'amount' | 'percent' })}>
                <SelectTrigger className="w-[72px] h-11 shrink-0" aria-label="Discount type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">₹</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={cfg.discountValue || ''}
                onChange={(e) => setBillConfig({ discountValue: Number(e.target.value) || 0 })}
                placeholder="0"
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('bill.labour')}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={cfg.labourCharge || ''}
              onChange={(e) => setBillConfig({ labourCharge: Number(e.target.value) || 0 })}
              placeholder="0"
              className="h-11"
              aria-label="Labour charges"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('bill.auto')}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={cfg.autoCharge || ''}
              onChange={(e) => setBillConfig({ autoCharge: Number(e.target.value) || 0 })}
              placeholder="0"
              className="h-11"
              aria-label="Auto charges"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('bill.paymentMode')}</Label>
            <Select value={cfg.paymentMode} onValueChange={(v) => setBillConfig({ paymentMode: v as PaymentMode, paidAmount: v === 'Due' ? 0 : computeTotals(cart, { ...cfg, paymentMode: v as PaymentMode }).total })}>
              <SelectTrigger className="h-11" aria-label="Payment mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t('bill.amountPaid')} {cfg.paymentMode === 'Due' ? t('bill.advance') : ''}
            </Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={cfg.paidAmount || ''}
                onChange={(e) => setBillConfig({ paidAmount: Number(e.target.value) || 0 })}
                className="h-11"
                aria-label="Amount paid"
              />
              <Button variant="outline" className="h-11 shrink-0 px-3 text-xs" onClick={() => setBillConfig({ paidAmount: totals.total })}>
                {t('bill.full')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery — tick Delivered to add driver, vehicle & address */}
      <section aria-label="Delivery details" className="rounded-xl border bg-card p-3 space-y-2.5">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Truck className="size-4" /> {t('delivery.title')}
        </Label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            checked={delivery.delivered}
            onCheckedChange={(v) => setDelivery({ delivered: v === true })}
            className="mt-0.5"
            aria-label="Delivered"
          />
          <span className="text-xs leading-snug text-muted-foreground">{t('delivery.delivered')}</span>
        </label>
        {delivery.delivered && (
          <div className="space-y-2 pt-0.5">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={t('delivery.driver')}
                value={delivery.driver}
                onChange={(e) => setDelivery({ driver: e.target.value })}
                className="h-10"
                aria-label="Driver name"
              />
              <Input
                placeholder={t('delivery.vehicle')}
                value={delivery.vehicle}
                onChange={(e) => setDelivery({ vehicle: e.target.value })}
                className="h-10"
                aria-label="Vehicle number"
              />
            </div>
            <Input
              placeholder={t('delivery.address')}
              value={delivery.address}
              onChange={(e) => setDelivery({ address: e.target.value })}
              className="h-10"
              aria-label="Delivery address"
            />
            <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-2 py-1.5">
              {t('delivery.driverSlipNote')}
            </p>
          </div>
        )}
      </section>

      <Separator />

      {/* Totals */}
      <section aria-label="Bill totals" className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t('bill.subtotal')}</span>
          <span className="tabular-nums">₹{fmt(totals.subtotal)}</span>
        </div>
        {totals.itemDiscounts > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>{t('bill.itemDiscounts')}</span>
            <span className="tabular-nums">− ₹{fmt(totals.itemDiscounts)}</span>
          </div>
        )}
        {totals.discount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>{t('bill.discount')}</span>
            <span className="tabular-nums">− ₹{fmt(totals.discount)}</span>
          </div>
        )}
        {totals.labourCharge > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>{t('bill.labour')}</span>
            <span className="tabular-nums">+ ₹{fmt(totals.labourCharge)}</span>
          </div>
        )}
        {totals.autoCharge > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>{t('bill.auto')}</span>
            <span className="tabular-nums">+ ₹{fmt(totals.autoCharge)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-1">
          <span className="font-semibold">{t('bill.grandTotal')}</span>
          <span className="text-2xl font-extrabold tabular-nums">₹{fmt(totals.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('bill.balanceDue')}</span>
          <span className={`font-semibold tabular-nums ${totals.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
            ₹{fmt(totals.balance)}
          </span>
        </div>
      </section>

      <Button
        onClick={() => void onCompleteClick()}
        className="anim-glow w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white"
      >
        <ReceiptText className="size-5" />
        {t('bill.complete')}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        {t('bill.invoiceNumbered')}{' '}
        {srvConfig.nextBillNo > 0
          ? `${settings.invoicePrefix || 'SLP-INV-'}${srvConfig.nextBillNo + 1}`
          : `${settings.invoicePrefix || 'SLP-INV-'}${settings.nextInvoiceNo}`}
      </p>
    </div>
  );
}
