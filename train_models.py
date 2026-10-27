"""
AI Patient Risk Score Prediction System
Prototype: train and compare four classification models.

IMPORTANT:
- This is a research/demo prototype, not a clinically validated tool.
- Confirm how `adverse_event_90d` was created before interpreting metrics.
- Confirm all predictor values were available before the prediction/index date.
- Risk bands below (33% and 66%) are provisional demo thresholds, not clinical cutoffs.
- Original CSV files are read only; generated artifacts are saved to models/, outputs/, and reports/.
"""

from pathlib import Path
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42
TEST_SIZE = 0.20
TARGET_COLUMN = "adverse_event_90d"
PATIENT_ID_COLUMN = "patient_id"

# Provisional demo bands only; must be validated for real use.
LOW_RISK_MAX = 1 / 3
MEDIUM_RISK_MAX = 2 / 3

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
REPORTS_DIR = PROJECT_ROOT / "reports"

CLAIMS_FILE = "healthcare_claims.csv"
EHR_FILE = "EHR_Patientlevel_features.csv"
SDOH_FILE = "Social Determinants of Health DataSet.csv"
BEHAVIORAL_FILE = "Behavioral and lifestyle data.csv"

# Exclude fields that could directly encode or reveal the target.
LEAKAGE_COLUMNS = {
    "risk_score",
    "risk_category",
    "adverse_event_type",
}

# These columns represent dates and are not used as raw predictors in this prototype.
DATE_COLUMNS = {
    "date_of_service",
    "last_encounter_datetime",
    "first_encounter_datetime",
}


def load_datasets():
    """Load the four source datasets without changing the original files."""
    paths = {
        "claims": DATA_DIR / CLAIMS_FILE,
        "ehr": DATA_DIR / EHR_FILE,
        "sdoh": DATA_DIR / SDOH_FILE,
        "behavioral": DATA_DIR / BEHAVIORAL_FILE,
    }

    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "The following files were not found. Keep the filenames unchanged "
            f"and place them inside {DATA_DIR}:\n- " + "\n- ".join(missing)
        )

    datasets = {name: pd.read_csv(path, low_memory=False) for name, path in paths.items()}

    for name, df in datasets.items():
        if PATIENT_ID_COLUMN not in df.columns:
            raise ValueError(f"{name} dataset is missing '{PATIENT_ID_COLUMN}'.")

        # Treat identifiers as strings to avoid formatting/precision problems.
        df[PATIENT_ID_COLUMN] = df[PATIENT_ID_COLUMN].astype("string").str.strip()

        if df[PATIENT_ID_COLUMN].isna().any() or (df[PATIENT_ID_COLUMN] == "").any():
            raise ValueError(f"{name} dataset contains missing/blank patient IDs.")

        if df[PATIENT_ID_COLUMN].duplicated().any():
            duplicates = int(df[PATIENT_ID_COLUMN].duplicated().sum())
            raise ValueError(
                f"{name} dataset has {duplicates} repeated patient_id values. "
                "This script expects one row per patient in each source. "
                "Aggregate repeated rows intentionally before continuing."
            )

        print(f"[LOADED] {name}: {df.shape[0]:,} rows x {df.shape[1]:,} columns")

    return datasets


def merge_patient_datasets(datasets):
    """Merge one-row-per-patient datasets and verify identifier coverage."""
    id_sets = {
        name: set(df[PATIENT_ID_COLUMN].dropna().astype(str))
        for name, df in datasets.items()
    }
    reference_name = "claims"
    reference_ids = id_sets[reference_name]

    for name, ids in id_sets.items():
        if ids != reference_ids:
            missing_ids = len(reference_ids - ids)
            extra_ids = len(ids - reference_ids)
            raise ValueError(
                f"Patient IDs in '{name}' do not exactly match '{reference_name}'. "
                f"Missing relative to claims: {missing_ids}; extra: {extra_ids}. "
                "Do not guess mappings. Resolve patient linkage before training."
            )

    merged = datasets["claims"].merge(
        datasets["ehr"], on=PATIENT_ID_COLUMN, how="inner",
        suffixes=("", "_ehr"), validate="one_to_one"
    )
    merged = merged.merge(
        datasets["behavioral"], on=PATIENT_ID_COLUMN, how="inner",
        suffixes=("", "_behavioral"), validate="one_to_one"
    )
    merged = merged.merge(
        datasets["sdoh"], on=PATIENT_ID_COLUMN, how="inner",
        suffixes=("", "_sdoh"), validate="one_to_one"
    )

    if len(merged) != len(reference_ids):
        raise ValueError(
            "Merged row count differs from the expected patient count. "
            "Stop and inspect the join before training."
        )

    print(f"\n[MERGED] {len(merged):,} unique patients; patient_id joins validated.")
    return merged


