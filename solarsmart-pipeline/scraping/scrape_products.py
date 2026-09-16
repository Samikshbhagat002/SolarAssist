"""
SolarSmart - Robust Multi-Company Solar Product Scraper

Companies:
1. Loom Solar
2. Waaree Energies
3. Adani Solar
4. Vikram Solar
5. RenewSys
6. Goldi Solar
7. Premier Energies
8. Saatvik Green Energy
9. Tata Power Solar
10. Rayzon Solar

Output:
    /app/data/raw/scraped/solar_products_scraped.csv

Design:
- Shopify JSON endpoint for Loom Solar
- Seed-page + recursive link discovery for other companies
- JSON-LD Product extraction
- HTML/table/text extraction
- Strict product validation
- Duplicate removal
- Clean CSV output

No Selenium required.
No random sitemap guessing.
No hardcoded individual product URLs.
"""

import os
import re
import time
import json
import warnings
from collections import deque
from urllib.parse import urljoin, urlparse, urlunparse

import pandas as pd
import requests
from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning


# ============================================================
# CONFIGURATION
# ============================================================
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "raw"
    / "products"
    / "solar_products_scraped.csv"
)

REQUEST_TIMEOUT = 20
REQUEST_DELAY = 0.35

# Maximum pages visited per company.
MAX_PAGES_PER_COMPANY = 60

# Maximum discovered product-like URLs per company.
MAX_PRODUCT_URLS_PER_COMPANY = 60

# Crawl depth from each seed URL.
MAX_CRAWL_DEPTH = 3

# Print every request failure?
# False = cleaner terminal output.
VERBOSE_REQUEST_ERRORS = False


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}


warnings.filterwarnings(
    "ignore",
    category=MarkupResemblesLocatorWarning,
)


# ============================================================
# COMPANY CONFIGURATION
# ============================================================

COMPANIES = [
    {
        "name": "Loom Solar",
        "url": "https://www.loomsolar.com",
        "type": "shopify",
        "seeds": [
            "https://www.loomsolar.com",
        ],
    },

    {
        "name": "Waaree Energies",
        "url": "https://shop.waaree.com",
        "type": "website",
        "seeds": [
            "https://shop.waaree.com",
            "https://shop.waaree.com/solar-module/",
        ],
    },

    {
        "name": "Adani Solar",
        "url": "https://www.adanisolar.com",
        "type": "website",
        "seeds": [
            "https://www.adanisolar.com",
        ],
    },

    # ========================================================
    # BATCH 1
    # ========================================================

    {
        "name": "Vikram Solar",
        "url": "https://www.vikramsolar.com",
        "type": "website",
        "seeds": [
            "https://www.vikramsolar.com/pv-modules/",
            "https://www.vikramsolar.com/utility/",
            "https://www.vikramsolar.com/m10-product-series/",
        ],
    },

    {
        "name": "JAKSON",
        "url": "https://www.jakson.com",
        "type": "website",
        "seeds": [
            "https://www.jakson.com/solar-modules-and-products/",
            "https://www.jakson.com/solar-modules-and-products/solar-for-home/",
            "https://www.jakson.com/collaterals/",
        ],
    },

    {
        "name": "Saatvik Green Energy",
        "url": "https://www.saatvikgroup.com",
        "type": "website",
        "seeds": [
            "https://www.saatvikgroup.com/products",
            "https://www.saatvikgroup.com/modules",
            "https://www.saatvikgroup.com/modules/n-topcon",
            "https://www.saatvikgroup.com/modules/bifacial-g12r",
        ],
    },
]

# ============================================================
# SESSION
# ============================================================

session = requests.Session()
session.headers.update(HEADERS)


# ============================================================
# TEXT HELPERS
# ============================================================

def clean_text(value):
    """
    Convert HTML/text into clean plain text.
    """
    if value is None:
        return ""

    try:
        text = BeautifulSoup(
            str(value),
            "html.parser",
        ).get_text(" ", strip=True)
    except Exception:
        text = str(value)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def normalize_url(url):
    """
    Normalize URL:
    - remove fragments
    - remove duplicate spaces
    - remove trailing slash
    """
    if not url:
        return ""

    url = url.strip()

    try:
        parsed = urlparse(url)

        parsed = parsed._replace(
            fragment=""
        )

        path = parsed.path or "/"

        # Keep root slash.
        if path != "/":
            path = path.rstrip("/")

        parsed = parsed._replace(
            path=path
        )

        return urlunparse(parsed)

    except Exception:
        return url.split("#")[0].rstrip("/")


def same_domain(url, base_url):
    """
    Check whether URL belongs to the same host.
    """
    try:
        a = urlparse(url).netloc.lower()
        b = urlparse(base_url).netloc.lower()

        return (
            a == b
            or a.endswith("." + b)
            or b.endswith("." + a)
        )

    except Exception:
        return False


def is_http_url(url):
    return url.startswith("http://") or url.startswith("https://")


# ============================================================
# HTTP
# ============================================================

