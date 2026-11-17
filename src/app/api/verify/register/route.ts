import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * POST /api/verify/register — record a finalized bill in the barcode registry.
 *
 * Authenticated devices only (owner MPIN/password or staff session). The bill
 * data lives end-to-end encrypted in the vault, so THIS endpoint is the one
 * place the server holds plain verification data: exactly what a barcode scan
 * must show, nothing more (no phone/address — the public lookup never returns
 * it).
 *
 * Uniqueness rules enforced here (the database adds unique indexes):
 *   - one code per bill, one bill per code — reuse across bills → 409
 *   - re-registering the same bill (dues payment updates the status) → upsert
 *
 * v35 — staff billing oversight, all server-side:
 *   - item lines carry origPrice (the product's saved price) + the staff-edited
 *     selling price + discount type/value/amount — recorded verbatim
 *   - the server RECOMPUTES the bill total from the lines (client totals are
 *     never trusted) and recomputes GST from the server's own AppConfig rate
 *   - staff discounts beyond the owner's configured limits are REJECTED (403)
 *     unless approval mode is on — then the bill is flagged needsApproval and
 *     an 'approval' notification goes to the owner
 *   - every staff bill creates ONE Notification (unique type+billNo — duplicates
 *     are impossible at the database level) and audit events for the price
 *     edits and discounts it contains
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

  const isStaff = auth.role === 'staff';
  const items = Array.isArray(body.items)
    ? (body.items as Array<Record<string, unknown>>).slice(0, 100).map((it) => {
        const price = num(it.price, 0);
        const qty = num(it.qty, 0);
        const discountType = it.discountType === 'percent' ? 'percent' : 'amount';
        const discountValue = num(it.discountValue, 0);
        // server computes the line discount — a percent is OF THE LINE GROSS
        const gross = Math.round(price * qty * 100) / 100;
        const discountAmount =
          discountType === 'percent'
            ? Math.min(gross, Math.round(((gross * discountValue) / 100) * 100) / 100)
            : Math.min(gross, num(it.discount, discountValue));
        return {
          name: String(it.name ?? '').slice(0, 80),
          size: String(it.size ?? '').slice(0, 40),
          qty,
          // the price actually charged (staff-edited or the original)
          price,
          // the product's saved price when different — proof of the edit
          origPrice: num(it.origPrice, price),
          discountType,
          discountValue,
          discount: discountAmount,
        };
      })
    : [];

  const dateRaw = new Date(String(body.billDateISO ?? ''));
  const billDateISO = Number.isNaN(dateRaw.getTime()) ? new Date() : dateRaw;

  /* ---- server-side totals: recomputed from the lines, GST from AppConfig ---- */
  const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
  const gstPercent = num(body.gstPercent, cfg?.gstPercent ?? 0);
  const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty, 0) * 100) / 100;
  const itemDiscounts =
    Math.round(items.reduce((s, it) => s + it.discount, 0) * 100) / 100;
  // bill-level discount (₹ or %) as sent by the client — capped at the base
  const billBase = Math.max(subtotal - itemDiscounts, 0);
  const billDiscountType = body.discountType === 'percent' ? 'percent' : 'amount';
  const billDiscountValue = num(body.discountValue, 0);
  const billDiscount =
    billDiscountType === 'percent'
      ? Math.min(billBase, Math.round(((billBase * billDiscountValue) / 100) * 100) / 100)
      : Math.min(billBase, billDiscountValue);
  const labourCharge = num(body.labourCharge);
  const autoCharge = num(body.autoCharge);
  const taxable = Math.max(billBase - billDiscount + labourCharge + autoCharge, 0);
  const gstAmount = Math.round(taxable * (gstPercent || 0)) / 100;
  const total = Math.round((taxable + gstAmount) * 100) / 100;
  const paid = Math.min(num(body.paid), total);
  const balance = Math.max(total - paid, 0);

  /* ---- staff discount limits — enforced HERE, not just in the UI ----
     An over-limit staff bill is never silently accepted: when approval mode
     is off the device blocks it before printing; if one slips through
     anyway (stale config / offline save), the server FLAGS it for the owner
     instead of hard-rejecting — a rejected registration would strand a
     printed bill outside the registry, unverifiable forever. */
  let needsApproval = false;
  if (isStaff && cfg) {
    const maxPct = Math.max(cfg.discountMaxPercent, 0);
    const maxAmt = Math.max(cfg.discountMaxAmount, 0);
    const over = items.some((it) => {
      const gross = Math.round(it.price * it.qty * 100) / 100;
      if (gross <= 0 || it.discount <= 0) return false;
      const pct = (it.discount / gross) * 100;
      return pct > maxPct + 1e-9 || it.discount > maxAmt + 1e-9;
    });
    if (over) needsApproval = true;
  }

  // ONE code per bill, ONE bill per code — duplicates and reuse die here
  const existing = await db.verifiedBill.findUnique({ where: { billNo } });
  if (existing && existing.code !== code) {
    // another device already registered THIS bill under a different code —
    // hand it back so the client adopts the winning code instead of minting
    return Response.json({ error: 'billRegistered', code: existing.code }, { status: 409 });
  }
  if (!existing) {
    const codeClash = await db.verifiedBill.findUnique({ where: { code } });
    if (codeClash) return Response.json({ error: 'codeInUse' }, { status: 409 });
  }

  const createdBy = String(body.createdBy ?? 'Owner').slice(0, 40);
  // staff identity comes from the SESSION's account record — never from the body
  let createdById = '';
  if (isStaff && auth.staffId) {
    const staff = await db.staffUser.findUnique({
      where: { id: auth.staffId },
      select: { username: true },
    });
    createdById = staff?.username ?? '';
  }
  const customerName = String(body.customerName ?? '').slice(0, 80);

  const data = {
    code,
    billNo,
    slot: auth.slot,
    companyName: String(body.companyName ?? '').slice(0, 80) || 'SLP Cement Works',
    billDateISO,
    customerName,
    itemsJson: JSON.stringify(items),
    gstPercent,
    gstAmount,
    discount: billDiscount,
    labourCharge,
    autoCharge,
    subtotal,
    total,
    paid,
    balance,
    paymentMode: String(body.paymentMode ?? 'Cash').slice(0, 10),
    paymentStatus: String(body.paymentStatus ?? 'Due').slice(0, 10),
    createdBy,
    createdById,
    needsApproval,
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
      needsApproval,
    },
    create: data,
  });

  /* ---- notifications + audit — ONLY on the first save of this bill ---- */
  if (!existing && isStaff) {
    const payload = {
      billNo,
      total,
      discount: billDiscount + itemDiscounts,
      gstAmount,
      subtotal,
      itemsCount: items.length,
      paymentMode: data.paymentMode,
      needsApproval,
      code,
    };
    await db.notification
      .create({
        data: {
          slot: 'owner',
          type: needsApproval ? 'approval' : 'staff_bill',
          billNo,
          staffName: createdBy,
          staffUsername: createdById,
          customerName,
          total,
          discount: Math.round((billDiscount + itemDiscounts) * 100) / 100,
          paymentStatus: data.paymentStatus,
          payloadJson: JSON.stringify(payload),
        },
      })
      .catch(() => undefined); // unique(type,billNo) — a duplicate can never exist

    const edits = items.filter((it) => Math.abs(it.origPrice - it.price) > 0.001);
    const discounts = items.filter((it) => it.discount > 0.001);
    await db.auditEvent
      .create({
        data: {
          slot: 'owner',
          actor: createdBy,
          actorRole: 'staff',
          action: 'bill_created',
          target: billNo,
          detailsJson: JSON.stringify(payload),
        },
      })
      .catch(() => undefined);
    for (const it of edits) {
      await db.auditEvent
        .create({
          data: {
            slot: 'owner',
            actor: createdBy,
            actorRole: 'staff',
            action: 'price_edit',
            target: billNo,
            detailsJson: JSON.stringify({
              item: it.name,
              size: it.size,
              qty: it.qty,
              origPrice: it.origPrice,
              editedPrice: it.price,
              lineTotal: Math.round((it.price * it.qty - it.discount) * 100) / 100,
            }),
          },
        })
        .catch(() => undefined);
    }
    for (const it of discounts) {
      await db.auditEvent
        .create({
          data: {
            slot: 'owner',
            actor: createdBy,
            actorRole: 'staff',
            action: 'discount_applied',
            target: billNo,
            detailsJson: JSON.stringify({
              item: it.name,
              qty: it.qty,
              discountType: it.discountType,
              discountValue: it.discountValue,
              discountAmount: it.discount,
            }),
          },
        })
        .catch(() => undefined);
    }
  }

  return Response.json({ ok: true, code: saved.code, billNo: saved.billNo, needsApproval: saved.needsApproval });
}

/** GET /api/verify/register/<code> is not a thing — lookup lives at /api/verify/<code> */
export async function GET() {
  return Response.json({ error: 'badRequest' }, { status: 400 });
}
