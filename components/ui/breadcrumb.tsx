import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

type BreadcrumbLinkProps = React.ComponentProps<"a"> & {
  asChild?: boolean
  children?: React.ReactNode
}

function BreadcrumbLink({
  asChild,
  className,
  children,
  ...props
}: BreadcrumbLinkProps) {
  const classes = cn(
    "transition-colors hover:text-foreground",
    className
  )

  if (asChild && React.isValidElement(children)) {
    const clonedProps = {
      ...props,
      className: cn(
        classes,
        (children as React.ReactElement<React.ComponentPropsWithoutRef<"a">>).props.className
      ),
      "data-slot": "breadcrumb-link",
    } as React.ComponentPropsWithoutRef<"a"> & { "data-slot": string };

    return React.cloneElement(
      children as React.ReactElement<React.ComponentPropsWithoutRef<"a">>,
      clonedProps,
    )
  }

  return (
    <a
      data-slot="breadcrumb-link"
      className={classes}
      {...props}
    >
      {children}
    </a>
  )
}

function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-9 items-center justify-center",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}