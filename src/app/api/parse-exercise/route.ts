import { NextResponse } from 'next/server';
import { checkRateLimit, clientKey } from '@/lib/api-guard';
import { requireUser } from '@/lib/api-auth';
import { runAiChain, extractJsonObject } from '@/lib/ai-providers';
import { estimateExerciseOffline } from '@/lib/offline-estimate';

// ── Exercise estimation ─────────────────────────────────────────
// POST /api/parse-exercise  { text, weightKg? }
// Returns { exercise: { name, caloriesBurned, durationMin? }, provider }
// Estimates calorie burn for a described workout. AI first (Groq → Gemini
// with 429 backoff); MET-formula fallback keeps logging working offline.

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
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(clientKey(req, 'parse-exercise'), 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

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

  const result = await runAiChain(systemPrompt, userPrompt, {
    maxTokens: 300,
    temperature: 0.2,
    validate: (reply) => parseExerciseJson(reply) !== null,
  });
  if (result.ok) {
    // validate() already confirmed this parses.
    const exercise = parseExerciseJson(result.reply)!;
    return NextResponse.json({ exercise, provider: result.provider });
  }
  console.error('Parse-exercise API: all providers failed —', result.failures.join('; '));

  // Offline fallback: MET-formula estimate keeps logging working.
  const offline = estimateExerciseOffline(text, typeof weightKg === 'number' ? weightKg : 70);
  if (offline) {
    return NextResponse.json({ exercise: offline, provider: 'offline' });
  }

  return NextResponse.json(
    { error: 'Could not estimate this workout right now. Please try again in a moment.' },
    { status: 503 },
  );
}
