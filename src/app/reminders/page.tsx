import { OdometerButton } from "@/components/Odometer";
import PageHeader from "@/components/PageHeader";
import ReminderCard from "@/components/ReminderCard";
import { getReminders } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const { reminders, currentOdometer } = await getReminders();

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Maintenance intervals from the Dominar 400 owner's manual."
        action={<OdometerButton className="btn-ghost" />}
      />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {reminders.map((r) => (
          <ReminderCard key={r.id} reminder={r} currentOdometer={currentOdometer} />
        ))}
      </div>
    </>
  );
}
