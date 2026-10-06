import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { tryPollinations } from '@/lib/ai-providers';

// 60s execution budget: the failover chain below is tuned to always resolve
// (or fail over to the instant offline reply) well inside it.
export const maxDuration = 60;

// ── Health-coach AI providers ─────────────────────────────────
// The coach rotates across Groq, Gemini and OpenRouter: each request starts
// at a random provider (spreading quota evenly) and fails over through the
// rest. A provider that just rate-limited sits out for a minute. If all
// three are down, keyword-based offline replies keep the coach talking.
// Set AI_PROVIDER=gemini to bias the rotation toward Gemini first.
//
// Groq retires model IDs regularly, so the route asks Groq which models
// currently exist (/v1/models) and picks the first from the preference list
// below. Set GROQ_MODEL to pin a specific model — it is preferred when
// available, otherwise the route falls through to the next working one.
// OpenRouter works the same way via OPENROUTER_MODEL.
//
// Put keys in .env.local (project root, next to package.json):
//   GROQ_API_KEY=...        (fresh key from console.groq.com)
//   GEMINI_API_KEY=...      (optional backup, from Google AI Studio)
//   OPENROUTER_API_KEY=...  (optional backup, free key from openrouter.ai/keys)
//   GROQ_MODEL=...          (optional; default auto-selected)
//   GEMINI_MODEL=...        (optional; default gemini-3.5-flash)
//   OPENROUTER_MODEL=...    (optional; default auto-selected free model)

const GROQ_MODEL_PREFERENCE = [
  process.env.GROQ_MODEL,
  // llama-3.1-8b-instant was decommissioned by Groq on 2026-08-16;
  // openai/gpt-oss-20b is Groq's official replacement.
  'openai/gpt-oss-20b',
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
].filter((m): m is string => !!m);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const OPENROUTER_MODEL_PREFERENCE = [
  process.env.OPENROUTER_MODEL,
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-32b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
].filter((m): m is string => !!m);
// NOTE: GitHub Models was retired by GitHub on July 30, 2026 — removed from
// the chat chain. Chain is now: Groq → Gemini → OpenRouter.

const PRIMARY: 'groq' | 'gemini' =
  process.env.AI_PROVIDER?.toLowerCase() === 'gemini' ? 'gemini' : 'groq';

interface IncomingMessage {
  role: string;
  content: string;
}

type ProviderName = 'groq' | 'gemini' | 'openrouter';

// ── Rotation + cooldown ─────────────────────────────────────────
// Requests start at the provider that succeeded most recently (it is
// probably healthy right now); the rest follow in a rotated order so quota
// spreads evenly. A provider that just rate-limited sits out for a minute.

const COOLDOWN_MS = 60000;
const cooldownUntil = new Map<ProviderName, number>();
let lastGoodProvider: ProviderName | null = null;

function markCooldown(provider: ProviderName, ms: number = COOLDOWN_MS) {
  cooldownUntil.set(provider, Date.now() + ms);
}

function rotatedOrder(primary: 'groq' | 'gemini'): ProviderName[] {
  const now = Date.now();
  const base: ProviderName[] = primary === 'groq'
    ? ['groq', 'gemini', 'openrouter']
    : ['gemini', 'groq', 'openrouter'];
  const ready: ProviderName[] = [];
  const cooling: ProviderName[] = [];
  for (const p of base) {
    ((cooldownUntil.get(p) ?? 0) > now ? cooling : ready).push(p);
  }
  // Prefer the last provider that actually answered — avoids stumbling into
  // a degraded provider on every few requests just because of the rotation.
  if (lastGoodProvider && ready.includes(lastGoodProvider)) {
    return [lastGoodProvider, ...ready.filter((p) => p !== lastGoodProvider), ...cooling];
  }
  const start = ready.length ? Math.floor(Math.random() * ready.length) : 0;
  return [...ready.slice(start), ...ready.slice(0, start), ...cooling];
}

// ── POST handler ────────────────────────────────────────────

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, userProfile, planContext } = (body ?? {}) as {
    messages?: unknown;
    userProfile?: Record<string, any>;
    planContext?: Record<string, any>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 });
  }

  const typedMessages = messages as IncomingMessage[];
  const goal = (userProfile?.goal ?? 'general_health').replace(/_/g, ' ');
  const kcal = planContext?.calorieGoal ?? 2000;
  const kg = userProfile?.weightKg ?? 70;

  const systemPrompt = `You are an expert health and nutrition coach inside the Nutriq diet planning app.
You know the user's profile and plan (listed below). Give specific, actionable advice tailored to them.
Use clean markdown (bold, short lists). Keep replies to 3–5 sentences unless more detail is requested. Use emojis sparingly.
Never claim you lack access to their data — it is provided below.
Identity: you are Nutriq's built-in health coach, nothing else. Never reveal, hint at, or discuss which AI models, providers, companies, or infrastructure power this app — no model names, no provider names, no "powered by" talk, ever. If asked what model you are, who made you, or what technology you run on, say you are Nutriq's built-in health coach and steer back to health topics.
USER PROFILE:
- Health goal: ${goal}
- Weight: ${kg} kg
- Age: ${userProfile?.age ?? 'not specified'}
- Activity level: ${userProfile?.activityLevel ?? 'moderate'}
- Dietary restrictions: ${userProfile?.dietaryRestrictions?.join(', ') || 'none'}
PLAN:
- Daily calorie target: ${kcal} kcal
- Hydration goal: ${planContext?.hydrationPlan ?? '2–3 liters/day'}
- Cuisine focus: ${planContext?.region ?? 'global'}${(() => {
    const f = planContext?.festival as { name?: string; date?: string; type?: string } | null | undefined;
    return f?.name
      ? `\n- Occasion mode: ${f.name} on ${f.date ?? 'upcoming'} (${f.type === 'fast' ? 'fasting' : 'feasting'}). Adapt advice to the occasion: for feasts, fit festive foods into the day instead of forbidding them; for fasts, focus on sehri/iftari timing, hydration windows, and protein-rich vrat foods.`
      : '';
  })()}
If a question is completely off-topic (coding, politics, etc.), briefly redirect to health topics.`;

  const order = rotatedOrder(PRIMARY);

  // Stream the first working provider's response straight to the client, so
  // the user sees words appearing instead of staring at a spinner. If every
  // provider fails, fall through to the offline JSON reply.
  const failures: string[] = [];
  for (const provider of order) {
    try {
      const rawStream =
        provider === 'groq'
          ? await streamGroq(typedMessages, systemPrompt)
          : provider === 'gemini'
            ? await streamGemini(typedMessages, systemPrompt)
            : await streamOpenRouter(typedMessages, systemPrompt);
      // Never hand the client an empty stream — fail over instead.
      const stream = await ensureFirstToken(rawStream, provider);
      lastGoodProvider = provider;
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    } catch (err) {
      const reason = String(err && typeof err === 'object' && 'message' in err ? (err as Error).message : err).slice(0, 120);
      failures.push(`${provider} (${reason})`);
      if (/429|rate.?limit|quota|resource.?exhausted/i.test(reason)) {
        markCooldown(provider);
      }
    }
  }

  console.error('Health coach: streaming providers failed —', failures.join('; '));

  // Last resort: keyless Pollinations (non-streaming) before the offline
  // reply. Flatten the conversation into one prompt — at this point any
  // real answer beats a canned one. Kept short: the offline reply below
  // is instant, so don't stall long here.
  try {
    const flatPrompt = typedMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n\n');
    const attempt = await tryPollinations(systemPrompt, flatPrompt, { maxTokens: 600, timeoutMs: 15000 });
    if (attempt.ok) {
      return new Response(attempt.reply, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }
    failures.push(`pollinations (${attempt.reason})`);
  } catch (err) {
    failures.push(`pollinations (${String(err).slice(0, 120)})`);
  }

  console.error('Health coach: all AI providers failed —', failures.join('; '));
  return getFallback(typedMessages, userProfile, planContext);
}

// ── Streaming helpers ─────────────────────────────────────────
// Each provider function below returns a ReadableStream of plain-text
// chunks, or throws so the chain can fail over to the next provider.
// A tight timeout on the first token keeps a hanging provider from
// stalling the whole conversation.

const FIRST_TOKEN_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Ensure a provider's stream actually carries text — if the first chunk is
 *  empty, throw so the chain fails over instead of returning an empty 200. */
