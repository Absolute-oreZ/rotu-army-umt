import { ReactNode } from "react";

interface EmptyProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Empty({
  title,
  description,
  icon,
  action,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center bg-muted rounded-lg">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}