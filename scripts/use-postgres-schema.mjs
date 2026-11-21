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
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const url = process.env.DATABASE_URL || '';
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

if (url.startsWith('postgres')) {
  copyFileSync(here('../prisma/schema.postgres.prisma'), here('../prisma/schema.prisma'));
  console.log('[prisma] DATABASE_URL is PostgreSQL — schema switched to postgresql');
} else {
  copyFileSync(here('../prisma/schema.sqlite.prisma'), here('../prisma/schema.prisma'));
  console.log('[prisma] SQLite schema active');
}