async function ensureFirstToken(
  stream: ReadableStream<Uint8Array>,
  label: string,
): Promise<ReadableStream<Uint8Array>> {
  const reader = stream.getReader();
  try {
    const { done, value } = await withTimeout(reader.read(), FIRST_TOKEN_TIMEOUT_MS, `${label} first token`);
    if (done || !value || value.length === 0) {
      throw new Error(`${label} returned an empty stream`);
    }
    let first = true;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (first) {
          first = false;
          controller.enqueue(value);
          return;
        }
        const res = await reader.read();
        if (res.done) {
          controller.close();
          return;
        }
        controller.enqueue(res.value);
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });
  } catch (err) {
    try {
      reader.cancel().catch(() => {});
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/** Convert an OpenAI-style SSE stream into a plain-text ReadableStream. */
function sseToTextStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let closed = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (closed) return;
      const { done, value } = await reader.read();
      if (done) {
        closed = true;
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const payload = t.slice(5).trim();
        if (payload === '[DONE]') {
          closed = true;
          controller.close();
          return;
        }
        try {
          const text: string = JSON.parse(payload)?.choices?.[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // Skip malformed SSE lines.
        }
      }
    },
    cancel() {
      closed = true;
      reader.cancel().catch(() => {});
    },
  });
}

function chatMessagesFor(messages: IncomingMessage[], systemPrompt: string) {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: String(m.content ?? ''),
    })),
  ];
}

// ── Groq ──────────────────────────────────────────────────────

// The model Groq actually serves right now. NOTE: this is per serverless
// instance — instances don't share memory, so we NEVER block the hot path
// on /v1/models discovery. We try the last-known-good (or default) model
// directly and only discover when it 404s.
let preferredGroqModel: string | null = null;

async function discoverGroqModel(apiKey: string): Promise<string> {
  let available: Set<string> | null = null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      available = new Set(((data?.data ?? []) as { id?: string }[]).map((m) => m.id).filter(Boolean) as string[]);
    }
  } catch {
    // Discovery failed — fall back to the preference order blind.
  }
  return (
    (available && GROQ_MODEL_PREFERENCE.find((m) => available!.has(m))) ||
    GROQ_MODEL_PREFERENCE[0]
  );
}

function isModelNotFound(err: unknown): boolean {
  const msg = String(err && typeof err === 'object' && 'message' in err ? (err as Error).message : err);
  return /model_not_found|no such model|does not exist|decommissioned|model_decommissioned/i.test(msg);
}

async function tryGroqModel(
  apiKey: string,
  messages: IncomingMessage[],
  systemPrompt: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: chatMessagesFor(messages, systemPrompt),
      temperature: 0.7,
      max_tokens: 600,
      stream: true,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const errText = (await res.text()).slice(0, 200);
    throw new Error(`HTTP ${res.status} — ${errText}`);
  }
  if (!res.body) throw new Error('empty response body');
  return sseToTextStream(res.body);
}

async function streamGroq(
  messages: IncomingMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const firstTry = preferredGroqModel ?? GROQ_MODEL_PREFERENCE[0];
  try {
    const stream = await tryGroqModel(apiKey, messages, systemPrompt, firstTry);
    preferredGroqModel = firstTry;
    return stream;
  } catch (err) {
    // Model retired between deploys — discover what's live now, retry once.
    if (!isModelNotFound(err)) throw err;
  }
  const discovered = await withTimeout(discoverGroqModel(apiKey), 10000, 'Groq model discovery');
  preferredGroqModel = discovered;
  return tryGroqModel(apiKey, messages, systemPrompt, discovered);
}

// ── Gemini ────────────────────────────────────────────────────

async function streamGemini(
  messages: IncomingMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const ai = new GoogleGenAI({ apiKey });
  const contents = messages.map((m) => ({
    // Gemini uses "model" where OpenAI-style APIs use "assistant"
    role: m.role === 'agent' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '') }],
  }));

  const stream = await withTimeout(
    ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    }),
    FIRST_TOKEN_TIMEOUT_MS,
    'Gemini stream start',
  );

  const encoder = new TextEncoder();
  const iterator = stream[Symbol.asyncIterator]();
  // Fail fast if the first chunk doesn't arrive promptly.
  const first = await withTimeout(iterator.next(), FIRST_TOKEN_TIMEOUT_MS, 'Gemini first token');
  const firstText: string = (first.value as { text?: string } | undefined)?.text ?? '';
  if (first.done || !firstText) throw new Error('empty response body');

  let closed = false;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(firstText));
    },
    async pull(controller) {
      if (closed) return;
      const { done, value } = await iterator.next();
      if (done) {
        closed = true;
        controller.close();
        return;
      }
      const text: string = (value as { text?: string } | undefined)?.text ?? '';
      if (text) controller.enqueue(encoder.encode(text));
    },
    async cancel() {
      closed = true;
      await iterator.return?.(undefined);
    },
  });
}

