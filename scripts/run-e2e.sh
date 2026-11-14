#!/bin/bash
# Run a Playwright E2E script against an ISOLATED test server, all in ONE
# process. The owner's LIVE app (port 3000) and its database are NEVER
# touched: this uses its own port and its own throwaway SQLite file.
# Usage: bash scripts/run-e2e.sh scripts/shot-v26.mjs
set -u
cd /home/z/my-project
TEST="$1"
PORT="${PORT:-3100}"
TESTDB="/tmp/slp-e2e-$PORT.db"
LOG=/tmp/slp-e2e-server.log

# the E2E suite signs webhook calls with this shared secret (payment auto-detect)
export PAYMENT_WEBHOOK_SECRET="slp-e2e-webhook-secret"

# isolated database — tables created fresh, owner's data out of reach
export DATABASE_URL="file:$TESTDB"
rm -f "$TESTDB"
npx prisma db push --skip-generate >/dev/null 2>&1 || { echo "db push failed"; exit 1; }
echo "db-isolated:$TESTDB"

# isolated build dir so the live app's .next/dev lock is never touched
export NEXT_TEST_DIST=".next-test"
rm -rf .next-test

# start the isolated server on its own port (the live server on 3000 keeps running)
(npx next dev -p "$PORT" > "$LOG" 2>&1 &)

code=000
for i in $(seq 1 45); do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "http://localhost:$PORT/api/auth/state" 2>/dev/null)
  [ "$code" = "200" ] && break
done
if [ "$code" != "200" ]; then echo "SERVER FAILED TO START (code $code)"; tail -20 "$LOG"; exit 1; fi
echo "server-ready :$PORT"

BASE_URL="http://localhost:$PORT" node "$TEST"
RC=$?
pkill -f "next dev -p $PORT" 2>/dev/null
echo "exit:$RC"
exit $RC
