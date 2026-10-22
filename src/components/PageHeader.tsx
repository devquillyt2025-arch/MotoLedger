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
    <div className="mb-5 flex items-end justify-between gap-4 lg:mb-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400 lg:text-base">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 lg:block">{action}</div>}
    </div>
  );
}
