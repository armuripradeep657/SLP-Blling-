import { db } from '@/lib/db';
import { bearerToken, sessionPhone } from '@/lib/server/auth';

/**
 * POST /api/auth/pin  { dekWrapped, dekSalt }   (Bearer session token)
 *
 * First-time setup: the phone generates a random data-encryption key (DEK),
 * wraps it with a key derived from phone + PIN (PBKDF2) and hands the SERVER
 * only the wrapped key + public salt. The server never receives the PIN or
 * the DEK, so business data can only ever be opened on the owner's devices.
 */
export async function POST(req: Request) {
  const phone = await sessionPhone(bearerToken(req));
  if (!phone) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { dekWrapped?: string; dekSalt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const dekWrapped = body.dekWrapped ?? '';
  const dekSalt = body.dekSalt ?? '';
  if (!dekWrapped || !dekSalt || dekWrapped.length > 4096 || dekSalt.length > 256) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const account = await db.syncAccount.findUnique({ where: { phone } });
  if (!account) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (account.dekWrapped) {
    // PIN already set on another device — it cannot be changed from here
    return Response.json({ error: 'pinExists' }, { status: 409 });
  }

  await db.syncAccount.update({ where: { phone }, data: { dekWrapped, dekSalt } });
  return Response.json({ ok: true });
}
