"""
SolarSmart - Capacity Sizing Baseline

Purpose:
    Provides a documented baseline recommendation range for residential
    rooftop solar capacity based on average monthly electricity consumption.

Source:
    Ministry of New and Renewable Energy (MNRE)
    PM Surya Ghar: Muft Bijli Yojana

Important:
    This is a rule-based baseline, NOT an ML model.
    It will later be combined with roof area, budget, location,
    future consumption and other feasibility constraints.
"""


def consumption_capacity_range(monthly_units):
    """
    Return the MNRE-based suitable rooftop solar capacity range.

    Parameters
    ----------
    monthly_units : float
        Average monthly electricity consumption in units (kWh).

    Returns
    -------
    dict
        Capacity recommendation information.
    """

    if monthly_units is None:
        raise ValueError("monthly_units cannot be None.")

    try:
        monthly_units = float(monthly_units)
    except (TypeError, ValueError):
        raise ValueError("monthly_units must be a numeric value.")

    if monthly_units < 0:
        raise ValueError("monthly_units cannot be negative.")

    # MNRE consumption-based guidance
    if monthly_units <= 150:
        return {
            "monthly_units": monthly_units,
            "capacity_min_kw": 1.0,
            "capacity_max_kw": 2.0,
            "capacity_guidance": "1-2 kW",
            "source_rule": "MNRE: 0-150 units/month"
        }

    elif monthly_units <= 300:
        return {
            "monthly_units": monthly_units,
            "capacity_min_kw": 2.0,
            "capacity_max_kw": 3.0,
            "capacity_guidance": "2-3 kW",
            "source_rule": "MNRE: 150-300 units/month"
        }

    else:
        return {
            "monthly_units": monthly_units,
            "capacity_min_kw": 3.0,
            "capacity_max_kw": None,
            "capacity_guidance": ">3 kW",
            "source_rule": "MNRE: >300 units/month"
        }


if __name__ == "__main__":

    test_consumptions = [100, 180, 250, 350, 500]

    print("\nSolarSmart - Capacity Sizing Baseline")
    print("-" * 50)

    for units in test_consumptions:

        result = consumption_capacity_range(units)

        print(
            f"{units:>4.0f} units/month -> "
            f"{result['capacity_guidance']}"
        )