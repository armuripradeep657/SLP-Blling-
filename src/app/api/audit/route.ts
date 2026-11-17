import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * GET /api/audit — OWNER-ONLY audit log (v35): price edits, discounts,
 * bill cancellations, staff-account and configuration changes. Newest
 * first, newest `?limit=` (default 200) rows, optionally filtered
 * `?action=`. Staff sessions get 403.
 *
 * POST /api/audit — OWNER ONLY. The owner's device records actions on data
 * that lives in the encrypted vault (product price changes, etc.) — the
 * server can never see those, so the device reports them and the server
 * stamps actor + server timestamp. Staff actions (price edits, discounts,
 * bills) are already recorded server-side at registration time, so staff
 * sessions get 403 here and cannot write ANY audit entry.
 */
export async function GET(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200) || 200, 500);
  const action = url.searchParams.get('action');
  const rows = await db.auditEvent.findMany({
    where: action ? { action } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return Response.json({
    events: rows.map((r) => ({
      id: r.id,
      actor: r.actor,
      actorRole: r.actorRole,
      action: r.action,
      target: r.target,
      details: safeParse(r.detailsJson),
      createdAt: r.createdAt,
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

  const action = String(body.action ?? '').trim().slice(0, 60);
  if (!/^[a-z_]+$/.test(action)) return Response.json({ error: 'badRequest' }, { status: 400 });

  await db.auditEvent.create({
    data: {
      slot: 'owner',
      actor: 'Owner',
      actorRole: 'owner',
      action,
      target: String(body.target ?? '').slice(0, 80),
      detailsJson: JSON.stringify(
        body.details && typeof body.details === 'object' ? body.details : {}
      ),
    },
  });

  return Response.json({ ok: true });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
