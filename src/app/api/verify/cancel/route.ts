import { db } from '@/lib/db';
import { bearerToken, ownerSlot } from '@/lib/server/auth';

/**
 * POST /api/verify/cancel — OWNER ONLY. Mark a bill cancelled: every later
 * barcode scan of its code answers CANCELLED BILL – THIS INVOICE IS NO
 * LONGER VALID. Staff sessions are rejected here (403) — backend enforcement.
 */
export async function POST(req: Request) {
  const slot = await ownerSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const billNo = String(body.billNo ?? '').trim();
  const cancelled = Boolean(body.cancelled);
  if (!billNo) return Response.json({ error: 'badRequest' }, { status: 400 });

  const bill = await db.verifiedBill.findUnique({ where: { billNo } });
  if (!bill) return Response.json({ error: 'notRegistered' }, { status: 404 });

  await db.verifiedBill.update({ where: { billNo }, data: { cancelled } });
  return Response.json({ ok: true, billNo, cancelled });
}
