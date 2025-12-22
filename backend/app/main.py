# main.py
import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our custom modules
from app.services.auth import AuthService
from app.models.models import (
    PredictionInput, PredictionResponse,
    UserSignUp, UserSignIn, UserProfile, UserProfileUpdate,
    UserPreferences, SavedListing, UserInterest,
    AuthResponse, MessageResponse
)
from app.api.api_enhanced import router as enhanced_router
from app.api.api_favorites import router as favorites_router

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Admin client for operations that need to bypass RLS
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else supabase

# Initialize auth service
auth_service = AuthService(supabase)

app = FastAPI(title="Real Estate Price Predictor API", version="1.0.0")

# Include enhanced API routers
app.include_router(enhanced_router, tags=["Enhanced Listings API"])
app.include_router(favorites_router, tags=["User Favorites & Saved Searches"])

# Allow your Expo App to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "scripts/data/flats.csv"

# Load CSV once at startup
df = pd.read_csv(DATA_PATH)

# --- Clean data ---
# Convert certain columns to numeric first
df["price_numeric"] = pd.to_numeric(df.get("price_numeric"), errors="coerce")
df["square_m2"] = pd.to_numeric(df.get("square_m2"), errors="coerce")
df["rooms"] = pd.to_numeric(df.get("rooms"), errors="coerce")
df["latitude"] = pd.to_numeric(df.get("latitude"), errors="coerce")
df["longitude"] = pd.to_numeric(df.get("longitude"), errors="coerce")
df["level"] = pd.to_numeric(df.get("level"), errors="coerce")

# Fill NaN values with appropriate defaults
df.fillna({
    "price_numeric": 0,
    "square_m2": 0,
    "rooms": 0,
    "level": 0,
    "latitude": 0,
    "longitude": 0,
    "title": "",
    "municipality": "",
    "ad_type": "",
    "property_type": "",
    "condition": "",
    "equipment": "",
    "heating": "",
}, inplace=True)

# Ensure ID exists
if "id" not in df.columns:
    df.insert(0, "id", range(1, len(df) + 1))


# ---- Simple ML-style price prediction (placeholder) ----
# Replace later with your real ML model!
def predict_price(row):
    base = 2000 * row["square_m2"]  # avg price/m2
    size_bonus = row["rooms"] * 15000
    return base + size_bonus


df["predicted_price"] = df.apply(predict_price, axis=1)
df["price_difference"] = df["price_numeric"] - df["predicted_price"]

# Deal score calculation
def deal_score(row):
    if row["predicted_price"] == 0:
        return 0
    diff_ratio = row["price_difference"] / row["predicted_price"]

    if diff_ratio < -0.20:
        return 95  # excellent
    if diff_ratio < -0.10:
        return 85  # good
    if diff_ratio < 0:
        return 70  # fair
    return 40  # overpriced

df["deal_score"] = df.apply(deal_score, axis=1)
df["is_underpriced"] = df["price_difference"] < 0
df["is_overpriced"] = df["price_difference"] > 0


# Convert entire df → list[dict] for API
listings = df.to_dict(orient="records")

# ===========================================================
#                      API ROUTES
# ===========================================================

@app.get("/")
def root():
    return {"message": "Real Estate Price Predictor API", "status": "running"}


# ===========================================================
#              AUTHENTICATION ENDPOINTS
# ===========================================================