def build_features(merged):
    """Separate the target and remove identifiers, date strings, and target-derived fields."""
    if TARGET_COLUMN not in merged.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' was not found in the merged data.")

    y = pd.to_numeric(merged[TARGET_COLUMN], errors="coerce")
    valid_target = y.isin([0, 1])
    if not valid_target.all():
        invalid_count = int((~valid_target).sum())
        warnings.warn(
            f"Dropping {invalid_count} rows with missing/invalid {TARGET_COLUMN}.",
            stacklevel=2,
        )
        merged = merged.loc[valid_target].copy()
        y = y.loc[valid_target].astype(int)
    else:
        y = y.astype(int)

    if y.nunique() != 2:
        raise ValueError(f"'{TARGET_COLUMN}' must contain both 0 and 1 classes.")

    drop_columns = {
        PATIENT_ID_COLUMN,
        TARGET_COLUMN,
        *LEAKAGE_COLUMNS,
        *DATE_COLUMNS,
    }
    X = merged.drop(columns=[c for c in drop_columns if c in merged.columns]).copy()

    # Convert boolean columns to integer values.
    for column in X.select_dtypes(include=["bool"]).columns:
        X[column] = X[column].astype("int64")

    # Try to parse numeric-looking object columns only when all non-missing values parse.
    for column in X.select_dtypes(include=["object", "string"]).columns:
        converted = pd.to_numeric(X[column], errors="coerce")
        non_missing_original = X[column].notna().sum()
        if non_missing_original > 0 and converted.notna().sum() == non_missing_original:
            X[column] = converted

    # The wearable blood pressure column can be a text pair like "120/82".
    # Derive two numeric columns; preserve the original raw column in source data.
    bp_column = "Blood Pressure"
    if bp_column in X.columns:
        bp_parts = X[bp_column].astype("string").str.extract(
            r"^\s*(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)\s*$"
        )
        X["wearable_systolic_bp"] = pd.to_numeric(bp_parts[0], errors="coerce")
        X["wearable_diastolic_bp"] = pd.to_numeric(bp_parts[1], errors="coerce")
        X = X.drop(columns=[bp_column])

    # Ensure the target has enough positive and negative cases for a stratified split.
    class_counts = y.value_counts()
    if class_counts.min() < 2:
        raise ValueError("At least two records per target class are needed for a stratified split.")

    return X, y, merged.loc[X.index, PATIENT_ID_COLUMN].astype(str)


def build_preprocessor(X):
    """Build preprocessing inside the model pipeline to avoid train/test leakage."""
    categorical_columns = X.select_dtypes(include=["object", "string", "category"]).columns.tolist()
    numeric_columns = [column for column in X.columns if column not in categorical_columns]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_columns),
            ("categorical", categorical_pipeline, categorical_columns),
        ],
        remainder="drop",
    )
    return preprocessor


