-- ============================================================
-- SolarSmart Database Schema
-- Run automatically on first container start (see docker-compose.yml)
-- ============================================================

-- ---------- CORE REFERENCE TABLES ----------

CREATE TABLE IF NOT EXISTS cities (
    city_id         SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    avg_irradiance  NUMERIC(6,3),           -- kWh/m2/day, filled from NASA POWER
    UNIQUE (name, state)
);

CREATE TABLE IF NOT EXISTS manufacturers (
    manufacturer_id SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL UNIQUE,
    website         VARCHAR(255),
    warranty_years  SMALLINT
);

CREATE TABLE IF NOT EXISTS solar_products (
    product_id          SERIAL PRIMARY KEY,
    manufacturer_id     INTEGER REFERENCES manufacturers(manufacturer_id),
    product_name        VARCHAR(255) NOT NULL,
    category            VARCHAR(50),         -- panel / inverter / battery
    wattage             NUMERIC(7,2),
    voltage             NUMERIC(6,2),
    efficiency_pct      NUMERIC(5,2),
    panel_type          VARCHAR(50),         -- mono / poly / mono-perc / bifacial / topcon
    price_inr           NUMERIC(10,2),
    battery_kwh_option  NUMERIC(6,2),
    source_url          VARCHAR(500),
    scraped_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS electricity_tariffs (
    tariff_id       SERIAL PRIMARY KEY,
    state           VARCHAR(100) NOT NULL,
    slab_min_units  INTEGER NOT NULL,
    slab_max_units  INTEGER,                 -- NULL = open-ended top slab
    rate_per_unit   NUMERIC(6,2) NOT NULL,
    effective_year  SMALLINT
);

CREATE TABLE IF NOT EXISTS government_subsidies (
    subsidy_id          SERIAL PRIMARY KEY,
    scheme_name         VARCHAR(150) NOT NULL DEFAULT 'PM Surya Ghar: Muft Bijli Yojana',
    state                VARCHAR(100),
    system_size_min_kw   NUMERIC(5,2) NOT NULL,
    system_size_max_kw   NUMERIC(5,2) NOT NULL,
    subsidy_amount_inr   NUMERIC(10,2) NOT NULL,
    effective_year        SMALLINT
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id      SERIAL PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    city_id        INTEGER REFERENCES cities(city_id),
    latitude       NUMERIC(9,6),
    longitude      NUMERIC(9,6),
    rating         NUMERIC(2,1),
    contact_info   VARCHAR(255),
    source         VARCHAR(50)               -- 'google_places' / 'manual'
);

-- ---------- USERS / APP TABLES ----------

CREATE TABLE IF NOT EXISTS users (
    user_id        SERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    user_type      VARCHAR(30) CHECK (user_type IN ('residential','commercial','industrial','agricultural')),
    city_id        INTEGER REFERENCES cities(city_id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin (
    admin_id       SERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(50) DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS recommendations (
    rec_id                   SERIAL PRIMARY KEY,
    user_id                  INTEGER REFERENCES users(user_id),
    recommended_capacity_kw  NUMERIC(6,2),
    panel_config             VARCHAR(255),
    battery_kwh              NUMERIC(6,2),
    predicted_generation_kwh NUMERIC(8,2),
    roi_years                NUMERIC(4,1),
    shap_values_json         JSONB,
    created_at               TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_history (
    chat_id     SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(user_id),
    message     TEXT,
    response    TEXT,
    language    VARCHAR(10) DEFAULT 'en',    -- en / hi / mr
    timestamp   TIMESTAMP DEFAULT NOW()
);

-- ---------- ML TRAINING / WEATHER STAGING TABLES ----------
-- These hold cleaned, merged data from the ETL pipeline (Kaggle + NASA POWER).
-- Kept separate from the app tables above so re-running the pipeline never
-- touches live user data.

CREATE TABLE IF NOT EXISTS weather_daily (
    weather_id    SERIAL PRIMARY KEY,
    city_id       INTEGER REFERENCES cities(city_id),
    date          DATE NOT NULL,
    ghi_wm2       NUMERIC(7,2),               -- global horizontal irradiance
    ambient_temp_c NUMERIC(5,2),
    cloud_cover_pct NUMERIC(5,2),
    source        VARCHAR(30) DEFAULT 'nasa_power',
    UNIQUE (city_id, date)
);

CREATE TABLE IF NOT EXISTS plant_generation_daily (
    gen_id             SERIAL PRIMARY KEY,
    plant_id           VARCHAR(50) NOT NULL,
    date               DATE NOT NULL,
    dc_power_kw_avg    NUMERIC(8,3),
    ac_power_kw_avg    NUMERIC(8,3),
    daily_yield_kwh    NUMERIC(9,3),
    ambient_temp_c     NUMERIC(5,2),
    irradiation_wm2    NUMERIC(7,2),
    source_dataset     VARCHAR(100),
    UNIQUE (plant_id, date)
);

CREATE TABLE IF NOT EXISTS household_consumption (
    record_id            SERIAL PRIMARY KEY,
    household_ref         VARCHAR(50),
    monthly_bill_inr      NUMERIC(8,2),
    estimated_units_kwh   NUMERIC(8,2),
    household_size        SMALLINT,
    home_type             VARCHAR(50),
    state                 VARCHAR(100),
    source_dataset        VARCHAR(100)
);

-- Final ML-ready table produced by etl/merge_and_load.py — one row per
-- training example, feature-engineered and ready for Samiksha's models.
CREATE TABLE IF NOT EXISTS training_data (
    train_id                SERIAL PRIMARY KEY,
    city_id                 INTEGER REFERENCES cities(city_id),
    roof_area_sqft          NUMERIC(8,2),
    monthly_bill_inr        NUMERIC(8,2),
    estimated_consumption_kwh NUMERIC(8,2),
    avg_ghi_wm2             NUMERIC(7,2),
    generation_per_kwp      NUMERIC(8,3),
    load_factor             NUMERIC(6,3),
    roof_utilization_ratio  NUMERIC(5,3),
    recommended_capacity_kw NUMERIC(6,2),     -- target variable 1
    predicted_generation_kwh NUMERIC(8,2),    -- target variable 2
    recommended_battery_kwh NUMERIC(6,2),     -- target variable 3
    state                   VARCHAR(100),
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ---------- INDEXES ----------
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON solar_products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_weather_city_date ON weather_daily(city_id, date);
CREATE INDEX IF NOT EXISTS idx_generation_plant_date ON plant_generation_daily(plant_id, date);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city_id);
