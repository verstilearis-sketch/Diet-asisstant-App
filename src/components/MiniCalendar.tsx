'use client';

import { useEffect, useState } from 'react';
import { getLoggedDates, fetchDailyLog, type DailyLog } from '@/lib/storage';
import { FlameIcon, ChevronDownIcon } from '@/components/icons';

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MOOD_LABELS: Record<string, string> = { great: 'Great', good: 'Good', okay: 'Okay', bad: 'Rough' };
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Monthly heatmap calendar: green-tinted cells on tracked days, tap a day for its summary. */
export default function MiniCalendar({ userId }: { userId: string }) {
  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
  const curY = now.getFullYear();
  const curM = now.getMonth();

  const [viewY, setViewY] = useState(curY);
  const [viewM, setViewM] = useState(curM);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string>(todayKey);
  const [detail, setDetail] = useState<DailyLog | null | undefined>(undefined);
  const [streak, setStreak] = useState(0);

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  // Monday-first offset
  const leadOffset = (new Date(viewY, viewM, 1).getDay() + 6) % 7;
  const prevMonthDays = new Date(viewY, viewM, 0).getDate();
  const leading = Array.from({ length: leadOffset }, (_, i) => prevMonthDays - leadOffset + 1 + i);
  const trailingCount = (7 - ((leadOffset + daysInMonth) % 7)) % 7;
  const trailing = Array.from({ length: trailingCount }, (_, i) => i + 1);

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

  const atPresentMonth = viewY === curY && viewM === curM;

  const pickMonth = (m: number) => {
    // No future months
    if (viewY === curY && m > curM) return;
    setViewM(m);
  };
  const pickYear = (y: number) => {
    setViewY(y);
    if (y === curY && viewM > curM) setViewM(curM);
  };
  const yearOptions = Array.from({ length: 6 }, (_, i) => curY - 5 + i);

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
        <div style={{ flex: '0 1 300px', minWidth: 250 }}>
          <div className="heat-cal-head">
            <label className="heat-cal-select">
              <span className="sr-only">Month</span>
              <select value={viewM} onChange={(e) => pickMonth(Number(e.target.value))} aria-label="Month">
                {MONTHS.map((name, i) => (
                  <option key={name} value={i} disabled={viewY === curY && i > curM}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} />
            </label>
            <label className="heat-cal-select heat-cal-select-year">
              <span className="sr-only">Year</span>
              <select value={viewY} onChange={(e) => pickYear(Number(e.target.value))} aria-label="Year">
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDownIcon size={14} />
            </label>
          </div>

          <div className="heat-cal">
            {DOWS.map((d) => (
              <span key={d} className="heat-cal-dow">{d}</span>
            ))}
            {leading.map((day) => (
              <span key={`p${day}`} className="heat-cal-day heat-cal-adj" aria-hidden="true">{day}</span>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
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
                  className={[
                    'heat-cal-day',
                    isLogged ? 'heat-cal-logged' : '',
                    isToday ? 'heat-cal-today' : '',
                    isSel ? 'heat-cal-selected' : '',
                    isFuture ? 'heat-cal-future' : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
            {trailing.map((day) => (
              <span key={`n${day}`} className="heat-cal-day heat-cal-adj" aria-hidden="true">{day}</span>
            ))}
          </div>

          {!atPresentMonth && (
            <button
              type="button" className="btn-ghost"
              onClick={() => { setViewY(curY); setViewM(curM); }}
              style={{ fontSize: '0.78rem', marginTop: '0.6rem', padding: '0.35rem 0.8rem' }}
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    {(detail.exercises || []).length > 0 && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                        −{(detail.exercises || []).reduce((a, e) => a + e.caloriesBurned, 0)} kcal
                      </span>
                    )}
                    <span className={`badge ${detail.exerciseDone || (detail.exercises || []).length > 0 ? 'badge-green' : 'badge-grey'}`}>
                      {detail.exerciseDone || (detail.exercises || []).length > 0 ? 'Done' : 'Not yet'}
                    </span>
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
