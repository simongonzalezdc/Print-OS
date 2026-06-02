#!/bin/bash
# CAEDO Unified Smoke Test Script

echo "--- STARTING SMOKE TESTS ---"

# 1. Backend Connectivity (Caedo API)
echo "1. Testing Caedo API (FastAPI) connectivity..."
if curl -s http://localhost:8000/health > /dev/null; then
  echo "✅ CAEDO API is ONLINE"
else
  echo "❌ CAEDO API is OFFLINE (Run: cd caedo-api && PYTHONPATH=. python3 api/main.py)"
fi

# 2. Frontend Connectivity (Caedo)
echo "2. Testing Caedo (Next.js) connectivity..."
if curl -s http://localhost:3002 > /dev/null; then
  echo "✅ Caedo Frontend is ONLINE"
else
  echo "❌ Caedo Frontend is OFFLINE (Run: cd caedo-web && PORT=3002 npm run dev)"
fi

# 3. AI Generation Route
echo "3. Testing Caedo AI Generation route..."
AI_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"create a small cube"}')

if [[ $AI_RESPONSE == *"error"* ]]; then
  echo "❌ AI Generation Route FAILED: $AI_RESPONSE"
else
  echo "✅ AI Generation Route SUCCESS"
fi

# 4. Handoff Directory Check
echo "4. Checking Handoff directory..."
if [ -d "shared/handoffs" ]; then
  echo "✅ Handoff directory exists"
else
  echo "❌ Handoff directory MISSING"
fi

echo "--- SMOKE TESTS COMPLETED ---"

