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
  ChevronDown,
  IndianRupee,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt, fmtShort, localDateKey, localMonthKey, paymentsOf } from '@/lib/billing';
import { useAppLang, useT } from '@/hooks/use-app-lang';
import LabourView from '@/components/LabourView';
import type { AppLanguage, ExpenseCategory, PaymentMode } from '@/lib/types';

/** sticky section chip — the Labour work page lives INSIDE the ledger now,
 *  and the last-open section survives a refresh */
const SECTION_KEY = 'slp-ledger-section';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Labour wages', 'Diesel', 'Raw material', 'Other'];

const CATEGORY_TE: Record<ExpenseCategory, string> = {
  'Labour wages': 'కూలీ వేతనాలు',
  Diesel: 'డీజిల్',
  'Raw material': 'ముడి పదార్థం',
  Other: 'ఇతర',
};

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Card'];

/** 24-hour HH:MM — matches the direct time inputs picked by the owner */
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Current local time as HH:MM — default value for the direct time inputs */
function nowHM(): string {
  return fmtTime(new Date());
}

type LedgerTab = 'day' | 'allDays' | 'income' | 'expenses' | 'dues' | 'labour';

/** One money row in the ledger — income (bill payment) or spent (expense) */
interface LedgerRow {
  time: string;
  /** raw timestamp — sort key so rows stay chronological across am/pm */
  ts: number;
  /** main line — customer name for income, category for spent */
  label: string;
  /** secondary line — invoice no / note */
  sub: string;
  amount: number;
  kind: 'in' | 'out';
  /** Cash / UPI / Card — shown as a chip on every row */
  mode?: PaymentMode;
}

function categoryLabel(c: ExpenseCategory, appLang: AppLanguage): string {
  return appLang === 'te' ? CATEGORY_TE[c] : c;
}

function modeLabel(m: PaymentMode, appLang: AppLanguage): string {
  if (appLang !== 'te') return m;
  return m === 'Cash' ? 'నగదు' : m === 'Card' ? 'కార్డ్' : m === 'Due' ? 'బాకీ' : 'UPI';
}

/** Cash / UPI / Card chip — on income and spent rows alike */
function ModeChip({ mode, appLang }: { mode?: PaymentMode; appLang: AppLanguage }) {
  if (!mode) return null;
  const cls =
    mode === 'Cash'
      ? 'bg-green-100 text-green-800'
      : mode === 'UPI'
        ? 'bg-blue-100 text-blue-800'
        : mode === 'Due'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-purple-100 text-purple-800';
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {modeLabel(mode, appLang)}
    </span>
  );
}

