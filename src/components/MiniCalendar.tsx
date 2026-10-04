'use client';

import { useEffect, useState } from 'react';
import { getLoggedDates, fetchDailyLog, type DailyLog } from '@/lib/storage';
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '@/components/icons';

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MOOD_LABELS: Record<string, string> = { great: 'Great', good: 'Good', okay: 'Okay', bad: 'Rough' };

function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Mini tracking calendar: dots on days with a saved log, tap a day to see its summary. */
export default function MiniCalendar({ userId }: { userId: string }) {
  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string>(todayKey);
  const [detail, setDetail] = useState<DailyLog | null | undefined>(undefined);
  const [streak, setStreak] = useState(0);

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstDow = new Date(viewY, viewM, 1).getDay();

  // Logged days for the visible month
  useEffect(() => {
    let cancelled = false;
    getLoggedDates(userId, toKey(viewY, viewM, 1), toKey(viewY, viewM, daysInMonth))
      .then((dates) => {
        if (!cancelled) setLogged(new Set(dates));
      })
      .catch(() => {
        if (!cancelled) setLogged(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [userId, viewY, viewM, daysInMonth]);

  // Streak: consecutive tracked days ending today (or yesterday if today isn't logged yet)
  useEffect(() => {
    let cancelled = false;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - 120);
    const fmt = (d: Date) => toKey(d.getFullYear(), d.getMonth(), d.getDate());
    getLoggedDates(userId, fmt(start), fmt(end))
      .then((dates) => {
        if (cancelled) return;
        const set = new Set(dates);
        const d = new Date(end);
        if (!set.has(fmt(d))) d.setDate(d.getDate() - 1);
        let s = 0;
        while (set.has(fmt(d))) {
          s++;
          d.setDate(d.getDate() - 1);
        }
        setStreak(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Detail for the selected day
  useEffect(() => {
    let cancelled = false;
    setDetail(undefined);
    fetchDailyLog(userId, selected)
      .then((log) => {
        if (!cancelled) setDetail(log);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, selected]);

  const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const atPresentMonth = viewY === now.getFullYear() && viewM === now.getMonth();

  const goMonth = (dir: -1 | 1) => {
    const d = new Date(viewY, viewM + dir, 1);
    if (d.getTime() > now.getTime()) return; // no future months
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
  };

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <h3 style={{ fontSize: '0.98rem' }}>Tracking days</h3>
        {streak > 1 && (
          <span className="badge badge-green">
            <FlameIcon size={12} /> {streak}-day streak
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 1 290px', minWidth: 250 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={() => goMonth(-1)} aria-label="Previous month" style={{ padding: '0.4rem' }}>
              <ChevronLeftIcon size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{monthLabel}</span>
            <button
              type="button" className="btn-ghost" onClick={() => goMonth(1)} aria-label="Next month"
              disabled={atPresentMonth} style={{ padding: '0.4rem', opacity: atPresentMonth ? 0.3 : 1 }}
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem', textAlign: 'center' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} style={{ fontSize: '0.66rem', color: 'var(--color-faint)', fontWeight: 700, padding: '0.2rem 0' }}>
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const key = toKey(viewY, viewM, day);
              const isFuture = key > todayKey;
              const isToday = key === todayKey;
              const isSel = key === selected;
              const isLogged = logged.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isFuture}
                  onClick={() => setSelected(key)}
                  aria-label={prettyDate(key)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '0.55rem',
                    border: 'none',
                    cursor: isFuture ? 'default' : 'pointer',
                    background: isSel ? 'var(--color-accent)' : 'transparent',
                    color: isSel ? '#fff' : isFuture ? 'var(--color-faint)' : 'var(--color-text)',
                    opacity: isFuture ? 0.35 : 1,
                    fontSize: '0.78rem',
                    fontWeight: isToday || isSel ? 750 : 500,
                    position: 'relative',
                    boxShadow: isToday && !isSel ? 'inset 0 0 0 1.5px var(--color-accent)' : 'none',
                  }}
                >
                  {day}
                  {isLogged && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 3,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: isSel ? '#fff' : 'var(--color-accent)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {!atPresentMonth && (
            <button
              type="button" className="btn-ghost"
              onClick={() => { setViewY(now.getFullYear()); setViewM(now.getMonth()); }}
              style={{ fontSize: '0.78rem', marginTop: '0.5rem', padding: '0.35rem 0.8rem' }}
            >
              Back to this month
            </button>
          )}
        </div>

        <div style={{ flex: '1 1 220px', minWidth: 220 }}>
          {detail === undefined ? (
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : detail === null ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.4rem' }}>{prettyDate(selected)}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                {selected === todayKey
                  ? 'Nothing saved yet today — log your progress in the Daily tracker.'
                  : 'This day was not tracked.'}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.7rem' }}>{prettyDate(selected)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Meals logged</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {detail.mealsCompleted.filter(Boolean).length} / 5
                  </strong>
                </div>
                {(detail.extraMeals || []).length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Extra meals</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {detail.extraMeals.length} · +{detail.extraMeals.reduce((a, m) => a + m.calories, 0)} kcal
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Water</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{detail.waterLiters}L</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Exercise</span>
                  <span className={`badge ${detail.exerciseDone ? 'badge-green' : 'badge-grey'}`}>
                    {detail.exerciseDone ? 'Done' : 'Not yet'}
                  </span>
                </div>
                {typeof detail.weight === 'number' && detail.weight > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Weight</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{detail.weight} kg</strong>
                  </div>
                )}
                {detail.mood && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Mood</span>
                    <strong>{MOOD_LABELS[detail.mood] ?? detail.mood}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
