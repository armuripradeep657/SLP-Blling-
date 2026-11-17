import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';

/**
 * GET /api/config — server-authoritative billing configuration. Any
 * authenticated device may READ it: the UPI payment QR is generated from
 * the saved UPI ID everywhere and new bills use the central GST rate.
 * Writes go through PUT /api/settings (which mirrors UPI/GST here).
 */
export async function GET(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
  if (!cfg) return Response.json({ config: { upiId: '', gstPercent: 0 }, exists: false });
  return Response.json({
    exists: true,
    config: { upiId: cfg.upiId, gstPercent: cfg.gstPercent },
  });
}
