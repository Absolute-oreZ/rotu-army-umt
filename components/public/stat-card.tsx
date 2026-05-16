import { CountUp } from "./count-up";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-md border border-border bg-card/70 p-5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold">
        <CountUp end={value} />
      </p>
    </article>
  );
}
