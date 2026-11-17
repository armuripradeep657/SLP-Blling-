import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * GET  /api/config — server-authoritative billing configuration. Any
 * authenticated device (owner or staff) may READ it: staff billing needs the
 * GST rate and discount limits, and the UPI payment QR is generated from the
 * saved UPI ID everywhere.
 *
 * PUT  /api/config — OWNER ONLY (staff sessions get 403 — backend-enforced).
 * Every change is audit-logged server-side. Devices pick the change up on
 * their next poll (≤ ~5 s) so an UPI-ID or GST change appears app-wide
 * without any manual refresh.
 */

export async function GET(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
  const fallback = {
    upiId: '',
    gstPercent: 0,
    discountMaxPercent: 100,
    discountMaxAmount: 999999,
    discountApprovalRequired: false,
  };
  if (!cfg) return Response.json({ config: fallback, exists: false });
  return Response.json({
    exists: true,
    config: {
      upiId: cfg.upiId,
      gstPercent: cfg.gstPercent,
      discountMaxPercent: cfg.discountMaxPercent,
      discountMaxAmount: cfg.discountMaxAmount,
      discountApprovalRequired: cfg.discountApprovalRequired,
    },
  });
}

const num = (v: unknown, d: number, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(Math.max(Math.round(n * 100) / 100, min), max);
};

export async function PUT(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const before = await db.appConfig.findUnique({ where: { slot: 'owner' } });

  const data = {
    upiId:
      typeof body.upiId === 'string'
        ? body.upiId.trim().slice(0, 120)
        : (before?.upiId ?? ''),
    gstPercent: num(body.gstPercent, before?.gstPercent ?? 0, 0, 28),
    discountMaxPercent: num(body.discountMaxPercent, before?.discountMaxPercent ?? 100, 0, 100),
    discountMaxAmount: num(body.discountMaxAmount, before?.discountMaxAmount ?? 999999, 0, 999999),
    discountApprovalRequired:
      typeof body.discountApprovalRequired === 'boolean'
        ? body.discountApprovalRequired
        : (before?.discountApprovalRequired ?? false),
  };

  const cfg = await db.appConfig.upsert({
    where: { slot: 'owner' },
    update: data,
    create: { slot: 'owner', ...data },
  });

  // audit: WHAT changed (old → new) so the log reads like a story
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before) {
    for (const [k, v] of Object.entries(data)) {
      const oldVal = (before as unknown as Record<string, unknown>)[k];
      if (JSON.stringify(oldVal) !== JSON.stringify(v)) changes[k] = { from: oldVal, to: v };
    }
  } else {
    for (const [k, v] of Object.entries(data)) changes[k] = { from: null, to: v };
  }
  await db.auditEvent
    .create({
      data: {
        slot: 'owner',
        actor: 'Owner',
        actorRole: 'owner',
        action: 'config_changed',
        target: 'AppConfig',
        detailsJson: JSON.stringify(changes),
      },
    })
    .catch(() => undefined);

  return Response.json({ ok: true });
}
