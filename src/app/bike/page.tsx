import { CheckCircle2, Circle, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  BIKE_NAME,
  DAILY_CHECKS,
  FREE_SERVICES,
  freeServiceNumber,
  HELPLINE,
  MAJOR_ITEMS,
  PAID_SERVICE_RULE,
  RUNNING_IN,
  SPECS,
  WARRANTY,
} from "@/lib/bike";
import { getCurrentOdometer, listEntries } from "@/lib/data";
import { num, rupees, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BikePage() {
  const [entries, odometer] = await Promise.all([listEntries(), getCurrentOdometer()]);
  const services = entries.filter((e) => e.type === "service");
  const doneFree = new Map(
    services.flatMap((e) => {
      const n = freeServiceNumber(e.category);
      return n ? [[n, e] as const] : [];
    }),
  );
  const nextFree = FREE_SERVICES.find((s) => !doneFree.has(s.n));
  const runningIn = odometer == null || odometer < RUNNING_IN.limitKm;

  return (
    <>
      <PageHeader title="Bike Info" subtitle={`${BIKE_NAME} — specs, service plan and checks from the owner's manual.`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          {/* Service plan */}
          <section className="card p-5">
            <h2 className="label mb-3">Service Plan</h2>
            <ol className="space-y-2">
              {FREE_SERVICES.map((s) => {
                const done = doneFree.get(s.n);
                const isNext = nextFree?.n === s.n;
                return (
                  <li
                    key={s.n}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      done
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : isNext
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-zinc-800"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className={`h-5 w-5 shrink-0 ${isNext ? "text-amber-300" : "text-zinc-600"}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {s.label} {isNext && <span className="ml-1 text-xs font-medium text-amber-300">Next</span>}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {s.km} or {s.days} from purchase, whichever first
                      </p>
                    </div>
                    {done && (
                      <div className="text-right text-xs">
                        <p className="font-semibold text-emerald-400">Done {shortDate(done.date)}</p>
                        <p className="text-zinc-500">{rupees(done.amount)}</p>
                      </div>
                    )}
                  </li>
                );
              })}
              <li className="flex items-center gap-3 rounded-xl border border-zinc-800 px-4 py-3">
                <Circle className="h-5 w-5 shrink-0 text-zinc-600" />
                <div>
                  <p className="font-semibold">Paid Services</p>
                  <p className="text-xs text-zinc-400">{PAID_SERVICE_RULE}</p>
                </div>
              </li>
            </ol>
            <p className="mt-3 text-xs text-zinc-500">
              Log a service with category &ldquo;1st / 2nd / 3rd Service&rdquo; and it&apos;s ticked off here. Missing a
              free or paid service on time voids the warranty.
            </p>
          </section>

          {/* Major items */}
          <section className="card overflow-hidden">
            <h2 className="label px-5 pt-5">Major Replacements by km</h2>
            <dl className="mt-2 divide-y divide-zinc-800">
              {MAJOR_ITEMS.map(([item, rule]) => (
                <div key={item} className="flex flex-col gap-0.5 px-5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <dt className="text-sm font-medium">{item}</dt>
                  <dd className="text-sm text-zinc-400 sm:text-right">{rule}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Specs */}
          <section className="grid gap-4 md:grid-cols-2">
            {SPECS.map((g) => (
              <div key={g.group} className="card p-5">
                <h2 className="label mb-1">{g.group}</h2>
                <dl className="divide-y divide-zinc-800">
                  {g.items.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="text-sm text-zinc-400">{k}</dt>
                      <dd className="text-right text-sm font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          {runningIn && (
            <section className="card border-amber-500/30 p-5">
              <h2 className="label mb-1 text-amber-300">Running-in · first 2,000 km</h2>
              <p className="mb-3 text-xs text-zinc-400">
                Max speed (km/h) per gear.{" "}
                {odometer != null ? `You're at ${num(odometer)} km.` : "Log your odometer to track this."}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-sm tabular-nums">
                  <thead>
                    <tr className="label">
                      <th className="py-1 text-left">km</th>
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <th key={g} className="py-1">
                          {g}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RUNNING_IN.rows.map((r) => (
                      <tr key={r.range} className="border-t border-zinc-800">
                        <td className="whitespace-nowrap py-1.5 text-left text-xs text-zinc-400">{r.range}</td>
                        {r.speeds.map((s, i) => (
                          <td key={i} className="py-1.5 font-semibold">
                            {s}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="card p-5">
            <h2 className="label mb-2">Daily Checks</h2>
            <ul className="space-y-2">
              {DAILY_CHECKS.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-zinc-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="label mb-2">Warranty</h2>
            <dl className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">Bike</dt>
                <dd className="text-right font-semibold">{WARRANTY.vehicle}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">Battery</dt>
                <dd className="text-right font-semibold">{WARRANTY.battery}</dd>
              </div>
            </dl>
            <p className="mb-1 text-xs text-zinc-500">To keep it valid:</p>
            <ul className="space-y-1 text-xs text-zinc-400">
              {WARRANTY.conditions.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="label mb-2">Bajaj Helpline</h2>
            <a href={`tel:${HELPLINE.phone}`} className="btn-ghost w-full">
              <Phone className="h-4 w-4" /> {HELPLINE.phone}
            </a>
            <p className="mt-2 text-center text-xs text-zinc-500">
              {HELPLINE.hours} · {HELPLINE.email}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
