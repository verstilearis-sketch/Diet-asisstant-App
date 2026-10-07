import { NextResponse } from 'next/server';
import { checkRateLimit, clientKey } from '@/lib/api-guard';
import { requireUser } from '@/lib/api-auth';
import {
  searchIndianFoods,
  lookupBarcode,
  searchOpenFoodFacts,
  searchUsda,
  FOOD_DB_ATTRIBUTION,
} from '@/lib/food-db';

// ── Unified food-nutrition lookup ────────────────────────────
// GET /api/food-lookup?q=roti            → bundled Indian dataset (instant)
// GET /api/food-lookup?barcode=8901234   → Open Food Facts (packaged foods)
// GET /api/food-lookup?q=tofu&world=off  → Open Food Facts text search
// GET /api/food-lookup?q=quinoa&world=usda → USDA FoodData Central
// Response: { results: [{ name, per100g:{kcal,proteinG,carbsG,fatG}, serving?, source, sourceUrl? }], attribution }

export const maxDuration = 30;

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(clientKey(req, 'food-lookup'), 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const barcode = (url.searchParams.get('barcode') || '').trim().slice(0, 32);
  const world = (url.searchParams.get('world') || '').trim().toLowerCase();

  try {
    if (barcode) {
      const entry = await lookupBarcode(barcode);
      return NextResponse.json({
        results: entry ? [entry] : [],
        attribution: FOOD_DB_ATTRIBUTION,
      });
    }
    if (!q) {
      return NextResponse.json({ error: 'Provide q or barcode' }, { status: 400 });
    }
    if (world === 'usda') {
      const results = await searchUsda(q);
      return NextResponse.json({ results, attribution: FOOD_DB_ATTRIBUTION });
    }
    if (world === 'off') {
      const results = await searchOpenFoodFacts(q);
      return NextResponse.json({ results, attribution: FOOD_DB_ATTRIBUTION });
    }
    const results = searchIndianFoods(q);
    return NextResponse.json({ results, attribution: FOOD_DB_ATTRIBUTION });
  } catch (e) {
    console.error('food-lookup failed:', e);
    return NextResponse.json({ results: [], attribution: FOOD_DB_ATTRIBUTION });
  }
}
