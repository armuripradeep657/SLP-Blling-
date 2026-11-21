#!/usr/bin/env bash
# v45 E2E: update-consent mechanism — release.json served fresh, sw.js is
# cache-first with APPLY_UPDATE, and every asset the new-shell collector
# would pick from '/' actually returns 200 (the APPLY_UPDATE dry-run).
set -u
cd /home/z/my-project
PORT=3114
B="http://localhost:$PORT"

DATABASE_URL="file:/tmp/slp-test/test.db" PORT=$PORT node .next/standalone/server.js > /tmp/slp-v45.log 2>&1 &
SRV=$!
sleep 7

echo "== release.json served =="
curl -s "$B/release.json" | python3 -c "
import sys, json
r = json.load(sys.stdin)
assert r['version'] == 58, r['version']
assert len(r['notes']['en']) >= 3 and len(r['notes']['te']) >= 3
print('release.json OK — version', r['version'], '| en notes:', len(r['notes']['en']), '| te notes:', len(r['notes']['te']))
"

echo "== sw.js is v55 + consent flow =="
SW=$(curl -s "$B/sw.js")
echo "$SW" | grep -q "slp-billing-v50" && echo "cache v50 OK"
echo "$SW" | grep -q "APPLY_UPDATE" && echo "APPLY_UPDATE handler OK"
echo "$SW" | grep -q "UPDATE_PROGRESS" && echo "progress messages OK"
echo "$SW" | grep -q "AbortSignal.timeout(30000)" && echo "per-asset 30s timeout OK (slow-link batches)"
# v46 fix: navigations must match the CURRENT cache by name, not caches.match('/')
if echo "$SW" | sed -n "/req.mode === 'navigate'/,/^  }/p" | grep -q "caches.open(CACHE)"; then
  echo "navigation matches CURRENT cache only OK (no stale-cache collision loop)"
else
  echo "FAIL: navigation still uses cross-cache match"
fi

echo "== APPLY_UPDATE dry-run: collect assets from '/', fetch each =="
curl -s "$B/" -o /tmp/slp-shell.html
python3 - <<'EOF'
import re, urllib.request, sys
html = open('/tmp/slp-shell.html').read()
urls = sorted(set(
    u for u in re.findall(r'(?:src|href)="(/[^"]+)"', html)
    if u.startswith('/_next/') or u.startswith('/fonts/') or u.endswith('.js') or u.endswith('.css')
))
print(f'{len(urls)} assets referenced by the shell')
bad = []
for u in urls:
    try:
        r = urllib.request.urlopen('http://localhost:3114' + u, timeout=20)
        if r.status != 200: bad.append((u, r.status))
    except Exception as e:
        bad.append((u, str(e)))
if bad:
    print('FAIL — some shell assets not fetchable:', bad[:5]); sys.exit(1)
print('ALL shell assets fetchable — APPLY_UPDATE would download them all')
EOF

echo "== lock screen renders (shell boots) =="
curl -s "$B/" | grep -q "id=\"__next\"" || curl -s "$B/" | grep -q "_next" && echo "shell HTML OK"

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "=== DONE ==="
