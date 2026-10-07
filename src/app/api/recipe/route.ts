import { NextResponse } from 'next/server';
import { checkRateLimit, clientKey } from '@/lib/api-guard';
import { runAiChain, extractJsonObject } from '@/lib/ai-providers';

// ── Recipe generation ─────────────────────────────────────────
// POST /api/recipe  { name, description, calories, protein, prepTime, servings?, restrictions?, region? }
// Returns { ingredients: string[], steps: string[], servings: number, prepTime: string }
// Tries Groq → Gemini → OpenRouter. If all fail it returns 503 — the UI shows
// a retry instead of a made-up recipe.

// Give the AI chain room to finish: recipes are long generations.
export const maxDuration = 60;

function parseRecipeJson(raw: string): {
  ingredients: string[]; steps: string[]; servings: number; prepTime: string;
} | null {
  const obj = extractJsonObject(raw);
  if (!obj || !Array.isArray(obj.ingredients) || !Array.isArray(obj.steps)) return null;
  // Some models repeat a sentence twice within a step ("Heat oil. Heat oil.").
  // Collapse consecutive duplicate sentences.
  const dedup = (text: string): string => {
    const sentences = text.match(/[^.!?]+[.!?]+["']?/g) || [text];
    const out: string[] = [];
    for (const s of sentences) {
      const t = s.trim();
      if (t && t.toLowerCase() !== (out[out.length - 1] || '').trim().toLowerCase()) out.push(s.trim());
    }
    return out.join(' ').trim() || text.trim();
  };
  return {
    ingredients: (obj.ingredients as unknown[]).map((x) => dedup(String(x))).filter(Boolean).slice(0, 20),
    steps: (obj.steps as unknown[]).map((x) => dedup(String(x))).filter(Boolean).slice(0, 15),
    servings: Number(obj.servings) > 0 ? Math.round(Number(obj.servings)) : 2,
    prepTime: String(obj.prepTime || '').slice(0, 30),
  };
}

export async function POST(req: Request) {
  if (!checkRateLimit(clientKey(req, 'recipe'), 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, description, calories, protein, prepTime, servings, restrictions, region } =
    (body ?? {}) as {
      name?: string; description?: string; calories?: number; protein?: number;
      prepTime?: string; servings?: number; restrictions?: string[]; region?: string;
    };

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: 'name must be under 200 characters' }, { status: 400 });
  }
  if (description && (typeof description !== 'string' || description.length > 500)) {
    return NextResponse.json({ error: 'description must be under 500 characters' }, { status: 400 });
  }

  const systemPrompt = `You are a professional recipe developer. You write practical, home-kitchen recipes with exact quantities.
Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"ingredients": ["1 cup ...", ...], "steps": ["...", ...], "servings": 2, "prepTime": "25 min"}
Rules: 6–12 ingredients with real quantities; 4–8 clear steps a home cook can follow; keep it achievable with common equipment.`;

  const userPrompt = `Write the recipe for "${name}"${description ? ` (${description})` : ''}.
Target per serving: ~${Math.round(Number(calories) || 400)} kcal, ~${Math.round(Number(protein) || 15)}g protein.
${prepTime ? `Aim for about ${prepTime} total. ` : ''}Servings: ${Number(servings) > 0 ? servings : 2}.
${restrictions?.length ? `Must respect: ${restrictions.join(', ')} (no exceptions).` : ''}
${region ? `Home-kitchen style for ${region}; use locally available ingredients where possible.` : ''}`;

  const result = await runAiChain(systemPrompt, userPrompt, {
    // 2000 tokens: a full recipe (12 ingredients + 8 steps) needs room.
    // If a provider still truncates, runAiChain retries it with double.
    maxTokens: 2000,
    validate: (reply) => parseRecipeJson(reply) !== null,
  });
  if (result.ok) {
    // validate() already confirmed this parses.
    const recipe = parseRecipeJson(result.reply)!;
    return NextResponse.json({ recipe, provider: result.provider });
  }
  console.error('Recipe API: all providers failed —', result.failures.join('; '));

  return NextResponse.json(
    { error: 'Recipe service is unavailable right now. Please try again in a moment.' },
    { status: 503 },
  );
}
