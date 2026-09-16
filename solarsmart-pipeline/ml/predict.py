# ============================================================
# SolarSmart - Unified Prediction Pipeline
# ============================================================

import json
import math
from pathlib import Path

import joblib
import pandas as pd
import shap

from battery_sizing import calculate_battery_size
from empirical_generation import predict_empirical_generation


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_DIR = (
    BASE_DIR
    / "ml"
    / "models"
)

RESULT_DIR = (
    BASE_DIR
    / "ml"
    / "results"
)


# ============================================================
# LOAD MODELS
# ============================================================

print("Loading SolarSmart models...")


# ------------------------------------------------------------
# CAPACITY MODEL
# ------------------------------------------------------------

capacity_model_path = (
    MODEL_DIR
    / "model_capacity.pkl"
)

capacity_model = joblib.load(
    capacity_model_path
)


# ------------------------------------------------------------
# GENERATION MODEL
# ------------------------------------------------------------
#
# This model is retained as an ML benchmark.
#
# The final production generation prediction currently uses
# empirical observed monthly yield because the UNISOLAR dataset
# represents a single geographic location.
#
# The ML model is still useful for:
#
# - Research comparison
# - Benchmarking
# - Model evaluation
# - Explainability
# ------------------------------------------------------------

generation_model_path = (
    MODEL_DIR
    / "model_generation.pkl"
)

generation_model = joblib.load(
    generation_model_path
)


print("Models loaded successfully.")


# ============================================================
# LOAD METADATA
# ============================================================


# ------------------------------------------------------------
# CAPACITY METADATA
# ------------------------------------------------------------

capacity_metadata_path = (
    MODEL_DIR
    / "capacity_features.json"
)


with open(
    capacity_metadata_path,
    "r",
    encoding="utf-8"
) as file:

    capacity_metadata = json.load(
        file
    )


# ------------------------------------------------------------
# GENERATION METADATA
# ------------------------------------------------------------

generation_metadata_path = (
    MODEL_DIR
    / "generation_features.json"
)


with open(
    generation_metadata_path,
    "r",
    encoding="utf-8"
) as file:

    generation_metadata = json.load(
        file
    )


# ============================================================
# FEATURE LISTS
# ============================================================


# ------------------------------------------------------------
# CAPACITY FEATURES
# ------------------------------------------------------------

CAPACITY_FEATURES = (
    capacity_metadata[
        "features"
    ]
)


# ------------------------------------------------------------
# GENERATION FEATURES
# ------------------------------------------------------------
#
# The updated train_model.py stores metadata as a dictionary.
# ------------------------------------------------------------

if isinstance(
    generation_metadata,
    dict
):

    GENERATION_FEATURES = (
        generation_metadata[
            "features"
        ]
    )

    GENERATION_MODEL_NAME = (
        generation_metadata.get(
            "best_model",
            "Unknown"
        )
    )


else:

    # Backward compatibility with the old format where
    # generation_features.json contained only a feature list.

    GENERATION_FEATURES = (
        generation_metadata
    )

    GENERATION_MODEL_NAME = (
        "Unknown"
    )


# ============================================================
# SHAP EXPLAINERS
# ============================================================

print("Initializing SHAP explainers...")


# ------------------------------------------------------------
# CAPACITY SHAP
# ------------------------------------------------------------

capacity_explainer = shap.TreeExplainer(
    capacity_model
)


# ------------------------------------------------------------
# GENERATION MODEL SHAP
# ------------------------------------------------------------
#
# All currently supported models are tree-based.
#
# TreeExplainer supports:
#
# - Decision Tree
# - Random Forest
# - Gradient Boosting
# - XGBoost
# ------------------------------------------------------------

generation_explainer = shap.TreeExplainer(
    generation_model
)


print("SHAP explainers initialized successfully.")


# ============================================================
# HELPER FUNCTION
# NORMALIZE SHAP VALUES
# ============================================================

