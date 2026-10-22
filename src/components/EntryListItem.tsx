"use client";

import { ChevronRight } from "lucide-react";
import type { EditableEntry } from "@/lib/data";
import { useEntryModal } from "./AddEntry";

/** Phone list row: tap to open the entry in the edit sheet (delete lives there, behind a confirm). */
export default function EntryListItem({
  entry,
  lead,
  title,
  subtitle,
  amount,
  meta,
}: {
  entry: EditableEntry;
  lead: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const { edit } = useEntryModal();
  return (
    <li>
      <button
        type="button"
        onClick={() => edit(entry)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-zinc-800/60"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300">
          {lead}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title}</span>
          {subtitle && <span className="block truncate text-xs text-zinc-500">{subtitle}</span>}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums">{amount}</span>
          {meta && <span className="block text-[11px] tabular-nums text-zinc-500">{meta}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
      </button>
    </li>
  );
}
