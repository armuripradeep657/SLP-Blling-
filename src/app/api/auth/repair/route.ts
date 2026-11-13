import { db } from '@/lib/db';
import { clientIp, createSession, pruneSessions, rateLimit } from '@/lib/server/auth';

const ZERO_VERIFIER = '0'.repeat(64);

/**
 * POST /api/auth/repair  { kekProof, dekSalt, dekWrapped }
 *
 * One-time repair for accounts created before the verifier fix. Their stored
 * verifier is all zeros, so a normal unlock can never match and the owner
 * would be locked out of their own data forever. The device proves the MPIN
 * by unwrapping the stored key locally (AES-GCM auth fails for a wrong MPIN);
 * this endpoint then stores the REAL verifier and hands back a session.
 * It refuses to touch accounts that already have a real verifier.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientIp(req))) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }

  let body: { kekProof?: string; dekSalt?: string; dekWrapped?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const kekProof = body.kekProof ?? '';
  if (!/^[0-9a-f]{64}$/.test(kekProof) || kekProof === ZERO_VERIFIER) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const account = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (!account?.pinVerifier) {
    // no MPIN created yet — the device should run the setup flow instead
    return Response.json({ error: 'noMpin' }, { status: 409 });
  }
  if (account.pinVerifier !== ZERO_VERIFIER) {
    // already repaired (or a healthy account) — the normal unlock flow applies
    return Response.json({ error: 'exists' }, { status: 409 });
  }

  // sanity: the client must present the same public material the server stores
  if (
    (body.dekSalt && body.dekSalt !== account.dekSalt) ||
    (body.dekWrapped && body.dekWrapped !== account.dekWrapped)
  ) {
    return Response.json({ error: 'wrongMpin' }, { status: 401 });
  }

  await db.syncAccount.update({
    where: { slot: 'owner' },
    data: { pinVerifier: kekProof },
  });

  await pruneSessions('owner');
  const token = await createSession('owner');
  return Response.json({ ok: true, token });
}