/** Stat card used across ledger tabs (module-level — never created during render) */
function StatCard({ label, value, kind }: { label: string; value: number; kind: 'in' | 'out' | 'net' }) {
  return (
    <div className="anim-pop rounded-xl border bg-card p-3">
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

/** Row used by the day view AND the expandable all-days detail */
function LedgerRowItem({ r, appLang, i }: { r: LedgerRow; appLang: AppLanguage; i: number }) {
  return (
    <li
      className="anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
      style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
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
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            <span className="truncate">{r.label}</span>
            <ModeChip mode={r.mode} appLang={appLang} />
          </p>
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
  );
}

export default function LedgerView() {
  const t = useT();
  const appLang = useAppLang();
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const incomes = useStore((s) => s.incomes);
  const receiveDuePayment = useStore((s) => s.receiveDuePayment);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const addIncome = useStore((s) => s.addIncome);
  const deleteIncome = useStore((s) => s.deleteIncome);
  const { toast } = useToast();

  const today = localDateKey(new Date());
  const thisMonth = localMonthKey(new Date());

  const [tab, setTab] = useState<LedgerTab>(() => {
    // sticky section across refreshes (Labour work page lives here now)
    try {
      const saved = localStorage.getItem(SECTION_KEY) as LedgerTab | null;
      if (saved && ['day', 'allDays', 'income', 'expenses', 'dues', 'labour'].includes(saved)) return saved;
    } catch {
      /* storage unavailable */
    }
    return 'day';
  });
  const selectTab = (next: LedgerTab) => {
    setTab(next);
    try {
      localStorage.setItem(SECTION_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  /* ---------------- Money aggregation ---------------- */

  // Every income / spent entry grouped by local day — feeds the day view,
  // the all-days list AND each day's expandable detail (name + Cash/UPI)
  const rowsByDay = useMemo(() => {
    const map = new Map<string, LedgerRow[]>();
    const push = (k: string, r: LedgerRow) => {
      const list = map.get(k);
      if (list) list.push(r);
      else map.set(k, [r]);
    };
    invoices.forEach((inv) => {
      paymentsOf(inv).forEach((p) => {
        const d = new Date(p.dateISO);
        push(localDateKey(d), {
          time: fmtTime(d),
          ts: d.getTime(),
          label: `${t('ledger.receivedFrom')} ${inv.customer.name || inv.no}`,
          sub: inv.no,
          amount: p.amount,
          kind: 'in',
          mode: p.mode,
        });
      });
    });
    expenses.forEach((e) => {
      const d = new Date(e.dateISO);
      push(localDateKey(d), {
        time: fmtTime(d),
        ts: d.getTime(),
        // person is the row name when given — else the category
        label: e.person ? e.person : categoryLabel(e.category, appLang),
        sub: [e.person ? categoryLabel(e.category, appLang) : '', e.note || '']
          .filter(Boolean)
          .join(' · '),
        amount: e.amount,
        kind: 'out',
        mode: e.mode,
      });
    });
    // manual income entries — money received outside a bill, with its own name
    incomes.forEach((e) => {
      const d = new Date(e.dateISO);
      push(localDateKey(d), {
        time: fmtTime(d),
        ts: d.getTime(),
        label: e.name,
        sub: '',
        amount: e.amount,
        kind: 'in',
        mode: e.mode,
      });
    });
    // newest first within each day (by real timestamp — safe across am/pm)
    map.forEach((list, k) => map.set(k, [...list].sort((a, b) => b.ts - a.ts)));
    return map;
  }, [invoices, expenses, incomes, t, appLang]);

  const dayRows = rowsByDay.get(day) ?? [];

  const moneyByDay = useMemo(() => {
    const map = new Map<string, { income: number; spent: number }>();
    rowsByDay.forEach((rows, k) => {
      const acc = { income: 0, spent: 0 };
      rows.forEach((r) => (r.kind === 'in' ? (acc.income += r.amount) : (acc.spent += r.amount)));
      map.set(k, { income: Math.round(acc.income * 100) / 100, spent: Math.round(acc.spent * 100) / 100 });
    });
    return map;
  }, [rowsByDay]);

  const dayMoney = (k: string): { income: number; spent: number } =>
    moneyByDay.get(k) ?? { income: 0, spent: 0 };

  const dues = useMemo(
    () => invoices.filter((i) => i.totals.balance > 0).sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [invoices]
  );
  const totalDue = dues.reduce((s, i) => s + i.totals.balance, 0);

  // all-days rows for the selected month
  const monthDays = useMemo(
    () =>
      [...moneyByDay.keys()]
        .filter((k) => localMonthKey(new Date(`${k}T12:00:00`)) === month)
        .sort((a, b) => b.localeCompare(a))
        .map((k) => ({ key: k, ...(moneyByDay.get(k) as { income: number; spent: number }) })),
    [moneyByDay, month]
  );

  const monthIncome = monthDays.reduce((s, d) => s + d.income, 0);
  const monthSpent = monthDays.reduce((s, d) => s + d.spent, 0);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => localMonthKey(new Date(e.dateISO)) === month)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [expenses, month]
  );

  const monthIncomes = useMemo(
    () =>
      incomes
        .filter((e) => localMonthKey(new Date(e.dateISO)) === month)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [incomes, month]
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
    toast({ title: t('ledger.receiveDone'), description: `₹${fmt(amt)} · ${modeLabel(recvMode, appLang)}` });
  };

  /* ---------------- Expense form ---------------- */
  const [expDate, setExpDate] = useState(today);
  const [expTime, setExpTime] = useState(() => nowHM());
  const [expCat, setExpCat] = useState<ExpenseCategory>('Labour wages');
  const [expPerson, setExpPerson] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPurpose, setExpPurpose] = useState('');
  const [expMode, setExpMode] = useState<PaymentMode>('Cash');

  /** Combine the picked date + time into a local ISO stamp (falls back to now) */
  const stampFrom = (d: string, hm: string): string => {
    const dt = new Date(`${d || today}T${hm || '12:00'}:00`);
    return (isNaN(dt.getTime()) ? new Date() : dt).toISOString();
  };

  const submitExpense = () => {
    const amt = Number(expAmount) || 0;
    if (amt <= 0) return;
    const person = expPerson.trim();
    const purpose = expPurpose.trim();
    // date + time inputs give local values — combine them directly
    addExpense({
      dateISO: stampFrom(expDate, expTime),
      category: expCat,
      amount: amt,
      person: person || undefined,
      note: purpose || undefined,
      mode: expMode,
    });
    setExpPerson('');
    setExpAmount('');
    setExpPurpose('');
    setExpTime(nowHM());
    toast({
      title: t('ledger.expAdded'),
      description: `${person ? `${person} · ` : ''}₹${fmt(amt)} · ${categoryLabel(expCat, appLang)} · ${modeLabel(expMode, appLang)}`,
    });
  };

  /* ---------------- Manual income form ---------------- */
  const [incDate, setIncDate] = useState(today);
  const [incTime, setIncTime] = useState(() => nowHM());
  const [incName, setIncName] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incMode, setIncMode] = useState<PaymentMode>('Cash');

  const submitIncome = () => {
    const amt = Number(incAmount) || 0;
    if (amt <= 0 || !incName.trim()) return;
    addIncome({
      dateISO: stampFrom(incDate, incTime),
      name: incName.trim(),
      amount: amt,
      mode: incMode,
    });
    setIncName('');
    setIncAmount('');
    setIncTime(nowHM());
    toast({
      title: t('ledger.incAdded'),
      description: `₹${fmt(amt)} · ${incName.trim()} · ${modeLabel(incMode, appLang)}`,
    });
  };

  const tabs: { id: LedgerTab; label: string }[] = [
    { id: 'day', label: t('ledger.day') },
    { id: 'allDays', label: t('ledger.allDays') },
    { id: 'income', label: t('ledger.income') },
    { id: 'expenses', label: t('ledger.expenses') },
    { id: 'dues', label: `${t('ledger.dues')}${totalDue > 0 ? ` (${dues.length})` : ''}` },
    { id: 'labour', label: t('ledger.labour') },
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
            onClick={() => selectTab(x.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
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
            <CalendarDays className="size-4 shrink-0 text-blue-700" />
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
              <LedgerRowItem key={`${r.time}-${r.label}-${i}`} r={r} appLang={appLang} i={i} />
            ))}
            {dayRows.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noActivity')}</li>
            )}
          </ul>
        </div>
      )}

      {/* ---------- ALL DAYS BY MONTH (tap a day for its details) ---------- */}
      {tab === 'allDays' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-blue-700" />
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value || thisMonth)} className="h-11 max-w-44" aria-label="Ledger month" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t('ledger.income')} value={monthIncome} kind="in" />
            <StatCard label={t('ledger.spent')} value={monthSpent} kind="out" />
            <StatCard label={t('ledger.net')} value={monthIncome - monthSpent} kind="net" />
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-blue-600 px-3 py-2 text-[11px] font-bold text-white">
              <span>{t('ledger.date')}</span>
              <span className="w-20 text-right">{t('ledger.income')}</span>
              <span className="w-20 text-right">{t('ledger.spent')}</span>
              <span className="w-20 text-right">{t('ledger.net')}</span>
            </div>
            <ul className="max-h-96 divide-y overflow-y-auto">
              {monthDays.map((d) => {
                const net = Math.round((d.income - d.spent) * 100) / 100;
                const dt = new Date(`${d.key}T12:00:00`);
                const open = expandedDay === d.key;
                const rows = rowsByDay.get(d.key) ?? [];
                return (
                  <li key={d.key} className={open ? 'bg-blue-50/50' : undefined}>
                    <button
                      onClick={() => setExpandedDay(open ? null : d.key)}
                      aria-expanded={open}
                      className="grid w-full grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-xs tabular-nums transition-colors hover:bg-accent/60"
                    >
                      <span className="flex items-center gap-1 font-medium">
                        <ChevronDown className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                        {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                      <span className="w-20 text-right font-semibold text-green-700">₹{fmtShort(d.income)}</span>
                      <span className="w-20 text-right font-semibold text-red-600">₹{fmtShort(d.spent)}</span>
                      <span className={`w-20 text-right font-bold ${net < 0 ? 'text-red-600' : 'text-blue-800'}`}>₹{fmtShort(net)}</span>
                    </button>
                    {/* Day detail — every income & spent entry with name + Cash/UPI */}
                    {open && (
                      <div className="anim-fade-up space-y-1 px-2.5 pb-2.5">
                        {rows.map((r, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              {r.kind === 'in' ? (
                                <ArrowUpRight className="size-3.5 shrink-0 text-green-700" />
                              ) : (
                                <ArrowDownRight className="size-3.5 shrink-0 text-red-600" />
                              )}
                              <span className="truncate text-[11px] font-medium">{r.label}</span>
                              {r.sub ? <span className="shrink-0 text-[10px] text-muted-foreground">· {r.sub}</span> : null}
                              <ModeChip mode={r.mode} appLang={appLang} />
                            </div>
                            <span className={`shrink-0 text-[11px] font-bold tabular-nums ${r.kind === 'in' ? 'text-green-700' : 'text-red-600'}`}>
                              {r.kind === 'in' ? '+' : '−'} ₹{fmtShort(r.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
                <span className="w-20 text-right text-green-700">₹{fmtShort(monthIncome)}</span>
                <span className="w-20 text-right text-red-600">₹{fmtShort(monthSpent)}</span>
                <span className="w-20 text-right text-blue-800">₹{fmtShort(monthIncome - monthSpent)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- INCOME (manual entries) ---------- */}
      {tab === 'income' && (
        <div className="space-y-3">
          <div className="space-y-2.5 rounded-xl border bg-card p-3">
            <p className="text-sm font-bold text-green-800">
              {t('ledger.monthIncome')}: <span className="tabular-nums">₹{fmt(monthIncome)}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.date')}</Label>
                <Input type="date" value={incDate} max={today} onChange={(e) => setIncDate(e.target.value)} className="h-10" aria-label="Income date" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.time')}</Label>
                <Input type="time" value={incTime} onChange={(e) => setIncTime(e.target.value)} className="h-10" aria-label="Income time" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('ledger.incName')}</Label>
              <Input value={incName} onChange={(e) => setIncName(e.target.value)} placeholder={t('ledger.incPlaceholder')} className="h-10" aria-label="Income name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expAmount')}</Label>
                <Input type="number" inputMode="decimal" min={0} value={incAmount} onChange={(e) => setIncAmount(e.target.value)} placeholder="0" className="h-10" aria-label="Income amount" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.receiveMode')}</Label>
                <Select value={incMode} onValueChange={(v) => setIncMode(v as PaymentMode)}>
                  <SelectTrigger className="h-10" aria-label="Income payment mode">
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
            <Button onClick={submitIncome} className="h-11 w-full bg-green-700 text-white hover:bg-green-800" disabled={!(Number(incAmount) > 0) || !incName.trim()}>
              {t('ledger.addIncome')}
            </Button>
          </div>
          <ul className="space-y-1.5">
            {monthIncomes.map((e, i) => (
              <li
                key={e.id}
                className="anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <ArrowUpRight className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <span className="truncate">{e.name}</span>
                      <ModeChip mode={e.mode} appLang={appLang} />
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {fmtTime(new Date(e.dateISO))}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-sm font-bold tabular-nums text-green-700">+ ₹{fmt(e.amount)}</span>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => deleteIncome(e.id)} aria-label={`Delete income ${e.name}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
            {monthIncomes.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">{t('ledger.noIncomes')}</li>
            )}
          </ul>
        </div>
      )}

      {/* ---------- DUES ---------- */}
      {/* ---------- LABOUR WORK (merged into the ledger) ---------- */}
      {tab === 'labour' && <LabourView />}

      {tab === 'dues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border bg-red-50 p-3">
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
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
                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold tabular-nums text-red-600">₹{fmt(inv.totals.balance)}</p>
                    <Button size="sm" className="mt-1 h-8 bg-green-700 text-white text-xs hover:bg-green-800" onClick={() => openReceive(inv.id, inv.totals.balance)}>
                      <IndianRupee className="size-3.5" /> {t('ledger.receive')}
                    </Button>
                  </div>
                </div>
                {receiving === inv.id && (
                  <div className="anim-fade-up mt-2.5 space-y-2 rounded-lg border border-green-200 bg-green-50/60 p-2.5">
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
                                {modeLabel(m, appLang)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-9 flex-1 bg-green-700 text-white hover:bg-green-800" onClick={confirmReceive}>
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
          <div className="space-y-2.5 rounded-xl border bg-card p-3">
            <p className="text-sm font-bold text-blue-800">
              {t('ledger.monthSpent')}: <span className="tabular-nums">₹{fmt(monthSpent)}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.date')}</Label>
                <Input type="date" value={expDate} max={today} onChange={(e) => setExpDate(e.target.value)} className="h-10" aria-label="Expense date" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.time')}</Label>
                <Input type="time" value={expTime} onChange={(e) => setExpTime(e.target.value)} className="h-10" aria-label="Expense time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expCategory')}</Label>
                <Select value={expCat} onValueChange={(v) => setExpCat(v as ExpenseCategory)}>
                  <SelectTrigger className="h-10" aria-label="Expense category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c, appLang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.expAmount')}</Label>
                <Input type="number" inputMode="decimal" min={0} value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0" className="h-10" aria-label="Expense amount" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.person')}</Label>
                <Input value={expPerson} onChange={(e) => setExpPerson(e.target.value)} placeholder={t('ledger.personPlaceholder')} className="h-10" aria-label="Expense person" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t('ledger.receiveMode')}</Label>
                <Select value={expMode} onValueChange={(v) => setExpMode(v as PaymentMode)}>
                  <SelectTrigger className="h-10" aria-label="Expense payment mode">
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
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('ledger.purpose')}</Label>
              <Input value={expPurpose} onChange={(e) => setExpPurpose(e.target.value)} placeholder={t('ledger.purposePlaceholder')} className="h-10" aria-label="Expense purpose" />
            </div>
            <Button onClick={submitExpense} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700" disabled={!(Number(expAmount) > 0)}>
              {t('ledger.addExpense')}
            </Button>
          </div>
          <ul className="space-y-1.5">
            {monthExpenses.map((e, i) => (
              <li
                key={e.id}
                className="anim-fade-up flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <ArrowDownRight className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <span className="truncate">{e.person || categoryLabel(e.category, appLang)}</span>
                      <ModeChip mode={e.mode} appLang={appLang} />
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {new Date(e.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {fmtTime(new Date(e.dateISO))}
                      {e.person ? ` · ${categoryLabel(e.category, appLang)}` : ''}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-sm font-bold tabular-nums text-red-600">− ₹{fmt(e.amount)}</span>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(e.id)} aria-label={`Delete expense ${e.person || e.category}`}>
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
    <span className="anim-badge rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold tabular-nums text-white">{children}</span>
  );
}
