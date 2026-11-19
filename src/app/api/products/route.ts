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

/**
 * PATCH /api/products — v52 partial update: changes ONLY the fields the
 * request actually carries. Every other column of the product row is left
 * byte-identical (the owner's rule: editing one detail must never touch
 * anything else, and an absent field can never wipe a saved value).
 * `null` is the explicit "clear this field" signal (photo/nameTe removal).
 */
export async function PATCH(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    id?: string;
    name?: string;
    nameTe?: string | null;
    category?: string;
    price?: number;
    sizes?: string[];
    sizePrices?: Record<string, number>;
    image?: string | null;
    stock?: number | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  const id = String(body?.id ?? '');
  if (!id) return Response.json({ error: 'badRequest' }, { status: 400 });

  const existing = await db.bizProduct.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: 'notFound' }, { status: 404 });

  // build the update from ONLY the provided keys — absent keys never appear
  // in the Prisma `update` payload, so Prisma leaves those columns untouched
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 80);
    if (!name) return Response.json({ error: 'badRequest' }, { status: 400 });
    data.name = name;
  }
  if (body.nameTe !== undefined) {
    data.nameTe = body.nameTe === null || String(body.nameTe).trim() === '' ? null : String(body.nameTe).trim().slice(0, 80);
  }
  if (body.category !== undefined) {
    data.category = String(body.category).trim().slice(0, 40) || 'Custom';
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return Response.json({ error: 'badRequest' }, { status: 400 });
    data.price = price;
  }
  if (body.sizes !== undefined) {
    if (!Array.isArray(body.sizes)) return Response.json({ error: 'badRequest' }, { status: 400 });
    // v50 cap: 60 sizes per product (the owner's 23-size slab line needs it)
    data.sizesJson = JSON.stringify(body.sizes.slice(0, 60).map(String));
  }
  if (body.sizePrices !== undefined) {
    if (typeof body.sizePrices !== 'object' || body.sizePrices === null) {
      return Response.json({ error: 'badRequest' }, { status: 400 });
    }
    data.sizePricesJson = JSON.stringify(body.sizePrices);
  }
  if (body.image !== undefined) {
    data.image = body.image === null ? null : String(body.image).slice(0, 3_000_000);
  }
  if (body.stock !== undefined) {
    data.stock = body.stock === null ? null : Math.round(Number(body.stock) || 0);
  }

  if (Object.keys(data).length === 0) {
    // nothing to change — do not bump the rev, do not touch the row
    const st = await db.bizState.findUnique({ where: { id: 'owner' } });
    return Response.json({ ok: true, rev: st?.rev ?? 0 });
  }
  await db.bizProduct.update({ where: { id }, data });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
