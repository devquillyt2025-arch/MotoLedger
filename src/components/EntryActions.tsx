"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import type { EditableEntry } from "@/lib/data";
import { rupees, shortDate } from "@/lib/format";
import { useEntryModal } from "./AddEntry";
import { ConfirmDialog } from "./Modal";

/** Edit / delete buttons for one entry row. Delete always asks first. */
export default function EntryActions({ entry }: { entry: EditableEntry }) {
  const { edit } = useEntryModal();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    const err = await sendJson(`/api/entries/${entry.id}`, "DELETE");
    setBusy(false);
    if (err) return setError(err);
    setConfirming(false);
    router.refresh();
  }

  const btn = "rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200";
  return (
    <div className="flex justify-end gap-1">
      <button onClick={() => edit(entry)} className={btn} aria-label="Edit entry" title="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className={`${btn} hover:text-red-400`}
        aria-label="Delete entry"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Delete this entry?"
          message={
            <>
              <p className="font-semibold text-zinc-100">
                {entry.category} · {rupees(entry.amount)}
              </p>
              <p className="text-zinc-400">
                {shortDate(entry.date)}
                {entry.notes && ` · ${entry.notes}`}
              </p>
              <p className="mt-2 text-zinc-400">This can&apos;t be undone. Totals and refuel numbers will update.</p>
            </>
          }
          busy={busy}
          error={error}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
