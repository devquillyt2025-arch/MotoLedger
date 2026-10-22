"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ownership } from "@/db/schema";
import { sendJson } from "@/lib/client";
import { OWNERSHIP_GROUPS } from "@/lib/ownership";
import { Modal } from "./Modal";

/** Button + sheet to edit the active profile's purchase, RTO and insurance details. */
export default function OwnershipEditor({
  ownership,
  label = "Edit",
  className = "btn-ghost",
}: {
  ownership: Ownership | null;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await sendJson("/api/ownership", "PATCH", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (err) return setError(err);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" /> {label}
      </button>

      {open && (
        <Modal title="Purchase, RTO & insurance" onClose={() => !busy && setOpen(false)}>
          <form onSubmit={onSubmit} className="space-y-5">
            <p className="text-xs text-zinc-400">From your invoice, RC and policy. Leave anything you don&apos;t have empty.</p>
            {OWNERSHIP_GROUPS.map((g) => (
              <fieldset key={g.group}>
                <legend className="label mb-2">{g.group}</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {g.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-xs text-zinc-400">
                        {f.label}
                        {f.kind === "money" && " (₹)"}
                      </span>
                      {f.kind === "select" ? (
                        <select name={f.key} defaultValue={ownership?.[f.key] ?? ""} className="input mt-1 py-2.5 text-sm">
                          <option value="">—</option>
                          {f.options!.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={f.key}
                          type={f.kind === "date" ? "date" : f.kind === "money" ? "number" : "text"}
                          inputMode={f.kind === "money" ? "decimal" : undefined}
                          min={f.kind === "money" ? 0 : undefined}
                          step={f.kind === "money" ? "0.01" : undefined}
                          maxLength={f.kind === "text" ? 60 : undefined}
                          defaultValue={ownership?.[f.key] ?? ""}
                          placeholder={f.placeholder}
                          className={`input mt-1 py-2.5 text-sm ${f.key === "regNumber" ? "uppercase" : ""}`}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block">
              <span className="label">Notes</span>
              <textarea
                name="notes"
                defaultValue={ownership?.notes ?? ""}
                maxLength={600}
                rows={2}
                placeholder="e.g. Extended warranty till 2031, NCB 20%…"
                className="input mt-2 resize-y text-sm"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
