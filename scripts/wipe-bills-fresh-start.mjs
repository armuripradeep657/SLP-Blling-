/**
 * WIPE BILLS + FRESH START (owner request, 2026-11-18)
 *
 * 1. BACK UP: copy db/custom.db → download/db-backup-before-bill-wipe.db
 *    and export every bill (full payload) → download/bills-backup-2026-11-18.json
 * 2. WIPE:   BizInvoice, VerifiedBill, PaymentEvent, VerificationLog
 *    (sessions, products, settings, staff — untouched)
 * 3. TOMBSTONES: every deleted bill id+no goes into DeletedBill so a stale
 *    device can never resurrect an old bill through the sync.
 * 4. RESET:  AppConfig.nextBillNo = 1000  → the next reserved number is
 *    SLP-INV-1001 (reserve returns current+1).
 * 5. BUMP:   BizState.rev + 1 → every device polls and pulls the fresh state.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';

const DB = 'db/custom.db';
const db = new DatabaseSync(DB);

const invoiceCount = db.prepare('SELECT COUNT(*) c FROM BizInvoice').get().c;
console.log(`bills found: ${invoiceCount}`);
if (invoiceCount === 0) {
  console.log('nothing to wipe — already clean');
  process.exit(0);
}

/* ---- 1. backups ---- */
mkdirSync('download', { recursive: true });
copyFileSync(DB, 'download/db-backup-before-bill-wipe.db');
const invoices = db.prepare('SELECT * FROM BizInvoice ORDER BY no').all();
const verified = db.prepare('SELECT * FROM VerifiedBill').all();
writeFileSync(
  'download/bills-backup-2026-11-18.json',
  JSON.stringify({ exportedAt: new Date().toISOString(), invoices, verifiedBills: verified }, null, 2)
);
console.log(`backup: download/db-backup-before-bill-wipe.db + download/bills-backup-2026-11-18.json (${invoices.length} bills)`);

/* ---- 2-5. wipe + tombstones + counter + rev, atomically ---- */
db.exec('BEGIN');
try {
  db.exec('DELETE FROM VerificationLog');
  db.exec('DELETE FROM PaymentEvent');
  db.exec('DELETE FROM VerifiedBill');
  const tomb = db.prepare('INSERT OR IGNORE INTO DeletedBill (id, no, deletedAt) VALUES (?, ?, ?)');
  for (const inv of invoices) tomb.run(inv.id, inv.no, Date.now());
  db.exec('DELETE FROM BizInvoice');
  db.prepare("UPDATE AppConfig SET nextBillNo = 1000, updatedAt = ? WHERE slot = 'owner'").run(Date.now());
  db.prepare('UPDATE BizState SET rev = rev + 1, updatedAt = ? WHERE id = ?').run(Date.now(), 'owner');
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

const check = {
  invoices: db.prepare('SELECT COUNT(*) c FROM BizInvoice').get().c,
  verified: db.prepare('SELECT COUNT(*) c FROM VerifiedBill').get().c,
  payments: db.prepare('SELECT COUNT(*) c FROM PaymentEvent').get().c,
  verLogs: db.prepare('SELECT COUNT(*) c FROM VerificationLog').get().c,
  tombstones: db.prepare('SELECT COUNT(*) c FROM DeletedBill').get().c,
  nextBillNo: db.prepare("SELECT nextBillNo FROM AppConfig WHERE slot='owner'").get().nextBillNo,
  rev: db.prepare("SELECT rev FROM BizState WHERE id='owner'").get().rev,
  products: db.prepare('SELECT COUNT(*) c FROM BizProduct').get().c,
  sessions: db.prepare('SELECT COUNT(*) c FROM Session').get().c,
};
console.log('after wipe:', JSON.stringify(check, null, 2));
console.log('next reserved bill number will be: SLP-INV-' + (check.nextBillNo + 1));