def safe_get(url, quiet=False):
    """
    GET with timeout and controlled error handling.
    """

    try:
        response = session.get(
            url,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
        )

        if response.status_code >= 400:

            if VERBOSE_REQUEST_ERRORS and not quiet:
                print(
                    f"[skip] HTTP {response.status_code}: {url}"
                )

            return None

        content_type = (
            response.headers.get(
                "Content-Type",
                ""
            ).lower()
        )

        # We only need HTML/text pages here.
        if (
            "text/html" not in content_type
            and "application/xhtml+xml" not in content_type
            and "text/plain" not in content_type
            and "application/json" not in content_type
        ):
            return None

        return response

    except requests.RequestException as exc:

        if VERBOSE_REQUEST_ERRORS and not quiet:
            print(
                f"[skip] request failed: {url} -> {exc}"
            )

        return None

    except Exception as exc:

        if VERBOSE_REQUEST_ERRORS and not quiet:
            print(
                f"[skip] unexpected request error: "
                f"{url} -> {exc}"
            )

        return None


# ============================================================
# PRODUCT KEYWORDS
# ============================================================

PRODUCT_WORDS = [
    "solar panel",
    "solar module",
    "pv module",
    "photovoltaic",
    "solar battery",
    "battery",
    "solar inverter",
    "inverter",
    "mono perc",
    "monocrystalline",
    "polycrystalline",
    "topcon",
    "bifacial",
    "hjt",
    "solar pv",
    "solar cell",
    "energy storage",
]


NON_PRODUCT_WORDS = [
    "cookie",
    "cookie policy",
    "privacy policy",
    "privacy",
    "terms",
    "terms and conditions",
    "disclaimer",
    "sitemap",
    "contact us",
    "about us",
    "career",
    "careers",
    "current openings",
    "investor relation",
    "investor relations",
    "downloads",
    "download",
    "events",
    "event",
    "news",
    "blog",
    "press release",
    "media",
    "login",
    "register",
    "dealer locator",
    "locate dealer",
    "get in touch",
    "manufacturing",
    "manufacturing technologies",
    "research",
    "simulation",
    "modelling",
    "modelling and simulations",
    "why solar",
    "solutions for businesses",
    "commercial & industrial",
    "institutions",
    "international projects",
    "large projects",
    "operations and maintenance",
    "remote monitoring",
    "financing",
    "listing information",
    "corporate governance",
    "caution notice",
    "campaigns",
    "page not found",
    "404",
    "water pump",
    "solar water pump",
]


# ============================================================
# URL FILTERING
# ============================================================

def url_looks_bad(url):
    """
    Reject obvious non-product URLs.
    """

    lower = url.lower()

    bad_fragments = [
        "privacy",
        "cookie",
        "terms",
        "disclaimer",
        "sitemap",
        "contact",
        "career",
        "careers",
        "login",
        "register",
        "download",
        "downloads",
        "event",
        "events",
        "news",
        "blog",
        "press-release",
        "media",
        "investor",
        "dealer",
        "locate",
        "about-us",
        "about_us",
        "manufacturing",
        "research",
        "simulation",
        "modelling",
        "cart",
        "checkout",
        "account",
        "wishlist",
        "compare",
        "water-pump",
        "water_pump",
    ]

    return any(
        bad in lower
        for bad in bad_fragments
    )


def link_looks_product_like(
    url,
    anchor_text="",
):
    """
    Determine whether a link looks product-related.

    This intentionally favors solar module/product pages
    while avoiding corporate/service pages.
    """

    if not url:
        return False

    if url_looks_bad(url):
        return False

    combined = (
        f"{url} {anchor_text}"
    ).lower()

    strong_keywords = [
        "product",
        "products",
        "module",
        "modules",
        "panel",
        "panels",
        "pv-module",
        "solar-module",
        "solar-panel",
        "bifacial",
        "monofacial",
        "topcon",
        "mono-perc",
        "monoperc",
        "perc",
        "hjt",
        "helia",
        "hypersol",
        "paradea",
        "vega",
        "tej",
        "solar-battery",
        "solar-inverter",
    ]

    return any(
        keyword in combined
        for keyword in strong_keywords
    )
    


# ============================================================
# POWER / EFFICIENCY / PRICE
# ============================================================


