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
// OpenRouter: third link in the chain — separate free-model quota pool.
const OPENROUTER_MODEL_PREFERENCE = [
  process.env.OPENROUTER_MODEL,
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
].filter((m): m is string => !!m);
const OPENROUTER_VISION_PREFERENCE = [
  process.env.OPENROUTER_VISION_MODEL,
  'qwen/qwen2.5-vl-72b-instruct:free',
].filter((m): m is string => !!m);
const OPENROUTER_REFERER = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://diet-asisstant-app.vercel.app';

export type ProviderName = 'groq' | 'gemini' | 'openrouter';

export type Attempt = { ok: true; reply: string } | { ok: false; reason: string };

let cachedGroqModel: string | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransientError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500 && status <= 504) return true;
  return /429|rate.?limit|quota|resource.?exhausted|50[0234]|overloaded|unavailable|deadline|timed? ?out/i.test(
    String(err).slice(0, 300),
  );
}

/** fetch() that rides through 429s and transient 5xx with backoff (honors Retry-After).
 *  Each attempt is capped at 20s so a hanging provider fails fast instead of
 *  stalling the whole chain. */
async function fetchWithBackoff(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(20000),
    });
    const retryable = res.status === 429 || (res.status >= 500 && res.status <= 504);
    if (!retryable || attempt >= maxRetries) return res;
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

/** Run the provider chain with a rotated start, returning the first successful reply.
 *  Each request starts at a random provider (spreading quota evenly instead of
 *  always hammering Groq first) and fails over through the rest. A provider
 *  that just rate-limited sits out for a minute rather than being retried
 *  into the ground. */
export async function runAiChain(
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{ ok: true; reply: string; provider: ProviderName } | { ok: false; failures: string[] }> {
  const failures: string[] = [];
  for (const provider of rotatedOrder()) {
    const attempt =
      provider === 'groq'
        ? await tryGroq(systemPrompt, userPrompt, opts)
        : provider === 'gemini'
          ? await tryGemini(systemPrompt, userPrompt, opts)
          : await tryOpenRouter(systemPrompt, userPrompt, opts);
    if (attempt.ok) return { ok: true, reply: attempt.reply, provider };
    failures.push(`${provider} (${attempt.reason})`);
    if (/429|rate.?limit|quota|resource.?exhausted/i.test(attempt.reason)) {
      markCooldown(provider);
    }
  }
  return { ok: false, failures };
}

// ── Rotation + cooldown ─────────────────────────────────────────

const COOLDOWN_MS = 60000;
const cooldownUntil = new Map<ProviderName, number>();

function markCooldown(provider: ProviderName, ms: number = COOLDOWN_MS) {
  cooldownUntil.set(provider, Date.now() + ms);
}

/** Providers in rotation order: random start, cooling-down providers last. */
function rotatedOrder(): ProviderName[] {
  const now = Date.now();
  const ready: ProviderName[] = [];
  const cooling: ProviderName[] = [];
  for (const p of ['groq', 'gemini', 'openrouter'] as ProviderName[]) {
    ((cooldownUntil.get(p) ?? 0) > now ? cooling : ready).push(p);
  }
  const start = ready.length ? Math.floor(Math.random() * ready.length) : 0;
  return [...ready.slice(start), ...ready.slice(0, start), ...cooling];
}

// ── OpenRouter (third link — separate free-model quota pool) ────

function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': OPENROUTER_REFERER,
    'X-Title': 'Diet Assistant',
  };
}

async function pickOpenRouterModel(
  apiKey: string,
  preference: string[],
  cache: { model: string | null },
): Promise<string> {
  if (cache.model) return cache.model;
  let available: Set<string> | null = null;
  try {
    const res = await fetchWithBackoff('https://openrouter.ai/api/v1/models', {
      headers: openRouterHeaders(apiKey),
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
    (available && preference.find((m) => available!.has(m))) || preference[0];
  cache.model = pick;
  return pick;
}

const openRouterTextCache = { model: null as string | null };
const openRouterVisionCache = { model: null as string | null };

export async function tryOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<Attempt> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ok: false, reason: 'OPENROUTER_API_KEY not set' };
  try {
    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickOpenRouterModel(apiKey, OPENROUTER_MODEL_PREFERENCE, openRouterTextCache);
      if (!model || attempted.has(model)) break;
      attempted.add(model);
      const res = await fetchWithBackoff('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: openRouterHeaders(apiKey),
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
      if (res.status === 404 && /model_not_found|no such model/i.test(errText)) {
        openRouterTextCache.model = null;
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    return { ok: false, reason: 'no working OpenRouter model found' };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

/** Vision via OpenRouter (fallback when Gemini vision is down). */
export async function tryOpenRouterVision(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<Attempt> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ok: false, reason: 'OPENROUTER_API_KEY not set' };
  try {
    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickOpenRouterModel(apiKey, OPENROUTER_VISION_PREFERENCE, openRouterVisionCache);
      if (!model || attempted.has(model)) break;
      attempted.add(model);
      const res = await fetchWithBackoff('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: openRouterHeaders(apiKey),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 400,
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
      if (res.status === 404 && /model_not_found|no such model/i.test(errText)) {
        openRouterVisionCache.model = null;
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    return { ok: false, reason: 'no working OpenRouter vision model found' };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

/** Wrap a Gemini SDK call with backoff for 429s and transient 5xx. */
async function withSdkBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      // Cap each SDK call at 25s so a hanging provider fails fast.
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          fn(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('SDK call timed out after 25000ms')), 25000);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (err) {
      if (!isTransientError(err) || attempt >= maxRetries) throw err;
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
