export function ToolStatus({ toolName }: { toolName: string }) {
  return (
    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      Tool · {toolName}
    </p>
  );
}
