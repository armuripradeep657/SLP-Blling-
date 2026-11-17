import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev } from '@/lib/server/biz';
import type { LabourWork, LabourWorker } from '@/lib/types';

/**
 * PUT /api/labour — save ONE labour-work entry centrally (create or
 * update — edits and later payments re-PUT the whole entry).
 * DELETE /api/labour?id=... — remove it. ?worker=1 deletes a saved worker.
 */
export async function PUT(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { work?: LabourWork; worker?: LabourWorker };
  try {
    body = (await req.json()) as { work?: LabourWork; worker?: LabourWorker };
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }

  if (body.work && typeof body.work.id === 'string' && body.work.id) {
    const d = new Date(body.work.dateISO ?? '');
    const row = {
      id: body.work.id.slice(0, 60),
      dateISO: Number.isNaN(d.getTime()) ? new Date() : d,
      payloadJson: JSON.stringify(body.work),
    };
    await db.bizLabourWork.upsert({ where: { id: row.id }, update: row, create: row });
    // auto-save newly-typed workers into the notebook, like the old client did
    const name = String(body.work.name ?? '').trim();
    if (name) {
      const exists = await db.bizLabourWorker.findFirst({ where: { name: { equals: name } } });
      if (!exists) {
        const w: LabourWorker = { id: `worker-${Date.now()}`, name };
        const wrow = { id: w.id, name, payloadJson: JSON.stringify(w) };
        await db.bizLabourWorker.upsert({ where: { id: wrow.id }, update: wrow, create: wrow });
      }
    }
    const rev = await bumpRev();
    return Response.json({ ok: true, rev });
  }

  if (body.worker && typeof body.worker.id === 'string' && body.worker.id && String(body.worker.name ?? '').trim()) {
    const row = {
      id: body.worker.id.slice(0, 60),
      name: String(body.worker.name).slice(0, 80),
      payloadJson: JSON.stringify(body.worker),
    };
    await db.bizLabourWorker.upsert({ where: { id: row.id }, update: row, create: row });
    const rev = await bumpRev();
    return Response.json({ ok: true, rev });
  }

  return Response.json({ error: 'badRequest' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  const isWorker = url.searchParams.get('worker') === '1';
  if (!id) return Response.json({ error: 'badRequest' }, { status: 400 });
  if (isWorker) await db.bizLabourWorker.deleteMany({ where: { id } });
  else await db.bizLabourWork.deleteMany({ where: { id } });
  const rev = await bumpRev();
  return Response.json({ ok: true, rev });
}
