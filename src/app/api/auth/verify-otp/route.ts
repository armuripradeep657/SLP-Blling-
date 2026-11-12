import { db } from '@/lib/db';
import {
  createSession,
  isValidPhone,
  normalizePhone,
  OTP_MAX_ATTEMPTS,
  pruneSessions,
  sha256,
} from '@/lib/server/auth';

/**
 * POST /api/auth/verify-otp  { phone, otp }
 * Verifies the OTP against the stored hash (max 5 attempts, 5 min expiry),
 * then creates a 30-day session. Returns whether a security PIN exists —
 * first-time users are sent to PIN setup, returning ones to PIN unlock.
 */
export async function POST(req: Request) {
  let body: { phone?: string; otp?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? '');
  const otp = (body.otp ?? '').replace(/\D/g, '');
  if (!isValidPhone(phone) || otp.length !== 6) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const account = await db.syncAccount.findUnique({ where: { phone } });
  if (!account?.otpHash || !account.otpExpiresAt) {
    return Response.json({ error: 'noOtp' }, { status: 400 });
  }
  if (account.otpExpiresAt.getTime() < Date.now()) {
    return Response.json({ error: 'otpExpired' }, { status: 400 });
  }

  if (account.otpHash !== sha256(otp)) {
    const attempts = account.otpAttempts + 1;
    const killed = attempts >= OTP_MAX_ATTEMPTS;
    await db.syncAccount.update({
      where: { phone },
      data: {
        otpAttempts: killed ? 0 : attempts,
        // too many wrong tries → the OTP stops working, a new one is needed
        ...(killed ? { otpHash: null, otpExpiresAt: null } : {}),
      },
    });
    return Response.json(
      { error: killed ? 'otpKilled' : 'wrongOtp', attemptsLeft: killed ? 0 : OTP_MAX_ATTEMPTS - attempts },
      { status: killed ? 429 : 400 }
    );
  }

  // correct OTP — burn it and open a session
  await db.syncAccount.update({
    where: { phone },
    data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
  });
  await pruneSessions(phone);
  const token = await createSession(phone);

  return Response.json({
    ok: true,
    token,
    phone,
    hasPin: Boolean(account.dekWrapped),
  });
}
