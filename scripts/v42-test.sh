#!/usr/bin/env bash
# v42 E2E: product image lifecycle — upload persists across polls/snapshots,
# and REMOVING a photo actually sticks (JSON used to drop the undefined key,
# the server kept the old image, and the next poll resurrected it).
set -u
cd /home/z/my-project
PORT=3113
B="http://localhost:$PORT"
J='content-type: application/json'

mkdir -p /tmp/slp-test && cp db/custom.db /tmp/slp-test/test.db
DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v42.log 2>&1 &
SRV=$!
sleep 7

OTOK=$(curl -s -X POST "$B/api/auth/owner/login" -H "$J" -d '{"username":"Pradeep","password":"2125"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$OTOK" ]; then echo "owner login FAILED"; kill $SRV 2>/dev/null; exit 1; fi
AH="authorization: Bearer $OTOK"

# a tiny valid 1x1 jpeg data URL (raw base64 of 1px jpeg header)
IMG='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmAA//9k='

echo "== 1. create product WITH image =="
curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d "{\"product\":{\"id\":\"p-v42-test\",\"name\":\"V42 Test Item\",\"category\":\"Custom\",\"price\":100,\"sizes\":[\"Standard\"],\"image\":\"$IMG\"}}" >/dev/null
curl -s "$B/api/state" -H "$AH" > /tmp/slp-v42-state.json
HAS=$(python3 -c "
import json
s=json.load(open('/tmp/slp-v42-state.json'))
p=[x for x in s['products'] if x['id']=='p-v42-test']
print('yes' if p and p[0].get('image','').startswith('data:image') else 'no')")
echo "image present after upload+snapshot: $HAS"

echo "== 2. REMOVE the image (image:null — the v42 fix) =="
curl -s -X PUT "$B/api/products" -H "$J" -H "$AH" \
  -d '{"product":{"id":"p-v42-test","name":"V42 Test Item","category":"Custom","price":100,"sizes":["Standard"],"image":null}}' >/dev/null
curl -s "$B/api/state" -H "$AH" > /tmp/slp-v42-state2.json
GONE=$(python3 -c "
import json
s=json.load(open('/tmp/slp-v42-state2.json'))
p=[x for x in s['products'] if x['id']=='p-v42-test']
print('gone' if p and not p[0].get('image') else 'STILL THERE')")
echo "image after removal+snapshot: $GONE"

echo "== 3. cleanup test row =="
python3 - "$OTOK" << 'EOF'
import sys, os
os.environ['TOK'] = sys.argv[1]
EOF

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null

python3 - "$HAS" "$GONE" << 'EOF'
import sys
has, gone = sys.argv[1], sys.argv[2]
assert has == 'yes', f"UPLOAD PERSIST FAILED: {has}"
assert gone == 'gone', f"IMAGE REMOVAL DID NOT STICK: {gone}"
print("ALL OK — upload persists, removal sticks (survives the poll)")
EOF
