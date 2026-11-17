import { db } from '@/lib/db';
import { clientIp, hashPassword, rateLimit } from '@/lib/server/auth';

/**
 * POST /api/staff/forgot — the owner-described reset flow: the staff member
 * CAPTURES A PHOTO of themselves (identity proof), enters their USER ID, and
 * sets a NEW PASSWORD. The photo + userId + time are logged for the owner
 * (Settings → Staff → reset history) — the owner sees exactly who reset
 * what, when. No session is issued: the staff signs in with the new password.
 */
export async function POST(req: Request) {
  if (!rateLimit(`staff-forgot:${clientIp(req)}`, 10)) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const userId = String(body.userId ?? '').trim().toUpperCase();
  const photo = String(body.photo ?? '');
  const newPassword = String(body.newPassword ?? '');
  if (!userId || !photo || newPassword.length < 3) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  if (photo.length > 400_000) return Response.json({ error: 'tooLarge' }, { status: 413 });

  const staff = await db.staffAccount.findUnique({ where: { userId } });
  if (!staff || !staff.active) return Response.json({ error: 'notFound' }, { status: 404 });

  await db.$transaction([
    db.staffAccount.update({
      where: { id: staff.id },
      data: { passwordHash: hashPassword(newPassword), mustChangePassword: false },
    }),
    db.passwordResetLog.create({
      data: { userId, name: staff.name, photoData: photo },
    }),
  ]);
  return Response.json({ ok: true });
}
