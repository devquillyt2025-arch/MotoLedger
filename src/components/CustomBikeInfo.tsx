import { BookOpen, Wrench } from "lucide-react";
import Link from "next/link";
import type { BikeSpecs } from "@/db/schema";
import { SPEC_GROUPS } from "@/lib/bike-specs";
import type { EntryRow } from "@/lib/data";
import { num, rupees, shortDate } from "@/lib/format";
import BikeSpecsEditor from "./BikeSpecsEditor";
import PageHeader from "./PageHeader";

/** Bike Info for a profile whose bike has no built-in manual: the rider's own details + this bike's history. */
export default function CustomBikeInfo({
  bike,
  specs,
  entries,
  odometer,
}: {
  bike: string;
  specs: BikeSpecs | null;
  entries: EntryRow[];
  odometer: number | null;
}) {
  const services = entries.filter((e) => e.type !== "refuel").reverse();
  const filled = SPEC_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => specs?.[f.key]) })).filter((g) => g.fields.length);
  const unit = (key: string, v: string) => (key === "tankLitres" && /^[\d.]+$/.test(v) ? `${v} L` : v);

  return (
    <>
      <PageHeader title="Bike Info" subtitle={`${bike} — your specs and service history.`} action={<BikeSpecsEditor bike={bike} specs={specs} />} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          {filled.length === 0 ? (
            <section className="card flex flex-col items-center p-8 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <BookOpen className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-lg font-bold">Add your {bike}&apos;s details</h2>
              <p className="mt-1 max-w-sm text-sm text-zinc-400">
                Tank size, tyre pressures, oil grade, service interval — copy them from the owner&apos;s manual and they&apos;ll live
                here for this profile.
              </p>
              <BikeSpecsEditor bike={bike} specs={specs} label="Add details" className="btn-primary mt-4" />
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                {filled.map((g) => (
                  <div key={g.group} className="card p-5">
                    <h2 className="label mb-1">{g.group}</h2>
                    <dl className="divide-y divide-zinc-800">
                      {g.fields.map((f) => (
                        <div key={f.key} className="flex items-baseline justify-between gap-3 py-2">
                          <dt className="text-sm text-zinc-400">{f.label.replace(" (L)", "")}</dt>
                          <dd className="text-right text-sm font-semibold">{unit(f.key, specs![f.key]!)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </section>
              {specs?.notes && (
                <section className="card p-5">
                  <h2 className="label mb-2">Notes</h2>
                  <p className="whitespace-pre-line text-sm text-zinc-300">{specs.notes}</p>
                </section>
              )}
              {/* Phones: the header action is hidden, so editing lives here too. */}
              <BikeSpecsEditor bike={bike} specs={specs} className="btn-ghost w-full lg:hidden" />
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="card p-5">
            <h2 className="label mb-1">Odometer</h2>
            <p className="text-2xl font-bold tabular-nums">{odometer != null ? `${num(odometer)} km` : "Not logged"}</p>
          </section>

          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="label">Service history</h2>
              <Link href="/expenses" className="text-xs font-medium text-emerald-400">
                All →
              </Link>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500">No services logged for this bike yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {services.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Wrench className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.category}</span>
                      <span className="block text-xs text-zinc-500">
                        {shortDate(e.date)}
                        {e.odometer != null && ` · ${num(e.odometer)} km`}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{rupees(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5 text-sm text-zinc-400">
            Set this bike&apos;s own service and chain-lube intervals on the{" "}
            <Link href="/reminders" className="font-medium text-emerald-400">
              Reminders
            </Link>{" "}
            tab — new profiles start with general defaults.
          </section>
        </aside>
      </div>
    </>
  );
}
