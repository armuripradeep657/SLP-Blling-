#!/usr/bin/env bash
# One-shot smoke test for the v39 HTTPS + security hardening.
# Boots the server in TLS mode, runs all checks, then plain-HTTP mode, exits.
set -u
cd /home/z/my-project

SLP_TLS_CERT=tls/slp-cert.pem SLP_TLS_KEY=tls/slp-key.pem PORT=3443 SLP_HTTP_PORT=3444 SLP_CHILD_PORT=3102 \
  node .next/standalone/server.js > /tmp/slp-server.log 2>&1 &
SRV=$!
sleep 7

echo "=== 1. HTTPS homepage ==="
curl -sk -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" https://localhost:3443/

echo "=== 2. security headers ==="
curl -skI https://localhost:3443/ | grep -iE "^(content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy):" | cut -c1-110

echo "=== 3. HTTP -> HTTPS redirect ==="
curl -s -o /dev/null -w "status=%{http_code} location=%{redirect_url}\n" "http://localhost:3444/some/path?x=1"

echo "=== 4. /ca.crt served for phone install ==="
curl -sk -o /dev/null -w "status=%{http_code} type=%{content_type}\n" https://localhost:3443/ca.crt

echo "=== 5. login rate limit: 11 bad staff logins ==="
for i in $(seq 1 11); do
  code=$(curl -sk -o /dev/null -w "%{http_code}" -X POST https://localhost:3443/api/staff/login \
    -H 'content-type: application/json' -d '{"userId":"XX","secret":"wrong"}')
  printf "%s " "$code"
done; echo ""

echo "=== 6. oversized body (>25MB) rejected ==="
head -c 26214400 /dev/zero | curl -sk -o /dev/null -w "status=%{http_code}\n" \
  -X POST https://localhost:3443/api/state --data-binary @- -H 'content-type: application/json'

echo "=== 7. negotiated TLS ==="
echo | openssl s_client -connect localhost:3443 2>/dev/null | grep -E "^-(Protocol|Cipher)|New, " | head -3

echo "=== 8. plain HTTP mode (platform path) still works ==="
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
PORT=3101 node .next/standalone/server.js > /tmp/slp-http.log 2>&1 &
SRV2=$!
sleep 6
curl -s -o /dev/null -w "plain HTTP status=%{http_code}\n" http://localhost:3101/
kill $SRV2 2>/dev/null; wait $SRV2 2>/dev/null

echo "=== server log (TLS mode) ==="
grep -E "slp-tls|Ready|ready" /tmp/slp-server.log | head -4
echo "=== DONE ==="