def extract_wattage(text):
    """
    Extract a specific solar module power rating.

    Rules:
    - Prefer explicitly labelled power ratings.
    - Accept exact W/Wp values.
    - Do NOT convert a range such as 600-640 Wp
      into a fake exact value.
    - kW values are supported.
    """

    if not text:
        return None

    normalized = re.sub(
        r"\s+",
        " ",
        text,
    )

    # --------------------------------------------------------
    # 1. Explicit technical labels
    # --------------------------------------------------------

    labelled_patterns = [
        r"(?:maximum power|power output|max(?:imum)? power)"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*Wp\b",

        r"(?:maximum power|power output|max(?:imum)? power)"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*W\b",

        r"(?:rated power|nominal power)"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*Wp\b",

        r"(?:rated power|nominal power)"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*W\b",
    ]

    for pattern in labelled_patterns:

        matches = re.findall(
            pattern,
            normalized,
            flags=re.IGNORECASE,
        )

        values = []

        for match in matches:
            try:
                value = float(match)

                if 5 <= value <= 2000:
                    values.append(value)

            except Exception:
                continue

        if values:
            return max(values)

    # --------------------------------------------------------
    # 2. Exact Wp/W value in product title
    # --------------------------------------------------------

    title_match = re.search(
        r"(?<![\d-])"
        r"(\d+(?:\.\d+)?)"
        r"\s*(Wp|W)"
        r"(?![\d-])",
        normalized,
        flags=re.IGNORECASE,
    )

    if title_match:

        try:
            value = float(
                title_match.group(1)
            )

            if 5 <= value <= 2000:
                return value

        except Exception:
            pass

    # --------------------------------------------------------
    # 3. Exact kW rating
    # --------------------------------------------------------

    kw_match = re.search(
        r"(?<![\d-])"
        r"(\d+(?:\.\d+)?)"
        r"\s*kW"
        r"(?![\d-])",
        normalized,
        flags=re.IGNORECASE,
    )

    if kw_match:

        try:
            value = (
                float(kw_match.group(1))
                * 1000
            )

            if 5 <= value <= 100000:
                return value

        except Exception:
            pass

    # --------------------------------------------------------
    # 4. No reliable exact rating
    # --------------------------------------------------------

    return None

def extract_efficiency(text):
    """
    Extract solar module efficiency only when the
    percentage is associated with an efficiency label.
    """

    if not text:
        return None

    normalized = re.sub(
        r"\s+",
        " ",
        text,
    )

    patterns = [
        r"(?:module\s+)?efficiency"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*%",

        r"efficiency"
        r"\s*(?:is|:|-)?\s*"
        r"up\s*to\s*"
        r"(\d+(?:\.\d+)?)\s*%",

        r"max(?:imum)?\s+efficiency"
        r"\s*(?:is|:|-)?\s*"
        r"(\d+(?:\.\d+)?)\s*%",

        r"(\d+(?:\.\d+)?)\s*%"
        r"\s*(?:module\s+)?efficiency",
    ]

    values = []

    for pattern in patterns:
        matches = re.findall(
            pattern,
            normalized,
            flags=re.IGNORECASE,
        )

        for match in matches:
            try:
                value = float(match)

                if 10 <= value <= 35:
                    values.append(value)

            except Exception:
                continue

    if values:
        return max(values)

    return None

def extract_price(text):
    """
    Extract INR price.
    """

    if not text:
        return None

    patterns = [
        r"(?:₹|Rs\.?|INR)\s*"
        r"([0-9][0-9,]*(?:\.\d+)?)",

        r"([0-9][0-9,]*(?:\.\d+)?)"
        r"\s*(?:₹|INR)",
    ]

    values = []

    for pattern in patterns:

        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:

            try:

                value = float(
                    str(match).replace(",", "")
                )

                # Ignore obviously tiny numbers.
                if 100 <= value <= 10000000:
                    values.append(value)

            except Exception:
                continue

    if values:
        return min(values)

    return None


# ============================================================
# TECHNOLOGY
# ============================================================

def extract_technology(text):
    """
    Extract known solar technologies.
    """

    lower = text.lower()

    mapping = [
        ("TOPCon", "topcon"),
        ("Mono PERC", "mono perc"),
        ("Monocrystalline", "monocrystalline"),
        ("Polycrystalline", "polycrystalline"),
        ("Bifacial", "bifacial"),
        ("HJT", "hjt"),
        ("N-Type", "n-type"),
        ("P-Type", "p-type"),
        ("Half-Cut", "half-cut"),
        ("Dual Glass", "dual glass"),
        ("Glass to Glass", "glass to glass"),
        ("Glass-to-Glass", "glass-to-glass"),
        ("DCR", "dcr"),
    ]

    technologies = []

    for label, keyword in mapping:

        if keyword in lower:
            technologies.append(label)

    if technologies:
        return ", ".join(
            dict.fromkeys(technologies)
        )

    return None


def extract_product_series(text):
    """
    Extract recognizable solar product series names.
    """

    if not text:
        return None

    patterns = [
        r"\bHYPERSOL\b",
        r"\bPARADEA\b",
        r"\bHELIA\s*NXT\b",
        r"\bHELIA\s*PLUS\b",
        r"\bHELIA\b",
        r"\bVEGA\s*PLUS\b",
        r"\bVEGA\b",
        r"\bTEJ\s*PLUS\b",
        r"\bTEJ\b",
    ]

    found = []

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            found.append(
                clean_text(match.group(0))
            )

    if not found:
        return None

    return ", ".join(
        dict.fromkeys(found)
    )

# ============================================================
# CATEGORY
# ============================================================

