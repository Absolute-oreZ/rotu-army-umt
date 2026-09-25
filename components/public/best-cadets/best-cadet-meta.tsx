export function BestCadetMeta({ year, intake, intakeLabel }: { year: number; intake: string | null; intakeLabel: string }) {
  return <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">{year}{intake ? ` · ${intakeLabel} ${intake}` : ""}</p>;
}
