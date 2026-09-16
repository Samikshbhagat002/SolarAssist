# ============================================================
# SolarSmart - Solar Generation ML Model
# Improved Training Pipeline with TimeSeriesSplit Cross-Validation
# ============================================================

from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.dummy import DummyRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor
)
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True

except ImportError:
    XGBOOST_AVAILABLE = False


warnings.filterwarnings("ignore")


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "SolarSmart_UNISOLAR_monthly_ml_dataset.csv"
)

MODEL_DIR = (
    PROJECT_ROOT
    / "ml"
    / "models"
)

RESULTS_DIR = (
    PROJECT_ROOT
    / "ml"
    / "results"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# METRIC FUNCTIONS
# ============================================================

def calculate_mape(y_true, y_pred):
    """
    Mean Absolute Percentage Error.

    Rows where the actual value is zero are ignored
    to avoid division by zero.
    """

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    non_zero_mask = y_true != 0

    if non_zero_mask.sum() == 0:
        return np.nan

    percentage_errors = np.abs(
        (
            y_true[non_zero_mask]
            - y_pred[non_zero_mask]
        )
        /
        y_true[non_zero_mask]
    )

    return np.mean(
        percentage_errors
    ) * 100


def calculate_smape(y_true, y_pred):
    """
    Symmetric Mean Absolute Percentage Error.
    """

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    denominator = (
        np.abs(y_true)
        + np.abs(y_pred)
    )

    valid_mask = denominator != 0

    if valid_mask.sum() == 0:
        return np.nan

    smape = np.mean(
        2
        *
        np.abs(
            y_pred[valid_mask]
            - y_true[valid_mask]
        )
        /
        denominator[valid_mask]
    )

    return smape * 100


def calculate_metrics(y_true, y_pred):
    """
    Calculate all regression evaluation metrics.
    """

    mae = mean_absolute_error(
        y_true,
        y_pred
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_true,
            y_pred
        )
    )

    r2 = r2_score(
        y_true,
        y_pred
    )

    mape = calculate_mape(
        y_true,
        y_pred
    )

    smape = calculate_smape(
        y_true,
        y_pred
    )

    return {
        "MAE_kWh": mae,
        "RMSE_kWh": rmse,
        "R2": r2,
        "MAPE_percent": mape,
        "sMAPE_percent": smape
    }


# ============================================================
# START
# ============================================================

print("=" * 70)
print("SolarSmart - Solar Generation ML Training")
print("TimeSeriesSplit Cross-Validation")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

print("\n[1] Loading dataset...")
print(f"Dataset: {DATA_PATH}")


if not DATA_PATH.exists():

    raise FileNotFoundError(
        f"\nDataset not found:\n{DATA_PATH}\n"
        "Check that the CSV exists inside data/processed/"
    )


df = pd.read_csv(
    DATA_PATH
)


print(f"Rows loaded    : {len(df)}")
print(f"Columns loaded : {len(df.columns)}")


# ============================================================
# REQUIRED COLUMNS
# ============================================================

print("\n[2] Validating dataset...")


required_columns = [

    "SiteKey",

    "Year",

    "MonthNum",

    "kWp",

    "monthly_generation_kwh",

    "air_temperature_mean_c",

    "apparent_temperature_mean_c",

    "dew_point_mean_c",

    "relative_humidity_mean_pct",

    "month_sin",

    "month_cos"

]


missing_columns = [

    column

    for column in required_columns

    if column not in df.columns

]


if missing_columns:

    raise ValueError(

        "\nMissing required columns:\n"

        +

        "\n".join(

            f"  - {column}"

            for column in missing_columns

        )

    )


print("All required columns found.")


# ============================================================
# SORT DATA CHRONOLOGICALLY
# ============================================================

print("\n[3] Sorting data chronologically...")


df = (

    df

    .sort_values(

        [
            "Year",
            "MonthNum",
            "SiteKey"
        ]

    )

    .reset_index(
        drop=True
    )

)


# ============================================================
# TARGET VARIABLE
# ============================================================

