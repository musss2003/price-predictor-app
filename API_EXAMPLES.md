# API Usage Examples

Quick examples of how to use the authentication API.

## 🔐 Authentication Flow

### 1. Sign Up

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "phone": "+387 61 123 456"
  }'
```

Response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com"
  }
}
```

### 2. Sign In

```bash
curl -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com"
  }
}
```

**Save the `access_token` - you'll need it for authenticated requests!**

### 3. Get Current User

```bash
export TOKEN="your-access-token-here"

curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 👤 Profile Management

### Update Profile

```bash
curl -X PUT http://localhost:8000/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Smith",
    "phone": "+387 61 999 888"
  }'
```

### Set Search Preferences

```bash
curl -X PUT http://localhost:8000/profile/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "min_price": 80000,
    "max_price": 150000,
    "preferred_municipalities": ["Centar", "Novo Sarajevo"],
    "preferred_property_types": ["Apartment"],
    "min_rooms": 2,
    "max_rooms": 3,
    "min_square_m2": 60,
    "max_square_m2": 90,
    "preferred_conditions": ["New", "Renovated"],
    "notifications_enabled": true
  }'
```

### Get Preferences

```bash
curl -X GET http://localhost:8000/profile/preferences \
  -H "Authorization: Bearer $TOKEN"
```

## 🏠 Property Predictions

### Make Prediction (Authenticated)

```bash
curl -X POST http://localhost:8000/predict \
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
  }'
```

Response:
```json
{
  "price": 195000
}
```

### Get My Predictions

```bash
curl -X GET http://localhost:8000/predictions?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

## ⭐ Saved Listings

### Save a Listing

```bash
curl -X POST http://localhost:8000/saved-listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 42,
    "notes": "Perfect location near city center!"
  }'
```

### Get Saved Listings

```bash
curl -X GET http://localhost:8000/saved-listings \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
[
  {
    "id": 42,
    "title": "Beautiful 3-room apartment",
    "price_numeric": 125000,
    "square_m2": 75,
    "municipality": "Centar",
    "deal_score": 85,
    ...
  }
]
```

### Remove Saved Listing

```bash
curl -X DELETE http://localhost:8000/saved-listings/42 \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 Personalized Recommendations

```bash
curl -X GET http://localhost:8000/listings/recommended?limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

This returns listings filtered by your preferences, sorted by deal score.

## 📋 Public Endpoints (No Auth Required)

### Get All Listings

```bash
curl -X GET http://localhost:8000/listings?limit=50&sort=deal_score_desc
```

### Make Anonymous Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "longitude": 18.4131,
    "latitude": 43.8564,
    "condition": "Used",
    "ad_type": "Sale",
    "property_type": "Apartment",
    "rooms": 2,
    "square_m2": 60,
    "equipment": "Partially equipped",
    "level": 1,
    "heating": "Central"
  }'
```

## 🔄 Frontend Integration (React Native)

```typescript
import { supabase } from '@/services/supabase'

// Sign up
async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  
  if (error) console.error('Error:', error.message)
  else console.log('User created:', data.user)
}

// Sign in
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) console.error('Error:', error.message)
  else console.log('Logged in:', data.session.access_token)
}

// Make authenticated API call
async function makePrediction(propertyData: any) {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token
  
  const response = await fetch('http://10.0.199.127:8000/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(propertyData)
  })
  
  return response.json()
}

// Get saved listings
async function getSavedListings() {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token
  
  const response = await fetch('http://10.0.199.127:8000/saved-listings', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return response.json()
}
```

## 🧪 Testing Script

Save as `test_auth.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:8000"

echo "1. Sign up new user..."
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}')
echo $SIGNUP_RESPONSE

echo -e "\n2. Sign in..."
SIGNIN_RESPONSE=$(curl -s -X POST $API_URL/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')
echo $SIGNIN_RESPONSE

TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
echo -e "\nToken: $TOKEN"

echo -e "\n3. Get current user..."
curl -s -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n4. Update preferences..."
curl -s -X PUT $API_URL/profile/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"min_price":50000,"max_price":200000,"preferred_municipalities":["Centar"]}'

echo -e "\n\n5. Make prediction..."
curl -s -X POST $API_URL/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"longitude":18.4131,"latitude":43.8564,"condition":"New","ad_type":"Sale","property_type":"Apartment","rooms":3,"square_m2":75,"equipment":"Fully equipped","level":2,"heating":"Central"}'

echo -e "\n\n6. Get my predictions..."
curl -s -X GET $API_URL/predictions \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\nDone!"
```

Run with:
```bash
chmod +x test_auth.sh
./test_auth.sh
```

## 📝 Notes

- Tokens expire after a set time (default: 1 hour)
- Use refresh tokens to get new access tokens
- Always send tokens in `Authorization: Bearer <token>` header
- Anonymous predictions are allowed (no token required)
- User-specific data requires authentication
