import { AddEntryButton } from "@/components/AddEntry";
import PageHeader from "@/components/PageHeader";
import RefuelTable from "@/components/RefuelTable";
import FuelPriceButton from "@/components/FuelPrice";
import StatCard from "@/components/StatCard";
import { getSummary, listEntries } from "@/lib/data";
import { num, rupees } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RefuelsPage() {
  const [entries, summary] = await Promise.all([listEntries(), getSummary()]);
  const refuels = entries.filter((e) => e.type === "refuel");
  const avg = summary.totalRefuels ? summary.totalFuelSpend / summary.totalRefuels : 0;

  return (
    <>
      <PageHeader title="Refuel Log" subtitle="Every fill-up, with a running total." action={<AddEntryButton type="refuel" />} />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <StatCard label="Total Fuel Spend" value={rupees(summary.totalFuelSpend)} accent="text-emerald-400" />
        <StatCard label="Refuels" value={num(summary.totalRefuels)} />
        <StatCard label="Avg per Refill" value={rupees(avg)} />
        <StatCard label="Est. Fuel" value={`${num(summary.estFuelLitres, 1)} L`} />
      </section>
      <div className="card mb-4 px-4">
        <FuelPriceButton price={summary.fuelPrice} />
      </div>
      <RefuelTable refuels={refuels} fuelPrice={summary.fuelPrice} />
    </>
  );
}
