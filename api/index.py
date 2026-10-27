
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException

from train_models import (
    PATIENT_ID_COLUMN,
    build_features,
    assign_risk_category,
)

# Project root: parent of the api folder
ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = ROOT / "models" / "best_model.joblib"
DATA_PATH = ROOT / "outputs" / "merged_patient_data.csv"

app = FastAPI(title="AI Patient Risk Score Prediction API")


# Load the saved model and dataset
if not MODEL_PATH.is_file():
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

if not DATA_PATH.is_file():
    raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

model = joblib.load(MODEL_PATH)
merged = pd.read_csv(DATA_PATH, low_memory=False)

if PATIENT_ID_COLUMN not in merged.columns:
    raise ValueError(
        f"Required column '{PATIENT_ID_COLUMN}' is missing."
    )

# Keep patient IDs consistent with the training script.
merged[PATIENT_ID_COLUMN] = (
    merged[PATIENT_ID_COLUMN]
    .astype("string")
    .str.strip()
)

# Use the exact feature-preparation function from train_models.py.
X, y, patient_ids = build_features(merged)

# Map each valid patient ID to its corresponding feature row.
patient_lookup = {
    str(patient_id): row_index
    for row_index, patient_id in zip(
        X.index, patient_ids.to_numpy()
    )
}

# Find the probability column corresponding to target class 1.
classes = list(model.classes_)

if 1 not in classes:
    raise ValueError("The trained model does not contain target class 1.")

positive_class_index = classes.index(1)


@app.get("/")
def home():
    return {
        "message": "AI Patient Risk Score API is running",
        "docs": "/docs",
        "status": "success",
    }


@app.get("/predict/{patient_id}")
def predict(patient_id: str):
    patient_id = patient_id.strip()

    if not patient_id:
        raise HTTPException(
            status_code=400,
            detail="Patient ID cannot be empty.",
        )

    row_index = patient_lookup.get(patient_id)

    if row_index is None:
        raise HTTPException(
            status_code=404,
            detail="Patient ID not found or target label is invalid.",
        )

    # The saved model is a complete preprocessing + classifier pipeline.
    features = X.loc[[row_index]]

    try:
        probability = float(
            model.predict_proba(features)[0, positive_class_index]
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate the risk prediction.",
        )

    return {
        "patient_id": patient_id,
        "risk_score": round(probability * 100, 2),
        "probability": round(probability, 4),
        "risk_category": assign_risk_category(probability),
        "notice": (
            "Research/demo prototype only. "
            "This result is not a clinically validated diagnosis."
        ),
    }
