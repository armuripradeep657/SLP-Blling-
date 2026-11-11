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
import { ArrowDownRight, CalendarDays, Hammer, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt, fmtShort, localDateKey, localMonthKey } from '@/lib/billing';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import type { AppLanguage, PaymentMode } from '@/lib/types';

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card'];

function modeLabel(m: PaymentMode, appLang: AppLanguage): string {
  if (appLang !== 'te') return m;
  return m === 'Cash' ? 'నగదు' : m === 'Card' ? 'కార్డ్' : m === 'Due' ? 'బాకీ' : 'UPI';
}

/** Cash / UPI / Card chip — how the day's money was given */
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
  const [lwProduct, setLwProduct] = useState('');
  const [lwMoney, setLwMoney] = useState('');
  const [lwMode, setLwMode] = useState<PaymentMode>('Cash');

  const submitLabourWork = () => {
    const name = lwName.trim();
    const work = lwWork.trim();
    if (!name || !work) return;
    const amt = Number(lwMoney) || 0;
    addLabourWork({
      dateISO: new Date(`${lwDate || today}T12:00:00`).toISOString(),
      name,
      work,
      product: lwProduct.trim() || undefined,
      amount: amt > 0 ? amt : undefined,
      mode: amt > 0 ? lwMode : undefined,
    });
    setLwName('');
    setLwWork('');
    setLwProduct('');
    setLwMoney('');
    toast({
      title: t('labour.added'),
      description: amt > 0 ? `${name} · ₹${fmt(amt)} · ${modeLabel(lwMode, appLang)}` : name,
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

  const monthMoney = useMemo(
    () => monthWorks.reduce((s, w) => s + (w.amount || 0), 0),
    [monthWorks]
  );

  return (
    <div className="space-y-3">
      {/* month picker + money given this month */}
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
        <div className="grid grid-cols-2 gap-2">
          <div className="anim-pop rounded-xl border bg-card p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownRight className="size-3.5 text-red-600" />
              {t('labour.moneyMonth')}
            </p>
            <p data-labour-month-money className="mt-0.5 text-lg font-extrabold tabular-nums text-red-600">
              ₹{fmt(monthMoney)}
            </p>
          </div>
          <div className="anim-pop rounded-xl border bg-card p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hammer className="size-3.5 text-amber-700" />
              {t('labour.worksMonth')}
            </p>
            <p data-labour-month-count className="mt-0.5 text-lg font-extrabold tabular-nums text-blue-800">
              {monthWorks.length}
            </p>
          </div>
        </div>
      </div>

      {/* add form — who / when / what / product / money */}
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
            <Label className="text-[11px] text-muted-foreground">{t('labour.product')}</Label>
            <Input
              value={lwProduct}
              onChange={(e) => setLwProduct(e.target.value)}
              placeholder={t('labour.productPlaceholder')}
              className="h-10"
              aria-label="Work product"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('labour.money')}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={lwMoney}
              onChange={(e) => setLwMoney(e.target.value)}
              placeholder="0"
              className="h-10"
              aria-label="Labour money"
            />
          </div>
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
        {monthWorks.map((e, i) => (
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
                  <ModeChip mode={e.amount ? e.mode : undefined} appLang={appLang} />
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {' · '}
                  {e.work}
                  {e.product ? ` · ${e.product}` : ''}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {e.amount ? (
                <span className="text-sm font-bold tabular-nums text-red-600">− ₹{fmt(e.amount)}</span>
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
        ))}
        {monthWorks.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">{t('labour.empty')}</li>
        )}
      </ul>
      {monthWorks.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-neutral-50 px-3 py-2 text-xs font-bold">
          <span>{t('ledger.monthTotal')}</span>
          <span className="tabular-nums text-red-600">₹{fmtShort(monthMoney)}</span>
        </div>
      )}
    </div>
  );
}
