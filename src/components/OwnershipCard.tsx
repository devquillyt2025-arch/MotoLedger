import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import type { Ownership } from "@/db/schema";
import { num, rupees, shortDate } from "@/lib/format";
import { documentExpiries, OWNERSHIP_GROUPS, ownershipCost, type ExpiryStatus } from "@/lib/ownership";
import OwnershipEditor from "./OwnershipEditor";

const STATUS: Record<ExpiryStatus, { box: string; text: string }> = {
  expired: { box: "border-red-500/40 bg-red-500/10", text: "text-red-400" },
  soon: { box: "border-amber-500/40 bg-amber-500/10", text: "text-amber-300" },
  ok: { box: "border-emerald-500/30 bg-emerald-500/5", text: "text-emerald-400" },
};

export const expiryText = (d: number) =>
  d < 0 ? `Expired ${num(-d)} day${d === -1 ? "" : "s"} ago` : d === 0 ? "Expires today" : `${num(d)} day${d === 1 ? "" : "s"} left`;

/** Purchase / RTO / insurance block on Bike Info, with renewal countdowns. Same for every bike. */
export default function OwnershipCard({ ownership, spend }: { ownership: Ownership | null; spend: number }) {
  const expiries = documentExpiries(ownership);
  const { purchase, insurance } = ownershipCost(ownership);
  const filled = OWNERSHIP_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => ownership?.[f.key]) })).filter(
    (g) => g.fields.length,
  );
  const show = (kind: string, v: string) => (kind === "money" ? rupees(Number(v)) : kind === "date" ? shortDate(v) : v);

  if (!filled.length) {
    return (
      <section className="card flex flex-col items-center p-6 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <FileText className="h-5 w-5" />
        </span>
        <h2 className="mt-3 font-bold">Purchase, RTO &amp; insurance</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          Add the bike price, registration and insurance policy — you&apos;ll get a countdown before insurance and PUC expire.
        </p>
        <OwnershipEditor ownership={ownership} label="Add details" className="btn-primary mt-4" />
      </section>
    );
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label">Purchase, RTO &amp; insurance</h2>
        <OwnershipEditor ownership={ownership} className="btn-ghost px-3 py-1.5 text-xs" />
      </div>

      {expiries.length > 0 && (
        <ul className="mb-4 grid gap-2 sm:grid-cols-3">
          {expiries.map((e) => (
            <li key={e.key} className={`rounded-xl border px-3 py-2.5 ${STATUS[e.status].box}`}>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {e.status === "ok" ? (
                  <CheckCircle2 className={`h-4 w-4 ${STATUS.ok.text}`} />
                ) : (
                  <AlertTriangle className={`h-4 w-4 ${STATUS[e.status].text}`} />
                )}
                {e.label}
              </p>
              <p className={`text-xs ${STATUS[e.status].text}`}>{expiryText(e.daysLeft)}</p>
              <p className="text-[11px] text-zinc-500">{shortDate(e.date)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-x-6 md:grid-cols-3">
        {filled.map((g) => (
          <dl key={g.group} className="mb-3">
            <dt className="label mb-1 text-zinc-500">{g.group}</dt>
            {g.fields.map((f) => (
              <div key={f.key} className="flex items-baseline justify-between gap-3 border-b border-zinc-800 py-1.5 text-sm">
                <span className="text-zinc-400">{f.label}</span>
                <span className="text-right font-semibold">{show(f.kind, ownership![f.key]!)}</span>
              </div>
            ))}
          </dl>
        ))}
      </div>

      {purchase > 0 && (
        <div className="mt-2 rounded-xl bg-zinc-800/50 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-zinc-300">Total cost of ownership</span>
            <span className="text-lg font-bold tabular-nums">{rupees(purchase + insurance + spend)}</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {rupees(purchase)} purchase{insurance > 0 && ` + ${rupees(insurance)} insurance`} + {rupees(spend)} logged in Moto Ledger
          </p>
        </div>
      )}

      {ownership?.notes && <p className="mt-3 whitespace-pre-line text-sm text-zinc-400">{ownership.notes}</p>}
    </section>
  );
}
