import { db } from '@/lib/db';
import { hashPassword } from '@/lib/server/auth';

/* ------------------------------------------------------------------ */
/* Staff accounts (v39). The FIRST staff member is seeded silently so  */
/* the owner never has to create one by hand:                          */
/*   name     M.D.Najir                                                */
/*   user id  MDN                                                      */
/*   password mdn        (must be changed or kept at first login)      */
/*   MPIN     123456                                                   */
/* Idempotent: runs on the staff-login and staff-management routes.    */
/* ------------------------------------------------------------------ */

export const DEFAULT_STAFF = { userId: 'MDN', name: 'M.D.Najir', password: 'mdn', mpin: '123456' };

export async function ensureDefaultStaff(): Promise<void> {
  const count = await db.staffAccount.count();
  if (count > 0) return;
  await db.staffAccount.upsert({
    where: { userId: DEFAULT_STAFF.userId },
    update: {},
    create: {
      userId: DEFAULT_STAFF.userId,
      name: DEFAULT_STAFF.name,
      passwordHash: hashPassword(DEFAULT_STAFF.password),
      mpinHash: hashPassword(DEFAULT_STAFF.mpin),
      mustChangePassword: true,
    },
  });
}

/** The staff profile as the client sees it — hashes never leave the server */
export function staffProfile(s: {
  id: string;
  userId: string;
  name: string;
  photoData: string;
  mustChangePassword: boolean;
}) {
  return { id: s.id, userId: s.userId, name: s.name, photoData: s.photoData, mustChangePassword: s.mustChangePassword };
}
