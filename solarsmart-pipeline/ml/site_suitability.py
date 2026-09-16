import argparse
import math
import pyodbc


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

SERVER = r"localhost\SQLEXPRESS"
DATABASE = "SolarSmart"
DRIVER = "{ODBC Driver 17 for SQL Server}"


def get_connection():
    return pyodbc.connect(
        f"DRIVER={DRIVER};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        f"Trusted_Connection=yes;"
    )


# ============================================================
# MCDM WEIGHTS
# Must match dbo.MCDMCriteria
# ============================================================

WEIGHTS = {
    "solar_irradiance": 0.30,
    "sunshine": 0.15,
    "cloud_cover": 0.10,
    "roof_area": 0.20,
    "shading": 0.15,
    "orientation": 0.10,
}


# ============================================================
# WEATHER NORMALIZATION RANGES
# Based on actual 2025 Amravati WeatherData
# ============================================================

WEATHER_RANGES = {
    "solar_irradiance": {
        "min": 0.7176,
        "max": 7.3913,
    },
    "sunshine": {
        "min": 0.00,
        "max": 12.26,
    },
    "cloud_cover": {
        "min": 0.00,
        "max": 99.88,
    },
}


# ============================================================
# NORMALIZATION FUNCTIONS
# ============================================================

def benefit_score(value, minimum, maximum):
    """
    Benefit criterion:
    Higher value = better.
    """

    if maximum == minimum:
        return 100.0

    score = ((value - minimum) / (maximum - minimum)) * 100

    return max(0.0, min(100.0, score))


def cost_score(value, minimum, maximum):
    """
    Cost criterion:
    Lower value = better.
    """

    if maximum == minimum:
        return 100.0

    score = ((maximum - value) / (maximum - minimum)) * 100

    return max(0.0, min(100.0, score))


# ============================================================
# ROOF ORIENTATION
# ============================================================

def orientation_score(orientation):
    """
    Domain-based orientation score for India.

    South-facing is preferred for fixed PV systems
    in the Northern Hemisphere.

    These are engineering/domain rules, not ML predictions.
    """

    orientation = orientation.strip().lower()

    scores = {
        "south": 100.0,

        "south-east": 95.0,
        "southeast": 95.0,
        "south east": 95.0,

        "south-west": 95.0,
        "southwest": 95.0,
        "south west": 95.0,

        "east": 85.0,
        "west": 85.0,

        "north-east": 60.0,
        "northeast": 60.0,
        "north east": 60.0,

        "north-west": 60.0,
        "northwest": 60.0,
        "north west": 60.0,

        "north": 50.0,
    }

    return scores.get(orientation, 50.0)


# ============================================================
# VERIFIED PANEL INFORMATION
# ============================================================

VERIFIED_PANEL_IDS = {
    150,
    160,
    162,
    163,
    164,
    165,
    166,
    169,
}


