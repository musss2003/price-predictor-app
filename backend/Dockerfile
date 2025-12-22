# -----------------------------
# Base image
# -----------------------------
FROM python:3.11-slim

# -----------------------------
# Environment variables
# -----------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# -----------------------------
# Working directory
# -----------------------------
WORKDIR /app

# -----------------------------
# Install system dependencies
# -----------------------------
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Install Python dependencies
# -----------------------------
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------
# Copy FastAPI application code
# -----------------------------
COPY backend/app ./app

# -----------------------------
# Copy ML runtime code (THIS WAS MISSING)
# -----------------------------
COPY backend/ml_runtime ./ml_runtime

# -----------------------------
# Copy trained model artifacts
# -----------------------------
COPY ml/artifacts ./ml/artifacts

# -----------------------------
# Expose API port
# -----------------------------
EXPOSE 8000

# -----------------------------
# Start FastAPI
# -----------------------------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]