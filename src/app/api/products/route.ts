import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev, productToRow } from '@/lib/server/biz';
import type { Product } from '@/lib/types';

/**
 * PUT /api/products — create or update ONE product centrally. The change
 * (price, stock, image, sizes) reaches every device on their next poll.
 */
export async function PUT(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { product?: Product };
  try {
    body = (await req.json()) as { product?: Product };
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const p = body.product;
  if (!p || typeof p.id !== 'string' || !p.id || !String(p.name ?? '').trim()) {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const row = productToRow(p);
  await db.bizProduct.upsert({ where: { id: row.id }, update: row, create: row });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
