import type { ReminderStatus, ReminderView } from "@/lib/data";
import { num } from "@/lib/format";

export const STATUS_STYLES: Record<ReminderStatus, { ring: string; text: string; dot: string; label: string }> = {
  overdue: { ring: "border-red-500/40 bg-red-500/10", text: "text-red-400", dot: "bg-red-500", label: "Overdue" },
  upcoming: { ring: "border-amber-500/40 bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400", label: "Due soon" },
  ok: { ring: "border-emerald-500/30 bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-500", label: "OK" },
};

const plural = (n: number, unit: string) => `${num(Math.abs(n))} ${unit}${Math.abs(n) === 1 ? "" : "s"}`;

/** e.g. ["4 days left", "120 km left"] or ["2 days overdue"]. */
export function remainingParts(r: ReminderView) {
  const parts: string[] = [];
  if (r.daysLeft != null) {
    parts.push(
      r.daysLeft < 0 ? `${plural(r.daysLeft, "day")} overdue` : r.daysLeft === 0 ? "due today" : `${plural(r.daysLeft, "day")} left`,
    );
  }
  if (r.kmLeft != null) {
    parts.push(r.kmLeft < 0 ? `${num(-r.kmLeft)} km overdue` : `${num(r.kmLeft)} km left`);
  } else if (r.intervalKm != null) {
    parts.push("log odometer for km");
  }
  return parts;
}
