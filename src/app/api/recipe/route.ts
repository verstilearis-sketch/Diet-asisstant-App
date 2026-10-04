import { NextResponse } from 'next/server';
import { runAiChain, extractJsonObject } from '@/lib/ai-providers';

// ── Recipe generation ─────────────────────────────────────────
// POST /api/recipe  { name, description, calories, protein, prepTime, servings?, restrictions?, region? }
// Returns { ingredients: string[], steps: string[], servings: number, prepTime: string }
// Tries Groq, then Gemini. If both fail it returns 503 — the UI shows a retry
// instead of a made-up recipe.

function parseRecipeJson(raw: string): {
  ingredients: string[]; steps: string[]; servings: number; prepTime: string;
} | null {
  const obj = extractJsonObject(raw);
  if (!obj || !Array.isArray(obj.ingredients) || !Array.isArray(obj.steps)) return null;
  return {
    ingredients: (obj.ingredients as unknown[]).map(String).filter(Boolean).slice(0, 20),
    steps: (obj.steps as unknown[]).map(String).filter(Boolean).slice(0, 15),
    servings: Number(obj.servings) > 0 ? Math.round(Number(obj.servings)) : 2,
    prepTime: String(obj.prepTime || '').slice(0, 30),
  };
}

export async function POST(req: Request) {
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

  const systemPrompt = `You are a professional recipe developer. You write practical, home-kitchen recipes with exact quantities.
Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"ingredients": ["1 cup ...", ...], "steps": ["...", ...], "servings": 2, "prepTime": "25 min"}
Rules: 6–12 ingredients with real quantities; 4–8 clear steps a home cook can follow; keep it achievable with common equipment.`;

  const userPrompt = `Write the recipe for "${name}"${description ? ` (${description})` : ''}.
Target per serving: ~${Math.round(Number(calories) || 400)} kcal, ~${Math.round(Number(protein) || 15)}g protein.
${prepTime ? `Aim for about ${prepTime} total. ` : ''}Servings: ${Number(servings) > 0 ? servings : 2}.
${restrictions?.length ? `Must respect: ${restrictions.join(', ')} (no exceptions).` : ''}
${region ? `Home-kitchen style for ${region}; use locally available ingredients where possible.` : ''}`;

  const result = await runAiChain(systemPrompt, userPrompt, { maxTokens: 1000 });
  if (result.ok) {
    const recipe = parseRecipeJson(result.reply);
    if (recipe) return NextResponse.json({ recipe, provider: result.provider });
    console.error('Recipe API: groq/gemini returned bad JSON');
  } else {
    console.error('Recipe API: all providers failed —', result.failures.join('; '));
  }

  return NextResponse.json(
    { error: 'Recipe service is unavailable right now. Please try again in a moment.' },
    { status: 503 },
  );
}
