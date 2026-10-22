import { OdometerButton } from "@/components/Odometer";
import PageHeader from "@/components/PageHeader";
import ReminderCard from "@/components/ReminderCard";
import { reminderHint } from "@/lib/bike-specs";
import { getReminders } from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const [{ reminders, currentOdometer }, profile] = await Promise.all([getReminders(), getCurrentProfile()]);
  const isDominar = /dominar/i.test(profile.bike);

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle={isDominar ? "Maintenance intervals from the Dominar 400 owner's manual." : `Maintenance for your ${profile.bike}.`}
        action={<OdometerButton className="btn-ghost" />}
      />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {reminders.map((r) => (
          <ReminderCard
            key={r.id}
            reminder={r}
            currentOdometer={currentOdometer}
            hint={reminderHint(r.type, profile.bike, profile.specs)}
          />
        ))}
      </div>
    </>
  );
}
