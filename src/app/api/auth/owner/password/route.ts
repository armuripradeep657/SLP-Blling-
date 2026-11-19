import { db } from '@/lib/db';
import { bearerToken, hashPassword, requireOwner, verifyPassword } from '@/lib/server/auth';

/**
 * POST /api/auth/owner/password — seed or change the Owner (Admin)
 * username + password (v35).
 *
 * SEED (no owner password yet): requires an owner session (the owner's own
 * unlocked device). The app calls this silently after the first MPIN unlock
 * with the documented initial credentials (Pradeep / 2125) and the vault DEK
 * re-wrapped under a key derived from that password — the server stores only
 * the scrypt hash and the wrapped key, never the password or the raw DEK.
 *
 * CHANGE: requires the CURRENT password (re-typed by the owner) plus the new
 * one and the DEK re-wrapped under the new password. The scrypt hash is
 * replaced, the "default password" nag is cleared, and open sessions survive
 * (only password-logins need the new password next time).
 */
export async function POST(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');
  const current = String(body.currentPassword ?? '');

  if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) {
    return Response.json({ error: 'badUsername' }, { status: 400 });
  }
  if (password.length < 4 || password.length > 64) {
    return Response.json({ error: 'badPassword' }, { status: 400 });
  }
  // DEK material is legacy (the encrypted vault is gone — data lives in the
  // central database); whatever the device sends is stored as-is
  const dekSalt = typeof body.dekSalt === 'string' ? body.dekSalt : '';
  const dekIv = typeof body.dekIv === 'string' ? body.dekIv : '';
  const dekWrapped = typeof body.dekWrapped === 'string' ? body.dekWrapped : '';

  const account = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (!account) return Response.json({ error: 'notFound' }, { status: 404 });

  // v54: the CURRENT password is ALWAYS mandatory when one exists — the
  // seeded default included (the owner types the old PIN/password in Settings
  // and only then may it change). Seeding a fresh account (no hash yet) still
  // needs only the owner session, exactly as before.
  if (account.ownerPasswordHash) {
    if (!current || !verifyPassword(current, account.ownerPasswordHash)) {
      return Response.json({ error: 'badCredentials' }, { status: 401 });
    }
  }

  const updated = await db.syncAccount.update({
    where: { slot: 'owner' },
    data: {
      ownerUsername: username,
      ownerPasswordHash: hashPassword(password),
      ownerDekSalt: dekSalt,
      ownerDekIv: dekIv,
      ownerDekWrapped: dekWrapped,
      ownerPasswordIsDefault: Boolean(body.isDefault) === true && !account.ownerPasswordHash,
    },
  });


  return Response.json({ ok: true, username: updated.ownerUsername });
}
