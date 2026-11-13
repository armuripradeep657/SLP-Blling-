#!/bin/bash
# Run a Playwright E2E script against a fresh dev server, all in ONE process
# (this sandbox reaps background processes between tool calls).
# Usage: bash scripts/run-e2e.sh scripts/shot-v24.mjs
set -u
cd /home/z/my-project
TEST="$1"
LOG=/tmp/next-dev.log

# clean state: no MPIN account, no leftover build cache issues
node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.session.deleteMany().then(()=>p.syncAccount.deleteMany()).then(()=>p.\$disconnect()).then(()=>console.log('db-reset-ok'));
" || exit 1

pkill -9 -f "next dev" 2>/dev/null; sleep 1
(npx next dev -p 3000 > "$LOG" 2>&1 &)

code=000
for i in $(seq 1 40); do
  sleep 3
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://localhost:3000/api/auth/state 2>/dev/null)
  [ "$code" = "200" ] && break
done
if [ "$code" != "200" ]; then echo "SERVER FAILED TO START (code $code)"; tail -20 "$LOG"; exit 1; fi
echo "server-ready"

node "$TEST"
RC=$?
pkill -9 -f "next dev" 2>/dev/null
echo "exit:$RC"
exit $RC
