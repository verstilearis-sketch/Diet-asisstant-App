'use client';

/* ── Mood calendar ───────────────────────────────────────────────────────
   Monthly grid showing your logged mood each day — the companion to the
   planner calendar. Moods come from the daily logs ("How do you feel
   today?"); tapping a day shows its mood.
------------------------------------------------------------------------ */

import { useEffect, useState } from 'react';
import { getDailyLogsRange } from '@/lib/storage';
import { ChevronDownIcon } from '@/components/icons';

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOOD_META: Record<string, { emoji: string; label: string; color: string }> = {
  great: { emoji: '😄', label: 'Great', color: '#2fa866' },
  good: { emoji: '🙂', label: 'Good', color: '#7cb342' },
  okay: { emoji: '😐', label: 'Okay', color: '#d97706' },
  bad: { emoji: '😞', label: 'Rough', color: '#dc2626' },
};

export default function MoodCalendar({ userId }: { userId: string }) {
  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>(todayKey);

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const leadOffset = (new Date(viewY, viewM, 1).getDay() + 6) % 7;
  const trailingCount = (7 - ((leadOffset + daysInMonth) % 7)) % 7;

  useEffect(() => {
    let cancelled = false;
    getDailyLogsRange(userId, toKey(viewY, viewM, 1), toKey(viewY, viewM, daysInMonth))
      .then((logs) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const l of logs) {
          if (l.mood) map[l.date] = l.mood;
        }
        setMoods(map);
      })
      .catch(() => { if (!cancelled) setMoods({}); });
    return () => { cancelled = true; };
  }, [userId, viewY, viewM, daysInMonth]);

  const shiftMonth = (dir: number) => {
    const d = new Date(viewY, viewM + dir, 1);
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
  };
  const isCurrentMonth = viewY === now.getFullYear() && viewM === now.getMonth();

  const selectedMood = moods[selected];
  const selectedMeta = selectedMood ? MOOD_META[selectedMood] : null;

  const cells: { key: string; day: number; inMonth: boolean }[] = [];
  const prevMonthDays = new Date(viewY, viewM, 0).getDate();
  for (let i = 0; i < leadOffset; i++) {
    cells.push({ key: `p${i}`, day: prevMonthDays - leadOffset + 1 + i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: toKey(viewY, viewM, d), day: d, inMonth: true });
  }
  for (let i = 1; i <= trailingCount; i++) {
    cells.push({ key: `n${i}`, day: i, inMonth: false });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <h3 style={{ fontSize: '0.98rem', margin: 0 }}>Mood calendar</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '0.3rem' }}>
            <ChevronDownIcon size={16} style={{ transform: 'rotate(90deg)' } as React.CSSProperties} />
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 650, minWidth: 110, textAlign: 'center' }}>
            {MONTHS[viewM]} {viewY}
          </span>
          <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} disabled={isCurrentMonth}
            style={{ background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer', color: isCurrentMonth ? 'var(--color-faint)' : 'var(--color-muted)', padding: '0.3rem', opacity: isCurrentMonth ? 0.4 : 1 }}>
            <ChevronDownIcon size={16} style={{ transform: 'rotate(-90deg)' } as React.CSSProperties} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
        {DOWS.map((d) => (
          <div key={d} style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--color-faint)', textAlign: 'center', padding: '0.2rem 0' }}>
            {d}
          </div>
        ))}
        {cells.map((c) => {
          const mood = c.inMonth ? moods[c.key] : undefined;
          const meta = mood ? MOOD_META[mood] : null;
          const isToday = c.key === todayKey;
          const isSelected = c.key === selected;
          return (
            <button
              key={c.key}
              type="button"
              disabled={!c.inMonth}
              onClick={() => setSelected(c.key)}
              style={{
                aspectRatio: '1', borderRadius: '0.65rem', border: '1px solid var(--color-border)',
                background: meta ? `${meta.color}22` : isSelected ? 'var(--color-surface2)' : 'transparent',
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                color: c.inMonth ? 'var(--color-text)' : 'var(--color-faint)',
                opacity: c.inMonth ? 1 : 0.35,
                fontSize: meta ? '1.05rem' : '0.78rem',
                fontWeight: isToday ? 800 : 500,
                cursor: c.inMonth ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isToday ? 'inset 0 0 0 1.5px var(--color-accent)' : 'none',
              }}
              aria-label={meta ? `${c.day} ${MONTHS[viewM]} — felt ${meta.label}` : `${c.day} ${MONTHS[viewM]}`}
            >
              {meta ? meta.emoji : c.day}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '0.9rem', fontSize: '0.82rem', color: 'var(--color-muted)', minHeight: '1.4em' }}>
        {selectedMeta ? (
          <span>On <strong style={{ color: 'var(--color-text)' }}>{selected}</strong> you felt <strong style={{ color: selectedMeta.color }}>{selectedMeta.label}</strong> {selectedMeta.emoji}</span>
        ) : (
          <span>No mood logged for <strong style={{ color: 'var(--color-text)' }}>{selected}</strong> — log it in the Daily tracker.</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {Object.values(MOOD_META).map((m) => (
          <span key={m.label} style={{ fontSize: '0.72rem', color: 'var(--color-faint)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            {m.emoji} {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
