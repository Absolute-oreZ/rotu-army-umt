import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  error,
  description,
  required,
  className,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {required && <span className="text-red-400"> *</span>}
      </label>

      {children}

      {description && !error && <span className="text-[10px] text-muted-foreground">{description}</span>}
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