TARGET = (
    "monthly_generation_kwh"
)


print("\n[4] Target variable:")
print(f"Target: {TARGET}")


print("\nTarget statistics:")

print(
    df[TARGET].describe()
)


# ============================================================
# FEATURE SELECTION
# ============================================================

print("\n[5] Selecting features...")


# ------------------------------------------------------------
# IMPORTANT NOTES
# ------------------------------------------------------------
#
# lat and Lon are excluded because this dataset contains only
# one location. Their values are constant and therefore provide
# no useful predictive information.
#
# generation_kwh_per_kwp is excluded because it is derived from
# the target:
#
# generation_kwh_per_kwp =
# monthly_generation_kwh / kWp
#
# Including it would cause target leakage.
#
# nonnull_generation_intervals is excluded because it describes
# the amount of observed data, not information available before
# future generation occurs.
#
# wind_speed_mean is excluded because it contains missing values.
#
# SiteKey is excluded because it acts as an identifier and could
# encourage the model to memorize individual sites.
#
# Year and MonthNum are not directly used because seasonal
# information is represented using cyclic features:
#
# month_sin
# month_cos
#
# ------------------------------------------------------------


FEATURES = [

    "kWp",

    "air_temperature_mean_c",

    "apparent_temperature_mean_c",

    "dew_point_mean_c",

    "relative_humidity_mean_pct",

    "month_sin",

    "month_cos"

]


print("\nFeatures used:")

for feature in FEATURES:

    print(
        f"  - {feature}"
    )


print(
    f"\nNumber of features: {len(FEATURES)}"
)


# ============================================================
# CREATE FEATURE MATRIX
# ============================================================

X = (
    df[FEATURES]
    .copy()
)


y = (
    df[TARGET]
    .copy()
)


# ============================================================
# NUMERIC CONVERSION
# ============================================================

print("\n[6] Preparing numeric data...")


for column in FEATURES:

    X[column] = pd.to_numeric(

        X[column],

        errors="coerce"

    )


y = pd.to_numeric(

    y,

    errors="coerce"

)


# ============================================================
# REMOVE INVALID ROWS
# ============================================================

valid_rows = (

    X.notna()
    .all(axis=1)

    &

    y.notna()

)


removed_rows = (

    len(X)

    -

    valid_rows.sum()

)


X = (

    X.loc[valid_rows]

    .reset_index(
        drop=True
    )

)


y = (

    y.loc[valid_rows]

    .reset_index(
        drop=True
    )

)


df_model = (

    df.loc[valid_rows]

    .reset_index(
        drop=True
    )

)


print(
    f"Usable rows  : {len(X)}"
)


print(
    f"Removed rows : {removed_rows}"
)


if len(X) < 20:

    raise ValueError(

        "Too few usable rows for model training."

    )


# ============================================================
# TIME-BASED FINAL TRAIN / TEST SPLIT
# ============================================================

print("\n[7] Creating final time-based train/test split...")


unique_dates = (

    df_model[
        [
            "Year",
            "MonthNum"
        ]
    ]

    .drop_duplicates()

    .sort_values(
        [
            "Year",
            "MonthNum"
        ]
    )

    .reset_index(
        drop=True
    )

)


print(
    f"Unique months available: {len(unique_dates)}"
)


# Approximately 80% for training
# Final 20% is kept completely untouched.

split_index = int(

    len(unique_dates)
    *
    0.80

)


if (

    split_index <= 0

    or

    split_index >= len(unique_dates)

):

    raise ValueError(

        "Invalid train/test split."

    )


train_dates = (

    unique_dates.iloc[
        :split_index
    ]

)


test_dates = (

    unique_dates.iloc[
        split_index:
    ]

)


# ============================================================
# CREATE DATE KEYS
# ============================================================

train_keys = set(

    zip(

        train_dates["Year"],

        train_dates["MonthNum"]

    )

)


test_keys = set(

    zip(

        test_dates["Year"],

        test_dates["MonthNum"]

    )

)


