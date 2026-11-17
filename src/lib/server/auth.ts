import crypto from 'crypto';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/* Server-side auth for the MPIN lock + encrypted cloud sync.          */
/*                                                                     */
/* There is NO phone number and NO OTP — the only login is the         */
/* owner's MPIN. The server never sees the MPIN itself: the phone      */
/* derives a key from it (PBKDF2) and sends only SHA-256(raw key)      */
/* as a verifier. The server compares verifiers, issues session        */
/* tokens (SHA-256-hashed at rest) and stores the encrypted data       */
/* blob — it can never read the business data (end-to-end encryption). */
/* ------------------------------------------------------------------ */

export const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // stay logged in a full year
export const MAX_CIPHERTEXT_BYTES = 6 * 1024 * 1024; // ~6 MB encrypted blob

/** Brute-force guard on /api/auth/setup and /api/auth/unlock, per IP */
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const ATTEMPT_MAX = 30;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Allow `max` events per key per window (max 0 → ATTEMPT_MAX) */
export function rateLimit(key: string, max: number = ATTEMPT_MAX): boolean {
  const now = Date.now();
  const cur = attempts.get(key);
  if (!cur || cur.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/** Constant-time hex-string compare for verifier checks */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export function genToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/* ------------------------------------------------------------------ */
/* Staff accounts — username + password (scrypt-hashed at rest)         */
/* ------------------------------------------------------------------ */

const SCRYPT_KEYLEN = 64;

/** scrypt password hash: `scrypt$<saltHex>$<hashHex>` — the password itself is never stored */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const hash = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export interface SessionAuth {
  slot: string;
  role: 'owner' | 'staff';
  staffId: string | null;
  staffName: string | null;
}

/** Validate a session token → who it belongs to (role + staff identity), or null */
export async function sessionAuth(token: string): Promise<SessionAuth | null> {
  if (!token || token.length < 32) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const role = session.role === 'staff' ? 'staff' : 'owner';
  let staffName: string | null = null;
  if (role === 'staff' && session.staffId) {
    const staff = await db.staffUser.findUnique({ where: { id: session.staffId } });
    if (!staff || !staff.active) return null; // deactivated staff lose their session instantly
    staffName = staff.name;
  }
  return { slot: session.slot, role, staffId: session.staffId, staffName };
}

/** Convenience: the session's slot when the token is a valid OWNER session */
export async function ownerSlot(token: string): Promise<string | null> {
  const auth = await sessionAuth(token);
  return auth && auth.role === 'owner' ? auth.slot : null;
}

/** The full session auth (role included) — routes use it to answer 403 for staff */
export async function requireOwner(token: string): Promise<SessionAuth | null> {
  const auth = await sessionAuth(token);
  return auth && auth.role === 'owner' ? auth : null;
}

/** Read the Bearer token from the Authorization header */
export function bearerToken(req: Request): string {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

/** Validate a session token → returns the slot it belongs to (or null) */
export async function sessionSlot(token: string): Promise<string | null> {
  if (!token || token.length < 32) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.slot;
}

/** Create a fresh session for the account slot — owner (MPIN) or staff (password) */
export async function createSession(
  slot: string,
  role: 'owner' | 'staff' = 'owner',
  staffId?: string | null
): Promise<string> {
  const token = genToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      slot,
      role,
      staffId: staffId ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

/** Housekeeping: drop expired sessions (called on login) */
export async function pruneSessions(slot: string): Promise<void> {
  await db.session
    .deleteMany({
      where: { slot, expiresAt: { lt: new Date() } },
    })
    .catch(() => undefined);
}
