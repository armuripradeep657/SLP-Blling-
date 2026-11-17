import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * OWNER-ONLY admin notifications (v35).
 *
 * GET  /api/notifications — the notification feed: every successful STAFF
 *      bill arrives here automatically (created server-side at registration
 *      time — a bill that failed to save can never notify), newest first,
 *      with the unread count. `?since=<ISO>` returns only newer rows (the
 *      dashboard's live feed polls with it).
 *
 * POST /api/notifications — mark rows read: {ids: [...]} or {all: true}.
 */
export async function GET(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const since = url.searchParams.get('since');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100) || 100, 200);

  const where = since && !Number.isNaN(new Date(since).getTime())
    ? { createdAt: { gt: new Date(since) } }
    : {};
  const [rows, unread] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    db.notification.count({ where: { readAt: null } }),
  ]);

  return Response.json({
    unread,
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      billNo: n.billNo,
      staffName: n.staffName,
      staffUsername: n.staffUsername,
      customerName: n.customerName,
      total: n.total,
      discount: n.discount,
      paymentStatus: n.paymentStatus,
      payload: safeParse(n.payloadJson),
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter((x) => typeof x === 'string') : [];
  if (body.all === true) {
    await db.notification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  } else if (ids.length > 0) {
    await db.notification.updateMany({ where: { id: { in: ids } }, data: { readAt: new Date() } });
  } else {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const unread = await db.notification.count({ where: { readAt: null } });
  return Response.json({ ok: true, unread });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
