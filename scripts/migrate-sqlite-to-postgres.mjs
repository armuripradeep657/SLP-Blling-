#!/usr/bin/env node
/**
 * v47 — one-time SQLite → PostgreSQL data migration (no new dependencies).
 *
 *   1) DUMP  (run while the app still uses SQLite):
 *      DATABASE_URL=file:./db/custom.db node scripts/migrate-sqlite-to-postgres.mjs dump
 *      → writes db/migration-dump.json (every table, every row)
 *
 *   2) SWITCH the provider (happens automatically at build time when
 *      DATABASE_URL starts with postgres — see scripts/use-postgres-schema.mjs),
 *      then push the schema to the new database:
 *      DATABASE_URL=postgres://… npx prisma db push
 *
 *   3) IMPORT (run with the postgres schema + URL active):
 *      DATABASE_URL=postgres://… node scripts/migrate-sqlite-to-postgres.mjs import
 *      → re-creates every row with the SAME ids, MPIN verifier, products,
 *        bills, sessions… (idempotent: safe to re-run, existing rows skip)
 *
 * Login data migrates intact: the MPIN salt + verifier and the owner
 * password hash are rows like everything else — nobody re-registers.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MODE = process.argv[2] || '';
const DUMP_PATH = fileURLToPath(new URL('../db/migration-dump.json', import.meta.url));

/** Tables in FK-safe order (account rows first — Session references them). */
const TABLE_ORDER = [
  'SyncAccount',
  'StaffAccount',
  'AppConfig',
  'BizState',
  'BizSettings',
  'BizProduct',
  'BizInvoice',
  'BizExpense',
  'BizIncome',
  'BizLabourWork',
  'BizLabourWorker',
  'PaymentEvent',
  'VerifiedBill',
  'VerificationLog',
  'Session',
  'StaffSession',
  'PasswordResetLog',
  'DeletedBill',
];

/** Prisma DateTime columns → values must become Date objects on import. */
// dataUpdatedAt is unix SECONDS (Int in both schemas) — never Date-ify it
const isDateCol = (col) => col !== 'dataUpdatedAt' && (col === 'dateISO' || col.endsWith('At'));

/** Prisma Boolean columns (SQLite stores 0/1) → real booleans on import. */
const BOOL_COLS = new Set([
  'cancelled',
  'active',
  'mustChangePassword',
  'ownerPasswordIsDefault',
]);

function dump() {
  const url = (process.env.DATABASE_URL || '').replace(/^file:/, '') || 'db/custom.db';
  if (!existsSync(url)) {
    console.error(`SQLite database not found at ${url} — set DATABASE_URL=file:…`);
    process.exit(1);
  }
  const db = new DatabaseSync(url, { readOnly: true });
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_sqlite%' AND name NOT LIKE '_prisma%'")
    .all()
    .map((r) => r.name)
    .filter((name) => TABLE_ORDER.includes(name));
  const dump = { dumpedAt: new Date().toISOString(), tables: {} };
  for (const t of TABLE_ORDER) {
    if (!tables.includes(t)) continue;
    const rows = db.prepare(`SELECT * FROM "${t}"`).all();
    dump.tables[t] = rows;
  }
  writeFileSync(DUMP_PATH, JSON.stringify(dump));
  console.log(`dumped → ${DUMP_PATH}`);
  for (const [t, rows] of Object.entries(dump.tables)) console.log(`  ${t}: ${rows.length} rows`);
}

function toPrismaValue(col, v) {
  if (BOOL_COLS.has(col)) return v === 1 || v === true;
  if (isDateCol(col) && v !== null && v !== undefined) {
    if (typeof v === 'number') return new Date(v);
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return v;
}

async function importData() {
  if (!existsSync(DUMP_PATH)) {
    console.error(`No dump at ${DUMP_PATH} — run the "dump" step first`);
    process.exit(1);
  }
  const { PrismaClient } = await import('@prisma/client');
  // Supabase shared pooler (6543) runs PgBouncer — Prisma needs
  // pgbouncer=true (+ tiny connection limit, TLS). Append when missing.
  // NOTE: for `db push` and this import prefer the SESSION pooler (port
  // 5432); the params below keep the pooled 6543 URL working too.
  const rawUrl = process.env.DATABASE_URL || '';
  let datasourceUrl;
  if (rawUrl.startsWith('postgres')) {
    try {
      const u = new URL(rawUrl.replace('postgres://', 'postgresql://'));
      if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
      if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1');
      if (!u.searchParams.has('sslmode')) u.searchParams.set('sslmode', 'require');
      datasourceUrl = u.toString();
    } catch {
      datasourceUrl = rawUrl;
    }
  }
  const prisma = new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
  try {
    const dump = JSON.parse(readFileSync(DUMP_PATH, 'utf8'));
    let total = 0;
    for (const t of TABLE_ORDER) {
      const rows = dump.tables[t];
      if (!rows || rows.length === 0) continue;
      const model = t.charAt(0).toLowerCase() + t.slice(1);
      const data = rows.map((row) => {
        const out = {};
        for (const [col, v] of Object.entries(row)) out[col] = toPrismaValue(col, v);
        return out;
      });
      // skipDuplicates: rows already present (re-run / partial import) keep
      // their current values — the import never overwrites live data
      await prisma[model].createMany({ data, skipDuplicates: true });
      total += rows.length;
      console.log(`  ${t}: ${rows.length} rows imported`);
    }
    console.log(`migration complete — ${total} rows`);
  } finally {
    await prisma.$disconnect();
  }
}

if (MODE === 'dump') dump();
else if (MODE === 'import') await importData();
else {
  console.error('usage: node scripts/migrate-sqlite-to-postgres.mjs dump|import');
  process.exit(1);
}
