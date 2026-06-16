import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: "default" | "sm";
};

const sizeClasses = {
  default: "h-9 px-3 text-sm",
  sm: "h-7 px-2.5 text-xs",
};

function Input({ className, type = "text", size = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-md border border-border bg-background text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Input, type InputProps };