def detect_category(text):
    """
    Classify product.
    """

    lower = text.lower()

    # Battery first because some battery pages
    # mention solar extensively.
    if any(
        word in lower
        for word in [
            "solar battery",
            "lithium battery",
            "lithium-ion battery",
            "lifepo4",
            "lfp battery",
            "energy storage",
            "storage battery",
            "battery energy storage",
        ]
    ):
        return "battery"

    if "inverter" in lower:
        return "inverter"

    if any(
        word in lower
        for word in [
            "solar panel",
            "solar module",
            "pv module",
            "photovoltaic module",
            "solar pv module",
            "mono perc",
            "topcon",
            "bifacial",
            "monocrystalline",
            "polycrystalline",
            "hjt",
        ]
    ):
        return "panel"

    return "other"


# ============================================================
# PRICE PER WATT
# ============================================================

def calculate_price_per_watt(
    price,
    wattage,
):
    if price is None or wattage is None:
        return None

    try:

        price = float(price)
        wattage = float(wattage)

        if price <= 0 or wattage <= 0:
            return None

        return round(
            price / wattage,
            2,
        )

    except Exception:
        return None


# ============================================================
# NON-PRODUCT PAGE DETECTION
# ============================================================

def contains_non_product_keyword(text):
    lower = text.lower()

    return any(
        keyword in lower
        for keyword in NON_PRODUCT_WORDS
    )


def has_power_rating(text):
    return bool(
        re.search(
            r"\b\d+(?:\.\d+)?\s*"
            r"(?:Wp|W|watts?|kW|MW)\b",
            text,
            flags=re.IGNORECASE,
        )
    )


def product_score(
    title,
    text,
    url="",
):
    """
    Score a page.

    High score:
        actual product page

    Low score:
        generic company page
    """

    combined = (
        f"{title} {text} {url}"
    ).lower()

    score = 0

    # Product language.
    if any(
        keyword in combined
        for keyword in PRODUCT_WORDS
    ):
        score += 2

    # Technical power.
    if has_power_rating(combined):
        score += 3

    # Efficiency.
    if extract_efficiency(combined) is not None:
        score += 2

    # Technology.
    if extract_technology(combined):
        score += 1

    # Price.
    if extract_price(combined):
        score += 1

    # URL product indicators.
    if any(
        keyword in url.lower()
        for keyword in [
            "/product/",
            "/products/",
            "/module/",
            "/modules/",
            "/panel/",
            "/panels/",
            "/solar-module/",
            "/solar-panel/",
        ]
    ):
        score += 2

    # Obvious bad page.
    bad_count = sum(
        1
        for keyword in NON_PRODUCT_WORDS
        if keyword in combined
    )

    if bad_count >= 2:
        score -= 5

    return score


def looks_like_product(
    title,
    text,
    url="",
):
    """
    Strict product validation.
    """

    if not title:
        return False

    title_lower = title.lower().strip()

    # Reject obvious non-products.
    for bad in NON_PRODUCT_WORDS:

        if bad in title_lower:
            return False

    category = detect_category(
        f"{title} {text}"
    )

    wattage = extract_wattage(
        f"{title} {text}"
    )

    efficiency = extract_efficiency(
        text
    )

    technology = extract_technology(
        text
    )

    price = extract_price(
        text
    )

    score = product_score(
        title,
        text,
        url,
    )

    # Strongest case:
    # solar product + technical information.
    if category in [
        "panel",
        "battery",
        "inverter",
    ]:

        technical_fields = sum(
            value is not None
            for value in [
                wattage,
                efficiency,
                technology,
                price,
            ]
        )

        if technical_fields >= 1 and score >= 3:
            return True

    # Product title itself contains clear product language.
    if (
        any(
            keyword in title_lower
            for keyword in [
                "solar panel",
                "solar module",
                "pv module",
                "solar battery",
                "solar inverter",
                "inverter",
                "battery",
                "topcon",
                "mono perc",
                "bifacial",
                "hjt",
            ]
        )
        and (
            wattage is not None
            or technology is not None
            or price is not None
        )
    ):
        return True

    return False


# ============================================================
# JSON-LD
# ============================================================

def extract_json_ld_objects(
    soup,
):
    """
    Extract JSON-LD objects from page.
    """

    objects = []

    for script in soup.find_all(
        "script",
        type="application/ld+json",
    ):

        raw = script.string or script.get_text()

        if not raw:
            continue

        raw = raw.strip()

        try:
            data = json.loads(raw)

        except Exception:
            continue

        if isinstance(data, list):
            objects.extend(data)

        elif isinstance(data, dict):

            # @graph support.
            graph = data.get("@graph")

            if isinstance(graph, list):
                objects.extend(graph)

            else:
                objects.append(data)

    return objects


def get_json_ld_product(
    soup,
):
    """
    Find Product schema from JSON-LD.
    """

    objects = extract_json_ld_objects(
        soup
    )

    for obj in objects:

        if not isinstance(obj, dict):
            continue

        obj_type = obj.get("@type")

        if isinstance(obj_type, list):
            types = [
                str(x).lower()
                for x in obj_type
            ]
        else:
            types = [
                str(obj_type).lower()
            ]

        if "product" in types:
            return obj

    return None


