import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, userProfile, planContext } = body;

  // Validate required fields
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
  }

  if (!userProfile) {
    return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  const goal = userProfile?.goal?.replace(/_/g, ' ') || 'general health';
  const kcal = planContext?.calorieGoal || 2000;
  const kg = userProfile?.weightKg || 70;

  const systemPrompt = `You are an expert AI Health and Nutrition Agent built into a Diet Planning Assistant app.
You have full knowledge of the user's profile and diet plan. Give dynamic, personalized, and genuinely helpful answers.
Use markdown formatting with relevant emojis. Keep responses concise (3–5 sentences) unless more detail is asked for.
Never say you don't have access to their data — you do, it is listed below.

USER PROFILE:
- Health Goal: ${goal}
- Weight: ${kg} kg
- Age: ${userProfile?.age || 'not specified'}
- Activity Level: ${userProfile?.activityLevel || 'moderate'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions?.join(', ') || 'None'}

DIET PLAN:
- Daily Calorie Target: ${kcal} kcal
- Hydration Goal: ${planContext?.hydrationPlan || '2–3 liters/day'}
- Cuisine/Region Focus: ${planContext?.region || 'Global'}

Always give specific, actionable advice based on this profile. If a question is completely off-topic (coding, politics, etc.), gently redirect to health topics.`;

  if (!apiKey) {
    console.warn('No GROQ_API_KEY found — using smart fallback');
    return getFallback(messages, userProfile, planContext);
  }

  try {
    // Build OpenAI-compatible message array for Groq
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', res.status, errText);
      return getFallback(messages, userProfile, planContext);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't generate a response, please try again!";
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error('Groq fetch error:', err?.message || err);
    return getFallback(messages, userProfile, planContext);
  }
}

async function getFallback(messages: any[], userProfile: any, planContext: any) {
  const lastMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
  const goal = userProfile?.goal?.replace(/_/g, ' ') || 'health goal';
  const kcal = planContext?.calorieGoal || 2000;
  const kg = userProfile?.weightKg || 70;

  let reply = `🌟 For your **${goal}** goal with a **${kcal} kcal** daily target, focus on whole foods — lean proteins, complex carbs, and plenty of vegetables. Add your **GROQ_API_KEY** to unlock real AI responses!`;

  if (lastMsg.match(/water|hydrat|drink/)) {
    reply = `💧 **Hydration:** Target ${planContext?.hydrationPlan || '2–3 liters'}/day. Drink a glass first thing in the morning and before each meal — it boosts metabolism and curbs overeating!`;
  } else if (lastMsg.match(/protein/)) {
    reply = `🍗 **Protein:** Aim for **${Math.round(kg * 2)}g/day** (based on ${kg}kg). Best sources: chicken, eggs, Greek yogurt, lentils, tofu. Spread across meals for best absorption!`;
  } else if (lastMsg.match(/calori/)) {
    reply = `🔥 **Calories:** Your target is **${kcal} kcal/day**. Split it ~25% breakfast, 35% lunch, 30% dinner, 10% snacks. Track every meal — most people underestimate portions by 20–30%!`;
  } else if (lastMsg.match(/tired|sleep|energy|fatigue/)) {
    reply = `😴 **Energy & Sleep:** Aim for 7–9 hours nightly. Poor sleep raises cortisol and hunger hormones. Also ensure you're not eating below your **${kcal} kcal** target — under-eating kills energy!`;
  } else if (lastMsg.match(/exercise|workout|gym/)) {
    reply = `🏋️ **Training:** Combine your **${goal}** diet with 3x strength sessions + 150 min cardio/week. Rest days count too — a 20-min walk improves recovery and burns ~100 kcal!`;
  } else if (lastMsg.match(/hello|hi |hey|help/)) {
    reply = `👋 **Hi! I'm your Health Agent.** I know your profile: **${goal}** goal, **${kcal} kcal/day**, ${kg}kg. Ask me anything about nutrition, meals, workouts, hydration, or supplements!`;
  }

  await new Promise((r) => setTimeout(r, 500));
  return NextResponse.json({ reply });
}
