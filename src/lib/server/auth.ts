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

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // stay logged in 30 days
export const MAX_CIPHERTEXT_BYTES = 6 * 1024 * 1024; // ~6 MB encrypted blob

/** Brute-force guard on /api/auth/setup and /api/auth/unlock, per IP */
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const ATTEMPT_MAX = 30;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const cur = attempts.get(key);
  if (!cur || cur.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  cur.count += 1;
  return cur.count <= ATTEMPT_MAX;
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

/** Create a fresh 30-day session for the account slot */
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
