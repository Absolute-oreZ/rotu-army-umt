"use client";

import { useMemo } from "react";
import { Trash2Icon, GlobeIcon, EyeOffIcon, ArchiveIcon, ArchiveRestoreIcon, CopyIcon, CheckIcon, WalletIcon, Receipt as ReceiptIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
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
import {
  buildCollectionsTableConfig,
  formatPurpose,
} from "@/components/admin/treasurer/collections/table-config";

export type Collection = {
  id: number;
  title: string;
  slug: string;
  purpose: string;
  description: string | null;
  amount: string | null;
  isFixedAmount: boolean;
  isReceiptRequired: boolean;
  status: string;
  paymentAccountId: number | null;
  intakeId: number;
  intakeNo: string;
  paymentBankName: string | null;
  paymentAccountNumber: number | null;
  paymentCount: number;
  totalCollected: string;
  createdAt: string;
};

type CollectionsTableProps = {
  collections: Collection[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  intakeOptions: Array<{ value: string; label: string }>;
  isAdminIntakeScoped: boolean;
  hasAccounts: boolean;
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  onDelete: (collection: Collection) => void;
  onCopyUrl: (slug: string) => void;
  copiedSlug: string | null;
  isPending: boolean;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-muted text-muted-foreground";
    case "PUBLISHED":
      return "bg-emerald-600/15 text-emerald-600";
    case "ARCHIVED":
      return "bg-amber-600/15 text-amber-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function CollectionsTable({
  collections,
  searchParams,
  totalCount,
  intakeOptions,
  isAdminIntakeScoped,
  hasAccounts,
  onPublish,
  onUnpublish,
  onArchive,
  onRestore,
  onDelete,
  onCopyUrl,
  copiedSlug,
  isPending,
}: CollectionsTableProps) {
  const config = useMemo(
    () => buildCollectionsTableConfig(isAdminIntakeScoped ? undefined : intakeOptions),
    [intakeOptions, isAdminIntakeScoped],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search collections..."
        totalCount={totalCount}
        shownCount={collections.length}
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

      {collections.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? hasAccounts
                ? "No collections yet. Create one to get started."
                : "Create a treasury account first before creating collections."
              : "No collections match the current filters. Try clearing some."
          }
          icon={<WalletIcon className="size-5 text-muted-foreground" />}
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
              <SortableHead columnKey="title" label="Title" state={state} onChange={update} />
              <SortableHead columnKey="purpose" label="Purpose" state={state} onChange={update} />
              <TableHead>Amount</TableHead>
              <SortableHead columnKey="status" label="Status" state={state} onChange={update} />
              <SortableHead columnKey="paymentCount" label="Payments" state={state} onChange={update} />
              <SortableHead columnKey="totalCollected" label="Collected" state={state} onChange={update} />
              <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={update} />
              <TableHead className="pr-5 text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((col) => (
              <TableRow key={col.id}>
                <TableCell className="font-medium max-w-48">
                  <CopyableValue value={col.title} valueClassName="truncate block font-medium">
                    <span className="truncate block">{col.title}</span>
                  </CopyableValue>
                </TableCell>
                <TableCell>{formatPurpose(col.purpose)}</TableCell>
                <TableCell className="tabular-nums">
                  {col.isFixedAmount && col.amount
                    ? `RM ${Number(col.amount).toFixed(2)}`
                    : "Flexible"}
                </TableCell>
                <TableCell>
                  <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", statusBadge(col.status))}>
                    {col.status}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{col.paymentCount}</TableCell>
                <TableCell className="tabular-nums">RM {Number(col.totalCollected).toFixed(2)}</TableCell>
                <TableCell>{col.intakeNo}</TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-0.5">
                    {col.status === "PUBLISHED" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-emerald-600"
                            onClick={() => onCopyUrl(col.slug)}
                            disabled={isPending}
                          >
                            {copiedSlug === col.slug ? (
                              <CheckIcon className="size-3.5 text-emerald-500" />
                            ) : (
                              <CopyIcon className="size-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Copy Payment URL</TooltipContent>
                      </Tooltip>
                    )}
                    {col.status === "PUBLISHED" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-purple-600"
                            onClick={() => onUnpublish(col.id)}
                            disabled={isPending}
                          >
                            <EyeOffIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Unpublish to Draft</TooltipContent>
                      </Tooltip>
                    )}
                    {col.status === "DRAFT" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-emerald-600"
                            onClick={() => onPublish(col.id)}
                            disabled={isPending}
                          >
                            <GlobeIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Publish</TooltipContent>
                      </Tooltip>
                    )}
                    {col.status !== "ARCHIVED" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-amber-600"
                            onClick={() => onArchive(col.id)}
                            disabled={isPending}
                          >
                            <ArchiveIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Archive</TooltipContent>
                      </Tooltip>
                    )}
                    {col.status === "ARCHIVED" && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-emerald-600"
                            onClick={() => onRestore(col.id)}
                            disabled={isPending}
                          >
                            <ArchiveRestoreIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Restore to Published</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-sky-600"
                        >
                          <Link href={`/admin/treasurer/payments?collectionId=${col.id}`}>
                            <ReceiptIcon className="size-3.5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">View Payments</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-destructive"
                          onClick={() => onDelete(col)}
                          disabled={isPending}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
