#!/usr/bin/env bash
# v40 E2E: staff attribution + staff-scoped history + permanent delete
# (tombstones) + CSP wasm + face assets. Runs against a COPY of the db.
set -u
cd /home/z/my-project
PORT=3111
B="http://localhost:$PORT"
J='content-type: application/json'

DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v40.log 2>&1 &
SRV=$!
sleep 7

echo "== 0. CSP has wasm-unsafe-eval =="
curl -sI "$B/" | grep -i content-security-policy | grep -o "wasm-unsafe-eval" || echo "MISSING wasm-unsafe-eval"

echo "== 0b. face assets served =="
curl -s -o /dev/null -w "task=%{http_code} " "$B/mediapipe/face_landmarker.task"
curl -s -o /dev/null -w "wasm=%{http_code}\n" "$B/mediapipe/wasm/vision_wasm_internal.wasm"

echo "== 1. owner login (Pradeep/2125) =="
OTOK=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -n "$OTOK" ]; then echo "owner token OK"; else echo "owner login FAILED (password changed in real db — tombstone via delete route untestable live)"; fi

echo "== 2. staff login MDN/mdn =="
STOK=$(curl -s -X POST "$B/api/staff/login" -H "$J" -d '{"userId":"MDN","secret":"mdn"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
echo "staff token: ${STOK:0:10}..."

if [ -n "$STOK" ]; then
  echo "== 3. staff saves a bill =="
  SRESP=$(curl -s -X POST "$B/api/bills" -H "$J" -H "authorization: Bearer $STOK" \
    -d '{"invoice":{"id":"inv-test-staff-1","items":[{"productId":"custom","name":"Test item","price":100,"qty":2}],"totals":{"paid":200},"verifyCode":"VTESTSTAFF1","customer":{"name":"Staff Cust"}}}')
  echo "$SRESP" | python3 -c "import sys,json; d=json.load(sys.stdin); inv=d.get('invoice',{}); print('saved:', inv.get('no'), '| createdBy:', inv.get('createdBy'), '| total:', (inv.get('totals') or {}).get('total'))"
  export SID=$(echo "$SRESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('invoice',{}).get('id',''))" 2>/dev/null)
  export SNO=$(echo "$SRESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('invoice',{}).get('no',''))" 2>/dev/null)

  echo "== 4. staff GET state: ONLY own bills =="
  curl -s "$B/api/state" -H "authorization: Bearer $STOK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
invs = d.get('invoices', [])
print('staff sees', len(invs), 'bill(s):', [i.get('no') for i in invs])
creators = sorted({i.get('createdBy') for i in invs})
assert all(i.get('createdBy') == 'M.D.Najir' for i in invs), 'LEAK: non-staff bill visible to staff!'
print('staff scope OK — creators:', creators)"

  if [ -n "$OTOK" ]; then
    echo "== 5. owner saves a bill =="
    curl -s -X POST "$B/api/bills" -H "$J" -H "authorization: Bearer $OTOK" \
      -d '{"invoice":{"id":"inv-test-owner-1","items":[{"productId":"custom","name":"Owner item","price":50,"qty":1}],"totals":{"paid":50},"verifyCode":"VTESTOWNER1"}}' \
      | python3 -c "import sys,json; d=json.load(sys.stdin); inv=d.get('invoice',{}); print('saved:', inv.get('no'), '| createdBy:', inv.get('createdBy'))"

    echo "== 6. staff state still excludes the owner bill =="
    curl -s "$B/api/state" -H "authorization: Bearer $STOK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
invs = d.get('invoices', [])
assert all(i.get('createdBy') == 'M.D.Najir' for i in invs), 'LEAK after owner bill!'
print('still scoped OK —', [i.get('no') for i in invs])"

    echo "== 7. owner deletes the staff bill =="
    curl -s -X DELETE "$B/api/bills/$SID" -H "authorization: Bearer $OTOK" | head -c 90; echo ""

    echo "== 8. resurrection attempt: import the deleted bill back =="
    curl -s -X POST "$B/api/state/import" -H "$J" -H "authorization: Bearer $OTOK" \
      -d "{\"invoices\":[{\"id\":\"$SID\",\"no\":\"$SNO\",\"dateISO\":\"2026-11-17T10:00:00.000Z\",\"items\":[{\"name\":\"zombie\",\"price\":100,\"qty\":1}],\"totals\":{\"total\":100,\"paid\":0,\"balance\":100},\"customer\":{\"name\":\"zombie\"},\"createdBy\":\"M.D.Najir\",\"verifyCode\":\"VTESTSTAFF1\"}]}" | head -c 90; echo ""

    echo "== 9. deleted bill must NOT be back =="
    curl -s "$B/api/state" -H "authorization: Bearer $OTOK" | SID="$SID" SNO="$SNO" python3 -c "
import sys, json, os
d = json.load(sys.stdin)
ids = [i['id'] for i in d.get('invoices', [])]
nos = [i['no'] for i in d.get('invoices', [])]
sid, sno = os.environ['SID'], os.environ['SNO']
back_id, back_no = sid in ids, sno in nos
print('back by id?', back_id, '| back by no?', back_no)
assert not back_id and not back_no, 'RESURRECTED!'
print('TOMBSTONE OK — deleted bill stayed deleted')"

    echo "== 10. owner history sees both creators' remaining bills =="
    curl -s "$B/api/state" -H "authorization: Bearer $OTOK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
invs = [i for i in d.get('invoices', []) if i.get('id', '').startswith('inv-test')]
print('test bills still alive:', [(i['no'], i.get('createdBy')) for i in invs])"
  fi
fi

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "=== DONE ==="
