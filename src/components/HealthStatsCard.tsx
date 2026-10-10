'use client';

import { useEffect, useState } from 'react';
import { ActivityIcon, ChevronUpIcon } from '@/components/icons';

interface HealthStatsCardProps {
  bmr: number;
  tdee: number;
  target: number;
  goalLabel: string;
  onRecalculate: () => void;
}

/**
 * Health stats as a tracker card — icon badge header, animated hero
 * number, pill progress bar, stat rows, and a full-width CTA.
 */
export function HealthStatsCard({ bmr, tdee, target, goalLabel, onRecalculate }: HealthStatsCardProps) {
  const [open, setOpen] = useState(true);
  const [display, setDisplay] = useState(0);

  // Animated count-up on the hero number
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const pct = tdee > 0 ? Math.min(100, Math.round((target / tdee) * 100)) : 0;

  return (
    <div className="glass-card tracker-card">
      <button
        type="button"
        className="tracker-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Collapse health stats' : 'Expand health stats'}
      >
        <span className="tracker-badge"><ActivityIcon size={18} /></span>
        <span className="tracker-titles">
          <strong>Health stats</strong>
          <small>Your body&apos;s daily numbers</small>
        </span>
        <span className={`tracker-chevron ${open ? '' : 'tracker-chevron-closed'}`}>
          <ChevronUpIcon size={16} />
        </span>
      </button>

      {open && (
        <div className="tracker-body">
          <div className="tracker-hero">
            <span className="tracker-num">{display.toLocaleString('en-IN')}</span>
            <span className="tracker-unit">kcal / day</span>
          </div>
          <div className="tracker-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily target versus total daily burn">
            <div style={{ width: `${pct}%` }} />
          </div>
          <p className="tracker-cap">Daily target · {goalLabel}</p>

          <div className="tracker-rows">
            <div>
              <span>Basal metabolic rate</span>
              <strong>{Math.round(bmr).toLocaleString('en-IN')} kcal</strong>
            </div>
            <div>
              <span>Total daily burn</span>
              <strong>{Math.round(tdee).toLocaleString('en-IN')} kcal</strong>
            </div>
          </div>

          <p className="tracker-note">
            BMR is what your body burns doing nothing; TDEE adds your activity and work. Your target is set from these.
          </p>
          <button type="button" className="tracker-cta" onClick={onRecalculate}>
            Recalculate my numbers
          </button>
        </div>
      )}
    </div>
  );
}
