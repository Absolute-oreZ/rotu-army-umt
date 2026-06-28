"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot";

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function DropdownMenu({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const ctx = React.useContext(DropdownMenuContext)!;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={!asChild ? "button" : undefined}
      onClick={() => ctx.setOpen(v => !v)}
    >
      {children}
    </Comp>
  );
}

function DropdownMenuContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownMenuContext)!

  if (!ctx.open) return null

  return (
    <div
      className={cn(
        "absolute left-0 top-full z-50 mt-1 min-w-32 rounded-lg bg-popover p-1 shadow-lg ring-1 ring-black/10",
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  className,
  onClick,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownMenuContext)!

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        ctx.setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuCheckboxItem({
  checked,
  children,
  className,
  ...props
}: {
  checked?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DropdownMenuItem className={className} {...props}>
      <span className="ml-auto w-4">
        {checked && <CheckIcon className="size-4" />}
      </span>
      {children}
    </DropdownMenuItem>
  )
}

function DropdownMenuRadioGroup({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

function DropdownMenuRadioItem({
  checked,
  children,
  className,
  ...props
}: {
  checked?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DropdownMenuItem className={className} {...props}>
      <span className="ml-auto w-4">
        {checked && <CheckIcon className="size-4" />}
      </span>
      {children}
    </DropdownMenuItem>
  )
}

function DropdownMenuLabel({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuSeparator({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("my-1 h-px bg-border", className)} />
  )
}

function DropdownMenuShortcut({
  className,
  children,
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

function DropdownMenuPortal({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

function DropdownMenuGroup({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuPortal,
  DropdownMenuGroup,
}