# ============================================================
# HTML EXTRACTION
# ============================================================

def get_page_title(
    soup,
):
    """
    Get clean product title.
    """

    # H1 first.
    h1 = soup.find("h1")

    if h1:
        title = clean_text(
            h1.get_text(
                " ",
                strip=True,
            )
        )

        if title:
            return title[:300]

    # JSON-LD Product name.
    product_json = get_json_ld_product(
        soup
    )

    if product_json:

        name = product_json.get(
            "name"
        )

        if name:
            return clean_text(
                name
            )[:300]

    # OG title.
    og = soup.find(
        "meta",
        property="og:title",
    )

    if og and og.get("content"):
        return clean_text(
            og.get("content")
        )[:300]

    # HTML title.
    if soup.title:
        return clean_text(
            soup.title.get_text()
        )[:300]

    return ""


def extract_table_text(
    soup,
):
    """
    Extract specification tables.
    """

    rows = []

    for table in soup.find_all("table"):

        for tr in table.find_all("tr"):

            cells = tr.find_all(
                ["th", "td"]
            )

            values = [
                clean_text(
                    cell.get_text(
                        " ",
                        strip=True,
                    )
                )
                for cell in cells
            ]

            values = [
                value
                for value in values
                if value
            ]

            if values:
                rows.append(
                    " : ".join(values)
                )

    return " ".join(rows)


def extract_meta_text(
    soup,
):
    """
    Extract useful meta descriptions.
    """

    values = []

    for selector in [
        ("meta", {"name": "description"}),
        ("meta", {"property": "og:description"}),
    ]:

        tag = soup.find(
            selector[0],
            attrs=selector[1],
        )

        if tag and tag.get("content"):
            values.append(
                clean_text(
                    tag.get("content")
                )
            )

    return " ".join(values)


def extract_visible_text(
    soup,
):
    """
    Extract visible text after removing noise.
    """

    for tag in soup([
        "script",
        "style",
        "noscript",
        "svg",
        "footer",
        "nav",
        "header",
        "form",
    ]):
        tag.decompose()

    return clean_text(
        soup.get_text(
            " ",
            strip=True,
        )
    )


def extract_product_from_html(
    html,
    url,
    manufacturer,
):
    """
    Extract one validated product.
    """

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    title = get_page_title(
        soup
    )

    # Get structured data before removing scripts.
    product_json = get_json_ld_product(
        soup
    )

    # Make a fresh soup for text extraction.
    soup_text = BeautifulSoup(
        html,
        "html.parser",
    )

    visible_text = extract_visible_text(
        soup_text
    )

    table_text = extract_table_text(
        BeautifulSoup(
            html,
            "html.parser",
        )
    )

    meta_text = extract_meta_text(
        BeautifulSoup(
            html,
            "html.parser",
        )
    )

    full_text = " ".join(
        [
            title,
            meta_text,
            table_text,
            visible_text,
        ]
    )

    # JSON-LD fields.
    json_name = ""
    json_description = ""
    json_price = None

    if product_json:

        json_name = clean_text(
            product_json.get(
                "name",
                "",
            )
        )

        json_description = clean_text(
            product_json.get(
                "description",
                "",
            )
        )

        offers = product_json.get(
            "offers"
        )

        if isinstance(
            offers,
            dict,
        ):
            raw_price = offers.get(
                "price"
            )

            try:
                json_price = float(
                    raw_price
                )
            except Exception:
                json_price = None

        elif isinstance(
            offers,
            list,
        ):

            prices = []

            for offer in offers:

                if not isinstance(
                    offer,
                    dict,
                ):
                    continue

                raw_price = offer.get(
                    "price"
                )

                try:
                    prices.append(
                        float(raw_price)
                    )
                except Exception:
                    continue

            if prices:
                json_price = min(
                    prices
                )

    # Prefer JSON-LD name if useful.
    if (
        json_name
        and not any(
            bad in json_name.lower()
            for bad in NON_PRODUCT_WORDS
        )
    ):
        title = json_name

    if not title:
        return None

    if not looks_like_product(
        title,
        full_text,
        url,
    ):
        return None

    combined = " ".join(
        [
            title,
            json_description,
            full_text,
        ]
    )

    category = detect_category(
        combined
    )

    technology = extract_technology(
        combined
    )

    wattage = extract_wattage(
        combined
    )

    efficiency = extract_efficiency(
        combined
    )

    price = json_price

    if price is None:
        price = extract_price(
            combined
        )

    # Reject obvious non-products.
    if category == "other":
        return None

    # Require at least one useful technical signal.
    technical_values = [
        wattage,
        efficiency,
        technology,
        price,
    ]

    if not any(
        value is not None
        for value in technical_values
    ):
        return None

    return {
        "manufacturer": manufacturer,
        "product_name": title[:300],
        "category": category,
        "technology": technology,
        "wattage_wp": wattage,
        "efficiency_percent": efficiency,
        "price_inr": price,
        "price_per_watt": calculate_price_per_watt(
            price,
            wattage,
        ),
        "source_url": normalize_url(
            url
        ),
    }


