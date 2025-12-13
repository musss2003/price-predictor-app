# Real Estate Price Predictor App

A full-stack application for predicting real estate prices in Sarajevo, Bosnia and Herzegovina, with user authentication and personalized recommendations.

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Secure signup/signin with Supabase Auth
- 👤 **User Profiles** - Personalized profiles with search preferences
- 🏠 **Price Prediction** - AI-powered real estate price estimation
- 📍 **Map Integration** - Location-based property selection with GPS coordinates
- ⭐ **Saved Listings** - Favorite properties for later review
- 🎯 **Smart Recommendations** - Personalized listings based on preferences
- 📊 **Prediction History** - Track all your price predictions
- 💾 **Cloud Storage** - All data securely stored in Supabase
- 🎨 **Modern UI** - Beautiful gradient design with dark mode support

### 🆕 Enhanced Property Data (NEW!)
- **🗺️ GPS Coordinates** - Precise location data for map visualization
- **🏢 Rich Property Details** - 20+ additional fields including:
  - Full address extraction
  - Number of bathrooms
  - Property orientation
  - Floor type
  - Year built
  - Publication date
- **✅ Amenity Detection** - Automatic detection of:
  - Elevator/Lift
  - Garage
  - Parking space
  - Balcony
  - Internet connection
  - Cable TV
  - Basement/Attic
- **🔍 Advanced Filtering** - Filter by amenities and location
- **📏 Distance Search** - Find properties within X km of a location
- **🧠 Smart Scraping** - Adaptive extraction that handles varying listing formats

## 🏗️ Project Structure

```
price-predictor-app/
├── backend/              # Python FastAPI backend
│   ├── data/            # CSV datasets and data files
│   ├── models/          # ML models (future)
│   ├── routes/          # API route handlers (future)
│   ├── utils/           # Helper functions (future)
│   ├── main.py          # FastAPI application entry point
│   ├── requirements.txt # Python dependencies
│   ├── .env            # Environment variables (not in git)
│   └── .gitignore      # Python-specific ignores
│
├── frontend/            # React Native Expo app
│   ├── app/            # App screens (Expo Router)
│   │   ├── (tabs)/    # Tab navigation screens
│   │   ├── _layout.tsx
│   │   └── modal.tsx
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable React components
│   ├── constants/      # Theme and constants
│   ├── hooks/          # Custom React hooks
│   ├── package.json    # Node dependencies
│   └── .gitignore      # Frontend-specific ignores
│
├── .gitignore          # Root-level ignores (OS, IDE files)
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

- **Backend**: Python 3.14+
- **Frontend**: Node.js 18+, Expo CLI
- **Database**: Supabase account

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Add your Supabase credentials to .env file
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key

# Start the development server
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start --tunnel

# Or for local network
npx expo start
```

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user  
- `GET /auth/me` - Get current user profile

### Predictions
- `POST /predict` - Predict property price (optional auth)
- `GET /predictions` - Get user's prediction history (auth required)

### Listings
- `GET /listings` - Get all property listings
- `GET /listings/recommended` - Get personalized recommendations (auth required)
- `POST /saved-listings` - Save listing to favorites (auth required)
- `GET /saved-listings` - Get saved listings (auth required)

### Profile
- `PUT /profile` - Update user profile
- `PUT /profile/preferences` - Set search preferences

See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed API documentation.

## 🗄️ Database Schema

The app uses Supabase (PostgreSQL) with the following tables:

### `user_profiles`
User account information and preferences
- `user_id` - Links to Supabase auth
- `email`, `full_name`, `phone`
- `preferences` - JSON with search preferences

### `user_interests`
User activities (saved listings, searches)
- `user_id` - Links to user
- `interest_type` - Type of activity
- `data` - JSON with activity details

### `predictions`
Property price predictions
- `user_id` - Links to user (null for anonymous)
- Property features (location, size, condition, etc.)
- `predicted_price`

### `listings`
Real estate property listings scraped from multiple sources
- Property details (title, price, size, rooms)
- **🆕 Geographic data** (latitude, longitude)
- **🆕 Property details** (address, bathrooms, orientation, floor_type, year_built)
- **🆕 Amenities** (has_garage, has_elevator, has_balcony, has_parking, has_internet, has_cable_tv, has_basement)
- **🆕 Flexible storage** (extra_fields JSONB for variable data)
- Multiple images per listing
- Deal scores and analysis

See [backend/database_auth_setup.sql](./backend/database_auth_setup.sql) for complete schema.

## 🕷️ Web Scraping System

