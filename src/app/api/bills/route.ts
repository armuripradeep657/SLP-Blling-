import { db } from '@/lib/db';
import { bearerToken, requireOwnerOrStaff } from '@/lib/server/auth';
import { bumpRev, ensureBizState, mintVerifyCode, readSettings, CODE_RE, recomputeBill, statusOf, upsertRegistry } from '@/lib/server/biz';
import type { Invoice } from '@/lib/types';

/**
 * POST /api/bills — THE bill save. A bill exists for the business ONLY
 * after this endpoint returns ok: the server recomputes every total from
 * the raw lines (GST from the central AppConfig), atomically resolves the
 * bill number, registers the Code 128 verification barcode, stores the
 * full bill centrally and bumps the revision so every other device sees
 * the new bill within seconds. The client never shows "saved" before the
 * server confirms — and an offline device cannot save at all.
 */
export async function POST(req: Request) {
  // staff members bill customers too — the same central database, the same
  // number sequence; money, deletion and settings stay owner-only
  const auth = await requireOwnerOrStaff(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const draft = (body.invoice ?? {}) as Record<string, unknown>;
  const items = Array.isArray(draft.items) ? (draft.items as Array<Record<string, unknown>>) : [];
  if (items.length === 0) return Response.json({ error: 'badRequest' }, { status: 400 });

  const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
  const shop = (await readSettings()) as { companyName?: string; invoicePrefix?: string };

  /* ---- server-side totals: recomputed from the lines, GST from AppConfig ----
     The client sends its computed totals nested under `totals` — the money
     ALREADY paid (cash at the counter, UPI auto-detected, owner-confirmed)
     lives in totals.paid. Dropping it made every bill land as DUE. */
  const draftTotals = (draft.totals ?? {}) as Record<string, unknown>;
  const bill = recomputeBill(items, {
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    labourCharge: draft.labourCharge,
    autoCharge: draft.autoCharge,
    paid: Number(draft.paid ?? draftTotals.paid ?? 0) || 0,
    gstPercent: cfg?.gstPercent ?? 0,
  });
  const paymentMode = String(draft.paymentMode ?? 'Cash').slice(0, 10);
  const status = statusOf(bill.total, bill.paid);
  const dateRaw = new Date(String(draft.dateISO ?? ''));
  const dateISO = Number.isNaN(dateRaw.getTime()) ? new Date() : dateRaw;

  /* ---- bill number: assigned HERE, atomically, at save time (v38) ----
     Numbers only ever belong to bills that were ACTUALLY saved — abandoned
     carts can no longer punch gaps into the sequence, and deleting a bill
     never rewinds the counter. Two devices saving at the same moment each
     get their own number inside this transaction. */
  const reserved = Number(body.reservedNo ?? 0);
  const prefix = String(shop.invoicePrefix ?? '').trim() || 'SLP-INV-';
  let noNum = Number.isFinite(reserved) && reserved > 0 ? Math.round(reserved) : 0;
  if (noNum <= 0) {
    noNum = await db.$transaction(async (tx) => {
      const c = await tx.appConfig.findUnique({ where: { slot: 'owner' } });
      const next = (c?.nextBillNo ?? 0) + 1;
      await tx.appConfig.update({ where: { slot: 'owner' }, data: { nextBillNo: next } });
      return next;
    });
  } else if (cfg && noNum > cfg.nextBillNo) {
    await db.appConfig.update({ where: { slot: 'owner' }, data: { nextBillNo: noNum } }).catch(() => undefined);
  }
  // collision backstop: a legacy reserved number that is already taken moves
  // FORWARD past the counter — numbers are never reused
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${prefix}${noNum}`;
    const clash = await db.bizInvoice.findUnique({ where: { no: candidate } });
    if (!clash) break;
    noNum += 1;
    if (cfg && noNum > cfg.nextBillNo) {
      await db.appConfig.update({ where: { slot: 'owner' }, data: { nextBillNo: noNum } }).catch(() => undefined);
    }
  }
  const no = `${prefix}${noNum}`;

  /* ---- verification code: client-minted or server-minted, always unique ---- */
  let code = typeof draft.verifyCode === 'string' && CODE_RE.test(draft.verifyCode) ? draft.verifyCode : '';
  if (code && (await db.verifiedBill.findUnique({ where: { code } }))) code = '';
  for (let attempt = 0; attempt < 5 && !code; attempt++) code = mintVerifyCode();

  /* ---- customer ---- */
  const customer = (draft.customer ?? {}) as Record<string, unknown>;

  /* ---- v40: bills record WHO made them — a staff session stamps the
     staff's name, so their History can show only their own bills ---- */
  const creator = auth.role === 'staff' ? auth.name : 'Owner';

  /* ---- assemble the CANONICAL bill ---- */
  const invoice: Invoice = {
    id: typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 60) : `inv-${Date.now()}`,
    no,
    dateISO: dateISO.toISOString(),
    customer: {
      name: String(customer.name ?? '').slice(0, 80),
      phone: String(customer.phone ?? '').slice(0, 15),
      address: String(customer.address ?? '').slice(0, 200) || undefined,
    },
    items: bill.items.map((it, i) => ({
      key: it.key ?? `line-${i}`,
      productId: it.productId ?? 'custom',
      name: it.name,
      nameTe: it.nameTe,
      size: it.size,
      price: it.price,
      origPrice: it.origPrice,
      qty: it.qty,
      discount: it.discount,
      discountType: it.discountType,
      discountValue: it.discountValue,
    })),
    totals: {
      subtotal: bill.subtotal,
      itemDiscounts: bill.itemDiscounts,
      discount: bill.discount,
      labourCharge: bill.labourCharge,
      autoCharge: bill.autoCharge,
      roundOff: 0,
      gst: bill.gst,
      total: bill.total,
      paid: bill.paid,
      balance: bill.balance,
    },
    discountType: draft.discountType === 'percent' ? 'percent' : 'amount',
    discountValue: Number(draft.discountValue ?? 0) || 0,
    labourCharge: bill.labourCharge,
    autoCharge: bill.autoCharge,
    paymentMode: paymentMode as Invoice['paymentMode'],
    language: draft.language === 'te' || draft.language === 'both' ? draft.language : 'en',
    status: status as Invoice['status'],
    paymentRef: typeof draft.paymentRef === 'string' ? draft.paymentRef.slice(0, 80) : undefined,
    verifyCode: code,
    createdBy: creator,
    cancelled: false,
    delivery: (draft.delivery as Invoice['delivery']) ?? undefined,
    payments: Array.isArray(draft.payments) ? (draft.payments as Invoice['payments']) : undefined,
  };

  /* ---- keep the bill-number counter at least as far as this bill ---- */
  if (!cfg || noNum > cfg.nextBillNo) {
    await db.appConfig.upsert({
      where: { slot: 'owner' },
      update: { nextBillNo: noNum },
      create: { slot: 'owner', nextBillNo: noNum },
    });
  }

  /* ---- idempotent save: a retry after a dropped network reply does NOT
     create a duplicate bill — the same bill id returns the saved bill ---- */
  const existing = await db.bizInvoice.findUnique({ where: { id: invoice.id } });
  if (existing) {
    const saved = JSON.parse(existing.payloadJson) as Invoice;
    return Response.json({ ok: true, invoice: saved, duplicate: true, rev: (await ensureBizState()).rev });
  }

  try {
    await db.bizInvoice.create({
      data: {
        id: invoice.id,
        no,
        dateISO,
        customerName: invoice.customer.name,
        customerPhone: invoice.customer.phone,
        total: bill.total,
        paid: bill.paid,
        balance: bill.balance,
        status,
        paymentMode,
        verifyCode: code,
        cancelled: false,
        createdBy: creator,
        payloadJson: JSON.stringify(invoice),
      },
    });
    await upsertRegistry({
      code,
      billNo: no,
      companyName: String(shop.companyName ?? 'SLP Cement Works'),
      billDateISO: dateISO,
      customerName: invoice.customer.name,
      bill,
      paymentMode,
      createdBy: creator,
    });
    // deduct stock on the central catalog (products with tracked stock only)
    for (const it of bill.items) {
      if (!it.productId || it.productId === 'custom') continue;
      const prod = await db.bizProduct.findUnique({ where: { id: it.productId } });
      if (prod && typeof prod.stock === 'number') {
        await db.bizProduct.update({
          where: { id: prod.id },
          data: { stock: Math.max(prod.stock - Math.round(it.qty), 0) },
        });
      }
    }
    const rev = await bumpRev();
    return Response.json({ ok: true, invoice, rev });
  } catch (e) {
    // unique-code / unique-number races surface here
    const msg = String(e);
    if (msg.includes('VerifiedBill_code_key')) return Response.json({ error: 'codeInUse' }, { status: 409 });
    if (msg.includes('BizInvoice_no_key')) return Response.json({ error: 'billNoTaken' }, { status: 409 });
    return Response.json({ error: 'saveFailed' }, { status: 500 });
  }
}
