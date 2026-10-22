import Link from "next/link";
import type { ReminderView } from "@/lib/data";
import { remainingParts, STATUS_STYLES } from "./ReminderBadge";

const ORDER = { overdue: 0, upcoming: 1, ok: 2 } as const;

export default function ReminderBanner({ reminders }: { reminders: ReminderView[] }) {
  const sorted = [...reminders].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const attention = sorted.filter((r) => r.status !== "ok").length;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label">Maintenance</h2>
        <Link href="/reminders" className="text-xs font-medium text-emerald-400">
          {attention ? `${attention} need attention →` : "All good →"}
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {sorted.map((r) => {
          const s = STATUS_STYLES[r.status];
          return (
            <Link key={r.id} href="/reminders" className={`rounded-xl border p-3 ${s.ring}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <span className="text-sm font-semibold">{r.label}</span>
              </div>
              <p className={`mt-1 text-xs ${s.text}`}>{remainingParts(r).join(" · ")}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
