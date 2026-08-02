"use client";

import { useMemo } from "react";
import { CalendarIcon, MailIcon, UserMinusIcon, UserCheckIcon, Trash2Icon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { format } from "date-fns";
import {
  buildSubscribersTableConfig,
  formatSubscriberStatus,
} from "@/components/admin/multimedia/newsletters/table-config";

export type SubscriberRow = {
  id: string;
  email: string;
  preferredLocale: string;
  status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SubscribersTableProps = {
  subscribers: SubscriberRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  onResendConfirmation: (subscriber: SubscriberRow) => void;
  onStatusChange: (subscriber: SubscriberRow, status: "ACTIVE" | "UNSUBSCRIBED") => void;
  isPending: boolean;
  onDelete: (subscriber: SubscriberRow) => void;
};

export function SubscribersTable({
  subscribers,
  searchParams,
  totalCount,
  onResendConfirmation,
  onStatusChange,
  isPending,
  onDelete,
}: SubscribersTableProps) {
  const config = useMemo(() => buildSubscribersTableConfig(), []);

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <div className="mb-4">
        <TableToolbar
          showRefreshButton
          searchPlaceholder="Search by email…"
          totalCount={totalCount}
          shownCount={subscribers.length}
          state={state}
          onChange={update}
          onReset={reset}
          isDefault={isDefault}
        />
      </div>

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

      {subscribers.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No subscribers found."
              : "No subscribers match the current filters. Try clearing some."
          }
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead columnKey="email" label="Email" state={state} onChange={update} />
                  <SortableHead columnKey="preferredLocale" label="Locale" state={state} onChange={update} />
                  <SortableHead columnKey="status" label="Status" state={state} onChange={update} />
                  <SortableHead columnKey="createdAt" label="Subscribed" state={state} onChange={update} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <CopyableValue value={sub.email} valueClassName="font-medium">
                        {sub.email}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>
                      <span className="uppercase">{sub.preferredLocale}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : sub.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatSubscriberStatus(sub.status)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      <CopyableValue value={sub.createdAt} valueClassName="font-mono tabular-nums">
                        {format(new Date(sub.createdAt), "dd MMM yyyy")}
                      </CopyableValue>
                    </TableCell>
                    <TableCell><div className="flex justify-end gap-1">{sub.status === "PENDING" && <Button variant="ghost" size="icon-xs" disabled={isPending} title="Resend confirmation" onClick={() => onResendConfirmation(sub)}><MailIcon className="size-3.5" /></Button>}{sub.status === "ACTIVE" ? <Button variant="ghost" size="icon-xs" disabled={isPending} title="Unsubscribe" onClick={() => onStatusChange(sub, "UNSUBSCRIBED")}><UserMinusIcon className="size-3.5" /></Button> : sub.status === "UNSUBSCRIBED" && <Button variant="ghost" size="icon-xs" disabled={isPending} title="Reactivate" onClick={() => onStatusChange(sub, "ACTIVE")}><UserCheckIcon className="size-3.5" /></Button>}<Button variant="ghost" size="icon-xs" disabled={isPending} title="Delete subscriber" onClick={() => onDelete(sub)}><Trash2Icon className="size-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{sub.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatSubscriberStatus(sub.status)} · {sub.preferredLocale.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Confirmed: {sub.confirmedAt ? format(new Date(sub.confirmedAt), "dd MMM yyyy") : "—"}</p>
                  <p>Subscribed: {format(new Date(sub.createdAt), "dd MMM yyyy")}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
      <div className="border-t border-border pt-4">
        <Pagination state={state} totalPages={totalPages} totalCount={totalCount} pageSizeOptions={config.pageSizeOptions} onChange={update} />
      </div>
    </>
  );
}
