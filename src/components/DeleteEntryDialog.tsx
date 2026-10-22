"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import type { EditableEntry } from "@/lib/data";
import { rupees, shortDate } from "@/lib/format";
import { ConfirmDialog } from "./Modal";

/** The single confirm-then-delete flow every entry delete goes through. */
export default function DeleteEntryDialog({
  entry,
  onCancel,
  onDeleted,
}: {
  entry: EditableEntry;
  onCancel: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setBusy(true);
    setError(null);
    const err = await sendJson(`/api/entries/${entry.id}`, "DELETE");
    setBusy(false);
    if (err) return setError(err);
    onDeleted?.();
    router.refresh();
  }

  return (
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
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
