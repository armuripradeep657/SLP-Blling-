import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Supabase shared-pooler hardening — the Supabase pooler (port 6543)
 * runs PgBouncer in transaction mode, so Prisma must disable prepared
 * statements (pgbouncer=true) and keep a tiny connection limit; TLS is
 * required by Supabase. Params are appended only when missing, so SQLite
 * file: URLs pass through untouched.
 */
function poolerReadyUrl(raw: string | undefined): string | undefined {
  if (!raw || !raw.startsWith('postgres')) return raw;
  try {
    const u = new URL(raw.replace('postgres://', 'postgresql://'));
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1');
    if (!u.searchParams.has('sslmode')) u.searchParams.set('sslmode', 'require');
    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * DATABASE_URL from the process env, falling back to a direct .env read —
 * some hosts run the server without exporting .env, and the connection must
 * never silently fall back to the schema default.
 */
function envDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    for (const p of ['./.env', '../.env', '../../.env']) {
      const m = readFileSync(p, 'utf8').match(/^DATABASE_URL=(.*)$/m);
      if (m) return m[1].trim();
    }
  } catch { /* no .env reachable */ }
  return undefined;
}

const datasourceUrl = poolerReadyUrl(envDatabaseUrl());

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db