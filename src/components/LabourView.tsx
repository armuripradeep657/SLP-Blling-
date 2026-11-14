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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowDownRight,
  CalendarDays,
  Coins,
  Hammer,
  IndianRupee,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt, fmtShort, labourMoney, localDateKey, localMonthKey } from '@/lib/billing';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import type { AppLanguage, LabourWork, PaymentMode } from '@/lib/types';

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
  const labourWorkers = useStore((s) => s.labourWorkers);
  const addLabourWork = useStore((s) => s.addLabourWork);
  const deleteLabourWork = useStore((s) => s.deleteLabourWork);
  const updateLabourWork = useStore((s) => s.updateLabourWork);
  const addLabourPayment = useStore((s) => s.addLabourPayment);
  const deleteLabourPayment = useStore((s) => s.deleteLabourPayment);
  const { toast } = useToast();

  const today = localDateKey(new Date());
  const thisMonth = localMonthKey(new Date());

  const [month, setMonth] = useState(thisMonth);
  /** Entries = the action list · Notebook = the day-wise khaata book view */
  const [view, setView] = useState<'entries' | 'notebook'>('entries');

  /* ---------------- add form ---------------- */
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
    const dateISO = new Date(`${lwDate || today}T12:00:00`).toISOString();
    addLabourWork({
      dateISO,
      name,
      work,
      qty: qty > 0 ? qty : undefined,
      // money: the wage is what was paid now + the balance still to pay;
      // the money handed over right now is recorded as the first payment
      wage: previewTotal > 0 ? previewTotal : undefined,
      paid: paid > 0 ? paid : undefined,
      balance: balance > 0 ? balance : undefined,
      mode: paid > 0 ? lwMode : undefined,
      payments:
        paid > 0
          ? [
              {
                id: `lwp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                dateISO,
                amount: paid,
                mode: lwMode,
              },
            ]
          : [],
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

  /* ---------------- edit dialog ---------------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edDate, setEdDate] = useState(today);
  const [edName, setEdName] = useState('');
  const [edWork, setEdWork] = useState('');
  const [edQty, setEdQty] = useState('');
  const [edWage, setEdWage] = useState('');
  const [edMode, setEdMode] = useState<PaymentMode>('Cash');
  // payment form (balance paid / extra money given)
  const [payAmt, setPayAmt] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('Cash');
  const [payNote, setPayNote] = useState('');

  /** live entry while the dialog is open — payments appear the moment they are added */
  const editing = useMemo(
    () => (editId ? labourWorks.find((w) => w.id === editId) ?? null : null),
    [labourWorks, editId]
  );
  const editingMoney = useMemo(() => (editing ? labourMoney(editing) : null), [editing]);

  const openEdit = (e: LabourWork) => {
    const m = labourMoney(e);
    setEditId(e.id);
    setEdDate(localDateKey(new Date(e.dateISO)));
    setEdName(e.name);
    setEdWork(e.work);
    setEdQty(e.qty ? String(e.qty) : '');
    setEdWage(m.wage > 0 ? String(m.wage) : '');
    setEdMode(e.mode ?? 'Cash');
    setPayAmt('');
    setPayMode('Cash');
    setPayNote('');
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editId) return;
    const name = edName.trim();
    const work = edWork.trim();
    if (!name || !work) return;
    updateLabourWork(editId, {
      dateISO: new Date(`${edDate || today}T12:00:00`).toISOString(),
      name,
      work,
      qty: Number(edQty) > 0 ? Math.round(Number(edQty)) : undefined,
      wage: Math.max(0, Math.round((Number(edWage) || 0) * 100) / 100),
      mode: edMode,
    });
    setEditOpen(false);
    toast({ title: t('labour.updated') });
  };

  const submitPayment = () => {
    if (!editId) return;
    const amt = Math.round((Number(payAmt) || 0) * 100) / 100;
    if (amt <= 0) return;
    addLabourPayment(editId, {
      amount: amt,
      mode: payMode,
      note: payNote.trim() || undefined,
      dateISO: new Date().toISOString(),
    });
    setPayAmt('');
    setPayNote('');
    toast({ title: t('labour.paymentAdded') });
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
    () => Math.round(monthWorks.reduce((s, w) => s + labourMoney(w).paid, 0) * 100) / 100,
    [monthWorks]
  );
  const monthBalance = useMemo(
    () => Math.round(monthWorks.reduce((s, w) => s + labourMoney(w).balance, 0) * 100) / 100,
    [monthWorks]
  );
  const monthExtra = useMemo(
    () => Math.round(monthWorks.reduce((s, w) => s + labourMoney(w).extra, 0) * 100) / 100,
    [monthWorks]
  );
  const monthWages = useMemo(
    () => Math.round(monthWorks.reduce((s, w) => s + labourMoney(w).wage, 0) * 100) / 100,
    [monthWorks]
  );

  /** Notebook: the month's work grouped DAY by DAY — like the paper note book */
  const notebookDays = useMemo(() => {
    const byDay = new Map<string, LabourWork[]>();
    for (const w of monthWorks) {
      const key = localDateKey(new Date(w.dateISO));
      const list = byDay.get(key);
      if (list) list.push(w);
      else byDay.set(key, [w]);
    }
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthWorks]);

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
            className="h-11 max-w-40"
            aria-label="Labour month"
          />
          <div className="ml-auto flex shrink-0 rounded-lg border p-0.5" role="group" aria-label="Labour view">
            <button
              type="button"
              onClick={() => setView('entries')}
              aria-pressed={view === 'entries'}
              data-view-entries
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                view === 'entries' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-blue-700'
              }`}
            >
              {t('labour.entriesView')}
            </button>
            <button
              type="button"
              onClick={() => setView('notebook')}
              aria-pressed={view === 'notebook'}
              data-view-notebook
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                view === 'notebook' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-blue-700'
              }`}
            >
              {t('labour.notebook')}
            </button>
          </div>
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
              list="labour-workers"
              autoComplete="off"
            />
          </div>
        </div>
        <datalist id="labour-workers">
          {labourWorkers.map((w) => (
            <option key={w.id} value={w.name} />
          ))}
        </datalist>
        {labourWorkers.length > 0 && (
          <p className="text-[10px] leading-snug text-muted-foreground">{t('labour.noWorkersHint')}</p>
        )}
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

      {/* register rows — Entries view */}
      {view === 'entries' && (
      <ul className="space-y-1.5">
        {monthWorks.map((e, i) => {
          const m = labourMoney(e);
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
                    <ModeChip mode={m.paid ? e.mode : undefined} appLang={appLang} />
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' · '}
                    {e.work}
                    {e.product ? ` · ${e.product}` : ''}
                    {e.qty ? ` · ${e.qty} ${t('labour.qtyUnit')}` : ''}
                  </p>
                  {m.balance > 0 && (
                    <p className="text-[11px] font-bold text-amber-600">
                      {t('labour.rowBalance')} ₹{fmt(m.balance)}
                    </p>
                  )}
                  {m.extra > 0 && (
                    <p data-labour-extra className="text-[11px] font-bold text-emerald-600">
                      {t('labour.extra')} ₹{fmt(m.extra)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {m.paid ? (
                  <span className="text-sm font-bold tabular-nums text-red-600">− ₹{fmt(m.paid)}</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-blue-700"
                  onClick={() => openEdit(e)}
                  aria-label={`Edit work ${e.name}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
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
      )}

      {/* Notebook view — the day-wise khaata book: who did what, how much, money */}
      {view === 'notebook' && (
        <div data-labour-notebook className="space-y-2.5">
          {notebookDays.map(([day, entries]) => {
            const dayWage = Math.round(entries.reduce((a, w) => a + labourMoney(w).wage, 0) * 100) / 100;
            const dayPaid = Math.round(entries.reduce((a, w) => a + labourMoney(w).paid, 0) * 100) / 100;
            const dayBal = Math.round(entries.reduce((a, w) => a + labourMoney(w).balance, 0) * 100) / 100;
            const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            });
            return (
              <div key={day} data-notebook-day={day} className="anim-fade-up overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between gap-2 bg-amber-50 px-3 py-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <CalendarDays className="size-3.5 shrink-0" />
                    {dateLabel}
                  </p>
                  <p className="text-right text-[11px] font-semibold tabular-nums text-amber-700">
                    {t('labour.wagesTotal')} ₹{fmtShort(dayWage)}
                    {dayPaid > 0 ? ` · ${t('labour.paidMonth')} ₹${fmtShort(dayPaid)}` : ''}
                    {dayBal > 0 ? ` · ${t('labour.rowBalance')} ₹${fmtShort(dayBal)}` : ''}
                  </p>
                </div>
                <ul className="divide-y">
                  {entries.map((e) => {
                    const m = labourMoney(e);
                    const rate = e.qty && m.wage > 0 ? Math.round((m.wage / e.qty) * 100) / 100 : null;
                    return (
                      <li key={e.id} data-notebook-entry={e.name} className="flex items-start justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{e.name}</p>
                          <p className="text-[11px] leading-snug text-muted-foreground">
                            {e.work}
                            {e.qty
                              ? ` — ${e.qty} ${t('labour.qtyUnit')}${rate ? ` × ₹${fmtShort(rate)}` : ''}`
                              : ''}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <ModeChip mode={m.paid ? e.mode : undefined} appLang={appLang} />
                            {m.balance > 0 && (
                              <span className="font-bold text-amber-600">
                                {t('labour.rowBalance')} ₹{fmt(m.balance)}
                              </span>
                            )}
                            {m.extra > 0 && (
                              <span data-labour-extra className="font-bold text-emerald-600">
                                {t('labour.extra')} ₹{fmt(m.extra)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <span className="text-sm font-bold tabular-nums text-blue-900">₹{fmt(m.wage)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-blue-700"
                            onClick={() => openEdit(e)}
                            aria-label={`Edit work ${e.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {notebookDays.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">{t('labour.empty')}</div>
          )}
        </div>
      )}
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
              {monthExtra > 0 ? ` · ${t('labour.extra')} ₹${fmtShort(monthExtra)}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* edit dialog — change the entered details, record balance / extra money */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85dvh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('labour.editTitle')}</DialogTitle>
            <DialogDescription>
              {editing
                ? `${editing.name} · ${new Date(editing.dateISO).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.date')}</Label>
                <Input
                  type="date"
                  value={edDate}
                  max={today}
                  onChange={(e) => setEdDate(e.target.value)}
                  className="h-10"
                  aria-label="Edit work date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('labour.name')}</Label>
                <Input
                  value={edName}
                  onChange={(e) => setEdName(e.target.value)}
                  className="h-10"
                  aria-label="Edit worker name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('labour.work')}</Label>
              <Input
                value={edWork}
                onChange={(e) => setEdWork(e.target.value)}
                className="h-10"
                aria-label="Edit work done"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('labour.qty')}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={edQty}
                  onChange={(e) => setEdQty(e.target.value)}
                  className="h-10"
                  aria-label="Edit work quantity"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('labour.wage')}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={edWage}
                  onChange={(e) => setEdWage(e.target.value)}
                  className="h-10"
                  aria-label="Edit total wage"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('labour.mode')}</Label>
              <Select value={edMode} onValueChange={(v) => setEdMode(v as PaymentMode)}>
                <SelectTrigger className="h-10" aria-label="Edit money mode">
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

            {/* money summary of this entry */}
            {editingMoney && (
              <p data-edit-summary className="rounded-lg bg-neutral-50 px-3 py-2 text-xs font-semibold">
                {t('labour.wagesTotal')} <span className="tabular-nums text-blue-800">₹{fmt(editingMoney.wage)}</span>
                {' · '}
                {t('labour.paidSoFar')} <span className="tabular-nums text-red-600">₹{fmt(editingMoney.paid)}</span>
                {editingMoney.balance > 0 ? (
                  <>
                    {' · '}
                    <span className="text-amber-600">
                      {t('labour.rowBalance')} ₹{fmt(editingMoney.balance)}
                    </span>
                  </>
                ) : editingMoney.extra > 0 ? (
                  <>
                    {' · '}
                    <span className="text-emerald-600">
                      {t('labour.extra')} ₹{fmt(editingMoney.extra)}
                    </span>
                  </>
                ) : null}
              </p>
            )}

            {/* payments history */}
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                <Wallet className="size-3.5" />
                {t('labour.payments')}
                {editing?.payments?.length ? ` (${editing.payments.length})` : ''}
              </p>
              <ul className="space-y-1">
                {(editing?.payments ?? []).map((p) => (
                  <li
                    key={p.id}
                    data-payment-row
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-bold">
                        <IndianRupee className="size-3 shrink-0 text-red-600" />
                        <span className="tabular-nums">{fmt(p.amount)}</span>
                        <ModeChip mode={p.mode} appLang={appLang} />
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {new Date(p.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {p.note ? ` · ${p.note}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => editId && deleteLabourPayment(editId, p.id)}
                      aria-label={`Delete payment ${p.amount}`}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </li>
                ))}
                {(editing?.payments?.length ?? 0) === 0 && (
                  <li className="py-1 text-center text-[11px] text-muted-foreground">{t('labour.noPayments')}</li>
                )}
              </ul>

              {/* record money given now — balance paid or extra money */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t('labour.payAmount')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={payAmt}
                    onChange={(e) => setPayAmt(e.target.value)}
                    placeholder="0"
                    className="h-10"
                    aria-label="Payment amount"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t('labour.mode')}</Label>
                  <Select value={payMode} onValueChange={(v) => setPayMode(v as PaymentMode)}>
                    <SelectTrigger className="h-10" aria-label="Payment mode">
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
              <Input
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder={t('labour.payNote')}
                className="h-10"
                aria-label="Payment note"
              />
              <Button
                onClick={submitPayment}
                className="h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!(Number(payAmt) > 0)}
                aria-label="Add payment"
              >
                <Wallet className="size-4" />
                {t('labour.addPayment')}
              </Button>
            </div>

            <Button
              onClick={saveEdit}
              className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
              aria-label="Save labour changes"
            >
              {t('labour.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
