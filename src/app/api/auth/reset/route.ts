import { db } from '@/lib/db';
import { clientIp, createSession, pruneSessions, rateLimit } from '@/lib/server/auth';

const ZERO_VERIFIER = '0'.repeat(64);

/**
 * POST /api/auth/reset  { kekProof, dekSalt, dekWrapped }
 *
 * "Forgot MPIN" — the owner's escape hatch. The device proves it holds the
 * data key by re-wrapping THAT SAME KEY under a NEW MPIN; this endpoint then
 * replaces the account's credential chain (verifier + salt + wrapped key)
 * and hands back a session. The encrypted vault blob is NOT touched: it
 * decrypts with the same DEK that is wrapped inside the new key, so the
 * owner's data survives unchanged.
 *
 * There is deliberately no old-MPIN proof — that is the entire point of a
 * forgot-MPIN recovery. Confidentiality still rests on the end-to-end chain:
 * the vault can only be opened by whoever holds the real DEK, and the raw
 * DEK never leaves the owner's device. A stranger abusing this endpoint
 * cannot read the vault — they could only replace the credential chain, and
 * the owner's device would re-push its own data on the next sync. The route
 * is rate-limited like every other auth route.
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
  const dekSalt = body.dekSalt ?? '';
  const dekWrapped = body.dekWrapped ?? '';
  if (
    !/^[0-9a-f]{64}$/.test(kekProof) ||
    kekProof === ZERO_VERIFIER ||
    !/^[A-Za-z0-9+/=]{16,64}$/.test(dekSalt) ||
    !/^[A-Za-z0-9+/=.]{8,4096}$/.test(dekWrapped)
  ) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  // replace the credential chain, keep the encrypted data exactly as it is
  await db.syncAccount.upsert({
    where: { slot: 'owner' },
    update: { pinVerifier: kekProof, dekSalt, dekWrapped },
    create: { slot: 'owner', pinVerifier: kekProof, dekSalt, dekWrapped },
  });

  await pruneSessions('owner');
  const token = await createSession('owner');
  return Response.json({ ok: true, token });
}
