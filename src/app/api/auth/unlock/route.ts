import { db } from '@/lib/db';
import { clientIp, createSession, pruneSessions, rateLimit, safeEqual } from '@/lib/server/auth';

/**
 * POST /api/auth/unlock  { kekProof }
 *
 * Every login after the first: the device derives a key from the entered
 * MPIN (PBKDF2, with the public salt from /api/auth/state) and sends only
 * SHA-256 of that key. A match proves the MPIN without revealing it and
 * grants a 30-day session for the encrypted vault.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientIp(req))) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }

  let body: { kekProof?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const kekProof = body.kekProof ?? '';
  if (!/^[0-9a-f]{64}$/.test(kekProof)) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const account = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (!account?.pinVerifier) {
    // no MPIN created yet — the device should run the setup flow instead
    return Response.json({ error: 'noMpin' }, { status: 409 });
  }
  if (!safeEqual(kekProof, account.pinVerifier)) {
    return Response.json({ error: 'wrongMpin' }, { status: 401 });
  }

  await pruneSessions('owner');
  const token = await createSession('owner');
  return Response.json({ ok: true, token });
}
