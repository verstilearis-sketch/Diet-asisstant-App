#!/usr/bin/env python3
"""Build a compact bundled Indian foods/recipe nutrition dataset.

Sources (downloaded at build time into a temp dir, never committed):
  - INDB  (Anuvaad Indian Nutrient Databank, 2024): 1,014 Indian recipes with
    per-100g and per-serving nutrient values. xlsx from
    https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB-
  - IFCT 2017 (ICMR-NIN Indian Food Composition Tables, 2017): 528 raw
    ingredients. Raw CSV (NOT the npm package) from
    https://github.com/enz048/ifct2017 (compositions/index.csv).

    Licensing note: the transcribed IFCT files carry an AGPL-3.0 license on
    the repo; this script only extracts factual nutrient values at build time
    and cites ICMR-NIN as the source. Do NOT npm-install the nodef package
    into the app, and do not copy license text into the repo.

Output: ../src/data/indian-foods.json
  { meta: {...}, foods: [ {name, aliases[], per100g:{kcal,protein,carbs,fat},
                           serving:{unit,grams}|null, category, source} ] }

Usage: python3 scripts/build-indian-foods.py
"""

import csv
import json
import math
import os
import re
import sys
import tempfile
import urllib.request

INDB_URL = ("https://raw.githubusercontent.com/lindsayjaacks/"
            "Indian-Nutrient-Databank-INDB-/main/INDB.xlsx")
IFCT_URL = ("https://raw.githubusercontent.com/enz048/ifct2017/"
            "main/compositions/index.csv")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(REPO_ROOT, "src", "data", "indian-foods.json")
BUILD_DATE = "2026-10-06"


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Nutriq-ETL/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as fh:
        fh.write(resp.read())
    print("downloaded:", url.split("/")[-1], os.path.getsize(dest), "bytes")


def r1(x):
    """Round to 1 decimal; return None for non-finite."""
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(v):
        return None
    return round(v, 1)


def norm_key(name):
    """Normalization key used for dedup: lowercase, drop parentheticals/punct."""
    s = re.sub(r"\([^)]*\)", " ", name.lower())
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def full_key(name):
    """Normalization key that keeps parentheticals (for within-INDB dedup)."""
    s = re.sub(r"[^a-z0-9 ]", " ", name.lower())
    return re.sub(r"\s+", " ", s).strip()


# Small map of common alternate names for everyday Indian foods.
COMMON_ALIASES = {
    "roti": ["chapati", "phulka"],
    "chapati": ["roti", "phulka"],
    "rice": ["chawal"],
    "chickpea": ["chana", "chole", "kabuli chana"],
    "chana": ["chickpea", "chole"],
    "lentil": ["dal"],
    "dal": ["lentil"],
    "potato": ["aloo"],
    "cauliflower": ["gobhi", "phool gobhi"],
    "okra": ["bhindi"],
    "eggplant": ["brinjal", "baingan"],
    "brinjal": ["eggplant", "baingan"],
    "spinach": ["palak"],
    "cottage cheese": ["paneer"],
    "paneer": ["cottage cheese"],
    "yogurt": ["dahi", "curd"],
    "curd": ["dahi", "yogurt"],
    "clarified butter": ["ghee"],
    "ghee": ["clarified butter"],
    "wheat flour": ["atta"],
    "atta": ["wheat flour"],
    "tea": ["chai"],
    "milk": ["doodh"],
    "sugar": ["chini", "cheeni"],
    "onion": ["pyaaz", "pyaz"],
    "tomato": ["tamatar"],
    "coriander": ["dhania"],
    "cumin": ["jeera"],
    "turmeric": ["haldi"],
    "mustard": ["sarson", "rai"],
    "mango": ["aam"],
    "banana": ["kela"],
    "apple": ["seb"],
    "kidney bean": ["rajma"],
    "rajma": ["kidney bean", "lal lobia"],
    "black gram": ["urad dal"],
    "green gram": ["moong dal", "mung"],
    "pigeon pea": ["toor dal", "arhar dal"],
    "chickpea flour": ["besan"],
    "besan": ["chickpea flour", "gram flour"],
    "semolina": ["suji", "rava"],
    "jaggery": ["gur"],
    "buttermilk": ["chaas", "chaach"],
    "egg": ["anda"],
    "espreso": ["espresso"],
}


