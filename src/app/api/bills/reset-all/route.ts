import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev } from '@/lib/server/biz';

/**
 * POST /api/bills/reset-all — owner-only. Deletes EVERY bill from the
 * central database and its barcode-registry entries, and tombstones each
 * one with the same v40 mechanism as a single delete, so no stale device
 * can bring them back on its next sync. Products, settings, ledger and
 * the labour register are untouched.
 */
export async function POST(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await db.bizInvoice.findMany({ select: { id: true, no: true } });
  if (rows.length) {
    await db.bizInvoice.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    await db.verifiedBill.deleteMany({ where: { billNo: { in: rows.map((r) => r.no) } } });
    // tombstone every deleted bill — imports/syncs carrying these ids or
    // numbers are dropped server-side (same guarantee as DELETE /bills/[id])
    await db.deletedBill
      .createMany({ data: rows.map((r) => ({ id: r.id, no: r.no })), skipDuplicates: true })
      .catch(() => undefined);
  }
  const rev = await bumpRev();
  return Response.json({ ok: true, deleted: rows.length, rev });
}
