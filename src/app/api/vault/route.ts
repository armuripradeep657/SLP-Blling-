import { db } from '@/lib/db';
import { bearerToken, MAX_CIPHERTEXT_BYTES, sessionPhone } from '@/lib/server/auth';

/**
 * Encrypted vault — one opaque blob per mobile number.
 *
 * GET  /api/vault   → { empty: true } | { ciphertext, dataIv, dataVersion }
 * PUT  /api/vault   { ciphertext, dataIv } → { ok, dataVersion }
 *
 * The server can only store and hand back ciphertext — it has no key,
 * so it can never read bills, labour records or ledger entries.
 */
export async function GET(req: Request) {
  const phone = await sessionPhone(bearerToken(req));
  if (!phone) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const account = await db.syncAccount.findUnique({
    where: { phone },
    select: {
      ciphertext: true,
      dataIv: true,
      dataVersion: true,
      dekWrapped: true,
      dekSalt: true,
    },
  });
  if (!account) return Response.json({ error: 'unauthorized' }, { status: 401 });

  if (!account.ciphertext || !account.dataIv) {
    return Response.json({ empty: true });
  }
  return Response.json({
    ciphertext: account.ciphertext,
    dataIv: account.dataIv,
    dataVersion: account.dataVersion,
    // needed on a NEW device to unwrap the key with the owner's PIN —
    // still useless without the PIN (PBKDF2), so this stays end-to-end safe
    dekWrapped: account.dekWrapped ?? '',
    dekSalt: account.dekSalt ?? '',
  });
}

export async function PUT(req: Request) {
  const phone = await sessionPhone(bearerToken(req));
  if (!phone) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { ciphertext?: string; dataIv?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const ciphertext = body.ciphertext ?? '';
  const dataIv = body.dataIv ?? '';
  if (
    !ciphertext ||
    !dataIv ||
    ciphertext.length > MAX_CIPHERTEXT_BYTES ||
    dataIv.length > 64
  ) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const updated = await db.syncAccount.update({
    where: { phone },
    data: {
      ciphertext,
      dataIv,
      dataVersion: { increment: 1 },
    },
    select: { dataVersion: true },
  });

  return Response.json({ ok: true, dataVersion: updated.dataVersion });
}