def get_models():
    """Return the four requested model candidates, where installed."""
    models = {
        "logistic_regression": LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=400,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }

    try:
        from xgboost import XGBClassifier

        models["xgboost"] = XGBClassifier(
            n_estimators=400,
            max_depth=3,
            learning_rate=0.03,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=2.0,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    except ImportError:
        warnings.warn("xgboost is not installed; skipping XGBoost.")

    try:
        from lightgbm import LGBMClassifier

        models["lightgbm"] = LGBMClassifier(
            n_estimators=400,
            learning_rate=0.03,
            num_leaves=15,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            verbosity=-1,
        )
    except ImportError:
        warnings.warn("lightgbm is not installed; skipping LightGBM.")

    return models


def assign_risk_category(probability):
    """Assign provisional demo risk bands from predicted probability."""
    if probability < LOW_RISK_MAX:
        return "Low"
    if probability < MEDIUM_RISK_MAX:
        return "Medium"
    return "High"


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 68)
    print("AI PATIENT RISK SCORE PREDICTION SYSTEM")
    print("Four-model prototype: Logistic Regression, Random Forest, XGBoost, LightGBM")
    print("=" * 68)

    datasets = load_datasets()
    merged = merge_patient_datasets(datasets)

    # Save a copy of the integrated table for auditability; source CSVs are untouched.
    merged.to_csv(OUTPUTS_DIR / "merged_patient_data.csv", index=False)

    X, y, patient_ids = build_features(merged)
    print(f"\nTarget: {TARGET_COLUMN}")
    print(f"Eligible patients: {len(y):,}")
    print(f"Positive labels: {(y == 1).sum():,} ({(y == 1).mean():.1%})")
    print(f"Negative labels: {(y == 0).sum():,} ({(y == 0).mean():.1%})")
    print(f"Predictor columns before encoding: {X.shape[1]}")

    # Split patient rows before fitting imputers/encoders/scalers.
    train_indices, test_indices = train_test_split(
        np.arange(len(y)),
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
    y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]
    ids_test = patient_ids.iloc[test_indices]

    model_candidates = get_models()
    metrics_rows = []
    fitted_models = {}
    prediction_columns = {
        "patient_id": ids_test.to_numpy(),
        "actual_adverse_event_90d": y_test.to_numpy(),
    }

    for model_name, estimator in model_candidates.items():
        print(f"\n{'-' * 58}\nTraining: {model_name}")

        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor(X_train)),
                ("model", estimator),
            ]
        )
        pipeline.fit(X_train, y_train)

        predicted = pipeline.predict(X_test)
        probabilities = pipeline.predict_proba(X_test)[:, 1]

        metrics = {
            "model": model_name,
            "accuracy": accuracy_score(y_test, predicted),
            "precision": precision_score(y_test, predicted, zero_division=0),
            "recall": recall_score(y_test, predicted, zero_division=0),
            "f1_score": f1_score(y_test, predicted, zero_division=0),
            "roc_auc": roc_auc_score(y_test, probabilities),
            "pr_auc_average_precision": average_precision_score(y_test, probabilities),
        }
        metrics_rows.append(metrics)
        fitted_models[model_name] = pipeline
        prediction_columns[f"{model_name}_probability"] = probabilities
        prediction_columns[f"{model_name}_predicted_label"] = predicted

        print(pd.Series(metrics).to_string())
        print("\nConfusion matrix [ [TN, FP], [FN, TP] ]:")
        print(confusion_matrix(y_test, predicted, labels=[0, 1]))
        print("\nClassification report:")
        print(classification_report(y_test, predicted, zero_division=0))

    metrics_df = pd.DataFrame(metrics_rows).sort_values(
        by="pr_auc_average_precision", ascending=False
    )
    metrics_df.to_csv(REPORTS_DIR / "model_metrics.csv", index=False)

    # Select by PR-AUC because the positive class may be relatively uncommon.
    best_model_name = str(metrics_df.iloc[0]["model"])
    best_model = fitted_models[best_model_name]
    joblib.dump(best_model, MODELS_DIR / "best_model.joblib")

    # Also save all candidate pipelines for reproducible comparisons.
    for model_name, pipeline in fitted_models.items():
        joblib.dump(pipeline, MODELS_DIR / f"{model_name}_model.joblib")

    best_probability = prediction_columns[f"{best_model_name}_probability"]
    best_label = prediction_columns[f"{best_model_name}_predicted_label"]

    predictions = pd.DataFrame(prediction_columns)
    predictions["best_model"] = best_model_name
    predictions["predicted_risk_probability"] = best_probability
    predictions["predicted_risk_score"] = np.round(best_probability * 100, 2)
    predictions["predicted_risk_category"] = [
        assign_risk_category(float(p)) for p in best_probability
    ]
    predictions["predicted_adverse_event_90d"] = best_label
    predictions.to_csv(OUTPUTS_DIR / "patient_risk_predictions.csv", index=False)

    with open(REPORTS_DIR / "best_model_summary.txt", "w", encoding="utf-8") as file:
        file.write(f"Selected model by held-out PR-AUC: {best_model_name}\n")
        file.write(f"Target: {TARGET_COLUMN}\n")
        file.write(f"Random state: {RANDOM_STATE}\n")
        file.write(f"Test size: {TEST_SIZE:.0%}\n")
        file.write(
            "Risk categories: Low < 33.33%; Medium 33.33% to < 66.67%; "
            "High >= 66.67% (provisional demo thresholds, not clinical cutoffs).\n"
        )
        file.write(
            "Before interpreting results, verify target provenance, observation windows, "
            "and absence of temporal/label leakage.\n"
        )

    print("\n" + "=" * 68)
    print("MODEL COMPARISON (sorted by PR-AUC)")
    print(metrics_df.to_string(index=False))
    print(f"\nSelected candidate: {best_model_name}")
    print(f"Metrics: {REPORTS_DIR / 'model_metrics.csv'}")
    print(f"Predictions: {OUTPUTS_DIR / 'patient_risk_predictions.csv'}")
    print(f"Saved models: {MODELS_DIR}")
    print("\nPrototype run completed.")
    print(
        "Reminder: model metrics are only meaningful if target labels and feature "
        "time windows are valid. Risk categories are provisional demonstration bands."
    )


if __name__ == "__main__":
    main()
