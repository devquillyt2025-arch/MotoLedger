"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { EntryType } from "@/db/schema";
import type { EntryMeta } from "@/lib/data";
import { CATEGORY_SUGGESTIONS } from "@/lib/constants";
import { todayIST } from "@/lib/format";

const TYPES: { value: EntryType; label: string; icon: string }[] = [
  { value: "refuel", label: "Refuel", icon: "⛽" },
  { value: "service", label: "Service", icon: "🔧" },
  { value: "accessory", label: "Accessory", icon: "🪖" },
];

const AddEntryContext = createContext<(type?: EntryType) => void>(() => {});

/** Opens the shared Add Entry modal, optionally preset to a type. */
export const useAddEntry = () => useContext(AddEntryContext);

export function AddEntryButton({ type, className = "btn-primary" }: { type?: EntryType; className?: string }) {
  const open = useAddEntry();
  return (
    <button onClick={() => open(type)} className={className}>
      <Plus className="h-4 w-4" /> Add Entry
    </button>
  );
}

/** Floating button for phones; desktop uses the sidebar / page-header buttons. */
export function AddEntryFab() {
  const open = useAddEntry();
  return (
    <button
      onClick={() => open()}
      aria-label="Add entry"
      className="btn-primary fixed bottom-5 right-4 z-30 rounded-full px-6 py-4 text-base shadow-lg shadow-emerald-500/20 lg:hidden"
    >
      <Plus className="h-5 w-5" /> Add
    </button>
  );
}

export function AddEntryProvider({ meta, children }: { meta: EntryMeta; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntryType>("refuel");
  const [category, setCategory] = useState(CATEGORY_SUGGESTIONS.refuel[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    amountRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function pickType(t: EntryType) {
    setType(t);
    setCategory(CATEGORY_SUGGESTIONS[t][0]);
  }

  function openModal(t: EntryType = "refuel") {
    pickType(t);
    setError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form), type, category }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Could not save");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <AddEntryContext.Provider value={openModal}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={() => setOpen(false)}>
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none border-zinc-700 bg-zinc-900 p-5 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                New {TYPES.find((t) => t.value === type)!.label}{" "}
                <span className="text-zinc-500">#{meta.nextSeq[type]}</span>
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => pickType(t.value)}
                  className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                    type === t.value ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-zinc-700 text-zinc-400"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block">
                <span className="label">Amount (₹)</span>
                <input ref={amountRef} name="amount" type="number" inputMode="decimal" step="0.01" min="1" required className="input mt-1 text-2xl font-bold" placeholder="0" />
              </label>
              <label className="block">
                <span className="label">Date</span>
                <input name="date" type="date" required defaultValue={todayIST()} className="input mt-1" />
              </label>
              <label className="block">
                <span className="label">Odometer (km)</span>
                <input
                  name="odometer"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="input mt-1"
                  placeholder={meta.currentOdometer != null ? `> ${meta.currentOdometer}` : "optional"}
                />
              </label>
              <div className="col-span-2">
                <span className="label">Category</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {CATEGORY_SUGGESTIONS[type].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        category === c ? "border-emerald-500 text-emerald-300" : "border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input value={category} onChange={(e) => setCategory(e.target.value)} required className="input mt-2" placeholder="Or type a category" />
              </div>
              <label className="col-span-2 block">
                <span className="label">Notes</span>
                <input name="notes" className="input mt-1" placeholder="optional" />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={saving} className="btn-primary mt-5 w-full py-4 text-base">
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}
    </AddEntryContext.Provider>
  );
}
