import { OdometerButton } from "@/components/Odometer";
import PageHeader from "@/components/PageHeader";
import ReminderCard from "@/components/ReminderCard";
import { reminderHint } from "@/lib/bike-specs";
import { getReminders } from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";
import { documentExpiries } from "@/lib/ownership";
import { expiryText } from "@/components/OwnershipCard";
import { shortDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const [{ reminders, currentOdometer }, profile] = await Promise.all([getReminders(), getCurrentProfile()]);
  const isDominar = /dominar/i.test(profile.bike);
  const docs = documentExpiries(profile.ownership);

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle={isDominar ? "Maintenance intervals from the Dominar 400 owner's manual." : `Maintenance for your ${profile.bike}.`}
        action={<OdometerButton className="btn-ghost" />}
      />
      {docs.length > 0 && (
        <section className="mb-4">
          <h2 className="label mb-2 px-1">Documents</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {docs.map((d) => (
              <Link
                key={d.key}
                href="/bike"
                className={`rounded-2xl border p-4 ${
                  d.status === "expired"
                    ? "border-red-500/40 bg-red-500/10"
                    : d.status === "soon"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-emerald-500/30 bg-emerald-500/5"
                }`}
              >
                <p className="font-semibold">{d.label}</p>
                <p
                  className={`text-sm font-semibold ${
                    d.status === "expired" ? "text-red-400" : d.status === "soon" ? "text-amber-300" : "text-emerald-400"
                  }`}
                >
                  {expiryText(d.daysLeft)}
                </p>
                <p className="text-xs text-zinc-500">Renew by {shortDate(d.date)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

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