def common_aliases_for(name):
    nk = norm_key(name)
    out = []
    for key, vals in COMMON_ALIASES.items():
        if re.search(r"\b" + re.escape(key) + r"\b", nk):
            out.extend(vals)
    return out


# Keyword -> category for INDB recipes (ordered, first match wins).
INDB_CATEGORIES = [
    (r"\bsoup\b|\brass?am\b", "Soups"),
    (r"tea|coffee|chai|juice|drink|punch|lemonade|sherbet|lassi|shake|beverage|milk|kanji", "Beverages"),
    (r"cake|cookie|biscuit|halwa|kheer|payasam|laddu|ladoo|barfi|jalebi|rasgulla|gulab jamun|pudding|ice cream|dessert|mithai|sweet\b|shrikhand", "Desserts & Sweets"),
    (r"\bsalad\b", "Salads"),
    (r"chutney|pickle|raita|papad", "Sides & Condiments"),
    (r"dosa|idli|upma|poha|parantha|paratha|poori|puri|roti|chapati|naan|bread|toast|sandwich|uttapam|pancake|thepla|bhatura|kulcha|appam|puttu", "Breakfast & Breads"),
    (r"biryani|pulao|pulav|\brice\b|khichdi|bisi bele|curd rice|lemon rice|tamarind rice", "Rice & Mains"),
    (r"\bdal\b|curry|sabzi|sabji|paneer|chicken|mutton|fish|egg|keema|kofta|korma|masala|saag|poriyal|kootu|avial|sambar", "Mains & Curries"),
    (r"samosa|pakora|pakoda|cutlet|tikki|vada|vadai|roll|chaat|fry|nuggets|bond[ao]|bajji|kachori|namkeen|mixture|sev\b", "Snacks"),
]


def indb_category(name):
    nk = norm_key(name)
    for pat, cat in INDB_CATEGORIES:
        if re.search(pat, nk):
            return cat
    return "Recipes"


def split_indb_name(food_name):
    """'Raw mango drink (Aam panna)' -> ('Raw mango drink', ['aam panna'])."""
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", food_name.strip())
    if m:
        name, alias = m.group(1).strip(), m.group(2).strip().lower()
        return name, [alias]
    return food_name.strip(), []


def load_indb(xlsx_path):
    import openpyxl
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb["Nutrient Data"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(c) for c in rows[0]]
    idx = {c: hdr.index(c) for c in (
        "food_name", "energy_kcal", "carb_g", "protein_g", "fat_g",
        "servings_unit", "unit_serving_energy_kcal")}

    foods, seen = [], set()
    for r in rows[1:]:
        name_raw = (r[idx["food_name"]] or "").strip()
        kcal = r1(r[idx["energy_kcal"]])
        if not name_raw or not kcal or kcal <= 0:
            continue
        name, paren_aliases = split_indb_name(name_raw)
        # Dedupe INDB on the FULL name (keeps genuine variants like
        # "White sauce (thin)" vs "(thick)"). The paren-stripped key is only
        # used later to dedupe IFCT foods against INDB entries.
        key = full_key(name_raw)
        if key in seen:
            continue
        seen.add(key)

        unit = (r[idx["servings_unit"]] or "").strip()
        serving = None
        if unit:
            grams = r1(100.0 * float(r[idx["unit_serving_energy_kcal"]]) / float(r[idx["energy_kcal"]]))
            if grams and grams > 0:
                serving = {"unit": unit, "grams": grams}

        aliases = list(dict.fromkeys(
            [a for a in paren_aliases + common_aliases_for(name) if a and a != name.lower()]))
        foods.append({
            "name": name,
            "aliases": aliases[:8],
            "per100g": {
                "kcal": kcal,
                "protein": r1(r[idx["protein_g"]]) or 0.0,
                "carbs": r1(r[idx["carb_g"]]) or 0.0,
                "fat": r1(r[idx["fat_g"]]) or 0.0,
            },
            "serving": serving,
            "category": indb_category(name),
            "source": "INDB",
        })
    print("INDB entries kept:", len(foods))
    return foods


