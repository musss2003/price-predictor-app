from fastapi import APIRouter, HTTPException, logger
from pydantic import BaseModel, Field
from backend.ml_runtime.predict import predict_price
from backend.app.core.logging import logger


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
def predict(data: PredictRequest):
    try:
        price = predict_price(data.dict())
        logger.info("Prediction request received")
        return {"predicted_price": price}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
