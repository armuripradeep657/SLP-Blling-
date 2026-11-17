import { db } from '@/lib/db';
import {
  bearerToken,
  clientIp,
  createSession,
  pruneSessions,
  rateLimit,
  verifyPassword,
} from '@/lib/server/auth';
import { sessionAuth } from '@/lib/server/auth';

/**
 * POST /api/auth/owner/login — the Owner/Admin username + password gate
 * (v35), alongside the existing MPIN unlock. Initial credentials seeded by
 * the app: Pradeep / 2125 — the owner is nudged to change the password.
 *
 * The password is scrypt-hashed at rest (never stored or logged in the
 * clear); login is rate-limited like every other gate. On success the
 * session is bound to role 'owner' and the vault DEK wrapped under a key
 * derived (PBKDF2) from THIS password is returned so the device can open
 * the encrypted vault — the raw password and key never touch the server.
 *
 * GET with an owner session — whether the default password is still in use
 * (the UI nags until the owner changes it).
 */
export async function POST(req: Request) {
  if (!rateLimit(`ownerlogin:${clientIp(req)}`)) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');

  const account = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (!account?.ownerUsername || !account.ownerPasswordHash) {
    // the owner password is seeded on the owner's first MPIN unlock — it may
    // not exist yet on a brand-new deployment before that
    return Response.json({ error: 'noOwnerPassword' }, { status: 401 });
  }
  // same generic answer for unknown username and wrong password
  if (
    username.toLowerCase() !== account.ownerUsername.toLowerCase() ||
    !verifyPassword(password, account.ownerPasswordHash)
  ) {
    return Response.json({ error: 'badCredentials' }, { status: 401 });
  }

  await pruneSessions('owner');
  const token = await createSession('owner', 'owner');

  return Response.json({
    ok: true,
    token,
    role: 'owner',
    username: account.ownerUsername,
    passwordIsDefault: account.ownerPasswordIsDefault,
    dekSalt: account.ownerDekSalt,
    dekIv: account.ownerDekIv,
    dekWrapped: account.ownerDekWrapped,
  });
}

export async function GET(req: Request) {
  const slot = await ownerSlotSafe(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const account = await db.syncAccount.findUnique({
    where: { slot: 'owner' },
    select: { ownerUsername: true, ownerPasswordIsDefault: true },
  });
  return Response.json({
    ok: true,
    username: account?.ownerUsername ?? null,
    passwordIsDefault: account?.ownerPasswordIsDefault ?? false,
  });
}

/** ownerSlot without a cycle — local copy of the role check */
async function ownerSlotSafe(token: string): Promise<string | null> {
  const auth = await sessionAuth(token);
  return auth && auth.role === 'owner' ? auth.slot : null;
}
