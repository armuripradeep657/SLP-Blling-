import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * POST /api/bills/reserve — atomically reserve the next bill number (v35).
 *
 * Every device calls this when a bill STARTS (first item into the cart):
 * the server bumps its counter inside a transaction and hands back a number
 * NO other device can get at the same moment. Two staff members billing
 * simultaneously therefore print different bill numbers — the old
 * local-counter race (two identical SLP-INV-1001 prints) is dead.
 *
 * `floor` = the device's own local counter. On the very first reservation
 * (server counter still 0) the counter is lifted to the device's value, so
 * an existing business keeps its numbering. Offline devices skip the call
 * and fall back to their local counter (rare, unavoidable without a wire).
 */
export async function POST(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* no body — floor stays 0 */
  }
  const floor = Math.max(Number(body.floor ?? 0) || 0, 0);

  const no = await db.$transaction(async (tx) => {
    const cfg = await tx.appConfig.findUnique({ where: { slot: 'owner' } });
    const current = Math.max(cfg?.nextBillNo ?? 0, floor);
    const next = current + 1;
    await tx.appConfig.upsert({
      where: { slot: 'owner' },
      update: { nextBillNo: next },
      create: { slot: 'owner', nextBillNo: next },
    });
    return next;
  });

  return Response.json({ ok: true, no });
}
