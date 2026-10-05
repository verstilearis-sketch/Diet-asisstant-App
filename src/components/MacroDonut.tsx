'use client';

import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export type MacroDatum = { name: string; value: number; color: string };

/**
 * Memoized macro donut. Recharts is heavy to re-render, so this component only
 * updates when `data` actually changes (the parent memoizes the array).
 * Loaded via next/dynamic in the dashboard so the chart library doesn't block
 * the initial page render.
 */
function MacroDonutInner({ data }: { data: MacroDatum[] }) {
  return (
    <ResponsiveContainer width={140} height={140}>
      <PieChart>
        <Pie data={data} cx={65} cy={65} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} strokeWidth={0}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e6e5e0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export const MacroDonut = memo(MacroDonutInner);

/** Lightweight placeholder shown while the chart chunk loads — no layout shift. */
export function MacroDonutPlaceholder() {
  return (
    <div
      aria-hidden
      style={{
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'conic-gradient(var(--color-accent-soft) 0 70%, var(--color-surface) 70% 100%)',
        opacity: 0.6,
      }}
    />
  );
}
