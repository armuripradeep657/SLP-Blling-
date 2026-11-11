'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownRight, CalendarDays, Coins, Hammer, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt, fmtShort, localDateKey, localMonthKey } from '@/lib/billing';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import type { AppLanguage, PaymentMode } from '@/lib/types';

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card'];

function modeLabel(m: PaymentMode, appLang: AppLanguage): string {
  if (appLang !== 'te') return m;
  return m === 'Cash' ? 'నగదు' : m === 'Card' ? 'కార్డ్' : m === 'Due' ? 'బాకీ' : 'UPI';
}

/** Cash / UPI / Card chip — how the money was given that day */
function ModeChip({ mode, appLang }: { mode?: PaymentMode; appLang: AppLanguage }) {
  if (!mode) return null;
  const cls =
    mode === 'Cash'
      ? 'bg-green-100 text-green-800'
      : mode === 'UPI'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-purple-100 text-purple-800';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`}
    >
      {modeLabel(mode, appLang)}
    </span>
  );
}

export default function LabourView() {
  const t = useT();
  const appLang = useAppLang();
  const labourWorks = useStore((s) => s.labourWorks);
  const addLabourWork = useStore((s) => s.addLabourWork);
  const deleteLabourWork = useStore((s) => s.deleteLabourWork);
  const { toast } = useToast();

  const today = localDateKey(new Date());
  const thisMonth = localMonthKey(new Date());

  const [month, setMonth] = useState(thisMonth);

  /* ---------------- form ---------------- */
  const [lwDate, setLwDate] = useState(today);
  const [lwName, setLwName] = useState('');
  const [lwWork, setLwWork] = useState('');
  const [lwQty, setLwQty] = useState('');
  const [lwPaid, setLwPaid] = useState('');
  const [lwBalance, setLwBalance] = useState('');
  const [lwMode, setLwMode] = useState<PaymentMode>('Cash');

  const previewPaid = Number(lwPaid) || 0;
  const previewBalance = Number(lwBalance) || 0;
  const previewTotal = Math.round((previewPaid + previewBalance) * 100) / 100;

  const submitLabourWork = () => {
    const name = lwName.trim();
    const work = lwWork.trim();
    if (!name || !work) return;
    const paid = Math.round((Number(lwPaid) || 0) * 100) / 100;
    const balance = Math.round((Number(lwBalance) || 0) * 100) / 100;
    const qty = Math.round(Number(lwQty) || 0);
    addLabourWork({
      dateISO: new Date(`${lwDate || today}T12:00:00`).toISOString(),
      name,
      work,
      qty: qty > 0 ? qty : undefined,
      paid: paid > 0 ? paid : undefined,
      balance: balance > 0 ? balance : undefined,
      mode: paid > 0 ? lwMode : undefined,
    });
    setLwName('');
    setLwWork('');
    setLwQty('');
    setLwPaid('');
    setLwBalance('');
    toast({
      title: t('labour.added'),
      description: `${name} · ${fmt(previewTotal)} ${
        previewBalance > 0 ? `· ${t('labour.rowBalance')} ₹${fmt(previewBalance)}` : ''
      }`,
    });
  };

  /* ---------------- month register ---------------- */
  const monthWorks = useMemo(
    () =>
      labourWorks
        .filter((e) => localMonthKey(new Date(e.dateISO)) === month)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [labourWorks, month]
  );

  const monthPaid = useMemo(
    () => monthWorks.reduce((s, w) => s + (w.paid ?? w.amount ?? 0), 0),
    [monthWorks]
  );
  const monthBalance = useMemo(
    () => monthWorks.reduce((s, w) => s + (w.balance ?? 0), 0),
    [monthWorks]
  );
  const monthWages = useMemo(
    () => Math.round((monthPaid + monthBalance) * 100) / 100,
    [monthPaid, monthBalance]
  );

  return (
    <div className="space-y-3">
      {/* month picker + paid / balance / entries this month */}
      <div className="space-y-2.5 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-blue-700" />
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || thisMonth)}
            className="h-11 max-w-44"
            aria-label="Labour month"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="anim-pop rounded-xl border bg-card p-2.5">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ArrowDownRight className="size-3 shrink-0 text-red-600" />
              <span className="truncate">{t('labour.paidMonth')}</span>
            </p>
            <p data-labour-month-paid className="mt-0.5 text-base font-extrabold tabular-nums text-red-600">
              ₹{fmt(monthPaid)}
            </p>
          </div>
          <div className="anim-pop rounded-xl border bg-card p-2.5">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Coins className="size-3 shrink-0 text-amber-600" />
              <span className="truncate">{t('labour.balanceMonth')}</span>
            </p>
            <p data-labour-month-balance className="mt-0.5 text-base font-extrabold tabular-nums text-amber-600">
              ₹{fmt(monthBalance)}
            </p>
          </div>
          <div className="anim-pop rounded-xl border bg-card p-2.5">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Hammer className="size-3 shrink-0 text-blue-700" />
              <span className="truncate">{t('labour.worksMonth')}</span>
            </p>
            <p data-labour-month-count className="mt-0.5 text-base font-extrabold tabular-nums text-blue-800">
              {monthWorks.length}
            </p>
          </div>
        </div>
      </div>

      {/* add form — who / when / what / product QUANTITY / money paid now + balance */}
      <div className="space-y-2.5 rounded-xl border bg-card p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('ledger.date')}</Label>
            <Input
              type="date"
              value={lwDate}
              max={today}
              onChange={(e) => setLwDate(e.target.value)}
              className="h-10"
              aria-label="Work date"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.name')}</Label>
            <Input
              value={lwName}
              onChange={(e) => setLwName(e.target.value)}
              placeholder={t('labour.namePlaceholder')}
              className="h-10"
              aria-label="Worker name"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t('labour.work')}</Label>
          <Input
            value={lwWork}
            onChange={(e) => setLwWork(e.target.value)}
            placeholder={t('labour.workPlaceholder')}
            className="h-10"
            aria-label="Work done"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.qty')}</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={lwQty}
              onChange={(e) => setLwQty(e.target.value)}
              placeholder={t('labour.qtyPlaceholder')}
              className="h-10"
              aria-label="Work quantity"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.paid')}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={lwPaid}
              onChange={(e) => setLwPaid(e.target.value)}
              placeholder="0"
              className="h-10"
              aria-label="Labour paid"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.balance')}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={lwBalance}
              onChange={(e) => setLwBalance(e.target.value)}
              placeholder="0"
              className="h-10"
              aria-label="Labour balance"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.mode')}</Label>
            <Select value={lwMode} onValueChange={(v) => setLwMode(v as PaymentMode)}>
              <SelectTrigger className="h-10" aria-label="Labour money mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {modeLabel(m, appLang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(previewPaid > 0 || previewBalance > 0) && (
          <p className="text-xs font-semibold text-muted-foreground">
            {t('labour.wagesTotal')}: <span className="tabular-nums text-blue-800">₹{fmt(previewTotal)}</span>
            {previewBalance > 0 && (
              <span className="text-amber-600">
                {' '}
                · {t('labour.rowBalance')} ₹{fmt(previewBalance)}
              </span>
            )}
          </p>
        )}
        <Button
          onClick={submitLabourWork}
          className="h-11 w-full bg-amber-600 text-white hover:bg-amber-700"
          disabled={!(lwName.trim() && lwWork.trim())}
          aria-label="Add labour work"
        >
          <Hammer className="size-4" />
          {t('labour.add')}
        </Button>
      </div>

      {/* register rows */}
      <ul className="space-y-1.5">
        {monthWorks.map((e, i) => {
          const paid = e.paid ?? e.amount ?? 0; // legacy `amount` = paid that day
          const balance = e.balance ?? 0;
          return (
            <li
              key={e.id}
              data-labour-row={e.name}
              className="anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Hammer className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    <span className="truncate">{e.name}</span>
                    <ModeChip mode={paid ? e.mode : undefined} appLang={appLang} />
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' · '}
                    {e.work}
                    {e.product ? ` · ${e.product}` : ''}
                    {e.qty ? ` · ${e.qty} ${t('labour.qtyUnit')}` : ''}
                  </p>
                  {balance > 0 && (
                    <p className="text-[11px] font-bold text-amber-600">
                      {t('labour.rowBalance')} ₹{fmt(balance)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {paid ? (
                  <span className="text-sm font-bold tabular-nums text-red-600">− ₹{fmt(paid)}</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteLabourWork(e.id)}
                  aria-label={`Delete work ${e.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {monthWorks.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">{t('labour.empty')}</li>
        )}
      </ul>
      {monthWorks.length > 0 && (
        <div className="space-y-0.5 rounded-lg border bg-neutral-50 px-3 py-2 text-xs font-bold">
          <div className="flex items-center justify-between">
            <span>{t('labour.wagesTotal')}</span>
            <span data-labour-month-money className="tabular-nums text-blue-800">
              ₹{fmtShort(monthWages)}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold text-muted-foreground">
            <span>
              {t('labour.paidMonth')} ₹{fmtShort(monthPaid)} · {t('labour.rowBalance')} ₹{fmtShort(monthBalance)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
