import { db } from '@/lib/db';
import { bearerToken, sessionSlot } from '@/lib/server/auth';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * POST /api/payments/webhook  { billRef, amount, method?, provider? }
 *
 * Payment auto-detection — the moment a UPI bill is paid, this endpoint
 * records the payment and the owner's phone (which polls /api/payments/status
 * while a bill is waiting) completes the bill by itself: slip, stock, income,
 * customer WhatsApp/SMS — no button pressed.
 *
 * Two ways in:
 *  1. GATEWAY webhook — `x-slp-signature: sha256=<hmac-sha256(body, secret)>`
 *     (set PAYMENT_WEBHOOK_SECRET in the environment). Razorpay-style
 *     `x-razorpay-signature` is verified against RAZORPAY_WEBHOOK_SECRET and
 *     its payload {amount in paise, notes.billRef} is understood too.
 *  2. The OWNER'S OWN DEVICE (valid session token) — used by the app to
 *     report manual confirms and by integrations running on the owner's side.
 *
 * The server never sees bill contents (E2E encryption) — only the ref,
 * the amount and who reported it.
 */
export async function POST(req: Request) {
  const raw = await req.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  let billRef = '';
  let amount = 0;
  let method = 'UPI';
  let provider = 'webhook';

  const slpSig = req.headers.get('x-slp-signature');
  const rzpSig = req.headers.get('x-razorpay-signature');
  const slpSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';
  const rzpSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  if (rzpSig && rzpSecret) {
    // Razorpay webhook: { event: 'payment.captured', payload.payment.entity: { amount(paise), notes } }
    if (!verifyHmac(raw, rzpSig, rzpSecret)) {
      return Response.json({ error: 'badSignature' }, { status: 401 });
    }
    const entity = (
      (body.payload as Record<string, unknown> | undefined)?.payment as Record<string, unknown> | undefined
    )?.entity as Record<string, unknown> | undefined;
    const paise = Number(entity?.amount ?? 0);
    amount = Math.round(paise) / 100;
    const notes = (entity?.notes ?? {}) as Record<string, unknown>;
    billRef = String(notes.billRef ?? body.billRef ?? '');
    method = String(entity?.method ?? 'UPI');
    provider = 'razorpay';
  } else if (slpSig && slpSecret) {
    if (!verifyHmac(raw, slpSig, slpSecret)) {
      return Response.json({ error: 'badSignature' }, { status: 401 });
    }
    billRef = String(body.billRef ?? '');
    amount = Number(body.amount ?? 0);
    method = String(body.method ?? 'UPI');
    provider = String(body.provider ?? 'webhook');
  } else {
    // no shared secret configured — only the owner's own device may report
    const slot = await sessionSlot(bearerToken(req));
    if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });
    billRef = String(body.billRef ?? '');
    amount = Number(body.amount ?? 0);
    method = String(body.method ?? 'UPI');
    provider = String(body.provider ?? 'owner');
  }

  if (!billRef || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const event = await db.paymentEvent.upsert({
    where: { billRef },
    update: { amount, method, provider },
    create: { billRef, amount, method, provider },
  });

  return Response.json({ ok: true, id: event.id });
}

function verifyHmac(raw: string, header: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const given = header.startsWith('sha256=') ? header.slice(7) : header;
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
