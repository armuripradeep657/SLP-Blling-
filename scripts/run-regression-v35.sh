#!/bin/bash
# v35 full regression — every historical suite on the ISOLATED server.
# run-e2e.sh's own exit code is pkill's, so pass/fail is read from the
# suite's "N passed, M failed" summary line.
cd /home/z/my-project
SUITES="shot-v24 shot-v25 shot-v27 shot-v29 shot-v30 shot-v32 shot-v34-public shot-v35-auth shot-v35-billing shot-v35-dashboard"
PASS=0
FAIL=0
FAILED=""
for s in $SUITES; do
  echo "=== $s ==="
  bash scripts/run-e2e.sh "scripts/$s.mjs" > "/tmp/reg-$s.log" 2>&1
  sum=$(grep -Eo "[0-9]+ passed, [0-9]+ failed" "/tmp/reg-$s.log" | tail -1)
  if [ -z "$sum" ]; then
    echo "  NO SUMMARY (crashed) — see /tmp/reg-$s.log"
    tail -5 "/tmp/reg-$s.log" | sed 's/^/  | /'
    FAIL=$((FAIL+1))
    FAILED="$FAILED $s"
  else
    nfail=$(echo "$sum" | sed -E 's/.* ([0-9]+) failed/\1/')
    npass=$(echo "$sum" | sed -E 's/([0-9]+) passed.*/\1/')
    echo "  $sum"
    if [ "$nfail" = "0" ] && [ "${npass:-0}" -gt 0 ]; then
      PASS=$((PASS+1))
    else
      FAIL=$((FAIL+1))
      FAILED="$FAILED $s"
      grep "  FAIL" "/tmp/reg-$s.log" | sed 's/^/  | /' | head -6
    fi
  fi
done
echo ""
echo "REGRESSION SUMMARY: $PASS suites green, $FAIL failed${FAILED:+ ->$FAILED}"
