"""
Government subsidy data (PM Surya Ghar: Muft Bijli Yojana) and state
electricity tariffs.

Unlike the product catalog, these pages change only a few times a year and
are usually published as plain HTML tables or PDFs, not JSON feeds. For a
student project the reliable approach is:

  1. Try structured scraping of the public MNRE / PM Surya Ghar page (below).
  2. If the page is JS-rendered or the table structure is inconsistent,
     fall back to MANUAL_SUBSIDY_SLABS at the bottom of this file — transcribed
     by hand from the official page. This is normal practice for slow-changing
     government data and is more reliable than fighting a scraper for
     something that updates twice a year.

Run:
    docker compose exec etl python scraping/scrape_subsidies.py
"""

import pandas as pd
from bs4 import BeautifulSoup

from utils import polite_get, is_scraping_allowed, save_raw

MNRE_SUBSIDY_URL = "https://www.mnre.gov.in/en/grid-connected-solar-rooftop-programme/"


def try_scrape_mnre_table(url: str) -> pd.DataFrame:
    if not is_scraping_allowed(url):
        print(f"[skip] robots.txt disallows {url} — using manual fallback table")
        return pd.DataFrame()

    try:
        resp = polite_get(url)
        soup = BeautifulSoup(resp.text, "html.parser")
        tables = soup.find_all("table")
        if not tables:
            print("[info] no <table> found on page — page is likely JS-rendered. "
                  "Using manual fallback table instead.")
            return pd.DataFrame()

        # Take the first table found; adjust index if the page has multiple tables
        df = pd.read_html(str(tables[0]))[0]
        return df
    except Exception as e:
        print(f"[warn] scrape failed ({e}) — using manual fallback table")
        return pd.DataFrame()


# ------------------------------------------------------------------
# MANUAL FALLBACK — PM Surya Ghar: Muft Bijli Yojana CFA (Central Financial
# Assistance) slabs. Cross-check against https://pmsuryaghar.gov.in and
# https://mnre.gov.in before using in the final report; subsidy amounts are
# revised periodically by the government.
# ------------------------------------------------------------------
MANUAL_SUBSIDY_SLABS = pd.DataFrame([
    {"scheme_name": "PM Surya Ghar: Muft Bijli Yojana", "state": "All India",
     "system_size_min_kw": 0.0, "system_size_max_kw": 2.0, "subsidy_amount_inr": 30000, "effective_year": 2026},
    {"scheme_name": "PM Surya Ghar: Muft Bijli Yojana", "state": "All India",
     "system_size_min_kw": 2.0, "system_size_max_kw": 3.0, "subsidy_amount_inr": 60000, "effective_year": 2026},
    {"scheme_name": "PM Surya Ghar: Muft Bijli Yojana", "state": "All India",
     "system_size_min_kw": 3.0, "system_size_max_kw": 10.0, "subsidy_amount_inr": 78000, "effective_year": 2026},
])

# Sample state electricity tariff slabs — replace with values transcribed
# from your state DISCOM's latest tariff order (e.g. MSEDCL for Maharashtra).
MANUAL_TARIFF_SLABS = pd.DataFrame([
    {"state": "Maharashtra", "slab_min_units": 0, "slab_max_units": 100, "rate_per_unit": 4.71, "effective_year": 2026},
    {"state": "Maharashtra", "slab_min_units": 101, "slab_max_units": 300, "rate_per_unit": 8.66, "effective_year": 2026},
    {"state": "Maharashtra", "slab_min_units": 301, "slab_max_units": 500, "rate_per_unit": 11.15, "effective_year": 2026},
    {"state": "Maharashtra", "slab_min_units": 501, "slab_max_units": None, "rate_per_unit": 11.85, "effective_year": 2026},
])


def run():
    scraped = try_scrape_mnre_table(MNRE_SUBSIDY_URL)
    subsidy_df = scraped if not scraped.empty else MANUAL_SUBSIDY_SLABS
    save_raw(subsidy_df, "government_subsidies")
    save_raw(MANUAL_TARIFF_SLABS, "electricity_tariffs")

    print(
        "\nReminder: verify MANUAL_SUBSIDY_SLABS and MANUAL_TARIFF_SLABS against "
        "the live pmsuryaghar.gov.in / your state DISCOM tariff order before "
        "using these numbers in your final report — they are illustrative "
        "placeholders, not scraped live values."
    )


if __name__ == "__main__":
    run()