# ============================================================
# CREATE TRAIN / TEST MASKS
# ============================================================

train_mask = [

    (year, month)

    in

    train_keys

    for year, month

    in zip(

        df_model["Year"],

        df_model["MonthNum"]

    )

]


test_mask = [

    (year, month)

    in

    test_keys

    for year, month

    in zip(

        df_model["Year"],

        df_model["MonthNum"]

    )

]


# ============================================================
# FINAL TRAIN / TEST DATA
# ============================================================

X_train = X.loc[
    train_mask
].reset_index(
    drop=True
)


X_test = X.loc[
    test_mask
].reset_index(
    drop=True
)


y_train = y.loc[
    train_mask
].reset_index(
    drop=True
)


y_test = y.loc[
    test_mask
].reset_index(
    drop=True
)


df_train = (

    df_model

    .loc[
        train_mask
    ]

    .reset_index(
        drop=True
    )

)


df_test = (

    df_model

    .loc[
        test_mask
    ]

    .reset_index(
        drop=True
    )

)


print()


print(
    f"Training rows : {len(X_train)}"
)


print(
    f"Testing rows  : {len(X_test)}"
)


print()


print(

    "Training period: "

    f"{int(train_dates.iloc[0]['Year'])}-"

    f"{int(train_dates.iloc[0]['MonthNum']):02d}"

    " -> "

    f"{int(train_dates.iloc[-1]['Year'])}-"

    f"{int(train_dates.iloc[-1]['MonthNum']):02d}"

)


print(

    "Testing period : "

    f"{int(test_dates.iloc[0]['Year'])}-"

    f"{int(test_dates.iloc[0]['MonthNum']):02d}"

    " -> "

    f"{int(test_dates.iloc[-1]['Year'])}-"

    f"{int(test_dates.iloc[-1]['MonthNum']):02d}"

)


if len(X_train) == 0:

    raise ValueError(
        "Training dataset is empty."
    )


if len(X_test) == 0:

    raise ValueError(
        "Testing dataset is empty."
    )


# ============================================================
# MODEL CREATION FUNCTION
# ============================================================

def create_models():

    models = {


        "Dummy Baseline":

            DummyRegressor(

                strategy="mean"

            ),


        "Decision Tree":

            DecisionTreeRegressor(

                max_depth=8,

                min_samples_leaf=2,

                random_state=42

            ),


        "Random Forest":

            RandomForestRegressor(

                n_estimators=300,

                max_features="sqrt",

                min_samples_leaf=2,

                random_state=42,

                n_jobs=-1

            ),


        "Gradient Boosting":

            GradientBoostingRegressor(

                n_estimators=300,

                learning_rate=0.05,

                max_depth=3,

                min_samples_leaf=2,

                random_state=42

            )

    }


    if XGBOOST_AVAILABLE:

        models["XGBoost"] = (

            XGBRegressor(

                n_estimators=300,

                learning_rate=0.05,

                max_depth=4,

                subsample=0.9,

                colsample_bytree=0.9,

                objective="reg:squarederror",

                random_state=42,

                n_jobs=-1

            )

        )


    return models


# ============================================================
# BASELINE INFORMATION
# ============================================================

print("\n[8] Creating baseline model...")

print(
    "DummyRegressor will predict the mean value "
    "of the training data."
)


# ============================================================
# MODEL INFORMATION
# ============================================================

print("\n[9] Creating machine learning models...")


if XGBOOST_AVAILABLE:

    print(
        "XGBoost: Available"
    )

else:

    print(
        "XGBoost: Not installed."
    )

    print(
        "Continuing without XGBoost."
    )


# ============================================================
# TIME SERIES CROSS VALIDATION
# ============================================================

print("\n[10] Starting TimeSeriesSplit Cross-Validation...")


# IMPORTANT:
#
# Cross-validation is performed ONLY on the final training data.
#
# The final test period remains untouched.
#
# This prevents the test set from influencing model selection.


N_SPLITS = 5


if len(X_train) <= N_SPLITS:

    raise ValueError(
        "Not enough training rows for TimeSeriesSplit."
    )


