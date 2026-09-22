"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "checkbox", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn("size-4 rounded border-border accent-primary", className)}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";
