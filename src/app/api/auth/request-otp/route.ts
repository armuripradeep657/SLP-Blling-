import { db } from '@/lib/db';
import {
  genOtp,
  isValidPhone,
  normalizePhone,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_MIN_MS,
  OTP_SEND_WINDOW_MS,
  OTP_TTL_MS,
  sha256,
} from '@/lib/server/auth';
import { sendOtpSms, smsConfigured } from '@/lib/server/sms';

/**
 * POST /api/auth/request-otp  { phone }
 * Generates a 6-digit OTP, stores only its SHA-256 hash (5 min expiry),
 * rate-limits sends, and delivers it by SMS when a gateway is configured —
 * otherwise returns it for the on-screen demo box.
 */
export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? '');
  if (!isValidPhone(phone)) {
    return Response.json({ error: 'badPhone' }, { status: 400 });
  }

  const now = new Date();
  const account = await db.syncAccount.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  // rolling-hour send limit
  const windowFresh =
    account.otpWindowStart && now.getTime() - account.otpWindowStart.getTime() < OTP_SEND_WINDOW_MS;
  const sendCount = windowFresh ? account.otpSendCount : 0;
  if (sendCount >= OTP_MAX_SENDS_PER_HOUR) {
    return Response.json({ error: 'tooManySends' }, { status: 429 });
  }
  // server-side resend cooldown
  if (
    account.lastOtpSentAt &&
    now.getTime() - account.lastOtpSentAt.getTime() < OTP_RESEND_MIN_MS
  ) {
    return Response.json({ error: 'resendCooldown' }, { status: 429 });
  }

  const otp = genOtp();
  await db.syncAccount.update({
    where: { phone },
    data: {
      otpHash: sha256(otp),
      otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
      otpAttempts: 0,
      otpSendCount: sendCount + 1,
      otpWindowStart: windowFresh ? account.otpWindowStart : now,
      lastOtpSentAt: now,
    },
  });

  const sms = await sendOtpSms(phone, otp);
  const demo = sms.channel === 'demo' || !sms.delivered;

  return Response.json({
    ok: true,
    sentTo: phone,
    channel: sms.channel,
    // demo mode shows the OTP on screen so login works before an SMS
    // gateway key is configured; with a gateway the OTP goes by SMS only.
    demo,
    ...(demo ? { otp } : {}),
    gatewayConfigured: smsConfigured(),
  });
}
