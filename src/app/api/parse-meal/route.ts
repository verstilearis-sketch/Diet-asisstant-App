import { NextResponse } from 'next/server';
import { runAiChain, extractJsonObject } from '@/lib/ai-providers';
import { estimateMealOffline } from '@/lib/offline-estimate';
import { estimateFromDb } from '@/lib/food-db';

// ── Free-text meal logging ────────────────────────────────────
// POST /api/parse-meal  { text, restrictions?, region? }
// Returns { meal: { name, calories, proteinG, carbsG, fatG }, provider }
// 1. Bundled Indian food-composition database (ICMR-NIN IFCT 2017 +
//    Anuvaad INDB) — instant, no AI call, most accurate for Indian dishes.
// 2. AI estimator chain (Groq → Gemini → …).
// 3. Local offline unit-food estimate so logging keeps working.

function parseMealJson(raw: string): {
  name: string; calories: number; proteinG: number; carbsG: number; fatG: number;
} | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  const name = String(obj.name || '').slice(0, 80).trim();
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  if (!name) return null;
  return {
    name,
    calories: Math.min(2500, Math.round(num(obj.calories))),
    proteinG: Math.round(num(obj.proteinG) * 10) / 10,
    carbsG: Math.round(num(obj.carbsG) * 10) / 10,
    fatG: Math.round(num(obj.fatG) * 10) / 10,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { text, restrictions, region } = (body ?? {}) as {
    text?: string; restrictions?: string[]; region?: string;
  };

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Describe what you ate' }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: 'Please keep the description under 500 characters' }, { status: 400 });
  }

  // 1. Real food-composition data first — instant and most accurate for
  //    Indian dishes (no AI call needed).
  const dbHit = estimateFromDb(text);
  if (dbHit) {
    return NextResponse.json({
      meal: dbHit.meal,
      provider: 'food-db',
      dbSource: dbHit.source,
    });
  }

  const systemPrompt = `You are a nutrition estimator. Given a free-text description of food someone ate, estimate its nutrition as accurately as you can.
Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"name": "short meal name", "calories": 420, "proteinG": 25, "carbsG": 45, "fatG": 12}
Rules: calories as a whole number; macros in grams with one decimal at most; assume realistic home-cooked portions when amounts are vague (e.g. "a plate of biryani" ≈ one generous serving); include likely hidden items (cooking oil, ghee, sauces) in the totals; name should be 2–6 words.`;

  const userPrompt = `Estimate the nutrition for: "${text.trim()}"
${restrictions?.length ? `Note the eater's restrictions: ${restrictions.join(', ')} — just name foods accurately, do not moralize.` : ''}
${region ? `Regional context: ${region}.` : ''}`;

  const result = await runAiChain(systemPrompt, userPrompt, {
    maxTokens: 300,
    temperature: 0.2,
    validate: (reply) => parseMealJson(reply) !== null,
  });
  if (result.ok) {
    // validate() already confirmed this parses.
    const meal = parseMealJson(result.reply)!;
    return NextResponse.json({ meal, provider: result.provider });
  }
  console.error('Parse-meal API: all providers failed —', result.failures.join('; '));

  // Offline fallback: local unit-food estimate keeps logging working.
  const offline = estimateMealOffline(text);
  if (offline) {
    return NextResponse.json({ meal: offline, provider: 'offline' });
  }

  return NextResponse.json(
    { error: 'Could not estimate this meal right now. Please try again in a moment.' },
    { status: 503 },
  );
}
