import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Recipe generation ─────────────────────────────────────────
// POST /api/recipe  { name, description, calories, protein, prepTime, servings?, restrictions?, region? }
// Returns { ingredients: string[], steps: string[], servings: number, prepTime: string }
// Tries Groq, then Gemini. If both fail it returns 503 — the UI shows a retry
// instead of a made-up recipe.

const GROQ_MODEL_PREFERENCE = [
  process.env.GROQ_MODEL,
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
  'openai/gpt-oss-20b',
].filter((m): m is string => !!m);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

type Attempt = { ok: true; reply: string } | { ok: false; reason: string };

let cachedGroqModel: string | null = null;

async function pickGroqModel(apiKey: string): Promise<string> {
  if (cachedGroqModel) return cachedGroqModel;
  let available: Set<string> | null = null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      available = new Set(
        ((data?.data ?? []) as { id?: string }[]).map((m) => m.id).filter(Boolean) as string[],
      );
    }
  } catch {
    // fall through to preference order
  }
  const pick =
    (available && GROQ_MODEL_PREFERENCE.find((m) => available!.has(m))) ||
    GROQ_MODEL_PREFERENCE[0];
  cachedGroqModel = pick;
  return pick;
}

async function tryGroq(systemPrompt: string, userPrompt: string): Promise<Attempt> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, reason: 'GROQ_API_KEY not set' };
  try {
    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickGroqModel(apiKey);
      if (attempted.has(model)) break;
      attempted.add(model);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) return { ok: false, reason: 'empty response body' };
        return { ok: true, reply };
      }
      const errText = (await res.text()).slice(0, 200);
      if (res.status === 404 && errText.includes('model_not_found')) {
        cachedGroqModel = null;
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    return { ok: false, reason: 'no working Groq model found' };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

async function tryGemini(systemPrompt: string, userPrompt: string): Promise<Attempt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: 'GEMINI_API_KEY not set' };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: { systemInstruction: systemPrompt, temperature: 0.3, maxOutputTokens: 1000 },
    });
    const reply = response.text?.trim();
    if (!reply) return { ok: false, reason: 'empty response body' };
    return { ok: true, reply };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

function parseRecipeJson(raw: string): {
  ingredients: string[]; steps: string[]; servings: number; prepTime: string;
} | null {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(obj.ingredients) || !Array.isArray(obj.steps)) return null;
    return {
      ingredients: obj.ingredients.map(String).filter(Boolean).slice(0, 20),
      steps: obj.steps.map(String).filter(Boolean).slice(0, 15),
      servings: Number(obj.servings) > 0 ? Math.round(Number(obj.servings)) : 2,
      prepTime: String(obj.prepTime || '').slice(0, 30),
    };
  } catch {
    return null;
  }
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

  const failures: string[] = [];
  for (const provider of ['groq', 'gemini'] as const) {
    const attempt =
      provider === 'groq'
        ? await tryGroq(systemPrompt, userPrompt)
        : await tryGemini(systemPrompt, userPrompt);
    if (attempt.ok) {
      const recipe = parseRecipeJson(attempt.reply);
      if (recipe) return NextResponse.json({ recipe, provider });
      failures.push(`${provider} (bad JSON)`);
    } else {
      failures.push(`${provider} (${attempt.reason})`);
    }
  }

  console.error('Recipe API: all providers failed —', failures.join('; '));
  return NextResponse.json(
    { error: 'Recipe service is unavailable right now. Please try again in a moment.' },
    { status: 503 },
  );
}
