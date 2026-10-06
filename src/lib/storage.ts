// ── Storage Layer (Supabase) ──────────────────────────────────────────────────
// Auth via Supabase Auth (proper password hashing, sessions handled by the
// Supabase client). Profiles, plans and daily logs live in Postgres.
// Row Level Security guarantees users only ever touch their own rows.
//
// NOTE: accounts created with the old localStorage version do not transfer —
// everyone signs up fresh once. The legacy browser keys are cleared by
// resetAllData() below.
import { getSupabase } from './supabase';
import type { UserProfile } from './calculations';
import type { DietPlan } from './ai-engine';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface StoredSession {
  userId: string;
  email: string;
  name: string;
}

export interface SavedPlan {
  id: string;
  userId: string;
  profile: UserProfile;
  plan: DietPlan;
  createdAt: string;
}

export interface ExtraMeal {
  id: string;
  name: string;
  text: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** How the meal was logged — photo estimates are more approximate. */
  source?: 'text' | 'photo' | 'menu';
  /** True when estimated locally because AI providers were unreachable. */
  offline?: boolean;
  /** True when nutrition came from a real food-composition database. */
  verified?: boolean;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  description: string;
  caloriesBurned: number;
  durationMin?: number;
  /** True when estimated locally because AI providers were unreachable. */
  offline?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  weight?: number;
  waterLiters: number;
  mealsCompleted: boolean[]; // Array of 5 booleans for the 5 meals
  exerciseDone: boolean;
  mood?: 'great' | 'good' | 'okay' | 'bad';
  /** Free-text meals the user logged on top of the plan (AI-estimated nutrition). */
  extraMeals: ExtraMeal[];
  /** Described workouts with AI-estimated calorie burn. */
  exercises: ExerciseEntry[];
  /** Snapshot of total intake when the day was saved (used by adaptive targets). */
  intakeKcal?: number;
  /** Snapshot of total exercise burn when the day was saved. */
  burnedKcal?: number;
}

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: AuthUser;
  /** True when the account was created but email confirmation is still pending. */
  pendingConfirmation?: boolean;
};

const defaultLog = (date: string): DailyLog => ({
  date,
  waterLiters: 0,
  mealsCompleted: [false, false, false, false, false],
  exerciseDone: false,
  extraMeals: [],
  exercises: [],
});

function configError(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

/** Turn Supabase auth errors into plain-language messages. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already exists')) {
    return 'Email already registered. Try signing in instead.';
  }
  if (m.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link.';
  }
  return message;
}

async function fetchProfileName(userId: string): Promise<string> {
  try {
    const { data } = await getSupabase()
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle();
    const name = (data as { name?: string } | null)?.name;
    return name || '';
  } catch {
    return '';
  }
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    const user = data.user;
    if (!user) return { success: false, error: 'Sign up failed. Please try again.' };
    if (!data.session) {
      // The project requires email confirmation: the account exists, but the
      // user must click the email link before they can sign in.
      return {
        success: true,
        pendingConfirmation: true,
        user: { id: user.id, email: user.email ?? email, name },
      };
    }
    const displayName = name || (await fetchProfileName(user.id));
    return { success: true, user: { id: user.id, email: user.email ?? email, name: displayName } };
  } catch (err) {
    return { success: false, error: configError(err) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    const user = data.user;
    const metaName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
    const displayName = metaName || (await fetchProfileName(user.id));
    return { success: true, user: { id: user.id, email: user.email ?? email, name: displayName } };
  } catch (err) {
    return { success: false, error: configError(err) };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getSupabase();
    // PKCE flow: the browser leaves for Google, then returns to /auth/callback
    // which exchanges the code for a session (see src/app/auth/callback/page.tsx).
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    // No error → the browser is navigating to Google; nothing more to do here.
    return { success: true };
  } catch (err) {
    return { success: false, error: configError(err) };
  }
}

export async function getSession(): Promise<StoredSession | null> {
  try {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    const user = session?.user;
    if (!user) return null;
    const meta = user.user_metadata || {};
    // Google OAuth provides full_name; email signup stores name.
    const metaName =
      typeof meta.name === 'string' && meta.name
        ? meta.name
        : typeof meta.full_name === 'string'
          ? meta.full_name
          : '';
    // The name is almost always in the auth metadata already — skip the
    // extra DB roundtrip and only fall back to the profiles table when it's
    // missing. This runs on every dashboard load, so one fewer roundtrip
    // matters on mobile networks.
    const name = metaName || (await fetchProfileName(user.id));
    return { userId: user.id, email: user.email ?? '', name };
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await getSupabase().auth.signOut();
  } catch {
    // Already signed out or misconfigured — nothing to do.
  }
}

/** Permanently deletes the signed-in user's profile, plans and daily logs
 *  from Supabase, signs them out, and clears any legacy browser keys. */
export async function resetAllData(): Promise<void> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    await sb.from('daily_logs').delete().eq('user_id', user.id);
    await sb.from('plans').delete().eq('user_id', user.id);
    await sb.from('profiles').delete().eq('id', user.id);
  }
  await sb.auth.signOut();
  if (typeof window !== 'undefined') {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('dpa_') || key.startsWith('chat'))) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  }
}

