import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from supabase import Client, create_client

from app.core.logging import logger
from app.services.auth import AuthService
from ml_runtime.predict import predict_price


load_dotenv()

# Initialize Supabase client and auth service
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
auth_service = AuthService(supabase)

router = APIRouter()


class PredictRequest(BaseModel):
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)

    condition: str
    ad_type: str
    property_type: str

    rooms: int = Field(gt=0)
    square_m2: float = Field(gt=0)

    equipment: str
    level: int
    heating: str


@router.post("/predict")
def predict(request: PredictRequest):
    payload = request.dict()
    audit_context = {
        "event": "prediction_request",
        "ad_type": payload.get("ad_type"),
        "property_type": payload.get("property_type"),
        "condition": payload.get("condition"),
        "rooms": payload.get("rooms"),
        "square_m2": payload.get("square_m2"),
        "has_coords": bool(payload.get("latitude") and payload.get("longitude")),
    }
    try:
        logger.info("Prediction request started", extra={**audit_context, "status": "started"})
        price = predict_price(payload)
        logger.info("Prediction request completed", extra={**audit_context, "status": "success"})
        return {"predicted_price": price}
    except ValueError as e:
        logger.warning("Prediction validation failed", extra={**audit_context, "status": "validation_error"})
        raise HTTPException(
            status_code=400,
            detail="Invalid input for prediction.",
        ) from None
    except Exception as e:
        logger.exception("Prediction failed", extra={**audit_context, "status": "error", "stage": "predict_price"})
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please try again later.",
        ) from None


@router.get("/predictions")
def get_predictions(limit: int = 50, authorization: Optional[str] = Header(None)):
    """
    Return the authenticated user's recent predictions.
    """
    user = auth_service.verify_token(authorization)
    capped_limit = max(1, min(limit, 200))
    logger.info(
        "Prediction history requested",
        extra={
            "event": "prediction_history",
            "limit": capped_limit,
            "user_id": user["id"],
        },
    )

    try:
        response = (
            supabase.table("predictions")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .limit(capped_limit)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.exception("Failed to fetch predictions", extra={"user_id": user["id"]})
        raise HTTPException(status_code=500, detail="Failed to fetch predictions") from None
