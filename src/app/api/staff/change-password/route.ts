import { db } from '@/lib/db';
import { bearerToken, requireStaff, verifyPassword, hashPassword } from '@/lib/server/auth';

/**
 * POST /api/staff/change-password — the signed-in staff member changes their
 * password. Two shapes:
 *   { action: 'keep' }                    — first login, keep the current one
 *   { current?, newPassword }             — set a new password; `current` is
 *      NOT required while mustChangePassword is set (they just logged in),
 *      and IS required afterwards.
 * Both clear mustChangePassword — the first-login prompt never nags again.
 */
export async function POST(req: Request) {
  const staff = await requireStaff(bearerToken(req));
  if (!staff) return Response.json({ error: 'unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const row = await db.staffAccount.findUnique({ where: { id: staff.id } });
  if (!row || !row.active) return Response.json({ error: 'notFound' }, { status: 404 });

  if (body.action === 'keep') {
    const updated = await db.staffAccount.update({ where: { id: staff.id }, data: { mustChangePassword: false } });
    return Response.json({ ok: true, staff: { id: updated.id, userId: updated.userId, name: updated.name, photoData: updated.photoData, mustChangePassword: updated.mustChangePassword } });
  }

  const newPassword = String(body.newPassword ?? '');
  if (newPassword.length < 3) return Response.json({ error: 'weakPassword' }, { status: 400 });
  if (!row.mustChangePassword) {
    const current = String(body.current ?? '');
    if (!current || !verifyPassword(current, row.passwordHash)) {
      return Response.json({ error: 'wrong' }, { status: 401 });
    }
  }
  const updated = await db.staffAccount.update({
    where: { id: staff.id },
    data: { passwordHash: hashPassword(newPassword), mustChangePassword: false },
  });
  return Response.json({ ok: true, staff: { id: updated.id, userId: updated.userId, name: updated.name, photoData: updated.photoData, mustChangePassword: updated.mustChangePassword } });
}
