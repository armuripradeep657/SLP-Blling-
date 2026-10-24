'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, UserRound, ReceiptText } from 'lucide-react';
import { useStore } from '@/lib/store';
import { computeTotals, fmt, normalizePhone } from '@/lib/billing';
import type { PaymentMode } from '@/lib/types';

const TAX_RATES = [0, 5, 12, 18, 28];
const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Due'];

export default function BillPanel({ onComplete }: { onComplete: () => void }) {
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cfg = useStore((s) => s.billConfig);
  const invoices = useStore((s) => s.invoices);
  const settings = useStore((s) => s.settings);
  const setCustomer = useStore((s) => s.setCustomer);
  const setBillConfig = useStore((s) => s.setBillConfig);
  const incQty = useStore((s) => s.incQty);
  const decQty = useStore((s) => s.decQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const completeInvoice = useStore((s) => s.completeInvoice);

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

  const onCompleteClick = () => {
    const inv = completeInvoice();
    if (inv) onComplete();
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
        <ReceiptText className="size-10 opacity-40" />
        <p className="font-medium">No items in the bill</p>
        <p className="text-sm">Tap a size button on any product to add it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer */}
      <section aria-label="Customer details" className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <UserRound className="size-4" /> Customer
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
            placeholder="Customer name"
            value={customer.name}
            onChange={(e) => setCustomer({ name: e.target.value })}
            className="h-11"
          />
          <Input
            placeholder="Mobile / WhatsApp"
            type="tel"
            inputMode="numeric"
            value={customer.phone}
            onChange={(e) => setCustomer({ phone: e.target.value })}
            onBlur={(e) => setCustomer({ phone: normalizePhone(e.target.value) })}
            className="h-11"
          />
        </div>
        <Input
          placeholder="Address (optional)"
          value={customer.address ?? ''}
          onChange={(e) => setCustomer({ address: e.target.value })}
          className="h-10"
        />
      </section>

      <Separator />

      {/* Items */}
      <section aria-label="Bill items" className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Items ({cart.length})</Label>
          <Button variant="ghost" size="sm" onClick={clearCart} className="h-8 text-xs text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" /> Clear
          </Button>
        </div>
        <ul className="space-y-2">
          {cart.map((it) => (
            <li key={it.key} className="rounded-lg border bg-card p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{it.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Size: <span className="font-medium text-foreground">{it.size}</span> · ₹{fmt(it.price)}
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
                <span className="text-sm font-bold tabular-nums">₹{fmt(it.price * it.qty)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* Discount / tax / payment */}
      <section aria-label="Discount and tax" className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Discount</Label>
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
            <Label className="text-xs text-muted-foreground">GST rate</Label>
            <Select value={String(cfg.taxRate)} onValueChange={(v) => setBillConfig({ taxRate: Number(v) })}>
              <SelectTrigger className="h-11" aria-label="GST rate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_RATES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm font-medium">Round off total</Label>
            <p className="text-xs text-muted-foreground">Nearest rupee</p>
          </div>
          <Switch checked={cfg.roundOff} onCheckedChange={(v) => setBillConfig({ roundOff: v })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment mode</Label>
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Amount paid {cfg.paymentMode === 'Due' ? '(advance)' : ''}
            </Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={cfg.paidAmount || ''}
                onChange={(e) => setBillConfig({ paidAmount: Number(e.target.value) || 0 })}
                className="h-11"
              />
              <Button variant="outline" className="h-11 shrink-0 px-3 text-xs" onClick={() => setBillConfig({ paidAmount: totals.total })}>
                Full
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Totals */}
      <section aria-label="Bill totals" className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">₹{fmt(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular-nums">− ₹{fmt(totals.discount)}</span>
          </div>
        )}
        {cfg.taxRate > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>GST ({cfg.taxRate}%)</span>
            <span className="tabular-nums">₹{fmt(totals.tax)}</span>
          </div>
        )}
        {cfg.roundOff && Math.abs(totals.roundOff) >= 0.005 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Round off</span>
            <span className="tabular-nums">{totals.roundOff >= 0 ? '+' : '−'} ₹{fmt(Math.abs(totals.roundOff))}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-1">
          <span className="font-semibold">Grand Total</span>
          <span className="text-2xl font-extrabold tabular-nums">₹{fmt(totals.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Balance due</span>
          <span className={`font-semibold tabular-nums ${totals.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
            ₹{fmt(totals.balance)}
          </span>
        </div>
      </section>

      <Button
        onClick={onCompleteClick}
        className="w-full h-14 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
      >
        <ReceiptText className="size-5" />
        Complete Bill — Thermal Slip
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Invoice will be numbered {settings.invoicePrefix}
        {settings.nextInvoiceNo}
      </p>
    </div>
  );
}
