"""
Interactive Patient Risk Prediction Website
Run after training: streamlit run app.py

Requires:
- train_models.py
- models/best_model.joblib
- outputs/merged_patient_data.csv
- The original datasets under data/ if merged data has not been generated yet.

Prototype only. Not for clinical decision-making.
"""

from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

from train_models import (
    PATIENT_ID_COLUMN,
    TARGET_COLUMN,
    LOW_RISK_MAX,
    MEDIUM_RISK_MAX,
    build_features,
)

PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_ROOT / "models" / "best_model.joblib"
MERGED_DATA_PATH = PROJECT_ROOT / "outputs" / "merged_patient_data.csv"

st.set_page_config(
    page_title="Patient Risk Prediction",
    page_icon="🩺",
    layout="centered",
)

st.markdown(
    """
    <style>
      .main .block-container {max-width: 900px; padding-top: 2rem; padding-bottom: 3rem;}
      .hero {
        padding: 1.6rem 1.8rem; border-radius: 18px;
        background: linear-gradient(135deg, #0f2d45, #176b72);
        color: white; margin-bottom: 1.2rem;
      }
      .hero h1 {color: white; margin: 0 0 .45rem 0; font-size: 2rem;}
      .hero p {color: #e5f4f4; margin: 0; font-size: 1rem;}
      .small-note {font-size: .88rem; color: #64748b;}
      div[data-testid="stMetric"] {
        border: 1px solid rgba(128,128,128,.25);
        padding: 1rem; border-radius: 14px;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="hero">
      <h1>Patient Risk Prediction</h1>
      <p>Enter a patient ID to estimate the probability of an adverse event
      within 90 days and view the corresponding risk category.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.warning(
    "Prototype only — this output is not a diagnosis or a clinically validated "
    "risk assessment. Use only with authorized data and after validating the "
    "target labels, patient linkage, and prediction time window."
)


@st.cache_resource
def load_model():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}. Run `python train_models.py` first."
        )
    return joblib.load(MODEL_PATH)


@st.cache_data
def load_patient_features():
    if not MERGED_DATA_PATH.is_file():
        raise FileNotFoundError(
            f"Integrated data not found: {MERGED_DATA_PATH}. "
            "Run `python train_models.py` first to create it."
        )

    merged = pd.read_csv(MERGED_DATA_PATH, low_memory=False)
    if PATIENT_ID_COLUMN not in merged.columns:
        raise ValueError(f"'{PATIENT_ID_COLUMN}' is missing from the integrated data.")

    merged[PATIENT_ID_COLUMN] = merged[PATIENT_ID_COLUMN].astype("string").str.strip()

    # Reuse the same feature-preparation logic as training so the model receives
    # the same columns and transformations at prediction time.
    X, y, patient_ids = build_features(merged)
    return merged, X, y, patient_ids


try:
    model = load_model()
    merged, X, y, patient_ids = load_patient_features()
except Exception as exc:
    st.error(str(exc))
    st.info(
        "Check that the project contains train_models.py, the four CSV files, "
        "and that model training completed successfully."
    )
    st.stop()

# Keep the patient ID lookup separate from model predictors.
patient_lookup = pd.DataFrame(
    {
        PATIENT_ID_COLUMN: patient_ids.astype(str).to_numpy(),
        "feature_row": X.index.to_numpy(),
    }
).drop_duplicates(subset=[PATIENT_ID_COLUMN])

st.caption(
    f"Loaded {len(patient_lookup):,} patients from the integrated dataset. "
    "Patient IDs are used only for lookup, never as model features."
)

with st.form("patient_lookup_form"):
    entered_id = st.text_input(
        "Patient ID",
        placeholder="Enter the exact patient_id",
        help="Use the patient_id exactly as it appears in the source datasets.",
    ).strip()
    submitted = st.form_submit_button("Calculate risk", type="primary", use_container_width=True)

if submitted:
    if not entered_id:
        st.error("Please enter a patient ID.")
    else:
        match = patient_lookup.loc[patient_lookup[PATIENT_ID_COLUMN] == entered_id]

        if match.empty:
            st.error(
                "Patient ID was not found in the integrated prediction dataset. "
                "Check the ID and confirm that all four datasets were linked correctly."
            )
        else:
            feature_index = int(match.iloc[0]["feature_row"])
            patient_features = X.loc[[feature_index]]

            try:
                probability = float(model.predict_proba(patient_features)[0, 1])
            except Exception as exc:
                st.error(f"Prediction failed: {exc}")
                st.stop()

            risk_score = probability * 100
            if probability < LOW_RISK_MAX:
                category = "Low"
                explanation = "The model estimates a lower probability within the defined 90-day outcome window."
            elif probability < MEDIUM_RISK_MAX:
                category = "Medium"
                explanation = "The model estimates an intermediate probability within the defined 90-day outcome window."
            else:
                category = "High"
                explanation = "The model estimates a higher probability within the defined 90-day outcome window."

            st.divider()
            st.subheader("Prediction result")

            col1, col2 = st.columns(2)
            col1.metric("Predicted risk score", f"{risk_score:.1f} / 100")
            col2.metric("Estimated 90-day event probability", f"{probability:.1%}")

            if category == "Low":
                st.success(f"Risk category: {category}")
            elif category == "Medium":
                st.warning(f"Risk category: {category}")
            else:
                st.error(f"Risk category: {category}")

            st.write(explanation)

            # Display actual label for transparency in this dataset prototype.
            actual_row = merged.loc[
                merged[PATIENT_ID_COLUMN].astype("string").str.strip() == entered_id
            ]
            if not actual_row.empty and TARGET_COLUMN in actual_row.columns:
                actual_value = pd.to_numeric(
                    actual_row.iloc[0][TARGET_COLUMN], errors="coerce"
                )
                if pd.notna(actual_value):
                    st.caption(
                        "Prototype transparency: this patient's existing target label "
                        f"in the dataset is {int(actual_value)}. This is shown for "
                        "evaluation only and is not used as an input to the prediction."
                    )

            st.markdown("#### How to interpret this result")
            st.write(
                "The score is the selected model's predicted probability multiplied "
                "by 100. The Low/Medium/High bands (below 33.33%, 33.33% to below "
                "66.67%, and 66.67% or above) are provisional demonstration thresholds, "
                "not clinically validated cutoffs."
            )

            st.caption(
                "Important evaluation limitation: if this patient was included in "
                "the model's training split, this is not an independent test prediction. "
                "For a fair evaluation, use held-out test predictions or an external cohort."
            )

st.divider()
with st.expander("About this prototype"):
    st.write(
        "This website looks up a patient in the locally integrated dataset, "
        "prepares the predictors using the same feature-preparation function as "
        "training, and loads models/best_model.joblib to estimate adverse_event_90d."
    )
    st.write(
        "Do not expose this app publicly or enter identifiable patient data into "
        "an unapproved environment. Validate the outcome definition, time windows, "
        "calibration, and clinical utility before any real-world use."
    )
