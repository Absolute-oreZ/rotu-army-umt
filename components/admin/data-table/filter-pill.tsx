import { XIcon } from "lucide-react";

export function FilterPill({
  columnLabel,
  operator,
  value,
  onRemove,
}: {
  columnLabel: string;
  operator: string;
  value: string;
  onRemove: () => void;
}) {
  const formatOperator = (op: string) => {
    const map: Record<string, string> = {
      eq: "=",
      neq: "≠",
      gt: ">",
      gte: "≥",
      lt: "<",
      lte: "≤",
      contains: "contains",
      startsWith: "starts with",
      endsWith: "ends with",
      in: "in",
      notIn: "not in",
    };
    return map[op] || op;
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs">
      <span className="font-medium text-foreground">{columnLabel}</span>
      <span className="text-muted-foreground">{formatOperator(operator)}</span>
      <span className="font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}
