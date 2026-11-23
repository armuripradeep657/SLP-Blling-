import { PrismaClient } from '@prisma/client'

/**
 * On Netlify the shop data lives in Netlify Database (managed Postgres).
 * The platform injects its connection string as NETLIFY_DB_URL at runtime;
 * DATABASE_URL stays as a fallback for self-hosted / local runs.
 */
function databaseUrl(): string | undefined {
  const url = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL
  return url && url.startsWith('postgres') ? url : undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: ['error'],
  })

globalForPrisma.prisma = db
