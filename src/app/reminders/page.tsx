import ReminderCard from "@/components/ReminderCard";
import { getReminders } from "@/lib/data";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const { reminders, currentOdometer } = await getReminders();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <h1 className="text-xl font-bold">Reminders</h1>
        <p className="text-xs text-zinc-500">
          Odometer: <span className="font-semibold text-zinc-300">{currentOdometer != null ? `${num(currentOdometer)} km` : "not logged"}</span>
        </p>
      </div>
      {reminders.map((r) => (
        <ReminderCard key={r.id} reminder={r} currentOdometer={currentOdometer} />
      ))}
    </div>
  );
}