def get_panel_information(connection, product_id):
    """
    Retrieve panel wattage and verified physical dimensions.

    Dimensions must exist in SolarProducts.
    No dimensions are fabricated.
    """

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            product_id,
            product_name,
            wattage_w,
            length_mm,
            width_mm
        FROM dbo.SolarProducts
        WHERE product_id = ?
          AND LOWER(category) = 'panel'
        """,
        product_id,
    )

    row = cursor.fetchone()

    if row is None:
        raise ValueError(
            f"Panel product_id {product_id} was not found."
        )

    if row.length_mm is None or row.width_mm is None:
        raise ValueError(
            f"Panel product_id {product_id} does not have "
            "verified dimensions in SolarProducts."
        )

    return {
        "product_id": int(row.product_id),
        "product_name": row.product_name,
        "wattage_w": float(row.wattage_w),
        "length_mm": float(row.length_mm),
        "width_mm": float(row.width_mm),
    }


# ============================================================
# ROOF AREA CALCULATION
# ============================================================

def calculate_roof_area_score(
    roof_area_sq_m,
    recommended_capacity_kw,
    panel_wattage_w,
    panel_length_mm,
    panel_width_mm,
):
    """
    Calculate roof-area adequacy.

    Steps:
        1. Calculate number of panels required.
        2. Calculate area of one panel.
        3. Calculate total panel surface area.
        4. Compare available roof area with required panel area.

    Score is capped at 100.
    """

    if roof_area_sq_m <= 0:
        raise ValueError("Roof area must be greater than zero.")

    if recommended_capacity_kw <= 0:
        raise ValueError(
            "Recommended capacity must be greater than zero."
        )

    if panel_wattage_w <= 0:
        raise ValueError("Panel wattage must be greater than zero.")

    # Number of whole panels required
    number_of_panels = math.ceil(
        (recommended_capacity_kw * 1000) / panel_wattage_w
    )

    # Convert mm² to m²
    panel_area_sq_m = (
        panel_length_mm * panel_width_mm
    ) / 1_000_000

    required_panel_area_sq_m = (
        number_of_panels * panel_area_sq_m
    )

    # Roof adequacy ratio
    adequacy_ratio = (
        roof_area_sq_m / required_panel_area_sq_m
    )

    score = min(100.0, adequacy_ratio * 100.0)

    return {
        "number_of_panels": number_of_panels,
        "panel_area_sq_m": panel_area_sq_m,
        "required_panel_area_sq_m": required_panel_area_sq_m,
        "roof_adequacy_ratio": adequacy_ratio,
        "score": score,
    }


# ============================================================
# SHADING
# ============================================================

def shading_score(shading_percent):
    """
    Shading is a cost criterion.

    0% shading   -> 100 score
    100% shading -> 0 score
    """

    if shading_percent < 0 or shading_percent > 100:
        raise ValueError(
            "Shading percentage must be between 0 and 100."
        )

    return 100.0 - shading_percent


# ============================================================
# WEATHER DATA
# ============================================================

def get_weather_summary(
    connection,
    latitude,
    longitude,
):
    """
    Retrieve actual weather data for the supplied coordinates.

    Current database contains 2025 Amravati weather data.
    Exact coordinates are used to avoid silently matching
    another location.
    """

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            AVG(solar_irradiance) AS avg_irradiance,
            AVG(sunshine_hours) AS avg_sunshine,
            AVG(cloud_cover_percent) AS avg_cloud_cover
        FROM dbo.WeatherData
        WHERE latitude = ?
          AND longitude = ?
        """,
        latitude,
        longitude,
    )

    row = cursor.fetchone()

    if row is None or row.avg_irradiance is None:
        raise ValueError(
            "No WeatherData found for the supplied latitude/longitude."
        )

    return {
        "avg_irradiance": float(row.avg_irradiance),
        "avg_sunshine": float(row.avg_sunshine),
        "avg_cloud_cover": float(row.avg_cloud_cover),
    }


# ============================================================
# SAVE SITE
# ============================================================

def insert_site(
    connection,
    location_name,
    latitude,
    longitude,
    roof_area,
    roof_orientation,
    roof_tilt,
    shading_percent,
):
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO dbo.Sites
        (
            location_name,
            latitude,
            longitude,
            roof_area_sq_m,
            roof_orientation,
            roof_tilt_degree,
            shading_percent
        )
        OUTPUT INSERTED.site_id
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        location_name,
        latitude,
        longitude,
        roof_area,
        roof_orientation,
        roof_tilt,
        shading_percent,
    )

    return int(cursor.fetchone()[0])


# ============================================================
# SAVE MCDM RESULT
# ============================================================

def insert_result(
    connection,
    site_id,
    scores,
    final_score,
    category,
):
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO dbo.SiteSuitabilityResults
        (
            site_id,
            solar_irradiance_score,
            sunshine_score,
            cloud_cover_score,
            roof_area_score,
            shading_score,
            orientation_score,
            final_suitability_score,
            suitability_category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        site_id,
        round(scores["solar_irradiance"], 2),
        round(scores["sunshine"], 2),
        round(scores["cloud_cover"], 2),
        round(scores["roof_area"], 2),
        round(scores["shading"], 2),
        round(scores["orientation"], 2),
        round(final_score, 2),
        category,
    )


# ============================================================
# MAIN MCDM CALCULATION
# ============================================================

