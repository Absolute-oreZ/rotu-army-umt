import { ReactNode } from "react";

export function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {required && <span className="text-red-400"> *</span>}
      </label>

      {children}

      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}