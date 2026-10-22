"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import type { ReminderView } from "@/lib/data";
import { num, shortDate, todayIST } from "@/lib/format";
import { ConfirmDialog, Modal } from "./Modal";
import { OdometerButton } from "./Odometer";
import { remainingParts, STATUS_STYLES } from "./ReminderBadge";

type Intervals = { intervalKm: string; intervalDays: string };

export default function ReminderCard({
  reminder: r,
  currentOdometer,
  hint,
}: {
  reminder: ReminderView;
  currentOdometer: number | null;
  hint?: string | null;
}) {
  const router = useRouter();
  const s = STATUS_STYLES[r.status];
  const [mode, setMode] = useState<"view" | "done" | "edit">("view");
  // Interval edit that clears an existing interval — held here until the user confirms the removal.
  const [pendingClear, setPendingClear] = useState<Intervals | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(m: "done" | "edit") {
    setError(null);
    setMode(m);
  }

  function close() {
    if (busy) return;
    setMode("view");
    setPendingClear(null);
  }

  async function send(url: string, body: object) {
    setBusy(true);
    setError(null);
    const err = await sendJson(url, "PATCH", body);
    setBusy(false);
    if (err) return setError(err);
    setPendingClear(null);
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
    const next: Intervals = { intervalKm: String(f.get("intervalKm") ?? ""), intervalDays: String(f.get("intervalDays") ?? "") };
    const clearsKm = r.intervalKm != null && next.intervalKm === "";
    const clearsDays = r.intervalDays != null && next.intervalDays === "";
    if (clearsKm || clearsDays) return setPendingClear(next);
    send(`/api/reminders/${r.id}`, next);
  }

  const every = [r.intervalKm != null && `${num(r.intervalKm)} km`, r.intervalDays != null && `${r.intervalDays} days`]
    .filter(Boolean)
    .join(" or ");

  const removed = pendingClear
    ? [
        r.intervalKm != null && pendingClear.intervalKm === "" && `every ${num(r.intervalKm)} km`,
        r.intervalDays != null && pendingClear.intervalDays === "" && `every ${r.intervalDays} days`,
      ].filter(Boolean)
    : [];

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
          {hint && <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
        </div>
        <p className={`shrink-0 whitespace-nowrap text-right text-sm font-semibold ${s.text}`}>
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
            {r.lastDoneOdometer != null && (
              <span className="block text-xs text-zinc-500" title={r.odometerEstimated ? "First odometer reading after this date" : undefined}>
                {r.odometerEstimated ? "≈ " : ""}
                {num(r.lastDoneOdometer)} km
              </span>
            )}
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

      {r.intervalKm != null && r.kmLeft == null && (
        <OdometerButton className="btn mt-3 w-full border border-dashed border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10" />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => open("done")}>
          ✓ Mark Done
        </button>
        <button className="btn-ghost" onClick={() => open("edit")}>
          Edit interval
        </button>
      </div>

      {mode === "done" && (
        <Modal title={`Mark ${r.label} done`} onClose={close}>
          <form onSubmit={onMarkDone} className="grid grid-cols-2 gap-3">
            <label>
              <span className="label">Date</span>
              <input name="date" type="date" defaultValue={todayIST()} required className="input mt-1" />
            </label>
            <label>
              <span className="label">Odometer (km)</span>
              <input
                name="odometer"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                defaultValue={currentOdometer ?? ""}
                placeholder="optional"
                className="input mt-1"
              />
            </label>
            <p className="col-span-2 text-xs text-zinc-500">The next due date and km are counted from here.</p>
            {error && <p className="col-span-2 text-sm text-red-400">{error}</p>}
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Saving…" : "Mark done"}
            </button>
          </form>
        </Modal>
      )}

      {mode === "edit" && (
        <Modal title={`Edit ${r.label} interval`} onClose={close}>
          <form onSubmit={onEdit} className="grid grid-cols-2 gap-3">
            <label>
              <span className="label">Every (km)</span>
              <input
                name="intervalKm"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                defaultValue={r.intervalKm ?? ""}
                placeholder="none"
                className="input mt-1"
              />
            </label>
            <label>
              <span className="label">Every (days)</span>
              <input
                name="intervalDays"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                defaultValue={r.intervalDays ?? ""}
                placeholder="none"
                className="input mt-1"
              />
            </label>
            <p className="col-span-2 text-xs text-zinc-500">
              Due when either limit is reached. Leave one empty to remove it.
            </p>
            {error && !pendingClear && <p className="col-span-2 text-sm text-red-400">{error}</p>}
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Saving…" : "Save"}
            </button>
          </form>
        </Modal>
      )}

      {pendingClear && (
        <ConfirmDialog
          title="Remove interval?"
          confirmLabel="Remove"
          message={
            <>
              <p>
                <span className="font-semibold text-zinc-100">{r.label}</span> will no longer remind you{" "}
                {removed.join(" or ")}.
              </p>
              <p className="mt-2 text-zinc-400">You can add it back later with Edit interval.</p>
            </>
          }
          busy={busy}
          error={error}
          onConfirm={() => send(`/api/reminders/${r.id}`, pendingClear)}
          onCancel={() => {
            setPendingClear(null);
            setError(null);
          }}
        />
      )}
    </section>
  );
}