def calculate_suitability(
    connection,
    location_name,
    latitude,
    longitude,
    roof_area,
    roof_orientation,
    roof_tilt,
    shading_percent,
    recommended_capacity_kw,
    panel_id,
):

    # --------------------------------------------------------
    # 1. Weather
    # --------------------------------------------------------

    weather = get_weather_summary(
        connection,
        latitude,
        longitude,
    )

    # --------------------------------------------------------
    # 2. Panel
    # --------------------------------------------------------

    panel = get_panel_information(
        connection,
        panel_id,
    )

    # --------------------------------------------------------
    # 3. Weather criterion scores
    # --------------------------------------------------------

    irradiance_score = benefit_score(
        weather["avg_irradiance"],
        WEATHER_RANGES["solar_irradiance"]["min"],
        WEATHER_RANGES["solar_irradiance"]["max"],
    )

    sunshine_score_value = benefit_score(
        weather["avg_sunshine"],
        WEATHER_RANGES["sunshine"]["min"],
        WEATHER_RANGES["sunshine"]["max"],
    )

    cloud_cover_score_value = cost_score(
        weather["avg_cloud_cover"],
        WEATHER_RANGES["cloud_cover"]["min"],
        WEATHER_RANGES["cloud_cover"]["max"],
    )

    # --------------------------------------------------------
    # 4. Roof area
    # --------------------------------------------------------

    roof_area_result = calculate_roof_area_score(
        roof_area_sq_m=roof_area,
        recommended_capacity_kw=recommended_capacity_kw,
        panel_wattage_w=panel["wattage_w"],
        panel_length_mm=panel["length_mm"],
        panel_width_mm=panel["width_mm"],
    )

    roof_area_score_value = roof_area_result["score"]

    # --------------------------------------------------------
    # 5. Shading
    # --------------------------------------------------------

    shading_score_value = shading_score(
        shading_percent
    )

    # --------------------------------------------------------
    # 6. Orientation
    # --------------------------------------------------------

    orientation_score_value = orientation_score(
        roof_orientation
    )

    # --------------------------------------------------------
    # 7. Weighted MCDM
    # --------------------------------------------------------

    weighted_scores = {
        "solar_irradiance":
            irradiance_score * WEIGHTS["solar_irradiance"],

        "sunshine":
            sunshine_score_value * WEIGHTS["sunshine"],

        "cloud_cover":
            cloud_cover_score_value * WEIGHTS["cloud_cover"],

        "roof_area":
            roof_area_score_value * WEIGHTS["roof_area"],

        "shading":
            shading_score_value * WEIGHTS["shading"],

        "orientation":
            orientation_score_value * WEIGHTS["orientation"],
    }

    final_score = sum(weighted_scores.values())

    # --------------------------------------------------------
    # 8. Category
    # --------------------------------------------------------

    if final_score >= 80:
        category = "Highly Suitable"

    elif final_score >= 60:
        category = "Suitable"

    elif final_score >= 40:
        category = "Moderately Suitable"

    else:
        category = "Less Suitable"

    # --------------------------------------------------------
    # 9. Raw criterion scores
    # --------------------------------------------------------

    scores = {
        "solar_irradiance": irradiance_score,
        "sunshine": sunshine_score_value,
        "cloud_cover": cloud_cover_score_value,
        "roof_area": roof_area_score_value,
        "shading": shading_score_value,
        "orientation": orientation_score_value,
    }

    # --------------------------------------------------------
    # 10. Save everything
    # --------------------------------------------------------

    site_id = insert_site(
        connection,
        location_name,
        latitude,
        longitude,
        roof_area,
        roof_orientation,
        roof_tilt,
        shading_percent,
    )

    insert_result(
        connection,
        site_id,
        scores,
        final_score,
        category,
    )

    connection.commit()

    # --------------------------------------------------------
    # 11. Return complete result
    # --------------------------------------------------------

    return {
        "site_id": site_id,

        "location": location_name,

        "recommended_capacity_kw":
            recommended_capacity_kw,

        "panel": panel,

        "weather": weather,

        "roof_area": roof_area_result,

        "scores": scores,

        "weighted_scores": weighted_scores,

        "final_score": round(final_score, 2),

        "category": category,
    }


