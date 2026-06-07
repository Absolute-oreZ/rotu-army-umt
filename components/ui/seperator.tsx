"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      role={decorative ? undefined : "separator"}
      aria-orientation={
        !decorative && orientation === "vertical"
          ? "vertical"
          : undefined
      }
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? "h-px w-full"
          : "w-px self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }