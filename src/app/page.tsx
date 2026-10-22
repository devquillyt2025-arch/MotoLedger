import { Gauge } from "lucide-react";
import Link from "next/link";
import { AddEntryButton } from "@/components/AddEntry";
import { OdometerButton } from "@/components/Odometer";
import PageHeader from "@/components/PageHeader";
import RefuelTable from "@/components/RefuelTable";
import ReminderBanner from "@/components/ReminderBanner";
import StatCard from "@/components/StatCard";
import { getReminders, getSummary, listEntries } from "@/lib/data";
import { FUEL_PRICE_PER_LITRE } from "@/lib/constants";
import { num, rupees, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const RECENT = 10;

export default async function Dashboard() {
  const [summary, entries, { reminders }] = await Promise.all([getSummary(), listEntries(), getReminders()]);
  const refuels = entries.filter((e) => e.type === "refuel");
  const dash = "—";

  const insights: [string, string, string?][] = [
    ["Lowest Refill", summary.lowestRefill != null ? rupees(summary.lowestRefill) : dash],
    ["Highest Refill", summary.highestRefill != null ? rupees(summary.highestRefill) : dash],
    [
      "Latest Refill",
      summary.latestRefill ? rupees(summary.latestRefill.amount) : dash,
      summary.latestRefill ? shortDate(summary.latestRefill.date) : undefined,
    ],
    ["Est. Fuel", `${num(summary.estFuelLitres, 1)} L`, `@ ₹${FUEL_PRICE_PER_LITRE}/L`],
    ["Mileage", summary.mileageKmpl ? `${num(summary.mileageKmpl, 1)} km/L` : dash, summary.mileageKmpl ? undefined : "needs 2+ odometer readings"],
    ["Accessories", rupees(summary.accessorySpend)],
    ["Total Entries", num(summary.totalEntries)],
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Fuel, service and upkeep at a glance." action={<AddEntryButton />} />

      <OdometerButton className="card mb-3 flex w-full items-center gap-3 p-4 text-left transition hover:border-zinc-700 active:bg-zinc-800/60 lg:mb-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Gauge className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="label block">Odometer</span>
          <span className="block text-xl font-bold tabular-nums">
            {summary.currentOdometer != null ? `${num(summary.currentOdometer)} km` : "Not logged yet"}
          </span>
        </span>
        <span className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950">
          {summary.currentOdometer != null ? "Update" : "Log now"}
        </span>
      </OdometerButton>

      <section className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <StatCard label="Total Fuel Spend" value={rupees(summary.totalFuelSpend)} accent="text-emerald-400" />
        <StatCard label="Total Bike Spend" value={rupees(summary.totalBikeSpend)} sub="fuel + service + accessories" />
        <StatCard label="Total Refuels" value={num(summary.totalRefuels)} />
        <StatCard label="1st Service Cost" value={summary.firstServiceCost ? rupees(summary.firstServiceCost) : dash} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="order-last lg:order-none">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="label">Recent Refuels</h2>
            {refuels.length > RECENT && (
              <Link href="/refuels" className="text-xs font-medium text-emerald-400">
                View all {refuels.length} →
              </Link>
            )}
          </div>
          <RefuelTable refuels={refuels.slice(-RECENT)} />
        </section>

        <aside className="space-y-4">
          <ReminderBanner reminders={reminders} />
          <section className="card p-5">
            <h2 className="label mb-1">Quick Insights</h2>
            <dl className="divide-y divide-zinc-800">
              {insights.map(([label, value, sub]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-sm text-zinc-300">{label}</dt>
                  <dd className="text-right">
                    <span className="font-semibold tabular-nums">{value}</span>
                    {sub && <span className="block text-[11px] text-zinc-500">{sub}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
