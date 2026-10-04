import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Health-coach AI providers ─────────────────────────────────
// The coach tries each provider in order until one answers:
//   1. Primary   — Groq by default; set AI_PROVIDER=gemini to prefer Gemini.
//   2. Secondary — the other provider, tried automatically if primary fails.
//   3. Tertiary  — OpenRouter (free models, separate quota pool).
//   4. Offline   — keyword-based replies, so the coach never goes silent.
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
//   GEMINI_MODEL=...        (optional; default gemini-3.8-flash)
//   OPENROUTER_MODEL=...    (optional; default auto-selected free model)

const GROQ_MODEL_PREFERENCE = [
  process.env.GROQ_MODEL,
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
  'openai/gpt-oss-20b',
].filter((m): m is string => !!m);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const OPENROUTER_MODEL_PREFERENCE = [
  process.env.OPENROUTER_MODEL,
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
].filter((m): m is string => !!m);

const PRIMARY: 'groq' | 'gemini' =
  process.env.AI_PROVIDER?.toLowerCase() === 'gemini' ? 'gemini' : 'groq';

interface IncomingMessage {
  role: string;
  content: string;
}

type Attempt = { ok: true; reply: string } | { ok: false; reason: string };

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

  const systemPrompt = `You are an expert health and nutrition coach inside the DietAI diet planning app.
You know the user's profile and plan (listed below). Give specific, actionable advice tailored to them.
Use clean markdown (bold, short lists). Keep replies to 3–5 sentences unless more detail is requested. Use emojis sparingly.
Never claim you lack access to their data — it is provided below.
USER PROFILE:
- Health goal: ${goal}
- Weight: ${kg} kg
- Age: ${userProfile?.age ?? 'not specified'}
- Activity level: ${userProfile?.activityLevel ?? 'moderate'}
- Dietary restrictions: ${userProfile?.dietaryRestrictions?.join(', ') || 'none'}
PLAN:
- Daily calorie target: ${kcal} kcal
- Hydration goal: ${planContext?.hydrationPlan ?? '2–3 liters/day'}
- Cuisine focus: ${planContext?.region ?? 'global'}
If a question is completely off-topic (coding, politics, etc.), briefly redirect to health topics.`;

  const order: ('groq' | 'gemini' | 'openrouter')[] =
    PRIMARY === 'groq' ? ['groq', 'gemini', 'openrouter'] : ['gemini', 'groq', 'openrouter'];

  const failures: string[] = [];
  for (const provider of order) {
    const attempt =
      provider === 'groq'
        ? await tryGroq(typedMessages, systemPrompt)
        : provider === 'gemini'
          ? await tryGemini(typedMessages, systemPrompt)
          : await tryOpenRouter(typedMessages, systemPrompt);
    if (attempt.ok) {
      return NextResponse.json({ reply: attempt.reply });
    }
    failures.push(`${provider} (${attempt.reason})`);
  }

  console.error('Health coach: all AI providers failed —', failures.join('; '));
  return getFallback(typedMessages, userProfile, planContext);
}

// ── Groq ──────────────────────────────────────────────────────

// The model Groq actually serves right now, picked from the preference list.
// Discovered once via /v1/models and cached in memory; the cache is dropped
// if a completion 404s so the next request re-discovers.
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
      available = new Set(((data?.data ?? []) as { id?: string }[]).map((m) => m.id).filter(Boolean) as string[]);
    }
  } catch {
    // Discovery failed — fall back to the preference order blind.
  }
  const pick =
    (available && GROQ_MODEL_PREFERENCE.find((m) => available!.has(m))) ||
    GROQ_MODEL_PREFERENCE[0];
  cachedGroqModel = pick;
  return pick;
}

async function tryGroq(
  messages: IncomingMessage[],
  systemPrompt: string
): Promise<Attempt> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'GROQ_API_KEY not set' };
  }

  try {
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: String(m.content ?? ''),
      })),
    ];

    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickGroqModel(apiKey);
      if (attempted.has(model)) break;
      attempted.add(model);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 600,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
          return { ok: false, reason: 'empty response body' };
        }
        return { ok: true, reply };
      }

      const errText = (await res.text()).slice(0, 200);
      if (res.status === 404 && errText.includes('model_not_found')) {
        // Model vanished between discovery and use — rediscover and retry once.
        cachedGroqModel = null;
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status} — ${errText}` };
    }
    return { ok: false, reason: 'no working Groq model found' };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

// ── Gemini ────────────────────────────────────────────────────

async function tryGemini(
  messages: IncomingMessage[],
  systemPrompt: string
): Promise<Attempt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'GEMINI_API_KEY not set' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = messages.map((m) => ({
      // Gemini uses "model" where OpenAI-style APIs use "assistant"
      role: m.role === 'agent' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? '') }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return { ok: false, reason: 'empty response body' };
    }
    return { ok: true, reply };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

// ── OpenRouter ────────────────────────────────────────────────
// Third link: free models with their own quota pool. Same discovery pattern
// as Groq — the free-model lineup changes, so we pick what actually exists.

let cachedOpenRouterModel: string | null = null;

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

async function pickOpenRouterModel(apiKey: string): Promise<string> {
  if (cachedOpenRouterModel) return cachedOpenRouterModel;
  let available: Set<string> | null = null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: openRouterHeaders(apiKey),
    });
    if (res.ok) {
      const data = await res.json();
      available = new Set(((data?.data ?? []) as { id?: string }[]).map((m) => m.id).filter(Boolean) as string[]);
    }
  } catch {
    // Discovery failed — fall back to the preference order blind.
  }
  const pick =
    (available && OPENROUTER_MODEL_PREFERENCE.find((m) => available!.has(m))) ||
    OPENROUTER_MODEL_PREFERENCE[0];
  cachedOpenRouterModel = pick;
  return pick;
}

async function tryOpenRouter(
  messages: IncomingMessage[],
  systemPrompt: string
): Promise<Attempt> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'OPENROUTER_API_KEY not set' };
  }

  try {
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: String(m.content ?? ''),
      })),
    ];

    const attempted = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
      const model = await pickOpenRouterModel(apiKey);
      if (!model || attempted.has(model)) break;
      attempted.add(model);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: openRouterHeaders(apiKey),
        body: JSON.stringify({
          model,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 600,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
          return { ok: false, reason: 'empty response body' };
        }
        return { ok: true, reply };
      }

      const errText = (await res.text()).slice(0, 200);
      if (res.status === 404 && /model_not_found|no such model/i.test(errText)) {
        cachedOpenRouterModel = null;
        continue;
      }
      // 429s: OpenRouter sends Retry-After; wait once, then let the chain move on.
      if (res.status === 429) {
        const waitMs = Math.min(10000, (Number(res.headers.get('retry-after')) || 3) * 1000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status} — ${errText}` };
    }
    return { ok: false, reason: 'no working OpenRouter model found' };
  } catch (err) {
    return { ok: false, reason: `request failed — ${String(err).slice(0, 120)}` };
  }
}

/** Keyword-based offline replies for when no provider answers. */
async function getFallback(
  messages: IncomingMessage[],
  userProfile: Record<string, any> | undefined,
  planContext: Record<string, any> | undefined
) {
  const lastMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
  const goal = (userProfile?.goal ?? 'health_goal').replace(/_/g, ' ');
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

  await new Promise((r) => setTimeout(r, 400));
  return NextResponse.json({ reply, offline: true });
}
