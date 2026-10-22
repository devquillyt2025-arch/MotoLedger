import AddEntry from "@/components/AddEntry";
import RefuelTable from "@/components/RefuelTable";
import ReminderBanner from "@/components/ReminderBanner";
import StatCard from "@/components/StatCard";
import { getReminders, getSummary, listEntries } from "@/lib/data";
import { FUEL_PRICE_PER_LITRE } from "@/lib/constants";
import { num, rupees, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [summary, entries, { reminders }] = await Promise.all([getSummary(), listEntries(), getReminders()]);
  const refuels = entries.filter((e) => e.type === "refuel");
  const others = entries.filter((e) => e.type !== "refuel").reverse();
  const count = (t: string) => entries.filter((e) => e.type === t).length;
  const dash = "—";

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Fuel Spend" value={rupees(summary.totalFuelSpend)} accent="text-emerald-400" />
        <StatCard
          label="Total Bike Spend"
          value={rupees(summary.totalBikeSpend)}
          sub={summary.accessorySpend ? `+ ${rupees(summary.accessorySpend)} accessories` : "fuel + service"}
        />
        <StatCard label="Total Refuels" value={num(summary.totalRefuels)} />
        <StatCard label="1st Service Cost" value={summary.firstServiceCost ? rupees(summary.firstServiceCost) : dash} />
      </section>

      <section className="card -mx-4 flex gap-0 overflow-x-auto rounded-none border-x-0 sm:mx-0 sm:rounded-2xl sm:border-x">
        {[
          ["Lowest Refill", summary.lowestRefill != null ? rupees(summary.lowestRefill) : dash],
          ["Highest Refill", summary.highestRefill != null ? rupees(summary.highestRefill) : dash],
          [
            "Latest Refill",
            summary.latestRefill ? rupees(summary.latestRefill.amount) : dash,
            summary.latestRefill ? shortDate(summary.latestRefill.date) : undefined,
          ],
          ["Est. Fuel", `${num(summary.estFuelLitres, 1)} L`, `@ ₹${FUEL_PRICE_PER_LITRE}/L`],
          ["Mileage", summary.mileageKmpl ? `${num(summary.mileageKmpl, 1)} km/L` : dash, summary.mileageKmpl ? "from odometer" : "needs 2+ odo readings"],
          ["Total Entries", num(summary.totalEntries)],
        ].map(([label, value, sub]) => (
          <div key={label} className="min-w-[8.5rem] flex-1 border-r border-zinc-800 px-4 py-3 last:border-r-0">
            <p className="label whitespace-nowrap">{label}</p>
            <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
            {sub && <p className="whitespace-nowrap text-[11px] text-zinc-500">{sub}</p>}
          </div>
        ))}
      </section>

      <ReminderBanner reminders={reminders} />

      <section>
        <h2 className="label mb-2 px-1">Refuel Log</h2>
        <RefuelTable refuels={refuels} />
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="label mb-2 px-1">Service &amp; Accessories</h2>
          <ul className="card divide-y divide-zinc-800">
            {others.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {e.type === "service" ? "🔧" : "🪖"} {e.category}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {shortDate(e.date)}
                    {e.odometer != null && ` · ${e.odometer.toLocaleString("en-IN")} km`}
                    {e.notes && ` · ${e.notes}`}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{rupees(e.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AddEntry
        nextSeq={{ refuel: count("refuel") + 1, service: count("service") + 1, accessory: count("accessory") + 1 }}
        lastOdometer={summary.currentOdometer}
      />
    </div>
  );
}
