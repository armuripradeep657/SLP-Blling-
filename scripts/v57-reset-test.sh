#!/usr/bin/env bash
# v57 — Reset bills regression: POST /api/bills/reset-all deletes every bill
# (tombstoned) and keeps products, settings and the labour register.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=${PORT:-3127}
B="http://localhost:$PORT"
DB=/tmp/slp-reset-test.db
rm -rf /tmp/slp-reset-env && mkdir -p /tmp/slp-reset-env
cp "$ROOT/db/custom.db" "$DB"

tail -f /dev/null | DATABASE_URL="file:$DB" PORT=$PORT HOSTNAME=127.0.0.1 node "$ROOT/.next/standalone/server.js" > /tmp/slp-reset.log 2>&1 &
SRV=$!
sleep 6
FAIL=0
ok()   { echo "  ✓ $1"; }
bad()  { echo "  ✗ $1 — GOT: $2"; FAIL=1; }

TOK=$(curl -s -X POST "$B/api/auth/owner/login" -H 'Content-Type: application/json' -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
[ -n "$TOK" ] && ok "owner login" || { bad "owner login" "$TOK"; }

BEFORE=$(curl -s "$B/api/state?rev=-1" -H "Authorization: Bearer $TOK" | python3 -c "import sys,json;s=json.load(sys.stdin);print(f\"{len(s.get('invoices',[]))}:{len(s.get('products',[]))}\")")
ok "state before (bills:products) = $BEFORE"

# staff must NOT be able to reset
STOK=$(curl -s -X POST "$B/api/staff/login" -H 'Content-Type: application/json' -d '{"userId":"MDN","secret":"mdn"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
SCODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$B/api/bills/reset-all" -H "Authorization: Bearer $STOK" -H 'Content-Type: application/json' -d '{}')
[ "$SCODE" = "401" ] && ok "staff reset rejected (401)" || bad "staff reset rejected" "$SCODE"

# unauthenticated must be rejected
UCODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$B/api/bills/reset-all" -H 'Content-Type: application/json' -d '{}')
[ "$UCODE" = "401" ] && ok "anonymous reset rejected (401)" || bad "anonymous reset rejected" "$UCODE"

RES=$(curl -s -X POST "$B/api/bills/reset-all" -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' -d '{}')
python3 -c "
import json,sys
r=json.loads('''$RES''')
assert r.get('ok') is True and isinstance(r.get('deleted'), int), r
print(f'  ✓ owner reset ok, deleted={r[\"deleted\"]}, rev={r.get(\"rev\")}') " || bad "owner reset" "$RES"

AFTER=$(curl -s "$B/api/state?rev=-1" -H "Authorization: Bearer $TOK" | python3 -c "import sys,json;s=json.load(sys.stdin);print(f\"{len(s.get('invoices',[]))}:{len(s.get('products',[]))}:{s['settings']['companyName'][:20]}\")")
python3 -c "
after='''$AFTER'''.split(':')
assert after[0]=='0', f'bills not 0: {after}'
assert int(after[1])>0, f'products wiped: {after}'
print(f'  ✓ after: 0 bills, {after[1]} products kept, company intact ({after[2]}…)')" || bad "after-state" "$AFTER"

TB=$(python3 -c "
import sqlite3
c=sqlite3.connect('$DB')
print(c.execute('SELECT COUNT(*) FROM DeletedBill').fetchone()[0])")
[ "$TB" -gt 0 ] && ok "tombstones present: $TB" || bad "tombstones" "$TB"

kill $SRV 2>/dev/null
[ "$FAIL" = "0" ] && echo "RESET-ALL ALL OK" || echo "RESET-ALL FAILED"
exit $FAIL
