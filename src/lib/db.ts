import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * v59: Supabase shared-pooler hardening — the Supabase pooler (port 6543)
 * runs PgBouncer in transaction mode, so Prisma must disable prepared
 * statements (pgbouncer=true) and keep a tiny connection limit; TLS is
 * required by Supabase. Params are appended only when missing.
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

const datasourceUrl = poolerReadyUrl(process.env.DATABASE_URL);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db