import { editable, type EntryRow } from "@/lib/data";
import { FUEL_PRICE_PER_LITRE } from "@/lib/constants";
import { rupees, shortDate } from "@/lib/format";
import EntryActions from "./EntryActions";

/** Refuel log, newest first. Running totals come from the server (oldest-first window sum). */
export default function RefuelTable({ refuels }: { refuels: EntryRow[] }) {
  if (!refuels.length) {
    return (
      <div className="card p-8 text-center text-sm text-zinc-500">
        No refuels yet. Tap <span className="font-semibold text-emerald-400">+ Add</span> at the pump.
      </div>
    );
  }

  const rows = [...refuels].reverse();
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-zinc-900 text-left">
            <tr className="label whitespace-nowrap">
              <th className="px-3 py-2.5">Refuel #</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5 text-right">Amount (₹)</th>
              <th className="px-3 py-2.5 text-right">Running Total (₹)</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5">Notes</th>
              <th className="w-20 px-3 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-800/40">
                <td className="px-3 py-2.5 font-semibold text-zinc-400">#{r.seq}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{shortDate(r.date)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className="font-semibold">{rupees(r.amount)}</span>
                  <span className="block text-[11px] text-zinc-500">≈ {(r.amount / FUEL_PRICE_PER_LITRE).toFixed(1)} L</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-400">{rupees(r.runningTotal)}</td>
                <td className="px-3 py-2.5">
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{r.category}</span>
                </td>
                <td className="px-3 py-2.5 text-zinc-400">
                  {r.notes ?? ""}
                  {r.odometer != null && <span className="block text-xs text-zinc-600">{r.odometer.toLocaleString("en-IN")} km</span>}
                </td>
                <td className="px-2 py-1.5">
                  <EntryActions entry={editable(r)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
