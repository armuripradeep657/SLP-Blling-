import { db } from '@/lib/db';
import { bearerToken, requireOwner } from '@/lib/server/auth';
import { bumpRev } from '@/lib/server/biz';
import type { Appearance, BusinessSettings } from '@/lib/types';

/**
 * PUT /api/settings — shop settings + appearance, centrally. UPI ID and
 * GST are ALSO mirrored into AppConfig (the server-enforced fields: the
 * payment QR and every recomputed bill total use the central values), so
 * an UPI/GST change updates every device's QR and billing immediately.
 */
export async function PUT(req: Request) {
  const auth = await requireOwner(bearerToken(req));
  if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { settings?: Partial<BusinessSettings>; appearance?: Partial<Appearance> };
  try {
    body = (await req.json()) as { settings?: Partial<BusinessSettings>; appearance?: Partial<Appearance> };
  } catch {
    return Response.json({ error: 'badRequest' }, { status: 400 });
  }
  if (!body.settings && !body.appearance) return Response.json({ error: 'badRequest' }, { status: 400 });

  const prev = await db.bizSettings.findUnique({ where: { id: 'owner' } });
  const prevSettings: Partial<BusinessSettings> = prev ? safeParse(prev.settingsJson) : {};
  const prevAppearance: Partial<Appearance> = prev ? safeParse(prev.appearanceJson) : {};
  /* v41: resetBillNo is a transient COMMAND, never a stored setting — consume
     it here and strip it so it can't re-trigger on a later settings save.
     v55: setNextBillNo is the same kind of command for the "Next bill no."
     field — the owner points the sequence at ANY number and every bill from
     the next one onward counts from there (up OR down; taken numbers are
     still skipped at bill-save time). */
  const bodySettings = { ...(body.settings ?? {}) } as Record<string, unknown>;
  const resetBillNo = bodySettings.resetBillNo === true;
  delete bodySettings.resetBillNo;
  const setNextBillNo = bodySettings.setNextBillNo === true;
  delete bodySettings.setNextBillNo;
  const settings = { ...prevSettings, ...bodySettings };
  const appearance = { ...prevAppearance, ...(body.appearance ?? {}) };
  // store in SECONDS — the Int column cannot hold Date.now() ms
  const dataUpdatedAt = Math.floor(Date.now() / 1000);

  await db.bizSettings.upsert({
    where: { id: 'owner' },
    update: { settingsJson: JSON.stringify(settings), appearanceJson: JSON.stringify(appearance), dataUpdatedAt },
    create: { id: 'owner', settingsJson: JSON.stringify(settings), appearanceJson: JSON.stringify(appearance), dataUpdatedAt },
  });

  const gst = Number(settings.gstPercent ?? 0);
  // the owner's "next invoice no" edit LIFTS the central counter — the slip
  // sequence continues from wherever the owner sets it, never rewinding.
  // EXCEPTION (v41): the explicit "Start from 1" reset — the counter goes
  // exactly where the owner points it (next bill = nextInvoiceNo), and the
  // bill-save collision check still skips any number an old bill holds.
  // EXCEPTION (v55): the explicit "Next bill no." edit — the same authority
  // as the reset, to ANY number: the very next bill gets that number and the
  // sequence continues firmly from there (down as well as up).
  const nextInv = Math.round(Number((settings as { nextInvoiceNo?: number }).nextInvoiceNo ?? 0));
  const prevCfg = await db.appConfig.findUnique({ where: { slot: 'owner' } });
  const lifted = Math.max(
    prevCfg?.nextBillNo ?? 0,
    Number.isFinite(nextInv) && nextInv > 1 ? nextInv - 1 : 0
  );
  const resetTo = Number.isFinite(nextInv) && nextInv > 0 ? nextInv - 1 : 0;
  const counterVal = resetBillNo
    ? Math.min(lifted, resetTo)
    : setNextBillNo && Number.isFinite(nextInv) && nextInv > 0
      ? nextInv - 1
      : lifted;
  await db.appConfig.upsert({
    where: { slot: 'owner' },
    update: { upiId: String(settings.upiId ?? ''), gstPercent: Number.isFinite(gst) ? gst : 0, nextBillNo: counterVal },
    create: { slot: 'owner', upiId: String(settings.upiId ?? ''), gstPercent: Number.isFinite(gst) ? gst : 0, nextBillNo: counterVal },
  });

  const rev = await bumpRev();
  return Response.json({ ok: true, rev, nextBillNo: counterVal });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
