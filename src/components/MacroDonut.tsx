'use client';

import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export type MacroDatum = { name: string; value: number; color: string };

/**
 * Memoized macro donut. Recharts is heavy to re-render, so this component only
 * updates when the data values actually change — the parent passes a fresh
 * array each render, so a deep comparison on values (not identity) is used.
 * Loaded via next/dynamic in the dashboard so the chart library doesn't block
 * the initial page render.
 *
 * Note: intentionally NOT using useMemo in the parent for the data array,
 * because the dashboard has an early return for the loading state and hooks
 * must not come after it (React error #310).
 */
function MacroDonutInner({ data }: { data: MacroDatum[] }) {
  return (
    <ResponsiveContainer width={140} height={140}>
      <PieChart>
        <Pie data={data} cx={65} cy={65} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} strokeWidth={0}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1a18', border: '1px solid #2e2e2a', borderRadius: 8, fontSize: 12, color: '#f5f5f3', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}
          labelStyle={{ color: '#f5f5f3' }}
          itemStyle={{ color: '#f5f5f3' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function macroDataEqual(prev: readonly MacroDatum[], next: readonly MacroDatum[]): boolean {
  return (
    prev.length === next.length &&
    prev.every((d, i) => d.value === next[i].value && d.color === next[i].color && d.name === next[i].name)
  );
}

export const MacroDonut = memo(MacroDonutInner, (prev, next) => macroDataEqual(prev.data, next.data));

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
