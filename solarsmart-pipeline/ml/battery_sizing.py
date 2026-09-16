from pathlib import Path


# =========================================================
# SolarSmart - Battery Sizing
# Deterministic Engineering Calculation
# =========================================================

def calculate_battery_size(
    monthly_consumption_kwh,
    backup_hours=4,
    backup_load_pct=50,
    depth_of_discharge_pct=80,
    battery_efficiency_pct=90
):
    """
    Calculate recommended battery capacity in kWh.

    This is a deterministic engineering calculation.
    It is NOT an ML prediction.

    Parameters
    ----------
    monthly_consumption_kwh : float
        Average monthly electricity consumption.

    backup_hours : float
        Number of hours of backup required.

    backup_load_pct : float
        Percentage of average household load expected
        to be supplied during backup.

    depth_of_discharge_pct : float
        Usable percentage of nominal battery capacity.

    battery_efficiency_pct : float
        Battery round-trip/usable efficiency assumption.
    """

    if monthly_consumption_kwh <= 0:
        raise ValueError("Monthly consumption must be greater than 0.")

    if backup_hours <= 0:
        raise ValueError("Backup hours must be greater than 0.")

    if not 0 < backup_load_pct <= 100:
        raise ValueError("Backup load percentage must be between 0 and 100.")

    if not 0 < depth_of_discharge_pct <= 100:
        raise ValueError("Depth of discharge must be between 0 and 100.")

    if not 0 < battery_efficiency_pct <= 100:
        raise ValueError("Battery efficiency must be between 0 and 100.")

    # -----------------------------------------------------
    # Average daily household consumption
    # -----------------------------------------------------

    daily_consumption_kwh = monthly_consumption_kwh / 30

    # -----------------------------------------------------
    # Average hourly load
    # -----------------------------------------------------

    average_hourly_load_kw = daily_consumption_kwh / 24

    # -----------------------------------------------------
    # Estimated backup load
    # -----------------------------------------------------

    backup_load_kw = (
        average_hourly_load_kw
        * backup_load_pct
        / 100
    )

    # -----------------------------------------------------
    # Energy required during backup
    # -----------------------------------------------------

    backup_energy_kwh = (
        backup_load_kw
        * backup_hours
    )

    # -----------------------------------------------------
    # Account for battery DoD and efficiency
    # -----------------------------------------------------

    usable_fraction = (
        depth_of_discharge_pct / 100
    )

    efficiency_fraction = (
        battery_efficiency_pct / 100
    )

    recommended_battery_kwh = (
        backup_energy_kwh
        / (
            usable_fraction
            * efficiency_fraction
        )
    )

    # -----------------------------------------------------
    # Round to practical value
    # -----------------------------------------------------

    recommended_battery_kwh = round(
        recommended_battery_kwh,
        2
    )

    return {
        "monthly_consumption_kwh": round(
            monthly_consumption_kwh,
            2
        ),
        "daily_consumption_kwh": round(
            daily_consumption_kwh,
            2
        ),
        "average_hourly_load_kw": round(
            average_hourly_load_kw,
            3
        ),
        "backup_hours": backup_hours,
        "backup_load_pct": backup_load_pct,
        "backup_load_kw": round(
            backup_load_kw,
            3
        ),
        "backup_energy_kwh": round(
            backup_energy_kwh,
            2
        ),
        "depth_of_discharge_pct": depth_of_discharge_pct,
        "battery_efficiency_pct": battery_efficiency_pct,
        "recommended_battery_kwh":
            recommended_battery_kwh,
        "method": "deterministic_engineering_calculation"
    }


# =========================================================
# Test calculation
# =========================================================

if __name__ == "__main__":

    result = calculate_battery_size(
        monthly_consumption_kwh=300,
        backup_hours=4,
        backup_load_pct=50,
        depth_of_discharge_pct=80,
        battery_efficiency_pct=90
    )

    print()
    print("SolarSmart - Battery Sizing")
    print("=" * 60)

    for key, value in result.items():
        print(f"{key}: {value}")