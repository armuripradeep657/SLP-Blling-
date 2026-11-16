import { db } from '@/lib/db';
import { bearerToken, hashPassword, ownerSlot } from '@/lib/server/auth';

/**
 * OWNER-ONLY staff management (backend-enforced: staff sessions get 403).
 *
 * GET    /api/staff   — list staff (never returns hashes or key material)
 * POST   /api/staff   — create a staff account {username, password, name,
 *                         dekSalt, dekIv, dekWrapped}
 *
 * `dekWrapped` is the data key wrapped under a key derived from the staff
 * password ON THE OWNER'S DEVICE — the server stores it without ever being
 * able to open it (end-to-end encryption preserved for staff logins).
 */
export async function GET(req: Request) {
  const slot = await ownerSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const staff = await db.staffUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, name: true, active: true, createdAt: true, updatedAt: true },
  });
  return Response.json({ staff });
}

export async function POST(req: Request) {
  const slot = await ownerSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim() || username;
  const password = String(body.password ?? '');

  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return Response.json({ error: 'badUsername' }, { status: 400 });
  }
  if (password.length < 4 || password.length > 64) {
    return Response.json({ error: 'badPassword' }, { status: 400 });
  }

  const exists = await db.staffUser.findUnique({ where: { username } });
  if (exists) return Response.json({ error: 'usernameTaken' }, { status: 409 });

  const created = await db.staffUser.create({
    data: {
      slot,
      username,
      name: name.slice(0, 40),
      passwordHash: hashPassword(password),
      dekSalt: typeof body.dekSalt === 'string' ? body.dekSalt : null,
      dekIv: typeof body.dekIv === 'string' ? body.dekIv : null,
      dekWrapped: typeof body.dekWrapped === 'string' ? body.dekWrapped : null,
    },
  });

  return Response.json({
    ok: true,
    staff: { id: created.id, username: created.username, name: created.name, active: created.active },
  });
}
