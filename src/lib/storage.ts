// ── Storage Layer (localStorage → Supabase-ready) ───────────────────────────
import type { UserProfile } from './calculations';
import type { DietPlan } from './ai-engine';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string; // Demo only
  name: string;
  createdAt: string;
}

export interface StoredSession {
  userId: string;
  email: string;
  name: string;
  expiresAt: string;
}

export interface SavedPlan {
  id: string;
  userId: string;
  profile: UserProfile;
  plan: DietPlan;
  createdAt: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  weight?: number;
  waterLiters: number;
  mealsCompleted: boolean[]; // Array of 5 booleans for the 5 meals
  exerciseDone: boolean;
  mood?: 'great' | 'good' | 'okay' | 'bad';
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/** UUID v4. crypto.randomUUID() only exists in secure contexts
 *  (https / localhost) — fall back to Math.random when the site is
 *  opened via a LAN IP like http://192.168.x.x, otherwise signup
 *  and plan-saving throw and the UI hangs with no error. */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── User management ──────────────────────────────────────────────────────────
export function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('dpa_users') || '[]'); } catch { return []; }
}

export function saveUser(user: StoredUser): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem('dpa_users', JSON.stringify(users));
}

export function signUp(email: string, password: string, name: string): { success: boolean; error?: string; user?: StoredUser } {
  const users = getUsers();
  if (users.find(u => u.email === email)) return { success: false, error: 'Email already registered' };
  const user: StoredUser = { id: generateId(), email, passwordHash: simpleHash(password), name, createdAt: new Date().toISOString() };
  saveUser(user);
  startSession(user);
  return { success: true, user };
}

export function signIn(email: string, password: string): { success: boolean; error?: string; user?: StoredUser } {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { success: false, error: 'No account found with this email' };
  if (user.passwordHash !== simpleHash(password)) return { success: false, error: 'Incorrect password' };
  startSession(user);
  return { success: true, user };
}

// ── Session management ────────────────────────────────────────────────────────
export function startSession(user: StoredUser): void {
  const session: StoredSession = { userId: user.id, email: user.email, name: user.name, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
  localStorage.setItem('dpa_session', JSON.stringify(session));
}

export function getSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dpa_session');
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) { localStorage.removeItem('dpa_session'); return null; }
    return session;
  } catch { return null; }
}

export function signOut(): void {
  localStorage.removeItem('dpa_session');
}

/** Permanently removes all DietAI data stored in this browser
 *  (accounts, sessions, plans, daily logs, chat debug data). */
export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('dpa_') || key.startsWith('chat'))) doomed.push(key);
  }
  doomed.forEach((key) => localStorage.removeItem(key));
}

// ── Plan storage ──────────────────────────────────────────────────────────────
export function savePlan(userId: string, profile: UserProfile, plan: DietPlan): SavedPlan {
  const saved: SavedPlan = { id: generateId(), userId, profile, plan, createdAt: new Date().toISOString() };
  const plans = getPlans(userId);
  plans.unshift(saved);
  localStorage.setItem(`dpa_plans_${userId}`, JSON.stringify(plans.slice(0, 10)));
  return saved;
}

export function getPlans(userId: string): SavedPlan[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`dpa_plans_${userId}`) || '[]'); } catch { return []; }
}

export function getLatestPlan(userId: string): SavedPlan | null {
  const plans = getPlans(userId);
  return plans[0] || null;
}

// ── Tracking Logs ─────────────────────────────────────────────────────────────
export function getDailyLogs(userId: string): Record<string, DailyLog> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(`dpa_logs_${userId}`) || '{}'); } catch { return {}; }
}

export function getDailyLog(userId: string, date: string): DailyLog {
  const logs = getDailyLogs(userId);
  return logs[date] || { date, waterLiters: 0, mealsCompleted: [false, false, false, false, false], exerciseDone: false };
}

export function saveDailyLog(userId: string, log: DailyLog): void {
  const logs = getDailyLogs(userId);
  logs[log.date] = log;
  localStorage.setItem(`dpa_logs_${userId}`, JSON.stringify(logs));
}