# ============================================================
# LINK DISCOVERY
# ============================================================

def extract_links(
    html,
    current_url,
    base_url,
):
    """
    Extract internal links.
    """

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    links = []

    for anchor in soup.find_all(
        "a",
        href=True,
    ):

        href = anchor.get(
            "href"
        )

        if not href:
            continue

        if href.startswith(
            (
                "javascript:",
                "mailto:",
                "tel:",
            )
        ):
            continue

        url = normalize_url(
            urljoin(
                current_url,
                href,
            )
        )

        if not is_http_url(url):
            continue

        if not same_domain(
            url,
            base_url,
        ):
            continue

        anchor_text = clean_text(
            anchor.get_text(
                " ",
                strip=True,
            )
        )

        links.append(
            (
                url,
                anchor_text,
            )
        )

    return links


# ============================================================
# WEBSITE CRAWLER
# ============================================================

def crawl_company(
    company_name,
    base_url,
    seeds,
):
    """
    Crawl a controlled number of pages.

    Important:
    We don't assume /products, /sitemap.xml etc.
    unless they are explicitly supplied as known-good seeds.
    """

    print(
        f"\n[{company_name}] "
        f"controlled product discovery"
    )

    queue = deque()

    visited = set()

    candidate_urls = []

    # Add seeds.
    for seed in seeds:

        seed = normalize_url(
            seed
        )

        if (
            seed
            and same_domain(
                seed,
                base_url,
            )
        ):
            queue.append(
                (
                    seed,
                    0,
                )
            )

    while (
        queue
        and len(visited)
        < MAX_PAGES_PER_COMPANY
    ):

        current_url, depth = queue.popleft()

        current_url = normalize_url(
            current_url
        )

        if current_url in visited:
            continue

        visited.add(
            current_url
        )

        response = safe_get(
            current_url,
            quiet=True,
        )

        if response is None:
            continue

        final_url = normalize_url(
            response.url
        )

        if final_url not in visited:
            visited.add(
                final_url
            )

        # Check current page as a product.
        soup = BeautifulSoup(
            response.text,
            "html.parser",
        )

        title = get_page_title(
            soup
        )

        page_text = clean_text(
            soup.get_text(
                " ",
                strip=True,
            )
        )

        if looks_like_product(
            title,
            page_text,
            final_url,
        ):
            candidate_urls.append(
                final_url
            )

        # Stop deeper crawling.
        if depth >= MAX_CRAWL_DEPTH:
            continue

        # Discover links.
        links = extract_links(
            response.text,
            final_url,
            base_url,
        )

        # Product-looking links first.
        product_links = []
        normal_links = []

        for url, anchor_text in links:

            if url in visited:
                continue

            if url_looks_bad(url):
                continue

            if link_looks_product_like(
                url,
                anchor_text,
            ):
                product_links.append(
                    (url, anchor_text)
                )
            else:
                normal_links.append(
                    (url, anchor_text)
                )

        ordered_links = (
            product_links
            + normal_links
        )

        for url, anchor_text in ordered_links:

            if url in visited:
                continue

            queue.append(
                (
                    url,
                    depth + 1,
                )
            )

            # Prevent enormous queues.
            if (
                len(queue)
                > MAX_PAGES_PER_COMPANY * 4
            ):
                break

        time.sleep(
            REQUEST_DELAY
        )

    # Remove duplicates.
    candidate_urls = list(
        dict.fromkeys(
            candidate_urls
        )
    )

    # Product-looking URLs first.
    candidate_urls.sort(
        key=lambda u: (
            0
            if link_looks_product_like(
                u
            )
            else 1,
            len(u),
        )
    )

    candidate_urls = candidate_urls[
        :MAX_PRODUCT_URLS_PER_COMPANY
    ]

    print(
        f"[{company_name}] "
        f"Pages visited: {len(visited)}"
    )

    print(
        f"[{company_name}] "
        f"Product candidates: "
        f"{len(candidate_urls)}"
    )

    return candidate_urls


# ============================================================
# GENERIC WEBSITE SCRAPER
# ============================================================

def scrape_generic_company(
    company_name,
    base_url,
    seeds,
):
    """
    Generic controlled scraper.
    """

    candidate_urls = crawl_company(
        company_name,
        base_url,
        seeds,
    )

    products = []

    total = len(
        candidate_urls
    )

    for index, url in enumerate(
        candidate_urls,
        start=1,
    ):

        print(
            f"[{company_name}] "
            f"validating "
            f"{index}/{total}"
        )

        response = safe_get(
            url,
            quiet=True,
        )

        if response is None:
            continue

        product = extract_product_from_html(
            response.text,
            response.url,
            company_name,
        )

        if product:
            products.append(
                product
            )

        time.sleep(
            REQUEST_DELAY
        )

    # Remove duplicates.
    unique = {}

    for product in products:

        name_key = re.sub(
            r"\s+",
            " ",
            product[
                "product_name"
            ].lower().strip(),
        )

        key = (
            product[
                "manufacturer"
            ],
            name_key,
        )

        # Prefer record with more complete fields.
        completeness = sum(
            value is not None
            for key_name, value
            in product.items()
            if key_name
            in [
                "wattage_wp",
                "efficiency_percent",
                "price_inr",
                "technology",
            ]
        )

        if key not in unique:
            unique[key] = (
                completeness,
                product,
            )

        else:
            old_score = unique[key][0]

            if completeness > old_score:
                unique[key] = (
                    completeness,
                    product,
                )

    products = [
        value[1]
        for value in unique.values()
    ]

    print(
        f"[info] {company_name} "
        f"validated products: "
        f"{len(products)}"
    )

    return products


