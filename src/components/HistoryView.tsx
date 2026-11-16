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
import { Search, Trash2, ReceiptText, FileText, IndianRupee, Truck, Ban } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmt } from '@/lib/billing';
import { useIdentity } from '@/lib/role';
import { useT } from '@/hooks/use-app-lang';
import type { Invoice } from '@/lib/types';
import type { DocView } from './InvoiceModal';

export default function HistoryView({
  onOpenInvoice,
}: {
  onOpenInvoice: (inv: Invoice, view?: DocView) => void;
}) {
  const t = useT();
  const invoices = useStore((s) => s.invoices);
  const updateInvoiceStatus = useStore((s) => s.updateInvoiceStatus);
  const deleteInvoice = useStore((s) => s.deleteInvoice);
  const cancelInvoice = useStore((s) => s.cancelInvoice);
  const identity = useIdentity();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Due' | 'Partial'>('All');

  /** STAFF see only the bills they created themselves — the owner sees all */
  const visible = useMemo(
    () =>
      identity.role === 'staff'
        ? invoices.filter((inv) => inv.createdBy && inv.createdBy !== 'Owner' && inv.createdBy === identity.name)
        : invoices,
    [invoices, identity]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((inv) => {
      const matchQ =
        !q ||
        inv.no.toLowerCase().includes(q) ||
        (inv.customer.name || '').toLowerCase().includes(q) ||
        (inv.customer.phone || '').includes(q);
      const matchS = statusFilter === 'All' || inv.status === statusFilter;
      return matchQ && matchS;
    });
  }, [visible, query, statusFilter]);

  const totalSales = visible.reduce((s, i) => s + (i.cancelled ? 0 : i.totals.total), 0);
  const totalDue = visible.reduce((s, i) => s + (i.cancelled ? 0 : i.totals.balance), 0);

  const statusLabel = (s: 'Paid' | 'Due' | 'Partial') =>
    s === 'Paid' ? t('status.paid') : s === 'Partial' ? t('status.partial') : t('status.due');

  return (
    <div className="space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="anim-pop rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('history.totalBilled')}</p>
          <p className="text-xl font-extrabold tabular-nums">₹{fmt(totalSales)}</p>
          <p className="text-[11px] text-muted-foreground">
            {invoices.length} {t('history.invoices')}
          </p>
        </div>
        <div className="anim-pop rounded-xl border bg-card p-3" style={{ animationDelay: '60ms' }}>
          <p className="text-xs text-muted-foreground">{t('history.balanceDue')}</p>
          <p className="text-xl font-extrabold tabular-nums text-red-600">₹{fmt(totalDue)}</p>
          <p className="text-[11px] text-muted-foreground">
            {invoices.filter((i) => i.status !== 'Paid').length} {t('history.pending')}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('history.search')}
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
            {s === 'All' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((inv, i) => (
          <li
            key={inv.id}
            className="anim-fade-up rounded-xl border bg-card p-3"
            style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
          >
            <button className="w-full text-left" onClick={() => onOpenInvoice(inv, 'invoice')} aria-label={`Open invoice ${inv.no}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{inv.no}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {inv.customer.name || t('history.walkin')}
                    {inv.customer.phone ? ` · ${inv.customer.phone}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold tabular-nums">₹{fmt(inv.totals.total)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(inv.dateISO).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })} · {inv.items.length} {t('history.items')}
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
                  {statusLabel(inv.status)}
                </Badge>
                {inv.cancelled && (
                  <Badge data-cancelled-badge className="bg-red-700 text-white">
                    <Ban className="size-3" /> {t('history.cancelled')}
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {inv.paymentMode} · Bal ₹{fmt(inv.totals.balance)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {identity.role === 'owner' && !inv.cancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-red-700 hover:text-red-800"
                    onClick={() => cancelInvoice(inv.id)}
                    aria-label={`Cancel bill ${inv.no}`}
                  >
                    <Ban className="size-3" /> {t('history.cancelBill')}
                  </Button>
                )}
                {!inv.cancelled && inv.status !== 'Paid' && identity.role === 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-green-700 hover:text-green-800"
                    onClick={() => updateInvoiceStatus(inv.id, inv.totals.total)}
                  >
                    <IndianRupee className="size-3" /> {t('history.markPaid')}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenInvoice(inv, 'invoice')} aria-label={`Open invoice ${inv.no}`}>
                  <FileText className="size-3" /> {t('history.invoice')}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenInvoice(inv, 'slip')} aria-label={`Open thermal slip ${inv.no}`}>
                  <ReceiptText className="size-3" /> {t('history.slip')}
                </Button>
                {inv.delivery?.delivered && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenInvoice(inv, 'driver')} aria-label={`Open driver slip ${inv.no}`}>
                    <Truck className="size-3" /> {t('history.driver')}
                  </Button>
                )}
                {identity.role === 'owner' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label={`Delete ${inv.no}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('history.deleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {inv.no} {t('history.deleteDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteInvoice(inv.id)} className="bg-destructive text-white hover:bg-destructive/90">
                        {t('history.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                )}
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-12 text-center text-sm text-muted-foreground">
            {visible.length === 0 ? t('history.noBills') : t('history.noMatch')}
          </li>
        )}
      </ul>
    </div>
  );
}
