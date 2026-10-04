'use client';

import { useEffect, useState } from 'react';
import type { Meal } from '@/lib/ai-engine';
import { XIcon, ClockIcon, CheckIcon } from '@/components/icons';

interface Recipe {
  ingredients: string[];
  steps: string[];
  servings: number;
  prepTime: string;
}

function cacheKey(name: string) {
  return `dietai_recipe:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function readCache(name: string): Recipe | null {
  try {
    const raw = localStorage.getItem(cacheKey(name));
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (Array.isArray(r.ingredients) && Array.isArray(r.steps)) return r as Recipe;
    return null;
  } catch {
    return null;
  }
}

export default function RecipeModal({
  meal,
  region,
  restrictions,
  onClose,
}: {
  meal: Meal;
  region?: string;
  restrictions?: string[];
  onClose: () => void;
}) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setRecipe(null);
    setError('');
    setLoading(true);

    const cached = readCache(meal.name);
    if (cached && retryKey === 0) {
      setRecipe(cached);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: meal.name,
            description: meal.description,
            calories: meal.calories,
            protein: meal.protein,
            prepTime: meal.prepTime,
            servings: 2,
            restrictions: restrictions ?? [],
            region: region ?? '',
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.recipe) {
          throw new Error(data.error || 'Recipe service unavailable');
        }
        setRecipe(data.recipe);
        try {
          localStorage.setItem(cacheKey(meal.name), JSON.stringify(data.recipe));
        } catch {
          // cache is best-effort
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the recipe.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meal, region, restrictions, retryKey]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Recipe for ${meal.name}`}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', padding: '1.6rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.4rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-faint)', fontWeight: 650, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Recipe
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.3rem' }}>{meal.name}</h3>
            <div style={{ display: 'flex', gap: '0.7rem', fontSize: '0.8rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{meal.calories} kcal</span>
              <span>P {meal.protein}g</span>
              {recipe?.prepTime ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ClockIcon size={13} /> {recipe.prepTime}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ClockIcon size={13} /> {meal.prepTime}
                </span>
              )}
              {recipe && <span>Serves {recipe.servings}</span>}
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            aria-label="Close recipe"
            style={{ padding: '0.5rem', flexShrink: 0 }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>Writing your recipe…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-box" style={{ marginTop: '1rem' }}>
            {error}
            <div style={{ marginTop: '0.75rem' }}>
              <button
                className="btn-secondary"
                style={{ padding: '0.6rem 1.2rem' }}
                onClick={() => setRetryKey((k) => k + 1)}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {recipe && !loading && (
          <div className="fade-in-up">
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.7rem', marginTop: '1.1rem' }}>Ingredients</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {recipe.ingredients.map((ing, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '0.1rem' }}>
                    <CheckIcon size={14} />
                  </span>
                  {ing}
                </li>
              ))}
            </ul>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.7rem', marginTop: '1.4rem' }}>Method</h4>
            <ol style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {recipe.steps.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                  <span
                    style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
                      fontSize: '0.75rem', fontWeight: 750,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
