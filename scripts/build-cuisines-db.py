#!/usr/bin/env python3
"""Build the app's compact per-serving dish lookup from the unified
Indian Cuisines Database (3,970 entries, JSON).

Usage:
    python3 scripts/build-cuisines-db.py [path/to/Indian_Cuisines_Database.json]

Output: src/data/indian-cuisines.json — one object per dish:
    { "n": display name, "a": [matchable normalized names],
      "k": kcal, "p": protein g, "c": carbs g, "f": fat g,
      "s": serving grams or null }

Rules (decided with Salik, Nov 13, 2026):
- Only per-serving entries with full macros. Per-100g rows (631, mostly
  raw foods with no serving weight) are skipped — the INDB/IFCT
  composition table already covers those, and a serving can't be derived
  from them. The 5 calorie-only rows (null macros) are skipped too; the
  AI estimator gives a fuller answer for those.
- Matchable names: the display name with "(...)" stripped, the full name,
  and local_name when different (e.g. Kashmiri 'Dama Oluv' for Dum Aloo).
- Dish names are unique across the whole database (verified), so one
  name maps to exactly one entry — no region disambiguation needed.
- The full 3.9MB source JSON stays out of the app bundle; only this
  compact lookup (~400KB) ships, server-side only (food-db.ts is
  imported by API routes, never by client components).
"""
import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "workspace/user/files/Indian_Cuisines_Database.json"
OUT = Path(__file__).resolve().parent.parent / "src/data/indian-cuisines.json"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", (s or "").lower())).strip()


def short_name(name: str) -> str:
    # 'Butter Chicken (Murgh Makhani)' -> 'Butter Chicken'
    return re.sub(r"\s*\([^)]*\)\s*", " ", name).strip()


def r1(v):
    return round(float(v) * 10) / 10


def main() -> None:
    data = json.loads(SRC.read_text())
    entries = data["entries"]
    out = []
    skipped_per100g = skipped_no_macros = 0
    for e in entries:
        basis = (e.get("basis") or "")
        if not basis.startswith("per serving"):
            skipped_per100g += 1
            continue
        if e.get("protein_g") is None or e.get("carbs_g") is None or e.get("fat_g") is None:
            skipped_no_macros += 1
            continue
        kcal = e.get("calories_kcal")
        if not kcal or float(kcal) <= 0:
            skipped_no_macros += 1
            continue
        aliases = []
        for cand in (short_name(e["name"]), e["name"], e.get("local_name")):
            n = norm(cand or "")
            if len(n) >= 3 and n not in aliases:
                aliases.append(n)
        s = e.get("serving_size_g")
        out.append({
            "n": e["name"][:80],
            "a": aliases,
            "k": int(round(float(kcal))),
            "p": r1(e["protein_g"]),
            "c": r1(e["carbs_g"]),
            "f": r1(e["fat_g"]),
            "s": float(s) if s else None,
        })
    out.sort(key=lambda d: d["n"].lower())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out))
    print(f"wrote {OUT} — {len(out)} dishes "
          f"(skipped {skipped_per100g} per-100g, {skipped_no_macros} no-macros)")
    # Generic single-word targets — verify they exist with sane values.
    by_norm = {a: d for d in out for a in d["a"]}
    for target in ["Hyderabadi Dum Biryani", "Chicken Biryani", "Medu Vada",
                   "Paneer curry", "Carrot halwa", "Plain dosa", "Veg Pulao",
                   "Pulao", "Chole Masala", "Idli Sambar", "Sambar"]:
        d = by_norm.get(norm(target))
        print(f"  {target}: {d['k'] if d else 'MISSING'} kcal"
              + (f" (P{d['p']} C{d['c']} F{d['f']})" if d else ""))


if __name__ == "__main__":
    main()
