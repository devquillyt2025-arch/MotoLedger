"use client";

import "./globals.css";

/** Catches errors thrown by the root layout itself (e.g. Neon unreachable), which error.tsx can't. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="grid min-h-dvh place-items-center p-4">
        <div className="card max-w-md p-6 text-center">
          <h1 className="text-lg font-bold">Moto Ledger is offline</h1>
          <p className="mt-2 text-sm text-zinc-400">Couldn&apos;t reach the database. Check your connection and try again.</p>
          <button onClick={reset} className="btn-primary mt-5">
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
