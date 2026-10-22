"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import type { ReminderView } from "@/lib/data";
import { num, shortDate, todayIST } from "@/lib/format";
import { remainingParts, STATUS_STYLES } from "./ReminderBadge";

export default function ReminderCard({
  reminder: r,
  currentOdometer,
}: {
  reminder: ReminderView;
  currentOdometer: number | null;
}) {
  const router = useRouter();
  const s = STATUS_STYLES[r.status];
  const [mode, setMode] = useState<"view" | "done" | "edit">("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(url: string, body: object) {
    setBusy(true);
    setError(null);
    const err = await sendJson(url, "PATCH", body);
    setBusy(false);
    if (err) return setError(err);
    setMode("view");
    router.refresh();
  }

  function onMarkDone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const odo = f.get("odometer");
    send(`/api/reminders/${r.id}/mark-done`, { date: f.get("date"), odometer: odo === "" ? null : odo });
  }

  function onEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    send(`/api/reminders/${r.id}`, { intervalKm: f.get("intervalKm"), intervalDays: f.get("intervalDays") });
  }

  const every = [r.intervalKm != null && `${num(r.intervalKm)} km`, r.intervalDays != null && `${r.intervalDays} days`]
    .filter(Boolean)
    .join(" or ");

  return (
    <section className={`rounded-2xl border p-4 ${s.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
            <h2 className="text-base font-bold">{r.label}</h2>
            <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">Every {every || "— (no interval set)"}</p>
        </div>
        <p className={`text-right text-sm font-semibold ${s.text}`}>
          {remainingParts(r).map((p) => (
            <span key={p} className="block">
              {p}
            </span>
          ))}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="label">Last done</dt>
          <dd>
            {shortDate(r.lastDoneDate)}
            {r.lastDoneOdometer != null && <span className="block text-xs text-zinc-500">{num(r.lastDoneOdometer)} km</span>}
          </dd>
        </div>
        <div>
          <dt className="label">Next due</dt>
          <dd>
            {r.nextDueDate ? shortDate(r.nextDueDate) : "—"}
            {r.nextDueOdometer != null && <span className="block text-xs text-zinc-500">{num(r.nextDueOdometer)} km</span>}
          </dd>
        </div>
      </dl>

      {mode === "view" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => setMode("done")}>
            ✓ Mark Done
          </button>
          <button className="btn-ghost" onClick={() => setMode("edit")}>
            Edit interval
          </button>
        </div>
      )}

      {mode === "done" && (
        <form onSubmit={onMarkDone} className="mt-4 grid grid-cols-2 gap-2">
          <label>
            <span className="label">Date</span>
            <input name="date" type="date" defaultValue={todayIST()} required className="input mt-1" />
          </label>
          <label>
            <span className="label">Odometer</span>
            <input name="odometer" type="number" inputMode="numeric" min="0" step="1" defaultValue={currentOdometer ?? ""} className="input mt-1" />
          </label>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Confirm"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setMode("view")}>
            Cancel
          </button>
        </form>
      )}

      {mode === "edit" && (
        <form onSubmit={onEdit} className="mt-4 grid grid-cols-2 gap-2">
          <label>
            <span className="label">Every (km)</span>
            <input name="intervalKm" type="number" inputMode="numeric" min="1" step="1" defaultValue={r.intervalKm ?? ""} placeholder="none" className="input mt-1" />
          </label>
          <label>
            <span className="label">Every (days)</span>
            <input name="intervalDays" type="number" inputMode="numeric" min="1" step="1" defaultValue={r.intervalDays ?? ""} placeholder="none" className="input mt-1" />
          </label>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setMode("view")}>
            Cancel
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
