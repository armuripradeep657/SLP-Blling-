import crypto from 'crypto';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/* Server-side auth for the admin-only SLP Billing app.                */
/*                                                                     */
/* The only login is the ADMIN's: MPIN (verifier-based — the MPIN      */
/* itself never leaves the device) or username + password (scrypt      */
/* hashed at rest). Sessions are opaque tokens, SHA-256-hashed at      */
/* rest. All business data lives in the central Biz* tables; writes    */
/* require a valid admin session.                                      */
/* ------------------------------------------------------------------ */

export const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // stay logged in a full year

/** Brute-force guard on login endpoints, per IP */
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
/* Passwords (admin username + password gate) — scrypt-hashed at rest  */
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

/** Validate a session token → the account slot it belongs to, or null.
 *  The app is admin-only: every valid session IS an admin session. */
export async function sessionAuth(token: string): Promise<{ slot: string } | null> {
  if (!token || token.length < 32) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { slot: session.slot };
}

/** Convenience: the session's slot when the token is valid (admin-only) */
export async function requireOwner(token: string): Promise<{ slot: string } | null> {
  return sessionAuth(token);
}

/** Convenience: validate a token → the slot it belongs to (or null) —
 *  used by routes that only need the slot (payment webhooks etc.) */
export async function sessionSlot(token: string): Promise<string | null> {
  const auth = await sessionAuth(token);
  return auth?.slot ?? null;
}

/** Read the Bearer token from the Authorization header */
export function bearerToken(req: Request): string {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

/** Create a fresh admin session for the account slot */
export async function createSession(slot: string): Promise<string> {
  const token = genToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      slot,
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
