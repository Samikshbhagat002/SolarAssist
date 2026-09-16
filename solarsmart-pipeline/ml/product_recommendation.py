"""
SolarSmart - Product Recommendation Engine
============================================

Purpose:
    Recommend solar panels, inverters, and batteries from the actual
    SolarSmart SQL Server product catalog.

Data source:
    SQL Server database: SolarSmart
    Table: dbo.SolarProducts
    Table: dbo.Manufacturers

Important design principles:
    - Never fabricate missing product values.
    - Inverter capacity is extracted only when explicitly present
      in product_name.
    - Battery capacity is extracted only when explicitly present
      in product_name.
    - Panel pack quantities are detected from product_name.
    - Pack prices are converted to estimated per-panel prices only
      when a pack quantity is explicitly stated.
    - Missing prices are not invented.
    - Total equipment budget = panels + inverter + battery.
    - Installation cost and subsidy are NOT included here.
"""

from __future__ import annotations

import os
import re
import math
import argparse
from typing import Optional, Dict, List, Any

import numpy as np
import pandas as pd
import pyodbc


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

SERVER = os.getenv("SOLARSMART_SQL_SERVER", r"localhost\SQLEXPRESS")
DATABASE = os.getenv("SOLARSMART_DATABASE", "SolarSmart")
DRIVER = os.getenv(
    "SOLARSMART_SQL_DRIVER",
    "ODBC Driver 17 for SQL Server"
)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    """
    Create a connection to the SolarSmart SQL Server database.

    Uses Windows Authentication.
    """

    connection_string = (
        f"DRIVER={{{DRIVER}}};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        "Trusted_Connection=yes;"
    )

    return pyodbc.connect(connection_string)


# ============================================================
# LOAD PRODUCT CATALOG
# ============================================================

def load_products() -> pd.DataFrame:
    """
    Load actual products from SQL Server.
    """

    query = """
    SELECT
        p.product_id,
        m.name,
        p.product_name,
        p.category,
        p.panel_type,
        p.wattage_w,
        p.efficiency_pct,
        p.price_inr,
        p.warranty_years,
        p.length_mm,
        p.width_mm,
        p.source_url,
        p.scraped_at
    FROM dbo.SolarProducts p
    LEFT JOIN dbo.Manufacturers m
        ON p.manufacturer_id = m.manufacturer_id
    ORDER BY
        p.category,
        m.name,
        p.product_id;
    """

    with get_connection() as conn:
        df = pd.read_sql(query, conn)

    if df.empty:
        raise ValueError(
            "SolarProducts table is empty. "
            "Load the product catalog before running recommendations."
        )

    return df


# ============================================================
# TEXT HELPERS
# ============================================================

def clean_text(value: Any) -> str:
    """
    Safely convert a value to lowercase text.
    """

    if pd.isna(value):
        return ""

    return str(value).strip().lower()


# ============================================================
# EXTRACT INVERTER CAPACITY
# ============================================================

def extract_inverter_capacity_kw(product_name: str) -> Optional[float]:
    """
    Extract inverter capacity only when explicitly written
    in the product name.

    Examples:

        "Fusion 5 kW / 48 V Hybrid Solar Inverter"
            -> 5.0

        "Fusion 10 kW, 3 ø on grid solar inverter"
            -> 10.0

        "Fusion 100 kw on grid solar inverter"
            -> 100.0

    Returns:
        Capacity in kW, or None if no explicit capacity is found.
    """

    text = clean_text(product_name)

    # Prefer values explicitly followed by kW.
    matches = re.findall(
        r"(?<![\d.])(\d+(?:\.\d+)?)\s*kw\b",
        text,
        flags=re.IGNORECASE
    )

    if matches:
        return float(matches[0])

    return None


# ============================================================
# EXTRACT BATTERY CAPACITY
# ============================================================

def extract_battery_capacity_kwh(product_name: str) -> Optional[float]:
    """
    Extract battery energy capacity only when explicitly stated
    in the product name.

    Examples:

        "CAML 5.12 kWh ..."
            -> 5.12

        "CAML 20kWh High-Voltage..."
            -> 20.0

        "CAML 125kW/261kWh All-in-One BESS..."
            -> 261.0

    Important:
        If both kW and kWh appear, only the kWh value is used.
    """

    text = clean_text(product_name)

    matches = re.findall(
        r"(?<![\d.])(\d+(?:\.\d+)?)\s*kwh\b",
        text,
        flags=re.IGNORECASE
    )

    if matches:
        return float(matches[-1])

    return None


