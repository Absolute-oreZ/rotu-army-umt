"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon } from "lucide-react";
import { Empty } from "@/components/ui/empty";
import { PaymentsTable, type Payment } from "@/components/admin/treasurer/payments/payments-table";
import { ReceiptPreviewDialog } from "@/components/admin/treasurer/payments/receipt-preview-dialog";
import { SearchableSelect } from "@/components/admin/academic/shared/searchable-select";

type Collection = {
  id: number;
  title: string;
  amount: string | null;
  isFixedAmount: boolean;
};

type Summary = {
  total: number;
  paidCount: number;
  expectedCount: number;
  targetAmount: number | null;
  collectionTitle: string;
};

type PaymentsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  collectionId: number | null;
  collections: Collection[];
  payments: Payment[];
  totalCount: number;
  summary: Summary | null;
};

export function PaymentsPageClient({
  searchParams,
  collectionId,
  collections,
  payments,
  totalCount,
  summary,
}: PaymentsPageClientProps) {
  const router = useRouter();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleCollectionChange = useCallback(
    (value: string) => {
      const current = new URLSearchParams(window.location.search);
      current.set("collectionId", value);
      const qs = current.toString();
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="w-64">
                <SearchableSelect
                  value={collectionId !== null ? String(collectionId) : ""}
                  options={collections.map((c) => ({ value: String(c.id), label: c.title }))}
                  onChange={handleCollectionChange}
                  placeholder="Select collection…"
                  searchPlaceholder="Search collection…"
                  emptyLabel="No collections found"
                  ariaLabel="Select collection"
                />
              </div>

        {summary && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">Collected:</span>{" "}
              <span className="font-semibold">RM {summary.total.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Paid:</span>{" "}
              <span className="font-semibold">
                {summary.paidCount} / {summary.expectedCount}
              </span>
            </span>
            {summary.targetAmount !== null && (
              <span>
                <span className="text-muted-foreground">Target:</span>{" "}
                <span className="font-semibold">
                  RM {summary.targetAmount.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {collections.length === 0 ? (
        <Empty
          title="No results"
          description="Create collections first to start tracking payments."
          icon={<CreditCardIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <PaymentsTable
          payments={payments}
          searchParams={searchParams}
          totalCount={totalCount}
          collections={collections}
          hasCollection={collectionId !== null}
          onViewReceipt={(url) => setReceiptPreview(url)}
        />
      )}

      <ReceiptPreviewDialog
        url={receiptPreview}
        onOpenChange={(open) => {
          if (!open) setReceiptPreview(null);
        }}
      />
    </>
  );
}
