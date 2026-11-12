import { db } from '@/lib/db';

/**
 * GET /api/auth/state
 * Public probe the lock screen uses to decide between "create MPIN"
 * (first ever use) and "enter MPIN" (every later time). The salt is
 * public by design — it is useless without the owner's MPIN.
 */
export async function GET() {
  const account = await db.syncAccount.findUnique({
    where: { slot: 'owner' },
    select: { pinVerifier: true, dekSalt: true },
  });
  return Response.json({
    hasMpin: Boolean(account?.pinVerifier),
    dekSalt: account?.dekSalt ?? null,
  });
}
