'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Bell,
  BellOff,
  Download,
  FileText,
  Loader2,
  Radio,
  ScrollText,
  Search,
  TriangleAlert,
} from 'lucide-react';
import InvoiceModal, { type DocView } from './InvoiceModal';
import { apiAuditGet, apiBillsGet, apiNotificationsGet, apiNotificationsRead, type AuditRow, type BillRecord } from '@/lib/cloud';
import { useStore } from '@/lib/store';
import { fmt } from '@/lib/billing';
import { useT } from '@/hooks/use-app-lang';
import type { Invoice, StaffNotification } from '@/lib/types';

/**
 * ADMIN DASHBOARD (owner-only) — the complete staff-billing monitor (v35).
 *
 * Everything here reads the CENTRALIZED server database (the barcode bill
 * registry + notifications + audit log), polled every few seconds, so a bill
 * a staff member just saved on another phone appears here WITHOUT any
 * manual refresh:
 *
 *   • Notifications — one per successful staff bill ("New Bill Created" with
 *     staff name, bill no, customer, total, discount, payment status, time).
 *     A failed save can never notify (the server creates the notification
 *     only when the bill row is actually written), duplicates are impossible
 *     (unique index), unread count on the nav, click → the full bill.
 *   • Live staff activity — the newest staff bills as they land.
 *   • Staff Billing Activity — search by bill no / customer / staff, filter
 *     by staff member and date range, per-staff sales + discount totals,
 *     high-discount flags, CSV export, view/download the invoice.
 *   • Audit log — price edits, discounts, cancellations, staff and config
 *     changes, all recorded server-side.
 *
 * Staff sessions never reach this tab (nav + backend both enforce it), and
 * the underlying bill rows are immutable for clients — staff cannot hide,
 * delete or modify saved billing records.
 */

const POLL_MS = 6000;

