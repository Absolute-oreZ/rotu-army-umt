"use client";

import { FileTextIcon, PlusIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { ClaimForm } from "@/components/cadet/claim-form";
import type { CadetAccountRecord } from "@/lib/cadet/account-types";

type Claim = {
  id: number;
  title: string;
  amount: string;
  status: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-600/15 text-amber-600",
  FULFILLED: "bg-emerald-600/15 text-emerald-600",
  REJECTED: "bg-red-600/15 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  FULFILLED: "Fulfilled",
  REJECTED: "Rejected",
};

export function ClaimsList({
  claims,
  account,
}: {
  claims: Claim[];
  account: CadetAccountRecord | null;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cadet portal
          </p>
          <h1 className="text-2xl font-semibold">My Claims</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Track reimbursement requests and submit a new claim when needed.
          </p>
        </div>
        <ClaimForm
          account={account}
          trigger={
            <button type="button" className={buttonClasses({ size: "sm" })}>
              <PlusIcon className="mr-1.5 size-3.5" />
              New Claim
            </button>
          }
        />
      </div>

      {claims.length === 0 ? (
        <Empty
          title="No claims"
          description="You haven't submitted any claims yet."
          icon={<FileTextIcon className="size-5 text-muted-foreground" />}
          action={
            <ClaimForm
              account={account}
              trigger={
                <button
                  type="button"
                  className={buttonClasses({ variant: "outline", size: "sm" })}
                >
                  <PlusIcon className="mr-1.5 size-3.5" />
                  Submit a claim
                </button>
              }
            />
          }
        />
      ) : (
        <div className="space-y-2">
          {claims.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {c.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  RM {Number(c.amount).toFixed(2)} &middot;{" "}
                  {new Date(c.createdAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_STYLES[c.status] ?? "bg-muted text-muted-foreground",
                )}
              >
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
