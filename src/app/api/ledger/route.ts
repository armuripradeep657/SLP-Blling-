import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev } from '@/lib/server/biz';
import type { Expense, IncomeEntry } from '@/lib/types';

/**
 * PUT /api/ledger — save one expense or manual income entry centrally.
 * DELETE /api/ledger?type=expense|income&id=... — remove it.
 */
export async function PUT(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { type?: 'expense' | 'income'; entry?: Expense | IncomeEntry };
  try {
    body = (await req.json()) as { type?: 'expense' | 'income'; entry?: Expense | IncomeEntry };
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const e = body.entry;
  if (!e || typeof e.id !== 'string' || !e.id || (body.type !== 'expense' && body.type !== 'income')) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const d = new Date(e.dateISO ?? '');
  const row = { id: e.id.slice(0, 60), dateISO: Number.isNaN(d.getTime()) ? new Date() : d, payloadJson: JSON.stringify(e) };
  if (body.type === 'expense') await db.bizExpense.upsert({ where: { id: row.id }, update: row, create: row });
  else await db.bizIncome.upsert({ where: { id: row.id }, update: row, create: row });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}

export async function DELETE(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  const type = url.searchParams.get('type');
  if (!id || (type !== 'expense' && type !== 'income')) return Response.json({ error: 'badRequest' }, { status: 400 });
  if (type === 'expense') await db.bizExpense.deleteMany({ where: { id } });
  else await db.bizIncome.deleteMany({ where: { id } });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
