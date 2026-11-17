import { db } from '@/lib/db';
import { bearerToken, hashPassword, sessionAuth, verifyPassword } from '@/lib/server/auth';

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
  const auth = await sessionAuth(bearerToken(req));
  if (!auth || auth.role !== 'owner') {
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
  // DEK material is required — password login must be able to open the vault
  const dekSalt = typeof body.dekSalt === 'string' ? body.dekSalt : '';
  const dekIv = typeof body.dekIv === 'string' ? body.dekIv : '';
  const dekWrapped = typeof body.dekWrapped === 'string' ? body.dekWrapped : '';
  if (!dekSalt || !dekIv || !dekWrapped) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const account = await db.syncAccount.findUnique({ where: { slot: 'owner' } });
  if (!account) return Response.json({ error: 'notFound' }, { status: 404 });

  if (account.ownerPasswordHash && !account.ownerPasswordIsDefault) {
    // CHANGE from a real password — proving the current one is mandatory
    if (!current || !verifyPassword(current, account.ownerPasswordHash)) {
      return Response.json({ error: 'badCredentials' }, { status: 401 });
    }
  }
  // moving OFF the seeded default password needs only the owner session
  // (the owner proved themselves with the MPIN / current login already)

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

  await db.auditEvent
    .create({
      data: {
        slot: 'owner',
        actor: updated.ownerUsername ?? 'Owner',
        actorRole: 'owner',
        action: account.ownerPasswordHash ? 'owner_password_changed' : 'owner_password_seeded',
        target: updated.ownerUsername ?? '',
        detailsJson: '{}',
      },
    })
    .catch(() => undefined);

  return Response.json({ ok: true, username: updated.ownerUsername });
}
