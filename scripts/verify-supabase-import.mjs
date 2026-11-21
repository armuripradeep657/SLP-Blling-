// Verify the Supabase import matches the repo SQLite verbatim:
// per-table counts + the counter/settings raw values.
import { DatabaseSync } from 'node:sqlite';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const models = [
  'syncAccount', 'staffAccount', 'appConfig', 'bizState', 'bizSettings',
  'bizProduct', 'bizInvoice', 'bizExpense', 'bizIncome', 'bizLabourWork',
  'verifiedBill', 'verificationLog', 'session', 'staffSession',
  'passwordResetLog', 'deletedBill',
];

const sq = new DatabaseSync(process.env.SQLITE_PATH || './db/custom.db');

let mismatches = 0;
for (const m of models) {
  const table = m.charAt(0).toUpperCase() + m.slice(1);
  let pgCount = 0;
  try { pgCount = await prisma[m].count(); } catch { pgCount = -1; }
  let liteCount = 0;
  try { liteCount = sq.prepare(`SELECT COUNT(*) c FROM "${table}"`).get().c; } catch { liteCount = -1; }
  const ok = pgCount === liteCount;
  if (!ok) mismatches++;
  console.log(`${ok ? 'OK ' : 'MISMATCH'} ${table}: sqlite=${liteCount} supabase=${pgCount}`);
}

// raw settings + counter comparison
const liteSettings = JSON.parse(sq.prepare(`SELECT settingsJson j FROM "BizSettings" WHERE id='owner'`).get().j);
const pgSettings = JSON.parse((await prisma.bizSettings.findUnique({ where: { id: 'owner' } })).settingsJson);
for (const k of ['companyName', 'ownerName', 'upiId', 'nextInvoiceNo', 'invoicePrefix']) {
  const same = liteSettings[k] === pgSettings[k];
  if (!same) mismatches++;
  console.log(`${same ? 'OK ' : 'MISMATCH'} settings.${k}: sqlite=${JSON.stringify(liteSettings[k])} supabase=${JSON.stringify(pgSettings[k])}`);
}

const liteCfg = sq.prepare(`SELECT upiId, gstPercent, nextBillNo FROM "AppConfig" WHERE slot='owner'`).get();
const pgCfg = await prisma.appConfig.findUnique({ where: { slot: 'owner' } });
for (const k of ['upiId', 'gstPercent', 'nextBillNo']) {
  const same = String(liteCfg[k]) === String(pgCfg[k]);
  if (!same) mismatches++;
  console.log(`${same ? 'OK ' : 'MISMATCH'} AppConfig.${k}: sqlite=${liteCfg[k]} supabase=${pgCfg[k]}`);
}

console.log(mismatches === 0 ? 'VERBATIM MATCH — import verified' : `MISMATCHES: ${mismatches}`);
await prisma.$disconnect();
