'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getLatestPlan, signOut, getDailyLog, saveDailyLog, getDailyLogsRange, DailyLog, resetAllData, updatePlan } from '@/lib/storage';
import { computeAll, calculateMacros } from '@/lib/calculations';
import type { UserProfile } from '@/lib/calculations';
import type { SavedPlan, ExtraMeal, ExerciseEntry } from '@/lib/storage';
import type { Meal } from '@/lib/ai-engine';
import { getMealAlternatives, generateDietPlan, type MealType } from '@/lib/ai-engine';
import { checkAdaptation, type AdaptationCheck } from '@/lib/adaptive';
import { buildWeeklyReview } from '@/lib/weekly-review';
import { FESTIVALS, getFestival, type FestivalFood } from '@/lib/festivals';
import type { TasteProfile } from '@/lib/taste';
import { buildTasteConstraints, hasTasteSignal, recordSwap } from '@/lib/taste';
import RecipeModal from '@/components/RecipeModal';
import MiniCalendar from '@/components/MiniCalendar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthAgentChat } from '@/components/HealthAgentChat';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';
import {
  NutriqIcon, DashboardIcon, UtensilsIcon, ClipboardIcon, CartIcon,
  BulbIcon, DumbbellIcon, CoffeeIcon, AppleIcon,
  SunIcon, MoonIcon, CookieIcon, ChevronDownIcon, CheckIcon,
  LogoutIcon, RefreshIcon, LaughIcon, SmileIcon, MehIcon, FrownIcon,
  FlameIcon, TrashIcon, PlusIcon, CameraIcon, SparklesIcon,
} from '@/components/icons';

// ── Estimate caches: avoid repeat AI calls for the same text ──────
const ESTIMATE_CACHE_LIMIT = 50;
function readEstimateCache(key: string): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}
function writeEstimateCache(key: string, text: string, value: unknown) {
  try {
    const cache = readEstimateCache(key);
    cache[text.trim().toLowerCase()] = value;
    const keys = Object.keys(cache);
    for (const k of keys.slice(0, Math.max(0, keys.length - ESTIMATE_CACHE_LIMIT))) delete cache[k];
    localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    // best-effort only
  }
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Weight Loss', gain_weight: 'Muscle Gain', maintain: 'Maintenance',
  improve_health: 'Health', athletic: 'Athletic Performance',
};
const MACRO_COLORS = { protein: '#177245', carbs: '#d97706', fat: '#2563eb' };

const MEAL_META = [
  { key: 'breakfast', label: 'Breakfast', time: '7:00 – 9:00 AM', icon: CoffeeIcon },
  { key: 'morningSnack', label: 'Morning snack', time: '10:30 – 11:00 AM', icon: AppleIcon },
  { key: 'lunch', label: 'Lunch', time: '12:30 – 2:00 PM', icon: SunIcon },
  { key: 'afternoonSnack', label: 'Afternoon snack', time: '4:00 – 5:00 PM', icon: CookieIcon },
  { key: 'dinner', label: 'Dinner', time: '7:00 – 8:30 PM', icon: MoonIcon },
] as const;

const TABS = [
  { id: 'home', label: 'Home', icon: DashboardIcon },
  { id: 'meals', label: 'Meal plan', icon: UtensilsIcon },
  { id: 'tracker', label: 'Daily tracker', icon: ClipboardIcon },
  { id: 'inventory', label: 'Inventory', icon: CartIcon },
] as const;

