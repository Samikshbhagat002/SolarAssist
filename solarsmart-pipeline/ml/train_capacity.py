import json
import joblib
import pandas as pd

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor


# =========================================================
# SolarSmart - Capacity Recommendation Model
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_capacity_training_dataset.csv"
)

MODEL_DIR = BASE_DIR / "ml" / "models"
RESULT_DIR = BASE_DIR / "ml" / "results"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# Load dataset
# =========================================================

df = pd.read_csv(DATA_FILE)

print("SolarSmart - Capacity Recommendation Model")
print("=" * 60)
print(f"Rows loaded: {len(df)}")
print(f"Columns: {len(df.columns)}")


# =========================================================
# Features and target
# =========================================================

FEATURES = [
    "monthly_consumption_kwh",
    "future_usage_growth_pct"
]

TARGET = "recommended_capacity_kw"

X = df[FEATURES].copy()
y = df[TARGET].copy()


# =========================================================
# Train/test split
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print(f"Training rows: {len(X_train)}")
print(f"Testing rows: {len(X_test)}")


# =========================================================
# Models
# =========================================================

models = {

    "Decision Tree": DecisionTreeRegressor(
        max_depth=8,
        random_state=42
    ),

    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=3,
        random_state=42
    ),

    "XGBoost": XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1
    )
}


# =========================================================
# Train + evaluate
# =========================================================

results = []
trained_models = {}

for name, model in models.items():

    print()
    print(f"Training {name}...")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions
    )

    results.append(
        {
            "model": name,
            "MAE_kW": mae,
            "RMSE_kW": rmse,
            "R2": r2
        }
    )

    trained_models[name] = model

    print(f"MAE  : {mae:.4f} kW")
    print(f"RMSE : {rmse:.4f} kW")
    print(f"R²   : {r2:.4f}")


# =========================================================
# Comparison table
# =========================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="RMSE_kW"
)

comparison_file = (
    RESULT_DIR
    / "capacity_model_comparison.csv"
)

results_df.to_csv(
    comparison_file,
    index=False
)


# =========================================================
# Select best model
# =========================================================

best_model_name = results_df.iloc[0]["model"]

best_model = trained_models[
    best_model_name
]

model_file = (
    MODEL_DIR
    / "model_capacity.pkl"
)

joblib.dump(
    best_model,
    model_file
)


# =========================================================
# Save feature metadata
# =========================================================

feature_file = (
    MODEL_DIR
    / "capacity_features.json"
)

with open(
    feature_file,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        {
            "features": FEATURES,
            "target": TARGET,
            "model": best_model_name,
            "label_source": "method_derived"
        },
        f,
        indent=4
    )


# =========================================================
# Feature importance
# =========================================================

importance_df = pd.DataFrame(
    {
        "feature": FEATURES,
        "importance": best_model.feature_importances_
    }
)

importance_df = importance_df.sort_values(
    by="importance",
    ascending=False
)

importance_file = (
    RESULT_DIR
    / "capacity_feature_importance.csv"
)

importance_df.to_csv(
    importance_file,
    index=False
)


# =========================================================
# Final output
# =========================================================

print()
print("=" * 60)
print("MODEL COMPARISON")
print("=" * 60)

print(
    results_df.to_string(
        index=False
    )
)

print()
print(f"Best model: {best_model_name}")

print()
print(f"Saved model:")
print(model_file)

print()
print(f"Saved comparison:")
print(comparison_file)

print()
print(f"Saved features:")
print(feature_file)

print()
print(f"Saved feature importance:")
print(importance_file)

print()
print("=" * 60)
print("Capacity model training completed successfully.")