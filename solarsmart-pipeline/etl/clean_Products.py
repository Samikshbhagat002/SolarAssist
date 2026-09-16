import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "raw"
    / "products"
    / "solar_products_scraped.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "solar_products_cleaned.csv"
)

print("=" * 75)
print("SolarSmart - Strict Product Data Cleaning & Validation")
print("=" * 75)

# ============================================================
# 1. LOAD RAW DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)

print(f"\nRaw scraped records: {len(df)}")

# ============================================================
# 2. NORMALIZE TEXT
# ============================================================

text_columns = [
    "manufacturer",
    "product_name",
    "category",
    "technology",
    "source_url",
]

for col in text_columns:
    df[col] = (
        df[col]
        .astype("string")
        .str.strip()
    )

df["category"] = df["category"].str.lower()

df["product_name_clean"] = (
    df["product_name"]
    .str.lower()
    .str.replace(r"\s+", " ", regex=True)
    .str.strip()
)

# ============================================================
# 3. REMOVE GENERIC / NON-PRODUCT PAGES
# ============================================================

non_product_keywords = [
    "registration",
    "dealer registration",
    "distributor registration",
    "distributorship",
    "dealer",
    "distributor",
    "contact",
    "contact us",
    "about us",
    "career",
    "careers",
    "franchise",
    "engineer visit",
    "service visit",
    "consultation",
    "installation service",
    "system integrator",
    "our products",
    "complete range",
    "complete saatvik range",
    "key products",
    "application based",
    "portfolio based",
    "the complete",
]

pattern = "|".join(
    map(lambda x: x.replace("|", r"\|"), non_product_keywords)
)

before = len(df)

df = df[
    ~df["product_name_clean"]
    .str.contains(pattern, na=False, regex=True)
].copy()

print(
    f"Removed generic/service/registration records: "
    f"{before - len(df)}"
)

# ============================================================
# 4. REMOVE DUPLICATES
# ============================================================

before = len(df)

df = df.drop_duplicates(
    subset=["manufacturer", "product_name"]
).copy()

print(f"Removed duplicate products: {before - len(df)}")

# ============================================================
# 5. NUMERIC CONVERSION
# ============================================================

numeric_columns = [
    "wattage_wp",
    "efficiency_percent",
    "price_inr",
    "price_per_watt",
]

for col in numeric_columns:
    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

# ============================================================
# 6. CATEGORY VALIDATION USING PRODUCT NAME
# ============================================================

# Strong category indicators.
panel_keywords = [
    "solar panel",
    "solar module",
    "pv module",
    "pv panel",
    "solar pv",
    "photovoltaic",
    "topcon module",
    "topcon solar",
    "mono perc module",
    "mono perc solar",
    "bifacial module",
    "bifacial solar",
    "monofacial module",
    "hjt solar",
    "hjt module",
]

inverter_keywords = [
    "inverter",
    "on-grid",
    "ongrid",
    "off-grid",
    "hybrid solar system",
    "hybrid inverter",
]

battery_keywords = [
    "battery",
    "lifepo4",
    "lithium battery",
    "energy storage",
    "bess",
    "storage system",
]

def contains_any(text, keywords):
    if pd.isna(text):
        return False

    text = str(text).lower()

    return any(
        keyword in text
        for keyword in keywords
    )


# Reclassify only when the product name provides strong evidence.
for idx, row in df.iterrows():

    name = row["product_name_clean"]

    if contains_any(name, battery_keywords):
        df.at[idx, "category"] = "battery"

    elif contains_any(name, inverter_keywords):
        df.at[idx, "category"] = "inverter"

    elif contains_any(name, panel_keywords):
        df.at[idx, "category"] = "panel"


# ============================================================
# 7. REMOVE NON-COMPARABLE TECH / CELL PRODUCTS
# ============================================================

non_module_keywords = [
    "solar cell",
    "solar cells",
    "cell technology",
    "cell technology",
    "solar cell technology",
    "technology",
    "charge controller",
    "charge controllers",
    "controller",
]

before = len(df)

non_module_mask = (
    df["product_name_clean"]
    .str.contains(
        "|".join(non_module_keywords),
        na=False,
        regex=True
    )
)

df = df[~non_module_mask].copy()

print(
    f"Removed cells/controllers/technology records: "
    f"{before - len(df)}"
)

# ============================================================
# 8. REMOVE PRODUCTS WITH GENERIC CATEGORY-PAGE NAMES
# ============================================================

generic_names = [
    "solar module",
    "solar inverter",
    "solar product",
    "solar products",
    "solar panels",
    "solar panel",
    "small solar modules",
    "bifacial solar modules",
    "mono perc solar modules",
    "flexible solar module",
]

before = len(df)

df = df[
    ~df["product_name_clean"].isin(generic_names)
].copy()

print(
    f"Removed generic category-page products: "
    f"{before - len(df)}"
)

# ============================================================
# 9. PANEL DATA VALIDATION
# ============================================================

panel_mask = df["category"] == "panel"

# Exact panel wattage should normally be realistic.
# We DO NOT convert ranges into fake exact values.

invalid_panel_wattage = (
    panel_mask
    & df["wattage_wp"].notna()
    & (
        (df["wattage_wp"] < 20)
        | (df["wattage_wp"] > 1000)
    )
)

df.loc[
    invalid_panel_wattage,
    "wattage_wp"
] = np.nan

