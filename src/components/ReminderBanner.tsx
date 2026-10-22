import Link from "next/link";
import type { ReminderView } from "@/lib/data";
import { remainingParts, STATUS_STYLES } from "./ReminderBadge";

const ORDER = { overdue: 0, upcoming: 1, ok: 2 } as const;

export default function ReminderBanner({ reminders }: { reminders: ReminderView[] }) {
  const sorted = [...reminders].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const attention = sorted.filter((r) => r.status !== "ok").length;

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label">Maintenance</h2>
        <Link href="/reminders" className="text-xs font-medium text-emerald-400">
          {attention ? `${attention} need attention →` : "All good →"}
        </Link>
      </div>
      <div className="space-y-2">
        {sorted.map((r) => {
          const s = STATUS_STYLES[r.status];
          return (
            <Link key={r.id} href="/reminders" className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${s.ring}`}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <span className="text-sm font-semibold">{r.label}</span>
              </span>
              <span className={`text-right text-xs ${s.text}`}>{remainingParts(r).join(" · ")}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
