import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev, ensureBizState, snapshot } from '@/lib/server/biz';

/**
 * GET /api/state?rev=N
 *
 * The ONE central online database snapshot. Devices poll this every few
 * seconds with their last-seen revision; when the revision moved (any
 * device wrote anything) the FULL current state comes back — products,
 * bills, settings, labour, ledger. No manual refresh on any device, ever.
 */
export async function GET(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const st = await ensureBizState();
  const url = new URL(req.url);
  const known = Number(url.searchParams.get('rev') ?? '-1');

  if (Number.isFinite(known) && known === st.rev) {
    return Response.json({ unchanged: true, rev: st.rev });
  }
  const data = await snapshot();
  return Response.json({ rev: st.rev, ...data });
}