# Valid solar-module efficiency range.
invalid_panel_efficiency = (
    panel_mask
    & df["efficiency_percent"].notna()
    & (
        (df["efficiency_percent"] < 10)
        | (df["efficiency_percent"] > 35)
    )
)

df.loc[
    invalid_panel_efficiency,
    "efficiency_percent"
] = np.nan

# ============================================================
# 10. NON-PANEL PRODUCTS MUST NOT HAVE PANEL WATTAGE
# ============================================================

non_panel_mask = df["category"] != "panel"

df.loc[
    non_panel_mask,
    "wattage_wp"
] = np.nan

df.loc[
    non_panel_mask,
    "efficiency_percent"
] = np.nan

df.loc[
    non_panel_mask,
    "price_per_watt"
] = np.nan

# ============================================================
# 11. REMOVE FAKE / INVALID PRICES
# ============================================================

df.loc[
    df["price_inr"] <= 0,
    "price_inr"
] = np.nan

# ============================================================
# 12. PRICE PER WATT
# ============================================================

df["price_per_watt"] = np.where(
    (
        (df["category"] == "panel")
        & df["wattage_wp"].notna()
        & (df["wattage_wp"] > 0)
        & df["price_inr"].notna()
    ),
    df["price_inr"] / df["wattage_wp"],
    np.nan
)

# ============================================================
# 13. REMOVE CLEARLY WRONG PANEL PRICE/WATT VALUES
# ============================================================

# We don't invent prices.
# We only invalidate obviously impossible values.

invalid_ppw = (
    (df["category"] == "panel")
    & df["price_per_watt"].notna()
    & (
        (df["price_per_watt"] <= 0)
        | (df["price_per_watt"] > 200)
    )
)

df.loc[
    invalid_ppw,
    "price_per_watt"
] = np.nan

# ============================================================
# 14. REMOVE PRODUCTS THAT ARE NOT USEFUL FOR PRODUCT CATALOG
# ============================================================

# Very small DIY modules are not useful for the residential
# rooftop recommendation engine.
#
# We keep them only if they are genuine solar panels.
# Therefore we do NOT automatically delete them here.

# ============================================================
# 15. FINAL COLUMN SELECTION
# ============================================================

df = df[
    [
        "manufacturer",
        "product_name",
        "category",
        "technology",
        "wattage_wp",
        "efficiency_percent",
        "price_inr",
        "price_per_watt",
        "source_url",
    ]
].copy()

# ============================================================
# 16. SORT
# ============================================================

df = df.sort_values(
    by=[
        "manufacturer",
        "category",
        "product_name",
    ]
).reset_index(drop=True)

# ============================================================
# 17. SAVE
# ============================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# 18. FINAL REPORT
# ============================================================

print("\n" + "=" * 75)
print("FINAL CLEAN DATASET SUMMARY")
print("=" * 75)

print(
    f"\nFinal valid records: {len(df)}"
)

print("\nProducts by category:")
print(
    df["category"]
    .value_counts()
    .to_string()
)

print("\nProducts by manufacturer:")
print(
    df["manufacturer"]
    .value_counts()
    .to_string()
)

print("\nManufacturer × Category:")
print(
    pd.crosstab(
        df["manufacturer"],
        df["category"]
    ).to_string()
)

print("\nData completeness:")

completeness = (
    df.notna()
    .mean()
    .mul(100)
    .round(1)
)

print(
    completeness.to_string()
)

print("\nMissing values:")

print(
    df.isna()
    .sum()
    .to_string()
)

# ============================================================
# 19. PANEL QUALITY REPORT
# ============================================================

panels = df[
    df["category"] == "panel"
].copy()

print("\n" + "=" * 75)
print("PANEL CATALOG QUALITY")
print("=" * 75)

print(
    f"\nValid panel products: {len(panels)}"
)

if len(panels) > 0:

    print(
        "\nPanel attribute completeness:"
    )

    print(
        panels[
            [
                "wattage_wp",
                "efficiency_percent",
                "price_inr",
                "price_per_watt",
                "technology",
                "source_url",
            ]
        ]
        .notna()
        .mean()
        .mul(100)
        .round(1)
        .to_string()
    )

    print(
        "\nFinal panel products:"
    )

    print(
        panels[
            [
                "manufacturer",
                "product_name",
                "wattage_wp",
                "efficiency_percent",
                "price_inr",
                "price_per_watt",
            ]
        ]
        .to_string(index=False)
    )

# ============================================================
# 20. SANITY CHECKS
# ============================================================

print("\n" + "=" * 75)
print("SANITY CHECKS")
print("=" * 75)

wrong_wattage = df[
    (df["category"] != "panel")
    & df["wattage_wp"].notna()
]

wrong_efficiency = df[
    (df["category"] != "panel")
    & df["efficiency_percent"].notna()
]

print(
    f"\nNon-panel records with wattage: "
    f"{len(wrong_wattage)}"
)

print(
    f"Non-panel records with efficiency: "
    f"{len(wrong_efficiency)}"
)

print(
    f"\nPanel records: {len(panels)}"
)

print(
    f"Panel records with wattage: "
    f"{panels['wattage_wp'].notna().sum()}"
)

print(
    f"Panel records with efficiency: "
    f"{panels['efficiency_percent'].notna().sum()}"
)

print(
    f"Panel records with price: "
    f"{panels['price_inr'].notna().sum()}"
)

print("\nSaved cleaned dataset:")
print(OUTPUT_FILE)

print("\n[DONE] Strict product cleaning completed.")

print("=" * 75)