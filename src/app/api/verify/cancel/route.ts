import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * POST /api/verify/cancel — OWNER ONLY. Mark a bill cancelled: every later
 * barcode scan of its code answers CANCELLED BILL – THIS INVOICE IS NO
 * LONGER VALID. Staff sessions are rejected here (403) — backend enforcement.
 */
export async function POST(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });
  const slot = auth.slot;

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

  // audit the cancellation / re-validation — approvals are owner actions
  await db.auditEvent
    .create({
      data: {
        slot,
        actor: 'Owner',
        actorRole: 'owner',
        action: cancelled ? 'bill_cancelled' : 'bill_restored',
        target: billNo,
        detailsJson: JSON.stringify({ createdBy: bill.createdBy, total: bill.total }),
      },
    })
    .catch(() => undefined);

  return Response.json({ ok: true, billNo, cancelled });
}
