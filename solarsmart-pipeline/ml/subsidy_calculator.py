import argparse
import pyodbc


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    connection_string = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\\SQLEXPRESS;"
        "DATABASE=SolarSmart;"
        "Trusted_Connection=yes;"
    )

    return pyodbc.connect(connection_string)

# ============================================================
# LOAD SUBSIDY RULES
# ============================================================

def load_subsidy_rules():

    conn = get_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        subsidy_id,
        state_name,
        system_size_min_kw,
        system_size_max_kw,
        subsidy_amount_inr,
        scheme_name
    FROM dbo.GovernmentSubsidies
    WHERE state_name = ?
    ORDER BY system_size_min_kw;
    """

    cursor.execute(query, "India")

    rows = cursor.fetchall()

    conn.close()

    return rows


# ============================================================
# CALCULATE SUBSIDY
# ============================================================

def calculate_subsidy(capacity_kw):

    if capacity_kw <= 0:
        raise ValueError("System capacity must be greater than zero.")

    rules = load_subsidy_rules()

    if not rules:
        raise ValueError(
            "No subsidy rules found in GovernmentSubsidies table."
        )

    total_subsidy = 0

    for rule in rules:

        min_kw = float(rule.system_size_min_kw)
        max_kw = float(rule.system_size_max_kw)
        rate = float(rule.subsidy_amount_inr)

        # Calculate capacity that falls inside this slab
        slab_capacity = min(
            max(capacity_kw - min_kw, 0),
            max_kw - min_kw
        )

        slab_subsidy = slab_capacity * rate

        total_subsidy += slab_subsidy

    return round(total_subsidy, 2)


# ============================================================
# ESTIMATE SYSTEM COST
# ============================================================

def calculate_financial_summary(
    capacity_kw,
    estimated_system_cost
):

    subsidy = calculate_subsidy(capacity_kw)

    final_cost = estimated_system_cost - subsidy

    if final_cost < 0:
        final_cost = 0

    return {
        "capacity_kw": capacity_kw,
        "estimated_system_cost": estimated_system_cost,
        "estimated_subsidy": subsidy,
        "final_estimated_cost": round(final_cost, 2)
    }


# ============================================================
# DISPLAY RESULT
# ============================================================

def print_result(result):

    print()
    print("=" * 65)
    print("SOLARSMART - GOVERNMENT SUBSIDY CALCULATOR")
    print("=" * 65)

    print(
        f"System Capacity       : "
        f"{result['capacity_kw']:.3f} kW"
    )

    print(
        f"Estimated System Cost : "
        f"₹{result['estimated_system_cost']:,.2f}"
    )

    print("-" * 65)

    print(
        f"Government Subsidy    : "
        f"₹{result['estimated_subsidy']:,.2f}"
    )

    print(
        f"Final Estimated Cost  : "
        f"₹{result['final_estimated_cost']:,.2f}"
    )

    print("=" * 65)


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="SolarSmart Government Subsidy Calculator"
    )

    parser.add_argument(
        "--capacity",
        type=float,
        required=True,
        help="Solar system capacity in kW"
    )

    parser.add_argument(
        "--cost",
        type=float,
        required=True,
        help="Estimated total solar system cost"
    )

    args = parser.parse_args()

    result = calculate_financial_summary(
        capacity_kw=args.capacity,
        estimated_system_cost=args.cost
    )

    print_result(result)


if __name__ == "__main__":
    main()