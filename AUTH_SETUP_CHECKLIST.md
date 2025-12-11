# Authentication Setup Checklist

Follow these steps to implement authentication in your app:

## ✅ Backend Setup

- [ ] 1. **Run Database Migration**
  ```bash
  # Go to Supabase Dashboard → SQL Editor
  # Copy and run the SQL from: backend/database_auth_setup.sql
  ```

- [ ] 2. **Verify Environment Variables**
  ```bash
  # Check backend/.env has:
  SUPABASE_URL=https://nfdhwfdfzxprrvqcczit.supabase.co
  SUPABASE_KEY=your-anon-key
  ```

- [ ] 3. **Test Backend Endpoints**
  ```bash
  cd backend
  python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
  
  # Visit: http://localhost:8000/docs
  # Test /auth/signup and /auth/signin
  ```

## ✅ Frontend Setup

- [ ] 4. **Install Dependencies**
  ```bash
  cd frontend
  npm install @supabase/supabase-js @react-native-async-storage/async-storage
  ```

- [ ] 5. **Create Supabase Client**
  - [ ] Create `services/supabase.ts` (see AUTHENTICATION_GUIDE.md)
  - [ ] Create `contexts/AuthContext.tsx` (see AUTHENTICATION_GUIDE.md)

- [ ] 6. **Add Environment Variables**
  ```bash
  # Add to frontend/.env:
  EXPO_PUBLIC_SUPABASE_URL=https://nfdhwfdfzxprrvqcczit.supabase.co
  EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
  ```

- [ ] 7. **Create Auth Screens**
  - [ ] `app/auth/signin.tsx` - Sign in screen
  - [ ] `app/auth/signup.tsx` - Sign up screen
  - [ ] `app/auth/_layout.tsx` - Auth layout

- [ ] 8. **Wrap App with AuthProvider**
  ```typescript
  // In app/_layout.tsx
  import { AuthProvider } from '@/contexts/AuthContext'
  
  export default function RootLayout() {
    return (
      <AuthProvider>
        {/* existing code */}
      </AuthProvider>
    )
  }
  ```

- [ ] 9. **Update API Calls**
  - [ ] Create `services/api.ts` with auth headers
  - [ ] Update prediction form to use authenticated API
  - [ ] Update listings to use authenticated API

- [ ] 10. **Add Profile Screen**
  - [ ] Create profile tab
  - [ ] Add preferences form
  - [ ] Add saved listings view

## 🧪 Testing Checklist

- [ ] **Sign Up Flow**
  - [ ] User can create account
  - [ ] Profile is automatically created
  - [ ] Receives access token

- [ ] **Sign In Flow**
  - [ ] User can login with email/password
  - [ ] Token is stored in AsyncStorage
  - [ ] User stays logged in after app restart

- [ ] **Protected Endpoints**
  - [ ] Can access /auth/me with token
  - [ ] Can save listings
  - [ ] Can get personalized recommendations
  - [ ] Predictions are saved with user_id

- [ ] **Sign Out Flow**
  - [ ] Token is cleared
  - [ ] User is redirected to auth screen

## 📚 Documentation

All implementation details are in:
- **AUTHENTICATION_GUIDE.md** - Complete authentication guide
- **backend/README.md** - Backend API documentation
- **backend/database_auth_setup.sql** - Database schema

## 🆘 Troubleshooting

### "Authentication failed"
- Check Supabase credentials in `.env`
- Verify SQL migration ran successfully
- Check token is being sent in Authorization header

### "Profile not found"
- Verify trigger `on_auth_user_created` is active in Supabase
- Manually create profile if needed

### "Row Level Security" errors
- Check RLS policies in Supabase
- Verify user is authenticated
- Check user_id matches in database

## 🎯 Quick Start (TL;DR)

```bash
# 1. Run SQL in Supabase (database_auth_setup.sql)

# 2. Install frontend deps
cd frontend
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 3. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to .env

# 4. Implement auth screens following AUTHENTICATION_GUIDE.md

# 5. Test!
```

## 📞 Support

See detailed implementation in **AUTHENTICATION_GUIDE.md**
