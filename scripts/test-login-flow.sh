#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3000"
COOKIE_JAR="/tmp/login-test-cookie.jar"
rm -f "$COOKIE_JAR"

echo "1️⃣ GET /login (to set any CSRF token if present)"
STATUS=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE/login" -o /dev/null -w '%{http_code}')
echo "   Status: $STATUS"

echo ""
echo "2️⃣ POST /login (email=smoke-user@rockndogs.com, password=smokepass)"
STATUS=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/login" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'email=smoke-user@rockndogs.com&password=smokepass' \
  -o /dev/null -w '%{http_code}')
echo "   Status: $STATUS (expect 302 redirect)"

echo ""
echo "3️⃣ Follow redirect GET / → /home"
STATUS=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -L "$BASE/" -o /dev/null -w '%{http_code}')
echo "   Status: $STATUS (expect 200)"

echo ""
echo "4️⃣ Verify authenticated: GET /cart"
RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE/cart" -o /tmp/cart-response.html -w '%{http_code}')
echo "   Status: $RESPONSE"

if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ SUCCESS: /cart returned 200 (user is authenticated)"
  echo "   Preview of cart page:"
  head -3 /tmp/cart-response.html | sed 's/^/      /'
elif [ "$RESPONSE" = "302" ]; then
  echo "   ❌ FAIL: /cart returned 302 (still not authenticated; cookie not persisted)"
  echo "   Cookie jar contents:"
  cat "$COOKIE_JAR" | sed 's/^/      /'
else
  echo "   ❌ FAIL: /cart returned $RESPONSE"
fi

echo ""
echo "Cookie jar location: $COOKIE_JAR"
