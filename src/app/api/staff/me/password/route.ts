import { db } from '@/lib/db';
import { bearerToken, hashPassword, sessionAuth, verifyPassword } from '@/lib/server/auth';

/**
 * POST /api/staff/me/password — a STAFF member changes their OWN password
 * (v35). Requires the current password; the new password is scrypt-hashed
 * server-side and the vault DEK (re-wrapped under the new password on the
 * staff's own device, which holds the key) replaces the old wrap so their
 * other logins keep working. Other sessions are NOT killed — the change is
 * seamless.
 */
export async function POST(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth || auth.role !== 'staff' || !auth.staffId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const current = String(body.currentPassword ?? '');
  const password = String(body.password ?? '');

  const staff = await db.staffUser.findUnique({ where: { id: auth.staffId } });
  if (!staff || !staff.active) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!current || !verifyPassword(current, staff.passwordHash)) {
    return Response.json({ error: 'badCredentials' }, { status: 401 });
  }
  if (password.length < 4 || password.length > 64) {
    return Response.json({ error: 'badPassword' }, { status: 400 });
  }
  const dekSalt = typeof body.dekSalt === 'string' ? body.dekSalt : '';
  const dekIv = typeof body.dekIv === 'string' ? body.dekIv : '';
  const dekWrapped = typeof body.dekWrapped === 'string' ? body.dekWrapped : '';
  if (!dekSalt || !dekIv || !dekWrapped) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  await db.staffUser.update({
    where: { id: staff.id },
    data: { passwordHash: hashPassword(password), dekSalt, dekIv, dekWrapped },
  });

  await db.auditEvent
    .create({
      data: {
        slot: 'owner',
        actor: staff.username,
        actorRole: 'staff',
        action: 'staff_password_changed',
        target: staff.username,
        detailsJson: '{}',
      },
    })
    .catch(() => undefined);

  return Response.json({ ok: true });
}
