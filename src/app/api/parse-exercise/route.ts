import { NextResponse } from 'next/server';
import { runAiChain, extractJsonObject } from '@/lib/ai-providers';

// ── Exercise estimation ─────────────────────────────────────────
// POST /api/parse-exercise  { text, weightKg? }
// Returns { exercise: { name, caloriesBurned, durationMin? }, provider }
// Estimates calorie burn for a described workout. Conservative on purpose.

function parseExerciseJson(raw: string): {
  name: string; caloriesBurned: number; durationMin?: number;
} | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  const name = String(obj.name || '').slice(0, 80).trim();
  const burn = Number(obj.caloriesBurned);
  if (!name || !Number.isFinite(burn) || burn < 0) return null;
  const durationMin = Number(obj.durationMin);
  return {
    name,
    caloriesBurned: Math.min(2000, Math.round(burn)),
    ...(Number.isFinite(durationMin) && durationMin > 0
      ? { durationMin: Math.min(600, Math.round(durationMin)) }
      : {}),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { text, weightKg } = (body ?? {}) as { text?: string; weightKg?: number };

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Describe your workout' }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: 'Please keep the description under 300 characters' }, { status: 400 });
  }

  const systemPrompt = `You are a fitness data estimator. Given a free-text workout description and the person's body weight, estimate calories burned.
Always respond with STRICT JSON only — no markdown, no code fences, no commentary. Shape:
{"name": "short workout name", "caloriesBurned": 180, "durationMin": 30}
Rules: caloriesBurned as a whole number; be realistic and slightly conservative, especially for casual activity; durationMin in minutes — omit it when the text gives no usable duration; name should be 2–5 words.`;

  const userPrompt =
    `Estimate the calorie burn for: "${text.trim()}"` +
    (typeof weightKg === 'number' && weightKg > 0 ? `\nBody weight: ${weightKg} kg.` : '');

  const result = await runAiChain(systemPrompt, userPrompt, { maxTokens: 300, temperature: 0.2 });
  if (result.ok) {
    const exercise = parseExerciseJson(result.reply);
    if (exercise) return NextResponse.json({ exercise, provider: result.provider });
    console.error('Parse-exercise API: provider returned bad JSON');
  } else {
    console.error('Parse-exercise API: all providers failed —', result.failures.join('; '));
  }

  return NextResponse.json(
    { error: 'Could not estimate this workout right now. Please try again in a moment.' },
    { status: 503 },
  );
}
