import { FUEL_PRICE_PER_LITRE } from "./constants";
import type { EntryRow } from "./data";
import { todayIST } from "./format";

const DAY_MS = 86_400_000;
const toUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type MonthRow = {
  key: string; // "2026-09"
  short: string; // "Sep"
  long: string; // "Sep 2026"
  fuel: number;
  service: number;
  accessory: number;
  refuels: number;
};

export type RefillPoint = { seq: number; date: string; amount: number; litres: number; gapDays: number | null };

/** Everything the Analysis page shows, derived from the entry list in one pass. */
export function analyse(entries: EntryRow[], today = todayIST()) {
  const refuels = entries.filter((e) => e.type === "refuel");
  const sum = (type: string) => entries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
  const fuel = sum("refuel");
  const service = sum("service");
  const accessory = sum("accessory");
  const total = fuel + service + accessory;

  // Calendar months from the first entry to this month, including empty ones.
  const months: MonthRow[] = [];
  if (entries.length) {
    let [y, m] = entries[0].date.split("-").map(Number);
    const lastDate = entries.reduce((m, e) => (e.date > m ? e.date : m), today);
    const [ty, tm] = lastDate.split("-").map(Number);
    while (y < ty || (y === ty && m <= tm)) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const inMonth = entries.filter((e) => e.date.startsWith(key));
      const by = (t: string) => inMonth.filter((e) => e.type === t).reduce((s, e) => s + e.amount, 0);
      months.push({
        key,
        short: MONTHS[m - 1],
        long: `${MONTHS[m - 1]} ${y}`,
        fuel: by("refuel"),
        service: by("service"),
        accessory: by("accessory"),
        refuels: inMonth.filter((e) => e.type === "refuel").length,
      });
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
  }

  const refills: RefillPoint[] = refuels.map((r, i) => ({
    seq: r.seq,
    date: r.date,
    amount: r.amount,
    litres: r.amount / FUEL_PRICE_PER_LITRE,
    gapDays: i > 0 ? daysBetween(refuels[i - 1].date, r.date) : null,
  }));
  const gaps = refills.flatMap((r) => (r.gapDays != null ? [r.gapDays] : []));

  // Spend rate from the first refuel up to today, so a quiet stretch lowers it honestly.
  const trackedDays = refuels.length ? Math.max(1, daysBetween(refuels[0].date, today) + 1) : 0;
  const fuelPerDay = trackedDays ? fuel / trackedDays : 0;

  // Most common refill amount (ties → the larger count first, then the bigger amount).
  const counts = new Map<number, number>();
  for (const r of refuels) counts.set(r.amount, (counts.get(r.amount) ?? 0) + 1);
  const [modeAmount, modeCount] = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0] ?? [null, 0];

  const thisMonth = months.at(-1);
  const lastMonth = months.at(-2);

  return {
    hasData: refuels.length > 0,
    totals: { fuel, service, accessory, total },
    split: [
      { key: "fuel", label: "Fuel", amount: fuel },
      { key: "service", label: "Service", amount: service },
      { key: "accessory", label: "Accessories", amount: accessory },
    ].map((s) => ({ ...s, share: total ? s.amount / total : 0 })),
    months,
    refills,
    avgRefill: refuels.length ? fuel / refuels.length : 0,
    avgGapDays: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    minGapDays: gaps.length ? Math.min(...gaps) : null,
    maxGapDays: gaps.length ? Math.max(...gaps) : null,
    daysSinceLastRefill: refuels.length ? daysBetween(refuels[refuels.length - 1].date, today) : null,
    fuelPerMonth: fuelPerDay * 30.44,
    fuelPerYear: fuelPerDay * 365,
    litresPerWeek: (fuelPerDay * 7) / FUEL_PRICE_PER_LITRE,
    modeAmount,
    modeCount,
    thisMonth: thisMonth ? { label: thisMonth.long, fuel: thisMonth.fuel } : null,
    lastMonth: lastMonth ? { label: lastMonth.long, fuel: lastMonth.fuel } : null,
  };
}

export type Analysis = ReturnType<typeof analyse>;
