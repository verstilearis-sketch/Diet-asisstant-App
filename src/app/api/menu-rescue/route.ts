import { NextResponse } from 'next/server';
import { tryGeminiVision, tryOpenRouterVision, extractJsonObject } from '@/lib/ai-providers';

// ── Menu rescue ───────────────────────────────────────────────
// POST /api/menu-rescue  { imageBase64, mimeType?, goal?, calorieGoal?, remainingKcal?, restrictions?, region? }
// Returns { picks: [{ name, calories, proteinG, why }], provider }
// Reads a restaurant menu photo and picks the 3 smartest options for the
// diner's goal. Vision: Gemini first, OpenRouter fallback (both fail-fast so
// the request stays under the serverless time budget).

// Give the vision chain room to finish both providers.
export const maxDuration = 60;

const MAX_BASE64_LEN = 4_000_000;

export interface MenuPick {
  name: string;
  calories: number;
  proteinG: number;
  why: string;
}

function parsePicksJson(raw: string): MenuPick[] | null {
  const obj = extractJsonObject(raw);
  if (!obj || !Array.isArray(obj.picks)) return null;
  const picks: MenuPick[] = [];
  for (const p of obj.picks as unknown[]) {
    if (!p || typeof p !== 'object') continue;
    const rec = p as Record<string, unknown>;
    const name = String(rec.name || '').slice(0, 80).trim();
    const calories = Number(rec.calories);
    if (!name || !Number.isFinite(calories) || calories < 0) continue;
    const protein = Number(rec.proteinG);
    picks.push({
      name,
      calories: Math.min(2500, Math.round(calories)),
      proteinG: Number.isFinite(protein) && protein >= 0 ? Math.round(protein * 10) / 10 : 0,
      why: String(rec.why || '').slice(0, 140),
    });
    if (picks.length >= 3) break;
  }
  return picks.length ? picks : null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { imageBase64, mimeType, goal, calorieGoal, remainingKcal, restrictions, region } =
    (body ?? {}) as {
      imageBase64?: string; mimeType?: string; goal?: string;
      calorieGoal?: number; remainingKcal?: number; restrictions?: string[]; region?: string;
    };

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return NextResponse.json({ error: 'No menu photo provided' }, { status: 400 });
  }
  const clean = imageBase64.includes(',') ? imageBase64.split(',').pop()! : imageBase64;
  if (!/^[A-Za-z0-9+/=]+$/.test(clean.slice(0, 100)) || clean.length < 1000) {
    return NextResponse.json({ error: 'That photo could not be read' }, { status: 400 });
  }
  if (clean.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: 'Photo is too large — try a smaller one' }, { status: 400 });
  }
  const type = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

  const goalLabel = (goal || 'general health').replace(/_/g, ' ');
  const prompt = `You are a nutrition coach looking at a restaurant menu photo. The diner's goal is ${goalLabel}.
${typeof calorieGoal === 'number' ? `Daily calorie target: ${Math.round(calorieGoal)} kcal. ` : ''}${typeof remainingKcal === 'number' ? `They have about ${Math.round(remainingKcal)} kcal left today. ` : ''}
${restrictions?.length ? `Hard restrictions (never suggest these): ${restrictions.join(', ')}. ` : ''}${region ? `Cuisine context: ${region}. ` : ''}
Pick the 3 best menu items for this diner. Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"picks": [{"name": "dish name as on menu", "calories": 450, "proteinG": 25, "why": "one-line reason under 20 words"}]}
Rules: prefer high-protein, moderate-calorie options suited to the goal; estimate realistic restaurant portions including oil/butter/ghee; keep each "why" specific to their goal and under 20 words; never invent dishes not on the menu.`;

  const attempts = [
    { name: 'gemini', run: () => tryGeminiVision(clean, type, prompt, { maxTokens: 600, temperature: 0.3 }) },
    { name: 'openrouter', run: () => tryOpenRouterVision(clean, type, prompt, { maxTokens: 600, temperature: 0.3 }) },
  ];
  const failures: string[] = [];
  for (const a of attempts) {
    const result = await a.run();
    if (!result.ok) {
      failures.push(`${a.name} (${result.reason})`);
      continue;
    }
    const picks = parsePicksJson(result.reply);
    if (picks) return NextResponse.json({ picks, provider: a.name });
    failures.push(`${a.name} (unusable response)`);
  }
  console.error('Menu-rescue API: vision failed —', failures.join('; '));

  return NextResponse.json(
    { error: 'Could not read this menu right now. Please try again in a moment.' },
    { status: 503 },
  );
}
