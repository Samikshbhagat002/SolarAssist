
"""
Step 1 of the pipeline: standardize the two Kaggle generation datasets into
one common schema:

plant_id, date, dc_power_kw_avg, ac_power_kw_avg, daily_yield_kwh,
ambient_temp_c, irradiation_wm2

Kaggle datasets each use different column names — this is the file where
that mapping lives, so nobody has to remember it later.

Run:
docker compose exec etl python etl/clean_generation.py
"""

import pandas as pd
from pathlib import Path


RAW = Path("/app/data/raw")
OUT = Path("/app/data/interim")
OUT.mkdir(parents=True, exist_ok=True)


def clean_anikannal():
    """
    anikannal/solar-power-generation-data

    Contains 2 plants with generation + weather sensor CSVs.
    Data is recorded at 15-minute intervals, so we aggregate it to daily.
    """

    base = RAW / "solar-power-generation-data"
    frames = []

    plants = [
        (
            "Plant_1_Generation_Data.csv",
            "Plant_1_Weather_Sensor_Data.csv",
        ),
        (
            "Plant_2_Generation_Data.csv",
            "Plant_2_Weather_Sensor_Data.csv",
        ),
    ]

    for plant_num, (gen_file, sensor_file) in enumerate(plants, start=1):

        gen_path = base / gen_file
        sensor_path = base / sensor_file

        if not gen_path.exists() or not sensor_path.exists():
            print(
                f"[skip] Plant {plant_num} files not found in {base} "
                f"— did the download run?"
            )
            continue

        print(f"[info] Processing Anikannal Plant {plant_num}...")

        gen = pd.read_csv(gen_path)
        sensor = pd.read_csv(sensor_path)

        # ------------------------------------------------------------------
        # Parse DATE_TIME.
        #
        # Plant 1 uses:
        #     15-05-2020 00:00
        #
        # Plant 2 uses:
        #     2020-05-15 00:00:00
        # ------------------------------------------------------------------

        if plant_num == 1:
            gen["DATE_TIME"] = pd.to_datetime(
                gen["DATE_TIME"],
                format="%d-%m-%Y %H:%M",
                errors="coerce",
            )
        else:
            gen["DATE_TIME"] = pd.to_datetime(
                gen["DATE_TIME"],
                format="%Y-%m-%d %H:%M:%S",
                errors="coerce",
            )

        # Weather sensor files can be parsed automatically.
        sensor["DATE_TIME"] = pd.to_datetime(
            sensor["DATE_TIME"],
            errors="coerce",
        )

        # Check whether any timestamps failed.
        gen_failed = gen["DATE_TIME"].isna().sum()
        sensor_failed = sensor["DATE_TIME"].isna().sum()

        if gen_failed > 0:
            print(
                f"[warn] Plant {plant_num}: "
                f"{gen_failed} generation timestamps could not be parsed."
            )

        if sensor_failed > 0:
            print(
                f"[warn] Plant {plant_num}: "
                f"{sensor_failed} sensor timestamps could not be parsed."
            )

        # Create date column for daily aggregation.
        gen["date"] = gen["DATE_TIME"].dt.date
        sensor["date"] = sensor["DATE_TIME"].dt.date

        # ------------------------------------------------------------------
        # Aggregate generation data to daily level.
        # ------------------------------------------------------------------

        gen_daily = (
            gen.groupby("date")
            .agg(
                dc_power_kw_avg=("DC_POWER", "mean"),
                ac_power_kw_avg=("AC_POWER", "mean"),
                daily_yield_kwh=("DAILY_YIELD", "max"),
            )
            .reset_index()
        )

        # ------------------------------------------------------------------
        # Aggregate weather sensor data to daily level.
        # ------------------------------------------------------------------

        sensor_daily = (
            sensor.groupby("date")
            .agg(
                ambient_temp_c=("AMBIENT_TEMPERATURE", "mean"),
                irradiation_wm2=("IRRADIATION", "mean"),
            )
            .reset_index()
        )

        # ------------------------------------------------------------------
        # Merge daily generation and weather data.
        # ------------------------------------------------------------------

        merged = gen_daily.merge(
            sensor_daily,
            on="date",
            how="inner",
        )

        # Add standardized plant information.
        merged["plant_id"] = f"anikannal_plant_{plant_num}"

        merged["source_dataset"] = (
            "anikannal/solar-power-generation-data"
        )

        # ------------------------------------------------------------------
        # Source DC_POWER and AC_POWER are in Watts.
        # Convert them to kW.
        # ------------------------------------------------------------------

        merged["dc_power_kw_avg"] = (
            merged["dc_power_kw_avg"] / 1000
        )

        merged["ac_power_kw_avg"] = (
            merged["ac_power_kw_avg"] / 1000
        )

        frames.append(merged)

        print(
            f"[info] Plant {plant_num}: "
            f"{len(merged)} daily rows"
        )

    if frames:
        return pd.concat(
            frames,
            ignore_index=True,
        )

    return pd.DataFrame()


