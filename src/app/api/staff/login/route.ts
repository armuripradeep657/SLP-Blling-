import { db } from '@/lib/db';
import { bearerToken, createStaffSession, pruneStaffSessions, rateLimit, clientIp, verifyPassword } from '@/lib/server/auth';
import { ensureDefaultStaff, staffProfile } from '@/lib/server/staff';

/**
 * POST /api/staff/login — { userId, secret } where secret is the staff
 * password OR their numeric MPIN (both are accepted; whichever matches).
 * Returns the session token + profile with mustChangePassword so the app
 * can prompt for the first-login change.
 */
export async function POST(req: Request) {
  if (!rateLimit(`staff-login:${clientIp(req)}`)) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  await ensureDefaultStaff();

  const userId = String(body.userId ?? '').trim().toUpperCase();
  const secret = String(body.secret ?? '');
  if (!userId || !secret) return Response.json({ error: 'badRequest' }, { status: 400 });

  const staff = await db.staffAccount.findUnique({ where: { userId } });
  if (!staff || !staff.active) return Response.json({ error: 'wrong' }, { status: 401 });

  const okPassword = verifyPassword(secret, staff.passwordHash);
  const okMpin = !okPassword && staff.mpinHash.length > 0 && /^\d{4,8}$/.test(secret) && verifyPassword(secret, staff.mpinHash);
  if (!okPassword && !okMpin) return Response.json({ error: 'wrong' }, { status: 401 });

  await pruneStaffSessions(staff.id);
  const token = await createStaffSession(staff.id);
  return Response.json({ ok: true, token, staff: staffProfile(staff) });
}
