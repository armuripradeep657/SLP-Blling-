import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev } from '@/lib/server/biz';

/** DELETE /api/products/[id] — remove a product from the central catalog */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  await db.bizProduct.deleteMany({ where: { id } });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
