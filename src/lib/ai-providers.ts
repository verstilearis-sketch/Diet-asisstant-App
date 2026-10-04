import { GoogleGenAI } from '@google/genai';

// ── Shared AI provider chain: Groq first, then Gemini ───────────────
// Used by the recipe and meal-parsing API routes. Callers pass their own
// prompts; this file only handles model selection, requests and fallbacks.

const GROQ_MODEL_PREFERENCE = [
  process.env.GROQ_MODEL,
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
  'openai/gpt-oss-20b',
].filter((m): m is string => !!m);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export type Attempt = { ok: true; reply: string } | { ok: false; reason: string };

let cachedGroqModel: string | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  return /429|rate.?limit|quota|resource.?exhausted/i.test(String(err).slice(0, 300));
}

/** fetch() that rides through 429s with backoff (honors Retry-After). */
async function fetchWithBackoff(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= maxRetries) return res;
    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30000, retryAfter * 1000)
      : Math.min(8000, 1000 * 2 ** attempt);
    await res.arrayBuffer().catch(() => {});
    await sleep(waitMs);
  }
}

async function pickGroqModel(apiKey: string): Promise<string> {
  if (cachedGroqModel) return cachedGroqModel;
  let available: Set<string> | null = null;
  try {
    const res = await fetchWithBackoff('https://api.groq.com/openai/v1/models', {
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

export async function tryGroq(
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<Attempt> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, reason: 'GROQ_API_KEY not set' };
  try {
    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickGroqModel(apiKey);
      if (attempted.has(model)) break;
      attempted.add(model);
      const res = await fetchWithBackoff('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens ?? 1000,
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

export async function tryGemini(
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<Attempt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: 'GEMINI_API_KEY not set' };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await withSdkBackoff(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: opts.temperature ?? 0.3,
          maxOutputTokens: opts.maxTokens ?? 1000,
        },
      }),
    );
    const reply = response.text?.trim();
    if (!reply) return { ok: false, reason: 'empty response body' };
    return { ok: true, reply };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

/** Run the Groq → Gemini chain, returning the first successful reply. */
export async function runAiChain(
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{ ok: true; reply: string; provider: 'groq' | 'gemini' } | { ok: false; failures: string[] }> {
  const failures: string[] = [];
  for (const provider of ['groq', 'gemini'] as const) {
    const attempt = provider === 'groq' ? await tryGroq(systemPrompt, userPrompt, opts) : await tryGemini(systemPrompt, userPrompt, opts);
    if (attempt.ok) return { ok: true, reply: attempt.reply, provider };
    failures.push(`${provider} (${attempt.reason})`);
  }
  return { ok: false, failures };
}

/** Wrap a Gemini SDK call with 429 backoff. */
async function withSdkBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= maxRetries) throw err;
      await sleep(Math.min(8000, 1000 * 2 ** attempt));
    }
  }
}

/** Vision via Gemini: describe/estimate what's in a photo. Groq's vision
 *  models keep retiring, so photos go straight to Gemini. */
export async function tryGeminiVision(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<Attempt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: 'GEMINI_API_KEY not set' };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await withSdkBackoff(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }],
          },
        ],
        config: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxTokens ?? 400,
        },
      }),
    );
    const reply = response.text?.trim();
    if (!reply) return { ok: false, reason: 'empty response body' };
    return { ok: true, reply };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

/** Pull a JSON object out of a model reply that may include code fences. */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
