import { db } from '@/lib/db';
import { bearerToken, sessionAuth } from '@/lib/server/auth';

/**
 * GET /api/bills — OWNER-ONLY staff-billing monitor (v35). Reads the
 * VerifiedBill registry (the centralized, immutable bill store — bills are
 * written ONLY by the save/registration path, so staff can neither hide,
 * delete nor modify saved records here).
 *
 * Query params:
 *   q      — free text: bill no / customer name / staff name
 *   staff  — exact staff username filter ("Owner" for owner bills)
 *   from,to— ISO date bounds on the bill date
 *   limit  — max rows (default 300)
 *
 * Returns the rows PLUS per-staff totals (sales, discounts, bill count) and
 * flags bills whose item discounts are unusually high (> 20% of the line).
 */
export async function GET(req: Request) {
  const auth = await sessionAuth(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (auth.role !== 'owner') return Response.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const staff = (url.searchParams.get('staff') ?? '').trim();
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 300) || 300, 500);

  const where: Record<string, unknown> = {};
  if (staff) where.createdBy = staff;
  if (from && !Number.isNaN(new Date(from).getTime())) {
    where.billDateISO = { ...(where.billDateISO as object | undefined), gte: new Date(from) };
  }
  if (to && !Number.isNaN(new Date(to).getTime())) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.billDateISO = { ...(where.billDateISO as object | undefined), lte: end };
  }
  const rowsAll = await db.verifiedBill.findMany({
    where,
    orderBy: { billDateISO: 'desc' },
    take: limit,
  });
  // q — CASE-INSENSITIVE contains. SQLite has no insensitive mode in Prisma
  // (a lowercased q never matches "Ravi Kumar"), so the free-text filter
  // runs in JS over the fetched window.
  const rows = q
    ? rowsAll.filter(
        (b) =>
          (b.billNo || '').toLowerCase().includes(q) ||
          (b.customerName || '').toLowerCase().includes(q) ||
          (b.createdBy || '').toLowerCase().includes(q)
      )
    : rowsAll;

  const bills = rows.map((b) => {
    const items = safeParse(b.itemsJson) as Array<Record<string, unknown>>;
    // flag bills with an unusually high per-line discount (> 20% of the line)
    const highDiscount = items.some((it) => {
      const price = Number(it.price ?? 0);
      const qty = Number(it.qty ?? 0);
      const disc = Number(it.discountAmount ?? it.discount ?? 0);
      return price * qty > 0 && disc / (price * qty) > 0.2;
    });
    return {
      code: b.code,
      billNo: b.billNo,
      companyName: b.companyName,
      billDateISO: b.billDateISO,
      customerName: b.customerName,
      items,
      gstPercent: b.gstPercent,
      gstAmount: b.gstAmount,
      discount: b.discount,
      labourCharge: b.labourCharge,
      autoCharge: b.autoCharge,
      subtotal: b.subtotal,
      total: b.total,
      paid: b.paid,
      balance: b.balance,
      paymentMode: b.paymentMode,
      paymentStatus: b.paymentStatus,
      createdBy: b.createdBy,
      createdById: b.createdById,
      cancelled: b.cancelled,
      highDiscount,
    };
  });

  // per-staff totals over ALL matching rows
  const byStaff = new Map<string, { staff: string; bills: number; sales: number; discounts: number }>();
  for (const b of bills) {
    if (b.cancelled) continue;
    const key = b.createdBy || 'Owner';
    const cur = byStaff.get(key) ?? { staff: key, bills: 0, sales: 0, discounts: 0 };
    cur.bills += 1;
    cur.sales = Math.round((cur.sales + b.total) * 100) / 100;
    cur.discounts = Math.round((cur.discounts + b.discount) * 100) / 100;
    byStaff.set(key, cur);
  }

  return Response.json({
    bills,
    staffTotals: [...byStaff.values()].sort((a, b) => b.sales - a.sales),
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
