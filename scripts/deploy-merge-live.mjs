#!/usr/bin/env node
/**
 * v52 DEPLOY-MERGE — run BEFORE every `git push` (i.e. before every deploy).
 *
 * WHY: the platform deploy replaces the app (and its bundled SQLite file,
 * db/custom.db) with the freshly built repo copy. Any bill, expense, labour
 * entry or product edit made on the owner's phones AFTER the previous deploy
 * lives only in the runtime database and would be WIPED by the next deploy.
 * This tool makes every deploy ship the UNION of repo + live instead:
 *
 *   1. backs up the repo DB (download/db-backup-before-merge-<ts>.db)
 *   2. fetches the LIVE central state (owner token)
 *   3. merges into the repo DB:
 *        bills / expenses / incomes / labour works / workers / tombstones
 *          → LIVE is authoritative (the runtime db is where the owner works;
 *            the repo copy is only a stale mirror of it)
 *        products → per-row NEWER updatedAt wins (owner edits on phones vs
 *          catalogue work in the repo — neither side can clobber the other)
 *        settings / appearance / upi / gst → LIVE wins (changed on phones)
 *        nextBillNo → max(repo, live)   rev → max(repo, live) + 1
 *   4. deletions: ids that were on LIVE at the previous merge but are gone
 *        from live now were deleted by the owner on a phone — they are
 *        removed from the repo too (baseline: download/live-ids-last.json).
 *        Ids never seen on live are NEW repo work and are kept.
 *
 * Idempotent: safe to run any number of times.
 */
import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const LIVE = process.env.SLP_LIVE_URL || 'https://prasad.space-z.ai';
const OWNER_USER = process.env.SLP_OWNER_USER || 'Pradeep';
const OWNER_PASS = process.env.SLP_OWNER_PASS || '2125';
const DB = 'db/custom.db';
const BASELINE = 'download/live-ids-last.json';
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

/* ---------- 1. backup the repo DB first (protect-the-protector) ---------- */
copyFileSync(DB, `download/db-backup-before-merge-${ts}.db`);
console.log(`✓ repo DB backed up → download/db-backup-before-merge-${ts}.db`);

