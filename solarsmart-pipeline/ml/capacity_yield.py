"""
SolarSmart - Empirical Solar Yield Calculation

Calculates historical monthly solar generation per installed kWp.

IMPORTANT:
The monthly yield values are calculated ONLY from the
training period to prevent data leakage.

The final test period remains untouched.
"""

from pathlib import Path
import json

import pandas as pd


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


RESULTS_DIR = (
    PROJECT_ROOT
    / "ml"
    / "results"
)


RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


YIELD_OUTPUT_PATH = (
    RESULTS_DIR
    / "capacity_monthly_yield.csv"
)


METADATA_OUTPUT_PATH = (
    RESULTS_DIR
    / "capacity_monthly_yield_metadata.json"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_generation_data():
    """
    Load the cleaned UNISOLAR monthly dataset.
    """

    if not DATA_PATH.exists():

        raise FileNotFoundError(
            f"Dataset not found:\n{DATA_PATH}"
        )


    df = pd.read_csv(
        DATA_PATH
    )


    required_columns = [

        "Year",

        "MonthNum",

        "kWp",

        "monthly_generation_kwh"

    ]


    missing = [

        column

        for column in required_columns

        if column not in df.columns

    ]


    if missing:

        raise ValueError(

            f"Missing required columns: {missing}"

        )


    return df


# ============================================================
# SORT DATA CHRONOLOGICALLY
# ============================================================

def sort_chronologically(df):
    """
    Sort dataset chronologically.

    SiteKey is used as a secondary sorting column
    when available.
    """

    sort_columns = [

        "Year",

        "MonthNum"

    ]


    if "SiteKey" in df.columns:

        sort_columns.append(
            "SiteKey"
        )


    return (

        df

        .sort_values(
            sort_columns
        )

        .reset_index(
            drop=True
        )

    )


# ============================================================
# CREATE TIME-BASED TRAIN / TEST SPLIT
# ============================================================

def create_time_split(
    df,
    train_fraction=0.80
):
    """
    Create a chronological train/test split.

    The split is performed using unique months,
    not individual rows.

    This ensures that all observations from the
    same month belong to either training or testing.
    """


    unique_dates = (

        df[
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


    total_months = len(
        unique_dates
    )


    if total_months < 2:

        raise ValueError(

            "At least two unique months are required."

        )


    split_index = int(

        total_months
        *
        train_fraction

    )


    if (

        split_index <= 0

        or

        split_index >= total_months

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


    # --------------------------------------------------------
    # CREATE DATE KEYS
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # CREATE MASKS
    # --------------------------------------------------------

    train_mask = [

        (year, month)

        in

        train_keys

        for year, month

        in zip(

            df["Year"],

            df["MonthNum"]

        )

    ]


    test_mask = [

        (year, month)

        in

        test_keys

        for year, month

        in zip(

            df["Year"],

            df["MonthNum"]

        )

    ]


    train_df = (

        df.loc[
            train_mask
        ]

        .copy()

        .reset_index(
            drop=True
        )

    )


    test_df = (

        df.loc[
            test_mask
        ]

        .copy()

        .reset_index(
            drop=True
        )

    )


    return (

        train_df,

        test_df,

        train_dates,

        test_dates

    )


# ============================================================
# CALCULATE MONTHLY YIELD
# ============================================================

def calculate_monthly_yield(df):
    """
    Calculate observed monthly generation per installed kWp.

    Formula:

        generation_kwh_per_kwp
        =
        monthly_generation_kwh
        /
        kWp


    Monthly statistics are calculated for each month.

    IMPORTANT:

    The input dataframe should contain ONLY
    training data.
    """


    data = df.copy()


    # --------------------------------------------------------
    # VALID DATA
    # --------------------------------------------------------

    data = (

        data[

            (

                data["kWp"]
                > 0

            )

            &

            (

                data[
                    "monthly_generation_kwh"
                ]

                >= 0

            )

        ]

        .copy()

    )


    if len(data) == 0:

        raise ValueError(

            "No valid rows available for yield calculation."

        )


    # --------------------------------------------------------
    # GENERATION PER KWP
    # --------------------------------------------------------

    data[
        "generation_kwh_per_kwp"
    ] = (

        data[
            "monthly_generation_kwh"
        ]

        /

        data[
            "kWp"
        ]

    )


    # --------------------------------------------------------
    # MONTHLY STATISTICS
    # --------------------------------------------------------

    monthly_yield = (

        data

        .groupby(
            "MonthNum"
        )

        [
            "generation_kwh_per_kwp"
        ]

        .agg(

            mean="mean",

            median="median",

            minimum="min",

            maximum="max",

            observations="count"

        )

        .reset_index()

        .sort_values(
            "MonthNum"
        )

        .reset_index(
            drop=True
        )

    )


    return (

        monthly_yield,

        data

    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":


    print()

    print("=" * 70)

    print(
        "SolarSmart - Empirical Solar Yield Calculation"
    )

    print(
        "Leakage-Free Training Yield"
    )

    print("=" * 70)


    # ========================================================
    # LOAD DATA
    # ========================================================

    print(
        "\n[1] Loading dataset..."
    )


    df = load_generation_data()


    print(
        f"Dataset: {DATA_PATH}"
    )


    print(
        f"Rows loaded: {len(df)}"
    )


    # ========================================================
    # SORT DATA
    # ========================================================

    print(
        "\n[2] Sorting data chronologically..."
    )


    df = sort_chronologically(
        df
    )


    # ========================================================
    # TIME SPLIT
    # ========================================================

    print(
        "\n[3] Creating time-based train/test split..."
    )


    (

        train_df,

        test_df,

        train_dates,

        test_dates

    ) = create_time_split(

        df,

        train_fraction=0.80

    )


    print()


    print(
        f"Unique months: "
        f"{len(train_dates) + len(test_dates)}"
    )


    print(
        f"Training rows: "
        f"{len(train_df)}"
    )


    print(
        f"Testing rows: "
        f"{len(test_df)}"
    )


    print()


    train_start = (

        f"{int(train_dates.iloc[0]['Year'])}-"

        f"{int(train_dates.iloc[0]['MonthNum']):02d}"

    )


    train_end = (

        f"{int(train_dates.iloc[-1]['Year'])}-"

        f"{int(train_dates.iloc[-1]['MonthNum']):02d}"

    )


    test_start = (

        f"{int(test_dates.iloc[0]['Year'])}-"

        f"{int(test_dates.iloc[0]['MonthNum']):02d}"

    )


    test_end = (

        f"{int(test_dates.iloc[-1]['Year'])}-"

        f"{int(test_dates.iloc[-1]['MonthNum']):02d}"

    )


    print(
        f"Training period: "
        f"{train_start} -> {train_end}"
    )


    print(
        f"Testing period : "
        f"{test_start} -> {test_end}"
    )


    # ========================================================
    # CALCULATE TRAINING YIELD
    # ========================================================

    print(
        "\n[4] Calculating observed monthly yield..."
    )


    print(
        "IMPORTANT: Only training data is used."
    )


    (

        monthly_yield,

        training_data

    ) = calculate_monthly_yield(

        train_df

    )


    # ========================================================
    # DISPLAY RESULTS
    # ========================================================

    print()

    print(
        "=" * 70
    )

    print(
        "OBSERVED MONTHLY GENERATION PER KWP"
    )

    print(
        "=" * 70
    )


    for _, row in monthly_yield.iterrows():


        print(

            f"Month "

            f"{int(row['MonthNum']):02d}"

            f" | "

            f"Mean: "

            f"{row['mean']:.2f}"

            f" kWh/kWp"

            f" | "

            f"Median: "

            f"{row['median']:.2f}"

            f" kWh/kWp"

            f" | "

            f"Observations: "

            f"{int(row['observations'])}"

        )


    # ========================================================
    # OVERALL TRAINING YIELD
    # ========================================================

    print()

    print(
        "=" * 70
    )

    print(
        "OVERALL TRAINING PERIOD YIELD"
    )

    print(
        "=" * 70
    )


    overall_yield = (

        training_data[
            "generation_kwh_per_kwp"
        ]

    )


    print(

        f"Mean   : "

        f"{overall_yield.mean():.2f} "

        f"kWh/kWp/month"

    )


    print(

        f"Median : "

        f"{overall_yield.median():.2f} "

        f"kWh/kWp/month"

    )


    print(

        f"Minimum: "

        f"{overall_yield.min():.2f} "

        f"kWh/kWp/month"

    )


    print(

        f"Maximum: "

        f"{overall_yield.max():.2f} "

        f"kWh/kWp/month"

    )


    # ========================================================
    # SAVE YIELD FILE
    # ========================================================

    print(
        "\n[5] Saving monthly yield..."
    )


    monthly_yield.to_csv(

        YIELD_OUTPUT_PATH,

        index=False

    )


    print(
        f"Saved: {YIELD_OUTPUT_PATH}"
    )


    # ========================================================
    # SAVE METADATA
    # ========================================================

    print(
        "\n[6] Saving metadata..."
    )


    metadata = {


        "method":

            (
                "observed_monthly_generation_"
                "per_kwp"
            ),


        "statistic":

            "median",


        "formula":

            (
                "monthly_generation_kwh "
                "/ kWp"
            ),


        "train_fraction":

            0.80,


        "split_method":

            "time_based",


        "training_period":

            {

                "start":

                    train_start,


                "end":

                    train_end

            },


        "test_period":

            {

                "start":

                    test_start,


                "end":

                    test_end

            },


        "training_rows":

            int(
                len(train_df)
            ),


        "testing_rows":

            int(
                len(test_df)
            ),


        "data_leakage":

            False,


        "note":

            (
                "Monthly empirical yields were "
                "calculated only from the training "
                "period. The test period was excluded."
            )

    }


    with open(

        METADATA_OUTPUT_PATH,

        "w",

        encoding="utf-8"

    ) as file:


        json.dump(

            metadata,

            file,

            indent=4

        )


    print(
        f"Metadata saved: {METADATA_OUTPUT_PATH}"
    )


    # ========================================================
    # COMPLETE
    # ========================================================

    print()

    print(
        "=" * 70
    )

    print(
        "EMPIRICAL YIELD CALCULATION COMPLETE"
    )

    print(
        "=" * 70
    )


    print()


    print(
        "Leakage-free empirical yield table created."
    )


    print(
        f"Training data used: "
        f"{train_start} -> {train_end}"
    )


    print(
        f"Test data excluded: "
        f"{test_start} -> {test_end}"
    )