# ============================================================
# SolarSmart - Empirical Monthly Generation Calculator
# ============================================================

from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

YIELD_PATH = (
    BASE_DIR
    / "ml"
    / "results"
    / "capacity_monthly_yield.csv"
)


# ============================================================
# LOAD YIELD DATA
# ============================================================

def load_monthly_yield_data():
    """
    Load observed monthly median solar generation yield.

    Expected columns:
        MonthNum
        median
    """

    if not YIELD_PATH.exists():

        raise FileNotFoundError(
            f"Yield file not found:\n{YIELD_PATH}"
        )

    yield_df = pd.read_csv(
        YIELD_PATH
    )

    required_columns = {
        "MonthNum",
        "median"
    }

    missing_columns = (
        required_columns
        - set(yield_df.columns)
    )

    if missing_columns:

        raise ValueError(
            f"Missing required columns: "
            f"{missing_columns}"
        )

    return yield_df


# ============================================================
# LOAD DATA ONCE
# ============================================================

YIELD_DF = load_monthly_yield_data()


# ============================================================
# FUNCTION
# ============================================================

def predict_empirical_generation(
    capacity_kw,
    month_num
):
    """
    Calculate expected monthly solar generation using
    the observed monthly median generation yield.

    Formula:

        Generation = Capacity × Monthly Median Yield

    Yield unit:

        kWh/kWp/month
    """


    # ========================================================
    # VALIDATE MONTH
    # ========================================================

    month_num = int(
        month_num
    )

    if not 1 <= month_num <= 12:

        raise ValueError(
            "month_num must be between 1 and 12."
        )


    # ========================================================
    # VALIDATE CAPACITY
    # ========================================================

    capacity_kw = float(
        capacity_kw
    )

    if capacity_kw <= 0:

        raise ValueError(
            "capacity_kw must be greater than 0."
        )


    # ========================================================
    # FIND REQUESTED MONTH
    # ========================================================

    month_row = YIELD_DF[
        YIELD_DF["MonthNum"]
        == month_num
    ]


    if month_row.empty:

        raise ValueError(
            f"No observed yield data available "
            f"for month {month_num}."
        )


    # ========================================================
    # GET OBSERVED MEDIAN YIELD
    # ========================================================

    monthly_yield = float(

        month_row[
            "median"
        ].iloc[0]

    )


    # ========================================================
    # CALCULATE GENERATION
    # ========================================================

    generation_kwh = (

        capacity_kw
        *
        monthly_yield

    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {

        "capacity_kw":

            round(
                capacity_kw,
                3
            ),


        "month_num":

            month_num,


        "monthly_yield_kwh_per_kwp":

            round(
                monthly_yield,
                2
            ),


        "predicted_generation_kwh":

            round(
                generation_kwh,
                2
            ),


        "method":

            "empirical_observed_monthly_median"

    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 65)

    print(
        "SolarSmart - Empirical Generation Calculator"
    )

    print("=" * 65)


    # --------------------------------------------------------
    # TEST INPUT
    # --------------------------------------------------------

    test_capacity = 3.766

    test_month = 1


    # --------------------------------------------------------
    # PREDICT
    # --------------------------------------------------------

    result = predict_empirical_generation(

        capacity_kw=test_capacity,

        month_num=test_month

    )


    # --------------------------------------------------------
    # DISPLAY
    # --------------------------------------------------------

    print("\nTest Input")

    print("-" * 65)


    print(

        f"Capacity: "
        f"{result['capacity_kw']} kWp"

    )


    print(

        f"Month: "
        f"{result['month_num']}"

    )


    print("\nObserved Yield")

    print("-" * 65)


    print(

        f"Monthly median yield: "

        f"{result['monthly_yield_kwh_per_kwp']} "

        f"kWh/kWp/month"

    )


    print("\nPrediction")

    print("-" * 65)


    print(

        f"Expected monthly generation: "

        f"{result['predicted_generation_kwh']} kWh"

    )


    print(

        f"Method: "

        f"{result['method']}"

    )


    print("\n" + "=" * 65)


    print(

        "Empirical generation calculation "
        "completed successfully."

    )


    print("=" * 65)