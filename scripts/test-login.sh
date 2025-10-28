#!/bin/bash

# Test signup and login functionality

BASE_URL="http://localhost:3000"
COOKIES="/tmp/test-cookies.txt"
rm -f "$COOKIES"

echo "🧪 Testing RockNDogs Authentication"
echo "===================================="
echo ""

# Test 1: Signup
echo "1️⃣  Testing signup..."
SIGNUP_RESPONSE=$(curl -s -c "$COOKIES" -b "$COOKIES" -X POST "$BASE_URL/signup" \
  -d "email=testuser@test.com&password=testpass123&name=Test User" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo "   Signup HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Signup successful"
else
  echo "   ❌ Signup failed"
  echo "$SIGNUP_RESPONSE" | head -20
fi

echo ""

# Test 2: Login
echo "2️⃣  Testing login..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIES" -b "$COOKIES" -L -X POST "$BASE_URL/login" \
  -d "email=testuser@test.com&password=testpass123" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo "   Login HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Login successful"
else
  echo "   ❌ Login failed"
fi

echo ""

# Test 3: Access protected route /cart
echo "3️⃣  Testing /cart access (should work if logged in)..."
CART_RESPONSE=$(curl -s -b "$COOKIES" "$BASE_URL/cart" -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$CART_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
echo "   Cart HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Authenticated - cart accessible"
elif [ "$HTTP_CODE" = "302" ]; then
  echo "   ❌ Not authenticated - redirected to login"
else
  echo "   ❌ Unexpected response"
fi

echo ""
echo "📊 Cookie jar contents:"
cat "$COOKIES" | grep -v "^#"

echo ""
echo "✅ Test complete!"
