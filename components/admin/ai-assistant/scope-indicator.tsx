export function ScopeIndicator({
  role,
  scope,
}: {
  role: string;
  scope: string;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {role} · {scope}
    </p>
  );
}
