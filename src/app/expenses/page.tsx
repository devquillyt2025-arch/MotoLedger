import { AddEntryButton } from "@/components/AddEntry";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EntryRow from "@/components/EntryRow";
import { editable, getSummary, listEntries } from "@/lib/data";
import { rupees, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [entries, summary] = await Promise.all([listEntries(), getSummary()]);
  const rows = entries.filter((e) => e.type !== "refuel").reverse();
  const serviceSpend = summary.totalBikeSpend - summary.totalFuelSpend;

  return (
    <>
      <PageHeader title="Service & Parts" subtitle="Servicing, repairs and accessories." action={<AddEntryButton type="service" />} />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <StatCard label="Service Spend" value={rupees(serviceSpend)} accent="text-emerald-400" />
        <StatCard label="Accessories" value={rupees(summary.accessorySpend)} />
        <StatCard label="1st Service Cost" value={summary.firstServiceCost ? rupees(summary.firstServiceCost) : "—"} />
        <StatCard label="Entries" value={String(rows.length)} />
      </section>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-zinc-500">No service or accessory entries yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-zinc-900 text-left">
                <tr className="label whitespace-nowrap">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Odometer</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                  <th className="w-12 px-2 py-3"><span className="sr-only">Delete</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((e) => (
                  <EntryRow key={e.id} entry={editable(e)}>
                    <td className="whitespace-nowrap px-4 py-3">{shortDate(e.date)}</td>
                    <td className="px-4 py-3">{e.type === "service" ? "🔧 Service" : "🪖 Accessory"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-400">{e.odometer != null ? `${e.odometer.toLocaleString("en-IN")} km` : "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{e.notes ?? ""}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{rupees(e.amount)}</td>
              </EntryRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
