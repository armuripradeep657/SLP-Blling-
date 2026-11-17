import { db } from '@/lib/db';
import { bearerToken, requireOwner, requireStaff } from '@/lib/server/auth';
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
  const token = bearerToken(req);
  const owner = await requireOwner(token);
  const st = await ensureBizState();
  const url = new URL(req.url);
  const known = Number(url.searchParams.get('rev') ?? '-1');

  /* ----- staff devices (v39): products + bills ONLY — no money, no
     settings, no labour. The staff session itself answers 401. ----- */
  if (!owner) {
    const staff = await requireStaff(token);
    if (!staff) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const full = await snapshot();
    return Response.json({
      rev: st.rev,
      products: full.products,
      /* v40: staff devices see ONLY the bills they created — the owner's
         full history never leaves the server for a staff session */
      invoices: full.invoices.filter((i) => i.createdBy === staff.name),
      config: full.config,
      staffMode: true,
    });
  }

  if (Number.isFinite(known) && known === st.rev) {
    return Response.json({ unchanged: true, rev: st.rev });
  }
  const data = await snapshot();
  return Response.json({ rev: st.rev, ...data });
}