// ── Plans ────────────────────────────────────────────────────────────

export async function savePlan(userId: string, profile: UserProfile, plan: DietPlan): Promise<SavedPlan> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('plans')
    .insert({ user_id: userId, profile, plan })
    .select('id, created_at')
    .single();
  if (error || !data) {
    throw new Error('Could not save your plan: ' + (error?.message ?? 'unknown error'));
  }
  // Keep the history tidy — retain only the 10 most recent plans.
  // Runs in the background: the user never waits for this housekeeping.
  void (async () => {
    try {
      const { data: extras } = await sb
        .from('plans')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(10, 100);
      const extraIds = (extras as { id: string }[] | null)?.map((r) => r.id) ?? [];
      if (extraIds.length > 0) {
        await sb.from('plans').delete().in('id', extraIds);
      }
    } catch {
      /* tidiness is best-effort */
    }
  })();
  const row = data as { id: string; created_at: string };
  return { id: row.id, userId, profile, plan, createdAt: row.created_at };
}

export async function getLatestPlan(userId: string): Promise<SavedPlan | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('plans')
    .select('id, user_id, profile, plan, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string; user_id: string; profile: UserProfile; plan: DietPlan; created_at: string;
  };
  return {
    id: row.id,
    userId: row.user_id,
    profile: row.profile,
    plan: row.plan,
    createdAt: row.created_at,
  };
}

/** Update an existing plan in place (e.g. after a meal swap) — no new version. */
export async function updatePlan(planId: string, plan: DietPlan): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('plans')
    .update({ plan })
    .eq('id', planId);
  if (error) {
    throw new Error('Could not update your plan: ' + error.message);
  }
}

// ── Daily logs ───────────────────────────────────────────────────────

export async function getDailyLog(userId: string, date: string): Promise<DailyLog> {
  const sb = getSupabase();
  const { data } = await sb
    .from('daily_logs')
    .select('log')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  const stored = (data as { log?: Partial<DailyLog> } | null)?.log;
  if (stored) return { ...defaultLog(date), ...stored, date };
  return defaultLog(date);
}

export async function saveDailyLog(userId: string, log: DailyLog): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('daily_logs').upsert(
    {
      user_id: userId,
      date: log.date,
      log,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  );
  if (error) {
    throw new Error('Could not save daily log: ' + error.message);
  }
}

/** Dates (YYYY-MM-DD) that have a saved log — powers the tracking calendar. */
export async function getLoggedDates(userId: string, from: string, to: string): Promise<string[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from('daily_logs')
    .select('date')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to);
  return ((data as { date: string }[] | null) ?? []).map((r) => r.date);
}

/** A day's log, or null when the day was never tracked. */
export async function fetchDailyLog(userId: string, date: string): Promise<DailyLog | null> {
  const sb = getSupabase();
  const { data } = await sb
    .from('daily_logs')
    .select('log')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  const stored = (data as { log?: Partial<DailyLog> } | null)?.log;
  if (!stored) return null;
  return { ...defaultLog(date), ...stored, date };
}

/** Full logs for a date range (inclusive), oldest first — for trends and adaptation. */
export async function getDailyLogsRange(userId: string, from: string, to: string): Promise<DailyLog[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from('daily_logs')
    .select('log')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });
  return (((data as { log?: Partial<DailyLog> }[] | null) ?? [])
    .map((r) => (r.log ? { ...defaultLog(r.log.date || ''), ...r.log } : null))
    .filter((l): l is DailyLog => !!l && !!l.date));
}