# ============================================================
# DETECT PANEL PACK SIZE
# ============================================================

def extract_panel_pack_quantity(product_name: str) -> int:
    """
    Detect explicitly stated panel pack quantity.

    Examples:

        "(Pack of 2)"  -> 2
        "(Pack of 36)" -> 36
        "(Pack of 31)" -> 31
        "(Pack of 33)" -> 33

    If no pack quantity is explicitly present:
        return 1
    """

    text = clean_text(product_name)

    match = re.search(
        r"pack\s+of\s+(\d+)",
        text,
        flags=re.IGNORECASE
    )

    if match:
        return int(match.group(1))

    return 1


# ============================================================
# NORMALIZE PANEL PRICE
# ============================================================

def calculate_panel_unit_price(
    price_inr: Any,
    product_name: str
) -> Optional[float]:
    """
    Convert an explicitly stated pack price to per-panel price.

    Example:

        Pack of 36
        Price = ₹383,644

        Per-panel price =
        383644 / 36

    If there is no explicit pack quantity, the database price
    is treated as the individual product price.

    Missing prices remain missing.
    """

    if pd.isna(price_inr):
        return None

    price = float(price_inr)

    pack_quantity = extract_panel_pack_quantity(product_name)

    if pack_quantity <= 0:
        return None

    return price / pack_quantity


# ============================================================
# ENRICH PRODUCT DATA
# ============================================================

