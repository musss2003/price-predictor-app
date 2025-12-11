# main.py
import pandas as pd
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your Expo App to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/flats.csv"

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

@app.get("/listings")
def get_listings(limit: int = 100, sort: str = "deal_score_desc"):
    data = listings

    if sort == "deal_score_desc":
        data = sorted(data, key=lambda x: x["deal_score"], reverse=True)

    return data[:limit]


@app.get("/listings/{listing_id}")
def get_listing(listing_id: int):
    for item in listings:
        if item["id"] == listing_id:
            return item
    return {"error": "Listing not found"}
