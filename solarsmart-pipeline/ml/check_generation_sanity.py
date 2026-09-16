# ============================================================
# SolarSmart - Generation Prediction Sanity Check
# ============================================================

from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "SolarSmart_UNISOLAR_monthly_ml_dataset.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 65)
print("SolarSmart - Generation Prediction Sanity Check")
print("=" * 65)

df = pd.read_csv(DATA_PATH)

print(f"\nDataset rows: {len(df)}")


# ============================================================
# CALCULATE OBSERVED YIELD
# ============================================================

df["yield_kwh_per_kwp"] = (
    df["monthly_generation_kwh"] / df["kWp"]
)


# Remove invalid values
df = df[
    df["yield_kwh_per_kwp"].notna()
    & (df["kWp"] > 0)
]


# ============================================================
# MONTHLY STATISTICS
# ============================================================

monthly_stats = (
    df.groupby("MonthNum")["yield_kwh_per_kwp"]
    .agg(
        mean="mean",
        median="median",
        minimum="min",
        maximum="max",
        observations="count"
    )
    .reset_index()
)


print("\nObserved generation yield by month")
print("-" * 65)

for _, row in monthly_stats.iterrows():

    print(
        f"Month {int(row['MonthNum']):02d} | "
        f"Mean: {row['mean']:.2f} kWh/kWp | "
        f"Median: {row['median']:.2f} kWh/kWp | "
        f"Min: {row['minimum']:.2f} | "
        f"Max: {row['maximum']:.2f} | "
        f"N: {int(row['observations'])}"
    )


# ============================================================
# ANNUAL EMPIRICAL YIELD
# ============================================================

annual_yield_from_medians = monthly_stats["median"].sum()

annual_yield_from_means = monthly_stats["mean"].sum()


print("\n" + "=" * 65)
print("EMPIRICAL ANNUAL YIELD")
print("=" * 65)

print(
    f"\nSum of monthly medians: "
    f"{annual_yield_from_medians:.2f} kWh/kWp/year"
)

print(
    f"Sum of monthly means:   "
    f"{annual_yield_from_means:.2f} kWh/kWp/year"
)


# ============================================================
# TEST CAPACITY
# ============================================================

test_capacity_kw = 3.766


print("\n" + "=" * 65)
print("EXPECTED GENERATION FOR 3.766 kWp")
print("=" * 65)


print("\nUsing monthly median yields:")

total_expected = 0.0


for _, row in monthly_stats.iterrows():

    monthly_generation = (
        test_capacity_kw * row["median"]
    )

    total_expected += monthly_generation

    print(
        f"Month {int(row['MonthNum']):02d}: "
        f"{monthly_generation:.2f} kWh"
    )


average_monthly_generation = total_expected / 12


print(
    f"\nEstimated annual generation: "
    f"{total_expected:.2f} kWh"
)

print(
    f"Average monthly generation: "
    f"{average_monthly_generation:.2f} kWh"
)


# ============================================================
# JANUARY EMPIRICAL VALUE
# ============================================================

january_rows = monthly_stats[
    monthly_stats["MonthNum"] == 1
]

if len(january_rows) > 0:

    january_median_yield = (
        january_rows["median"].iloc[0]
    )

    january_empirical_generation = (
        test_capacity_kw * january_median_yield
    )

else:

    january_median_yield = None
    january_empirical_generation = None


# ============================================================
# COMPARE WITH CURRENT ML PREDICTION
# ============================================================

current_ml_prediction = 6138.67


print("\n" + "=" * 65)
print("CURRENT ML PREDICTION CHECK")
print("=" * 65)

print(
    f"\nCurrent ML prediction: "
    f"{current_ml_prediction:.2f} kWh/month"
)


if january_empirical_generation is not None:

    print(
        f"Empirical January estimate: "
        f"{january_empirical_generation:.2f} kWh/month"
    )

    prediction_ratio = (
        current_ml_prediction
        / january_empirical_generation
    )

    print(
        f"\nML prediction / empirical January estimate: "
        f"{prediction_ratio:.2f}x"
    )


# ============================================================
# GENERATION PER kWp CHECK
# ============================================================

ml_yield = (
    current_ml_prediction / test_capacity_kw
)


print("\n" + "=" * 65)
print("YIELD COMPARISON")
print("=" * 65)

print(
    f"\nCurrent ML implied yield: "
    f"{ml_yield:.2f} kWh/kWp/month"
)

print(
    f"Observed overall median yield: "
    f"{df['yield_kwh_per_kwp'].median():.2f} "
    f"kWh/kWp/month"
)

print(
    f"Observed overall mean yield: "
    f"{df['yield_kwh_per_kwp'].mean():.2f} "
    f"kWh/kWp/month"
)


# ============================================================
# FINAL
# ============================================================

print("\n" + "=" * 65)
print("SANITY CHECK COMPLETE")
print("=" * 65)