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
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt, fmtShort, localDateKey, localMonthKey, paymentsOf } from '@/lib/billing';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import type { ExpenseCategory, PaymentMode } from '@/lib/types';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Labour wages', 'Diesel', 'Raw material', 'Other'];

const CATEGORY_TE: Record<ExpenseCategory, string> = {
  'Labour wages': 'కూలీ వేతనాలు',
  Diesel: 'డీజిల్',
  'Raw material': 'ముడి పదార్థం',
  Other: 'ఇతర',
};

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card'];

type LedgerTab = 'day' | 'allDays' | 'dues' | 'expenses';

interface DayMoney {
  income: number;
  spent: number;
}

function categoryLabel(c: ExpenseCategory, appLang: 'en' | 'te'): string {
  return appLang === 'te' ? CATEGORY_TE[c] : c;
}

/** Stat card used across ledger tabs (module-level — never created during render) */
function StatCard({ label, value, kind }: { label: string; value: number; kind: 'in' | 'out' | 'net' }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {kind === 'in' ? (
          <ArrowUpRight className="size-3.5 text-green-700" />
        ) : kind === 'out' ? (
          <ArrowDownRight className="size-3.5 text-red-600" />
        ) : (
          <TrendingUp className="size-3.5 text-blue-700" />
        )}
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-extrabold tabular-nums ${
          kind === 'in' ? 'text-green-700' : kind === 'out' ? 'text-red-600' : value < 0 ? 'text-red-600' : 'text-blue-800'
        }`}
      >
        ₹{fmt(value)}
      </p>
    </div>
  );
}

export default function LedgerView() {
  const t = useT();
  const appLang = useAppLang();
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const receiveDuePayment = useStore((s) => s.receiveDuePayment);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const { toast } = useToast();

  const today = localDateKey(new Date());
  const thisMonth = localMonthKey(new Date());

  const [tab, setTab] = useState<LedgerTab>('day');
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(thisMonth);

  /* ---------------- Money aggregation ---------------- */

  // money-in per local day
  const incomeByDay = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      paymentsOf(inv).forEach((p) => {
        const k = localDateKey(new Date(p.dateISO));
        map.set(k, Math.round(((map.get(k) ?? 0) + p.amount) * 100) / 100);
      });
    });
    return map;
  }, [invoices]);

  // money-out per local day
  const spentByDay = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const k = localDateKey(new Date(e.dateISO));
      map.set(k, Math.round(((map.get(k) ?? 0) + e.amount) * 100) / 100);
    });
    return map;
  }, [expenses]);

  const dayMoney = (k: string): DayMoney => ({ income: incomeByDay.get(k) ?? 0, spent: spentByDay.get(k) ?? 0 });

  const dues = useMemo(
    () => invoices.filter((i) => i.totals.balance > 0).sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [invoices]
  );
  const totalDue = dues.reduce((s, i) => s + i.totals.balance, 0);

  // day-view transaction rows (payments + expenses, newest first)
  const dayRows = useMemo(() => {
    const rows: { time: string; label: string; sub: string; amount: number; kind: 'in' | 'out' }[] = [];
    invoices.forEach((inv) => {
      paymentsOf(inv).forEach((p) => {
        if (localDateKey(new Date(p.dateISO)) === day) {
          rows.push({
            time: new Date(p.dateISO).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            label: `${t('ledger.receivedFrom')} ${inv.customer.name || inv.no}`,
            sub: `${inv.no} · ${p.mode}`,
            amount: p.amount,
            kind: 'in',
          });
        }
      });
    });
    expenses.forEach((e) => {
      if (localDateKey(new Date(e.dateISO)) === day) {
        rows.push({
          time: new Date(e.dateISO).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          label: categoryLabel(e.category, appLang),
          sub: e.note || '',
          amount: e.amount,
          kind: 'out',
        });
      }
    });
    return rows.sort((a, b) => b.time.localeCompare(a.time));
  }, [invoices, expenses, day, t, appLang]);

  // all-days rows for the selected month
  const monthDays = useMemo(() => {
    const keys = new Set<string>([...incomeByDay.keys(), ...spentByDay.keys()]);
    return [...keys]
      .filter((k) => localMonthKey(new Date(`${k}T12:00:00`)) === month)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => ({
        key: k,
        income: incomeByDay.get(k) ?? 0,
        spent: spentByDay.get(k) ?? 0,
      }));
  }, [incomeByDay, spentByDay, month]);

  const monthIncome = monthDays.reduce((s, d) => s + d.income, 0);
  const monthSpent = monthDays.reduce((s, d) => s + d.spent, 0);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => localMonthKey(new Date(e.dateISO)) === month)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [expenses, month]
  );

  /* ---------------- Receive-due inline panel ---------------- */
  const [receiving, setReceiving] = useState<string | null>(null);
  const [recvAmount, setRecvAmount] = useState('');
  const [recvMode, setRecvMode] = useState<PaymentMode>('Cash');

  const openReceive = (id: string, balance: number) => {
    setReceiving(id);
    setRecvAmount(String(fmtShort(balance)));
    setRecvMode('Cash');
  };

  const confirmReceive = () => {
    if (!receiving) return;
    const amt = Number(recvAmount) || 0;
    if (amt <= 0) return;
    receiveDuePayment(receiving, amt, recvMode);
    setReceiving(null);
    toast({ title: t('ledger.receiveDone'), description: `₹${fmt(amt)} · ${recvMode}` });
  };

  /* ---------------- Expense form ---------------- */
  const [expDate, setExpDate] = useState(today);
  const [expCat, setExpCat] = useState<ExpenseCategory>('Labour wages');
  const [expAmount, setExpAmount] = useState('');
  const [expNote, setExpNote] = useState('');

  const submitExpense = () => {
    const amt = Number(expAmount) || 0;
    if (amt <= 0) return;
    // date input gives YYYY-MM-DD — keep it local (noon ISO to avoid TZ shifts)
    addExpense({ dateISO: new Date(`${expDate}T12:00:00`).toISOString(), category: expCat, amount: amt, note: expNote.trim() || undefined });
    setExpAmount('');
    setExpNote('');
    toast({ title: t('ledger.expAdded'), description: `₹${fmt(amt)} · ${categoryLabel(expCat, appLang)}` });
  };

  const tabs: { id: LedgerTab; label: string }[] = [
    { id: 'day', label: t('ledger.day') },
    { id: 'allDays', label: t('ledger.allDays') },
    { id: 'dues', label: `${t('ledger.dues')}${totalDue > 0 ? ` (${dues.length})` : ''}` },
    { id: 'expenses', label: t('ledger.expenses') },
  ];

  return (
    <div className="space-y-3">
      {/* Tab chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Ledger sections">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              tab === x.id ? 'bg-blue-600 text-white' : 'border bg-card hover:bg-accent'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {/* ---------- DAY VIEW ---------- */}
      {tab === 'day' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-blue-700 shrink-0" />
            <Input type="date" value={day} max={today} onChange={(e) => setDay(e.target.value)} className="h-11 max-w-44" aria-label="Ledger day" />
            {day !== today && (
              <Button variant="ghost" size="sm" className="h-9" onClick={() => setDay(today)}>
                {appLang === 'te' ? 'ఈ రోజు' : 'Today'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t('ledger.income')} value={dayMoney(day).income} kind="in" />
            <StatCard label={t('ledger.spent')} value={dayMoney(day).spent} kind="out" />
            <StatCard label={t('ledger.net')} value={dayMoney(day).income - dayMoney(day).spent} kind="net" />
          </div>
          <ul className="space-y-1.5">
            {dayRows.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                <div className="min-w-0 flex items-center gap-2.5">
                  {r.kind === 'in' ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <ArrowUpRight className="size-4" />
                    </span>
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <ArrowDownRight className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.time}
                      {r.sub ? ` · ${r.sub}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${r.kind === 'in' ? 'text-green-700' : 'text-red-600'}`}>
                  {r.kind === 'in' ? '+' : '−'} ₹{fmt(r.amount)}
                </span>
              </li>
            ))}
            {dayRows.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noActivity')}</li>
            )}
          </ul>
        </div>
      )}

      {/* ---------- ALL DAYS BY MONTH ---------- */}
      {tab === 'allDays' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-blue-700 shrink-0" />
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value || thisMonth)} className="h-11 max-w-44" aria-label="Ledger month" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t('ledger.income')} value={monthIncome} kind="in" />
            <StatCard label={t('ledger.spent')} value={monthSpent} kind="out" />
            <StatCard label={t('ledger.net')} value={monthIncome - monthSpent} kind="net" />
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-blue-600 px-3 py-2 text-[11px] font-bold text-white">
              <span>{t('ledger.date')}</span>
              <span className="text-right w-20">{t('ledger.income')}</span>
              <span className="text-right w-20">{t('ledger.spent')}</span>
              <span className="text-right w-20">{t('ledger.net')}</span>
            </div>
            <ul className="divide-y max-h-80 overflow-y-auto">
              {monthDays.map((d) => {
                const net = Math.round((d.income - d.spent) * 100) / 100;
                const dt = new Date(`${d.key}T12:00:00`);
                return (
                  <li key={d.key} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-xs tabular-nums">
                    <span className="font-medium">{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                    <span className="text-right w-20 text-green-700 font-semibold">₹{fmtShort(d.income)}</span>
                    <span className="text-right w-20 text-red-600 font-semibold">₹{fmtShort(d.spent)}</span>
                    <span className={`text-right w-20 font-bold ${net < 0 ? 'text-red-600' : 'text-blue-800'}`}>₹{fmtShort(net)}</span>
                  </li>
                );
              })}
              {monthDays.length === 0 && (
                <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noActivity')}</li>
              )}
            </ul>
            {monthDays.length > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t bg-neutral-50 px-3 py-2 text-xs font-bold tabular-nums">
                <span>{t('ledger.monthTotal')}</span>
                <span className="text-right w-20 text-green-700">₹{fmtShort(monthIncome)}</span>
                <span className="text-right w-20 text-red-600">₹{fmtShort(monthSpent)}</span>
                <span className="text-right w-20 text-blue-800">₹{fmtShort(monthIncome - monthSpent)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- DUES ---------- */}
      {tab === 'dues' && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-red-50 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="size-3.5" /> {t('ledger.totalDue')}
              </p>
              <p className="text-xl font-extrabold tabular-nums text-red-600">₹{fmt(totalDue)}</p>
            </div>
            <Badge2>{dues.length}</Badge2>
          </div>
          <ul className="space-y-2">
            {dues.map((inv) => (
              <li key={inv.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {inv.customer.name || t('history.walkin')} <span className="text-xs font-normal text-muted-foreground">· {inv.no}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(inv.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })} · {inv.paymentMode}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold tabular-nums text-red-600">₹{fmt(inv.totals.balance)}</p>
                    <Button size="sm" className="mt-1 h-8 bg-green-700 hover:bg-green-800 text-white text-xs" onClick={() => openReceive(inv.id, inv.totals.balance)}>
                      <IndianRupee className="size-3.5" /> {t('ledger.receive')}
                    </Button>
                  </div>
                </div>
                {receiving === inv.id && (
                  <div className="mt-2.5 space-y-2 rounded-lg border border-green-200 bg-green-50/60 p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{t('ledger.receiveAmount')}</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={inv.totals.balance}
                          value={recvAmount}
                          onChange={(e) => setRecvAmount(e.target.value)}
                          className="h-10"
                          aria-label="Amount received"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{t('ledger.receiveMode')}</Label>
                        <Select value={recvMode} onValueChange={(v) => setRecvMode(v as PaymentMode)}>
                          <SelectTrigger className="h-10" aria-label="Payment mode">
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
                    <div className="flex gap-2">
                      <Button size="sm" className="h-9 flex-1 bg-green-700 hover:bg-green-800 text-white" onClick={confirmReceive}>
                        <Wallet className="size-4" /> {t('ledger.receiveConfirm')}
                      </Button>
                      <Button size="sm" variant="outline" className="h-9" onClick={() => setReceiving(null)}>
                        {t('history.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {dues.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noDues')}</li>
            )}
          </ul>
        </div>
      )}

      {/* ---------- EXPENSES ---------- */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-3 space-y-2.5">
            <p className="text-sm font-bold text-blue-800">
              {t('ledger.monthSpent')}: <span className="tabular-nums">₹{fmt(monthSpent)}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.date')}</Label>
                <Input type="date" value={expDate} max={today} onChange={(e) => setExpDate(e.target.value)} className="h-10" aria-label="Expense date" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expCategory')}</Label>
                <Select value={expCat} onValueChange={(v) => setExpCat(v as ExpenseCategory)}>
                  <SelectTrigger className="h-10" aria-label="Expense category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expAmount')}</Label>
                <Input type="number" inputMode="decimal" min={0} value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0" className="h-10" aria-label="Expense amount" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expNote')}</Label>
                <Input value={expNote} onChange={(e) => setExpNote(e.target.value)} className="h-10" aria-label="Expense note" />
              </div>
            </div>
            <Button onClick={submitExpense} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={!(Number(expAmount) > 0)}>
              {t('ledger.addExpense')}
            </Button>
          </div>
          <ul className="space-y-1.5">
            {monthExpenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <ArrowDownRight className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{categoryLabel(e.category)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-red-600">− ₹{fmt(e.amount)}</span>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(e.id)} aria-label={`Delete expense ${e.category}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
            {monthExpenses.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noExpenses')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Badge2({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white tabular-nums">{children}</span>
  );
}
