"""
SolarSmart - Capacity Recommendation Calculator

Uses:
1. MNRE consumption-based capacity guidance
2. Empirical annual solar yield derived from the real UNISOLAR dataset

Important:
    This is a deterministic sizing baseline.
    It is NOT the final ML model.

No installation-cost or panel-area assumptions are hard-coded.
Those values must be provided as inputs when available.
"""

from pathlib import Path
import pandas as pd

from capacity_sizing import consumption_capacity_range


PROJECT_ROOT = Path(__file__).resolve().parents[1]

YIELD_PATH = (
    PROJECT_ROOT
    / "ml"
    / "results"
    / "capacity_monthly_yield.csv"
)


def load_empirical_annual_yield():
    """
    Calculate annual empirical solar yield from the
    monthly median yields.

    Returns
    -------
    float
        Annual median yield in kWh/kWp/year.
    """

    if not YIELD_PATH.exists():
        raise FileNotFoundError(
            f"Yield file not found:\n{YIELD_PATH}\n"
            "Run capacity_yield.py first."
        )

    df = pd.read_csv(YIELD_PATH)

    required = ["MonthNum", "median"]

    missing = [
        col for col in required
        if col not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing columns in yield file: {missing}"
        )

    if len(df) != 12:
        raise ValueError(
            f"Expected 12 months, found {len(df)}."
        )

    annual_yield = df["median"].sum()

    if annual_yield <= 0:
        raise ValueError(
            "Annual empirical yield must be positive."
        )

    return float(annual_yield)


def calculate_capacity(
    monthly_consumption_kwh,
    roof_area_m2=None,
    panel_wattage_w=None,
    panel_area_m2=None,
    budget_inr=None,
    panel_price_per_w=None,
    future_usage_growth_pct=0.0,
):
    """
    Calculate a feasible solar capacity recommendation.

    Parameters
    ----------
    monthly_consumption_kwh : float
        Current average monthly electricity consumption.

    roof_area_m2 : float, optional
        Usable roof area.

    panel_wattage_w : float, optional
        Wattage of the panel being considered.

    panel_area_m2 : float, optional
        Physical area occupied by one panel.

    budget_inr : float, optional
        Maximum available budget.

    panel_price_per_w : float, optional
        Panel-only price per watt.
        This is NOT total installation cost.

    future_usage_growth_pct : float
        Expected future increase in electricity consumption.
    """

    # -----------------------------
    # Validate consumption
    # -----------------------------

    if monthly_consumption_kwh <= 0:
        raise ValueError(
            "monthly_consumption_kwh must be greater than 0."
        )

    if future_usage_growth_pct < 0:
        raise ValueError(
            "future_usage_growth_pct cannot be negative."
        )

    # -----------------------------
    # Future consumption
    # -----------------------------

    adjusted_monthly_consumption = (
        monthly_consumption_kwh
        * (1 + future_usage_growth_pct / 100)
    )

    annual_consumption = (
        adjusted_monthly_consumption * 12
    )

    # -----------------------------
    # Empirical yield
    # -----------------------------

    annual_yield = load_empirical_annual_yield()

    # Capacity needed to offset annual consumption
    required_capacity_kw = (
        annual_consumption / annual_yield
    )

    # -----------------------------
    # MNRE guidance
    # -----------------------------

    mnre = consumption_capacity_range(
        adjusted_monthly_consumption
    )

    # -----------------------------
    # Feasibility limits
    # -----------------------------

    roof_max_capacity_kw = None

    if roof_area_m2 is not None:

        if roof_area_m2 <= 0:
            raise ValueError(
                "roof_area_m2 must be greater than 0."
            )

        if panel_wattage_w is None:
            raise ValueError(
                "panel_wattage_w is required when "
                "roof_area_m2 is provided."
            )

        if panel_area_m2 is None:
            raise ValueError(
                "panel_area_m2 is required when "
                "roof_area_m2 is provided."
            )

        if panel_wattage_w <= 0 or panel_area_m2 <= 0:
            raise ValueError(
                "Panel wattage and panel area must be positive."
            )

        panels_possible = (
            roof_area_m2 / panel_area_m2
        )

        roof_max_capacity_kw = (
            panels_possible
            * panel_wattage_w
            / 1000
        )

    # -----------------------------
    # Budget limit
    # -----------------------------

    budget_max_capacity_kw = None

    if budget_inr is not None:

        if budget_inr <= 0:
            raise ValueError(
                "budget_inr must be greater than 0."
            )

        if panel_price_per_w is None:
            raise ValueError(
                "panel_price_per_w is required when "
                "budget_inr is provided."
            )

        if panel_price_per_w <= 0:
            raise ValueError(
                "panel_price_per_w must be greater than 0."
            )

        # Panel-only budget constraint.
        # Installation/inverter/battery costs are NOT included.
        budget_max_capacity_kw = (
            budget_inr
            / (panel_price_per_w * 1000)
        )

    # -----------------------------
    # Determine feasible maximum
    # -----------------------------

    limits = [
        x for x in [
            roof_max_capacity_kw,
            budget_max_capacity_kw
        ]
        if x is not None
    ]

    feasible_max_capacity_kw = (
        min(limits)
        if limits
        else None
    )

    # -----------------------------
    # Final recommendation
    # -----------------------------

    recommended_capacity_kw = required_capacity_kw

    if feasible_max_capacity_kw is not None:
        recommended_capacity_kw = min(
            required_capacity_kw,
            feasible_max_capacity_kw
        )

    # -----------------------------
    # Check whether requirement
    # can actually be satisfied
    # -----------------------------

    capacity_limited = (
        feasible_max_capacity_kw is not None
        and required_capacity_kw > feasible_max_capacity_kw
    )

    return {
        "current_monthly_consumption_kwh":
            round(monthly_consumption_kwh, 2),

        "future_usage_growth_pct":
            round(future_usage_growth_pct, 2),

        "adjusted_monthly_consumption_kwh":
            round(adjusted_monthly_consumption, 2),

        "annual_consumption_kwh":
            round(annual_consumption, 2),

        "empirical_annual_yield_kwh_per_kwp":
            round(annual_yield, 2),

        "required_capacity_kw":
            round(required_capacity_kw, 3),

        "mnre_capacity_guidance":
            mnre["capacity_guidance"],

        "roof_max_capacity_kw":
            (
                round(roof_max_capacity_kw, 3)
                if roof_max_capacity_kw is not None
                else None
            ),

        "budget_max_capacity_kw":
            (
                round(budget_max_capacity_kw, 3)
                if budget_max_capacity_kw is not None
                else None
            ),

        "feasible_max_capacity_kw":
            (
                round(feasible_max_capacity_kw, 3)
                if feasible_max_capacity_kw is not None
                else None
            ),

        "recommended_capacity_kw":
            round(recommended_capacity_kw, 3),

        "capacity_limited_by_constraints":
            capacity_limited
    }


if __name__ == "__main__":

    print("\nSolarSmart - Capacity Recommendation")
    print("=" * 60)

    # Example household
    # These are TEST INPUTS only.
    # They are not training data.
    result = calculate_capacity(
        monthly_consumption_kwh=300,
        future_usage_growth_pct=10
    )

    print("\nTest household")
    print("-" * 60)

    for key, value in result.items():
        print(f"{key}: {value}")