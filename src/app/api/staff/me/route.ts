import { db } from '@/lib/db';
import { bearerToken, requireStaff } from '@/lib/server/auth';
import { staffProfile } from '@/lib/server/staff';

/** Max profile-photo payload (~200 KB base64 keeps SQLite rows small) */
const PHOTO_MAX = 200_000;

/**
 * GET /api/staff/me — the signed-in staff member's profile.
 * PATCH /api/staff/me — { photo } updates the profile photo (small data-URL).
 */
export async function GET(req: Request) {
  const staff = await requireStaff(bearerToken(req));
  if (!staff) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const row = await db.staffAccount.findUnique({ where: { id: staff.id } });
  if (!row) return Response.json({ error: 'notFound' }, { status: 404 });
  return Response.json({ ok: true, staff: staffProfile(row) });
}

export async function PATCH(req: Request) {
  const staff = await requireStaff(bearerToken(req));
  if (!staff) return Response.json({ error: 'unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  if (typeof body.photo === 'string' && body.photo.length > 0) {
    if (body.photo.length > PHOTO_MAX) return Response.json({ error: 'tooLarge' }, { status: 413 });
    const row = await db.staffAccount.update({ where: { id: staff.id }, data: { photoData: body.photo } });
    return Response.json({ ok: true, staff: staffProfile(row) });
  }
  return Response.json({ error: 'badRequest' }, { status: 400 });
}
