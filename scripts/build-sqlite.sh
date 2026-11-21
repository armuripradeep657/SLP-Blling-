#!/usr/bin/env bash
# Rebuild the standalone server against the LOCAL SQLITE copy — for the
# regression suites, which boot .next/standalone with a file: DATABASE_URL.
# The committed .env points at Supabase (postgres), so the default build has
# a postgres client; this helper switches the schema back for test runs.
set -e
cd "$(dirname "$0")/.."
export DATABASE_URL="file:./db/custom.db"
node scripts/use-postgres-schema.mjs >/dev/null
npx prisma generate >/dev/null 2>&1
npm run build 2>&1 | grep -E "✓ Compiled|error|Failed" | head -2
