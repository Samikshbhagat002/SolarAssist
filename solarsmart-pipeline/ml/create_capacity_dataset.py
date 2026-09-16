import pandas as pd
from pathlib import Path

# ---------------------------------------------------------
# SolarSmart - Capacity Recommendation Dataset
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_UNISOLAR_monthly_ml_dataset.csv"
)

YIELD_FILE = (
    BASE_DIR
    / "ml"
    / "results"
    / "capacity_monthly_yield.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_capacity_training_dataset.csv"
)


# ---------------------------------------------------------
# Load real UNISOLAR data
# ---------------------------------------------------------

df = pd.read_csv(INPUT_FILE)
yield_df = pd.read_csv(YIELD_FILE)

print("SolarSmart - Creating Capacity Dataset")
print("=" * 60)
print(f"UNISOLAR rows loaded: {len(df)}")


# ---------------------------------------------------------
# Monthly empirical yield
# ---------------------------------------------------------

monthly_yield = dict(
    zip(
        yield_df["MonthNum"],
        yield_df["median"]
    )
)

annual_yield = sum(monthly_yield.values())

print(f"Empirical annual yield: {annual_yield:.2f} kWh/kWp/year")


# ---------------------------------------------------------
# Build method-derived household scenarios
#
# IMPORTANT:
# These are NOT real household labels.
# They are generated from documented sizing logic.
# ---------------------------------------------------------

scenarios = []

monthly_consumptions = [
    50, 75, 100, 125,
    150, 175, 200, 225, 250,
    275, 300, 350, 400,
    450, 500, 600, 750
]

future_growth_rates = [0, 5, 10, 15, 20]

for consumption in monthly_consumptions:

    for growth in future_growth_rates:

        adjusted_consumption = consumption * (1 + growth / 100)

        annual_consumption = adjusted_consumption * 12

        required_capacity = annual_consumption / annual_yield

        # -------------------------------------------------
        # MNRE capacity guidance
        # -------------------------------------------------

        if consumption <= 150:
            mnre_min_kw = 1.0
            mnre_max_kw = 2.0

        elif consumption <= 300:
            mnre_min_kw = 2.0
            mnre_max_kw = 3.0

        else:
            mnre_min_kw = 3.0
            mnre_max_kw = None

        # -------------------------------------------------
        # Recommended capacity
        #
        # Use calculated requirement, but respect
        # minimum government guidance.
        # -------------------------------------------------

        recommended_capacity = max(
            required_capacity,
            mnre_min_kw
        )

        # Round to 3 decimal places
        recommended_capacity = round(
            recommended_capacity,
            3
        )

        scenarios.append(
            {
                "monthly_consumption_kwh": consumption,
                "future_usage_growth_pct": growth,
                "adjusted_monthly_consumption_kwh":
                    round(adjusted_consumption, 2),
                "annual_consumption_kwh":
                    round(annual_consumption, 2),
                "empirical_annual_yield_kwh_per_kwp":
                    round(annual_yield, 2),
                "required_capacity_kw":
                    round(required_capacity, 3),
                "mnre_min_capacity_kw":
                    mnre_min_kw,
                "mnre_max_capacity_kw":
                    mnre_max_kw,
                "recommended_capacity_kw":
                    recommended_capacity,
                "label_source":
                    "method_derived"
            }
        )


# ---------------------------------------------------------
# Save dataset
# ---------------------------------------------------------

capacity_df = pd.DataFrame(scenarios)

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

capacity_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print(f"Rows created: {len(capacity_df)}")
print(f"Columns: {len(capacity_df.columns)}")
print()
print("Sample records:")
print(capacity_df.head(10).to_string(index=False))

print()
print("=" * 60)
print(f"Saved: {OUTPUT_FILE}")