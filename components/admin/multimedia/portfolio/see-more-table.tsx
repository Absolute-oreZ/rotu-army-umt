"use client";

import { useMemo } from "react";
import { EyeIcon, LinkIcon, PencilIcon, Trash2Icon, GlobeIcon, FilePenLineIcon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
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
import { buildSeeMoreTableConfig, type SeeMoreRow } from "./table-config";

type Props = {
  links: SeeMoreRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  onView: (link: SeeMoreRow) => void;
  onEdit: (link: SeeMoreRow) => void;
  onDelete: (link: SeeMoreRow) => void;
  onStatusChange: (link: SeeMoreRow, status: SeeMoreRow["status"]) => void;
  onRevertToDraft: (link: SeeMoreRow) => void;
  isPending: boolean;
};

export function SeeMoreTable({ links, searchParams, totalCount, onView, onEdit, onDelete, onStatusChange, onRevertToDraft, isPending }: Props) {
  const config = useMemo(() => buildSeeMoreTableConfig(), []);
  const table = useTableURL({ searchParams, config, totalCount });
  const isDefault = isTableStateDefault(table.state, config);

  return (
    <div className="space-y-4">
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by title…"
        totalCount={totalCount}
        shownCount={links.length}
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
      {links.length === 0 ? (
        <Empty
          title="No links found"
          description={isDefault ? "Create a link to get started." : "No links match the current filters."}
          icon={<LinkIcon className="size-5 text-muted-foreground" />}
          action={!isDefault ? <Button variant="outline" size="sm" onClick={table.reset}>Reset filters</Button> : undefined}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <SortableHead columnKey="sortOrder" label="Sort" state={table.state} onChange={table.update} />
                  <SortableHead columnKey="status" label="Status" state={table.state} onChange={table.update} />
                  <SortableHead columnKey="createdAt" label="Created" state={table.state} onChange={table.update} />
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="max-w-xs truncate">
                      <CopyableValue value={link.title}>{link.title}</CopyableValue>
                    </TableCell>
                    <TableCell>{link.sortOrder}</TableCell>
                    <TableCell>
                      <StatusBadge status={link.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Actions status={link.status} isPending={isPending} onStatusChange={() => onStatusChange(link, link.status === "DRAFT" ? "PUBLISHED" : link.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED")} onRevertToDraft={() => onRevertToDraft(link)} onView={() => onView(link)} onEdit={() => onEdit(link)} onDelete={() => onDelete(link)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {links.map((link) => (
              <div key={link.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{link.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Sort: {link.sortOrder} · {link.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Created: {new Date(link.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => onView(link)} aria-label="View link">
                    <EyeIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => onEdit(link)} aria-label="Edit link">
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => onDelete(link)} aria-label="Delete link">
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

function Actions({ status, isPending, onStatusChange, onRevertToDraft, onView, onEdit, onDelete }: { status: SeeMoreRow["status"]; isPending: boolean; onStatusChange: () => void; onRevertToDraft: () => void; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={onStatusChange} disabled={isPending} aria-label="Change status">{status === "DRAFT" ? <GlobeIcon className="size-3.5" /> : status === "PUBLISHED" ? <ArchiveIcon className="size-3.5" /> : <ArchiveRestoreIcon className="size-3.5" />}</Button>
      {status === "PUBLISHED" ? <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700" onClick={onRevertToDraft} disabled={isPending} aria-label="Move link to draft"><FilePenLineIcon className="size-3.5" /></Button> : null}
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-sky-500/10 hover:text-sky-700" onClick={onView} aria-label="View link">
        <EyeIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700" onClick={onEdit} aria-label="Edit link">
        <PencilIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={onDelete} aria-label="Delete link">
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