tscv = TimeSeriesSplit(

    n_splits=N_SPLITS

)


print(
    f"Number of CV folds: {N_SPLITS}"
)


print(
    "\nIMPORTANT:"
)


print(
    "Cross-validation uses only the training period."
)


print(
    "The final test period remains untouched."
)


# ============================================================
# CROSS VALIDATION RESULTS
# ============================================================

cv_results = []

cv_fold_results = []


models_for_cv = create_models()


for model_name in models_for_cv.keys():

    print("\n" + "-" * 70)

    print(
        f"Cross-validating: {model_name}"
    )

    print("-" * 70)


    fold_metrics = []


    for fold_number, (

        train_index,

        validation_index

    ) in enumerate(

        tscv.split(X_train),

        start=1

    ):


        X_cv_train = X_train.iloc[
            train_index
        ]


        X_cv_validation = X_train.iloc[
            validation_index
        ]


        y_cv_train = y_train.iloc[
            train_index
        ]


        y_cv_validation = y_train.iloc[
            validation_index
        ]


        # Create a fresh model for every fold

        fold_models = create_models()


        model = fold_models[
            model_name
        ]


        model.fit(

            X_cv_train,

            y_cv_train

        )


        predictions = model.predict(

            X_cv_validation

        )


        metrics = calculate_metrics(

            y_cv_validation,

            predictions

        )


        fold_metrics.append(
            metrics
        )


        cv_fold_results.append({

            "Model":

                model_name,


            "Fold":

                fold_number,


            "MAE_kWh":

                round(
                    metrics["MAE_kWh"],
                    4
                ),


            "RMSE_kWh":

                round(
                    metrics["RMSE_kWh"],
                    4
                ),


            "R2":

                round(
                    metrics["R2"],
                    4
                ),


            "MAPE_percent":

                round(
                    metrics["MAPE_percent"],
                    4
                ),


            "sMAPE_percent":

                round(
                    metrics["sMAPE_percent"],
                    4
                )

        })


        print(

            f"Fold {fold_number} | "

            f"RMSE: {metrics['RMSE_kWh']:.2f} kWh | "

            f"MAE: {metrics['MAE_kWh']:.2f} kWh | "

            f"R2: {metrics['R2']:.4f}"

        )


    # --------------------------------------------------------
    # AVERAGE CROSS VALIDATION METRICS
    # --------------------------------------------------------

    cv_mae_values = [

        metric["MAE_kWh"]

        for metric

        in fold_metrics

    ]


    cv_rmse_values = [

        metric["RMSE_kWh"]

        for metric

        in fold_metrics

    ]


    cv_r2_values = [

        metric["R2"]

        for metric

        in fold_metrics

    ]


    cv_mape_values = [

        metric["MAPE_percent"]

        for metric

        in fold_metrics

    ]


    cv_smape_values = [

        metric["sMAPE_percent"]

        for metric

        in fold_metrics

    ]


    cv_results.append({


        "Model":

            model_name,


        "CV_MAE_Mean_kWh":

            np.mean(
                cv_mae_values
            ),


        "CV_MAE_Std_kWh":

            np.std(
                cv_mae_values
            ),


        "CV_RMSE_Mean_kWh":

            np.mean(
                cv_rmse_values
            ),


        "CV_RMSE_Std_kWh":

            np.std(
                cv_rmse_values
            ),


        "CV_R2_Mean":

            np.mean(
                cv_r2_values
            ),


        "CV_R2_Std":

            np.std(
                cv_r2_values
            ),


        "CV_MAPE_Mean_percent":

            np.mean(
                cv_mape_values
            ),


        "CV_sMAPE_Mean_percent":

            np.mean(
                cv_smape_values
            )

    })


# ============================================================
# CROSS VALIDATION COMPARISON
# ============================================================

cv_results_df = pd.DataFrame(

    cv_results

)


cv_results_df = (

    cv_results_df

    .sort_values(

        by="CV_RMSE_Mean_kWh",

        ascending=True

    )

    .reset_index(
        drop=True
    )

)


