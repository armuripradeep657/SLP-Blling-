import { db } from '@/lib/db';
import { bearerToken, sessionSlot } from '@/lib/server/auth';

/**
 * POST /api/notify/send  { billRef?, phone, whatsappText?, smsText? }
 *
 * Sends the bill slip to the customer automatically after a payment is
 * detected — zero taps on the owner's phone:
 *   • WhatsApp: Meta Cloud API when WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are
 *     configured (or per-request wtToken/wtPhoneId from the owner's settings)
 *   • SMS: any HTTP SMS gateway when SMS_API_URL is configured — the URL is a
 *     template with {phone} and {message} placeholders (works with the common
 *     Indian providers), optional SMS_API_KEY sent as Bearer/X-API-Key.
 *
 * Whatever the providers decide is recorded on the payment event (waStatus /
 * smsStatus) and returned, so the app knows whether to fall back to the
 * WhatsApp/SMS share links on the slip itself.
 */
export async function POST(req: Request) {
  const slot = await sessionSlot(bearerToken(req));
  if (!slot) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    billRef?: string;
    phone?: string;
    whatsappText?: string;
    smsText?: string;
    wtToken?: string;
    wtPhoneId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\D/g, '');
  if (phone.length < 10) return Response.json({ error: 'badRequest' }, { status: 400 });
  // WhatsApp needs the country code — this deployment is an Indian shop
  const waPhone = phone.length === 10 ? `91${phone}` : phone;

  let waStatus = 'skipped';
  let smsStatus = 'skipped';
  let detail = '';

  const wtToken = body.wtToken || process.env.WHATSAPP_TOKEN || '';
  const wtPhoneId = body.wtPhoneId || process.env.WHATSAPP_PHONE_ID || '';
  if (wtToken && wtPhoneId && body.whatsappText) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${wtPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${wtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waPhone,
          type: 'text',
          text: { preview_url: false, body: body.whatsappText.slice(0, 4000) },
        }),
        signal: AbortSignal.timeout(15000),
      });
      waStatus = res.ok ? 'sent' : `failed-${res.status}`;
      if (!res.ok) detail += `whatsapp: ${await res.text().catch(() => res.status)} `;
    } catch (e) {
      waStatus = 'failed';
      detail += `whatsapp: ${(e as Error).message} `;
    }
  }

  const smsUrl = process.env.SMS_API_URL || '';
  if (smsUrl && body.smsText) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.SMS_API_KEY) {
        headers.Authorization = `Bearer ${process.env.SMS_API_KEY}`;
        headers['X-API-Key'] = process.env.SMS_API_KEY;
      }
      const url = smsUrl.replace('{phone}', encodeURIComponent(waPhone)).replace(
        '{message}',
        encodeURIComponent(body.smsText.slice(0, 1000))
      );
      const res = await fetch(url, {
        method: process.env.SMS_API_METHOD || 'POST',
        headers,
        body: url.includes('{message}') ? undefined : JSON.stringify({ phone: waPhone, message: body.smsText.slice(0, 1000) }),
        signal: AbortSignal.timeout(15000),
      });
      smsStatus = res.ok ? 'sent' : `failed-${res.status}`;
      if (!res.ok) detail += `sms: ${await res.text().catch(() => res.status)}`;
    } catch (e) {
      smsStatus = 'failed';
      detail += `sms: ${(e as Error).message}`;
    }
  }

  // record what happened with the customer notification on the payment event
  // ('skipped' means no provider is configured — the phone falls back to the
  // WhatsApp share link / slip share buttons)
  if (body.billRef) {
    await db.paymentEvent
      .update({
        where: { billRef: body.billRef },
        data: { waStatus, smsStatus },
      })
      .catch(() => undefined);
  }

  return Response.json({ ok: true, whatsapp: waStatus, sms: smsStatus, detail: detail.trim() });
}
