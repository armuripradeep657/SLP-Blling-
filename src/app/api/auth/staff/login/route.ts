import { db } from '@/lib/db';
import { bearerToken, createSession, pruneSessions, rateLimit, sessionAuth, verifyPassword, clientIp } from '@/lib/server/auth';

/**
 * POST /api/auth/staff/login — staff sign-in {username, password}.
 *
 * Rate-limited like the MPIN gate. Returns a session token bound to the
 * staff account (role 'staff' — the backend rejects owner-only APIs for it),
 * the display name and the DEK wrapped under the staff password (wrapped by
 * the owner's device — the server never sees any key in the clear).
 *
 * GET with a staff session — re-auth material for the staff's own device
 * (page reload re-pull without retyping when the token is still fresh).
 */
export async function POST(req: Request) {
  if (!rateLimit(`stafflogin:${clientIp(req)}`)) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const staff = await db.staffUser.findUnique({ where: { username } });
  // same generic error for unknown user and wrong password — no username probing
  if (!staff || !staff.active || !verifyPassword(password, staff.passwordHash)) {
    return Response.json({ error: 'badCredentials' }, { status: 401 });
  }

  await pruneSessions(`staff:${staff.id}`);
  const token = await createSession(staff.slot, 'staff', staff.id);

  return Response.json({
    ok: true,
    token,
    role: 'staff',
    name: staff.name,
    username: staff.username,
    dekSalt: staff.dekSalt,
    dekIv: staff.dekIv,
    dekWrapped: staff.dekWrapped,
  });
}

export async function GET(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth || auth.role !== 'staff' || !auth.staffId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const staff = await db.staffUser.findUnique({ where: { id: auth.staffId } });
  if (!staff || !staff.active) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({
    ok: true,
    role: 'staff',
    name: staff.name,
    username: staff.username,
    dekSalt: staff.dekSalt,
    dekIv: staff.dekIv,
    dekWrapped: staff.dekWrapped,
  });
}