# ============================================================
# LOOM SOLAR
# ============================================================

def scrape_loom_solar():
    """
    Loom Solar uses Shopify products.json.
    """

    company = "Loom Solar"

    print(
        f"\n[{company}] "
        f"Shopify product API"
    )

    products = []

    for page in range(1, 10):

        url = (
            "https://www.loomsolar.com/"
            "products.json"
            f"?limit=250&page={page}"
        )

        response = safe_get(
            url,
            quiet=True,
        )

        if response is None:
            break

        try:
            data = response.json()

        except Exception as exc:

            print(
                f"[warning] "
                f"Loom JSON failed: {exc}"
            )

            break

        items = data.get(
            "products",
            [],
        )

        if not items:
            break

        print(
            f"[Loom Solar] "
            f"page {page}: "
            f"{len(items)} products"
        )

        for item in items:

            title = clean_text(
                item.get(
                    "title",
                    "",
                )
            )

            body = clean_text(
                item.get(
                    "body_html",
                    "",
                )
            )

            combined = (
                f"{title} {body}"
            )

            category = detect_category(
                combined
            )

            technology = extract_technology(
                combined
            )

            wattage = extract_wattage(
                combined
            )

            efficiency = extract_efficiency(
                combined
            )

            price = None

            variants = item.get(
                "variants",
                [],
            )

            if variants:

                prices = []

                for variant in variants:

                    raw_price = variant.get(
                        "price"
                    )

                    try:
                        value = float(
                            raw_price
                        )

                        if value > 0:
                            prices.append(
                                value
                            )

                    except Exception:
                        continue

                if prices:
                    price = min(
                        prices
                    )

            if not title:
                continue

            # Only keep meaningful solar products.
            if category == "other":
                continue

            handle = item.get(
                "handle",
                "",
            )

            product_url = (
                "https://www.loomsolar.com/"
                "products/"
                f"{handle}"
            )

            products.append(
                {
                    "manufacturer": company,
                    "product_name": title,
                    "category": category,
                    "technology": technology,
                    "wattage_wp": wattage,
                    "efficiency_percent": efficiency,
                    "price_inr": price,
                    "price_per_watt":
                        calculate_price_per_watt(
                            price,
                            wattage,
                        ),
                    "source_url":
                        product_url,
                }
            )

        if len(items) < 250:
            break

        time.sleep(
            REQUEST_DELAY
        )

    print(
        f"[info] {company} "
        f"products fetched: "
        f"{len(products)}"
    )

    return products


# ============================================================
# DATA CLEANING
# ============================================================

def clean_dataframe(df):
    """
    Final dataset cleaning.
    """

    if df.empty:
        return df

    text_columns = [
        "manufacturer",
        "product_name",
        "category",
        "technology",
        "source_url",
    ]

    for column in text_columns:

        if column in df.columns:

            df[column] = (
                df[column]
                .fillna("")
                .astype(str)
                .str.replace(
                    r"\s+",
                    " ",
                    regex=True,
                )
                .str.strip()
            )

    numeric_columns = [
        "wattage_wp",
        "efficiency_percent",
        "price_inr",
        "price_per_watt",
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )

    # --------------------------------------------------------
    # Sanity checks
    # --------------------------------------------------------

    df.loc[
        ~df["wattage_wp"].between(
            5,
            100000,
        ),
        "wattage_wp",
    ] = pd.NA

    df.loc[
        ~df["efficiency_percent"].between(
            5,
            35,
        ),
        "efficiency_percent",
    ] = pd.NA

    df.loc[
        ~df["price_inr"].between(
            100,
            10000000,
        ),
        "price_inr",
    ] = pd.NA

    # --------------------------------------------------------
    # Remove bad names
    # --------------------------------------------------------

    bad_pattern = (
        r"cookie|privacy|terms|disclaimer|"
        r"sitemap|career|careers|downloads?|"
        r"events?|page not found|404|"
        r"contact us|about us|"
        r"current openings|"
        r"investor relations?|"
        r"corporate governance|"
        r"caution notice|"
        r"get in touch|"
        r"locate dealer|"
        r"water pump"
    )

    df = df[
        ~df[
            "product_name"
        ].str.contains(
            bad_pattern,
            case=False,
            regex=True,
            na=False,
        )
    ]

    # --------------------------------------------------------
    # Remove empty names
    # --------------------------------------------------------

    df = df[
        df[
            "product_name"
        ].str.len() > 2
    ]

    # --------------------------------------------------------
    # Remove "other" unless strongly supported
    # --------------------------------------------------------

    df = df[
        df["category"].isin(
            [
                "panel",
                "battery",
                "inverter",
            ]
        )
    ]

    # --------------------------------------------------------
    # Deduplicate
    # --------------------------------------------------------

    df = df.drop_duplicates(
        subset=[
            "manufacturer",
            "product_name",
        ]
    )

    # --------------------------------------------------------
    # Recalculate price per watt
    # --------------------------------------------------------

    df["price_per_watt"] = df.apply(
        lambda row:
        calculate_price_per_watt(
            row["price_inr"],
            row["wattage_wp"],
        ),
        axis=1,
    )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    df = df.sort_values(
        [
            "manufacturer",
            "category",
            "product_name",
        ]
    )

    return df.reset_index(
        drop=True
    )


