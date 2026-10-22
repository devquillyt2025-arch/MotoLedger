/** Skeleton shown while a page's Neon queries run (noticeable on a cold start). */
export default function Loading() {
  const block = "animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70";
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="-mx-4 mb-4 border-b border-zinc-800 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.875rem)] lg:-mx-10 lg:mb-6 lg:px-10 lg:pb-5 lg:pt-8">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-900" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-24`} />
        ))}
      </div>
      <div className={`${block} mt-4 h-80`} />
    </div>
  );
}
