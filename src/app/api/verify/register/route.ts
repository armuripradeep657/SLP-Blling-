import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * POST /api/verify/register — record a finalized bill in the barcode registry.
 *
 * Authenticated devices only (owner MPIN or staff session). The bill data
 * lives end-to-end encrypted in the vault, so THIS endpoint is the one place
 * the server holds plain verification data: exactly what a barcode scan must
 * show, nothing more (no phone/address — the public lookup never returns it).
 *
 * Uniqueness rules enforced here (the database adds unique indexes):
 *   - one code per bill, one bill per code — reuse across bills → 409
 *   - re-registering the same bill (dues payment updates the status) → upsert
 */
export async function POST(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const code = String(body.code ?? '').trim();
  const billNo = String(body.billNo ?? '').trim();
  // the code MUST come from this app's generator — unpredictable, right shape
  if (!/^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(code)) {
    return Response.json({ error: 'badCode' }, { status: 400 });
  }
  if (!billNo || billNo.length > 40) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const num = (v: unknown, d = 0): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : d;
  };

  const items = Array.isArray(body.items)
    ? (body.items as Array<Record<string, unknown>>).slice(0, 100).map((it) => ({
        name: String(it.name ?? '').slice(0, 80),
        size: String(it.size ?? '').slice(0, 40),
        qty: num(it.qty, 0),
        price: num(it.price, 0),
        discount: num(it.discount, 0),
      }))
    : [];

  const dateRaw = new Date(String(body.billDateISO ?? ''));
  const billDateISO = Number.isNaN(dateRaw.getTime()) ? new Date() : dateRaw;

  // ONE code per bill, ONE bill per code — duplicates and reuse die here
  const clash = await db.$transaction([
    db.verifiedBill.findUnique({ where: { code } }),
    db.verifiedBill.findUnique({ where: { billNo } }),
  ]);
  if (clash[0] && clash[0].billNo !== billNo) {
    return Response.json({ error: 'codeInUse' }, { status: 409 });
  }
  if (clash[1] && clash[1].code !== code) {
    // another device already registered THIS bill under a different code —
    // hand it back so the client adopts the winning code instead of minting
    return Response.json({ error: 'billRegistered', code: clash[1].code }, { status: 409 });
  }

  const data = {
    code,
    billNo,
    slot: auth.slot,
    companyName: String(body.companyName ?? '').slice(0, 80) || 'SLP Cement Works',
    billDateISO,
    customerName: String(body.customerName ?? '').slice(0, 80),
    itemsJson: JSON.stringify(items),
    gstPercent: num(body.gstPercent),
    gstAmount: num(body.gstAmount),
    discount: num(body.discount),
    labourCharge: num(body.labourCharge),
    autoCharge: num(body.autoCharge),
    subtotal: num(body.subtotal),
    total: num(body.total),
    paid: num(body.paid),
    balance: num(body.balance),
    paymentMode: String(body.paymentMode ?? 'Cash').slice(0, 10),
    paymentStatus: String(body.paymentStatus ?? 'Due').slice(0, 10),
    createdBy: String(body.createdBy ?? 'Owner').slice(0, 40),
  };

  const saved = await db.verifiedBill.upsert({
    where: { billNo },
    update: {
      paid: data.paid,
      balance: data.balance,
      paymentMode: data.paymentMode,
      paymentStatus: data.paymentStatus,
      gstPercent: data.gstPercent,
      gstAmount: data.gstAmount,
    },
    create: data,
  });

  return Response.json({ ok: true, code: saved.code, billNo: saved.billNo });
}