def extract_shap_values(
    shap_values
):

    """
    Convert SHAP output into a one-dimensional array
    representing one prediction.

    Different SHAP versions and models can return
    slightly different structures.
    """


    # --------------------------------------------------------
    # EXPLANATION OBJECT
    # --------------------------------------------------------

    if hasattr(
        shap_values,
        "values"
    ):

        shap_values = (
            shap_values.values
        )


    # --------------------------------------------------------
    # MULTI-DIMENSIONAL ARRAY
    # --------------------------------------------------------

    if hasattr(
        shap_values,
        "ndim"
    ):

        while (
            shap_values.ndim > 1
        ):

            shap_values = (
                shap_values[0]
            )


    return shap_values


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict_solar_system(

    # --------------------------------------------------------
    # HOUSEHOLD INPUT
    # --------------------------------------------------------

    monthly_consumption_kwh,

    future_usage_growth_pct,


    # --------------------------------------------------------
    # GENERATION CONTEXT
    # --------------------------------------------------------

    month_num,

    latitude,

    longitude,

    air_temperature_c,

    apparent_temperature_c,

    dew_point_c,

    relative_humidity_pct,


    # --------------------------------------------------------
    # BATTERY INPUT
    # --------------------------------------------------------

    backup_hours=4,

    backup_load_pct=50,

    depth_of_discharge_pct=80,

    battery_efficiency_pct=90
):


    # ========================================================
    # INPUT VALIDATION
    # ========================================================

    if not (
        1 <= month_num <= 12
    ):

        raise ValueError(
            "month_num must be between 1 and 12."
        )


    if (
        monthly_consumption_kwh <= 0
    ):

        raise ValueError(
            "monthly_consumption_kwh must be greater than 0."
        )


    if (
        future_usage_growth_pct < 0
    ):

        raise ValueError(
            "future_usage_growth_pct cannot be negative."
        )


    # ========================================================
    # 1. CAPACITY RECOMMENDATION
    # ========================================================

    capacity_input = pd.DataFrame(

        [
            {

                "monthly_consumption_kwh":
                    monthly_consumption_kwh,


                "future_usage_growth_pct":
                    future_usage_growth_pct

            }
        ]

    )


    recommended_capacity_kw = float(

        capacity_model.predict(

            capacity_input[
                CAPACITY_FEATURES
            ]

        )[0]

    )


    # Safety guard

    recommended_capacity_kw = max(

        0.0,

        recommended_capacity_kw

    )


    # ========================================================
    # 2. EMPIRICAL GENERATION
    # ========================================================
    #
    # FINAL PRODUCTION GENERATION
    #
    # Formula:
    #
    # Generation =
    # Capacity × Observed Monthly Median Yield
    #
    # The monthly yield is calculated from observed UNISOLAR
    # generation data.
    #
    # This is currently preferred for production output because
    # the generation ML model was trained on a single location.
    # ========================================================

    empirical_generation_result = (

        predict_empirical_generation(

            capacity_kw=
                recommended_capacity_kw,


            month_num=
                month_num

        )

    )


    predicted_generation_kwh = float(

        empirical_generation_result[

            "predicted_generation_kwh"

        ]

    )


    predicted_generation_kwh = max(

        0.0,

        predicted_generation_kwh

    )


    # ========================================================
    # 3. GENERATION ML BENCHMARK
    # ========================================================
    #
    # The saved model is automatically identified from metadata.
    #
    # Currently:
    #
    # Gradient Boosting
    #
    # This prediction is NOT used as the final production
    # recommendation.
    # ========================================================


    # --------------------------------------------------------
    # CYCLIC MONTH FEATURES
    # --------------------------------------------------------

    month_sin = math.sin(

        2
        *
        math.pi
        *
        month_num
        /
        12

    )


    month_cos = math.cos(

        2
        *
        math.pi
        *
        month_num
        /
        12

    )


    # --------------------------------------------------------
    # GENERATION MODEL INPUT
    # --------------------------------------------------------
    #
    # We construct all possible generation inputs first.
    #
    # Then only the features required by the saved model are
    # selected using GENERATION_FEATURES.
    #
    # This makes the prediction pipeline more robust if feature
    # selection changes in future model training.
    # --------------------------------------------------------

    generation_input = pd.DataFrame(

        [

            {

                "kWp":
                    recommended_capacity_kw,


                "lat":
                    latitude,


                "Lon":
                    longitude,


                "air_temperature_mean_c":
                    air_temperature_c,


                "apparent_temperature_mean_c":
                    apparent_temperature_c,


                "dew_point_mean_c":
                    dew_point_c,


                "relative_humidity_mean_pct":
                    relative_humidity_pct,


                "month_sin":
                    month_sin,


                "month_cos":
                    month_cos

            }

        ]

    )


    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    generation_ml_prediction = float(

        generation_model.predict(

            generation_input[
                GENERATION_FEATURES
            ]

        )[0]

    )


    # Prevent negative generation

    generation_ml_prediction = max(

        0.0,

        generation_ml_prediction

    )


    # ========================================================
    # 4. BATTERY SIZING
    # ========================================================

    battery_result = (

        calculate_battery_size(

            monthly_consumption_kwh=
                monthly_consumption_kwh,


            backup_hours=
                backup_hours,


            backup_load_pct=
                backup_load_pct,


            depth_of_discharge_pct=
                depth_of_discharge_pct,


            battery_efficiency_pct=
                battery_efficiency_pct

        )

    )


    # ========================================================
    # 5. CAPACITY SHAP EXPLANATION
    # ========================================================

    capacity_raw_shap_values = (

        capacity_explainer.shap_values(

            capacity_input[
                CAPACITY_FEATURES
            ]

        )

    )


    capacity_shap_values = (

        extract_shap_values(

            capacity_raw_shap_values

        )

    )


    capacity_shap = {

        feature:

            float(value)

        for feature, value

        in zip(

            CAPACITY_FEATURES,

            capacity_shap_values

        )

    }


    # ========================================================
    # 6. GENERATION ML SHAP EXPLANATION
    # ========================================================
    #
    # IMPORTANT:
    #
    # These SHAP values explain the ML benchmark only.
    #
    # They DO NOT explain the empirical generation result.
    # ========================================================

    generation_raw_shap_values = (

        generation_explainer.shap_values(

            generation_input[
                GENERATION_FEATURES
            ]

        )

    )


    generation_shap_values = (

        extract_shap_values(

            generation_raw_shap_values

        )

    )


    generation_shap = {

        feature:

            float(value)

        for feature, value

        in zip(

            GENERATION_FEATURES,

            generation_shap_values

        )

    }


    # ========================================================
    # 7. FINAL RESPONSE
    # ========================================================

    return {


        # ====================================================
        # CAPACITY
        # ====================================================

        "capacity": {


            "recommended_capacity_kw":

                round(

                    recommended_capacity_kw,

                    3

                ),


            "model":

                capacity_metadata.get(

                    "model",

                    "Unknown"

                ),


            "label_source":

                capacity_metadata.get(

                    "label_source",

                    "method_derived"

                ),


            "shap":

                capacity_shap

        },


        # ====================================================
        # GENERATION
        # ====================================================

        "generation": {


            # ------------------------------------------------
            # FINAL PRODUCTION VALUE
            # ------------------------------------------------

            "predicted_monthly_generation_kwh":

                round(

                    predicted_generation_kwh,

                    2

                ),


            "month":

                month_num,


            "model":

                "Empirical observed monthly median yield",


            "method":

                empirical_generation_result.get(

                    "method",

                    "empirical"

                ),


            "monthly_yield_kwh_per_kwp":

                round(

                    float(

                        empirical_generation_result[

                            "monthly_yield_kwh_per_kwp"

                        ]

                    ),

                    4

                ),


            # ------------------------------------------------
            # ML BENCHMARK
            # ------------------------------------------------

            "ml_benchmark": {


                "model":

                    GENERATION_MODEL_NAME,


                "predicted_monthly_generation_kwh":

                    round(

                        generation_ml_prediction,

                        2

                    ),


                "shap":

                    generation_shap

            }

        },


        # ====================================================
        # BATTERY
        # ====================================================

        "battery":

            battery_result

    }