print("\n" + "=" * 70)

print(
    "TIME SERIES CROSS-VALIDATION RESULTS"
)

print("=" * 70)


print(

    cv_results_df.to_string(

        index=False,

        float_format=lambda x: f"{x:.4f}"

    )

)


# ============================================================
# SELECT BEST MODEL FROM CV
# ============================================================

# Dummy Baseline is excluded from final model selection.

ml_cv_results_df = (

    cv_results_df[

        cv_results_df["Model"]

        !=

        "Dummy Baseline"

    ]

    .copy()

)


best_model_name = (

    ml_cv_results_df

    .iloc[0]

    ["Model"]

)


print("\n" + "=" * 70)

print(
    "BEST MODEL FROM CROSS-VALIDATION"
)

print("=" * 70)


print(

    f"Best model based on average CV RMSE: "

    f"{best_model_name}"

)


best_cv_rmse = (

    ml_cv_results_df

    .iloc[0]

    ["CV_RMSE_Mean_kWh"]

)


best_cv_rmse_std = (

    ml_cv_results_df

    .iloc[0]

    ["CV_RMSE_Std_kWh"]

)


print(

    f"Average CV RMSE: "

    f"{best_cv_rmse:.4f} kWh"

)


print(

    f"CV RMSE Std Dev: "

    f"{best_cv_rmse_std:.4f} kWh"

)


# ============================================================
# SAVE CROSS VALIDATION RESULTS
# ============================================================

print("\n[11] Saving cross-validation results...")


cv_results_path = (

    RESULTS_DIR

    / "generation_cross_validation_results.csv"

)


cv_results_df.to_csv(

    cv_results_path,

    index=False

)


cv_fold_results_df = pd.DataFrame(

    cv_fold_results

)


cv_fold_results_path = (

    RESULTS_DIR

    / "generation_cross_validation_folds.csv"

)


cv_fold_results_df.to_csv(

    cv_fold_results_path,

    index=False

)


print(
    f"CV summary saved: {cv_results_path}"
)


print(
    f"CV fold results saved: {cv_fold_results_path}"
)


# ============================================================
# FINAL TRAINING
# ============================================================

print("\n[12] Training selected model on full training period...")


final_models = create_models()


best_model = (

    final_models[

        best_model_name

    ]

)


best_model.fit(

    X_train,

    y_train

)


print(
    f"Final model trained: {best_model_name}"
)


# ============================================================
# FINAL TEST SET EVALUATION
# ============================================================

print("\n[13] Evaluating selected model on untouched test set...")


best_predictions = (

    best_model.predict(

        X_test

    )

)


final_metrics = calculate_metrics(

    y_test,

    best_predictions

)


print("\n" + "=" * 70)

print(
    "FINAL TEST SET PERFORMANCE"
)

print("=" * 70)


print(

    f"Model : {best_model_name}"

)


print(

    f"MAE   : "

    f"{final_metrics['MAE_kWh']:.4f} kWh"

)


print(

    f"RMSE  : "

    f"{final_metrics['RMSE_kWh']:.4f} kWh"

)


print(

    f"R2    : "

    f"{final_metrics['R2']:.4f}"

)


print(

    f"MAPE  : "

    f"{final_metrics['MAPE_percent']:.2f}%"

)


print(

    f"sMAPE : "

    f"{final_metrics['sMAPE_percent']:.2f}%"

)


# ============================================================
# FINAL MODEL COMPARISON ON TEST SET
# ============================================================

print("\n[14] Evaluating all models on final test set...")


final_test_results = []

trained_models = {}


all_models = create_models()


