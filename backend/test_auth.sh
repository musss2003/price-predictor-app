#!/bin/bash

# Test Authentication System
# Run this after starting the backend server

API_URL="${1:-http://localhost:8000}"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPass123!"
NAME="Test User"

echo "🧪 Testing Authentication System"
echo "================================"
echo "API URL: $API_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check API is running
echo -e "${YELLOW}1. Checking API health...${NC}"
HEALTH=$(curl -s $API_URL)
if [[ $HEALTH == *"running"* ]]; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Sign up
echo -e "${YELLOW}2. Testing signup...${NC}"
echo "Email: $EMAIL"
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"$NAME\"}")

if [[ $SIGNUP_RESPONSE == *"successfully"* ]]; then
    echo -e "${GREEN}✓ Signup successful${NC}"
else
    echo -e "${RED}✗ Signup failed${NC}"
    echo "Response: $SIGNUP_RESPONSE"
fi
echo ""

# Test 3: Sign in
echo -e "${YELLOW}3. Testing signin...${NC}"
SIGNIN_RESPONSE=$(curl -s -X POST $API_URL/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ $SIGNIN_RESPONSE == *"access_token"* ]]; then
    echo -e "${GREEN}✓ Signin successful${NC}"
    TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}✗ Signin failed${NC}"
    echo "Response: $SIGNIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get current user
echo -e "${YELLOW}4. Testing get current user...${NC}"
USER_RESPONSE=$(curl -s -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")

if [[ $USER_RESPONSE == *"$EMAIL"* ]]; then
    echo -e "${GREEN}✓ Get current user successful${NC}"
else
    echo -e "${RED}✗ Get current user failed${NC}"
    echo "Response: $USER_RESPONSE"
fi
echo ""

# Test 5: Update preferences
echo -e "${YELLOW}5. Testing update preferences...${NC}"
PREF_RESPONSE=$(curl -s -X PUT $API_URL/profile/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "min_price": 80000,
    "max_price": 150000,
    "preferred_municipalities": ["Centar", "Novo Sarajevo"],
    "min_rooms": 2,
    "max_rooms": 3
  }')

if [[ $PREF_RESPONSE == *"updated"* ]]; then
    echo -e "${GREEN}✓ Update preferences successful${NC}"
else
    echo -e "${RED}✗ Update preferences failed${NC}"
    echo "Response: $PREF_RESPONSE"
fi
echo ""

# Test 6: Make prediction
echo -e "${YELLOW}6. Testing prediction with auth...${NC}"
PRED_RESPONSE=$(curl -s -X POST $API_URL/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "longitude": 18.4131,
    "latitude": 43.8564,
    "condition": "New",
    "ad_type": "Sale",
    "property_type": "Apartment",
    "rooms": 3,
    "square_m2": 75,
    "equipment": "Fully equipped",
    "level": 2,
    "heating": "Central"
  }')

if [[ $PRED_RESPONSE == *"price"* ]]; then
    echo -e "${GREEN}✓ Prediction successful${NC}"
    PRICE=$(echo $PRED_RESPONSE | grep -o '"price":[0-9.]*' | sed 's/"price"://')
    echo "Predicted Price: $PRICE KM"
else
    echo -e "${RED}✗ Prediction failed${NC}"
    echo "Response: $PRED_RESPONSE"
fi
echo ""

# Test 7: Get user predictions
echo -e "${YELLOW}7. Testing get predictions...${NC}"
GET_PRED_RESPONSE=$(curl -s -X GET "$API_URL/predictions?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if [[ $GET_PRED_RESPONSE == *"["* ]]; then
    echo -e "${GREEN}✓ Get predictions successful${NC}"
    PRED_COUNT=$(echo $GET_PRED_RESPONSE | grep -o "predicted_price" | wc -l)
    echo "Found $PRED_COUNT predictions"
else
    echo -e "${RED}✗ Get predictions failed${NC}"
    echo "Response: $GET_PRED_RESPONSE"
fi
echo ""

# Test 8: Get recommended listings
echo -e "${YELLOW}8. Testing personalized recommendations...${NC}"
RECO_RESPONSE=$(curl -s -X GET "$API_URL/listings/recommended?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if [[ $RECO_RESPONSE == *"["* ]]; then
    echo -e "${GREEN}✓ Recommendations successful${NC}"
    LISTING_COUNT=$(echo $RECO_RESPONSE | grep -o '"id"' | wc -l)
    echo "Found $LISTING_COUNT recommended listings"
else
    echo -e "${RED}✗ Recommendations failed${NC}"
    echo "Response: $RECO_RESPONSE"
fi
echo ""

# Test 9: Save listing
echo -e "${YELLOW}9. Testing save listing...${NC}"
SAVE_RESPONSE=$(curl -s -X POST $API_URL/saved-listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "notes": "Great deal!"
  }')

if [[ $SAVE_RESPONSE == *"saved"* ]]; then
    echo -e "${GREEN}✓ Save listing successful${NC}"
else
    echo -e "${RED}✗ Save listing failed${NC}"
    echo "Response: $SAVE_RESPONSE"
fi
echo ""

# Test 10: Get saved listings
echo -e "${YELLOW}10. Testing get saved listings...${NC}"
SAVED_RESPONSE=$(curl -s -X GET $API_URL/saved-listings \
  -H "Authorization: Bearer $TOKEN")

if [[ $SAVED_RESPONSE == *"["* ]]; then
    echo -e "${GREEN}✓ Get saved listings successful${NC}"
else
    echo -e "${RED}✗ Get saved listings failed${NC}"
    echo "Response: $SAVED_RESPONSE"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Test user credentials:"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo ""
echo "You can use these credentials to:"
echo "- Test the frontend app"
echo "- Explore the API at $API_URL/docs"
echo "- Check user data in Supabase dashboard"
