import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';

/**
 * DELETE /api/staff/[id] — the owner removes a staff member. Their sessions
 * die with the account (cascade); the reset logs stay for the audit trail.
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const row = await db.staffAccount.findUnique({ where: { id } });
  if (!row) return Response.json({ ok: true });
  await db.staffAccount.delete({ where: { id } });
  return Response.json({ ok: true });
}
