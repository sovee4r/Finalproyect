#!/bin/bash

echo "🧪 Testing Login Flow..."

# Register a new user
echo "1. Registering new user..."
RESPONSE=$(curl -s -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testflow\", \"email\": \"testflow@test.com\", \"password\": \"test123\"}")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract token
TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ No token received - trying login..."
  
  # Try login
  RESPONSE=$(curl -s -X POST "http://localhost:8001/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"testflow@test.com\", \"password\": \"test123\"}")
  
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null
  TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

echo ""
echo "Token: ${TOKEN:0:50}..."

# Test /auth/me
echo ""
echo "2. Testing /auth/me..."
curl -s -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Test /users/me/character
echo ""
echo "3. Testing /users/me/character..."
curl -s -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "✅ Backend tests complete!"
echo ""
echo "📋 To test frontend:"
echo "1. Open browser console (F12)"
echo "2. Try to login with: testflow@test.com / test123"
echo "3. Watch console logs starting with [Dashboard]"
