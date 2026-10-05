import { NextResponse } from 'next/server';
import { tryGeminiVision, tryOpenRouterVision, extractJsonObject } from '@/lib/ai-providers';

// ── Photo meal logging ──────────────────────────────────────────
// POST /api/parse-meal-photo  { imageBase64, mimeType? }
// Returns { meal: { name, calories, proteinG, carbsG, fatG }, provider }
// Identifies the meal in a photo and estimates nutrition. Vision goes to
// Gemini, then GitHub Models, then OpenRouter (Groq's vision models keep
// retiring). Each gets a tight budget — fail over fast instead of stalling.
// Estimates are approximate — the UI labels them as such.

const MAX_BASE64_LEN = 4_000_000; // ~3MB image; client downscales to ~768px first

function parseMealJson(raw: string): {
  name: string; calories: number; proteinG: number; carbsG: number; fatG: number;
  verdict: 'yes' | 'okay' | 'skip'; verdictWhy: string;
} | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  const name = String(obj.name || '').slice(0, 80).trim();
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  if (!name) return null;
  const verdictRaw = String(obj.verdict || '').toLowerCase();
  const verdict: 'yes' | 'okay' | 'skip' =
    verdictRaw === 'yes' || verdictRaw === 'skip' ? verdictRaw : 'okay';
  return {
    name,
    calories: Math.min(2500, Math.round(num(obj.calories))),
    proteinG: Math.round(num(obj.proteinG) * 10) / 10,
    carbsG: Math.round(num(obj.carbsG) * 10) / 10,
    fatG: Math.round(num(obj.fatG) * 10) / 10,
    verdict,
    verdictWhy: String(obj.verdictWhy || '').slice(0, 220),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { imageBase64, mimeType, goal, remainingKcal, restrictions } =
    (body ?? {}) as {
      imageBase64?: string; mimeType?: string; goal?: string;
      remainingKcal?: number; restrictions?: string[];
    };

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }
  // Tolerate data URLs — keep only the base64 payload.
  const clean = imageBase64.includes(',') ? imageBase64.split(',').pop()! : imageBase64;
  if (!/^[A-Za-z0-9+/=]+$/.test(clean.slice(0, 100)) || clean.length < 1000) {
    return NextResponse.json({ error: 'That photo could not be read' }, { status: 400 });
  }
  if (clean.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: 'Photo is too large — try a smaller one' }, { status: 400 });
  }
  const type = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

  const goalLabel = (goal || 'general health').replace(/_/g, ' ');
  const prompt = `You are a nutrition estimator looking at a photo of someone's meal or a food product.
Identify the foods and estimate the total nutrition for the whole plate (or the product as shown) as accurately as you can. If it's a packaged product, read the label if visible.
Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"name": "short meal name", "calories": 420, "proteinG": 25, "carbsG": 45, "fatG": 12, "verdict": "yes", "verdictWhy": "one or two sentences"}
Rules: calories as a whole number; macros in grams with one decimal at most; estimate realistic portions from what you see (plate size is a guide); include likely hidden items (cooking oil, ghee, sauces) in the totals; if several distinct items are visible, roll them into one meal total; name should be 2–6 words.
Also judge whether this fits the diner's day. Diner's goal: ${goalLabel}.${typeof remainingKcal === 'number' ? ` They have about ${Math.max(0, Math.round(remainingKcal))} kcal left today.` : ''}${restrictions?.length ? ` Hard restrictions (never recommend these): ${restrictions.join(', ')}.` : ''}
"verdict": "yes" if it fits their goal well, "okay" if it's fine in a small portion or occasionally, "skip" if it works against their goal or breaks a restriction.
"verdictWhy": 1–2 sentences, specific and friendly, never lecturing. Name the key trade-off (e.g. "deep-fried — tasty, but this alone eats half your remaining calories" or "solid protein, fits your day easily").`;

  const attempts = [
    { name: 'gemini', run: () => tryGeminiVision(clean, type, prompt, { maxTokens: 400, temperature: 0.2 }) },
    { name: 'openrouter', run: () => tryOpenRouterVision(clean, type, prompt, { maxTokens: 400, temperature: 0.2 }) },
  ];
  let vision: { ok: boolean; reply?: string; reason?: string } = { ok: false, reason: 'no attempt made' };
  let provider = 'gemini';
  const failures: string[] = [];
  for (const a of attempts) {
    const result = await a.run();
    if (!result.ok) {
      failures.push(`${a.name} (${result.reason})`);
      continue;
    }
    // A reply that doesn't parse as a meal fails over to the next provider
    // instead of ending the chain.
    if (parseMealJson(result.reply)) {
      vision = result;
      provider = a.name;
      break;
    }
    failures.push(`${a.name} (unusable response)`);
  }
  if (vision.ok && vision.reply) {
    const meal = parseMealJson(vision.reply)!;
    return NextResponse.json({ meal, provider });
  }
  console.error('Parse-meal-photo API: vision failed —', failures.join('; '));

  return NextResponse.json(
    { error: 'Could not read this photo right now. Please try again in a moment.' },
    { status: 503 },
  );
}
