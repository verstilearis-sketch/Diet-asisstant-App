"use client";

// Static mockup of the Zaiq dashboard, shown inside the ContainerScroll's
// 3D card like a product screenshot.
import * as React from "react";

const MEALS = [
  { meal: "Breakfast", name: "3-egg bhurji, 2 toast, glass of milk", kcal: 480, protein: 28 },
  { meal: "Lunch", name: "Grilled chicken, brown rice, dal", kcal: 680, protein: 52 },
  { meal: "Snack", name: "Greek yogurt, roasted makhana", kcal: 240, protein: 18 },
  { meal: "Dinner", name: "Paneer tikka, 2 rotis, salad", kcal: 650, protein: 30 },
];

const MACROS = [
  { label: "Protein", value: "128g", pct: 82, color: "#f5f5f3" },
  { label: "Carbs", value: "205g", pct: 64, color: "#a3a29c" },
  { label: "Fat", value: "62g", pct: 48, color: "#4a4a46" },
];

export function ZaiqAppPreview() {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: "#f87171" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#f59e0b" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#4ade80" }} />
        </div>
        <div className="flex-1 text-center">
          <span
            className="rounded-full px-3 py-1 text-[11px]"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-muted)",
            }}
          >
            zaiq.app/dashboard
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* App body */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 md:grid-cols-5 md:p-6">
        {/* Left: today's plan */}
        <div className="md:col-span-3">
          <div
            className="mb-1 text-[11px] font-bold uppercase"
            style={{ color: "var(--color-muted)", letterSpacing: "0.08em" }}
          >
            Tuesday, your plan
          </div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-lg font-bold">Today&apos;s meals</h3>
            <span className="mono text-sm font-bold" style={{ color: "var(--color-text)" }}>
              2,050 <span style={{ color: "var(--color-faint)" }}>/ 2,100 kcal</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {MEALS.map((m) => (
              <div
                key={m.meal}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-bold uppercase"
                    style={{ color: "var(--color-faint)", letterSpacing: "0.06em" }}
                  >
                    {m.meal}
                  </div>
                  <div className="truncate text-[13px] font-medium">{m.name}</div>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <div className="mono text-[13px] font-bold">{m.kcal}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>
                    kcal · {m.protein}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: macros + stats */}
        <div className="hidden flex-col gap-4 md:col-span-2 md:flex">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="mb-3 text-[11px] font-bold uppercase"
              style={{ color: "var(--color-muted)", letterSpacing: "0.08em" }}
            >
              Macros
            </div>
            <div className="flex flex-col gap-2.5">
              {MACROS.map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span style={{ color: "var(--color-muted)" }}>{m.label}</span>
                    <span className="mono font-semibold">{m.value}</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "var(--color-bg)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.pct}%`, background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="mb-2 text-[11px] font-bold uppercase"
              style={{ color: "var(--color-muted)", letterSpacing: "0.08em" }}
            >
              Health stats
            </div>
            {[
              ["BMR", "1,620 kcal"],
              ["TDEE", "2,510 kcal"],
              ["BMI", "23.4"],
            ].map(([l, v]) => (
              <div
                key={l}
                className="flex justify-between py-1 text-[12px]"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <span style={{ color: "var(--color-muted)" }}>{l}</span>
                <span className="mono font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
