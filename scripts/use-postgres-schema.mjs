#!/usr/bin/env node
/**
 * v47 — PostgreSQL support.
 *
 * The SAME repo deploys on either database with zero code changes:
 *   DATABASE_URL=file:/path/db/custom.db        → SQLite (current default)
 *   DATABASE_URL=postgres://user:pass@host/db?sslmode=require → PostgreSQL
 *
 * The build (and prisma generate) materializes the matching schema.prisma
 * from the two canonical variants BEFORE the client is generated:
 *   prisma/schema.sqlite.prisma    (provider = "sqlite")
 *   prisma/schema.postgres.prisma  (provider = "postgresql")
 *
 * The app code, API routes and migrations are provider-agnostic — Prisma
 * hides the difference. Idempotent: safe to run on every build.
 */
import { copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// DATABASE_URL from the environment, falling back to the repo .env — the
// platform build does not export .env into script envs, so without this the
// build would generate a SQLite client while the runtime connects to
// PostgreSQL (and fail at connect).
let url = process.env.DATABASE_URL || '';
if (!url) {
  try {
    const m = readFileSync(here('../.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m);
    if (m) url = m[1].trim();
  } catch { /* no .env — stay on the sqlite default */ }
}

if (url.startsWith('postgres')) {
  copyFileSync(here('../prisma/schema.postgres.prisma'), here('../prisma/schema.prisma'));
  console.log('[prisma] DATABASE_URL is PostgreSQL — schema switched to postgresql');
} else {
  copyFileSync(here('../prisma/schema.sqlite.prisma'), here('../prisma/schema.prisma'));
  console.log('[prisma] SQLite schema active');
}
