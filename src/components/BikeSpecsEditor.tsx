"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BikeSpecs } from "@/db/schema";
import { SPEC_GROUPS } from "@/lib/bike-specs";
import { sendJson } from "@/lib/client";
import { Modal } from "./Modal";

/** "Edit bike details" button + sheet for the active profile's Bike Info. */
export default function BikeSpecsEditor({
  bike,
  specs,
  label = "Edit details",
  className = "btn-ghost",
}: {
  bike: string;
  specs: BikeSpecs | null;
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
    const err = await sendJson("/api/bike-specs", "PATCH", Object.fromEntries(new FormData(e.currentTarget)));
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
        <Modal title={`${bike} details`} onClose={() => !busy && setOpen(false)}>
          <form onSubmit={onSubmit} className="space-y-5">
            <p className="text-xs text-zinc-400">Copy these from your owner&apos;s manual. Leave anything you don&apos;t know empty.</p>
            {SPEC_GROUPS.map((g) => (
              <fieldset key={g.group}>
                <legend className="label mb-2">{g.group}</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {g.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-xs text-zinc-400">{f.label}</span>
                      <input
                        name={f.key}
                        defaultValue={specs?.[f.key] ?? ""}
                        placeholder={f.placeholder}
                        maxLength={80}
                        inputMode={f.numeric ? "decimal" : undefined}
                        className="input mt-1 py-2.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block">
              <span className="label">Notes</span>
              <textarea
                name="notes"
                defaultValue={specs?.notes ?? ""}
                maxLength={600}
                rows={3}
                placeholder="Anything else worth remembering — warranty, dealer, quirks…"
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
