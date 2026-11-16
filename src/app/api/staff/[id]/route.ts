import { db } from '@/lib/db';
import { bearerToken, hashPassword, ownerSlot } from '@/lib/server/auth';

/**
 * OWNER-ONLY per-staff management (staff sessions get 403).
 *
 * PATCH  /api/staff/<id> — secure password reset {password?, name?, active?,
 *                           dekSalt?, dekIv?, dekWrapped?}: any of these can
 *                           be replaced; the password is re-hashed server-side.
 * DELETE /api/staff/<id> — remove the staff account and kill their sessions.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const slot = await ownerSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const staff = await db.staffUser.findUnique({ where: { id } });
  if (!staff) return Response.json({ error: 'notFound' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.password === 'string' && body.password.length >= 4 && body.password.length <= 64) {
    data.passwordHash = hashPassword(body.password);
  } else if (body.password !== undefined) {
    return Response.json({ error: 'badPassword' }, { status: 400 });
  }
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 40);
  if (typeof body.active === 'boolean') data.active = body.active;
  if (typeof body.dekSalt === 'string') data.dekSalt = body.dekSalt;
  if (typeof body.dekIv === 'string') data.dekIv = body.dekIv;
  if (typeof body.dekWrapped === 'string') data.dekWrapped = body.dekWrapped;

  if (Object.keys(data).length === 0) return Response.json({ error: 'badRequest' }, { status: 400 });

  const updated = await db.staffUser.update({ where: { id }, data });
  // a password reset / deactivation kills this staff member's sessions so the
  // change takes effect immediately
  if (data.passwordHash !== undefined || data.active === false) {
    await db.session.deleteMany({ where: { staffId: id } }).catch(() => undefined);
  }

  return Response.json({
    ok: true,
    staff: { id: updated.id, username: updated.username, name: updated.name, active: updated.active },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const slot = await ownerSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const staff = await db.staffUser.findUnique({ where: { id } });
  if (!staff) return Response.json({ error: 'notFound' }, { status: 404 });

  await db.session.deleteMany({ where: { staffId: id } }).catch(() => undefined);
  await db.staffUser.delete({ where: { id } });
  return Response.json({ ok: true });
}