# ============================================================
# TEST PIPELINE
# ============================================================

if __name__ == "__main__":


    # ========================================================
    # SAMPLE INPUT
    # ========================================================

    result = predict_solar_system(


        # ----------------------------------------------------
        # HOUSEHOLD
        # ----------------------------------------------------

        monthly_consumption_kwh=300,

        future_usage_growth_pct=10,


        # ----------------------------------------------------
        # GENERATION CONTEXT
        # ----------------------------------------------------

        month_num=1,

        latitude=-37.718287,

        longitude=145.050975,

        air_temperature_c=20,

        apparent_temperature_c=20,

        dew_point_c=12,

        relative_humidity_pct=65,


        # ----------------------------------------------------
        # BATTERY
        # ----------------------------------------------------

        backup_hours=4,

        backup_load_pct=50,

        depth_of_discharge_pct=80,

        battery_efficiency_pct=90

    )


    # ========================================================
    # OUTPUT
    # ========================================================

    print()

    print(
        "=" * 60
    )

    print(
        "SolarSmart - Unified Prediction Pipeline"
    )

    print(
        "=" * 60
    )


    # ========================================================
    # CAPACITY
    # ========================================================

    print()

    print(
        "CAPACITY"
    )

    print(
        "-" * 60
    )


    print(

        "Recommended capacity:",

        result[

            "capacity"

        ][

            "recommended_capacity_kw"

        ],

        "kW"

    )


    print(

        "Model:",

        result[

            "capacity"

        ][

            "model"

        ]

    )


    print(

        "Label source:",

        result[

            "capacity"

        ][

            "label_source"

        ]

    )


    # ========================================================
    # GENERATION
    # ========================================================

    print()

    print(
        "GENERATION - FINAL PRODUCTION ESTIMATE"
    )

    print(
        "-" * 60
    )


    print(

        "Expected monthly generation:",

        result[

            "generation"

        ][

            "predicted_monthly_generation_kwh"

        ],

        "kWh"

    )


    print(

        "Model:",

        result[

            "generation"

        ][

            "model"

        ]

    )


    print(

        "Method:",

        result[

            "generation"

        ][

            "method"

        ]

    )


    print(

        "Observed monthly yield:",

        result[

            "generation"

        ][

            "monthly_yield_kwh_per_kwp"

        ],

        "kWh/kWp/month"

    )


    print(

        "Month:",

        result[

            "generation"

        ][

            "month"

        ]

    )


    # ========================================================
    # GENERATION ML BENCHMARK
    # ========================================================

    print()

    print(
        "GENERATION ML BENCHMARK"
    )

    print(
        "-" * 60
    )


    print(

        "Model:",

        result[

            "generation"

        ][

            "ml_benchmark"

        ][

            "model"

        ]

    )


    print(

        "ML prediction:",

        result[

            "generation"

        ][

            "ml_benchmark"

        ][

            "predicted_monthly_generation_kwh"

        ],

        "kWh"

    )


    # ========================================================
    # BATTERY
    # ========================================================

    print()

    print(
        "BATTERY"
    )

    print(
        "-" * 60
    )


    print(

        "Recommended battery:",

        result[

            "battery"

        ][

            "recommended_battery_kwh"

        ],

        "kWh"

    )


    print(

        "Method:",

        result[

            "battery"

        ].get(

            "method",

            "deterministic"

        )

    )


    # ========================================================
    # CAPACITY SHAP
    # ========================================================

    print()

    print(
        "CAPACITY SHAP EXPLANATION"
    )

    print(
        "-" * 60
    )


    for feature, value in result[

        "capacity"

    ][

        "shap"

    ].items():


        print(

            f"{feature}: "

            f"{value:.6f}"

        )


    # ========================================================
    # GENERATION ML SHAP
    # ========================================================

    print()

    print(
        "GENERATION ML BENCHMARK SHAP EXPLANATION"
    )

    print(
        "-" * 60
    )


    for feature, value in result[

        "generation"

    ][

        "ml_benchmark"

    ][

        "shap"

    ].items():


        print(

            f"{feature}: "

            f"{value:.6f}"

        )


    # ========================================================
    # COMPLETE
    # ========================================================

    print()

    print(
        "=" * 60
    )

    print(
        "Unified prediction completed successfully."
    )

    print(
        "=" * 60
    )