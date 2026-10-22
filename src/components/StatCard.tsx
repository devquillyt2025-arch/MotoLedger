export default function StatCard({
  label,
  value,
  sub,
  accent = "text-zinc-50",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
