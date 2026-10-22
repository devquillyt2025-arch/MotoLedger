"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { rupees, shortDate } from "@/lib/format";
import type { EditableEntry } from "@/lib/data";
import { useEntryModal } from "./AddEntry";

/** Edit / delete buttons for one entry row. */
export default function EntryActions({ entry }: { entry: EditableEntry }) {
  const { edit } = useEntryModal();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete ${entry.category} of ${rupees(entry.amount)} on ${shortDate(entry.date)}?`)) return;
    setBusy(true);
    const err = await sendJson(`/api/entries/${entry.id}`, "DELETE");
    setBusy(false);
    if (err) return alert(err);
    router.refresh();
  }

  const btn = "rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40";
  return (
    <div className="flex justify-end gap-1">
      <button onClick={() => edit(entry)} className={btn} aria-label="Edit entry" title="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} disabled={busy} className={`${btn} hover:text-red-400`} aria-label="Delete entry" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

