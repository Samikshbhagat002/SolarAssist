import requests
import pyodbc

# ---------------------------------------------------------
# SolarSmart - Open-Meteo Sunshine Duration Updater
# ---------------------------------------------------------

LOCATION_NAME = "Amravati, Maharashtra, India"

LATITUDE = 20.9374
LONGITUDE = 77.7796

START_DATE = "2025-01-01"
END_DATE = "2025-12-31"

API_URL = (
    "https://archive-api.open-meteo.com/v1/archive"
    f"?latitude={LATITUDE}"
    f"&longitude={LONGITUDE}"
    f"&start_date={START_DATE}"
    f"&end_date={END_DATE}"
    "&daily=sunshine_duration"
    "&timezone=Asia%2FKolkata"
)

CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=SolarSmart;"
    "Trusted_Connection=yes;"
)

# ---------------------------------------------------------
# Fetch Open-Meteo data
# ---------------------------------------------------------

print("Fetching Open-Meteo sunshine duration data...")
print(API_URL)

response = requests.get(API_URL, timeout=60)
response.raise_for_status()

data = response.json()

dates = data["daily"]["time"]
sunshine_seconds = data["daily"]["sunshine_duration"]

if len(dates) != len(sunshine_seconds):
    raise RuntimeError(
        f"Date/value mismatch: {len(dates)} dates vs "
        f"{len(sunshine_seconds)} sunshine values"
    )

print(f"Received {len(dates)} daily records.")

# ---------------------------------------------------------
# Convert seconds → hours
# ---------------------------------------------------------

sunshine_hours = {}

for day, seconds in zip(dates, sunshine_seconds):

    if seconds is None:
        sunshine_hours[day] = None
    else:
        sunshine_hours[day] = seconds / 3600.0

# ---------------------------------------------------------
# SQL Server
# ---------------------------------------------------------

connection = pyodbc.connect(CONNECTION_STRING)
cursor = connection.cursor()

update_sql = """
UPDATE WeatherData
SET sunshine_hours = ?
WHERE location_name = ?
  AND CAST(recorded_at AS DATE) = ?
"""

updated = 0

for day, hours in sunshine_hours.items():

    cursor.execute(
        update_sql,
        hours,
        LOCATION_NAME,
        day
    )

    updated += cursor.rowcount

connection.commit()

cursor.close()
connection.close()

print()
print("SUCCESS")
print(f"Open-Meteo records received: {len(dates)}")
print(f"SQL rows updated: {updated}")
print("Sunshine duration converted from seconds to hours.")
print("Source: Open-Meteo")
print("Location:", LOCATION_NAME)