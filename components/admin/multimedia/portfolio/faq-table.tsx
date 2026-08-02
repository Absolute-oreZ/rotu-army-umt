"use client";

import { useMemo } from "react";
import { HelpCircleIcon, Trash2Icon, EyeIcon, PencilIcon, GlobeIcon, FilePenLineIcon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { useTableURL } from "@/lib/admin/use-table-url";
import { buildFAQTableConfig, type FAQRow } from "./table-config";

type Props = {
  faqs: FAQRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  onView: (faq: FAQRow) => void;
  onEdit: (faq: FAQRow) => void;
  onDelete: (faq: FAQRow) => void;
  onStatusChange: (faq: FAQRow, status: FAQRow["status"]) => void;
  onRevertToDraft: (faq: FAQRow) => void;
  isPending: boolean;
};

export function FAQTable({ faqs, searchParams, totalCount, onView, onEdit, onDelete, onStatusChange, onRevertToDraft, isPending }: Props) {
  const config = useMemo(() => buildFAQTableConfig(), []);
  const table = useTableURL({ searchParams, config, totalCount });
  const isDefault = isTableStateDefault(table.state, config);

  return (
    <div className="space-y-4">
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by question…"
        totalCount={totalCount}
        shownCount={faqs.length}
        state={table.state}
        onChange={table.update}
        onReset={table.reset}
        isDefault={isDefault}
      />
      <GlobalFilterBar
        filters={table.state.filters}
        sortRules={table.state.sortRules}
        filterColumns={config.filterColumns}
        sortKeys={config.sortKeys}
        sortLabels={config.sortLabels}
        onFilterUpdate={(filters) => table.update({ filters, page: 1 })}
        onSortUpdate={(sortRules) => table.update({ sortRules })}
      />
      {faqs.length === 0 ? (
        <Empty
          title="No FAQs found"
          description={isDefault ? "Create an FAQ to get started." : "No FAQs match the current filters."}
          icon={<HelpCircleIcon className="size-5 text-muted-foreground" />}
          action={!isDefault ? <Button variant="outline" size="sm" onClick={table.reset}>Reset filters</Button> : undefined}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question (EN)</TableHead>
                  <SortableHead columnKey="sortOrder" label="Sort" state={table.state} onChange={table.update} />
                  <SortableHead columnKey="status" label="Status" state={table.state} onChange={table.update} />
                  <SortableHead columnKey="createdAt" label="Created" state={table.state} onChange={table.update} />
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-xs truncate">
                      <CopyableValue value={faq.translations.en?.question ?? "—"}>
                        {faq.translations.en?.question ?? "—"}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>{faq.sortOrder}</TableCell>
                    <TableCell>
                      <StatusBadge status={faq.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(faq.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Actions status={faq.status} isPending={isPending} onStatusChange={() => onStatusChange(faq, faq.status === "DRAFT" ? "PUBLISHED" : faq.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED")} onRevertToDraft={() => onRevertToDraft(faq)} onView={() => onView(faq)} onEdit={() => onEdit(faq)} onDelete={() => onDelete(faq)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{faq.translations.en?.question ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Sort: {faq.sortOrder} · {faq.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Created: {new Date(faq.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => onView(faq)} aria-label="View FAQ">
                    <EyeIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => onEdit(faq)} aria-label="Edit FAQ">
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => onDelete(faq)} aria-label="Delete FAQ">
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination
        state={table.state}
        totalPages={table.totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={table.update}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
        status === "PUBLISHED"
          ? "bg-emerald-100 text-emerald-800"
          : status === "DRAFT"
          ? "bg-gray-100 text-gray-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {status}
    </span>
  );
}

function Actions({ status, isPending, onStatusChange, onRevertToDraft, onView, onEdit, onDelete }: { status: FAQRow["status"]; isPending: boolean; onStatusChange: () => void; onRevertToDraft: () => void; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={onStatusChange} disabled={isPending} aria-label="Change status">{status === "DRAFT" ? <GlobeIcon className="size-3.5" /> : status === "PUBLISHED" ? <ArchiveIcon className="size-3.5" /> : <ArchiveRestoreIcon className="size-3.5" />}</Button>
      {status === "PUBLISHED" ? <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700" onClick={onRevertToDraft} disabled={isPending} aria-label="Move FAQ to draft"><FilePenLineIcon className="size-3.5" /></Button> : null}
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-sky-500/10 hover:text-sky-700" onClick={onView} aria-label="View FAQ">
        <EyeIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700" onClick={onEdit} aria-label="Edit FAQ">
        <PencilIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={onDelete} aria-label="Delete FAQ">
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