@app.post("/auth/signup")
async def signup(user_data: UserSignUp):
    """Register a new user"""
    try:
        # Sign up with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Create user profile
        profile_data = {
            "full_name": user_data.full_name,
            "phone": user_data.phone
        }
        await auth_service.create_user_profile(
            response.user.id,
            user_data.email,
            profile_data
        )
        
        return {
            "message": "User created successfully",
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/signin")
async def signin(credentials: UserSignIn):
    """Sign in existing user"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/auth/signout")
async def signout(current_user: dict = Depends(auth_service.get_current_user)):
    """Sign out current user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/auth/me")
async def get_current_user_profile(current_user: dict = Depends(auth_service.get_current_user)):
    """Get current user's profile"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile


# ===========================================================
#              USER PROFILE ENDPOINTS
# ===========================================================

@app.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Update user profile"""
    update_data = profile_update.dict(exclude_unset=True)
    
    updated_profile = await auth_service.update_user_profile(
        current_user["id"],
        update_data
    )
    
    return {"message": "Profile updated", "profile": updated_profile}


@app.put("/profile/preferences")
async def update_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Update user search preferences"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update preferences
    update_data = {"preferences": preferences.dict(exclude_unset=True)}
    updated_profile = await auth_service.update_user_profile(
        current_user["id"],
        update_data
    )
    
    return {"message": "Preferences updated", "preferences": updated_profile.get("preferences")}


@app.get("/profile/preferences")
async def get_preferences(current_user: dict = Depends(auth_service.get_current_user)):
    """Get user preferences"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile.get("preferences", {})


# ===========================================================
#              SAVED LISTINGS & INTERESTS
# ===========================================================

@app.post("/saved-listings")
async def save_listing(
    saved: SavedListing,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Save a listing to user's favorites"""
    interest_data = {
        "listing_id": saved.listing_id,
        "notes": saved.notes,
        "saved_at": pd.Timestamp.now().isoformat()
    }
    
    result = await auth_service.save_user_interest(
        current_user["id"],
        "saved_listing",
        interest_data
    )
    
    return {"message": "Listing saved", "data": result}


@app.get("/saved-listings")
async def get_saved_listings(current_user: dict = Depends(auth_service.get_current_user)):
    """Get user's saved listings"""
    interests = await auth_service.get_user_interests(
        current_user["id"],
        interest_type="saved_listing"
    )
    
    # Extract listing IDs and fetch full listing data
    saved_listing_ids = [item["data"]["listing_id"] for item in interests]
    saved_listings = [listing for listing in listings if listing["id"] in saved_listing_ids]
    
    return saved_listings


@app.delete("/saved-listings/{listing_id}")
async def remove_saved_listing(
    listing_id: int,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Remove a listing from saved items"""
    try:
        # Find and delete the saved listing
        response = supabase.table("user_interests") \
            .delete() \
            .eq("user_id", current_user["id"]) \
            .eq("interest_type", "saved_listing") \
            .filter("data->>listing_id", "eq", str(listing_id)) \
            .execute()
        
        return {"message": "Listing removed from saved items"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===========================================================
#              PERSONALIZED LISTINGS
# ===========================================================

@app.get("/listings/recommended")
async def get_recommended_listings(
    limit: int = 50,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Get personalized recommended listings based on user preferences"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile or not profile.get("preferences"):
        # No preferences, return top deals
        data = sorted(listings, key=lambda x: x["deal_score"], reverse=True)
        return data[:limit]
    
    prefs = profile["preferences"]
    filtered = listings.copy()
    
    # Apply filters based on preferences
    if prefs.get("min_price"):
        filtered = [l for l in filtered if l["price_numeric"] >= prefs["min_price"]]
    
    if prefs.get("max_price"):
        filtered = [l for l in filtered if l["price_numeric"] <= prefs["max_price"]]
    
    if prefs.get("preferred_municipalities"):
        filtered = [l for l in filtered if l["municipality"] in prefs["preferred_municipalities"]]
    
    if prefs.get("preferred_property_types"):
        filtered = [l for l in filtered if l["property_type"] in prefs["preferred_property_types"]]
    
    if prefs.get("min_rooms"):
        filtered = [l for l in filtered if l["rooms"] >= prefs["min_rooms"]]
    
    if prefs.get("max_rooms"):
        filtered = [l for l in filtered if l["rooms"] <= prefs["max_rooms"]]
    
    if prefs.get("min_square_m2"):
        filtered = [l for l in filtered if l["square_m2"] >= prefs["min_square_m2"]]
    
    if prefs.get("max_square_m2"):
        filtered = [l for l in filtered if l["square_m2"] <= prefs["max_square_m2"]]
    
    if prefs.get("preferred_conditions"):
        filtered = [l for l in filtered if l["condition"] in prefs["preferred_conditions"]]
    
    # Sort by deal score
    filtered = sorted(filtered, key=lambda x: x["deal_score"], reverse=True)
    
    return filtered[:limit]


# ===========================================================
#              ORIGINAL ENDPOINTS (Updated)
# ===========================================================

@app.get("/listings")
def get_listings(
    limit: int = 100, 
    offset: int = 0, 
    sort: str = "deal_score_desc",
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    municipality: Optional[str] = None,
    property_type: Optional[str] = None,
    rooms_min: Optional[int] = None,
    size_min: Optional[float] = None,
    condition: Optional[str] = None,
    deal_score_min: Optional[float] = None,
):
    import math
    
    data = listings

    # Apply filters
    if price_min is not None:
        data = [l for l in data if l.get("price_numeric") and l["price_numeric"] >= price_min]
    
    if price_max is not None:
        data = [l for l in data if l.get("price_numeric") and l["price_numeric"] <= price_max]
    
    if municipality:
        data = [l for l in data if l.get("municipality") and municipality.lower() in l["municipality"].lower()]
    
    if property_type:
        data = [l for l in data if l.get("property_type") == property_type]
    
    if rooms_min is not None:
        data = [l for l in data if l.get("rooms") and l["rooms"] >= rooms_min]
    
    if size_min is not None:
        data = [l for l in data if l.get("square_m2") and l["square_m2"] >= size_min]
    
    if condition:
        data = [l for l in data if l.get("condition") == condition]
    
    if deal_score_min is not None:
        data = [l for l in data if l.get("deal_score") and l["deal_score"] >= deal_score_min]

    # Sort
    if sort == "deal_score_desc":
        data = sorted(data, key=lambda x: x.get("deal_score", 0), reverse=True)

    # Clean NaN values before pagination
    def clean_nan(obj):
        if isinstance(obj, dict):
            return {k: clean_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nan(item) for item in obj]
        elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
            return None
        return obj

    # Apply pagination with offset
    paginated_data = data[offset:offset + limit]
    cleaned_data = clean_nan(paginated_data)
    
    return {
        "total": len(data),
        "offset": offset,
        "limit": limit,
        "data": cleaned_data
    }


@app.get("/listings/{listing_id}")
def get_listing(listing_id: int):
    for item in listings:
        if item["id"] == listing_id:
            return item
    return {"error": "Listing not found"}


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    input_data: PredictionInput,
    authorization: Optional[str] = Header(None)
):
    """Predict property price based on input features (optionally authenticated)"""
    # Try to get user if authenticated, but don't require it
    user_id = None
    try:
        if authorization:
            user = auth_service.verify_token(authorization)
            user_id = user["id"]
    except:
        pass  # Anonymous prediction allowed
    
    # Simple prediction model (replace with your ML model)
    base_price = 2000 * input_data.square_m2
    room_bonus = input_data.rooms * 15000
    
    # Condition multiplier
    condition_multiplier = {
        "New": 1.2,
        "Renovated": 1.1,
        "Used": 0.95
    }.get(input_data.condition, 1.0)
    
    predicted_price = (base_price + room_bonus) * condition_multiplier
    
    # Save prediction to Supabase
    try:
        prediction_data = {
            "user_id": user_id,  # Null if anonymous
            "longitude": input_data.longitude,
            "latitude": input_data.latitude,
            "condition": input_data.condition,
            "ad_type": input_data.ad_type,
            "property_type": input_data.property_type,
            "rooms": input_data.rooms,
            "square_m2": input_data.square_m2,
            "equipment": input_data.equipment,
            "level": input_data.level,
            "heating": input_data.heating,
            "predicted_price": predicted_price
        }
        
        supabase_admin.table("predictions").insert(prediction_data).execute()
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
    
    return PredictionResponse(price=predicted_price)


@app.post("/sync-listings")
async def sync_listings_to_supabase():
    """Sync all listings from CSV to Supabase database"""
    try:
        # Integer fields that should be converted properly
        int_fields = {'id', 'price_numeric', 'price_per_m2', 'level_numeric', 
                      'predicted_price', 'price_difference', 'deal_score'}
        
        # Float/numeric fields
        float_fields = {'rooms', 'square_m2', 'latitude', 'longitude'}
        
        # Prepare data for Supabase (convert numpy types to Python types)
        listings_clean = []
        for listing in listings:
            clean_listing = {}
            for key, value in listing.items():
                if pd.isna(value) or value is None:
                    clean_listing[key] = None
                elif key in int_fields:
                    # Convert to int, handling float strings
                    try:
                        clean_listing[key] = int(float(value))
                    except (ValueError, TypeError):
                        clean_listing[key] = None
                elif key in float_fields:
                    # Convert to float
                    try:
                        clean_listing[key] = float(value)
                    except (ValueError, TypeError):
                        clean_listing[key] = None
                elif isinstance(value, (np.integer, np.floating)):
                    clean_listing[key] = float(value) if isinstance(value, np.floating) else int(value)
                elif isinstance(value, np.bool_):
                    clean_listing[key] = bool(value)
                else:
                    clean_listing[key] = str(value) if value is not None else None
            listings_clean.append(clean_listing)
        
        # Insert in batches of 100
        batch_size = 100
        total_inserted = 0
        for i in range(0, len(listings_clean), batch_size):
            batch = listings_clean[i:i+batch_size]
            result = supabase_admin.table("listings").upsert(batch).execute()
            total_inserted += len(batch)
            print(f"Inserted batch {i//batch_size + 1}: {len(batch)} records (Total: {total_inserted})")
        
        return {
            "message": "Listings synced successfully",
            "count": len(listings_clean)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error syncing to Supabase: {str(e)}")


@app.get("/predictions")
async def get_predictions(
    limit: int = 50,
    authorization: Optional[str] = Header(None)
):
    """Get user's recent predictions from Supabase (requires authentication)"""
    if not authorization:
        return []
    
    try:
        user = auth_service.verify_token(authorization)
        response = supabase.table("predictions") \
            .select("*") \
            .eq("user_id", user["id"]) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        return response.data
    except Exception as e:
        print(f"Error fetching predictions: {e}")
        return []


