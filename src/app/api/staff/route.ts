import { db } from '@/lib/db';
import { bearerToken, requireOwner, hashPassword } from '@/lib/server/auth';
import { ensureDefaultStaff } from '@/lib/server/staff';

/**
 * GET /api/staff — the owner's staff list (first staff member is seeded
 * silently on the first call). POST /api/staff — create a staff member
 * { name, userId, password, mpin? }.
 */
export async function GET(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  await ensureDefaultStaff();
  const rows = await db.staffAccount.findMany({ orderBy: { createdAt: 'asc' } });
  return Response.json({
    ok: true,
    staff: rows.map((s) => ({ id: s.id, userId: s.userId, name: s.name, photoData: s.photoData, mustChangePassword: s.mustChangePassword, active: s.active, phone: s.phone, createdAt: s.createdAt })),
  });
}

export async function POST(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const name = String(body.name ?? '').trim();
  const userId = String(body.userId ?? '').trim().toUpperCase();
  const password = String(body.password ?? '');
  const mpin = String(body.mpin ?? '').trim();
  if (!name || !userId || password.length < 3) return Response.json({ error: 'badRequest' }, { status: 400 });
  const exists = await db.staffAccount.findUnique({ where: { userId } });
  if (exists) return Response.json({ error: 'exists' }, { status: 409 });
  const created = await db.staffAccount.create({
    data: {
      name,
      userId,
      passwordHash: hashPassword(password),
      mpinHash: /^\d{4,8}$/.test(mpin) ? hashPassword(mpin) : '',
      mustChangePassword: true,
    },
  });
  return Response.json({ ok: true, staff: { id: created.id, userId: created.userId, name: created.name, photoData: created.photoData, mustChangePassword: created.mustChangePassword, active: created.active, createdAt: created.createdAt } });
}
