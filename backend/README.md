# Backend API

FastAPI backend for real estate price prediction with user authentication.

## Features

- 🔐 User authentication with Supabase Auth
- 👤 User profiles with preferences
- ⭐ Saved listings (favorites)
- 🎯 Personalized recommendations
- 📊 User-specific prediction history
- 🏠 Property price prediction
- 📋 Property listings management

## Structure

```
backend/
├── main.py              # Main FastAPI application with all endpoints
├── auth.py              # Authentication service and middleware
├── models.py            # Pydantic models for API
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
├── .gitignore          # Python ignores
├── database_auth_setup.sql  # Database migration for auth tables
└── data/               # CSV datasets
```

## Best Practices (Future Improvements)

For production, consider this structure:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── prediction.py
│   │   └── listing.py
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── predict.py
│   │   └── listings.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── prediction_service.py
│   │   └── listing_service.py
│   └── utils/               # Helper functions
│       ├── __init__.py
│       └── data_processing.py
├── tests/                   # Unit tests
│   ├── __init__.py
│   └── test_predict.py
├── alembic/                 # Database migrations
├── requirements.txt
├── .env
└── .gitignore
```

## Running

```bash
# Development
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/signout` - Logout user
- `GET /auth/me` - Get current user

### Profile
- `PUT /profile` - Update user profile
- `PUT /profile/preferences` - Update search preferences
- `GET /profile/preferences` - Get user preferences

### Listings
- `GET /listings` - Get all listings
- `GET /listings/{id}` - Get single listing
- `GET /listings/recommended` - Get personalized recommendations (auth required)

### Saved Listings
- `POST /saved-listings` - Save a listing (auth required)
- `GET /saved-listings` - Get saved listings (auth required)
- `DELETE /saved-listings/{id}` - Remove saved listing (auth required)

### Predictions
- `POST /predict` - Make price prediction (optional auth)
- `GET /predictions` - Get user's predictions (auth required)
- `POST /sync-listings` - Sync CSV to database

See [AUTHENTICATION_GUIDE.md](../AUTHENTICATION_GUIDE.md) for detailed API documentation.

## Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Dependencies

```txt
fastapi
uvicorn[standard]
pandas
numpy
supabase
python-dotenv
```
