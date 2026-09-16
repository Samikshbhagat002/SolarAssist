"""
Shared helpers for every scraper in this folder. The rule for the whole
project: scrape once, cache to CSV, never hit a live site on every user
request. The FastAPI backend reads from PostgreSQL, never from these scripts
directly.
"""

import time
import urllib.robotparser as robotparser
from pathlib import Path
from urllib.parse import urlparse

import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SolarSmartResearchBot/1.0; "
                  "student project, contact: <your-email>)"
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def is_scraping_allowed(url: str, path: str = "/") -> bool:
    """Checks robots.txt for the given domain before scraping. Always call
    this before writing a new scraper against a new site."""
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
        return rp.can_fetch(HEADERS["User-Agent"], path)
    except Exception:
        # If robots.txt can't be read, default to caution -> don't scrape.
        return False


def polite_get(url: str, delay: float = 1.5, **kwargs) -> requests.Response:
    """A single rate-limited GET. `delay` is the pause AFTER this request,
    so calling this in a loop naturally rate-limits your scraper."""
    resp = SESSION.get(url, timeout=15, **kwargs)
    resp.raise_for_status()
    time.sleep(delay)
    return resp


def save_raw(df, name: str, out_dir: str = "/app/data/raw/scraped"):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    path = Path(out_dir) / f"{name}.csv"
    df.to_csv(path, index=False)
    print(f"[saved] {path}  ({len(df)} rows)")
    return path
