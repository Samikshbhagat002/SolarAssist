import json
import joblib
import pandas as pd
import shap

from pathlib import Path


# =========================================================
# SolarSmart - SHAP Explainability
# Capacity Recommendation Model
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_FILE = (
    BASE_DIR
    / "ml"
    / "models"
    / "model_capacity.pkl"
)

FEATURE_FILE = (
    BASE_DIR
    / "ml"
    / "models"
    / "capacity_features.json"
)

DATA_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_capacity_training_dataset.csv"
)

RESULT_DIR = (
    BASE_DIR
    / "ml"
    / "results"
)

RESULT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# Load model
# =========================================================

model = joblib.load(MODEL_FILE)

with open(
    FEATURE_FILE,
    "r",
    encoding="utf-8"
) as f:
    metadata = json.load(f)

features = metadata["features"]


# =========================================================
# Load data
# =========================================================

df = pd.read_csv(DATA_FILE)

X = df[features].copy()


print("SolarSmart - Capacity SHAP Explainability")
print("=" * 60)

print(f"Model: {metadata['model']}")
print(f"Features: {features}")
print(f"Rows: {len(X)}")


# =========================================================
# SHAP TreeExplainer
# =========================================================

explainer = shap.TreeExplainer(model)

shap_values = explainer.shap_values(X)


# =========================================================
# Global SHAP importance
# =========================================================

mean_abs_shap = abs(shap_values).mean(axis=0)

importance_df = pd.DataFrame(
    {
        "feature": features,
        "mean_abs_shap": mean_abs_shap
    }
)

importance_df = importance_df.sort_values(
    by="mean_abs_shap",
    ascending=False
)

importance_file = (
    RESULT_DIR
    / "capacity_shap_feature_importance.csv"
)

importance_df.to_csv(
    importance_file,
    index=False
)


# =========================================================
# Save individual SHAP values
# =========================================================

shap_df = pd.DataFrame(
    shap_values,
    columns=features
)

shap_df.insert(
    0,
    "row_id",
    range(len(shap_df))
)

shap_file = (
    RESULT_DIR
    / "capacity_shap_values.csv"
)

shap_df.to_csv(
    shap_file,
    index=False
)


# =========================================================
# Save summary JSON
# =========================================================

summary = {
    "model": metadata["model"],
    "features": features,
    "label_source": metadata.get(
        "label_source",
        "method_derived"
    ),
    "global_importance": [
        {
            "feature": row["feature"],
            "mean_abs_shap": float(
                row["mean_abs_shap"]
            )
        }
        for _, row in importance_df.iterrows()
    ]
}

summary_file = (
    RESULT_DIR
    / "capacity_shap_summary.json"
)

with open(
    summary_file,
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        summary,
        f,
        indent=4
    )


# =========================================================
# Print results
# =========================================================

print()
print("Global SHAP Feature Importance")
print("-" * 60)

for _, row in importance_df.iterrows():

    print(
        f"{row['feature']:<35} "
        f"{row['mean_abs_shap']:.6f}"
    )


print()
print("=" * 60)
print("SHAP analysis completed successfully.")

print()
print(f"Saved:")
print(importance_file)
print(shap_file)
print(summary_file)