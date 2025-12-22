import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[3] / "ml" / "artifacts" / "model.joblib"

_model = None

def get_model():
    global _model
    if _model is None:
        print("🔄 Loading ML model...")
        _model = joblib.load(MODEL_PATH)
    return _model
