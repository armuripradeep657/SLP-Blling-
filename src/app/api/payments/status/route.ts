import { db } from '@/lib/db';
import { bearerToken, sessionSlot } from '@/lib/server/auth';

/**
 * GET /api/payments/status?refs=SLP-1,SLP-2
 *
 * The bill screen polls this while it waits for a UPI payment. Returns the
 * payment events for the pending bill refs — a match means the money has
 * arrived and the bill can complete itself.
 */
export async function GET(req: Request) {
  const slot = await sessionSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const refs = (url.searchParams.get('refs') ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 25);

  if (refs.length === 0) return Response.json({ events: [] });

  const events = await db.paymentEvent.findMany({
    where: { billRef: { in: refs } },
    select: { billRef: true, amount: true, method: true, waStatus: true, smsStatus: true, createdAt: true },
  });

  return Response.json({ events });
}
