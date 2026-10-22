"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { EditableEntry } from "@/lib/data";
import { useEntryModal } from "./AddEntry";
import DeleteEntryDialog from "./DeleteEntryDialog";

/**
 * A table row that opens the entry for editing when tapped. The trash icon only appears on hover
 * (desktop); on phones, delete lives inside the edit pop-up. Either way it asks before deleting.
 */
export default function EntryRow({ entry, children }: { entry: EditableEntry; children: React.ReactNode }) {
  const { edit } = useEntryModal();
  const [confirming, setConfirming] = useState(false);

  return (
    <tr
      tabIndex={0}
      onClick={() => edit(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          edit(entry);
        }
      }}
      title="Tap to edit"
      className="group cursor-pointer outline-none transition hover:bg-zinc-800/50 focus-visible:bg-zinc-800/50"
    >
      {children}
      <td className="w-12 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setConfirming(true)}
          className="invisible rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/15 hover:text-red-400 group-hover:visible group-focus-visible:visible"
          aria-label="Delete entry"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {confirming && <DeleteEntryDialog entry={entry} onCancel={() => setConfirming(false)} />}
      </td>
    </tr>
  );
}
