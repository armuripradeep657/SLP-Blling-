import { db } from '@/lib/db';

/** Verifier stored by the pre-fix app: the broken digest buffer made EVERY proof all zeros */
export const ZERO_VERIFIER = '0'.repeat(64);

/**
 * GET /api/auth/state
 * Public probe the lock screen uses to decide between "create MPIN"
 * (first ever use) and "enter MPIN" (every later time). The salt is
 * public by design — it is useless without the owner's MPIN.
 *
 * Legacy accounts (created before the verifier fix) carry an all-zero
 * verifier: a normal unlock could never match it. For those the probe also
 * returns the wrapped key so the device can prove the MPIN by unwrapping it
 * locally and then repair the verifier through /api/auth/repair — the owner
 * keeps the SAME MPIN and never has to create a new one.
 */
export async function GET() {
  const account = await db.syncAccount.findUnique({
    where: { slot: 'owner' },
    select: { pinVerifier: true, dekSalt: true, dekWrapped: true },
  });
  const legacy = Boolean(account?.pinVerifier) && account?.pinVerifier === ZERO_VERIFIER;
  return Response.json({
    hasMpin: Boolean(account?.pinVerifier),
    dekSalt: account?.dekSalt ?? null,
    ...(legacy ? { legacy: true, dekWrapped: account?.dekWrapped ?? null } : {}),
  });
}