const MOODS = [
  { v: 'great', label: 'Great', icon: LaughIcon },
  { v: 'good', label: 'Good', icon: SmileIcon },
  { v: 'okay', label: 'Okay', icon: MehIcon },
  { v: 'bad', label: 'Rough', icon: FrownIcon },
] as const;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [activeDay, setActiveDay] = useState((new Date().getDay() + 6) % 7);
  const [activeTab, setActiveTab] = useState<'home' | 'meals' | 'tracker' | 'inventory'>('home');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [draftLog, setDraftLog] = useState<DailyLog | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [extraText, setExtraText] = useState('');
  const [extraBusy, setExtraBusy] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [exerciseText, setExerciseText] = useState('');
  const [exerciseBusy, setExerciseBusy] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [menuPicks, setMenuPicks] = useState<{ name: string; calories: number; proteinG: number; why: string }[]>([]);
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const menuInputRef = useRef<HTMLInputElement | null>(null);
  const [festivalOpen, setFestivalOpen] = useState(false);
  const [festivalChoice, setFestivalChoice] = useState('diwali');
  const [festivalDate, setFestivalDate] = useState(getFestival('diwali')?.defaultDate ?? '2026-11-08');
  const [learnBusy, setLearnBusy] = useState(false);
  const [learnings, setLearnings] = useState<string[] | null>(null);
  const [adaptation, setAdaptation] = useState<AdaptationCheck | null>(null);
  const adaptCheckedFor = useRef<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoVerdict, setPhotoVerdict] = useState<{
    meal: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number };
    verdict: 'yes' | 'okay' | 'skip';
    verdictWhy: string;
  } | null>(null);

  const newEntryId = (prefix: string) =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [savedAt, setSavedAt] = useState('');
  const [todayStr] = useState(getTodayString());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [recipeMeal, setRecipeMeal] = useState<Meal | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getSession();
      if (!session) { router.replace('/auth'); return; }
      if (cancelled) return;
      setUserName(session.name);
      const plan = await getLatestPlan(session.userId);
      if (!plan) { router.replace('/onboarding'); return; }
      if (cancelled) return;
      setSavedPlan(plan);
      const log = await getDailyLog(session.userId, todayStr);
      if (cancelled) return;
      setDailyLog(log);
      setDraftLog(log);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, todayStr]);

  // Tracker edits go to a draft; the explicit Save button persists them.
  const updateDraft = (updates: Partial<DailyLog>) => {
    setDraftLog((d) => (d ? { ...d, ...updates } : d));
    setSaveState('idle');
  };

  const toggleMealDraft = (index: number) => {
    setDraftLog((d) => {
      if (!d) return d;
      const meals = [...d.mealsCompleted];
      meals[index] = !meals[index];
      return { ...d, mealsCompleted: meals };
    });
    setSaveState('idle');
  };

  const hasUnsaved = !!draftLog && !!dailyLog && JSON.stringify(draftLog) !== JSON.stringify(dailyLog);

  const handleSaveProgress = async () => {
    if (!draftLog || !savedPlan || saveState === 'saving') return;
    setSaveState('saving');
    try {
      // Snapshot intake + burn so trends/adaptation don't depend on the plan staying unchanged.
      const dayPlan = savedPlan.plan.weeklyPlan[activeDay];
      const planMeals = dayPlan
        ? [dayPlan.breakfast, dayPlan.morningSnack, dayPlan.lunch, dayPlan.afternoonSnack, dayPlan.dinner]
        : [];
      const intakeKcal =
        planMeals.reduce((a, m, i) => a + (draftLog.mealsCompleted[i] && m ? m.calories : 0), 0) +
        (draftLog.extraMeals || []).reduce((a, m) => a + m.calories, 0);
      const burnedKcal = (draftLog.exercises || []).reduce((a, e) => a + e.caloriesBurned, 0);
      const toSave = { ...draftLog, intakeKcal, burnedKcal };
      await saveDailyLog(savedPlan.userId, toSave);
      setDailyLog(toSave);
      setDraftLog(toSave);
      setSaveState('saved');
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to save daily log:', e);
      setSaveState('error');
    }
  };

  // Free-text meal logging: estimate nutrition via AI, add to the draft day log.
  const addExtraMealEntry = (
    m: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number },
    provider: string,
    text: string,
  ) => {
    const entry: ExtraMeal = {
      id: newEntryId('em'),
      name: m.name,
      text,
      calories: m.calories,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
      source: 'text',
      ...(provider === 'offline' ? { offline: true } : {}),
    };
    setDraftLog((d) => (d ? { ...d, extraMeals: [...(d.extraMeals || []), entry] } : d));
    setSaveState('idle');
  };

  const handleEstimateMeal = async () => {
    const text = extraText.trim();
    if (!text || extraBusy || !savedPlan) return;
    // Serve repeat descriptions from the on-device cache — no API call.
    const cached = readEstimateCache('dpa_meal_estimate_cache')[text.toLowerCase()] as
      | { meal: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number }; provider: string }
      | undefined;
    if (cached?.meal) {
      addExtraMealEntry(cached.meal, cached.provider, text);
      setExtraText('');
      return;
    }
    setExtraBusy(true);
    setExtraError(null);
    try {
      const res = await fetch('/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          restrictions: savedPlan.profile.dietaryRestrictions,
          region: savedPlan.plan.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not estimate this meal');
      const m = data.meal as { name: string; calories: number; proteinG: number; carbsG: number; fatG: number };
      writeEstimateCache('dpa_meal_estimate_cache', text, { meal: m, provider: data.provider });
      addExtraMealEntry(m, data.provider, text);
      setExtraText('');
    } catch (e) {
      setExtraError(e instanceof Error ? e.message : 'Could not estimate this meal');
    } finally {
      setExtraBusy(false);
    }
  };

  const removeExtraMeal = (id: string) => {
    setDraftLog((d) => (d ? { ...d, extraMeals: (d.extraMeals || []).filter((m) => m.id !== id) } : d));
    setSaveState('idle');
  };

  // Photo meal logging: downscale client-side, estimate via vision, add to the draft log.
  const processPhotoFile = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1024;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mimeType: 'image/jpeg' });
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read that photo — try a JPG or PNG'));
      };
      img.src = url;
    });

  const handlePhotoMeal = async (file: File | undefined) => {
    if (!file || extraBusy || !savedPlan) return;
    setExtraBusy(true);
    setExtraError(null);
    setPhotoVerdict(null);
    try {
      const { base64, mimeType } = await processPhotoFile(file);
      const res = await fetch('/api/parse-meal-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          goal: savedPlan.profile.goal,
          remainingKcal: Math.max(0, dailyGoal - draftCalsConsumed),
          restrictions: savedPlan.profile.dietaryRestrictions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not read this photo');
      const m = data.meal as {
        name: string; calories: number; proteinG: number; carbsG: number; fatG: number;
        verdict: 'yes' | 'okay' | 'skip'; verdictWhy: string;
      };
      // Show the verdict first — the user decides whether to log it.
      setPhotoVerdict({ meal: m, verdict: m.verdict || 'okay', verdictWhy: m.verdictWhy || '' });
    } catch (e) {
      setExtraError(e instanceof Error ? e.message : 'Could not read this photo');
    } finally {
      setExtraBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const confirmPhotoMeal = () => {
    if (!photoVerdict) return;
    const m = photoVerdict.meal;
    const entry: ExtraMeal = {
      id: newEntryId('em'),
      name: m.name,
      text: 'Photo estimate',
      calories: m.calories,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
      source: 'photo',
    };
    setDraftLog((d) => (d ? { ...d, extraMeals: [...(d.extraMeals || []), entry] } : d));
    setPhotoVerdict(null);
    setSaveState('idle');
  };

  // Exercise logging: estimate burn via AI, add to the draft day log.
  const addExerciseEntry = (
    e: { name: string; caloriesBurned: number; durationMin?: number },
    provider: string,
    text: string,
  ) => {
    const entry: ExerciseEntry = {
      id: newEntryId('ex'),
      name: e.name,
      description: text,
      caloriesBurned: e.caloriesBurned,
      ...(typeof e.durationMin === 'number' ? { durationMin: e.durationMin } : {}),
      ...(provider === 'offline' ? { offline: true } : {}),
    };
    setDraftLog((d) =>
      d ? { ...d, exercises: [...(d.exercises || []), entry], exerciseDone: true } : d,
    );
    setSaveState('idle');
  };

  const handleEstimateExercise = async () => {
    const text = exerciseText.trim();
    if (!text || exerciseBusy || !savedPlan) return;
    const cached = readEstimateCache('dpa_exercise_estimate_cache')[text.toLowerCase()] as
      | { exercise: { name: string; caloriesBurned: number; durationMin?: number }; provider: string }
      | undefined;
    if (cached?.exercise) {
      addExerciseEntry(cached.exercise, cached.provider, text);
      setExerciseText('');
      return;
    }
    setExerciseBusy(true);
    setExerciseError(null);
    try {
      const res = await fetch('/api/parse-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, weightKg: savedPlan.profile.weightKg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not estimate this workout');
      const e = data.exercise as { name: string; caloriesBurned: number; durationMin?: number };
      writeEstimateCache('dpa_exercise_estimate_cache', text, { exercise: e, provider: data.provider });
      addExerciseEntry(e, data.provider, text);
      setExerciseText('');
    } catch (e) {
      setExerciseError(e instanceof Error ? e.message : 'Could not estimate this workout');
    } finally {
      setExerciseBusy(false);
    }
  };

  const removeExercise = (id: string) => {
    setDraftLog((d) => {
      if (!d) return d;
      const exercises = (d.exercises || []).filter((e) => e.id !== id);
      return { ...d, exercises, exerciseDone: d.exerciseDone || exercises.length > 0 };
    });
    setSaveState('idle');
  };

  // Menu rescue: photograph a restaurant menu, get the 3 smartest picks.
  const handleMenuPhoto = async (file: File | undefined) => {
    if (!file || menuBusy || !savedPlan) return;
    setMenuBusy(true);
    setMenuError(null);
    setMenuPicks([]);
    try {
      const { base64, mimeType } = await processPhotoFile(file);
      const res = await fetch('/api/menu-rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          goal: savedPlan.profile.goal,
          calorieGoal: dailyGoal,
          remainingKcal: Math.max(0, dailyGoal - draftCalsConsumed),
          restrictions: savedPlan.profile.dietaryRestrictions,
          region: savedPlan.plan.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not read this menu');
      setMenuPicks(data.picks as { name: string; calories: number; proteinG: number; why: string }[]);
    } catch (e) {
      setMenuError(e instanceof Error ? e.message : 'Could not read this menu');
    } finally {
      setMenuBusy(false);
      if (menuInputRef.current) menuInputRef.current.value = '';
    }
  };

  const logMenuPick = (pick: { name: string; calories: number; proteinG: number }) => {
    const entry: ExtraMeal = {
      id: newEntryId('em'),
      name: pick.name,
      text: 'Menu pick',
      calories: pick.calories,
      proteinG: pick.proteinG,
      carbsG: 0,
      fatG: 0,
      source: 'menu',
    };
    setDraftLog((d) => (d ? { ...d, extraMeals: [...(d.extraMeals || []), entry] } : d));
    setSaveState('idle');
  };

  // Festival mode: adapt the plan to feasts and fasts.
  const activateFestival = async () => {
    if (!savedPlan) return;
    const f = getFestival(festivalChoice);
    if (!f) return;
    const updated = {
      ...savedPlan.plan,
      festivalMode: { festivalId: f.id, name: f.name, date: festivalDate, type: f.type },
    };
    setSavedPlan({ ...savedPlan, plan: updated });
    setFestivalOpen(false);
    try {
      await updatePlan(savedPlan.id, updated);
    } catch (e) {
      console.error('Failed to save festival mode:', e);
    }
  };

  const clearFestival = async () => {
    if (!savedPlan) return;
    const updated = { ...savedPlan.plan, festivalMode: undefined };
    setSavedPlan({ ...savedPlan, plan: updated });
    try {
      await updatePlan(savedPlan.id, updated);
    } catch (e) {
      console.error('Failed to clear festival mode:', e);
    }
  };

  const logFestivalFood = (food: FestivalFood) => {
    const entry: ExtraMeal = {
      id: newEntryId('em'),
      name: `${food.name} (${food.portion})`,
      text: 'Festival food',
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: 0,
      fatG: 0,
      source: 'text',
    };
    setDraftLog((d) => (d ? { ...d, extraMeals: [...(d.extraMeals || []), entry] } : d));
    setSaveState('idle');
  };

  // Taste learning: rebuild next week around what the user actually eats.
  const handleSmartWeek = async () => {
    if (!savedPlan || learnBusy) return;
    setLearnBusy(true);
    try {
      const taste = buildTasteConstraints({
        plan: savedPlan.plan,
        profile: savedPlan.profile,
        logs: recentLogs,
        dailyGoal,
        proteinTargetG: calcs.proteinG,
        waterTargetL: calcs.waterLiters,
      });
      const fresh = await generateDietPlan(
        savedPlan.profile,
        { ...baseCalcs, dailyCalorieGoal: dailyGoal },
        taste,
      );
      const updated = {
        ...fresh,
        adaptiveTarget: savedPlan.plan.adaptiveTarget,
        festivalMode: savedPlan.plan.festivalMode,
        swapHistory: savedPlan.plan.swapHistory,
      };
      setSavedPlan({ ...savedPlan, plan: updated });
      await updatePlan(savedPlan.id, updated);
      setLearnings(taste.learnings.length ? taste.learnings : ['Not enough pattern yet — your current habits are already solid.']);
      setActiveTab('meals');
    } catch (e) {
      console.error('Smart week generation failed:', e);
    } finally {
      setLearnBusy(false);
    }
  };

  const handleSignOut = async () => { await signOut(); router.replace('/'); };

  // Swap a meal for an alternative (from the "can't make this" picker).
  const handleSwapMeal = async (
    slotKey: 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner',
    newMeal: Meal,
  ) => {
    if (!savedPlan) return;
    const oldMeal = savedPlan.plan.weeklyPlan[activeDay][slotKey];
    const dayPlan = { ...savedPlan.plan.weeklyPlan[activeDay], [slotKey]: newMeal };
    const meals = [dayPlan.breakfast, dayPlan.morningSnack, dayPlan.lunch, dayPlan.afternoonSnack, dayPlan.dinner];
    const updated = { ...dayPlan, totalCalories: meals.reduce((a, m) => a + m.calories, 0) };
    const weeklyPlan = [...savedPlan.plan.weeklyPlan];
    weeklyPlan[activeDay] = updated;
    // Taste learning: remember what was swapped out and what replaced it.
    const swapHistory = recordSwap(savedPlan.plan.swapHistory, oldMeal, newMeal, slotKey);
    const newPlan = { ...savedPlan.plan, weeklyPlan, swapHistory };
    setSavedPlan({ ...savedPlan, plan: newPlan });
    try {
      await updatePlan(savedPlan.id, newPlan);
    } catch (e) {
      console.error('Failed to persist meal swap:', e);
    }
  };

  const handleResetAll = async () => {
    await resetAllData();
    router.replace('/');
  };

  useEffect(() => {
    if (!showResetConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResetConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResetConfirm]);

  // Adaptive targets: once per plan, learn the real TDEE from logged intake + weight.
  useEffect(() => {
    if (!savedPlan || adaptCheckedFor.current === savedPlan.id) return;
    adaptCheckedFor.current = savedPlan.id;
    let cancelled = false;
    (async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 21);
        const fmtD = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const logs = await getDailyLogsRange(savedPlan.userId, fmtD(start), fmtD(end));
        const { profile, plan } = savedPlan;
        const base = computeAll(profile);
        const result = checkAdaptation({
          logs,
          plan,
          profile,
          currentTarget: plan.adaptiveTarget?.calories ?? base.dailyCalorieGoal,
          bmr: base.bmr,
        });
        if (cancelled) return;
        setAdaptation(result);
        setRecentLogs(logs);
        if (result.status === 'adapted' && result.newTarget && result.reason) {
          const updated = {
            ...plan,
            adaptiveTarget: {
              calories: result.newTarget,
              adjustedAt: new Date().toISOString(),
              reason: result.reason,
            },
          };
          setSavedPlan({ ...savedPlan, plan: updated });
          try {
            await updatePlan(savedPlan.id, updated);
          } catch (e) {
            console.error('Failed to persist adaptive target:', e);
          }
        }
      } catch (e) {
        console.error('Adaptive target check failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlan]);

  if (loading || !savedPlan || !dailyLog || !draftLog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Loading your plan…</p>
        </div>
      </div>
    );
  }

  const { profile, plan } = savedPlan;
  const firstName = (userName || profile.name || '').split(' ')[0];
  const baseCalcs = computeAll(profile);
  // Adaptive target overrides the formula goal once the engine has learned from logs.
  const dailyGoal = plan.adaptiveTarget?.calories ?? baseCalcs.dailyCalorieGoal;
  const calcs = plan.adaptiveTarget
    ? { ...baseCalcs, dailyCalorieGoal: dailyGoal, ...calculateMacros(dailyGoal, profile.goal, profile.weightKg) }
    : baseCalcs;
  const weeklyReview = buildWeeklyReview({
    logs: recentLogs,
    plan,
    profile,
    dailyGoal,
    proteinTargetG: calcs.proteinG,
    waterTargetL: calcs.waterLiters,
  });
  // Lightweight taste for the alternatives UI: never re-suggest rejected meals.
  const altTaste: TasteProfile = (() => {
    const counts = new Map<string, number>();
    for (const s of plan.swapHistory || []) counts.set(s.from, (counts.get(s.from) || 0) + 1);
    const dislikes = [...counts.entries()].filter(([, n]) => n >= 2).map(([name]) => name);
    return { dislikes, likes: [], proteinBoostSlots: [], learnings: [], updatedAt: '' };
  })();
  const selectedDayPlan = plan.weeklyPlan[activeDay];

  const mealsList = MEAL_META.map((m) => selectedDayPlan[m.key]);
  const extraCals = (log: DailyLog) => (log.extraMeals || []).reduce((a, m) => a + m.calories, 0);
  const calsConsumed = mealsList.reduce((acc, meal, i) => acc + (dailyLog.mealsCompleted[i] ? meal.calories : 0), 0) + extraCals(dailyLog);
  const draftCalsConsumed = mealsList.reduce((acc, meal, i) => acc + (draftLog.mealsCompleted[i] ? meal.calories : 0), 0) + extraCals(draftLog);
  const draftBurned = (draftLog.exercises || []).reduce((a, e) => a + e.caloriesBurned, 0);
  const draftNet = draftCalsConsumed - draftBurned;
  const exerciseDoneToday = dailyLog.exerciseDone || (dailyLog.exercises || []).length > 0;
  const burnedToday = (dailyLog.exercises || []).reduce((a, e) => a + e.caloriesBurned, 0);
  const draftCaloriePct = Math.min(100, Math.round((draftCalsConsumed / calcs.dailyCalorieGoal) * 100));
  const mealsDoneCount = dailyLog.mealsCompleted.filter(Boolean).length;

  const hour = new Date().getHours();
  const dayGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const activityLabel = (profile.activityLevel || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Weight journey (start → current → target)
  const currentW = dailyLog.weight || profile.weightKg;
  const targetW = profile.targetWeightKg;
  let journeyPct = 0;
  let journeyLabel = '';
  if (targetW && targetW !== profile.weightKg) {
    const total = Math.abs(profile.weightKg - targetW);
    const done = targetW < profile.weightKg ? profile.weightKg - currentW : currentW - profile.weightKg;
    journeyPct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    const toGo = Math.abs(currentW - targetW);
    journeyLabel = toGo < 0.5 ? 'Target reached — now maintain it' : `${toGo.toFixed(1)} kg to go`;
  }

  const macroData = [
    { name: 'Protein', value: calcs.proteinG, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: calcs.carbsG, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: calcs.fatG, color: MACRO_COLORS.fat },
  ];

  const bmiColor = calcs.bmi < 18.5 ? '#4f46e5' : calcs.bmi < 25 ? '#177245' : calcs.bmi < 30 ? '#d97706' : '#dc2626';
  const caloriePct = Math.min(100, Math.round((calsConsumed / calcs.dailyCalorieGoal) * 100));

  return (
    <div className="page-shell">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <span className="brand">
            <span className="brand-mark"><NutriqIcon size={29} /></span>
            Nutriq
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-muted)', marginRight: '0.5rem' }}>
              Hi, <strong style={{ color: 'var(--color-text)' }}>{userName.split(' ')[0]}</strong>
            </span>
            <button className="btn-ghost" onClick={() => router.push('/onboarding')} style={{ fontSize: '0.85rem' }}>
              <RefreshIcon size={15} /> New plan
            </button>
            <button className="btn-ghost" onClick={() => setShowResetConfirm(true)} style={{ fontSize: '0.85rem' }} title="Delete your profile, plans and logs from the cloud">
              <TrashIcon size={15} /> Reset data
            </button>
            <button className="btn-ghost" onClick={handleSignOut} style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>
              <LogoutIcon size={15} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
        {/* ── Header ────────────────────────────────────── */}
        <div className="fade-in-up" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', marginBottom: '0.3rem' }}>
              {firstName ? `${firstName}'s ${GOAL_LABELS[profile.goal] || 'nutrition'} plan` : `Your ${GOAL_LABELS[profile.goal] || 'nutrition'} plan`}
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: 640 }}>{plan.summary.split('\n')[0]}</p>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="fade-in-up delay-100" style={{
          display: 'inline-flex', gap: '0.25rem', marginBottom: '1.5rem',
          background: 'var(--color-surface)', padding: '0.3rem',
          borderRadius: '0.875rem', border: '1px solid var(--color-border)',
          maxWidth: '100%', overflowX: 'auto',
        }}>
          {TABS.map((t) => (
            <button key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── HOME ──────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.3rem, 2.6vw, 1.7rem)', marginBottom: '0.2rem' }}>
                {dayGreeting}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{todayLabel} · {GOAL_LABELS[profile.goal] || 'Your nutrition'} plan</p>
            </div>

            {plan.adaptiveTarget && (
              <div className="glass-card fade-in-up" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' }}>
                  <span className="badge badge-green">Target adapted</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-faint)' }}>
                    {new Date(plan.adaptiveTarget.adjustedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: 0 }}>
                  {plan.adaptiveTarget.reason}
                </p>
              </div>
            )}

            {!plan.adaptiveTarget && adaptation?.status === 'not-enough-data' && (adaptation.daysLogged ?? 0) >= 2 && (
              <div className="glass-card fade-in-up" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-muted)', marginTop: '0.1rem', flexShrink: 0 }}><BulbIcon size={18} /></span>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: 'var(--color-text)' }}>Adaptive targets unlock soon.</strong>{' '}
                  Keep logging your meals{(adaptation.weighIns ?? 0) < 2 ? ' and weigh yourself a couple of times' : ''} — with about a week of data, your calorie target starts learning from your real progress.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.4rem' }}>
                <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Your profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                  {[
                    { l: 'Age', v: profile.age ? `${profile.age} yrs` : '—' },
                    { l: 'Height', v: profile.heightCm ? `${profile.heightCm} cm` : '—' },
                    { l: 'Weight', v: `${currentW} kg` },
                    { l: 'BMI', v: `${calcs.bmi} · ${calcs.bmiCategory}` },
                    { l: 'Goal', v: GOAL_LABELS[profile.goal] || '—' },
                    { l: 'Activity', v: activityLabel || '—' },
                  ].map((f) => (
                    <div key={f.l}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 750 }}>{f.v}</div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>{f.l}</div>
                    </div>
                  ))}
                </div>
                {targetW && targetW !== profile.weightKg && (
                  <div style={{ marginTop: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 650 }}>Target: {targetW} kg</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{journeyLabel}</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 8 }}>
                      <div className="progress-bar-fill" style={{ width: `${journeyPct}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.4rem' }}>
                <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Today's progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Calories</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{calsConsumed} / {calcs.dailyCalorieGoal} kcal</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 7 }}>
                      <div className="progress-bar-fill" style={{ width: `${caloriePct}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Water</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{dailyLog.waterLiters}L / {calcs.waterLiters}L</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Exercise</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      {burnedToday > 0 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                          −{burnedToday} kcal
                        </span>
                      )}
                      <span className={`badge ${exerciseDoneToday ? 'badge-green' : 'badge-grey'}`}>{exerciseDoneToday ? 'Done' : 'Not yet'}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Meals logged</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{mealsDoneCount} / 5</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={() => setActiveTab('tracker')} style={{ width: '100%' }}>
                  Update today's progress
                </button>
              </div>
            </div>

            <div className="glass-card fade-in-up delay-100" style={{ padding: '1.4rem', marginBottom: '1rem' }}>
              <MiniCalendar userId={savedPlan.userId} />
            </div>

            {/* ── Weekly review ──────────────────────────────── */}
            <div className="glass-card fade-in-up delay-100" style={{ padding: '1.4rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '0.98rem' }}>Your week, decoded</h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-faint)' }}>Last 7 days</span>
              </div>
              {!weeklyReview.enoughData ? (
                <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: '0.5rem 0 0' }}>
                  {weeklyReview.tweak}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0.4rem 0 1rem' }}>{weeklyReview.headline}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.9rem', marginBottom: '1.1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{weeklyReview.adherencePct}%</div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>On plan</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{weeklyReview.avgIntake.toLocaleString('en-IN')}</div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>Avg kcal / day</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{weeklyReview.avgProteinG}g</div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>Avg protein</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                        {weeklyReview.weightChangeKg === null ? '—' : `${weeklyReview.weightChangeKg > 0 ? '+' : ''}${weeklyReview.weightChangeKg} kg`}
                      </div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>Weight change</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{weeklyReview.exerciseDays}</div>
                      <div className="metric-label" style={{ marginTop: '0.15rem' }}>Active days</div>
                    </div>
                    {weeklyReview.bestDay && (
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{weeklyReview.bestDay.label}</div>
                        <div className="metric-label" style={{ marginTop: '0.15rem' }}>Best day</div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'var(--color-accent-soft)', borderRadius: '0.8rem', padding: '0.9rem 1.1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-accent)', marginTop: '0.1rem', flexShrink: 0 }}><BulbIcon size={17} /></span>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>
                      <strong>One tweak for next week: </strong>{weeklyReview.tweak}
                    </p>
                  </div>
                  {hasTasteSignal(plan, recentLogs) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                      {learnings ? (
                        <>
                          <p style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 0.6rem' }}>Here's what I learned about your taste:</p>
                          <ul style={{ margin: '0 0 0.8rem', paddingLeft: '1.1rem', fontSize: '0.84rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                            {learnings.map((l, i) => <li key={i}>{l}</li>)}
                          </ul>
                          <button type="button" className="btn-ghost" onClick={() => setLearnings(null)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                            Got it
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '0.84rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: '0 0 0.7rem' }}>
                            I've been watching what you swap and skip. Ready for a week built around what you actually like?
                          </p>
                          <button
                            type="button" className="btn-primary" onClick={handleSmartWeek} disabled={learnBusy}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.86rem' }}
                          >
                            {learnBusy && <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />}
                            {learnBusy ? 'Learning your taste…' : 'Start next week smarter'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Festival mode ──────────────────────────────── */}
            {(() => {
              const fm = plan.festivalMode;
              const fest = fm ? getFestival(fm.festivalId) : undefined;
              if (fm && fest) {
                return (
                  <div className="glass-card fade-in-up delay-100" style={{ padding: '1.4rem', marginBottom: '1rem', borderLeft: '4px solid var(--color-accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <h3 style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--color-accent)' }}><SparklesIcon size={17} /></span>
                        {fm.name} mode
                      </h3>
                      <button type="button" className="btn-ghost" onClick={clearFestival} style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}>
                        End
                      </button>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: '0.4rem 0 0.9rem' }}>
                      {fest.blurb}
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.25rem' }}>
                        {new Date(fm.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {fm.type === 'fast' ? ' · fasting' : ' · feasting'}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.5rem' }}>How to enjoy it</p>
                    <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', fontSize: '0.84rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                      {fest.tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.6rem' }}>Festive picks — log as you eat</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {fest.foods.map((food, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', background: 'var(--color-surface2)', borderRadius: '0.7rem', padding: '0.6rem 0.85rem' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.86rem', fontWeight: 650 }}>{food.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                              {food.portion} · {food.calories} kcal · {food.proteinG}g protein
                              {food.tip && <span style={{ display: 'block', fontStyle: 'italic' }}>{food.tip}</span>}
                            </div>
                          </div>
                          <button type="button" className="btn-primary" onClick={() => logFestivalFood(food)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', flexShrink: 0 }}>
                            Log
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div className="glass-card fade-in-up delay-100" style={{ padding: '1rem 1.4rem', marginBottom: '1rem' }}>
                  <button
                    type="button" className="btn-ghost"
                    onClick={() => setFestivalOpen((v) => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 650, padding: '0.5rem' }}
                  >
                    <span style={{ color: 'var(--color-accent)' }}><SparklesIcon size={16} /></span>
                    Celebrating something? Turn on festival mode
                  </button>
                  {festivalOpen && (
                    <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.7rem', alignItems: 'end' }}>
                        <div>
                          <label className="input-label" htmlFor="festival-select">Occasion</label>
                          <select
                            id="festival-select" className="input" value={festivalChoice}
                            onChange={(e) => {
                              setFestivalChoice(e.target.value);
                              const d = getFestival(e.target.value)?.defaultDate;
                              if (d) setFestivalDate(d);
                            }}
                          >
                            {FESTIVALS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="input-label" htmlFor="festival-date">Date</label>
                          <input id="festival-date" type="date" className="input" value={festivalDate} onChange={(e) => setFestivalDate(e.target.value)} />
                        </div>
                        <div>
                          <button type="button" className="btn-primary" onClick={activateFestival} style={{ width: '100%', padding: '0.6rem' }}>
                            Activate
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem' }}>Macro breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={macroData} cx={65} cy={65} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e6e5e0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {macroData.map((m) => (
                    <div key={m.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-muted)' }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                          {m.name}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.value}g</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 5 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.round((m.value / (calcs.proteinG + calcs.carbsG + calcs.fatG)) * 100)}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Key stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
                {[
                  { v: calcs.bmi, l: `BMI · ${calcs.bmiCategory}`, c: bmiColor },
                  { v: calcs.dailyCalorieGoal, l: 'Daily calories', c: 'var(--color-text)' },
                  { v: Math.abs(calcs.weeklyWeightChangeKg), l: `kg / week ${profile.goal === 'lose_weight' ? 'loss' : 'gain'}`, c: 'var(--color-text)' },
                  { v: `${calcs.waterLiters}L`, l: 'Water target', c: 'var(--color-text)' },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                    <div className="metric-label" style={{ marginTop: '0.15rem' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem', gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BulbIcon size={17} style={{ color: 'var(--color-accent)' }} /> Recommendations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {plan.tips.slice(0, 4).map((tip, i) => (
                  <div key={i} style={{ padding: '0.9rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {tip.replace(/^[^\s]+\s/, '')}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ── MEALS ─────────────────────────────────────── */}
        {activeTab === 'meals' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {plan.weeklyPlan.map((d, i) => (
                <button key={d.day}
                  className={`tab-btn ${activeDay === i ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                  onClick={() => setActiveDay(i)}
                  style={{ minWidth: 64, border: activeDay === i ? 'none' : '1px solid var(--color-border)', background: activeDay === i ? undefined : 'var(--color-surface)' }}>
                  {d.day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{selectedDayPlan.day}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{selectedDayPlan.totalCalories}</strong> kcal total
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MEAL_META.map((meta) => (
                <MealCard
                  key={meta.key}
                  meta={meta}
                  meal={selectedDayPlan[meta.key]}
                  slotType={meta.key === 'morningSnack' || meta.key === 'afternoonSnack' ? 'snack' : meta.key}
                  profile={profile}
                  onShowRecipe={setRecipeMeal}
                  onSwap={handleSwapMeal}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKER ───────────────────────────────────── */}
        {activeTab === 'tracker' && (
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '0.98rem' }}>Today's calories</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>Based on meals you've logged</p>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {draftCalsConsumed}
                <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)', fontWeight: 500 }}> / {calcs.dailyCalorieGoal} kcal</span>
              </div>
              <div className="progress-bar-track" style={{ marginTop: '1rem', height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${draftCaloriePct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                <span>{draftCaloriePct}% of target</span>
                <span>{calcs.dailyCalorieGoal - draftCalsConsumed} kcal remaining</span>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Eaten</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{draftCalsConsumed} kcal</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Burned</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>−{draftBurned} kcal</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Net</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-accent)' }}>{draftNet} kcal</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem' }}>Log meals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {MEAL_META.map((meta, i) => {
                  const done = draftLog.mealsCompleted[i];
                  return (
                    <button key={meta.key} onClick={() => toggleMealDraft(i)}
                      className={`option-card ${done ? 'selected' : ''}`}
                      style={{ padding: '0.7rem 0.9rem', alignItems: 'center' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                        border: `1.5px solid ${done ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                        background: done ? 'var(--color-accent)' : 'transparent',
                        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && <CheckIcon size={13} />}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {selectedDayPlan[meta.key].calories} kcal
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '0.98rem' }}>Log what you ate</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
                Anything off-plan — describe it or snap a photo, and we'll estimate the nutrition
              </p>
              <input
                ref={photoInputRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} aria-label="Take a photo of your meal"
                onChange={(e) => handlePhotoMeal(e.target.files?.[0])}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text" className="input-field" style={{ marginBottom: 0, flex: 1 }}
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEstimateMeal(); }}
                  placeholder="e.g. 2 rotis, dal, 1 glass lassi"
                  maxLength={500}
                  aria-label="Describe what you ate"
                />
                <button
                  type="button" className="btn-ghost" onClick={() => photoInputRef.current?.click()}
                  disabled={extraBusy} title="Snap a photo of your meal" aria-label="Snap a photo of your meal"
                  style={{ flexShrink: 0, padding: '0 0.75rem', display: 'inline-flex', alignItems: 'center' }}
                >
                  <CameraIcon size={18} />
                </button>
                <button
                  type="button" className="btn-primary" onClick={handleEstimateMeal}
                  disabled={!extraText.trim() || extraBusy}
                  style={{ flexShrink: 0, padding: '0 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {extraBusy ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <PlusIcon size={16} />}
                  Log
                </button>
              </div>
              {extraBusy && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.6rem' }}>
                  Analyzing your meal…
                </p>
              )}
              {extraError && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
                  {extraError} — <button type="button" className="btn-ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={handleEstimateMeal}>Try again</button>
                </p>
              )}
              {photoVerdict && (() => {
                const styles = {
                  yes: { label: 'Go for it', color: 'var(--color-accent)', bg: 'var(--color-accent-soft)', border: 'var(--color-accent)' },
                  okay: { label: 'Fine in a small portion', color: 'var(--color-warning)', bg: 'rgba(180,83,9,0.08)', border: 'var(--color-warning)' },
                  skip: { label: 'Better skip this one', color: 'var(--color-danger)', bg: 'rgba(180,35,24,0.06)', border: 'var(--color-danger)' },
                }[photoVerdict.verdict];
                const m = photoVerdict.meal;
                return (
                  <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: '0.8rem', padding: '0.9rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: styles.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 750, fontSize: '0.9rem', color: styles.color }}>{styles.label}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 650, marginBottom: '0.15rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums', marginBottom: photoVerdict.verdictWhy ? '0.45rem' : '0.6rem' }}>
                      ~{m.calories} kcal · P {m.proteinG}g · C {m.carbsG}g · F {m.fatG}g · photo estimate
                    </div>
                    {photoVerdict.verdictWhy && (
                      <p style={{ fontSize: '0.83rem', lineHeight: 1.6, color: 'var(--color-text)', margin: '0 0 0.7rem' }}>
                        {photoVerdict.verdictWhy}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn-primary" onClick={confirmPhotoMeal} style={{ padding: '0.5rem 1.1rem', fontSize: '0.84rem' }}>
                        Log it
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => setPhotoVerdict(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}>
                        Skip
                      </button>
                    </div>
                  </div>
                );
              })()}
              {(draftLog.extraMeals || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {draftLog.extraMeals.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem',
                      background: 'var(--color-surface2)', borderRadius: '0.7rem', padding: '0.6rem 0.8rem',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                          <span style={{ fontWeight: 650, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                          {m.source === 'photo' && (
                            <span className="badge badge-grey" style={{ fontSize: '0.64rem', padding: '0.12rem 0.45rem', flexShrink: 0 }} title="Estimated from a photo — approximate">
                              photo · estimate
                            </span>
                          )}
                          {m.source === 'menu' && (
                            <span className="badge badge-grey" style={{ fontSize: '0.64rem', padding: '0.12rem 0.45rem', flexShrink: 0 }} title="Picked from a restaurant menu">
                              menu pick
                            </span>
                          )}
                          {m.offline && (
                            <span className="badge badge-grey" style={{ fontSize: '0.64rem', padding: '0.12rem 0.45rem', flexShrink: 0 }} title="Estimated on your device — the AI service was unreachable">
                              offline estimate
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {m.calories} kcal · {m.proteinG}g protein
                        </div>
                      </div>
                      <button type="button" className="btn-ghost" onClick={() => removeExtraMeal(m.id)}
                        aria-label={`Remove ${m.name}`} title="Remove" style={{ padding: '0.4rem', flexShrink: 0 }}>
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-faint)' }}>Nothing extra logged today.</p>
              )}

              {/* ── Menu rescue ─────────────────────────────── */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <input
                  ref={menuInputRef} type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }} aria-label="Photograph the restaurant menu"
                  onChange={(e) => handleMenuPhoto(e.target.files?.[0])}
                />
                <button
                  type="button" className="btn-ghost" onClick={() => menuInputRef.current?.click()}
                  disabled={menuBusy}
                  style={{ width: '100%', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.86rem', fontWeight: 650 }}
                >
                  {menuBusy
                    ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    : <CameraIcon size={16} />}
                  {menuBusy ? 'Reading the menu…' : 'Eating out? Scan the menu'}
                </button>
                {menuError && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', marginTop: '0.6rem', marginBottom: 0 }}>
                    {menuError} — <button type="button" className="btn-ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={() => menuInputRef.current?.click()}>Try again</button>
                  </p>
                )}
                {menuPicks.length > 0 && (
                  <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: 0 }}>Smartest picks for your goal:</p>
                    {menuPicks.map((p, i) => (
                      <div key={i} style={{ background: 'var(--color-surface2)', borderRadius: '0.7rem', padding: '0.7rem 0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{i + 1}. {p.name}</span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {p.calories} kcal · {p.proteinG}g protein
                          </span>
                        </div>
                        {p.why && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: '0.3rem 0 0.55rem', lineHeight: 1.5 }}>{p.why}</p>
                        )}
                        <button type="button" className="btn-primary" onClick={() => logMenuPick(p)} style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                          Log this
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Daily log</h3>

              <div style={{ marginBottom: '1.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Water intake</label>
                  <span style={{ fontWeight: 750, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{draftLog.waterLiters}L</span>
                </div>
                <input type="range" min={0} max={6} step={0.25} value={draftLog.waterLiters}
                  onChange={(e) => updateDraft({ waterLiters: +e.target.value })} />
                <div style={{ fontSize: '0.74rem', color: 'var(--color-faint)', marginTop: '0.3rem', textAlign: 'right' }}>Target: {calcs.waterLiters}L</div>
              </div>

              <div style={{ marginBottom: '1.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Exercise</label>
                  {(draftLog.exercises || []).length > 0 && (
                    <span style={{ fontWeight: 750, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                      −{draftBurned} kcal burned
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <input
                    type="text" className="input-field" style={{ marginBottom: 0, flex: 1 }}
                    value={exerciseText}
                    onChange={(e) => setExerciseText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEstimateExercise(); }}
                    placeholder="e.g. 30 min cricket, morning walk"
                    maxLength={300}
                    aria-label="Describe your workout"
                  />
                  <button
                    type="button" className="btn-primary" onClick={handleEstimateExercise}
                    disabled={!exerciseText.trim() || exerciseBusy}
                    style={{ flexShrink: 0, padding: '0 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {exerciseBusy ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <PlusIcon size={16} />}
                    Log
                  </button>
                </div>
                {exerciseError && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', marginBottom: '0.6rem' }}>
                    {exerciseError} — <button type="button" className="btn-ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={handleEstimateExercise}>Try again</button>
                  </p>
                )}
                {(draftLog.exercises || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {draftLog.exercises.map((e) => (
                      <div key={e.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.7rem',
                        background: 'var(--color-surface2)', borderRadius: '0.7rem', padding: '0.6rem 0.8rem',
                      }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: 'var(--color-accent)', color: '#fff',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <DumbbellIcon size={16} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <span style={{ fontWeight: 650, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                            {e.offline && (
                              <span className="badge badge-grey" style={{ fontSize: '0.64rem', padding: '0.12rem 0.45rem', flexShrink: 0 }} title="Estimated on your device — the AI service was unreachable">
                                offline estimate
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {e.durationMin ? `${e.durationMin} min · ` : ''}−{e.caloriesBurned} kcal
                          </div>
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => removeExercise(e.id)}
                          aria-label={`Remove ${e.name}`} title="Remove" style={{ padding: '0.4rem', flexShrink: 0 }}>
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-faint)' }}>No workouts logged yet today.</p>
                )}
              </div>

              <div style={{ marginBottom: '1.3rem' }}>
                <label className="input-label" htmlFor="log-weight">Today's weight (kg)</label>
                <input id="log-weight" type="number" className="input-field"
                  value={draftLog.weight || ''} onChange={(e) => updateDraft({ weight: +e.target.value })}
                  placeholder={`${profile.weightKg}`} />
              </div>

              <div>
                <span className="input-label">How do you feel today?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {MOODS.map((m) => (
                    <button key={m.v} type="button" onClick={() => updateDraft({ mood: m.v as DailyLog['mood'] })}
                      className={`option-card ${draftLog.mood === m.v ? 'selected' : ''}`}
                      style={{ flex: 1, padding: '0.65rem 0', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '0.25rem' }}
                      title={m.label}>
                      <m.icon size={20} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.1rem 1.4rem', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                {saveState === 'saved' ? (
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-accent)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckIcon size={16} /> Day progress saved{savedAt ? ` · ${savedAt}` : ''}
                  </span>
                ) : saveState === 'error' ? (
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-danger)', fontWeight: 650 }}>Couldn't save — check your connection and try again.</span>
                ) : hasUnsaved ? (
                  <span className="badge badge-amber">Unsaved changes</span>
                ) : (
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>Today's progress is up to date.</span>
                )}
              </div>
              <button className="btn-primary" onClick={handleSaveProgress} disabled={!hasUnsaved || saveState === 'saving'}
                style={{ padding: '0.7rem 1.6rem' }}>
                {saveState === 'saving' ? 'Saving…' : 'Save day progress'}
              </button>
            </div>
          </div>
        )}

        {/* ── SHOPPING ──────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>Weekly inventory</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem' }}>
                  Tick off what you already have stocked for your plan
                </p>
              </div>
              <span className="badge badge-green">{plan.shoppingList.length} items</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.6rem' }}>
              {plan.shoppingList.map((item, i) => (
                <InventoryItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatErrorBoundary>
        <HealthAgentChat plan={savedPlan} />
      </ChatErrorBoundary>

      {recipeMeal && (
        <RecipeModal
          meal={recipeMeal}
          region={(savedPlan.plan.region || 'global').replace(/-/g, ' ')}
          restrictions={savedPlan.profile.dietaryRestrictions}
          onClose={() => setRecipeMeal(null)}
        />
      )}

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)} role="dialog" aria-modal="true" aria-label="Confirm data reset">
          <div className="glass-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <span style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: '#fdecea', color: 'var(--color-danger)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrashIcon size={18} />
              </span>
              <div>
                <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Reset all data?</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  This permanently deletes your profile, diet plans, and daily logs from the cloud. This cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)} style={{ padding: '0.65rem 1.3rem' }}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleResetAll} style={{ padding: '0.65rem 1.3rem' }}>
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({
  meta, meal, slotType, profile, taste, onShowRecipe, onSwap,
}: {
  meta: (typeof MEAL_META)[number];
  meal: Meal;
  slotType: MealType;
  profile: UserProfile;
  taste?: TasteProfile;
  onShowRecipe: (meal: Meal) => void;
  onSwap: (slotKey: 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner', meal: Meal) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAlts, setShowAlts] = useState(false);
  const Icon = meta.icon;
  const alternatives = useMemo(
    () => (showAlts ? getMealAlternatives(meal, slotType, profile, 3, taste) : []),
    [showAlts, meal, slotType, profile, taste],
  );
  return (
    <div className="meal-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          all: 'unset', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.9rem', boxSizing: 'border-box',
        }}>
        <span style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={21} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-faint)', fontWeight: 650, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
            {meta.label} · {meta.time}
          </span>
          <span style={{ display: 'block', fontWeight: 650, fontSize: '0.98rem', marginBottom: '0.2rem' }}>{meal.name}</span>
          <span style={{ display: 'flex', gap: '0.8rem', fontSize: '0.79rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{meal.calories} kcal</span>
            <span>P {meal.protein}g</span>
            <span>C {meal.carbs}g</span>
            <span>F {meal.fat}g</span>
          </span>
        </span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
          <span className="badge badge-grey"><FlameIcon size={12} /> {meal.prepTime}</span>
          <ChevronDownIcon size={16} style={{ color: 'var(--color-faint)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />
        </span>
      </button>
      {open && (
        <div className="fade-in-up" style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)', fontSize: '0.87rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
          {meal.description}
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              {meal.tags.map((t) => <span key={t} className="badge badge-grey">{t}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => onShowRecipe(meal)}>
              <UtensilsIcon size={14} /> Recipe
            </button>
            <button type="button" className="btn-secondary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setShowAlts((s) => !s)}>
              <RefreshIcon size={14} /> {showAlts ? 'Hide alternatives' : 'Alternatives'}
            </button>
          </div>
          {showAlts && (
            <div className="fade-in-up" style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-faint)', fontWeight: 600 }}>
                Can't make this? Similar swaps:
              </div>
              {alternatives.length === 0 && (
                <div style={{ fontSize: '0.84rem', color: 'var(--color-muted)' }}>No alternatives found.</div>
              )}
              {alternatives.map((alt) => (
                <div key={alt.name} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.8rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.7rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650, fontSize: '0.86rem', color: 'var(--color-text)' }}>{alt.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {alt.calories} kcal · P {alt.protein}g · {alt.prepTime}
                    </div>
                  </div>
                  <button type="button" className="btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem', flexShrink: 0 }}
                    onClick={() => { onSwap(meta.key, alt); setShowAlts(false); }}>
                    Use this
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InventoryItem({ item }: { item: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked((c) => !c)}
      className="glass-card"
      style={{
        all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%',
        padding: '0.8rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
        opacity: checked ? 0.55 : 1, transition: 'opacity 140ms ease',
      }}>
      <span style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
        background: checked ? 'var(--color-accent)' : 'transparent',
        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <CheckIcon size={12} />}
      </span>
      <span style={{
        fontSize: '0.87rem',
        textDecoration: checked ? 'line-through' : 'none',
        color: checked ? 'var(--color-faint)' : 'var(--color-text)',
      }}>
        {item}
      </span>
    </button>
  );
}
