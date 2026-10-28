#!/usr/bin/env bash
# Smoke test security hardening WeBuild (dev, NODE_ENV=production via next start)
BASE=http://localhost:3100

echo "=== [1] Security headers di landing page (/) ==="
curl -s -D- -o /dev/null "$BASE/" | grep -iE 'content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-opener' | cut -c1-120

echo ""
echo "=== [2] CSP di /dashboard (profile app) + XFO DENY ==="
curl -s -D- -o /dev/null "$BASE/dashboard" | grep -iE 'content-security-policy|x-frame-options' | cut -c1-140

echo ""
echo "=== [3] /dashboard tanpa login -> redirect /login ==="
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$BASE/dashboard"

echo ""
echo "=== [4] POST /api/report TANPA CSRF -> harus 403 ==="
curl -s -w ' [%{http_code}]\n' -X POST "$BASE/api/report" -H 'Content-Type: application/json' -d '{"slug":"x"}'

echo ""
echo "=== [5] POST dengan Origin cross-site -> harus 403 ==="
curl -s -w ' [%{http_code}]\n' -X POST "$BASE/api/report" -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{"slug":"x"}'

echo ""
echo "=== [6] GET /api/csrf -> token + Set-Cookie ==="
curl -s -D- -c /tmp/wb-cookies.txt "$BASE/api/csrf" | grep -iE 'set-cookie|^\{' | cut -c1-130

TOKEN=$(grep webuild_csrf /tmp/wb-cookies.txt | awk '{print $NF}')
echo ""
echo "=== [7] POST /api/report DENGAN CSRF valid (same-origin) -> bukan 403 ==="
# slug x tidak ada -> 404 diharapkan (CSRF & origin lolos)
curl -s -w ' [%{http_code}]\n' -X POST "$BASE/api/report" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $TOKEN" \
  -b "webuild_csrf=$TOKEN" \
  -d '{"slug":"x"}'

echo ""
echo "=== [8] POST dengan token KOSONG di header (mismatch cookie) -> 403 ==="
curl -s -w ' [%{http_code}]\n' -X POST "$BASE/api/report" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: tampered.token" \
  -b "webuild_csrf=$TOKEN" \
  -d '{"slug":"x"}'

echo ""
echo "=== [9] Rate limit /api/report: 12x POST valid-IP berbeda-beda slug ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  curl -s -o /dev/null -w '%{http_code} ' -X POST "$BASE/api/report" \
    -H 'Content-Type: application/json' \
    -H "X-CSRF-Token: $TOKEN" \
    -b "webuild_csrf=$TOKEN" \
    -d '{"slug":"nonexistent-'$i'"}'
done
echo "(400/404 dulu, lalu 429 setelah limit 10/jam)"

echo ""
echo "=== [10] HSTS diaktifkan? (NODE_ENV production) ==="
curl -s -D- -o /dev/null "$BASE/" | grep -i strict-transport || echo "(tidak ada — cek NODE_ENV)"
