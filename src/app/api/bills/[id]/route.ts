import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev, statusOf } from '@/lib/server/biz';
import type { Invoice, PaymentMode } from '@/lib/types';

/**
 * PATCH /api/bills/[id] — mutate a CONFIRMED central bill. Every change
 * updates the full bill payload AND its barcode-registry entry, then bumps
 * the revision so all devices pick it up.
 *   {action:'pay', amount, mode}    — a dues receipt (or money-received confirm)
 *   {action:'cancel'}               — the barcode then answers CANCELLED
 *   {action:'language', language}   — bill language for re-shares
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const row = await db.bizInvoice.findUnique({ where: { id } });
  if (!row) return Response.json({ error: 'notFound' }, { status: 404 });
  const inv = JSON.parse(row.payloadJson) as Invoice;
  const action = String(body.action ?? '');

  if (action === 'pay') {
    const amount = Math.round(Number(body.amount ?? 0) * 100) / 100;
    const mode = (['Cash', 'UPI', 'Card'].includes(String(body.mode)) ? String(body.mode) : 'Cash') as PaymentMode;
    const dateISO = typeof body.dateISO === 'string' ? body.dateISO : new Date().toISOString();
    if (!(amount > 0)) return Response.json({ error: 'badRequest' }, { status: 400 });
    const paid = Math.round(Math.min(inv.totals.paid + amount, inv.totals.total) * 100) / 100;
    const added = Math.round((paid - inv.totals.paid) * 100) / 100;
    if (added <= 0) return Response.json({ ok: true, invoice: inv, rev: (await (await import('@/lib/server/biz')).ensureBizState()).rev });
    const payments = [
      ...(inv.payments ?? []),
      { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, dateISO, amount: added, mode },
    ];
    const updated: Invoice = {
      ...inv,
      status: statusOf(inv.totals.total, paid) as Invoice['status'],
      totals: { ...inv.totals, paid, balance: Math.max(inv.totals.total - paid, 0) },
      payments,
    };
    await db.bizInvoice.update({
      where: { id },
      data: { paid, balance: updated.totals.balance, status: updated.status, payloadJson: JSON.stringify(updated) },
    });
    // registry entry: payment fields only — items/amounts of the bill never move
    await db.verifiedBill.updateMany({
      where: { billNo: row.no },
      data: { paid, balance: updated.totals.balance, paymentStatus: updated.status },
    });
    const rev = await bumpRev();
    return Response.json({ ok: true, invoice: updated, rev });
  }

  if (action === 'cancel') {
    const updated: Invoice = { ...inv, cancelled: true };
    await db.bizInvoice.update({ where: { id }, data: { cancelled: true, payloadJson: JSON.stringify(updated) } });
    await db.verifiedBill.updateMany({ where: { billNo: row.no }, data: { cancelled: true } });
    const rev = await bumpRev();
    return Response.json({ ok: true, invoice: updated, rev });
  }

  if (action === 'language') {
    const lang = body.language === 'te' || body.language === 'both' ? body.language : 'en';
    const updated: Invoice = { ...inv, language: lang };
    await db.bizInvoice.update({ where: { id }, data: { payloadJson: JSON.stringify(updated) } });
    const rev = await bumpRev();
    return Response.json({ ok: true, invoice: updated, rev });
  }

  return Response.json({ error: 'badAction' }, { status: 400 });
}

/**
 * DELETE /api/bills/[id] — remove a bill from the central database AND
 * its barcode-registry entry (its barcode then answers not found).
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const row = await db.bizInvoice.findUnique({ where: { id } });
  if (!row) return Response.json({ ok: true });
  await db.bizInvoice.delete({ where: { id } });
  await db.verifiedBill.deleteMany({ where: { billNo: row.no } });
  // tombstone (v40): the deleted bill can never come back — imports and
  // syncs from stale devices carrying this id/number are dropped server-side
  await db.deletedBill
    .create({ data: { id: row.id, no: row.no } })
    .catch(() => undefined); // already tombstoned by an earlier delete
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