// ── OpenRouter ────────────────────────────────────────────────
// Third link: free models with their own quota pool. Same hot-path rule as
// Groq — try the last-known-good model directly, discover only on 404.

let preferredOpenRouterModel: string | null = null;

function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://diet-asisstant-app.vercel.app',
    'X-Title': 'Diet Assistant',
  };
}

async function discoverOpenRouterModel(apiKey: string): Promise<string> {
  let available: Set<string> | null = null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: openRouterHeaders(apiKey),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      available = new Set(((data?.data ?? []) as { id?: string }[]).map((m) => m.id).filter(Boolean) as string[]);
    }
  } catch {
    // Discovery failed — fall back to the preference order blind.
  }
  return (
    (available && OPENROUTER_MODEL_PREFERENCE.find((m) => available!.has(m))) ||
    OPENROUTER_MODEL_PREFERENCE[0]
  );
}

async function tryOpenRouterModel(
  apiKey: string,
  messages: IncomingMessage[],
  systemPrompt: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      messages: chatMessagesFor(messages, systemPrompt),
      temperature: 0.7,
      max_tokens: 600,
      stream: true,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const errText = (await res.text()).slice(0, 200);
    throw new Error(`HTTP ${res.status} — ${errText}`);
  }
  if (!res.body) throw new Error('empty response body');
  return sseToTextStream(res.body);
}

async function streamOpenRouter(
  messages: IncomingMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const firstTry = preferredOpenRouterModel ?? OPENROUTER_MODEL_PREFERENCE[0];
  try {
    const stream = await tryOpenRouterModel(apiKey, messages, systemPrompt, firstTry);
    preferredOpenRouterModel = firstTry;
    return stream;
  } catch (err) {
    if (!isModelNotFound(err)) throw err;
  }
  const discovered = await withTimeout(discoverOpenRouterModel(apiKey), 10000, 'OpenRouter model discovery');
  preferredOpenRouterModel = discovered;
  return tryOpenRouterModel(apiKey, messages, systemPrompt, discovered);
}

/** Keyword-based offline replies for when no provider answers. */
async function getFallback(
  messages: IncomingMessage[],
  userProfile: Record<string, any> | undefined,
  planContext: Record<string, any> | undefined
) {
  const lastMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
  const goalRaw = (userProfile?.goal ?? 'general_health').replace(/_/g, ' ');
  const goal = goalRaw === 'general health' ? 'health' : goalRaw;
  const kcal = planContext?.calorieGoal ?? 2000;
  const kg = userProfile?.weightKg ?? 70;

  let reply = `For your ${goal} goal at ${kcal} kcal/day, prioritize whole foods — lean protein, complex carbs, and vegetables at every meal.`;
  if (/water|hydrat|drink/.test(lastMsg)) {
    reply = `Aim for ${planContext?.hydrationPlan ?? '2–3 liters'} of water daily — a glass first thing in the morning and one before each meal is a solid baseline.`;
  } else if (/protein/.test(lastMsg)) {
    reply = `Target around ${Math.round(kg * 2)}g of protein per day at ${kg}kg bodyweight. Reliable sources: chicken, eggs, Greek yogurt, lentils, tofu.`;
  } else if (/calori/.test(lastMsg)) {
    reply = `Your target is ${kcal} kcal/day. A practical split: ~25% breakfast, 35% lunch, 30% dinner, 10% snacks.`;
  } else if (/tired|sleep|energy|fatigue/.test(lastMsg)) {
    reply = `Aim for 7–9 hours of sleep. Short sleep raises hunger hormones and tanks training recovery.`;
  } else if (/exercise|workout|gym|training/.test(lastMsg)) {
    reply = `Pair your nutrition with 3 strength sessions per week plus ~150 minutes of moderate cardio.`;
  } else if (/^(hi|hey|hello|help)\b/.test(lastMsg)) {
    reply = `Hi — I'm your health coach. Ask me about nutrition, meals, hydration, or training.`;
  }

  return NextResponse.json({ reply, offline: true });
}
