import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';

/** GET /api/staff/resets — the owner's audit trail of staff "Forgot password"
 *  resets (who, when, and the identity photo that was captured). */
export async function GET(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const rows = await db.passwordResetLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  return Response.json({
    ok: true,
    resets: rows.map((r) => ({ id: r.id, userId: r.userId, name: r.name, photoData: r.photoData, createdAt: r.createdAt })),
  });
}
