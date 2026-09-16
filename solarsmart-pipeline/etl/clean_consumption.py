"""
Step 2 of the pipeline: standardize the household electricity consumption
dataset into a common schema.

Source:
indian-household-electricity-bill/electricity_bill_dataset.csv

The source dataset contains:
- Appliance usage
- Month
- City
- Electricity company
- Monthly hours
- Tariff rate
- Electricity bill

Run:
docker compose exec etl python etl/clean_consumption.py
"""

import pandas as pd
from pathlib import Path


RAW = Path("/app/data/raw")
OUT = Path("/app/data/interim")

OUT.mkdir(parents=True, exist_ok=True)


def clean_household_consumption():
    """
    Clean and standardize the Indian household electricity bill dataset.
    """

    path = (
        RAW
        / "indian-household-electricity-bill"
        / "electricity_bill_dataset.csv"
    )

    if not path.exists():
        print(
            f"[skip] consumption CSV not found: {path}"
        )
        return pd.DataFrame()

    print(
        f"[info] Reading: {path.name}"
    )

    df = pd.read_csv(path)

    print(
        f"[info] Raw rows: {len(df)}"
    )

    # ------------------------------------------------------------
    # Standardize column names.
    # ------------------------------------------------------------

    df.columns = [
        str(c).strip().lower()
        for c in df.columns
    ]

    # ------------------------------------------------------------
    # Rename source columns to pipeline-friendly names.
    # ------------------------------------------------------------

    rename_map = {
        "month": "month",
        "city": "city",
        "company": "electricity_company",
        "monthlyhours": "monthly_hours",
        "tariffrate": "tariff_rate",
        "electricitybill": "electricity_bill",
        "fan": "fan_usage",
        "refrigerator": "refrigerator_usage",
        "airconditioner": "air_conditioner_usage",
        "television": "television_usage",
        "monitor": "monitor_usage",
        "motorpump": "motor_pump_usage",
    }

    df = df.rename(
        columns={
            key: value
            for key, value in rename_map.items()
            if key in df.columns
        }
    )

    # ------------------------------------------------------------
    # Convert numeric columns.
    # ------------------------------------------------------------

    numeric_columns = [
        "month",
        "monthly_hours",
        "tariff_rate",
        "electricity_bill",
        "fan_usage",
        "refrigerator_usage",
        "air_conditioner_usage",
        "television_usage",
        "monitor_usage",
        "motor_pump_usage",
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )

    # ------------------------------------------------------------
    # Remove records without a valid electricity bill.
    # ------------------------------------------------------------

    before = len(df)

    df = df.dropna(
        subset=["electricity_bill"]
    )

    removed = before - len(df)

    if removed > 0:
        print(
            f"[info] Removed {removed} rows "
            "without electricity bill."
        )

    # ------------------------------------------------------------
    # Validate month.
    # Dataset contains month numbers 1-12.
    # ------------------------------------------------------------

    if "month" in df.columns:
        invalid_months = ~df["month"].between(
            1,
            12,
        )

        invalid_count = invalid_months.sum()

        if invalid_count > 0:
            print(
                f"[warn] Removing {invalid_count} "
                "rows with invalid month values."
            )

            df = df[
                ~invalid_months
            ]

    # ------------------------------------------------------------
    # Add source information.
    # ------------------------------------------------------------

    df["source_dataset"] = (
        "indian-household-electricity-bill"
    )

    # ------------------------------------------------------------
    # Standard output columns.
    # ------------------------------------------------------------

    column_order = [
        "month",
        "city",
        "electricity_company",
        "monthly_hours",
        "tariff_rate",
        "electricity_bill",
        "fan_usage",
        "refrigerator_usage",
        "air_conditioner_usage",
        "television_usage",
        "monitor_usage",
        "motor_pump_usage",
        "source_dataset",
    ]

    df = df[
        [
            column
            for column in column_order
            if column in df.columns
        ]
    ]

    return df


def run():
    """
    Run the complete consumption cleaning pipeline.
    """

    print(
        "[1/2] Cleaning household consumption dataset..."
    )

    cleaned = clean_household_consumption()

    print(
        f"[info] Cleaned rows: {len(cleaned)}"
    )

    print(
        "[2/2] Saving cleaned consumption dataset..."
    )

    output_path = (
        OUT
        / "household_consumption_clean.csv"
    )

    cleaned.to_csv(
        output_path,
        index=False,
    )

    print(
        f"[done] {len(cleaned)} rows -> {output_path}"
    )


if __name__ == "__main__":
    run()