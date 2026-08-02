"use client";

import { useMemo, useState } from "react";
import { SearchIcon, EyeIcon, PencilIcon, ArrowRightLeftIcon } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { buildIntakesTableConfig, formatStatus } from "@/components/admin/secretary/intakes/table-config";
import { storageUrl } from "@/lib/supabase/storage-public";
import { IntakeDetailsSheet } from "./intake-details-sheet";
import { ChangeIntakeStatusDialog } from "./change-intake-status-dialog";

export type IntakeRow = {
  id: number;
  intakeNo: string;
  displayName: string;
  slug: string;
  status: string;
  startYear: number;
  tagLine: string | null;
  coverPhotoPath: string | null;
  patchPhotoPath: string | null;
  cadetCount: number;
};

type IntakesTableProps = {
  intakes: IntakeRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
};

export function IntakesTable({
  intakes,
  searchParams,
  totalCount,
}: IntakesTableProps) {
  const config = useMemo(
    () => buildIntakesTableConfig(),
    [],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const [detailsTarget, setDetailsTarget] = useState<{ intake: IntakeRow; mode: "view" | "edit" } | null>(null);
  const [statusTarget, setStatusTarget] = useState<IntakeRow | null>(null);

  const isDefault = isTableStateDefault(state, config);

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-600";
      case "ARCHIVED":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name or intake no…"
        totalCount={totalCount}
        shownCount={intakes.length}
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

      {intakes.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No intakes found."
              : "No intakes match the current filters. Try clearing some."
          }
          icon={<SearchIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <SortableHead
                    columnKey="intakeNo"
                    label="Intake No"
                    state={state}
                    onChange={update}
                  />
                  <SortableHead
                    columnKey="displayName"
                    label="Display Name"
                    state={state}
                    onChange={update}
                  />
                  <SortableHead
                    columnKey="startYear"
                    label="Start Year"
                    state={state}
                    onChange={update}
                  />
                  <TableHead>Status</TableHead>
                  <TableHead>Active Cadets</TableHead>
                  <TableHead className="pr-5 text-right w-35">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intakes.map((intake) => (
                  <TableRow key={intake.id}>
                    <TableCell>
                      {intake.patchPhotoPath ? (
                        <div className="relative size-8 overflow-hidden rounded-full border border-border">
                          <Image
                            src={storageUrl(intake.patchPhotoPath)}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
                          {intake.intakeNo.charAt(0)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {intake.intakeNo}
                    </TableCell>
                    <TableCell className="font-medium">
                      <CopyableValue value={intake.displayName} valueClassName="font-medium">
                        {intake.displayName}
                      </CopyableValue>
                    </TableCell>
                    <TableCell>{intake.startYear}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor(intake.status)}`}>
                        {formatStatus(intake.status)}
                      </span>
                    </TableCell>
                    <TableCell>{intake.cadetCount}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-emerald-600"
                              onClick={() => setDetailsTarget({ intake, mode: "view" })}
                              aria-label={`View details for ${intake.displayName}`}
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-sky-600"
                              onClick={() => setDetailsTarget({ intake, mode: "edit" })}
                              aria-label={`Edit ${intake.displayName}`}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-amber-500"
                              onClick={() => setStatusTarget(intake)}
                              aria-label={`Change status for ${intake.displayName}`}
                            >
                              <ArrowRightLeftIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Change Status</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {intakes.map((intake) => (
              <div key={intake.id} className="flex gap-3 rounded-lg border border-border p-4">
                {intake.patchPhotoPath ? (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border">
                    <Image src={storageUrl(intake.patchPhotoPath)} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                    {intake.intakeNo.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{intake.displayName}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeColor(intake.status)}`}>
                      {formatStatus(intake.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {intake.intakeNo} · {intake.startYear} · {intake.cadetCount} active cadets
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 hover:text-emerald-600" onClick={() => setDetailsTarget({ intake, mode: "view" })}>
                      <EyeIcon className="size-3.5" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 hover:text-sky-600" onClick={() => setDetailsTarget({ intake, mode: "edit" })}>
                      <PencilIcon className="size-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="hover:text-amber-500" onClick={() => setStatusTarget(intake)}>
                      <ArrowRightLeftIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination state={state} totalPages={totalPages} totalCount={totalCount} onChange={update} />
        </>
      )}

      {detailsTarget && (
        <IntakeDetailsSheet
          intakeId={detailsTarget.intake.id}
          initialMode={detailsTarget.mode}
          open={detailsTarget !== null}
          onOpenChange={(open) => { if (!open) setDetailsTarget(null); }}
        />
      )}

      {statusTarget && (
        <ChangeIntakeStatusDialog
          intake={statusTarget}
          open={statusTarget !== null}
          onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
        />
      )}
    </>
  );
}
