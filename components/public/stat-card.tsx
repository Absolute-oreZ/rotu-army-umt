export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="p-5 sm:p-6">
      <p className="record-label">
        {label}
      </p>
      <p className="mt-3 font-mono text-4xl font-medium tabular-nums sm:text-5xl">{value.toLocaleString()}</p>
    </article>
  );
}
