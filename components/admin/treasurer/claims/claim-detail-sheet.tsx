"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReceiptPreviewDialog } from "@/components/admin/treasurer/payments/receipt-preview-dialog";
import type { Claim } from "@/components/admin/treasurer/claims/claims-table";

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

export function ClaimDetailSheet({
  claim,
  onOpenChange,
}: {
  claim: Claim | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  return (
    <>
      <Sheet open={!!claim} onOpenChange={onOpenChange} side="right">
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{claim?.title}</SheetTitle>
          </SheetHeader>

          {claim && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_STYLES[claim.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {STATUS_LABELS[claim.status] ?? claim.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-muted-foreground">Cadet</span>
                  <span className="font-medium">{claim.memberName}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Army No</span>
                  <span className="font-mono tabular-nums">{claim.armyNo}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Amount</span>
                  <span className="font-semibold tabular-nums">
                    RM {Number(claim.amount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Submitted</span>
                  <span>
                    {new Date(claim.createdAt).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {claim.description && (
                <div className="text-sm">
                  <span className="block text-muted-foreground">Description</span>
                  <p className="mt-1 whitespace-pre-wrap">{claim.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Receipt
                  </span>
                  {claim.receiptPath ? (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(claim.receiptUrl);
                        }}
                        className="relative aspect-square w-full overflow-hidden rounded-lg border border-border"
                      >
                        {(() => {
                          const url = claim.receiptUrl;
                          return url ? (
                            <Image
                              src={url}
                              alt="Receipt"
                              fill
                              className="object-cover"
                            />
                          ) : null;
                        })()}
                      </button>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        No receipt
                      </div>
                    )}
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Bank QR
                  </span>
                  {claim.qrCodePath ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(claim.qrCodeUrl);
                      }}
                      className="relative aspect-square w-full overflow-hidden rounded-lg border border-border"
                    >
                      {(() => {
                        const url = claim.qrCodeUrl;
                        return url ? (
                          <Image
                            src={url}
                            alt="Bank QR code"
                            fill
                            className="object-cover"
                          />
                        ) : null;
                      })()}
                    </button>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      No QR code
                    </div>
                  )}
                </div>
              </div>

              {claim.status === "FULFILLED" && claim.fulfilledAt && (
                <p className="text-xs text-muted-foreground">
                  Fulfilled on{" "}
                  {new Date(claim.fulfilledAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}

              {claim.status === "REJECTED" && claim.rejectedAt && (
                <p className="text-xs text-muted-foreground">
                  Rejected on{" "}
                  {new Date(claim.rejectedAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}

            </div>
          )}
        </SheetContent>
      </Sheet>

      <ReceiptPreviewDialog
        url={imagePreview}
        onOpenChange={(open) => {
          if (!open) setImagePreview(null);
        }}
      />
    </>
  );
}
