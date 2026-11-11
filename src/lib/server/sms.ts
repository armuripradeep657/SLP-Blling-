/* ------------------------------------------------------------------ */
/* OTP delivery — SMS gateway adapters.                                */
/*                                                                     */
/* REAL SMS delivery needs an SMS gateway account (the app cannot      */
/* send SMS on its own). Configure ONE of these in .env and OTPs go    */
/* out as real SMS instantly:                                          */
/*                                                                     */
/*   MSG91 (popular in India):                                         */
/*     MSG91_AUTH_KEY=xxxxxxxxxxxxxxxx                                 */
/*     MSG91_SENDER_ID=SLPCMT                                         */
/*     MSG91_TEMPLATE_ID=64xxxxxxxxxxxxxxxx                            */
/*                                                                     */
/*   Any gateway that accepts a JSON POST (Fast2SMS relay, TextLocal   */
/*   relay, your own webhook…):                                        */
/*     SMS_GATEWAY_URL=https://your-relay.example.com/send             */
/*     SMS_GATEWAY_KEY=secret                                          */
/*                                                                     */
/* With NO gateway configured the app runs in DEMO mode: the OTP is    */
/* returned to the screen that asked for it, so login still works      */
/* end-to-end (and the data stays PIN-encrypted regardless).           */
/* ------------------------------------------------------------------ */

export type SmsChannel = 'msg91' | 'gateway' | 'demo';

export interface SmsResult {
  delivered: boolean;
  channel: SmsChannel;
}

function otpMessage(otp: string): string {
  return `${otp} is your Sri Lakshmi Cement Works app OTP. Valid for 5 minutes. Do not share it with anyone.`;
}

export function smsConfigured(): boolean {
  return Boolean(
    (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ||
      (process.env.SMS_GATEWAY_URL && process.env.SMS_GATEWAY_KEY)
  );
}

/** Send the OTP by SMS. Never throws — returns the channel used. */
export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  const msg = otpMessage(otp);
  try {
    // --- MSG91 flow API ---
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
      const res = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          short_url: '0',
          recipients: [
            {
              mobiles: `91${phone}`,
              OTP: otp,
              OTP_EXPIRY: '5',
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      return { delivered: res.ok, channel: 'msg91' };
    }

    // --- Generic JSON webhook gateway ---
    if (process.env.SMS_GATEWAY_URL && process.env.SMS_GATEWAY_KEY) {
      const res = await fetch(process.env.SMS_GATEWAY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SMS_GATEWAY_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp, message: msg }),
        signal: AbortSignal.timeout(10_000),
      });
      return { delivered: res.ok, channel: 'gateway' };
    }
  } catch (err) {
    console.error('[sms] gateway send failed:', err);
    return { delivered: false, channel: process.env.MSG91_AUTH_KEY ? 'msg91' : 'gateway' };
  }

  // --- Demo mode: no gateway configured ---
  console.log(`[sms] DEMO OTP for +91${phone}: ${otp}`);
  return { delivered: false, channel: 'demo' };
}
