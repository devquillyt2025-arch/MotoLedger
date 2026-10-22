"use client";

import { useState } from "react";
import { SERIES } from "@/lib/chart-colors";
import { num, rupees } from "@/lib/format";


/** Compact rupee tick: ₹0, ₹500, ₹1.5K, ₹12K. */
function rupeeTick(v: number) {
  if (v >= 1000) return `₹${num(v / 1000, 1)}K`;
  return `₹${num(v)}`;
}

/** Round the axis top up to a clean step so ticks read 0 / 500 / 1,000 … */
function niceScale(max: number, targetTicks = 4) {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const rough = max / targetTicks;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  return { top, ticks };
}

export function Legend({ series }: { series: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-300">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

export type Column = {
  key: string;
  x: string; // axis label
  title: string; // tooltip heading
  values: number[]; // one per series, bottom → top
  notes?: string[]; // extra tooltip lines
};

/**
 * Columns from one baseline, stacked when there are several series. 2px surface gap between segments,
 * 4px rounded cap, ≤24px wide. Hover (or tap) a band for a tooltip; optional reference line.
 */
export function ColumnChart({
  columns,
  series,
  capLabels = false,
  refLine,
  height = "h-56",
}: {
  columns: Column[];
  series: { name: string; color: string }[];
  capLabels?: boolean;
  refLine?: { value: number; label: string };
  height?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const totals = columns.map((c) => c.values.reduce((a, b) => a + b, 0));
  const { top, ticks } = niceScale(Math.max(...totals, refLine?.value ?? 0));
  const pct = (v: number) => `${(v / top) * 100}%`;
  const many = columns.length > 14;

  return (
    <div className="select-none">
      <div className="flex">
        {/* y-axis */}
        <div className={`relative ${height} w-12 shrink-0`}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 translate-y-1/2 text-[10px] tabular-nums text-zinc-500"
              style={{ bottom: pct(t) }}
            >
              {rupeeTick(t)}
            </span>
          ))}
        </div>

        {/* plot */}
        <div className={`relative ${height} min-w-0 flex-1`} onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-zinc-800" style={{ bottom: pct(t) }} />
          ))}

          {refLine && (
            <div className="pointer-events-none absolute inset-x-0 z-[1]" style={{ bottom: pct(refLine.value) }}>
              <div className="h-px bg-zinc-400/70" />
              <span className="absolute -top-4 right-0 rounded bg-zinc-900/90 px-1 text-[10px] font-medium text-zinc-300">
                {refLine.label}
              </span>
            </div>
          )}

          <div className="absolute inset-0 flex">
            {columns.map((c, i) => {
              const total = totals[i];
              const topSeg = c.values.reduce((last, v, j) => (v > 0 ? j : last), -1);
              return (
                <button
                  key={c.key}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(active === i ? null : i)}
                  aria-label={`${c.title}: ${rupees(total)}`}
                  className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none ${
                    many ? "px-[1px]" : "px-1"
                  } ${active === i ? "bg-zinc-800/40" : ""}`}
                >
                  {capLabels && total > 0 && (
                    <span className="mb-1 text-[10px] font-medium tabular-nums text-zinc-300">{rupeeTick(total)}</span>
                  )}
                  <div className="flex w-full max-w-6 flex-col-reverse gap-[2px]" style={{ height: pct(total) }}>
                    {c.values.map((v, j) =>
                      v > 0 ? (
                        <div
                          key={j}
                          className={j === topSeg ? "rounded-t-[4px]" : ""}
                          style={{ flexGrow: v, flexBasis: 0, minHeight: 2, background: series[j].color }}
                        />
                      ) : null,
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {active != null && (
            <Tooltip
              column={columns[active]}
              total={totals[active]}
              series={series}
              align={active < columns.length / 3 ? "left" : active > (columns.length * 2) / 3 ? "right" : "center"}
              leftPct={((active + 0.5) / columns.length) * 100}
            />
          )}
        </div>
      </div>

      {/* x-axis */}
      <div className="ml-12 flex">
        {columns.map((c, i) => (
          <span
            key={c.key}
            className="min-w-0 flex-1 truncate pt-1.5 text-center text-[10px] text-zinc-500"
          >
            {!many || i % Math.ceil(columns.length / 10) === 0 || i === columns.length - 1 ? c.x : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tooltip({
  column,
  total,
  series,
  align,
  leftPct,
}: {
  column: Column;
  total: number;
  series: { name: string; color: string }[];
  align: "left" | "center" | "right";
  leftPct: number;
}) {
  const shift = align === "left" ? "translate-x-0" : align === "right" ? "-translate-x-full" : "-translate-x-1/2";
  return (
    <div
      className={`pointer-events-none absolute top-1 z-10 min-w-40 rounded-xl border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl ${shift}`}
      style={{ left: `${leftPct}%` }}
    >
      <p className="mb-1 font-semibold text-zinc-100">{column.title}</p>
      {series.length > 1 &&
        column.values.map((v, j) =>
          v > 0 ? (
            <p key={j} className="flex items-center justify-between gap-4 text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: series[j].color }} />
                {series[j].name}
              </span>
              <span className="tabular-nums">{rupees(v)}</span>
            </p>
          ) : null,
        )}
      <p className="flex justify-between gap-4 font-semibold text-zinc-100">
        <span>{series.length > 1 ? "Total" : "Amount"}</span>
        <span className="tabular-nums">{rupees(total)}</span>
      </p>
      {column.notes?.map((n) => (
        <p key={n} className="text-zinc-400">
          {n}
        </p>
      ))}
    </div>
  );
}

/** Part-to-whole as thin horizontal bars on a shared 0–100% scale. */
export function SplitBars({
  rows,
}: {
  rows: { key: keyof typeof SERIES; amount: number; share: number }[];
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-zinc-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[r.key].color }} />
              {SERIES[r.key].name}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold">{rupees(r.amount)}</span>
              <span className="ml-2 text-xs text-zinc-500">{num(r.share * 100, 1)}%</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800">
            {r.share > 0 && (
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(r.share * 100, 1.5)}%`, background: SERIES[r.key].color }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