/** A registry row → the full Invoice shape the bill viewer already renders */
function recordToInvoice(rec: BillRecord): Invoice {
  const itemDiscounts = rec.items.reduce((s, it) => s + (it.discount || 0), 0);
  return {
    id: `reg-${rec.code}`,
    no: rec.billNo,
    dateISO: rec.billDateISO,
    customer: { name: rec.customerName, phone: '', address: '' },
    items: rec.items.map((it, i) => ({
      key: `reg-${rec.code}-${i}`,
      productId: 'registry',
      name: it.name,
      size: it.size,
      price: it.price,
      origPrice: it.origPrice,
      qty: it.qty,
      discount: it.discount,
      discountType: it.discountType === 'percent' ? 'percent' : 'amount',
      discountValue: it.discountValue ?? it.discount,
    })),
    totals: {
      subtotal: rec.subtotal,
      itemDiscounts: Math.round(itemDiscounts * 100) / 100,
      discount: rec.discount,
      labourCharge: rec.labourCharge,
      autoCharge: rec.autoCharge,
      roundOff: 0,
      gst: rec.gstAmount,
      total: rec.total,
      paid: rec.paid,
      balance: rec.balance,
    },
    discountType: 'amount',
    discountValue: 0,
    labourCharge: rec.labourCharge,
    autoCharge: rec.autoCharge,
    paymentMode: rec.paymentMode as Invoice['paymentMode'],
    language: 'en',
    status: (rec.paymentStatus === 'Paid' ? 'Paid' : rec.paymentStatus === 'Partial' ? 'Partial' : 'Due'),
    verifyCode: rec.code,
    createdBy: rec.createdBy,
    cancelled: rec.cancelled,
  };
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminDashboard() {
  const t = useT();
  const unreadStore = useStore((s) => s.unreadNotifs);
  const setUnreadStore = useStore((s) => s.setUnreadNotifs);

  const [notifs, setNotifs] = useState<StaffNotification[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [staffTotals, setStaffTotals] = useState<Array<{ staff: string; bills: number; sales: number; discounts: number }>>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [detail, setDetail] = useState<BillRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [docView, setDocView] = useState<DocView>('invoice');

  const liveRef = useRef(true);
  const pollRef = useRef<() => void>(() => undefined);

  const refresh = useCallback(async () => {
    const [n, b] = await Promise.all([
      apiNotificationsGet(),
      apiBillsGet({
        q: q.trim() || undefined,
        staff: staffFilter !== 'all' ? staffFilter : undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    ]);
    if (n) {
      setNotifs(n.notifications);
      setUnreadStore(n.unread);
    }
    if (b) {
      setBills(b.bills);
      setStaffTotals(b.staffTotals);
    }
    setLoading(false);
  }, [q, staffFilter, from, to, setUnreadStore]);

  const refreshAudit = useCallback(async () => {
    setAudit(await apiAuditGet(60));
  }, []);

  useEffect(() => {
    pollRef.current = () => {
      void refresh();
    };
  }, [refresh]);

  useEffect(() => {
    // deferred one tick — an immediate async setState in the effect body
    // would cascade renders before the first paint
    const t0 = setTimeout(() => {
      void refresh();
      void refreshAudit();
    }, 0);
    const iv = setInterval(() => {
      if (liveRef.current && document.visibilityState === 'visible') pollRef.current();
    }, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') pollRef.current();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t0);
      liveRef.current = false;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh, refreshAudit]);

  const markAllRead = async () => {
    const res = await apiNotificationsRead();
    if (res.ok && res.unread !== undefined) setUnreadStore(res.unread);
    setNotifs((rows) => rows.map((r) => ({ ...r, readAt: r.readAt ?? new Date().toISOString() })));
  };

  const openBill = async (rec: BillRecord) => {
    setDetail(rec);
    setDocView('invoice');
    setDetailOpen(true);
    // opening a bill from a notification marks that notification read
    const n = notifs.find((x) => x.billNo === rec.billNo && !x.readAt);
    if (n) {
      const res = await apiNotificationsRead([n.id]);
      if (res.ok && res.unread !== undefined) setUnreadStore(res.unread);
      setNotifs((rows) => rows.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
  };

  const exportCsv = () => {
    const header = [
      'Bill No', 'Date', 'Staff', 'Customer', 'Items', 'Subtotal', 'Item Discounts',
      'Bill Discount', 'GST %', 'GST', 'Total', 'Paid', 'Balance', 'Mode', 'Status',
      'Cancelled', 'Verify Code',
    ];
    const rows = bills.map((b) =>
      [
        b.billNo,
        new Date(b.billDateISO).toLocaleString('en-IN'),
        b.createdBy,
        b.customerName,
        b.items.map((it) => `${it.name} x${it.qty}`).join('; '),
        b.subtotal,
        Math.round((b.items.reduce((s, it) => s + (it.discount || 0), 0)) * 100) / 100,
        b.discount,
        b.gstPercent,
        b.gstAmount,
        b.total,
        b.paid,
        b.balance,
        b.paymentMode,
        b.paymentStatus,
        b.cancelled ? 'YES' : 'NO',
        b.code,
      ].map(csvEscape).join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slp-staff-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  /** live feed — the newest staff-created bills, own table */
  const liveFeed = useMemo(
    () => bills.filter((b) => b.createdBy && b.createdBy !== 'Owner').slice(0, 8),
    [bills]
  );

  const timeStr = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5" data-dashboard>
      {/* ---------- notifications ---------- */}
      <section aria-label="Notifications" className="space-y-2" data-notifications>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
            <Bell className="size-4" />
            {t('dash.notifications')}
            {unreadStore > 0 && (
              <span data-unread-count className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadStore} {t('dash.unread')}
              </span>
            )}
          </h3>
          {notifs.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => void markAllRead()}>
              <BellOff className="size-3.5" /> {t('dash.markAllRead')}
            </Button>
          )}
        </div>
        {notifs.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">{t('dash.noBills')}</p>
        ) : (
          <ul className="space-y-2">
            {notifs.slice(0, 12).map((n) => (
              <li key={n.id} data-notification={n.billNo}>
                <button
                  onClick={() => {
                    const rec = bills.find((b) => b.billNo === n.billNo);
                    if (rec) void openBill(rec);
                    else if (!n.readAt) void apiNotificationsRead([n.id]).then(() => refresh());
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-accent ${
                    n.readAt ? 'bg-card' : 'border-blue-300 bg-blue-50/60'
                  }`}
                  aria-label={`Notification ${n.billNo}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
                      {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-blue-600" />}
                      {n.type === 'approval' ? (
                        <span className="flex items-center gap-1 text-red-700">
                          <TriangleAlert className="size-3.5" /> {t('dash.approvalNotif')}
                        </span>
                      ) : (
                        t('dash.newBillNotif')
                      )}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeStr(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('dash.staff')}: <b className="text-neutral-800">{n.staffName}</b>
                    {n.staffUsername ? ` (@${n.staffUsername})` : ''} · {t('dash.billNo')}: <b className="font-mono text-neutral-800">{n.billNo}</b>
                    {n.customerName ? ` · ${t('dash.customer')}: ${n.customerName}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('dash.total')}: <b className="tabular-nums text-neutral-800">₹{fmt(n.total)}</b>
                    {n.discount > 0 ? ` · ${t('dash.discount')}: ₹${fmt(n.discount)}` : ''} ·{' '}
                    {n.paymentStatus}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- live staff activity ---------- */}
      <section aria-label="Live staff activity" className="space-y-2" data-live-feed>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
          <Radio className="size-4" />
          {t('dash.liveFeed')}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
            <Activity className="size-3" />
            {t('dash.syncLive')}
          </span>
        </h3>
        {liveFeed.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">{t('dash.auditEmpty')}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5">{t('dash.date')}</th>
                  <th className="px-2 py-1.5">{t('dash.staff')}</th>
                  <th className="px-2 py-1.5">{t('dash.newBillNotif')}</th>
                  <th className="px-2 py-1.5 text-right">{t('dash.total')}</th>
                </tr>
              </thead>
              <tbody>
                {liveFeed.map((b) => (
                  <tr key={b.code} className="border-t">
                    <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                      {timeStr(b.billDateISO)}
                    </td>
                    <td className="px-2 py-1.5 font-semibold text-neutral-800">{b.createdBy}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground">{b.billNo}</td>
                    <td className="px-2 py-1.5 text-right font-bold tabular-nums">₹{fmt(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- staff billing activity ---------- */}
      <section aria-label="Staff billing activity" className="space-y-3" data-staff-activity>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
          <ScrollText className="size-4" />
          {t('dash.staffActivity')}
        </h3>

        {/* filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('dash.search')}
            className="h-10 pl-9 rounded-xl"
            aria-label="Search bills"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="h-10" aria-label="Filter by staff">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dash.allStaff')}</SelectItem>
              {staffTotals.map((s) => (
                <SelectItem key={s.staff} value={s.staff}>
                  {s.staff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className="h-10" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className="h-10" />
          <Button variant="outline" className="h-10" onClick={exportCsv} aria-label="Export CSV">
            <Download className="size-4" /> {t('dash.exportCsv')}
          </Button>
        </div>

        {/* per-staff totals */}
        {staffTotals.length > 0 && (
          <div className="grid grid-cols-2 gap-2" data-staff-totals>
            {staffTotals.map((s) => (
              <div key={s.staff} className="rounded-xl border bg-card p-3">
                <p className="truncate text-xs font-bold text-neutral-800">{s.staff}</p>
                <p className="text-lg font-extrabold tabular-nums">₹{fmt(s.sales)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.bills} {t('dash.bills')} · {t('dash.totalDiscounts')} ₹{fmt(s.discounts)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* bills table */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : bills.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">{t('dash.noBills')}</p>
        ) : (
          <ul className="space-y-2">
            {bills.map((b) => (
              <li key={b.code} data-bill-row={b.billNo} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => void openBill(b)} aria-label={`Open bill ${b.billNo}`}>
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                      <span className="font-mono">{b.billNo}</span>
                      {b.cancelled && <Badge className="bg-red-700 text-white">{t('dash.cancelled')}</Badge>}
                      {!b.cancelled && b.highDiscount && (
                        <Badge data-high-discount className="bg-amber-500 text-white">
                          <TriangleAlert className="size-3" /> {t('dash.highDiscount')}
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.createdBy}
                      {b.createdById ? ` (@${b.createdById})` : ''} · {b.customerName || '—'} ·{' '}
                      {new Date(b.billDateISO).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {b.items.length} {t('dash.items')}
                    </p>
                  </button>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold tabular-nums">₹{fmt(b.total)}</p>
                    {b.discount > 0 ? (
                      <p className="text-[10px] font-semibold text-red-600">
                        {t('dash.discount')} ₹{fmt(b.discount)}
                      </p>
                    ) : null}
                    <div className="mt-1 flex justify-end gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => void openBill(b)}>
                        <FileText className="size-3" /> {t('dash.viewBill')}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- audit log ---------- */}
      <section aria-label="Audit log" className="space-y-2" data-audit-log>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800">
          <ScrollText className="size-4" />
          {t('dash.auditLog')}
        </h3>
        {audit.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">{t('dash.auditEmpty')}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5">{t('dash.date')}</th>
                  <th className="px-2 py-1.5">{t('dash.staff')}</th>
                  <th className="px-2 py-1.5">Action</th>
                  <th className="px-2 py-1.5">Target</th>
                </tr>
              </thead>
              <tbody>
                {audit.slice(0, 25).map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="font-semibold text-neutral-800">{a.actor}</span>
                      {a.actorRole === 'staff' && <Badge className="ml-1 bg-blue-600 text-white">staff</Badge>}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-neutral-700">{a.action}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground">{a.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- bill viewer — the same invoice document + PNG download ---------- */}
      <InvoiceModal
        invoice={detail ? recordToInvoice(detail) : null}
        open={detailOpen}
        view={docView}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) void refreshAudit(); // new audit rows (approvals) appear on close
        }}
      />
    </div>
  );
}
