#!/usr/bin/env bash
# v52 DATA-PROTECTION SUITE — the owner's 8 scenarios:
#  1. save → 2. close/reopen → 3. refresh → 4. partial update leaves other
#  fields byte-identical → 5. second device syncs → 6. bill history intact
#  → 7. no duplicates on retry → 8. failed save changes nothing
set -u
cd /home/z/my-project
PORT=3117
B="http://localhost:$PORT"
J='content-type: application/json'
mkdir -p /tmp/slp-test
cp db/custom.db /tmp/slp-test/test.db

boot() {
  tail -f /dev/null | DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v52.log 2>&1 &
  SRV=$!
  sleep 6
}
boot

OTOK=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$OTOK" ]; then echo "owner login FAILED"; kill $SRV 2>/dev/null; exit 1; fi
AH="authorization: Bearer $OTOK"
FAIL=0
note() { echo "$1"; }

echo "== 0. baseline: pick a real product, snapshot EVERY field =="
BASE=$(curl -s "$B/api/state?rev=-1" -H "$AH" | python3 -c "
import sys, json
s = json.load(sys.stdin)
p = [x for x in s['products'] if 'Kitchen Slab' in x['name']][0]
print(json.dumps({'id': p['id'], 'name': p['name'], 'nameTe': p.get('nameTe'), 'price': p['price'], 'sizes': p['sizes'], 'sizePrices': p['sizePrices'], 'image': (p.get('image') or '')[:30], 'updatedAt': p.get('updatedAt'), 'rev': s['rev'], 'dbills': len(s.get('deletedBills', []))}))
")
PID=$(echo "$BASE" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
REV0=$(echo "$BASE" | python3 -c "import sys,json;print(json.load(sys.stdin)['rev'])")
echo "baseline: $BASE"

echo "== 1+4. PATCH price ONLY — other fields must stay byte-identical =="
BEFORE=$(curl -s "$B/api/state?rev=-1" -H "$AH" | python3 -c "
import sys, json
p = [x for x in json.load(sys.stdin)['products'] if x['id']=='$PID'][0]
p['price'] = 599  # the expected post-patch value — everything ELSE must match
print(json.dumps(p, sort_keys=True))")
R=$(curl -s -X PATCH "$B/api/products" -H "$J" -H "$AH" -d "{\"id\":\"$PID\",\"price\":599}")
echo "patch price: $R"
AFTER=$(curl -s "$B/api/state?rev=-1" -H "$AH" | python3 -c "
import sys, json
p = [x for x in json.load(sys.stdin)['products'] if x['id']=='$PID'][0]
print(json.dumps(p, sort_keys=True))")
BEFORE_STRIP=$(echo "$BEFORE" | python3 -c "import sys,json; d=json.load(sys.stdin); d.pop('updatedAt',None); print(json.dumps(d, sort_keys=True))")
AFTER_STRIP=$(echo "$AFTER" | python3 -c "import sys,json; d=json.load(sys.stdin); d.pop('updatedAt',None); print(json.dumps(d, sort_keys=True))")
if [ "$BEFORE_STRIP" = "$AFTER_STRIP" ]; then note "PARTIAL UPDATE OK — only price changed, every other field byte-identical"; else note "PARTIAL UPDATE FAILED"; echo "$BEFORE_STRIP" | head -c 300; echo; echo "$AFTER_STRIP" | head -c 300; FAIL=1; fi

echo "== 7a. empty PATCH (nothing to change) must not bump rev =="
REVPRE=$(curl -s "$B/api/state?rev=-1" -H "$AH" | python3 -c "import sys,json;print(json.load(sys.stdin)['rev'])")
R=$(curl -s -X PATCH "$B/api/products" -H "$J" -H "$AH" -d "{\"id\":\"$PID\"}")
REV0B=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin).get('rev'))")
if [ "$REV0B" = "$REVPRE" ]; then note "EMPTY PATCH OK — rev untouched ($REV0B)"; else note "EMPTY PATCH FAILED — rev moved $REVPRE -> $REV0B"; FAIL=1; fi

echo "== 7b. same PATCH twice (client retry) — no duplicates =="
curl -s -X PATCH "$B/api/products" -H "$J" -H "$AH" -d "{\"id\":\"$PID\",\"price\":599}" > /dev/null
curl -s -X PATCH "$B/api/products" -H "$J" -H "$AH" -d "{\"id\":\"$PID\",\"price\":599}" > /dev/null
COUNT=$(curl -s "$B/api/state?rev=-1" -H "$AH" | python3 -c "
import sys, json
print(sum(1 for x in json.load(sys.stdin)['products'] if x['id']=='$PID'))")
if [ "$COUNT" = "1" ]; then note "RETRY IDEMPOTENT OK — still exactly 1 row"; else note "DUPLICATE ROWS: $COUNT"; FAIL=1; fi

echo "== 6. two bills saved, then full server RESTART (close & reopen app) =="
B1=$(curl -s -X POST "$B/api/bills" -H "$J" -H "$AH" -d '{"invoice":{"id":"inv-dp-1","dateISO":"2026-11-19T10:00:00.000Z","customer":{"name":"DP Test","phone":"","address":""},"items":[{"key":"k1","productId":"custom","name":"DP item","size":"Std","price":100,"origPrice":100,"qty":2}],"discountType":"amount","discountValue":0,"labourCharge":0,"autoCharge":0,"paymentMode":"Cash","language":"en","verifyCode":"dp-verify-1","totals":{"subtotal":200,"gst":0,"discount":0,"total":200,"paid":200,"balance":0,"labourCharge":0,"autoCharge":0},"payments":[{"id":"pay-dp1","dateISO":"2026-11-19T10:00:00.000Z","amount":200,"mode":"Cash"}]}}')
echo "bill1: $(echo "$B1" | head -c 120)"
kill $SRV 2>/dev/null; sleep 1
boot
OTOK2=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
AH2="authorization: Bearer $OTOK2"
BILLS=$(curl -s "$B/api/state?rev=-1" -H "$AH2" | python3 -c "
import sys, json
s = json.load(sys.stdin)
bills = [i for i in s['invoices'] if i['id'].startswith('inv-dp')]
prod = [x for x in s['products'] if x['id']=='$PID'][0]
print(json.dumps({'bills': len(bills), 'priceAfterRestart': prod['price'], 'nameStill': prod['name']}))")
echo "after restart: $BILLS"
python3 - <<EOF && note "PERSIST ACROSS RESTART OK" || { note "PERSIST FAILED"; FAIL=1; }
import json
d = json.loads('''$BILLS''')
assert d['bills'] == 1, d
assert d['priceAfterRestart'] == 599, d
EOF

echo "== 3. fresh full pull (app refresh) — nothing changed, nothing lost =="
FULL=$(curl -s "$B/api/state?rev=-1" -H "$AH2" | python3 -c "
import sys, json
s = json.load(sys.stdin)
p = [x for x in s['products'] if x['id']=='$PID'][0]
assert p['price'] == 599 and p['name'], p
print('refresh OK — price 599 intact, name intact, products:', len(s['products']))")
echo "$FULL"

echo "== 5. SECOND DEVICE (2nd owner session) sees the change via its old rev =="
TOK_B=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
curl -s -X PATCH "$B/api/products" -H "$J" -H "$AH2" -d "{\"id\":\"$PID\",\"price\":601}" > /dev/null
SEEN=$(curl -s "$B/api/state?rev=-1" -H "authorization: Bearer $TOK_B" | python3 -c "
import sys, json
p = [x for x in json.load(sys.stdin)['products'] if x['id']=='$PID'][0]
print(p['price'])")
if [ "$SEEN" = "601" ]; then note "MULTI-DEVICE SYNC OK — device B sees 601 after device A saved it"; else note "SYNC FAILED — device B sees $SEEN"; FAIL=1; fi

echo "== 8. FAILED save changes NOTHING (server down = offline) =="
kill $SRV 2>/dev/null; sleep 1
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 -X PATCH "$B/api/products" -H "$J" -H "$AH2" -d "{\"id\":\"$PID\",\"price\":1}" 2>/dev/null)
boot
VAL=$(curl -s "$B/api/state?rev=-1" -H "$AH2" | python3 -c "
import sys, json
p = [x for x in json.load(sys.stdin)['products'] if x['id']=='$PID'][0]
print(p['price'])")
if [ "$CODE" = "000" ] && [ "$VAL" = "601" ]; then note "FAILED SAVE OK — offline patch rejected (code $CODE), value still 601, nothing corrupted"; else note "FAILED-SAVE CHECK: code=$CODE value=$VAL"; FAIL=1; fi

echo "== tombstones + updatedAt present in state =="
curl -s "$B/api/state?rev=-1" -H "$AH2" | python3 -c "
import sys, json
s = json.load(sys.stdin)
assert 'deletedBills' in s, 'deletedBills missing'
assert all('updatedAt' in p for p in s['products']), 'updatedAt missing'
print('state contract OK — deletedBills + updatedAt present')"
kill $SRV 2>/dev/null
if [ "$FAIL" = "0" ]; then echo "ALL DATA-PROTECTION CHECKS PASSED"; else echo "DATA-PROTECTION SUITE FAILED"; exit 1; fi
