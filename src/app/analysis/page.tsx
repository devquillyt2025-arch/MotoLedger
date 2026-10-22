import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ColumnChart, Legend, SplitBars, type Column } from "@/components/charts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { analyse } from "@/lib/analysis";
import { SERIES } from "@/lib/chart-colors";
import { FUEL_PRICE_PER_LITRE } from "@/lib/constants";
import { listEntries } from "@/lib/data";
import { num, rupees, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const plural = (n: number, w: string) => `${num(n)} ${w}${n === 1 ? "" : "s"}`;

export default async function AnalysisPage() {
  const a = analyse(await listEntries());

  if (!a.hasData) {
    return (
      <>
        <PageHeader title="Analysis" subtitle="Where your money goes and how often you fill up." />
        <div className="card p-8 text-center text-sm text-zinc-500">Add a few refuels and the charts will appear here.</div>
      </>
    );
  }

  const monthSeries = [SERIES.fuel, SERIES.service, SERIES.accessory];
  const monthColumns: Column[] = a.months.map((m) => ({
    key: m.key,
    x: m.short,
    title: m.long,
    values: [m.fuel, m.service, m.accessory],
    notes: [plural(m.refuels, "refill")],
  }));

  const refillColumns: Column[] = a.refills.map((r) => ({
    key: String(r.seq),
    x: `#${r.seq}`,
    title: `Refuel #${r.seq} · ${shortDate(r.date)}`,
    values: [r.amount],
    notes: [`≈ ${num(r.litres, 1)} L`, r.gapDays != null ? `${plural(r.gapDays, "day")} after previous` : "First refill"],
  }));

  const delta =
    a.thisMonth && a.lastMonth && a.lastMonth.fuel > 0 ? (a.thisMonth.fuel - a.lastMonth.fuel) / a.lastMonth.fuel : null;

  return (
    <>
      <PageHeader title="Analysis" subtitle="Where your money goes and how often you fill up." />

      <section className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <StatCard
          label="Fuel per month"
          value={rupees(Math.round(a.fuelPerMonth))}
          sub={`≈ ${rupees(Math.round(a.fuelPerYear))} a year at this pace`}
          accent="text-emerald-400"
        />
        <StatCard
          label="Refill every"
          value={a.avgGapDays != null ? `${num(a.avgGapDays, 1)} days` : "—"}
          sub={a.daysSinceLastRefill != null ? `Last one ${plural(a.daysSinceLastRefill, "day")} ago` : undefined}
        />
        <StatCard label="Avg refill" value={rupees(Math.round(a.avgRefill))} sub={`≈ ${num(a.litresPerWeek, 1)} L of fuel a week`} />
        <div className="card p-4">
          <p className="label">{a.thisMonth?.label ?? "This month"} fuel</p>
          <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{rupees(a.thisMonth?.fuel ?? 0)}</p>
          {delta != null && a.lastMonth ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
              <span className={`flex items-center font-semibold ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {num(Math.abs(delta) * 100)}%
              </span>
              vs {a.lastMonth.label} ({rupees(a.lastMonth.fuel)})
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500">Month so far</p>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="card min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="label">Monthly spend</h2>
            <Legend series={monthSeries} />
          </div>
          <ColumnChart columns={monthColumns} series={monthSeries} capLabels={monthColumns.length <= 12} />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-200">Show as table</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-right tabular-nums">
                <thead>
                  <tr className="label whitespace-nowrap">
                    <th className="py-1.5 text-left">Month</th>
                    <th className="py-1.5">Fuel</th>
                    <th className="py-1.5">Service</th>
                    <th className="py-1.5">Accessories</th>
                    <th className="py-1.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {a.months.map((m) => (
                    <tr key={m.key}>
                      <td className="py-1.5 text-left text-zinc-300">{m.long}</td>
                      <td className="py-1.5">{rupees(m.fuel)}</td>
                      <td className="py-1.5">{rupees(m.service)}</td>
                      <td className="py-1.5">{rupees(m.accessory)}</td>
                      <td className="py-1.5 font-semibold">{rupees(m.fuel + m.service + m.accessory)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="card p-5">
          <h2 className="label mb-1">Where the money went</h2>
          <p className="mb-4 text-2xl font-bold tabular-nums">{rupees(a.totals.total)}</p>
          <SplitBars rows={a.split as { key: keyof typeof SERIES; amount: number; share: number }[]} />
        </section>

        <section className="card min-w-0 p-5">
          <div className="mb-4">
            <h2 className="label">Refill sizes</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Each refuel in order. Hover or tap a bar for details.</p>
          </div>
          <ColumnChart
            columns={refillColumns}
            series={[SERIES.fuel]}
            refLine={{ value: a.avgRefill, label: `Avg ${rupees(Math.round(a.avgRefill))}` }}
          />
        </section>

        <section className="card p-5">
          <h2 className="label mb-1">Refill rhythm</h2>
          <dl className="divide-y divide-zinc-800">
            {[
              ["Usual refill", a.modeAmount != null ? `${rupees(a.modeAmount)} · ${a.modeCount}×` : "—"],
              ["Shortest gap", a.minGapDays != null ? plural(a.minGapDays, "day") : "—"],
              ["Longest gap", a.maxGapDays != null ? plural(a.maxGapDays, "day") : "—"],
              ["Average gap", a.avgGapDays != null ? `${num(a.avgGapDays, 1)} days` : "—"],
              ["Fuel bought", `≈ ${num(a.totals.fuel / FUEL_PRICE_PER_LITRE, 1)} L`],
              ["Service share", `${num((a.split[1].share ?? 0) * 100, 1)}% of spend`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-sm text-zinc-300">{k}</dt>
                <dd className="text-right font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
