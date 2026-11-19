import { db } from '@/lib/db';
import { bearerToken, hashPassword, requireStaff } from '@/lib/server/auth';
import { staffProfile } from '@/lib/server/staff';

/** Max profile-photo payload (~200 KB base64 keeps SQLite rows small) */
const PHOTO_MAX = 200_000;

/**
 * GET /api/staff/me — the signed-in staff member's profile.
 * PATCH /api/staff/me — { photo } updates the profile photo (small data-URL),
 * { phone } updates the staff mobile number (v53 — additive, partial update:
 * only the field the request carries is written, everything else untouched).
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
    // a request may carry BOTH photo and phone — fall through when it does
    if (body.phone === undefined) return Response.json({ ok: true, staff: staffProfile(row) });
  }
  // v53: staff mobile number — the staff member edits their OWN number only.
  // Normalised to digits (max 15, ITU E.164 upper bound); "" clears the field.
  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') return Response.json({ error: 'badRequest' }, { status: 400 });
    const phone = body.phone.replace(/[^\d]/g, '').slice(-15);
    if (body.phone.trim() !== '' && phone.length < 6) return Response.json({ error: 'badPhone' }, { status: 400 });
    const row = await db.staffAccount.update({
      where: { id: staff.id },
      data: { phone: body.phone.trim() === '' ? '' : phone },
    });
    return Response.json({ ok: true, staff: staffProfile(row) });
  }
  // v55: staff quick MPIN — the staff member creates/changes their OWN 4-8
  // digit PIN here; the lock screen then accepts Staff ID + this MPIN instead
  // of the password. Hashed like every other secret; "" clears the MPIN.
  if (body.mpin !== undefined) {
    if (typeof body.mpin !== 'string') return Response.json({ error: 'badRequest' }, { status: 400 });
    const mpin = body.mpin.trim();
    if (mpin !== '' && !/^\d{4,8}$/.test(mpin)) return Response.json({ error: 'badMpin' }, { status: 400 });
    const row = await db.staffAccount.update({
      where: { id: staff.id },
      data: { mpinHash: mpin === '' ? '' : hashPassword(mpin) },
    });
    return Response.json({ ok: true, staff: staffProfile(row) });
  }
  return Response.json({ error: 'badRequest' }, { status: 400 });
}
