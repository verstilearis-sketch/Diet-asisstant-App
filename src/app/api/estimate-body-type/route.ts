import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { checkRateLimit, clientKey, validString } from '@/lib/api-guard';
import { tryGeminiVision, tryOpenRouterVision, extractJsonObject } from '@/lib/ai-providers';

// ── AI body-type estimate from the onboarding photo ───────────────
// POST /api/estimate-body-type  { imageBase64, mimeType? }
// Returns { bodyType: 'lean'|'athletic'|'average'|'soft'|'plus' }.
// This is a rough visual estimate used only to pre-select the body-type
// figure — the user always confirms or changes it. Never a measurement.

export const maxDuration = 45;

const MAX_BASE64_LEN = 4_000_000; // ~3MB; client compresses to ≤512px first

const VALID_TYPES = ['lean', 'athletic', 'average', 'soft', 'plus'] as const;
type BodyType = (typeof VALID_TYPES)[number];

const PROMPT = `Look at this person's photo and estimate their overall body build. This is a rough visual estimate for a diet app's body-type picker, not a medical measurement.

Classify into exactly ONE of:
- "lean": slim build, narrow frame, little visible body fat
- "athletic": toned, visibly defined muscles, fit build
- "average": typical balanced build, neither slim nor heavy
- "soft": rounder midsection, softer less-defined shape
- "plus": fuller figure throughout, heavier build

Be respectful and neutral. If you cannot see a person clearly, pick "average".

Respond with ONLY this JSON, nothing else: {"bodyType": "<one of the five>"}`;

function parseBodyType(raw: string): BodyType | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  const t = String(obj.bodyType || '').toLowerCase().trim();
  return (VALID_TYPES as readonly string[]).includes(t) ? (t as BodyType) : null;
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(clientKey(req, 'estimate-body-type'), 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { imageBase64, mimeType } = (body ?? {}) as { imageBase64?: string; mimeType?: string };
  if (!imageBase64 || validString(imageBase64, MAX_BASE64_LEN) === null) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }
  const mime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  // Tolerate data URLs — keep only the base64 payload.
  const base64 = imageBase64.includes(',') ? imageBase64.split(',').pop()! : imageBase64;

  const failures: string[] = [];

  // Gemini first, then OpenRouter — tight budgets, fail over fast.
  try {
    const r = await tryGeminiVision(base64, mime, PROMPT, { maxTokens: 100, temperature: 0.1 });
    if (!r.ok) {
      failures.push(`gemini (${r.reason})`);
    } else {
      const t = parseBodyType(r.reply);
      if (t) return NextResponse.json({ bodyType: t, provider: 'gemini' });
      failures.push('gemini (unparseable reply)');
    }
  } catch (err) {
    failures.push(`gemini (${String(err).slice(0, 100)})`);
  }

  try {
    const r = await tryOpenRouterVision(base64, mime, PROMPT, { maxTokens: 100, temperature: 0.1 });
    if (!r.ok) {
      failures.push(`openrouter (${r.reason})`);
    } else {
      const t = parseBodyType(r.reply);
      if (t) return NextResponse.json({ bodyType: t, provider: 'openrouter' });
      failures.push('openrouter (unparseable reply)');
    }
  } catch (err) {
    failures.push(`openrouter (${String(err).slice(0, 100)})`);
  }

  console.error('Estimate-body-type: all vision providers failed —', failures.join('; '));
  return NextResponse.json({ error: 'Could not analyze the photo' }, { status: 502 });
}