# ============================================================
# COMMAND LINE INTERFACE
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "SolarSmart Site Suitability "
            "MCDM Calculator"
        )
    )

    parser.add_argument(
        "--location",
        required=True,
        help="Site location name",
    )

    parser.add_argument(
        "--lat",
        type=float,
        required=True,
        help="Latitude",
    )

    parser.add_argument(
        "--lon",
        type=float,
        required=True,
        help="Longitude",
    )

    parser.add_argument(
        "--roof-area",
        type=float,
        required=True,
        help="Available roof area in square metres",
    )

    parser.add_argument(
        "--orientation",
        required=True,
        help="Roof orientation",
    )

    parser.add_argument(
        "--tilt",
        type=float,
        required=True,
        help="Roof tilt in degrees",
    )

    parser.add_argument(
        "--shading",
        type=float,
        required=True,
        help="Shading percentage",
    )

    parser.add_argument(
        "--capacity",
        type=float,
        required=True,
        help="Recommended solar capacity in kW",
    )

    parser.add_argument(
        "--panel-id",
        type=int,
        required=True,
        help="SolarProducts product_id of selected panel",
    )

    args = parser.parse_args()

    connection = get_connection()

    try:

        result = calculate_suitability(
            connection=connection,
            location_name=args.location,
            latitude=args.lat,
            longitude=args.lon,
            roof_area=args.roof_area,
            roof_orientation=args.orientation,
            roof_tilt=args.tilt,
            shading_percent=args.shading,
            recommended_capacity_kw=args.capacity,
            panel_id=args.panel_id,
        )

        print("\n" + "=" * 65)
        print("SOLARSMART SITE SUITABILITY RESULT")
        print("=" * 65)

        print(f"Site ID              : {result['site_id']}")
        print(f"Location             : {result['location']}")
        print(
            f"Recommended Capacity : "
            f"{result['recommended_capacity_kw']:.3f} kW"
        )

        print("\nSelected Panel:")
        print(
            f"  Product ID         : "
            f"{result['panel']['product_id']}"
        )
        print(
            f"  Product            : "
            f"{result['panel']['product_name']}"
        )
        print(
            f"  Wattage            : "
            f"{result['panel']['wattage_w']:.0f} W"
        )
        print(
            f"  Dimensions         : "
            f"{result['panel']['length_mm']:.0f} x "
            f"{result['panel']['width_mm']:.0f} mm"
        )

        print("\nWeather:")
        print(
            f"  Avg Irradiance     : "
            f"{result['weather']['avg_irradiance']:.4f}"
        )
        print(
            f"  Avg Sunshine       : "
            f"{result['weather']['avg_sunshine']:.4f} hours/day"
        )
        print(
            f"  Avg Cloud Cover    : "
            f"{result['weather']['avg_cloud_cover']:.4f}%"
        )

        print("\nRoof Area Calculation:")
        print(
            f"  Number of Panels   : "
            f"{result['roof_area']['number_of_panels']}"
        )
        print(
            f"  Area / Panel       : "
            f"{result['roof_area']['panel_area_sq_m']:.3f} m²"
        )
        print(
            f"  Required Area      : "
            f"{result['roof_area']['required_panel_area_sq_m']:.3f} m²"
        )
        print(
            f"  Available Area     : "
            f"{args.roof_area:.3f} m²"
        )
        print(
            f"  Roof Adequacy      : "
            f"{result['roof_area']['roof_adequacy_ratio']:.2f}x"
        )

        print("\nCriterion Scores:")
        for criterion, score in result["scores"].items():
            print(
                f"  {criterion:<20}: "
                f"{score:>6.2f}"
            )

        print("\nWeighted Contributions:")
        for criterion, score in result["weighted_scores"].items():
            print(
                f"  {criterion:<20}: "
                f"{score:>6.2f}"
            )

        print("\n" + "-" * 65)
        print(
            f"FINAL SCORE          : "
            f"{result['final_score']:.2f} / 100"
        )
        print(
            f"CATEGORY             : "
            f"{result['category']}"
        )
        print("=" * 65)

    except Exception as e:

        print("\nERROR:")
        print(str(e))

    finally:

        connection.close()


if __name__ == "__main__":
    main()