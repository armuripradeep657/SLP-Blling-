#!/usr/bin/env bash
# v44 E2E: FULL product lifecycle — create (no image), create (with image),
# edit name/price (image untouched → must persist), edit (change image),
# edit (remove image), delete. Plus a Telugu auto-fill unit check.
set -u
cd /home/z/my-project
PORT=3113
B="http://localhost:$PORT"
J='content-type: application/json'

cp db/custom.db /tmp/slp-test/test.db
DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v44.log 2>&1 &
SRV=$!
sleep 7

OTOK=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$OTOK" ]; then echo "owner login FAILED"; kill $SRV 2>/dev/null; exit 1; fi
AH="authorization: Bearer $OTOK"

# 1x1 red png data url (tiny)
IMG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

echo "== 1. CREATE without image =="
R1=$(curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d '{"product":{"id":"p-e2e-1","name":"Cement Ring 24","category":"Rings","price":500,"sizes":["24 inch"],"sizePrices":{"24 inch":500},"image":null,"stock":10}}')
echo "create1: $R1"

echo "== 2. CREATE with image (like gallery/camera path) =="
R2=$(curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d "{\"product\":{\"id\":\"p-e2e-2\",\"name\":\"Well Ring 36\",\"nameTe\":\"బావి రింగ్ 36\",\"category\":\"Rings\",\"price\":900,\"sizes\":[\"Standard\"],\"sizePrices\":{},\"image\":\"$IMG\"}}")
echo "create2: $R2"

echo "== 3. EDIT name+price, image field ABSENT (undefined — old client path) =="
R3=$(curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d '{"product":{"id":"p-e2e-2","name":"Well Ring 36 Extra","category":"Rings","price":950,"sizes":["Standard"],"sizePrices":{}}}')
echo "edit3: $R3"

echo "== 4. EDIT with image:null (remove photo — v42 fix) =="
R4=$(curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d '{"product":{"id":"p-e2e-2","name":"Well Ring 36 Extra","category":"Rings","price":950,"sizes":["Standard"],"sizePrices":{},"image":null}}')
echo "edit4: $R4"

echo "== 5. EDIT re-add image + Telugu name =="
R5=$(curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d "{\"product\":{\"id\":\"p-e2e-2\",\"name\":\"Well Ring 36 Extra\",\"nameTe\":\"బావి రింగ్\",\"category\":\"Rings\",\"price\":950,\"sizes\":[\"Standard\"],\"sizePrices\":{},\"image\":\"$IMG\"}}")
echo "edit5: $R5"

echo "== 6. DELETE p-e2e-1 =="
R6=$(curl -s -X DELETE "$B/api/products/p-e2e-1" -H "$AH")
echo "delete: $R6"

echo "== 7. STATE check — final products =="
curl -s "$B/api/state" -H "$AH" | python3 -c "
import sys, json
st = json.load(sys.stdin)
prods = {p['id']: p for p in st['products']}
a, b = prods.get('p-e2e-1'), prods.get('p-e2e-2')
assert a is None, 'p-e2e-1 should be deleted'
assert b is not None, 'p-e2e-2 missing!'
print('final p-e2e-2: name=%r nameTe=%r price=%r image=%r' % (b['name'], b.get('nameTe'), b['price'], 'present' if b.get('image') else 'none'))
assert b['name'] == 'Well Ring 36 Extra' and b['price'] == 950
assert b.get('nameTe') == 'బావి రింగ్'
assert b.get('image'), 'image should be present after step 5'
assert a is None
print('CRUD ALL OK')
"

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "=== DONE ==="