/* ---------- 2. fetch the live state ---------- */
const loginRes = await fetch(`${LIVE}/api/auth/owner/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: OWNER_USER, password: OWNER_PASS }),
});
if (!loginRes.ok) throw new Error(`live login failed: HTTP ${loginRes.status}`);
const { token } = await loginRes.json();
if (!token) throw new Error('live login returned no token');
const stateRes = await fetch(`${LIVE}/api/state?rev=-1`, { headers: { Authorization: `Bearer ${token}` } });
if (!stateRes.ok) throw new Error(`live state fetch failed: HTTP ${stateRes.status}`);
const live = await stateRes.json();
console.log(`✓ live state fetched: ${live.products?.length ?? 0} products, ${live.invoices?.length ?? 0} bills, rev ${live.rev}`);

/* ---------- 3. deletion baseline (what the owner removed on live) ---------- */
const prev = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
const liveIds = {
  products: (live.products ?? []).map((p) => p.id),
  invoices: (live.invoices ?? []).map((i) => i.id),
  expenses: (live.expenses ?? []).map((e) => e.id),
  incomes: (live.incomes ?? []).map((e) => e.id),
  labourWorks: (live.labourWorks ?? []).map((e) => e.id),
  labourWorkers: (live.labourWorkers ?? []).map((e) => e.id),
  tombstones: (live.deletedBills ?? []).map((t) => t.id),
};

const db = new DatabaseSync(DB);
const now = new Date().toISOString();
const stats = { billsInserted: 0, tombstones: 0, verified: 0, productsNew: 0, productsUpdated: 0, repoProductsRemoved: 0, removedDeleted: 0 };

/* ---------- 4. bills: the LIVE snapshot is authoritative ---------- */
/* Live rows were saved through the API (which enforces numbering + the
   registry) — they are never stale-device re-imports, so tombstone filters
   must NOT block them (the owner's counter reset legitimately re-used the
   number SLP-INV-1001 that an old DELETED bill once held). Bills the owner
   deleted on live are removed via the deletion baseline below. */
const insBill = db.prepare(
  `INSERT OR REPLACE INTO BizInvoice (id, no, dateISO, customerName, customerPhone, total, paid, balance, status, paymentMode, verifyCode, cancelled, createdBy, payloadJson, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const i of live.invoices ?? []) {
  const total = Number(i.totals?.total ?? 0);
  const paid = Number(i.totals?.paid ?? 0);
  const balance = Number(i.totals?.balance ?? 0);
  insBill.run(
    i.id, i.no, i.dateISO, i.customer?.name ?? '', i.customer?.phone ?? '', total, paid, balance,
    balance <= 0 ? 'Paid' : 'Due', i.paymentMode ?? 'Cash', i.verifyCode ?? null,
    i.cancelled === true ? 1 : 0, i.createdBy ?? 'Owner', JSON.stringify(i), i.dateISO, now
  );
  stats.billsInserted++;
}
// bills deleted on LIVE since the previous merge (in the baseline, missing
// from live now) → remove from the repo as well — deleted never comes back
if (prev?.invoices) {
  const delBill = db.prepare(`DELETE FROM BizInvoice WHERE id = ?`);
  for (const id of prev.invoices) {
    if (!liveIds.invoices.includes(id)) delBill.run(id);
  }
}

/* ---------- 5. tombstones: carry deleted-bill rows into the repo ---------- */
const insTomb = db.prepare(`INSERT OR IGNORE INTO DeletedBill (id, no, deletedAt) VALUES (?, ?, ?)`);
for (const t of live.deletedBills ?? []) {
  insTomb.run(t.id, t.no, t.deletedAt);
  stats.tombstones++;
}

/* ---------- 5b. barcode registry: mirror VerifiedBill rows ---------- */
/* Without this, a bill saved on a phone after the last deploy would FAIL
   barcode verification after the deploy (its registry row lived only in the
   runtime DB). The code always comes from the live registry. */
const insVB = db.prepare(
  `INSERT OR REPLACE INTO VerifiedBill (id, code, billNo, slot, companyName, billDateISO, customerName, gstPercent, gstAmount, discount, labourCharge, autoCharge, subtotal, total, paid, balance, paymentMode, paymentStatus, createdBy, cancelled, itemsJson, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const v of live.verifiedBills ?? []) {
  insVB.run(
    v.id, v.code, v.billNo, v.slot ?? 'owner', v.companyName ?? '', v.billDateISO, v.customerName ?? '',
    Number(v.gstPercent ?? 0), Number(v.gstAmount ?? 0), Number(v.discount ?? 0), Number(v.labourCharge ?? 0),
    Number(v.autoCharge ?? 0), Number(v.subtotal ?? 0), Number(v.total ?? 0), Number(v.paid ?? 0),
    Number(v.balance ?? 0), v.paymentMode ?? 'Cash', v.paymentStatus ?? 'Due', v.createdBy ?? 'Owner',
    v.cancelled ? 1 : 0, v.itemsJson ?? '[]', v.createdAt, now
  );
  stats.verified++;
}
// fallback for an older live build whose /api/state does not expose the
// registry yet — synthesize the rows from the bill payloads (the code and
// totals live inside each payload), so verification survives THIS deploy
if (!Array.isArray(live.verifiedBills)) {
  for (const i of live.invoices ?? []) {
    if (!i.verifyCode) continue;
    const t = i.totals ?? {};
    insVB.run(
      `vb-${i.id}`, i.verifyCode, i.no, 'owner', i.companyName ?? i.shopSnapshot?.companyName ?? 'SLP Cement Works',
      i.dateISO, i.customer?.name ?? '', Number(t.gst ?? 0), Number(t.gst ?? 0), Number(t.discount ?? 0),
      Number(t.labourCharge ?? 0), Number(t.autoCharge ?? 0), Number(t.subtotal ?? 0), Number(t.total ?? 0),
      Number(t.paid ?? 0), Number(t.balance ?? 0), i.paymentMode ?? 'Cash',
      Number(t.balance ?? 0) <= 0 ? 'Paid' : 'Due', 'Owner', i.cancelled ? 1 : 0,
      JSON.stringify(i.items ?? []), i.dateISO, now
    );
    stats.verified++;
  }
}

/* ---------- 6. ledger + labour: live wins wholesale ---------- */
const insLedger = (table) => db.prepare(`INSERT OR REPLACE INTO ${table} (id, dateISO, payloadJson, updatedAt) VALUES (?, ?, ?, ?)`);
const insE = insLedger('BizExpense'), insI = insLedger('BizIncome'), insW = insLedger('BizLabourWork');
for (const e of live.expenses ?? []) insE.run(e.id, e.dateISO, JSON.stringify(e), now);
for (const e of live.incomes ?? []) insI.run(e.id, e.dateISO, JSON.stringify(e), now);
for (const e of live.labourWorks ?? []) insW.run(e.id, e.dateISO, JSON.stringify(e), now);
const insWorker = db.prepare(`INSERT OR REPLACE INTO BizLabourWorker (id, name, payloadJson, updatedAt) VALUES (?, ?, ?, ?)`);
for (const w of live.labourWorkers ?? []) insWorker.run(w.id, w.name ?? '', JSON.stringify(w), now);

/* ---------- 7. products: per-row NEWER updatedAt wins ---------- */
const liveById = new Map((live.products ?? []).map((p) => [p.id, p]));
const repoRows = db.prepare(`SELECT id, name, nameTe, category, price, sizesJson, sizePricesJson, image, stock, createdAt, updatedAt FROM BizProduct`).all();
const repoById = new Map(repoRows.map((r) => [r.id, r]));
const upsertProduct = db.prepare(
  `INSERT OR REPLACE INTO BizProduct (id, name, nameTe, category, price, sizesJson, sizePricesJson, image, stock, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const productRow = (p, createdAt) => [
  p.id, p.name, p.nameTe ?? null, p.category ?? 'Custom', Number(p.price ?? 0),
  JSON.stringify(p.sizes ?? []), JSON.stringify(p.sizePrices ?? {}), p.image ?? null, p.stock ?? null,
  createdAt, p.updatedAt ?? now,
];
for (const [id, lp] of liveById) {
  const rr = repoById.get(id);
  if (!rr) {
    upsertProduct.run(...productRow(lp, lp.updatedAt ?? now));
    stats.productsNew++;
    continue;
  }
  const liveT = Date.parse(lp.updatedAt ?? '') || 0;
  const repoT = Date.parse(rr.updatedAt ?? '') || 0;
  if (liveT > repoT) {
    upsertProduct.run(...productRow(lp, rr.createdAt));
    stats.productsUpdated++;
  } // else: repo row is the newer edit — keep it (it will deploy)
}
// products the owner deleted on LIVE since the previous merge (in the
// baseline, missing from live now) → remove from the repo as well
if (prev?.products) {
  const deletedOnLive = prev.products.filter((id) => !liveIds.products.includes(id));
  const delP = db.prepare(`DELETE FROM BizProduct WHERE id = ?`);
  for (const id of deletedOnLive) {
    if (repoById.has(id)) { delP.run(id); stats.removedDeleted++; }
  }
}

/* ---------- 8. ledger/labour deletions from the baseline ---------- */
const removeMissing = (ids, table, key = 'id') => {
  if (!prev?.[ids]) return 0;
  const gone = prev[ids].filter((id) => !liveIds[ids].includes(id));
  const del = db.prepare(`DELETE FROM ${table} WHERE ${key} = ?`);
  let n = 0;
  for (const id of gone) { del.run(id); n++; }
  return n;
};
stats.repoRemovedLedger =
  removeMissing('expenses', 'BizExpense') + removeMissing('incomes', 'BizIncome') +
  removeMissing('labourWorks', 'BizLabourWork') + removeMissing('labourWorkers', 'BizLabourWorker');

/* ---------- 9. settings/appearance/config: live wins; counters take the MAX ---------- */
const liveSettings = JSON.stringify(live.settings ?? {});
const liveAppearance = JSON.stringify(live.appearance ?? {});
db.prepare(
  `INSERT INTO BizSettings (id, settingsJson, appearanceJson, dataUpdatedAt, updatedAt) VALUES ('owner', ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET settingsJson = excluded.settingsJson, appearanceJson = excluded.appearanceJson, dataUpdatedAt = excluded.dataUpdatedAt, updatedAt = excluded.updatedAt`
).run(liveSettings, liveAppearance, Math.floor(Date.now() / 1000), now);
const repoCfg = db.prepare(`SELECT nextBillNo FROM AppConfig WHERE slot = 'owner'`).get();
const nextBillNo = Math.max(repoCfg?.nextBillNo ?? 0, Number(live.config?.nextBillNo ?? 0));
db.prepare(
  `INSERT INTO AppConfig (id, slot, upiId, gstPercent, nextBillNo, updatedAt) VALUES ('cfg-owner', 'owner', ?, ?, ?, ?)
   ON CONFLICT(slot) DO UPDATE SET upiId = excluded.upiId, gstPercent = excluded.gstPercent, nextBillNo = excluded.nextBillNo, updatedAt = excluded.updatedAt`
).run(live.config?.upiId ?? '', Number(live.config?.gstPercent ?? 0), nextBillNo, now);

/* ---------- 10. rev = max(repo, live) + 1 → every device re-pulls after deploy ---------- */
const st = db.prepare(`SELECT rev FROM BizState WHERE id = 'owner'`).get();
const newRev = Math.max(st?.rev ?? 0, Number(live.rev ?? 0)) + 1;
db.prepare(`UPDATE BizState SET rev = ? WHERE id = 'owner'`).run(newRev);

writeFileSync(BASELINE, JSON.stringify(liveIds, null, 1));
db.close();

console.log(`✓ merged: +${stats.billsInserted} bill rows, ${stats.tombstones} tombstones, ${stats.verified} registry rows, ${stats.productsNew} new products, ${stats.productsUpdated} products took the live (newer) version, ${stats.removedDeleted} owner-deleted products removed, ledger/labour deletions applied: ${stats.repoRemovedLedger}`);
console.log(`✓ nextBillNo=${nextBillNo} (max of both sides) | rev → ${newRev} | baseline saved`);
console.log('DONE — the deploy will now ship the UNION of repo + live. Nothing is reset.');