def enrich_products(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add derived fields needed by the recommendation engine.
    """

    result = df.copy()

    result["category"] = (
        result["category"]
        .fillna("")
        .astype(str)
        .str.lower()
        .str.strip()
    )

    result["inverter_capacity_kw"] = np.nan
    result["battery_capacity_kwh"] = np.nan
    result["panel_pack_quantity"] = 1
    result["panel_unit_price_inr"] = np.nan

    inverter_mask = result["category"] == "inverter"
    battery_mask = result["category"] == "battery"
    panel_mask = result["category"] == "panel"

    result.loc[inverter_mask, "inverter_capacity_kw"] = (
        result.loc[inverter_mask, "product_name"]
        .apply(extract_inverter_capacity_kw)
    )

    result.loc[battery_mask, "battery_capacity_kwh"] = (
        result.loc[battery_mask, "product_name"]
        .apply(extract_battery_capacity_kwh)
    )

    result.loc[panel_mask, "panel_pack_quantity"] = (
        result.loc[panel_mask, "product_name"]
        .apply(extract_panel_pack_quantity)
    )

    result.loc[panel_mask, "panel_unit_price_inr"] = (
        result.loc[panel_mask]
        .apply(
            lambda row: calculate_panel_unit_price(
                row["price_inr"],
                row["product_name"]
            ),
            axis=1
        )
    )

    return result


# ============================================================
# NORMALIZATION
# ============================================================

def min_max_score(
    values: pd.Series,
    higher_is_better: bool = True
) -> pd.Series:
    """
    Min-max normalize a series to 0-1.

    Missing values remain NaN.

    If all available values are identical, every available
    value receives 1.0.
    """

    numeric = pd.to_numeric(values, errors="coerce")

    valid = numeric.dropna()

    if valid.empty:
        return pd.Series(
            np.nan,
            index=values.index,
            dtype=float
        )

    minimum = valid.min()
    maximum = valid.max()

    if math.isclose(float(minimum), float(maximum)):
        score = pd.Series(
            np.nan,
            index=values.index,
            dtype=float
        )
        score.loc[numeric.notna()] = 1.0
        return score

    if higher_is_better:
        return (numeric - minimum) / (maximum - minimum)

    return (maximum - numeric) / (maximum - minimum)


# ============================================================
# TECHNOLOGY SCORE
# ============================================================

def technology_score(panel_type: Any) -> float:
    """
    Technology preference score.

    This is NOT a manufacturer quality score.

    It only rewards explicitly stated modern/high-efficiency
    technology keywords in the database.

    No score is assigned when technology information is absent.
    """

    text = clean_text(panel_type)

    if not text:
        return np.nan

    score = 0.0

    # Explicit technology terms.
    if "n-type" in text:
        score += 0.30

    if "topcon" in text:
        score += 0.30

    if "hjt" in text:
        score += 0.25

    if "bifacial" in text:
        score += 0.10

    if "dual glass" in text:
        score += 0.05

    return min(score, 1.0)


# ============================================================
# PANEL RECOMMENDATION
# ============================================================

def recommend_panels(
    products: pd.DataFrame,
    recommended_capacity_kw: float,
    budget_inr: Optional[float] = None,
    top_n: int = 3
) -> List[Dict[str, Any]]:
    """
    Recommend solar panels for the requested system capacity.

    Hard requirements:
        - category = panel
        - wattage must exist
        - price must exist

    Ranking factors:
        1. Capacity fit
        2. Efficiency
        3. Price/value
        4. Technology

    The number of panels is calculated using ceiling().
    """

    panels = products[
        products["category"] == "panel"
    ].copy()

    panels["wattage_w"] = pd.to_numeric(
        panels["wattage_w"],
        errors="coerce"
    )

    panels["efficiency_pct"] = pd.to_numeric(
        panels["efficiency_pct"],
        errors="coerce"
    )

    panels["panel_unit_price_inr"] = pd.to_numeric(
        panels["panel_unit_price_inr"],
        errors="coerce"
    )

    # Required fields for actual recommendation.
    panels = panels[
        panels["wattage_w"].notna()
        & panels["panel_unit_price_inr"].notna()
        & (panels["wattage_w"] > 0)
        & (panels["panel_unit_price_inr"] > 0)
    ].copy()

    if panels.empty:
        return []

    target_watts = recommended_capacity_kw * 1000.0

    # Number of panels required.
    panels["required_panel_count"] = np.ceil(
        target_watts / panels["wattage_w"]
    ).astype(int)

    panels["actual_panel_capacity_kw"] = (
        panels["required_panel_count"]
        * panels["wattage_w"]
        / 1000.0
    )

    panels["panel_equipment_cost_inr"] = (
        panels["required_panel_count"]
        * panels["panel_unit_price_inr"]
    )

    # Capacity oversizing penalty.
    panels["capacity_difference_kw"] = (
        panels["actual_panel_capacity_kw"]
        - recommended_capacity_kw
    )

    max_difference = panels["capacity_difference_kw"].max()

    if max_difference == 0:
        panels["capacity_fit_score"] = 1.0
    else:
        panels["capacity_fit_score"] = (
            1
            - panels["capacity_difference_kw"]
            / (max_difference + recommended_capacity_kw)
        )

    # Efficiency score.
    panels["efficiency_score"] = min_max_score(
        panels["efficiency_pct"],
        higher_is_better=True
    )

    # Price score: lower cost per installed watt is better.
    panels["price_per_watt_inr"] = (
        panels["panel_unit_price_inr"]
        / panels["wattage_w"]
    )

    panels["price_score"] = min_max_score(
        panels["price_per_watt_inr"],
        higher_is_better=False
    )

    # Technology score.
    panels["technology_score"] = panels[
        "panel_type"
    ].apply(technology_score)

    # Fill missing optional scoring components with neutral value.
    panels["efficiency_score"] = panels[
        "efficiency_score"
    ].fillna(0.5)

    panels["technology_score"] = panels[
        "technology_score"
    ].fillna(0.5)

    # Weighted MCDA score.
    panels["recommendation_score"] = (
        0.35 * panels["capacity_fit_score"]
        + 0.30 * panels["efficiency_score"]
        + 0.20 * panels["price_score"]
        + 0.15 * panels["technology_score"]
    )

    # Budget constraint for panels.
    if budget_inr is not None:
        panels = panels[
            panels["panel_equipment_cost_inr"] <= budget_inr
        ].copy()

    if panels.empty:
        return []

    panels = panels.sort_values(
        by=[
            "recommendation_score",
            "efficiency_pct"
        ],
        ascending=[False, False]
    )

    results = []

    for _, row in panels.head(top_n).iterrows():

        results.append({
            "product_id": int(row["product_id"]),
            "manufacturer": row["name"],
            "product_name": row["product_name"],
            "category": "panel",

            "wattage_w": float(row["wattage_w"]),
            "efficiency_pct": (
                float(row["efficiency_pct"])
                if pd.notna(row["efficiency_pct"])
                else None
            ),

            "panel_type": row["panel_type"],

            "panel_pack_quantity": int(
                row["panel_pack_quantity"]
            ),

            "unit_price_inr": round(
                float(row["panel_unit_price_inr"]),
                2
            ),

            "required_panel_count": int(
                row["required_panel_count"]
            ),

            "actual_capacity_kw": round(
                float(row["actual_panel_capacity_kw"]),
                3
            ),

            "equipment_cost_inr": round(
                float(row["panel_equipment_cost_inr"]),
                2
            ),

            "recommendation_score": round(
                float(row["recommendation_score"]),
                4
            ),

            "source_url": row["source_url"]
        })

    return results


# ============================================================
# INVERTER RECOMMENDATION
# ============================================================

def recommend_inverters(
    products: pd.DataFrame,
    recommended_capacity_kw: float,
    remaining_budget_inr: Optional[float] = None,
    top_n: int = 3
) -> List[Dict[str, Any]]:
    """
    Recommend inverters whose explicitly stated capacity is
    sufficient for the recommended solar capacity.

    Only products with:
        - category = inverter
        - extractable kW capacity
        - price

    are considered.

    Inverter capacity is extracted from product_name.
    """

    inverters = products[
        products["category"] == "inverter"
    ].copy()

    inverters["inverter_capacity_kw"] = pd.to_numeric(
        inverters["inverter_capacity_kw"],
        errors="coerce"
    )

    inverters["price_inr"] = pd.to_numeric(
        inverters["price_inr"],
        errors="coerce"
    )

    inverters = inverters[
        inverters["inverter_capacity_kw"].notna()
        & inverters["price_inr"].notna()
        & (inverters["inverter_capacity_kw"] > 0)
        & (inverters["price_inr"] > 0)
    ].copy()

    if inverters.empty:
        return []

    # Inverter must be >= recommended system capacity.
    inverters = inverters[
        inverters["inverter_capacity_kw"]
        >= recommended_capacity_kw
    ].copy()

    if inverters.empty:
        return []

    # Capacity oversizing.
    inverters["capacity_difference_kw"] = (
        inverters["inverter_capacity_kw"]
        - recommended_capacity_kw
    )

    max_difference = inverters["capacity_difference_kw"].max()

    if max_difference == 0:
        inverters["capacity_fit_score"] = 1.0
    else:
        inverters["capacity_fit_score"] = (
            1
            - inverters["capacity_difference_kw"]
            / (
                max_difference
                + recommended_capacity_kw
            )
        )

    # Lower price is better.
    inverters["price_score"] = min_max_score(
        inverters["price_inr"],
        higher_is_better=False
    )

    # Hybrid inverter gets a small preference when explicitly
    # stated in the product name.
    inverters["hybrid_score"] = (
        inverters["product_name"]
        .apply(
            lambda x: (
                1.0
                if "hybrid" in clean_text(x)
                else 0.0
            )
        )
    )

    # Weighted score.
    inverters["recommendation_score"] = (
        0.60 * inverters["capacity_fit_score"]
        + 0.30 * inverters["price_score"]
        + 0.10 * inverters["hybrid_score"]
    )

    if remaining_budget_inr is not None:
        inverters = inverters[
            inverters["price_inr"]
            <= remaining_budget_inr
        ].copy()

    if inverters.empty:
        return []

    inverters = inverters.sort_values(
        by=[
            "recommendation_score",
            "capacity_difference_kw"
        ],
        ascending=[False, True]
    )

    results = []

    for _, row in inverters.head(top_n).iterrows():

        results.append({
            "product_id": int(row["product_id"]),
            "manufacturer": row["name"],
            "product_name": row["product_name"],
            "category": "inverter",

            "capacity_kw": float(
                row["inverter_capacity_kw"]
            ),

            "price_inr": round(
                float(row["price_inr"]),
                2
            ),

            "capacity_difference_kw": round(
                float(row["capacity_difference_kw"]),
                3
            ),

            "recommendation_score": round(
                float(row["recommendation_score"]),
                4
            ),

            "source_url": row["source_url"]
        })

    return results


# ============================================================
# BATTERY RECOMMENDATION
# ============================================================

def recommend_batteries(
    products: pd.DataFrame,
    required_battery_kwh: float,
    remaining_budget_inr: Optional[float] = None,
    top_n: int = 3
) -> List[Dict[str, Any]]:
    """
    Recommend batteries whose explicitly stated capacity is
    sufficient for the required battery size.

    Battery capacity is extracted from product_name.

    Products without explicit kWh capacity or price are excluded.
    """

    batteries = products[
        products["category"] == "battery"
    ].copy()

    batteries["battery_capacity_kwh"] = pd.to_numeric(
        batteries["battery_capacity_kwh"],
        errors="coerce"
    )

    batteries["price_inr"] = pd.to_numeric(
        batteries["price_inr"],
        errors="coerce"
    )

    batteries = batteries[
        batteries["battery_capacity_kwh"].notna()
        & batteries["price_inr"].notna()
        & (batteries["battery_capacity_kwh"] > 0)
        & (batteries["price_inr"] > 0)
    ].copy()

    if batteries.empty:
        return []

    # Battery capacity must meet required backup capacity.
    batteries = batteries[
        batteries["battery_capacity_kwh"]
        >= required_battery_kwh
    ].copy()

    if batteries.empty:
        return []

    batteries["capacity_difference_kwh"] = (
        batteries["battery_capacity_kwh"]
        - required_battery_kwh
    )

    max_difference = batteries["capacity_difference_kwh"].max()

    if max_difference == 0:
        batteries["capacity_fit_score"] = 1.0
    else:
        batteries["capacity_fit_score"] = (
            1
            - batteries["capacity_difference_kwh"]
            / (
                max_difference
                + required_battery_kwh
            )
        )

    # Price per kWh is more meaningful than absolute price.
    batteries["price_per_kwh"] = (
        batteries["price_inr"]
        / batteries["battery_capacity_kwh"]
    )

    batteries["price_score"] = min_max_score(
        batteries["price_per_kwh"],
        higher_is_better=False
    )

    # Explicit LiFePO4 preference because it is stated in
    # the actual product name.
    batteries["lifepo4_score"] = (
        batteries["product_name"]
        .apply(
            lambda x: (
                1.0
                if "lifepo4" in clean_text(x)
                else 0.0
            )
        )
    )

    batteries["recommendation_score"] = (
        0.60 * batteries["capacity_fit_score"]
        + 0.30 * batteries["price_score"]
        + 0.10 * batteries["lifepo4_score"]
    )

    if remaining_budget_inr is not None:
        batteries = batteries[
            batteries["price_inr"]
            <= remaining_budget_inr
        ].copy()

    if batteries.empty:
        return []

    batteries = batteries.sort_values(
        by=[
            "recommendation_score",
            "capacity_difference_kwh"
        ],
        ascending=[False, True]
    )

    results = []

    for _, row in batteries.head(top_n).iterrows():

        results.append({
            "product_id": int(row["product_id"]),
            "manufacturer": row["name"],
            "product_name": row["product_name"],
            "category": "battery",

            "capacity_kwh": float(
                row["battery_capacity_kwh"]
            ),

            "price_inr": round(
                float(row["price_inr"]),
                2
            ),

            "price_per_kwh": round(
                float(row["price_per_kwh"]),
                2
            ),

            "capacity_difference_kwh": round(
                float(row["capacity_difference_kwh"]),
                3
            ),

            "recommendation_score": round(
                float(row["recommendation_score"]),
                4
            ),

            "source_url": row["source_url"]
        })

    return results


# ============================================================
# COMPLETE RECOMMENDATION
# ============================================================

def recommend_solar_products(
    recommended_capacity_kw: float,
    budget_inr: Optional[float] = None,
    battery_required: bool = False,
    required_battery_kwh: Optional[float] = None,
    top_n: int = 3
) -> Dict[str, Any]:
    """
    Main recommendation function.

    Parameters
    ----------
    recommended_capacity_kw:
        Recommended solar system capacity from capacity model.

    budget_inr:
        Total equipment budget:
            panels + inverter + battery

    battery_required:
        Whether the user requested battery storage.

    required_battery_kwh:
        Required battery capacity from battery sizing module.

    top_n:
        Number of recommendations per category.

    Returns
    -------
    Dictionary containing recommended panels, inverters,
    batteries, and metadata.
    """

    if recommended_capacity_kw <= 0:
        raise ValueError(
            "recommended_capacity_kw must be greater than 0."
        )

    if budget_inr is not None and budget_inr <= 0:
        raise ValueError(
            "budget_inr must be greater than 0."
        )

    if battery_required:
        if required_battery_kwh is None:
            raise ValueError(
                "required_battery_kwh is required when "
                "battery_required=True."
            )

        if required_battery_kwh <= 0:
            raise ValueError(
                "required_battery_kwh must be greater than 0."
            )

    # --------------------------------------------------------
    # LOAD ACTUAL DATABASE
    # --------------------------------------------------------

    products = load_products()

    products = enrich_products(products)

    # --------------------------------------------------------
    # PANEL RECOMMENDATION
    # --------------------------------------------------------

    panel_results = recommend_panels(
        products=products,
        recommended_capacity_kw=recommended_capacity_kw,
        budget_inr=budget_inr,
        top_n=top_n
    )

    # --------------------------------------------------------
    # DETERMINE AVAILABLE BUDGET FOR INVERTER
    # --------------------------------------------------------

    inverter_budget = None

    if budget_inr is not None and panel_results:

        # The cheapest viable panel configuration is used
        # to establish a feasible remaining budget.
        cheapest_panel_cost = min(
            item["equipment_cost_inr"]
            for item in panel_results
        )

        inverter_budget = (
            budget_inr
            - cheapest_panel_cost
        )

    # --------------------------------------------------------
    # INVERTER RECOMMENDATION
    # --------------------------------------------------------

    inverter_results = recommend_inverters(
        products=products,
        recommended_capacity_kw=recommended_capacity_kw,
        remaining_budget_inr=inverter_budget,
        top_n=top_n
    )

    # --------------------------------------------------------
    # BATTERY RECOMMENDATION
    # --------------------------------------------------------

    battery_results = []

    if battery_required:

        battery_budget = None

        if budget_inr is not None:

            cheapest_panel_cost = (
                min(
                    (
                        item["equipment_cost_inr"]
                        for item in panel_results
                    ),
                    default=0
                )
            )

            cheapest_inverter_cost = (
                min(
                    (
                        item["price_inr"]
                        for item in inverter_results
                    ),
                    default=0
                )
            )

            battery_budget = (
                budget_inr
                - cheapest_panel_cost
                - cheapest_inverter_cost
            )

        battery_results = recommend_batteries(
            products=products,
            required_battery_kwh=required_battery_kwh,
            remaining_budget_inr=battery_budget,
            top_n=top_n
        )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {
        "recommended_capacity_kw": round(
            recommended_capacity_kw,
            3
        ),

        "budget_inr": (
            round(float(budget_inr), 2)
            if budget_inr is not None
            else None
        ),

        "budget_type": "total_equipment_budget",

        "battery_required": battery_required,

        "required_battery_kwh": (
            round(float(required_battery_kwh), 3)
            if required_battery_kwh is not None
            else None
        ),

        "recommendations": {
            "panels": panel_results,
            "inverters": inverter_results,
            "batteries": battery_results
        },

        "data_policy": {
            "missing_values_fabricated": False,
            "inverter_capacity_source": (
                "explicit product_name"
            ),
            "battery_capacity_source": (
                "explicit product_name"
            ),
            "panel_pack_quantity_source": (
                "explicit product_name"
            ),
            "installation_cost_included": False,
            "subsidy_included": False
        }
    }


# ============================================================
# PRINT RESULTS
# ============================================================

def print_results(result: Dict[str, Any]) -> None:
    """
    Human-readable console output.
    """

    print()
    print("=" * 70)
    print("SolarSmart - Product Recommendation Engine")
    print("=" * 70)

    print(
        f"Recommended solar capacity: "
        f"{result['recommended_capacity_kw']} kW"
    )

    if result["budget_inr"] is not None:
        print(
            f"Total equipment budget: "
            f"₹{result['budget_inr']:,.2f}"
        )

    print()

    # --------------------------------------------------------
    # PANELS
    # --------------------------------------------------------

    print("-" * 70)
    print("TOP PANEL RECOMMENDATIONS")
    print("-" * 70)

    panels = result["recommendations"]["panels"]

    if not panels:
        print("No suitable panel found under the supplied constraints.")
    else:

        for index, item in enumerate(panels, start=1):

            print()
            print(f"#{index} {item['manufacturer']}")
            print(f"Product: {item['product_name']}")
            print(
                f"Wattage: {item['wattage_w']} W"
            )
            print(
                f"Efficiency: "
                f"{item['efficiency_pct']}%"
                if item["efficiency_pct"] is not None
                else "Efficiency: Not available"
            )
            print(
                f"Unit price: ₹{item['unit_price_inr']:,.2f}"
            )
            print(
                f"Panels required: "
                f"{item['required_panel_count']}"
            )
            print(
                f"Actual capacity: "
                f"{item['actual_capacity_kw']} kW"
            )
            print(
                f"Panel equipment cost: "
                f"₹{item['equipment_cost_inr']:,.2f}"
            )
            print(
                f"Recommendation score: "
                f"{item['recommendation_score']}"
            )

    # --------------------------------------------------------
    # INVERTERS
    # --------------------------------------------------------

    print()
    print("-" * 70)
    print("TOP INVERTER RECOMMENDATIONS")
    print("-" * 70)

    inverters = result["recommendations"]["inverters"]

    if not inverters:
        print(
            "No suitable inverter found under the supplied constraints."
        )
    else:

        for index, item in enumerate(inverters, start=1):

            print()
            print(f"#{index} {item['manufacturer']}")
            print(f"Product: {item['product_name']}")
            print(
                f"Capacity: "
                f"{item['capacity_kw']} kW"
            )
            print(
                f"Price: ₹{item['price_inr']:,.2f}"
            )
            print(
                f"Capacity difference: "
                f"{item['capacity_difference_kw']} kW"
            )
            print(
                f"Recommendation score: "
                f"{item['recommendation_score']}"
            )

    # --------------------------------------------------------
    # BATTERIES
    # --------------------------------------------------------

    if result["battery_required"]:

        print()
        print("-" * 70)
        print("TOP BATTERY RECOMMENDATIONS")
        print("-" * 70)

        batteries = result["recommendations"]["batteries"]

        if not batteries:
            print(
                "No suitable battery found under the supplied constraints."
            )
        else:

            for index, item in enumerate(batteries, start=1):

                print()
                print(f"#{index} {item['manufacturer']}")
                print(f"Product: {item['product_name']}")
                print(
                    f"Capacity: "
                    f"{item['capacity_kwh']} kWh"
                )
                print(
                    f"Price: ₹{item['price_inr']:,.2f}"
                )
                print(
                    f"Price per kWh: "
                    f"₹{item['price_per_kwh']:,.2f}"
                )
                print(
                    f"Capacity difference: "
                    f"{item['capacity_difference_kwh']} kWh"
                )
                print(
                    f"Recommendation score: "
                    f"{item['recommendation_score']}"
                )

    print()
    print("=" * 70)
    print("Recommendation completed.")
    print("=" * 70)
    print()


# ============================================================
# COMMAND LINE TEST
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "SolarSmart product recommendation engine"
        )
    )

    parser.add_argument(
        "--capacity",
        type=float,
        required=True,
        help="Recommended solar capacity in kW"
    )

    parser.add_argument(
        "--budget",
        type=float,
        default=None,
        help="Total equipment budget in INR"
    )

    parser.add_argument(
        "--battery",
        action="store_true",
        help="Enable battery recommendation"
    )

    parser.add_argument(
        "--battery-kwh",
        type=float,
        default=None,
        help="Required battery capacity in kWh"
    )

    parser.add_argument(
        "--top",
        type=int,
        default=3,
        help="Number of recommendations per category"
    )

    args = parser.parse_args()

    result = recommend_solar_products(
        recommended_capacity_kw=args.capacity,
        budget_inr=args.budget,
        battery_required=args.battery,
        required_battery_kwh=args.battery_kwh,
        top_n=args.top
    )

    print_results(result)


if __name__ == "__main__":
    main()