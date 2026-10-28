#!/usr/bin/env bash
# Test 7-11 ulang: dengan header Origin seperti browser sungguhan
BASE=http://localhost:3100

TOKEN=$(curl -s "$BASE/api/csrf" | sed -E 's/.*"token":"([^"]+)".*/\1/')
echo "token: ${TOKEN:0:16}... (len=${#TOKEN})"

echo ""
echo "=== [7] POST valid: same-origin + cookie==header + signature benar -> harus lolos CSRF ==="
curl -s -w ' [%{http_code}]\n' -X POST "$BASE/api/report" \
  -H 'Content-Type: application/json' \
  -H "Origin: $BASE" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Cookie: webuild_csrf=$TOKEN" \
  -d '{"slug":"x"}'

echo ""
echo "=== [10] Rate limit /api/report: 12x POST valid ==="
for i in $(seq 1 12); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST "$BASE/api/report" \
    -H 'Content-Type: application/json' \
    -H "Origin: $BASE" \
    -H "X-CSRF-Token: $TOKEN" \
    -H "Cookie: webuild_csrf=$TOKEN" \
    -d "{\"slug\":\"nonexistent-$i\"}"
done
echo ""
echo "(harapan: 404 beberapa kali, lalu 429 setelah 10x)"

echo ""
echo "=== [11] Header Retry-After pada 429 ==="
curl -s -D- -o /dev/null -X POST "$BASE/api/report" \
  -H 'Content-Type: application/json' \
  -H "Origin: $BASE" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Cookie: webuild_csrf=$TOKEN" \
  -d '{"slug":"nonexistent-zz"}' | grep -iE 'retry-after|HTTP/'
