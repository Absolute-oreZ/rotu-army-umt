"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ExternalLinkIcon, CreditCardIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { buildPaymentsTableConfig } from "@/components/admin/treasurer/payments/table-config";

export type Payment = {
  paymentId: number | null;
  collectionId: number;
  collectionTitle: string;
  memberId: number;
  memberName: string;
  armyNo: number;
  rank: string;
  displayPhotoPath: string | null;
  amountPaid: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
};

type PaymentsTableProps = {
  payments: Payment[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  collections: Array<{ id: number; title: string; amount: string | null; isFixedAmount: boolean }>;
  hasCollection: boolean;
  onViewReceipt: (url: string) => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function initialsColor(name: string) {
  const palette = [
    "bg-sky-600/15 text-sky-600",
    "bg-emerald-600/15 text-emerald-600",
    "bg-amber-600/15 text-amber-600",
    "bg-rose-600/15 text-rose-600",
    "bg-violet-600/15 text-violet-600",
    "bg-indigo-600/15 text-indigo-600",
  ];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

export function PaymentsTable({
  payments,
  searchParams,
  totalCount,
  collections,
  hasCollection,
  onViewReceipt,
}: PaymentsTableProps) {
  const config = useMemo(
    () =>
      buildPaymentsTableConfig(
        collections.length > 1
          ? collections.map((c) => ({ value: c.title, label: c.title }))
          : undefined,
      ),
    [collections],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  const collectionById = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections],
  );

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name or army no..."
        totalCount={totalCount}
        shownCount={payments.length}
        state={state}
        onChange={update}
        onReset={reset}
        isDefault={isDefault}
      />

      <div className="mb-4">
        <GlobalFilterBar
          filters={state.filters}
          sortRules={state.sortRules}
          filterColumns={config.filterColumns}
          sortKeys={config.sortKeys}
          sortLabels={config.sortLabels}
          onFilterUpdate={(filters) => update({ filters, page: 1 })}
          onSortUpdate={(sortRules) => update({ sortRules })}
        />
      </div>

      {payments.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? hasCollection
                ? "No payments recorded yet."
                : "No payments recorded across collections."
              : "No payments match the current filters. Try clearing some."
          }
          icon={<CreditCardIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={update} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={update} />
              <SortableHead columnKey="memberName" label="Name" state={state} onChange={update} />
              <SortableHead columnKey="amountPaid" label="Amount" state={state} onChange={update} />
              <SortableHead columnKey="paidAt" label="Paid At" state={state} onChange={update} />
              {hasCollection && <TableHead>Status</TableHead>}
              <TableHead className="pr-5 text-right w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const isPaid = p.paymentId !== null;
              const collection = collectionById.get(p.collectionId);
              const showFixedExpected =
                !isPaid && collection?.isFixedAmount && collection.amount;

              return (
                <TableRow key={`${p.memberId}-${p.collectionId}-${p.paymentId ?? "unpaid"}`}>
                  <TableCell>
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {p.displayPhotoPath ? (
                        <Image
                          src={p.displayPhotoPath}
                          alt={p.memberName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex size-full items-center justify-center text-[10px] font-semibold",
                            initialsColor(p.memberName),
                          )}
                        >
                          {getInitials(p.memberName)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    <CopyableValue value={p.armyNo} valueClassName="font-mono tabular-nums">
                      {p.armyNo}
                    </CopyableValue>
                  </TableCell>
                  <TableCell>{formatRank(p.rank)}</TableCell>
                  <TableCell className="font-medium">
                    <CopyableValue value={p.memberName} valueClassName="font-medium">
                      {p.memberName}
                    </CopyableValue>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {p.amountPaid !== null
                      ? `RM ${Number(p.amountPaid).toFixed(2)}`
                      : showFixedExpected
                        ? `RM ${Number(collection!.amount).toFixed(2)}`
                        : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString("en-MY", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  {hasCollection && (
                    <TableCell>
                      {isPaid ? (
                        <span className="inline-block rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-amber-600/15 px-2 py-0.5 text-xs font-medium text-amber-600">
                          Unpaid
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-0.5">
                      {isPaid && p.receiptUrl && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-sky-600"
                              onClick={() => onViewReceipt(p.receiptUrl!)}
                            >
                              <ExternalLinkIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View receipt</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={update}
      />
    </>
  );
}
