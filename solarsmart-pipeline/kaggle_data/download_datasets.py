"""
Downloads every Kaggle dataset SolarSmart needs into /app/data/raw/<slug>/.

Requires a Kaggle API token: create one at kaggle.com -> Account -> Create New Token,
then set KAGGLE_USERNAME and KAGGLE_KEY as environment variables (already wired
into docker-compose.yml's `etl` service via a .env file — see .env.example).

Run:
    docker compose exec etl python kaggle_data/download_datasets.py
"""

import os
import subprocess
from pathlib import Path

RAW_DIR = Path("/app/data/raw")

# slug -> short reason, kept here so the whole team can see why each one is included
DATASETS = {
    "anikannal/solar-power-generation-data": "Generation + sensor data, 2 Indian plants, 34 days",
    "arunkanagolkar/solargeneration": "GHI/DNI/DHI irradiance + weather + PV output, Hassan, Karnataka",
    "krishnadaskv/daily-power-generation-in-india-2013-2023": "Long-horizon regional generation trend",
    "suraj520/indian-household-electricity-bill": "Appliance usage + demographics -> electricity bill",
    "twinkle0705/state-wise-power-consumption-in-india": "State-level consumption time series 2019-20",
    "arnavsharmaas/solar-panel-pv-system-dataset": "Panel specs to seed the product catalog",
}


def download_all():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    if not (os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")):
        raise SystemExit(
            "KAGGLE_USERNAME / KAGGLE_KEY not set. Add them to your .env file "
            "(copy .env.example -> .env and fill in your Kaggle API token)."
        )

    for slug, reason in DATASETS.items():
        target = RAW_DIR / slug.split("/")[1]
        target.mkdir(parents=True, exist_ok=True)
        print(f"\n[downloading] {slug}  ({reason})")
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", slug, "-p", str(target), "--unzip"],
            check=True,
        )
        print(f"[done] -> {target}")

    print("\nAll datasets downloaded to /app/data/raw/")


if __name__ == "__main__":
    download_all()