for name, model in all_models.items():


    print(
        f"\nTesting: {name}"
    )


    model.fit(

        X_train,

        y_train

    )


    predictions = model.predict(

        X_test

    )


    metrics = calculate_metrics(

        y_test,

        predictions

    )


    final_test_results.append({


        "Model":

            name,


        "MAE_kWh":

            round(
                metrics["MAE_kWh"],
                4
            ),


        "RMSE_kWh":

            round(
                metrics["RMSE_kWh"],
                4
            ),


        "R2":

            round(
                metrics["R2"],
                4
            ),


        "MAPE_percent":

            round(
                metrics["MAPE_percent"],
                4
            ),


        "sMAPE_percent":

            round(
                metrics["sMAPE_percent"],
                4
            )

    })


    trained_models[name] = model


final_test_results_df = pd.DataFrame(

    final_test_results

)


final_test_results_df = (

    final_test_results_df

    .sort_values(

        by="RMSE_kWh",

        ascending=True

    )

    .reset_index(
        drop=True
    )

)


print("\n" + "=" * 70)

print(
    "FINAL TEST SET MODEL COMPARISON"
)

print("=" * 70)


print(

    final_test_results_df.to_string(

        index=False

    )

)


# ============================================================
# COMPARE SELECTED MODEL AGAINST BASELINE
# ============================================================

baseline_row = (

    final_test_results_df[

        final_test_results_df["Model"]

        ==

        "Dummy Baseline"

    ]

)


baseline_rmse = (

    baseline_row

    .iloc[0]

    ["RMSE_kWh"]

)


best_final_rmse = (

    final_metrics

    ["RMSE_kWh"]

)


improvement_percent = (

    (
        baseline_rmse

        -

        best_final_rmse
    )

    /

    baseline_rmse

) * 100


print("\n" + "=" * 70)

print(
    "SELECTED MODEL VS BASELINE"
)

print("=" * 70)


print(

    f"Baseline RMSE : "

    f"{baseline_rmse:.4f} kWh"

)


print(

    f"Selected RMSE : "

    f"{best_final_rmse:.4f} kWh"

)


print(

    f"Improvement   : "

    f"{improvement_percent:.2f}%"

)


# ============================================================
# SAVE BEST MODEL
# ============================================================

print("\n[15] Saving selected model...")


model_path = (

    MODEL_DIR

    / "model_generation.pkl"

)


joblib.dump(

    best_model,

    model_path

)


print(
    f"Model saved: {model_path}"
)


# ============================================================
# SAVE MODEL METADATA
# ============================================================

print("\n[16] Saving model metadata...")


feature_path = (

    MODEL_DIR

    / "generation_features.json"

)


metadata = {


    "features":

        FEATURES,


    "target":

        TARGET,


    "best_model":

        best_model_name,


    "model_selection_method":

        "TimeSeriesSplit_cross_validation",


    "cv_splits":

        N_SPLITS,


    "best_cv_rmse_mean":

        float(
            best_cv_rmse
        ),


    "best_cv_rmse_std":

        float(
            best_cv_rmse_std
        ),


    "split_method":

        "chronological_time_based",


    "train_period":

        {


            "start":

                f"{int(train_dates.iloc[0]['Year'])}-"
                f"{int(train_dates.iloc[0]['MonthNum']):02d}",


            "end":

                f"{int(train_dates.iloc[-1]['Year'])}-"
                f"{int(train_dates.iloc[-1]['MonthNum']):02d}"

        },


    "test_period":

        {


            "start":

                f"{int(test_dates.iloc[0]['Year'])}-"
                f"{int(test_dates.iloc[0]['MonthNum']):02d}",


            "end":

                f"{int(test_dates.iloc[-1]['Year'])}-"
                f"{int(test_dates.iloc[-1]['MonthNum']):02d}"

        },


    "dataset_rows":

        int(
            len(df_model)
        ),


    "training_rows":

        int(
            len(X_train)
        ),


    "testing_rows":

        int(
            len(X_test)
        ),


    "final_test_metrics":

        {


            "MAE_kWh":

                float(
                    final_metrics["MAE_kWh"]
                ),


            "RMSE_kWh":

                float(
                    final_metrics["RMSE_kWh"]
                ),


            "R2":

                float(
                    final_metrics["R2"]
                ),


            "MAPE_percent":

                float(
                    final_metrics["MAPE_percent"]
                ),


            "sMAPE_percent":

                float(
                    final_metrics["sMAPE_percent"]
                )

        },


    "geographic_scope":

        (

            "Single campus/location dataset. "

            "Results should not be interpreted as "

            "generalizing geographically."

        )

}


