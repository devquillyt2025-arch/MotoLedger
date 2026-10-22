export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    // Sticky title bar with a divider; content scrolls beneath it. Bleeds into main's side padding so
    // scrolled rows don't peek out at the edges. Sits under the 56px phone top bar, at 0 on desktop.
    <div className="sticky top-14 z-20 -mx-4 mb-5 flex items-end justify-between gap-4 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-4 pt-5 backdrop-blur lg:top-0 lg:-mx-10 lg:mb-6 lg:px-10 lg:pb-5 lg:pt-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400 lg:text-base">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 lg:block">{action}</div>}
    </div>
  );
}