### Overview
The app includes an advanced web scraping system that extracts property data from multiple sources:

- **OLX Bosnia** - Primary source with 20+ extracted fields per listing
- **Adaptive extraction** - Automatically handles varying HTML structures
- **Multi-image support** - Extracts all property photos from carousels
- **Geographic extraction** - Parses GPS coordinates from Google Maps embeds
- **Smart field mapping** - Automatically categorizes and normalizes property attributes

### Running the Scraper

```bash
cd backend

# Quick test (2 pages)
python sync_service_supabase.py --source olx_ba --max-pages 2

# Full sync (all pages)
python sync_service_supabase.py --source olx_ba --max-pages 10
```

### Enhanced Fields System

The scraper now extracts **20+ additional property fields**:

**Geographic Data:**
- GPS coordinates (latitude/longitude) from Google Maps embeds
- Full street address

**Property Details:**
- Number of bathrooms
- Primary orientation (North, South, East, West)
- Floor type (Parquet, Tiles, etc.)
- Year built
- Publication date

**Amenities (Boolean flags):**
- Elevator/Lift
- Garage
- Parking space
- Balcony
- Internet connection
- Cable TV
- Basement/Attic storage

**Flexible Storage:**
- Unmapped fields stored in JSONB for future use
- Automatic field discovery and extraction

### Database Migration

To add the enhanced fields to your database:

```bash
cd backend/migrations

# Install psycopg2 if needed
pip install psycopg2-binary

# Run migration
python run_enhanced_fields_migration.py
```

**What's Added:**
- 15+ new database columns
- 6 performance indexes (including spatial and JSONB)
- 2 utility views (listings_with_location, listings_with_amenities)
- 1 distance calculation function (Haversine formula)

### Field Mapping

The sync service automatically maps Bosnian field names to English database columns:

| Bosnian Field | Database Column | Type |
|--------------|-----------------|------|
| adresa | address | TEXT |
| broj_kupatila | bathrooms | INTEGER |
| primarna_orjentacija | orientation | TEXT |
| vrsta_poda | floor_type | TEXT |
| godina_izgradnje | year_built | TEXT |
| garaža | has_garage | BOOLEAN |
| lift | has_elevator | BOOLEAN |
| balkon | has_balcony | BOOLEAN |

**Documentation:**
- 📖 [ENHANCED_FIELDS_GUIDE.md](./backend/ENHANCED_FIELDS_GUIDE.md) - Complete implementation guide
- 🚀 [DEPLOYMENT_CHECKLIST.md](./backend/DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment
- 📊 [IMPLEMENTATION_SUMMARY.md](./backend/IMPLEMENTATION_SUMMARY.md) - Feature overview

See [backend/database_auth_setup.sql](./backend/database_auth_setup.sql) for complete schema.

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database and auth
- **Pandas** - Data processing
- **Uvicorn** - ASGI server

### Frontend
- **React Native** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type safety
- **expo-linear-gradient** - Modern UI gradients
- **react-native-maps** - Map integration

## 📱 Features

- 🏠 Real estate price prediction based on property features
- 🔐 User authentication with secure JWT tokens
- 👤 Personalized user profiles with preferences
- 📍 Map-based location selection (requires development build)
- ⭐ Save favorite listings for later
- 🎯 Get personalized recommendations based on preferences
- 📊 Track prediction history across devices
- 🏘️ Browse property listings with deal scores
- 💾 Persistent data storage with Supabase
- 🎨 Modern gradient UI design with dark mode

## 🔒 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

## 🚀 Quick Start with Authentication

See [AUTH_SETUP_CHECKLIST.md](./AUTH_SETUP_CHECKLIST.md) for step-by-step setup guide.

**Quick setup:**
1. Run SQL migration in Supabase ([database_auth_setup.sql](./backend/database_auth_setup.sql))
2. Add Supabase credentials to `.env` files
3. Install frontend dependencies: `@supabase/supabase-js` and `@react-native-async-storage/async-storage`
4. Implement auth screens (see [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md))
5. Test authentication flow

## 📚 Documentation

- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Complete authentication implementation guide
- **[AUTH_SETUP_CHECKLIST.md](./AUTH_SETUP_CHECKLIST.md)** - Step-by-step setup checklist
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend app documentation

## 🧪 Development Notes

- Backend runs on `http://0.0.0.0:8000` (accessible from network)
- Frontend uses tunnel mode for testing on physical devices
- Maps feature requires Expo development build (not available in Expo Go)

## 📝 License

ISC

## 👥 Contributors

Mustafa Sinanovic