import crypto from 'crypto';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/* Server-side auth for the OTP lock + encrypted cloud sync.           */
/* The server NEVER sees the PIN or the encryption key — it only       */
/* stores SHA-256 hashes of OTPs / session tokens and the encrypted    */
/* data blob the phone sends it (end-to-end encryption).               */
/* ------------------------------------------------------------------ */

export const OTP_TTL_MS = 5 * 60 * 1000; // OTP valid 5 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong tries before the OTP is killed
export const OTP_RESEND_MIN_MS = 20 * 1000; // server-side resend cooldown
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000; // rolling hour
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // stay logged in 30 days
export const MAX_CIPHERTEXT_BYTES = 6 * 1024 * 1024; // ~6 MB encrypted blob

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function genOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function genToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Indian mobile → 10 digits (strips +91 / 91 / 0 prefixes and spaces) */
export function normalizePhone(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');
  let p = d;
  if (p.length > 10 && p.startsWith('91')) p = p.slice(2);
  if (p.length === 11 && p.startsWith('0')) p = p.slice(1);
  return p.length === 10 ? p : '';
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

/** Read the Bearer token from the Authorization header */
export function bearerToken(req: Request): string {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

/** Validate a session token → returns the phone it belongs to (or null) */
export async function sessionPhone(token: string): Promise<string | null> {
  if (!token || token.length < 32) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.phone;
}

/** Create a fresh 30-day session for the phone */
export async function createSession(phone: string): Promise<string> {
  const token = genToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      phone,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

/** Housekeeping: drop expired sessions (called on login) */
export async function pruneSessions(phone: string): Promise<void> {
  await db.session.deleteMany({
    where: { phone, expiresAt: { lt: new Date() } },
  }).catch(() => undefined);
}
