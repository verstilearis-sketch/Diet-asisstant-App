import { NextResponse } from 'next/server';

interface IncomingMessage {
  role: string;
  content: string;
}

// Current Qwen reasoning model on Groq. The old id 'qwen/qwen3.8-27b'
// does not exist — it made every request fail and silently fall back
// to canned replies. Alternatives: 'openai/gpt-oss-120b' (production),
// 'openai/gpt-oss-20b' (faster/cheaper).
const MODEL = 'qwen/qwen3.6-27b';

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

  const apiKey = process.env.GROQ_API_KEY;
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

  if (!apiKey) {
    console.warn('GROQ_API_KEY not set — using offline fallback replies');
    return getFallback(messages as IncomingMessage[], userProfile, planContext);
  }

  try {
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages as IncomingMessage[]).map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: String(m.content ?? ''),
      })),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 600,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', res.status, errText);
      // Surface model/config errors instead of silently degrading:
      return NextResponse.json(
        { error: `AI service error (${res.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content || "I couldn't generate a response — please try again.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Groq fetch error:', err);
    return NextResponse.json(
      { error: 'Could not reach the AI service. Please try again.' },
      { status: 502 }
    );
  }
}

/** Keyword-based offline replies for when no API key is configured. */
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
