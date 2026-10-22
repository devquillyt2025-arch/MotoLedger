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
    // Sticky title bar with a divider; content scrolls beneath it. On phones it is the app's top bar,
    // so it pads for the notch/status bar. Bleeds into main's side padding so rows don't peek out.
    <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-end justify-between gap-4 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.875rem)] backdrop-blur lg:-mx-10 lg:mb-6 lg:px-10 lg:pb-5 lg:pt-8">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs text-zinc-400 sm:text-sm lg:mt-1 lg:text-base">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 lg:block">{action}</div>}
    </div>
  );
}
