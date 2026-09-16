import json
from pathlib import Path

import joblib
import pandas as pd
import shap


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = BASE_DIR / "ml" / "models" / "model_generation.pkl"
FEATURES_PATH = BASE_DIR / "ml" / "models" / "generation_features.json"
DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_UNISOLAR_monthly_ml_dataset.csv"
)

RESULTS_DIR = BASE_DIR / "ml" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

SHAP_VALUES_PATH = RESULTS_DIR / "generation_shap_values.csv"
SHAP_IMPORTANCE_PATH = RESULTS_DIR / "generation_shap_feature_importance.csv"
SHAP_SUMMARY_PATH = RESULTS_DIR / "generation_shap_summary.json"


# ---------------------------------------------------------
# Load frozen model
# ---------------------------------------------------------
print("Loading frozen generation model...")
model = joblib.load(MODEL_PATH)

print("Loading feature configuration...")
with open(FEATURES_PATH, "r", encoding="utf-8") as f:
    feature_config = json.load(f)


# ---------------------------------------------------------
# Read exact features used during training
# ---------------------------------------------------------
if isinstance(feature_config, dict):
    FEATURES = feature_config.get("features")

    if FEATURES is None:
        FEATURES = feature_config.get("feature_names")

    if FEATURES is None:
        raise ValueError(
            "Could not find 'features' or 'feature_names' "
            "in generation_features.json."
        )
else:
    FEATURES = feature_config

if not isinstance(FEATURES, list) or not FEATURES:
    raise ValueError("Feature list is empty or invalid.")

print(f"Features: {FEATURES}")


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------
print("Loading ML dataset...")
df = pd.read_csv(DATA_PATH)

missing_features = [
    col for col in FEATURES
    if col not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing feature columns in dataset: {missing_features}"
    )

X = df[FEATURES].copy()


# ---------------------------------------------------------
# Check missing values
# ---------------------------------------------------------
if X.isnull().any().any():
    missing_counts = X.isnull().sum()
    missing_counts = missing_counts[missing_counts > 0]

    raise ValueError(
        "Selected SHAP features contain missing values:\n"
        f"{missing_counts.to_dict()}"
    )


# ---------------------------------------------------------
# Calculate SHAP values
# ---------------------------------------------------------
print("Calculating SHAP values...")

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

if hasattr(shap_values, "values"):
    shap_values = shap_values.values

shap_values = pd.DataFrame(
    shap_values,
    columns=FEATURES,
    index=X.index,
)


# ---------------------------------------------------------
# Save row-level SHAP values
# ---------------------------------------------------------
shap_output = shap_values.copy()

if "SiteKey" in df.columns:
    shap_output.insert(
        0,
        "SiteKey",
        df.loc[X.index, "SiteKey"].values
    )

if "Year" in df.columns:
    shap_output.insert(
        1,
        "Year",
        df.loc[X.index, "Year"].values
    )

if "MonthNum" in df.columns:
    shap_output.insert(
        2,
        "MonthNum",
        df.loc[X.index, "MonthNum"].values
    )

if "monthly_generation_kwh" in df.columns:
    shap_output["actual_monthly_generation_kwh"] = df.loc[
        X.index,
        "monthly_generation_kwh"
    ].values

shap_output.to_csv(
    SHAP_VALUES_PATH,
    index=False
)


# ---------------------------------------------------------
# Global SHAP feature importance
# ---------------------------------------------------------
importance = pd.DataFrame(
    {
        "feature": FEATURES,
        "mean_absolute_shap": (
            shap_values.abs().mean().values
        ),
    }
)

importance = importance.sort_values(
    "mean_absolute_shap",
    ascending=False
).reset_index(drop=True)

importance["rank"] = range(
    1,
    len(importance) + 1
)

importance.to_csv(
    SHAP_IMPORTANCE_PATH,
    index=False
)


# ---------------------------------------------------------
# SHAP summary information
# ---------------------------------------------------------
base_value = explainer.expected_value

if hasattr(base_value, "item"):
    base_value = base_value.item()

if isinstance(base_value, (list, tuple)):
    if len(base_value) == 1:
        base_value = base_value[0]

summary = {
    "model": "XGBoost",
    "task": "Monthly solar generation prediction",
    "rows_explained": int(len(X)),
    "features_explained": FEATURES,
    "base_value": base_value,
    "global_feature_importance": importance[
        [
            "rank",
            "feature",
            "mean_absolute_shap"
        ]
    ].to_dict(orient="records"),
}

with open(
    SHAP_SUMMARY_PATH,
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        summary,
        f,
        indent=2
    )


# ---------------------------------------------------------
# Final output
# ---------------------------------------------------------
print("\nSHAP analysis completed successfully.")

print("\nGlobal SHAP feature importance:")

print(
    importance[
        [
            "rank",
            "feature",
            "mean_absolute_shap"
        ]
    ].to_string(index=False)
)

print("\nCreated files:")
print(f"1. {SHAP_VALUES_PATH}")
print(f"2. {SHAP_IMPORTANCE_PATH}")
print(f"3. {SHAP_SUMMARY_PATH}")