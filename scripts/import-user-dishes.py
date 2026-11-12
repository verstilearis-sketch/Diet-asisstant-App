#!/usr/bin/env python3
"""Import Salik's dish datasets into the Zaiq meal engine.

Source: ~/workspace/user/files/pan_india_and_kashmir_2000plus_dishes.xlsx
(the 60-row J&K CSV is fully contained in it, so it is not imported twice).

Mapping rules (agreed Nov 12, 2026):
- region: Kashmir/Jammu -> 'kashmir'; macro_region North/Central -> 'north-india',
  South -> 'south-india', West -> 'west-india', East/Northeast -> 'east-india'.
- meal slots come from the `meal_slot` column, refined by `category`.
- tags: diet_type Vegetarian -> ['vegetarian'], Vegan -> ['vegetarian','vegan'],
  Non-Vegetarian -> []; 'gluten-free' when allergens has no Gluten and no
  wheat-family ingredient; 'high-protein' when protein >= 20g.
- Dropped: 'Condiment' rows (not meals) and Vegetarian/Vegan rows whose
  ingredients name pork/beef (the Khasi series lists "Mustard oil / Pork fat").
- Descriptions use key_ingredients; 'eggplant' is written as 'brinjal' so the
  engine's vegetarian egg check (/egg/) does not wrongly exclude them.
- Dishes whose name already exists in the app's pool for the same region+slot
  are skipped (the app's version, e.g. "Rogan Josh & Rice", stays).

Output: src/lib/user-dishes.ts (USER_DISHES), merged into meal pools by
buildMealPools() in src/lib/ai-engine.ts.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl

XLSX = Path.home() / "workspace/user/files/pan_india_and_kashmir_2000plus_dishes.xlsx"
ENGINE = Path.home() / "workspace/diet-app/src/lib/ai-engine.ts"
OUT = Path.home() / "workspace/diet-app/src/lib/user-dishes.ts"

REGION_MAP = {
    "North India": "north-india",
    "South India": "south-india",
    "West India": "west-india",
    "East India": "east-india",
    "Northeast India": "east-india",
    "Central India": "north-india",
}
SLOT_WORDS = [
    ("breakfast", "breakfast"),
    ("morning snack", "snack"),
    ("evening snack", "snack"),
    ("evening", "snack"),
    ("snack", "snack"),
    ("lunch", "lunch"),
    ("dinner", "dinner"),
    ("post-meal", "snack"),
    ("festive", "snack"),
]
CAT_SLOT = {
    "Breakfast": {"breakfast"},
    "Snack": {"snack"},
    "Dessert": {"snack"},
    "Drink": {"snack"},
    "Bread": {"breakfast", "snack"},
    "Bread / Sweet": {"breakfast", "snack"},
}
MEAT_WORD = re.compile(r"\b(chicken|mutton|lamb|fish|prawn|shrimp|keema|gosht|meat|beef|pork|duck|crab|egg)\b", re.I)
PORK_WORD = re.compile(r"\b(pork|beef)\b", re.I)
GLUTEN_WORD = re.compile(r"\b(wheat|maida|atta|barley|semolina|sooji|rava)\b", re.I)


def emoji_for(name: str, category: str) -> str:
    n = name.lower()
    if "soup" in n or "shorba" in n or "rasam" in n:
        return "🍲"
    if "salad" in n or "chaat" in n or "bowl" in n:
        return "🥗"
    if "biryani" in n or "pulao" in n or "fried rice" in n or "rice" in n:
        return "🍚"
    if "roti" in n or "naan" in n or "paratha" in n or "kulcha" in n or "bread" in n or "dosa" in n or "idli" in n:
        return "🫓"
    if "egg" in n or "omelette" in n:
        return "🍳"
    if "chicken" in n:
        return "🍗"
    if "mutton" in n or "lamb" in n or "keema" in n:
        return "🍖"
    if "fish" in n or "prawn" in n:
        return "🐟"
    if "paneer" in n:
        return "🧀"
    if "dal" in n or "curry" in n or "sabzi" in n or "masala" in n:
        return "🍲"
    if category == "Dessert":
        return "🍮"
    if category == "Drink":
        return "🥤"
    if category in ("Snack", "Appetizer"):
        return "🍿"
    return "🍛"


def existing_names():
    """(region, slot, normalized name) already in the app's REGIONAL_DB."""
    text = ENGINE.read_text()
    start = text.index("const REGIONAL_DB")
    end = text.index("\n};", start)
    block = text[start:end]
    names = set()
    region = slot = None
    for line in block.splitlines():
        m = re.match(r"  '([a-z0-9-]+)': \{$", line)
        if m:
            region = m.group(1)
            continue
        m = re.match(r"    (breakfast|lunch|dinner|snack): \[$", line)
        if m:
            slot = m.group(1)
            continue
        m = re.search(r"name: '([^']+)'", line)
        if m and region and slot:
            names.add((region, slot, m.group(1).strip().lower()))
    return names


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["Pan_India_Dishes_Dataset"]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    idx = {h: i for i, h in enumerate(header)}
    data = rows[1:]

    known = existing_names()
    out: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    seen: set[tuple[str, str, str]] = set()
    stats = Counter()
    dropped_pork: list[str] = []

    for r in data:
        dish_id = r[idx["dish_id"]]
        name = str(r[idx["dish_name"]] or "").strip()
        if not name:
            stats["no_name"] += 1
            continue
        category = str(r[idx["category"]] or "").strip()
        if category == "Condiment":
            stats["condiment"] += 1
            continue
        diet = str(r[idx["diet_type"]] or "").strip()
        ingredients = str(r[idx["key_ingredients"]] or "").strip()
        hay = f"{name} {ingredients}"
        if diet in ("Vegetarian", "Vegan") and PORK_WORD.search(hay):
            stats["pork_in_veg"] += 1
            dropped_pork.append(str(dish_id))
            continue
        region_col = str(r[idx["region"]] or "").strip()
        macro = str(r[idx["macro_region"]] or "").strip()
        region = "kashmir" if region_col in ("Kashmir", "Jammu") else REGION_MAP.get(macro)
        if not region:
            stats["unmapped_region"] += 1
            continue
        slots: set[str] = set()
        for part in str(r[idx["meal_slot"]] or "").split(","):
            w = part.strip().lower()
            for key, slot in SLOT_WORDS:
                if key in w:
                    slots.add(slot)
        slots |= CAT_SLOT.get(category, set())
        if category == "Main Course":
            slots &= {"lunch", "dinner"}  # mains are lunch/dinner even if slot text is odd
        if not slots:
            stats["no_slot"] += 1
            continue
        # macros (dataset has zero missing values, verified Nov 12)
        cal = int(round(float(r[idx["est_calories_kcal"]])))
        protein = float(r[idx["protein_g"]])
        carbs = float(r[idx["carbs_g"]])
        fat = float(r[idx["fat_g"]])
        allergens = str(r[idx["allergens"]] or "").strip()
        allergen_list = [a.strip() for a in allergens.split(",") if a.strip() and a.strip() != "None"] if allergens else []
        tags: list[str] = []
        if diet == "Vegetarian":
            tags.append("vegetarian")
        elif diet == "Vegan":
            tags += ["vegetarian", "vegan"]
        if "Gluten" not in allergen_list and not GLUTEN_WORD.search(ingredients):
            tags.append("gluten-free")
        if protein >= 20:
            tags.append("high-protein")
        sub = str(r[idx["sub_cuisine"]] or "").strip()
        desc = f"{sub} — {ingredients}" if sub else ingredients
        desc = re.sub(r"eggplant", "brinjal", desc, flags=re.I)
        desc = re.sub(r"\s+", " ", desc).strip()
        if allergen_list:
            desc += f" · Contains: {', '.join(allergen_list)}"
        if len(desc) > 140:
            desc = desc[:137].rstrip() + "…"
        prep = r[idx["prep_time_mins"]]
        item = {
            "name": name,
            "emoji": emoji_for(name, category),
            "cal": cal,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "prepTime": f"{int(prep)} min" if prep is not None else "20 min",
            "description": desc,
            "tags": tags,
        }
        for slot in sorted(slots):
            key = (region, slot, name.lower())
            if key in seen:
                stats["dup_in_dataset"] += 1
                continue
            seen.add(key)
            if (region, slot, name.lower()) in known:
                stats["already_in_app"] += 1
                continue
            out[region][slot].append(item)
            stats["imported_slots"] += 1
        stats["imported_dishes"] += 1

    total = sum(len(v) for reg in out.values() for v in reg.values())
    lines = []
    lines.append("// Generated by scripts/import-user-dishes.py from Salik's dataset")
    lines.append("// (pan_india_and_kashmir_2000plus_dishes.xlsx — 2,048 rows, Nov 12, 2026).")
    lines.append("// The 60-row J&K CSV is fully contained in the XLSX, so it is not imported twice.")
    lines.append(f"// Imported {stats['imported_dishes']} dishes into {total} region/slot entries.")
    lines.append(f"// Dropped: {stats['pork_in_veg']} veg/vegan rows naming pork/beef, "
                 f"{stats['condiment']} condiments, {stats['already_in_app']} names already in the app.")
    lines.append("// Tags: diet_type drives vegetarian/vegan; 'gluten-free' when no gluten in")
    lines.append("// allergens/ingredients; 'high-protein' when protein >= 20g. Descriptions carry")
    lines.append("// key ingredients (eggplant written as brinjal) plus a 'Contains:' allergen note")
    lines.append("// so the allergy filters see them.")
    lines.append("import type { FoodItem } from './ai-engine';")
    lines.append("")
    lines.append("export const USER_DISHES: Record<string, Partial<Record<'breakfast' | 'lunch' | 'dinner' | 'snack', FoodItem[]>>> = {")
    for region in sorted(out):
        lines.append(f"  '{region}': {{")
        for slot in ("breakfast", "lunch", "dinner", "snack"):
            items = out[region].get(slot, [])
            if not items:
                continue
            lines.append(f"    {slot}: [")
            for it in items:
                tags = "[" + ", ".join(f"'{t}'" for t in it["tags"]) + "]"
                desc = json.dumps(it["description"], ensure_ascii=False)
                nm = json.dumps(it["name"], ensure_ascii=False)
                lines.append(
                    f"      {{ name: {nm}, emoji: '{it['emoji']}', cal: {it['cal']}, "
                    f"protein: {it['protein']}, carbs: {it['carbs']}, fat: {it['fat']}, "
                    f"prepTime: '{it['prepTime']}', description: {desc}, tags: {tags} }},"
                )
            lines.append("    ],")
        lines.append("  },")
    lines.append("};")
    OUT.write_text("\n".join(lines) + "\n")

    print(f"imported dishes: {stats['imported_dishes']} (slot entries: {total})")
    for region in sorted(out):
        print(f"  {region}: " + ", ".join(f"{s}={len(out[region].get(s, []))}" for s in ("breakfast", "lunch", "dinner", "snack")))
    print("dropped:", dict(stats))
    print("pork-row ids:", ", ".join(dropped_pork[:10]), "..." if len(dropped_pork) > 10 else "")
    print("wrote", OUT, f"({OUT.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    sys.exit(main())
