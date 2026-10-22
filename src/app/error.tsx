"use client";

import { RotateCw } from "lucide-react";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center">
      <h1 className="text-lg font-bold">Couldn&apos;t load this page</h1>
      <p className="mt-2 text-sm text-zinc-400">The database didn&apos;t respond. Check your connection and try again.</p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-zinc-600">ref {error.digest}</p>}
      <button onClick={reset} className="btn-primary mt-5">
        <RotateCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}