def parse_lang_aliases(lang_field, name):
    """'A. Ahnaros; B. Anarasa; ...' -> ['ahnaros', 'anarasa', ...] (capped)."""
    out = []
    if not lang_field:
        return out
    name_l = name.lower()
    for part in str(lang_field).split(";"):
        part = part.strip()
        # take text after the language abbreviation ("Kash. Punchitipul" -> "punchitipul")
        m = re.match(r"^[A-Za-z]+\.\s*(.+)$", part)
        term = (m.group(1) if m else part).strip().lower()
        term = re.sub(r"\s+", " ", term)
        if term and term != name_l and len(term) > 1:
            out.append(term)
    # dedupe, cap
    return list(dict.fromkeys(out))[:8]


def load_ifct(csv_path, existing_keys):
    foods = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            name = (r.get("name") or "").strip()
            if not name:
                continue
            key = norm_key(name)
            if key in existing_keys:  # prefer INDB recipe entries
                continue
            existing_keys.add(key)

            enerc = r1(r.get("enerc")) or 0.0
            protein = r1(r.get("protcnt")) or 0.0
            fat = r1(r.get("fatce")) or 0.0
            carbs = r1(r.get("choavldf")) or 0.0
            # enerc is in kJ in this CSV; known IFCT gap: oils/ghee report 0
            kcal = round(enerc / 4.184, 1) if enerc > 0 else round(4 * protein + 4 * carbs + 9 * fat, 1)
            if kcal <= 0:
                continue

            aliases = list(dict.fromkeys(
                [a for a in parse_lang_aliases(r.get("lang"), name) + common_aliases_for(name)
                 if a and a != name.lower()]))[:10]
            foods.append({
                "name": name,
                "aliases": aliases,
                "per100g": {"kcal": kcal, "protein": protein, "carbs": carbs, "fat": fat},
                "serving": None,
                "category": (r.get("grup") or "Other").strip(),
                "source": "IFCT2017",
            })
    print("IFCT entries kept:", len(foods))
    return foods


def main():
    tmp = tempfile.mkdtemp(prefix="foodetl_")
    indb_path = os.path.join(tmp, "INDB.xlsx")
    ifct_path = os.path.join(tmp, "ifct.csv")
    download(INDB_URL, indb_path)
    download(IFCT_URL, ifct_path)

    indb_foods = load_indb(indb_path)
    # IFCT dedup keys: full INDB names, paren-stripped names, and INDB aliases
    existing = set()
    for f in indb_foods:
        existing.add(norm_key(f["name"]))
        existing.add(norm_key(re.sub(r"\s*\([^)]*\)", "", f["name"])))
        existing.update(norm_key(a) for a in f["aliases"])
    ifct_foods = load_ifct(ifct_path, existing)

    all_foods = indb_foods + ifct_foods
    payload = {
        "meta": {
            "sources": [
                "ICMR-NIN Indian Food Composition Tables 2017 "
                "(Longvah et al., National Institute of Nutrition, ICMR, Hyderabad)",
                "Anuvaad Indian Nutrient Databank (INDB) 2024 "
                "(Vijayakumar et al., Current Developments in Nutrition)",
            ],
            "built": BUILD_DATE,
            "count": len(all_foods),
            "note": "Factual nutrient values extracted at build time from public "
                    "research datasets; see source publications for full methodology.",
        },
        "foods": all_foods,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT_PATH)
    print("wrote:", OUT_PATH)
    print("entries:", len(all_foods), "| size: %.1f KB" % (size / 1024))
    if size > 500 * 1024:
        print("WARNING: over 500KB budget", file=sys.stderr)

    # verify it parses back
    with open(OUT_PATH, encoding="utf-8") as fh:
        back = json.load(fh)
    assert back["meta"]["count"] == len(back["foods"]) == len(all_foods)
    print("verify: JSON parses OK")
    print("sample entries:")
    for f in (all_foods[:3] + all_foods[-2:]):
        print("  -", json.dumps(f, ensure_ascii=False)[:220])


if __name__ == "__main__":
    main()
