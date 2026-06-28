"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, EyeIcon, FileTextIcon, Loader2Icon, XCircleIcon } from "lucide-react";
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
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { buildClaimsTableConfig } from "@/components/admin/treasurer/claims/table-config";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { updateClaimStatus } from "@/app/admin/treasurer/claims/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";

export type Claim = {
  id: number;
  avatarUrl: string | null;
  rank: string;
  title: string;
  amount: string;
  receiptUrl: string | null;
  qrCodeUrl: string | null;
  description: string | null;
  status: string;
  fulfilledAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  memberId: number;
  memberName: string;
  armyNo: number;
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

type ClaimsTableProps = {
  claims: Claim[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  onView: (claim: Claim) => void;
};

export function ClaimsTable({
  claims,
  searchParams,
  totalCount,
  onView,
}: ClaimsTableProps) {
  const router = useRouter();
  const config = useMemo(() => buildClaimsTableConfig(), []);

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDefault = isTableStateDefault(state, config);
  const copyableColumns = new Set(config.copyableColumns ?? []);

  function handleStatusChange(claimId: number, status: "FULFILLED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("claimId", String(claimId));
      fd.set("status", status);
      const result = await updateClaimStatus(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by cadet or title..."
        totalCount={totalCount}
        shownCount={claims.length}
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

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <span>{error}</span>
        </div>
      ) : null}

      {claims.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No claims submitted yet."
              : "No claims match the current filters. Try clearing some."
          }
          icon={<FileTextIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={update} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={update} />
              <SortableHead columnKey="memberName" label="Name" state={state} onChange={update} />
              <SortableHead columnKey="title" label="Title" state={state} onChange={update} />
              <TableHead>Description</TableHead>
              <SortableHead columnKey="amount" label="Amount" state={state} onChange={update} />
              <SortableHead columnKey="status" label="Status" state={state} onChange={update} />
              <SortableHead columnKey="createdAt" label="Created" state={state} onChange={update} />
              <TableHead className="pr-5 text-right w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {c.avatarUrl ? (
                      <Image
                        src={c.avatarUrl}
                        alt={c.memberName}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[11px] font-semibold uppercase text-muted-foreground">
                        {getInitials(c.memberName)}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  <CopyableValue
                    value={copyableColumns.has("armyNo") ? c.armyNo : null}
                    valueClassName="font-mono tabular-nums"
                  >
                    {c.armyNo}
                  </CopyableValue>
                </TableCell>
                <TableCell>{formatRank(c.rank)}</TableCell>
                <TableCell className="font-medium">
                  <CopyableValue
                    value={copyableColumns.has("memberName") ? c.memberName : null}
                    valueClassName="font-medium"
                  >
                    {c.memberName}
                  </CopyableValue>
                </TableCell>
                <TableCell className="max-w-48">
                  <CopyableValue
                    value={copyableColumns.has("title") ? c.title : null}
                    valueClassName="truncate"
                  >
                    <span className="truncate">{c.title}</span>
                  </CopyableValue>
                </TableCell>
                <TableCell className="max-w-64">
                  <CopyableValue
                    value={copyableColumns.has("description") ? c.description : null}
                    valueClassName="truncate text-xs text-muted-foreground"
                  >
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {c.description ?? "—"}
                    </span>
                  </CopyableValue>
                </TableCell>
                <TableCell className="tabular-nums">
                  RM {Number(c.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_STYLES[c.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-emerald-600"
                          onClick={() => onView(c)}
                        >
                          <EyeIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">View details</TooltipContent>
                    </Tooltip>
                    {c.status === "PENDING" ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-emerald-600"
                              onClick={() => handleStatusChange(c.id, "FULFILLED")}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Fulfill</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-red-600"
                              onClick={() => handleStatusChange(c.id, "REJECTED")}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                <XCircleIcon className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Reject</TooltipContent>
                        </Tooltip>
                      </>
                    ) : null}
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
