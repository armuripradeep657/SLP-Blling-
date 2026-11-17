#!/usr/bin/env bash
# v41 E2E: "Start bills from 1" reset + no-rewind protection for plain saves.
set -u
cd /home/z/my-project
PORT=3112
B="http://localhost:$PORT"
J='content-type: application/json'

cp db/custom.db /tmp/slp-test/test.db
DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v41.log 2>&1 &
SRV=$!
sleep 7

OTOK=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$OTOK" ]; then echo "owner login FAILED"; kill $SRV 2>/dev/null; exit 1; fi
AH="authorization: Bearer $OTOK"

echo "== 1. save a bill (current counter) =="
N1=$(curl -s -X POST "$B/api/bills" -H "$J" -H "$AH" \
  -d '{"invoice":{"id":"inv-v41-a","items":[{"productId":"custom","name":"A","price":10,"qty":1}],"totals":{"paid":10},"verifyCode":"VV41AAA1"}}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('invoice',{}).get('no',''))" 2>/dev/null)
echo "bill A: $N1"

echo "== 2. RESET: next invoice 1 + resetBillNo flag =="
R=$(curl -s -X PUT "$B/api/settings" -H "$J" -H "$AH" \
  -d '{"settings":{"nextInvoiceNo":1,"resetBillNo":true}}')
echo "reset response: $R"

echo "== 3. save a bill — must get prefix+1 (or first free number >= 1) =="
RESP=$(curl -s -X POST "$B/api/bills" -H "$J" -H "$AH" \
  -d '{"invoice":{"id":"inv-v41-b","items":[{"productId":"custom","name":"B","price":10,"qty":1}],"totals":{"paid":10},"verifyCode":"VV41BBB1"}}')
N2=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('invoice',{}).get('no',''))" 2>/dev/null)
echo "bill B: $N2"
N2NUM=$(echo "$N2" | python3 -c "import sys,re;print(re.sub(r'\D','',sys.stdin.read() or '0'))")
PRE=$(echo "$N2" | python3 -c "import sys,re;print(re.sub(r'\d+$','',sys.stdin.read() or ''))")

curl -s "$B/api/state" -H "$AH" > /tmp/slp-v41-state.json
SID="$B" PRE="$PRE" N2NUM="$N2NUM" python3 << 'EOF'
import json, os, re
state = json.load(open('/tmp/slp-v41-state.json'))
taken = {int(re.sub(r'\D','',i['no'])) for i in state['invoices']
         if any(c.isdigit() for c in i['no']) and not i['id'].startswith('inv-v41')}
pre, got = os.environ['PRE'], int(os.environ['N2NUM'])
expected = 1
while expected in taken:
    expected += 1
print(f"taken numbers around 1: min={min(taken)}, 1 taken? {1 in taken}")
print(f"new bill no: {pre}{got} — expected: {pre}{expected}")
assert got == expected, f"RESET FAILED: got {got}, expected {expected}"
print("RESET OK — numbering restarted exactly at the first free number from 1")

cfg = state['config']
print("central counter now:", cfg['nextBillNo'])
assert cfg['nextBillNo'] == expected, "counter did not follow the reset"
print("counter follows OK")
EOF

echo "== 4. plain settings save must NOT rewind (no flag = lift only) =="
curl -s -X PUT "$B/api/settings" -H "$J" -H "$AH" \
  -d '{"settings":{"gstPercent":5,"nextInvoiceNo":1}}' > /dev/null
N3=$(curl -s -X POST "$B/api/bills" -H "$J" -H "$AH" \
  -d '{"invoice":{"id":"inv-v41-c","items":[{"productId":"custom","name":"C","price":10,"qty":1}],"totals":{"paid":10},"verifyCode":"VV41CCC1"}}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('invoice',{}).get('no',''))" 2>/dev/null)
echo "bill C (after plain save with nextInvoiceNo=1): $N3"
N3NUM=$(echo "$N3" | python3 -c "import sys,re;print(re.sub(r'\D','',sys.stdin.read() or '0'))")
CUR=$(python3 -c "import json;print(json.load(open('/tmp/slp-v41-state.json'))['config']['nextBillNo'])")
N3CUR=$CUR
python3 - "$N3NUM" "$N3CUR" << 'EOF'
import sys
got, prev = int(sys.argv[1]), int(sys.argv[2])
# after bill B the counter moved to the reset number+1; bill C must be the NEXT one, never rewound
assert got > prev - 1, "REWOUND without the reset flag!"
print(f"NO-REWIND OK — bill C number {got} continued past {prev}")
EOF

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "=== DONE ==="
