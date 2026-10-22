/** Skeleton shown while a page's Neon queries run (noticeable on a cold start). */
export default function Loading() {
  const block = "animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70";
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-7 h-9 w-48 animate-pulse rounded-lg bg-zinc-900" />
      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-24`} />
        ))}
      </div>
      <div className={`${block} mt-4 h-80`} />
    </div>
  );
}
