import { db } from '@/lib/db';
import { clientIp, createSession, pruneSessions, rateLimit, safeEqual } from '@/lib/server/auth';

/**
 * POST /api/auth/setup  { dekWrapped, dekSalt, kekProof }
 *
 * FIRST-EVER use only: the owner creates their MPIN on this device. The
 * device generates the data key (DEK), wraps it with a key derived from
 * the MPIN and sends ONLY the wrapped key + public salt + a verifier
 * (SHA-256 of the derived key). The MPIN itself never leaves the phone.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientIp(req))) {
    return Response.json({ error: 'rateLimited' }, { status: 429 });
  }

  let body: { dekWrapped?: string; dekSalt?: string; kekProof?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const dekWrapped = body.dekWrapped ?? '';
  const dekSalt = body.dekSalt ?? '';
  const kekProof = body.kekProof ?? '';
  if (
    !dekWrapped ||
    dekWrapped.length > 512 ||
    !dekSalt ||
    dekSalt.length > 64 ||
    !/^[0-9a-f]{64}$/.test(kekProof)
  ) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const existing = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (existing?.pinVerifier) {
    // another device already created the MPIN — this device must enter it instead
    return Response.json({ error: 'exists' }, { status: 409 });
  }

  if (existing) {
    await db.syncAccount.update({
      where: { slot: 'owner' },
      data: { pinVerifier: kekProof, dekWrapped, dekSalt },
    });
  } else {
    await db.syncAccount.create({
      data: { slot: 'owner', pinVerifier: kekProof, dekWrapped, dekSalt },
    });
  }
  await pruneSessions('owner');
  const token = await createSession('owner');
  return Response.json({ ok: true, token });
}
