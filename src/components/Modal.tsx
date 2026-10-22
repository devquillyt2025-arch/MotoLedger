"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

/** Centered dialog on desktop, bottom sheet on phones. Closes on backdrop tap or Escape. */
export function Modal({
  title,
  onClose,
  children,
  z = "z-50",
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  z?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-black/70 sm:items-center`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none border-zinc-700 bg-zinc-900 p-5 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** "Are you sure?" step before anything destructive. Sits above other modals. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel} z="z-[60]">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="text-sm text-zinc-300">{message}</div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy} autoFocus>
          No, keep it
        </button>
        <button type="button" className="btn bg-red-500 text-white hover:bg-red-400" onClick={onConfirm} disabled={busy}>
          {busy ? "Working…" : `Yes, ${confirmLabel.toLowerCase()}`}
        </button>
      </div>
    </Modal>
  );
}
