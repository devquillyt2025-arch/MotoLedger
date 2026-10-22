"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { EntryType } from "@/db/schema";
import type { EditableEntry, EntryMeta } from "@/lib/data";
import { CATEGORY_SUGGESTIONS, FUEL_PRICE_PER_LITRE, TANK_LITRES } from "@/lib/constants";
import { todayIST } from "@/lib/format";
import { sendJson } from "@/lib/client";
import DeleteEntryDialog from "./DeleteEntryDialog";

const TYPES: { value: EntryType; label: string; icon: string }[] = [
  { value: "refuel", label: "Refuel", icon: "⛽" },
  { value: "service", label: "Service", icon: "🔧" },
  { value: "accessory", label: "Accessory", icon: "🪖" },
];

type Ctx = { add: (type?: EntryType) => void; edit: (entry: EditableEntry) => void };
const EntryModalContext = createContext<Ctx>({ add: () => {}, edit: () => {} });

export const useEntryModal = () => useContext(EntryModalContext);

export function AddEntryButton({ type, className = "btn-primary" }: { type?: EntryType; className?: string }) {
  const { add } = useEntryModal();
  return (
    <button onClick={() => add(type)} className={className}>
      <Plus className="h-4 w-4" /> Add Entry
    </button>
  );
}

/** Floating button for phones; desktop uses the sidebar / page-header buttons. */
export function AddEntryFab() {
  const { add } = useEntryModal();
  return (
    <button
      onClick={() => add()}
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
  const [editing, setEditing] = useState<EditableEntry | null>(null);
  const [type, setType] = useState<EntryType>("refuel");
  const [category, setCategory] = useState(CATEGORY_SUGGESTIONS.refuel[0]);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) amountRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // While the delete confirm is up, Escape belongs to it, not the edit pop-up underneath.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !deleting && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting]);

  function pickType(t: EntryType) {
    setType(t);
    setCategory(CATEGORY_SUGGESTIONS[t][0]);
  }

  const ctx: Ctx = {
    add(t = "refuel") {
      setEditing(null);
      setAmount("");
      pickType(t);
      setError(null);
      setOpen(true);
    },
    edit(entry) {
      setEditing(entry);
      setDeleting(false);
      setAmount(String(entry.amount));
      setType(entry.type);
      setCategory(entry.category);
      setError(null);
      setOpen(true);
    },
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const body = { ...Object.fromEntries(new FormData(e.currentTarget)), type, category };
    const err = editing
      ? await sendJson(`/api/entries/${editing.id}`, "PATCH", body)
      : await sendJson("/api/entries", "POST", body);
    setSaving(false);
    if (err) return setError(err);
    setOpen(false);
    router.refresh();
  }

  const litres = Number(amount) / FUEL_PRICE_PER_LITRE || 0;
  const label = TYPES.find((t) => t.value === type)!.label;
  const seq = editing && editing.type === type ? editing.seq : meta.nextSeq[type];

  return (
    <EntryModalContext.Provider value={ctx}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={() => setOpen(false)}>
          <form
            key={editing?.id ?? "new"}
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none border-zinc-700 bg-zinc-900 p-5 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing ? "Edit" : "New"} {label} {!editing || editing.type === type ? <span className="text-zinc-500">#{seq}</span> : null}
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
                <input
                  ref={amountRef}
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  max="9999999"
                  required
                  defaultValue={editing?.amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input mt-1 text-2xl font-bold"
                  placeholder="0"
                />
              </label>
              {type === "refuel" && litres > 0 && (
                <p className={`col-span-2 -mt-1 text-xs ${litres > TANK_LITRES ? "text-amber-300" : "text-zinc-400"}`}>
                  ≈ {litres.toFixed(1)} L at ₹{FUEL_PRICE_PER_LITRE}/L
                  {litres > TANK_LITRES && ` — more than the ${TANK_LITRES} L tank, check the amount`}
                </p>
              )}
              <label className="block">
                <span className="label">Date</span>
                <input name="date" type="date" required max="2100-12-31" defaultValue={editing?.date ?? todayIST()} className="input mt-1" />
              </label>
              <label className="block">
                <span className="label">Odometer (km)</span>
                <input
                  name="odometer"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  defaultValue={editing?.odometer ?? undefined}
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
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  maxLength={60}
                  className="input mt-2"
                  placeholder="Or type a category"
                />
              </div>
              <label className="col-span-2 block">
                <span className="label">Notes</span>
                <input name="notes" maxLength={500} defaultValue={editing?.notes ?? ""} className="input mt-1" placeholder="optional" />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={saving} className="btn-primary mt-5 w-full py-4 text-base">
              {saving ? "Saving…" : editing ? "Save changes" : "Save"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setDeleting(true)}
                className="btn mt-2 w-full text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete entry
              </button>
            )}
          </form>
        </div>
      )}

      {open && editing && deleting && (
        <DeleteEntryDialog
          entry={editing}
          onCancel={() => setDeleting(false)}
          onDeleted={() => {
            setDeleting(false);
            setOpen(false);
          }}
        />
      )}
    </EntryModalContext.Provider>
  );
}
