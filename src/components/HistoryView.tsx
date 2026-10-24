'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Trash2, ReceiptText, IndianRupee } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt } from '@/lib/billing';
import type { Invoice } from '@/lib/types';

export default function HistoryView({ onOpenInvoice }: { onOpenInvoice: (inv: Invoice) => void }) {
  const invoices = useStore((s) => s.invoices);
  const updateInvoiceStatus = useStore((s) => s.updateInvoiceStatus);
  const deleteInvoice = useStore((s) => s.deleteInvoice);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Due' | 'Partial'>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchQ =
        !q ||
        inv.no.toLowerCase().includes(q) ||
        (inv.customer.name || '').toLowerCase().includes(q) ||
        (inv.customer.phone || '').includes(q);
      const matchS = statusFilter === 'All' || inv.status === statusFilter;
      return matchQ && matchS;
    });
  }, [invoices, query, statusFilter]);

  const totalSales = invoices.reduce((s, i) => s + i.totals.total, 0);
  const totalDue = invoices.reduce((s, i) => s + i.totals.balance, 0);

  return (
    <div className="space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total billed</p>
          <p className="text-xl font-extrabold tabular-nums">₹{fmt(totalSales)}</p>
          <p className="text-[11px] text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Balance due</p>
          <p className="text-xl font-extrabold tabular-nums text-red-600">₹{fmt(totalDue)}</p>
          <p className="text-[11px] text-muted-foreground">{invoices.filter((i) => i.status !== 'Paid').length} pending</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by invoice, customer or phone…"
          className="h-11 pl-9 rounded-xl"
          aria-label="Search invoices"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
        {(['All', 'Paid', 'Due', 'Partial'] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'border bg-card hover:bg-accent'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((inv) => (
          <li key={inv.id} className="rounded-xl border bg-card p-3">
            <button className="w-full text-left" onClick={() => onOpenInvoice(inv)} aria-label={`Open invoice ${inv.no}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{inv.no}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {inv.customer.name || 'Walk-in customer'}
                    {inv.customer.phone ? ` · ${inv.customer.phone}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold tabular-nums">₹{fmt(inv.totals.total)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(inv.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })} · {inv.items.length} items
                  </p>
                </div>
              </div>
            </button>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={inv.status === 'Paid' ? 'default' : inv.status === 'Partial' ? 'secondary' : 'destructive'}
                  className={
                    inv.status === 'Paid'
                      ? 'bg-green-700 text-white'
                      : inv.status === 'Partial'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                  }
                >
                  {inv.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {inv.paymentMode} · Bal ₹{fmt(inv.totals.balance)}
                </span>
              </div>
              <div className="flex gap-1">
                {inv.status !== 'Paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-green-700 hover:text-green-800"
                    onClick={() => updateInvoiceStatus(inv.id, inv.totals.total)}
                  >
                    <IndianRupee className="size-3" /> Mark Paid
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenInvoice(inv)}>
                  <ReceiptText className="size-3" /> Slip
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label={`Delete ${inv.no}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                      <AlertDialogDescription>{inv.no} will be removed permanently.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteInvoice(inv.id)} className="bg-destructive text-white hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-12 text-center text-sm text-muted-foreground">
            {invoices.length === 0 ? 'No bills yet. Complete your first bill from the Bill tab.' : 'No invoices match your search.'}
          </li>
        )}
      </ul>
    </div>
  );
}
