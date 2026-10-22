"use client";

import { Gauge, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { sendJson } from "@/lib/client";
import type { OdometerLog } from "@/lib/data";
import { num, shortDate, todayIST } from "@/lib/format";
import { ConfirmDialog, Modal } from "./Modal";

const OdometerContext = createContext<() => void>(() => {});

/** Opens the "Update odometer" sheet. */
export const useOdometer = () => useContext(OdometerContext);

/** Button that opens the sheet; pass children to customise its content. */
export function OdometerButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const open = useOdometer();
  return (
    <button type="button" onClick={open} className={className}>
      {children ?? (
        <>
          <Gauge className="h-4 w-4" /> Update odometer
        </>
      )}
    </button>
  );
}

export function OdometerProvider({
  current,
  logs,
  children,
}: {
  current: number | null;
  logs: OdometerLog[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [km, setKm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLow, setConfirmLow] = useState(false);
  const [deleting, setDeleting] = useState<OdometerLog | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const kmRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) kmRef.current?.focus();
  }, [open]);

  function show() {
    setKm("");
    setError(null);
    setConfirmLow(false);
    setOpen(true);
  }

  async function save() {
    const f = new FormData(formRef.current!);
    setSaving(true);
    setError(null);
    const err = await sendJson("/api/odometer", "POST", { date: f.get("date"), km: f.get("km") });
    setSaving(false);
    setConfirmLow(false);
    if (err) return setError(err);
    setOpen(false);
    router.refresh();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A reading below the current one is usually a typo — ask before saving it.
    if (current != null && Number(km) < current) return setConfirmLow(true);
    save();
  }

  async function onDelete() {
    if (!deleting) return;
    setBusyDelete(true);
    setDeleteError(null);
    const err = await sendJson(`/api/odometer/${deleting.id}`, "DELETE");
    setBusyDelete(false);
    if (err) return setDeleteError(err);
    setDeleting(null);
    router.refresh();
  }

  const diff = current != null && km !== "" ? Number(km) - current : null;

  return (
    <OdometerContext.Provider value={show}>
      {children}

      {open && (
        <Modal title="Update odometer" onClose={() => !saving && !confirmLow && !deleting && setOpen(false)}>
          <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className="label">Odometer reading (km)</span>
              <input
                ref={kmRef}
                name="km"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder={current != null ? String(current) : "e.g. 1250"}
                className="input mt-1 text-2xl font-bold tabular-nums"
              />
            </label>
            <p className="col-span-2 -mt-1 text-xs text-zinc-400">
              {current == null
                ? "Your first reading — km-based reminders start counting from here."
                : diff == null
                  ? `Last known: ${num(current)} km`
                  : diff >= 0
                    ? `+${num(diff)} km since last reading (${num(current)} km)`
                    : `Lower than the last reading (${num(current)} km)`}
            </p>
            <label className="col-span-2 block">
              <span className="label">Date</span>
              <input name="date" type="date" required defaultValue={todayIST()} max="2100-12-31" className="input mt-1" />
            </label>
            {error && <p className="col-span-2 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary col-span-2 py-4 text-base">
              {saving ? "Saving…" : "Save reading"}
            </button>
          </form>

          {logs.length > 0 && (
            <div className="mt-5">
              <h3 className="label mb-1">Recent readings</h3>
              <ul className="divide-y divide-zinc-800">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-zinc-400">{shortDate(l.date)}</span>
                    <span className="ml-auto font-semibold tabular-nums">{num(l.km)} km</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(l);
                      }}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400"
                      aria-label={`Delete reading ${l.km} km`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-zinc-500">Odometer values entered with a refuel or service count too.</p>
            </div>
          )}
        </Modal>
      )}

      {confirmLow && (
        <ConfirmDialog
          title="Lower than before?"
          confirmLabel="Save anyway"
          message={
            <p>
              {num(Number(km))} km is below your last reading of {num(current ?? 0)} km. Odometers only go up, so this is
              usually a typo.
            </p>
          }
          busy={saving}
          onConfirm={save}
          onCancel={() => setConfirmLow(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this reading?"
          message={
            <p>
              <span className="font-semibold text-zinc-100">{num(deleting.km)} km</span> on {shortDate(deleting.date)}. This
              can&apos;t be undone.
            </p>
          }
          busy={busyDelete}
          error={deleteError}
          onConfirm={onDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </OdometerContext.Provider>
  );
}
