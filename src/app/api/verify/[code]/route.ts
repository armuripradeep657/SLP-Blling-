import { db } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/server/auth';

/**
 * GET /api/verify/<code> — PUBLIC barcode verification.
 *
 * A scanned or typed Code 128 value lands here. The barcode itself carries
 * nothing trustworthy — the ONLY source of truth is this database lookup.
 *
 * Returns the safe bill fields for a genuine bill (customer name yes,
 * phone/address never — private data stays off the public page), the
 * CANCELLED flag when the owner cancelled the bill, and 404 for unknown
 * codes. Every attempt is logged (verification history).
 *
 * A copied barcode always resolves to its ORIGINAL bill — verification
 * proves the database record exists, not that the paper in hand is the
 * original printout.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawParam } = await params;
  const code = decodeURIComponent(rawParam ?? '').trim().toUpperCase();

  // rate-limit brute forcing of codes from one address (a shop verifies many
  // bills a day — generous ceiling, still far below any brute-force rate)
  if (!rateLimit(`verify:${clientIp(req)}`, 300)) {
    return Response.json({ status: 'rate_limited' }, { status: 429 });
  }

  const bill = /^SLP-[0-9A-Z-]{4,40}$/.test(code)
    ? await db.verifiedBill.findUnique({ where: { code } })
    : null;

  // the ORIGINAL bill in the central database (for the in-app scanner to
  // open the real record) — only its id is exposed, never private fields
  const central = bill
    ? await db.bizInvoice.findUnique({ where: { no: bill.billNo }, select: { id: true } })
    : null;

  const status = !bill ? 'not_found' : bill.cancelled ? 'cancelled' : 'valid';

  // verification history — every attempt, valid or not
  await db.verificationLog.create({
    data: { code, result: status, ip: clientIp(req) },
  });

  if (!bill) {
    return Response.json({ status, error: 'INVALID BILL – BARCODE NOT FOUND' }, { status: 404 });
  }

  let items: Array<{
    name: string;
    size: string;
    qty: number;
    price: number;
    discount: number;
    origPrice?: number;
    discountType?: string;
    discountValue?: number;
  }> = [];
  try {
    const parsed = JSON.parse(bill.itemsJson) as typeof items;
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    /* empty items — registry row is still shown */
  }

  const logCount = await db.verificationLog.count({ where: { code: bill.code } });
  const recent = await db.verificationLog.findMany({
    where: { code: bill.code },
    orderBy: { at: 'desc' },
    take: 5,
    select: { result: true, at: true },
  });

  return Response.json({
    status,
    invoiceId: central?.id ?? null,
    bill: {
      companyName: bill.companyName,
      billNo: bill.billNo,
      billDateISO: bill.billDateISO,
      customerName: bill.customerName, // name only — phone/address are never stored here
      items,
      gstPercent: bill.gstPercent,
      gstAmount: bill.gstAmount,
      discount: bill.discount,
      labourCharge: bill.labourCharge,
      autoCharge: bill.autoCharge,
      subtotal: bill.subtotal,
      total: bill.total,
      paid: bill.paid,
      balance: bill.balance,
      paymentMode: bill.paymentMode,
      paymentStatus: bill.paymentStatus,
      createdBy: bill.createdBy,
      registeredAtISO: bill.createdAt,
    },
    history: { count: logCount, recent },
  });
}
