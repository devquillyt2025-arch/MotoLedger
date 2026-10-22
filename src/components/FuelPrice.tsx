"use client";

import { Fuel, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Modal } from "./Modal";

/** Shows the profile's petrol price; tap to change it. Litre estimates everywhere use this price. */
export default function FuelPriceButton({ price, className = "" }: { price: number; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await sendJson("/api/fuel-price", "PATCH", { price: new FormData(e.currentTarget).get("price") });
    setBusy(false);
    if (err) return setError(err);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={`flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm ${className}`}
      >
        <span className="text-zinc-300">Petrol price</span>
        <span className="flex items-center gap-1.5 font-semibold tabular-nums">
          ₹{price.toFixed(2)}/L <Pencil className="h-3.5 w-3.5 text-emerald-400" />
        </span>
      </button>

      {open && (
        <Modal title="Petrol price" onClose={() => !busy && setOpen(false)}>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="label">Price per litre (₹)</span>
              <div className="relative mt-1">
                <Fuel className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="50"
                  max="300"
                  required
                  autoFocus
                  defaultValue={price.toFixed(2)}
                  className="input pl-11 text-2xl font-bold tabular-nums"
                />
              </div>
            </label>
            <p className="text-xs text-zinc-500">
              Used to estimate litres for this profile — on the dashboard, refuel log, Analysis and Excel export. Past refills
              are re-estimated at the new price.
            </p>
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
