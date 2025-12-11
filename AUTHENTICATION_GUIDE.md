# Authentication Implementation Guide

This guide explains how to implement user authentication with personalized profiles in your Real Estate Price Predictor app.

## 📋 Overview

The authentication system provides:
- ✅ User registration and login with Supabase Auth
- ✅ JWT token-based authentication
- ✅ User profiles with preferences
- ✅ Saved listings (favorites)
- ✅ Personalized recommendations
- ✅ User-specific prediction history

## 🗄️ Database Setup

### 1. Run SQL Migration

Go to your Supabase project → SQL Editor and run the SQL from `database_auth_setup.sql`. This creates:

- `user_profiles` - User profile data and preferences
- `user_interests` - Saved listings and user activities
- Updates `predictions` table with `user_id` column
- Row Level Security policies for data privacy
- Automatic profile creation on signup

### 2. Enable Email Auth (if needed)

In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

## 🔧 Backend API

### Authentication Endpoints

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "phone": "+387 61 123 456"
}
```

#### Sign In
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

### Profile Endpoints

#### Update Profile
```http
PUT /profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "John Smith",
  "phone": "+387 61 999 888"
}
```

#### Update Preferences
```http
PUT /profile/preferences
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "min_price": 50000,
  "max_price": 200000,
  "preferred_municipalities": ["Centar", "Novo Sarajevo"],
  "preferred_property_types": ["Apartment"],
  "min_rooms": 2,
  "max_rooms": 4,
  "min_square_m2": 50,
  "max_square_m2": 100,
  "preferred_conditions": ["New", "Renovated"],
  "notifications_enabled": true
}
```

### Saved Listings

#### Save a Listing
```http
POST /saved-listings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "listing_id": 123,
  "notes": "Great location!"
}
```

#### Get Saved Listings
```http
GET /saved-listings
Authorization: Bearer <access_token>
```

#### Remove Saved Listing
```http
DELETE /saved-listings/123
Authorization: Bearer <access_token>
```

### Personalized Recommendations

```http
GET /listings/recommended?limit=50
Authorization: Bearer <access_token>
```

Returns listings filtered by user preferences, sorted by deal score.

### Prediction Endpoints

#### Make Prediction (with auth)
```http
POST /predict
Authorization: Bearer <access_token>
Content-Type: application/json

{
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
}
```

Predictions are saved with `user_id` for logged-in users.

#### Get User's Predictions
```http
GET /predictions?limit=50
Authorization: Bearer <access_token>
```

Returns only the authenticated user's predictions.

## 📱 Frontend Integration (React Native)

### 1. Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
```

### 2. Create Supabase Client

Create `frontend/services/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### 3. Create Auth Context

Create `frontend/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 4. Create Auth Screens

Create `frontend/app/auth/signin.tsx`:

```typescript
import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <TouchableOpacity
        onPress={handleSignIn}
        disabled={loading}
        style={{ backgroundColor: '#667eea', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
```

### 5. Make Authenticated API Calls

Create `frontend/services/api.ts`:

```typescript
import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

async function getAuthHeaders() {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export async function makePrediction(data: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  
  return response.json()
}

export async function getSavedListings() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/saved-listings`, {
    headers
  })
  
  return response.json()
}

export async function getRecommendedListings() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/listings/recommended`, {
    headers
  })
  
  return response.json()
}
```

### 6. Update Environment Variables

Add to `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.199.127:8000
EXPO_PUBLIC_SUPABASE_URL=https://nfdhwfdfzxprrvqcczit.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use Row Level Security** - Implemented in SQL migration
3. **Validate tokens on backend** - Implemented in `auth.py`
4. **Store tokens securely** - Using AsyncStorage
5. **Use HTTPS in production** - Configure in deployment

## 📊 User Flow

1. User signs up → Profile automatically created
2. User sets preferences → Saved in `user_profiles.preferences`
3. User browses listings → Can save favorites
4. User makes predictions → Linked to their account
5. User gets recommendations → Based on preferences

## 🧪 Testing

```bash
# Start backend
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'

# Test signin
curl -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected endpoint
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🚀 Next Steps

1. Run SQL migration in Supabase
2. Update frontend `.env` with Supabase credentials
3. Install frontend dependencies
4. Implement auth screens
5. Update existing screens to use authenticated API calls
6. Test authentication flow

## 📚 Additional Features to Consider

- Password reset via email
- Social login (Google, Facebook)
- Email verification
- Push notifications for new listings
- Sharing predictions with other users
- Admin panel for listing management