def clean_solargeneration():
    """
    arunkanagolkar/solargeneration

    The currently downloaded Generation_data.csv contains measurement
    columns but NO date/time column.

    Since this pipeline produces daily generation data, we cannot safely
    assign dates to these records. Therefore this dataset is skipped until
    a timestamped version is available.
    """

    path = RAW / "solargeneration"
    csvs = list(path.glob("*.csv"))

    if not csvs:
        print(
            f"[skip] no CSV found in {path} "
            f"— did the download run?"
        )
        return pd.DataFrame()

    csv_path = csvs[0]

    df = pd.read_csv(csv_path)

    # Normalize column names.
    df.columns = [
        str(c).strip().lower().replace(" ", "_")
        for c in df.columns
    ]

    # Look for a possible date/time column.
    possible_date_columns = [
        "date",
        "date_time",
        "datetime",
        "timestamp",
        "time",
    ]

    date_column = next(
        (
            column
            for column in possible_date_columns
            if column in df.columns
        ),
        None,
    )

    # The actual Generation_data.csv currently has no date/time.
    if date_column is None:
        print(
            f"[skip] {csv_path.name} has no date/time column "
            "— cannot safely create daily records."
        )

        print(
            f"[info] available columns: {df.columns.tolist()}"
        )

        return pd.DataFrame()

    # Convert date column.
    df["date"] = pd.to_datetime(
        df[date_column],
        errors="coerce",
    ).dt.date

    # Common column mappings.
    rename_map = {
        "ghi": "irradiation_wm2",
        "irr_(w/m2)": "irradiation_wm2",
        "temperature": "ambient_temp_c",
        "amb_temp": "ambient_temp_c",
        "power_output": "ac_power_kw_avg",
        "ac_power_in_watts": "ac_power_kw_avg",
    }

    df = df.rename(
        columns={
            key: value
            for key, value in rename_map.items()
            if key in df.columns
        }
    )

    # Convert AC power from Watts to kW if available.
    if "ac_power_kw_avg" in df.columns:
        df["ac_power_kw_avg"] = (
            df["ac_power_kw_avg"] / 1000
        )

    df["plant_id"] = "hassan_350kwp"

    df["source_dataset"] = (
        "arunkanagolkar/solargeneration"
    )

    keep = [
        "plant_id",
        "date",
        "ac_power_kw_avg",
        "ambient_temp_c",
        "irradiation_wm2",
        "source_dataset",
    ]

    return df[
        [
            column
            for column in keep
            if column in df.columns
        ]
    ]


def run():
    """
    Run the complete generation-data cleaning pipeline.
    """

    print("[1/3] Cleaning Anikannal dataset...")

    a = clean_anikannal()

    print(
        f"[info] Anikannal rows: {len(a)}"
    )

    print(
        "[2/3] Cleaning Solargeneration dataset..."
    )

    b = clean_solargeneration()

    print(
        f"[info] Solargeneration rows: {len(b)}"
    )

    print(
        "[3/3] Combining datasets..."
    )

    # Combine both cleaned datasets.
    combined = pd.concat(
        [a, b],
        ignore_index=True,
    )

    # Make sure a date column exists.
    if "date" not in combined.columns:
        raise RuntimeError(
            "No date column exists after cleaning."
        )

    # Remove rows where date could not be determined.
    combined = combined.dropna(
        subset=["date"]
    )

    # ----------------------------------------------------------------------
    # Outlier removal on daily yield using IQR.
    # ----------------------------------------------------------------------

    if "daily_yield_kwh" in combined.columns:

        q1, q3 = combined[
            "daily_yield_kwh"
        ].quantile([0.25, 0.75])

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        combined = combined[
            combined["daily_yield_kwh"].between(
                lower_bound,
                upper_bound,
            )
            | combined["daily_yield_kwh"].isna()
        ]

    # ----------------------------------------------------------------------
    # Standard column order.
    # ----------------------------------------------------------------------

    column_order = [
        "date",
        "dc_power_kw_avg",
        "ac_power_kw_avg",
        "daily_yield_kwh",
        "ambient_temp_c",
        "irradiation_wm2",
        "plant_id",
        "source_dataset",
    ]

    combined = combined[
        [
            column
            for column in column_order
            if column in combined.columns
        ]
    ]

    # ----------------------------------------------------------------------
    # Save cleaned dataset.
    # ----------------------------------------------------------------------

    out_path = (
        OUT / "generation_daily_clean.csv"
    )

    combined.to_csv(
        out_path,
        index=False,
    )

    print(
        f"[done] {len(combined)} rows -> {out_path}"
    )


if __name__ == "__main__":
    run()