with open(

    feature_path,

    "w",

    encoding="utf-8"

) as file:


    json.dump(

        metadata,

        file,

        indent=4

    )


print(
    f"Metadata saved: {feature_path}"
)


# ============================================================
# SAVE FINAL TEST MODEL COMPARISON
# ============================================================

print("\n[17] Saving final test model comparison...")


results_path = (

    RESULTS_DIR

    / "generation_model_comparison.csv"

)


final_test_results_df.to_csv(

    results_path,

    index=False

)


print(
    f"Comparison saved: {results_path}"
)


# ============================================================
# SAVE TEST PREDICTIONS
# ============================================================

print("\n[18] Saving test predictions...")


prediction_df = (

    df_test

    .copy()

)


prediction_df[

    "PredictedGeneration_kWh"

] = (

    best_predictions

)


prediction_df[

    "AbsoluteError_kWh"

] = (

    np.abs(

        prediction_df[

            TARGET

        ]

        -

        prediction_df[

            "PredictedGeneration_kWh"

        ]

    )

)


prediction_path = (

    RESULTS_DIR

    / "generation_test_predictions.csv"

)


prediction_df.to_csv(

    prediction_path,

    index=False

)


print(
    f"Predictions saved: {prediction_path}"
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n[19] Calculating feature importance...")


if hasattr(

    best_model,

    "feature_importances_"

):


    importance_df = (

        pd.DataFrame({


            "Feature":

                FEATURES,


            "Importance":

                best_model.feature_importances_

        })

    )


    importance_df = (

        importance_df

        .sort_values(

            by="Importance",

            ascending=False

        )

        .reset_index(
            drop=True
        )

    )


    importance_path = (

        RESULTS_DIR

        / "generation_feature_importance.csv"

    )


    importance_df.to_csv(

        importance_path,

        index=False

    )


    print()


    print(

        importance_df.to_string(

            index=False

        )

    )


    print()


    print(

        f"Feature importance saved: "

        f"{importance_path}"

    )


else:


    print(

        "Feature importance is not available "

        "for the selected model."

    )


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)

print(
    "TRAINING COMPLETE"
)

print("=" * 70)


print()


print(

    f"Selected Model (CV) : "

    f"{best_model_name}"

)


print()

print(
    "Cross-Validation Performance:"
)


print(

    f"Average CV RMSE : "

    f"{best_cv_rmse:.4f} kWh"

)


print(

    f"CV RMSE Std Dev : "

    f"{best_cv_rmse_std:.4f} kWh"

)


print()

print(
    "Final Untouched Test Performance:"
)


print(

    f"RMSE             : "

    f"{final_metrics['RMSE_kWh']:.4f} kWh"

)


print(

    f"MAE              : "

    f"{final_metrics['MAE_kWh']:.4f} kWh"

)


print(

    f"R2               : "

    f"{final_metrics['R2']:.4f}"

)


print(

    f"MAPE             : "

    f"{final_metrics['MAPE_percent']:.2f}%"

)


print(

    f"sMAPE            : "

    f"{final_metrics['sMAPE_percent']:.2f}%"

)


print(

    f"Baseline Improvement : "

    f"{improvement_percent:.2f}%"

)


print()


print(
    "Files created:"
)


print(
    f"  Model             : {model_path}"
)


print(
    f"  Metadata          : {feature_path}"
)


print(
    f"  CV Summary        : {cv_results_path}"
)


print(
    f"  CV Fold Results   : {cv_fold_results_path}"
)


print(
    f"  Test Comparison   : {results_path}"
)


print(
    f"  Test Predictions  : {prediction_path}"
)


print()

print(
    "=" * 70
)


print(
    "SolarSmart generation model training completed successfully."
)


print(
    "=" * 70
)