# ============================================================
# DIAGNOSTICS
# ============================================================

def print_company_diagnostics(
    df,
):
    """
    Print useful completeness information.
    """

    if df.empty:
        return

    print(
        "\n"
        + "=" * 70
    )

    print(
        "COMPANY DATA QUALITY"
    )

    print(
        "=" * 70
    )

    for manufacturer in sorted(
        df[
            "manufacturer"
        ].unique()
    ):

        part = df[
            df[
                "manufacturer"
            ]
            == manufacturer
        ]

        total = len(part)

        print(
            f"\n{manufacturer}: "
            f"{total} products"
        )

        for column in [
            "wattage_wp",
            "efficiency_percent",
            "price_inr",
            "technology",
        ]:

            percentage = (
                part[column]
                .notna()
                .mean()
                * 100
            )

            print(
                f"  {column}: "
                f"{percentage:.1f}%"
            )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "=" * 70
    )

    print(
        "SolarSmart Robust "
        "Multi-Company Product Scraper"
    )

    print(
        "=" * 70
    )

    all_products = []

    for index, company in enumerate(
        COMPANIES,
        start=1,
    ):

        name = company["name"]

        print(
            f"\n[{index}/{len(COMPANIES)}] "
            f"Scraping {name}"
        )

        try:

            if company["type"] == "shopify":

                products = (
                    scrape_loom_solar()
                )

            else:

                products = (
                    scrape_generic_company(
                        name,
                        company["url"],
                        company.get(
                            "seeds",
                            [company["url"]],
                        ),
                    )
                )

            all_products.extend(
                products
            )

        except Exception as exc:

            print(
                f"[ERROR] {name}: "
                f"{exc}"
            )

            # Continue with other companies.
            continue

    # ========================================================
    # COMBINE
    # ========================================================

    print(
        "\n"
        + "=" * 70
    )

    print(
        "[combine] Combining "
        "product datasets..."
    )

    columns = [
        "manufacturer",
        "product_name",
        "category",
        "technology",
        "wattage_wp",
        "efficiency_percent",
        "price_inr",
        "price_per_watt",
        "source_url",
    ]

    if all_products:

        df = pd.DataFrame(
            all_products
        )

        for column in columns:

            if column not in df.columns:
                df[column] = None

        df = df[
            columns
        ]

    else:

        df = pd.DataFrame(
            columns=columns
        )

    # ========================================================
    # CLEAN
    # ========================================================

    df = clean_dataframe(
        df
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    print(
        "\n"
        + "=" * 70
    )

    print(
        "FINAL SUMMARY"
    )

    print(
        "-" * 70
    )

    print(
        f"Total validated products: "
        f"{len(df)}"
    )

    if not df.empty:

        print(
            "\nProducts by manufacturer:"
        )

        print(
            df[
                "manufacturer"
            ]
            .value_counts()
            .to_string()
        )

        print(
            "\nProducts by category:"
        )

        print(
            df[
                "category"
            ]
            .value_counts()
            .to_string()
        )

        print(
            "\nManufacturer × category:"
        )

        print(
            pd.crosstab(
                df[
                    "manufacturer"
                ],
                df[
                    "category"
                ],
            ).to_string()
        )

        print(
            "\nOverall data completeness:"
        )

        completeness = (
            df[
                [
                    "wattage_wp",
                    "efficiency_percent",
                    "price_inr",
                    "technology",
                ]
            ]
            .notna()
            .mean()
            * 100
        )

        print(
            completeness
            .round(1)
            .to_string()
        )

        print_company_diagnostics(
            df
        )

    # ========================================================
    # SAVE
    # ========================================================

    print(
        "\n"
        + "=" * 70
    )

    print(
        "[save] Saving scraped data..."
    )

    OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)
    
    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print(
        f"[saved] {OUTPUT_FILE} "
        f"({len(df)} rows)"
    )

    print(
        "\n[done] Solar product "
        "scraping completed."
    )

    print(
        "=" * 70
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()