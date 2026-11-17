import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev, recomputeBill, statusOf, productToRow, upsertRegistry } from '@/lib/server/biz';

/**
 * POST /api/state/import — one-time migration of the pre-online data.
 * The owner's device holds its old local business data (the offline-era
 * store); on first login it is pushed HERE so the central database
 * starts with everything the business already has. Upsert-by-id merge:
 * safe to run from any device, in any order, any number of times —
 * existing rows win, nothing is deleted.
 */
export async function POST(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  const settings = body.settings && typeof body.settings === 'object' ? (body.settings as Record<string, unknown>) : null;
  const appearance = body.appearance && typeof body.appearance === 'object' ? (body.appearance as Record<string, unknown>) : null;
  const products = Array.isArray(body.products) ? (body.products as Array<Record<string, unknown>>) : [];
  const invoices = Array.isArray(body.invoices) ? (body.invoices as Array<Record<string, unknown>>) : [];
  const expenses = Array.isArray(body.expenses) ? (body.expenses as Array<Record<string, unknown>>) : [];
  const incomes = Array.isArray(body.incomes) ? (body.incomes as Array<Record<string, unknown>>) : [];
  const labourWorks = Array.isArray(body.labourWorks) ? (body.labourWorks as Array<Record<string, unknown>>) : [];
  const labourWorkers = Array.isArray(body.labourWorkers) ? (body.labourWorkers as Array<Record<string, unknown>>) : [];

  /* ---- settings singleton ---- */
  const prev = await db.bizSettings.findUnique({ where: { id: 'owner' } });
  // store in SECONDS — the column is Int and Date.now() ms overflows it;
  // both sides of the newest-wins comparison are converted the same way
  const dataUpdatedAt = Math.floor(Number(body.dataUpdatedAt ?? Date.now()) / 1000);
  if (settings && (!prev || dataUpdatedAt >= prev.dataUpdatedAt)) {
    await db.bizSettings.upsert({
      where: { id: 'owner' },
      update: {
        settingsJson: JSON.stringify(settings),
        appearanceJson: JSON.stringify(appearance ?? {}),
        dataUpdatedAt,
      },
      create: { id: 'owner', settingsJson: JSON.stringify(settings), appearanceJson: JSON.stringify(appearance ?? {}), dataUpdatedAt },
    });
    // mirror the server-enforced config fields
    const upi = String((settings as { upiId?: string }).upiId ?? '');
    const gst = Number((settings as { gstPercent?: number }).gstPercent ?? 0);
    await db.appConfig.upsert({
      where: { slot: 'owner' },
      update: { upiId: upi, gstPercent: Number.isFinite(gst) ? gst : 0 },
      create: { slot: 'owner', upiId: upi, gstPercent: Number.isFinite(gst) ? gst : 0 },
    });
  }

  /* ---- products ---- */
  for (const p of products) {
    if (!p || typeof p.id !== 'string' || !p.id) continue;
    const row = productToRow(p as never);
    await db.bizProduct.upsert({ where: { id: row.id }, update: row, create: row });
  }

  /* ---- invoices (full payload + registry registration for old barcodes) ---- */
  const companyName = String((settings as { companyName?: string } | null)?.companyName ?? 'SLP Cement Works');
  let registered = 0;
  let maxImportedNo = 0;
  for (const inv of invoices) {
    if (!inv || typeof inv.id !== 'string' || !inv.id) continue;
    const items = Array.isArray(inv.items) ? (inv.items as Array<Record<string, unknown>>) : [];
    const totals = (inv.totals ?? {}) as Record<string, unknown>;
    const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
    const bill = recomputeBill(items, {
      discountType: inv.discountType,
      discountValue: inv.discountValue,
      labourCharge: inv.labourCharge,
      autoCharge: inv.autoCharge,
      paid: totals.paid,
      gstPercent: Number(totals.gst ?? 0) > 0 ? Number(inv.gstPercent ?? cfg?.gstPercent ?? 0) : 0,
    });
    // keep the ORIGINAL totals (this bill was already final) — recompute only fills gaps
    const payload = JSON.stringify(inv);
    const date = new Date(String(inv.dateISO ?? ''));
    const row = {
      id: inv.id,
      no: String(inv.no ?? ''),
      dateISO: Number.isNaN(date.getTime()) ? new Date() : date,
      customerName: String((inv.customer as { name?: string } | undefined)?.name ?? '').slice(0, 80),
      customerPhone: String((inv.customer as { phone?: string } | undefined)?.phone ?? '').slice(0, 15),
      total: Number(totals.total ?? bill.total),
      paid: Number(totals.paid ?? bill.paid),
      balance: Number(totals.balance ?? bill.balance),
      status: String(inv.status ?? statusOf(Number(totals.total ?? bill.total), Number(totals.paid ?? bill.paid))).slice(0, 10),
      paymentMode: String(inv.paymentMode ?? 'Cash').slice(0, 10),
      verifyCode: typeof inv.verifyCode === 'string' ? inv.verifyCode : null,
      cancelled: inv.cancelled === true,
      createdBy: String(inv.createdBy ?? 'Owner').slice(0, 40),
      payloadJson: payload,
    };
    if (!row.no) continue;
    // keep the bill-number counter monotonic: it must start past EVERY
    // imported bill or the unique bill numbers will eventually collide
    const n = Number(row.no.match(/(\d+)$/)?.[1] ?? 0);
    if (Number.isFinite(n) && n > maxImportedNo) maxImportedNo = n;
    try {
      // first import creates the row; re-imports only refresh the payload —
      // the bill itself was already final and its number/code must not move
      await db.bizInvoice.upsert({
        where: { id: row.id },
        update: { payloadJson: payload, cancelled: row.cancelled, status: row.status },
        create: row,
      });
    } catch {
      continue; // a bill with this id AND number already exists — nothing to do
    }
    // register the bill's verification code so OLD printed barcodes keep verifying
    if (row.verifyCode && !row.cancelled) {
      await upsertRegistry({
        code: row.verifyCode,
        billNo: row.no,
        companyName,
        billDateISO: row.dateISO,
        customerName: row.customerName,
        bill: {
          items: bill.items,
          subtotal: Number(totals.subtotal ?? bill.subtotal),
          itemDiscounts: Number(totals.itemDiscounts ?? bill.itemDiscounts),
          discount: Number(totals.discount ?? bill.discount),
          labourCharge: Number(totals.labourCharge ?? bill.labourCharge),
          autoCharge: Number(totals.autoCharge ?? bill.autoCharge),
          gstPercent: Number(inv.gstPercent ?? 0),
          gst: Number(totals.gst ?? bill.gst),
          total: row.total,
          paid: row.paid,
          balance: row.balance,
        },
        paymentMode: row.paymentMode,
        createdBy: row.createdBy,
      }).catch(() => undefined);
      registered++;
    }
  }

  /* ---- ledger + labour ---- */
  for (const e of expenses) {
    if (!e || typeof e.id !== 'string' || !e.id) continue;
    const d = new Date(String(e.dateISO ?? ''));
    const row = { id: e.id, dateISO: Number.isNaN(d.getTime()) ? new Date() : d, payloadJson: JSON.stringify(e) };
    await db.bizExpense.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const e of incomes) {
    if (!e || typeof e.id !== 'string' || !e.id) continue;
    const d = new Date(String(e.dateISO ?? ''));
    const row = { id: e.id, dateISO: Number.isNaN(d.getTime()) ? new Date() : d, payloadJson: JSON.stringify(e) };
    await db.bizIncome.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const e of labourWorks) {
    if (!e || typeof e.id !== 'string' || !e.id) continue;
    const d = new Date(String(e.dateISO ?? ''));
    const row = { id: e.id, dateISO: Number.isNaN(d.getTime()) ? new Date() : d, payloadJson: JSON.stringify(e) };
    await db.bizLabourWork.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const e of labourWorkers) {
    if (!e || typeof e.id !== 'string' || !e.id) continue;
    const row = { id: e.id, name: String(e.name ?? '').slice(0, 80), payloadJson: JSON.stringify(e) };
    await db.bizLabourWorker.upsert({ where: { id: row.id }, update: row, create: row });
  }

  // lift the atomic bill-number counter past the highest imported number
  if (maxImportedNo > 0) {
    const cfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
    if (!cfg || cfg.nextBillNo < maxImportedNo) {
      await db.appConfig.upsert({
        where: { slot: 'owner' },
        update: { nextBillNo: maxImportedNo },
        create: { slot: 'owner', nextBillNo: maxImportedNo },
      });
    }
  }

  const rev = await bumpRev();
  return Response.json({ ok: true, rev, registered, imported: { products: products.length, invoices: invoices.length } });
}
