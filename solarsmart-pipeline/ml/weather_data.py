import requests
import pyodbc
from datetime import date

# ---------------------------------------------------------
# SolarSmart - NASA POWER Weather Data Loader
# ---------------------------------------------------------

LOCATION_NAME = "Amravati, Maharashtra, India"

# Amravati approximate city coordinates
# Replace these with your exact user/site coordinates later.
LATITUDE = 20.9374
LONGITUDE = 77.7796

START_DATE = "20250101"
END_DATE = "20251231"

API_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
    f"?parameters=ALLSKY_SFC_SW_DWN,CLOUD_AMT,T2M,RH2M,WS2M"
    f"&community=RE"
    f"&longitude={LONGITUDE}"
    f"&latitude={LATITUDE}"
    f"&start={START_DATE}"
    f"&end={END_DATE}"
    f"&format=JSON"
)

# ---------------------------------------------------------
# SQL Server connection
# ---------------------------------------------------------

CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=SolarSmart;"
    "Trusted_Connection=yes;"
)

# ---------------------------------------------------------
# Fetch NASA POWER data
# ---------------------------------------------------------

print("Fetching NASA POWER data...")
print(API_URL)

response = requests.get(API_URL, timeout=60)
response.raise_for_status()

data = response.json()

parameters = data["properties"]["parameter"]

irradiance = parameters["ALLSKY_SFC_SW_DWN"]
cloud_cover = parameters["CLOUD_AMT"]
temperature = parameters["T2M"]
humidity = parameters["RH2M"]
wind_speed = parameters["WS2M"]

print(f"Received {len(irradiance)} daily records.")

# ---------------------------------------------------------
# Insert into SQL Server
# ---------------------------------------------------------

connection = pyodbc.connect(CONNECTION_STRING)
cursor = connection.cursor()

insert_sql = """
INSERT INTO WeatherData
(
    location_name,
    latitude,
    longitude,
    recorded_at,
    temperature_c,
    humidity_percent,
    cloud_cover_percent,
    wind_speed_kmh,
    precipitation_mm,
    solar_irradiance,
    sunshine_hours,
    data_source,
    created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
"""

inserted = 0

for day in sorted(irradiance.keys()):

    solar_value = irradiance.get(day)
    cloud_value = cloud_cover.get(day)
    temp_value = temperature.get(day)
    humidity_value = humidity.get(day)
    wind_value = wind_speed.get(day)

    cursor.execute(
        insert_sql,
        LOCATION_NAME,
        LATITUDE,
        LONGITUDE,
        day,
        temp_value,
        humidity_value,
        cloud_value,
        wind_value,
        None,
        solar_value,
        None,
        "NASA POWER",
    )

    inserted += 1

connection.commit()

cursor.close()
connection.close()

print()
print("SUCCESS")
print(f"Inserted rows: {inserted}")
print("Source: NASA POWER")
print("Location:", LOCATION_NAME)