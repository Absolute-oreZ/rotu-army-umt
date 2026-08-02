"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BanIcon, CheckCircleIcon, EyeIcon, PencilIcon, SearchIcon } from "lucide-react";
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
import { IntakeOption, isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ToggleCadetActiveDialog } from "@/components/admin/secretary/cadets/toggle-cadet-active-dialog";
import { CadetDetailsSheet } from "@/components/admin/secretary/cadets/cadet-details-sheet";
import {
  buildCadetsTableConfig,
  formatRank,
} from "@/components/admin/secretary/cadets/table-config";
import { storageUrl } from "@/lib/supabase/storage-public";

export type CadetRow = {
  cadetInfoId: number;
  armyNo: number;
  rank: string;
  name: string;
  avatarPath: string | null;
  intakeNo: string | null;
  isActive: boolean;
};

type IntakeDialogOption = { id: number; intakeNo: string };

type CadetsTableProps = {
  cadets: CadetRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  intakeOptions: IntakeOption[];
  intakeDialogOptions: IntakeDialogOption[];
  prefix?: string;
};

export function CadetsTable({
  cadets,
  searchParams,
  totalCount,
  intakeOptions,
  intakeDialogOptions,
  prefix,
}: CadetsTableProps) {
  const config = useMemo(
    () => buildCadetsTableConfig(intakeOptions, prefix),
    [intakeOptions, prefix],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const [toggleTarget, setToggleTarget] = useState<CadetRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<{ cadet: CadetRow; mode: "view" | "edit" } | null>(null);

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name or army no…"
        totalCount={totalCount}
        shownCount={cadets.length}
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

      {cadets.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No cadets found."
              : "No cadets match the current filters. Try clearing some."
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
                  <TableHead className="w-10" />
                  <SortableHead
                    columnKey="armyNo"
                    label="Army No"
                    state={state}
                    onChange={update}
                  />
                  <SortableHead
                    columnKey="rank"
                    label="Rank"
                    state={state}
                    onChange={update}
                  />
                  <SortableHead
                    columnKey="name"
                    label="Name"
                    state={state}
                    onChange={update}
                  />
                  <SortableHead
                    columnKey="intakeNo"
                    label="Intake"
                    state={state}
                    onChange={update}
                  />
                  <TableHead className="pr-5 text-right w-35">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cadets.map((cadet) => {
                  const avatarUrl = cadet.avatarPath ? storageUrl(cadet.avatarPath) : null;

                  return (
                    <TableRow key={cadet.cadetInfoId}>
                      <TableCell>
                        <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt=""
                              width={36}
                              height={36}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-[11px] font-semibold uppercase text-muted-foreground">
                              {getInitials(cadet.name)}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums">
                        <CopyableValue value={cadet.armyNo} valueClassName="font-mono tabular-nums">
                          {cadet.armyNo}
                        </CopyableValue>
                      </TableCell>
                      <TableCell>{formatRank(cadet.rank)}</TableCell>
                      <TableCell className="font-medium">
                        <CopyableValue value={cadet.name} valueClassName="font-medium">
                          {cadet.name}
                        </CopyableValue>
                      </TableCell>
                      <TableCell>{cadet.intakeNo ?? "-"}</TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="hover:text-emerald-600"
                                onClick={() => setDetailsTarget({ cadet, mode: "view" })}
                                aria-label={`View details for ${cadet.name}`}
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
                                onClick={() => setDetailsTarget({ cadet, mode: "edit" })}
                                aria-label={`Edit ${cadet.name}`}
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
                                className={cadet.isActive ? "hover:text-destructive" : "hover:text-emerald-600"}
                                onClick={() => setToggleTarget(cadet)}
                                aria-label={
                                  cadet.isActive
                                    ? `Deactivate ${cadet.name}`
                                    : `Activate ${cadet.name}`
                                }
                              >
                                {cadet.isActive ? (
                                  <BanIcon className="size-3.5" />
                                ) : (
                                  <CheckCircleIcon className="size-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {cadet.isActive ? "Deactivate" : "Activate"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {cadets.map((cadet) => {
              const avatarUrl = cadet.avatarPath ? storageUrl(cadet.avatarPath) : null;

              return (
                <div
                  key={cadet.cadetInfoId}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="relative inline-flex size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs font-semibold uppercase text-muted-foreground">
                          {getInitials(cadet.name)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cadet.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatRank(cadet.rank)} &middot; #{cadet.armyNo}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Intake: {cadet.intakeNo ?? "-"}</p>
                  </div>
                  <div className="mt-3 flex justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-emerald-600"
                          onClick={() => setDetailsTarget({ cadet, mode: "view" })}
                          aria-label={`View details for ${cadet.name}`}
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
                          onClick={() => setDetailsTarget({ cadet, mode: "edit" })}
                          aria-label={`Edit ${cadet.name}`}
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
                          className={cadet.isActive ? "hover:text-destructive" : "hover:text-emerald-600"}
                          onClick={() => setToggleTarget(cadet)}
                          aria-label={
                            cadet.isActive
                              ? `Deactivate ${cadet.name}`
                              : `Activate ${cadet.name}`
                          }
                        >
                          {cadet.isActive ? (
                            <BanIcon className="size-3.5" />
                          ) : (
                            <CheckCircleIcon className="size-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {cadet.isActive ? "Deactivate" : "Activate"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={update}
      />

      <ToggleCadetActiveDialog
        cadetInfoId={toggleTarget?.cadetInfoId ?? 0}
        cadetName={toggleTarget?.name ?? ""}
        isActive={toggleTarget?.isActive ?? true}
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
      />

      <CadetDetailsSheet
        cadetInfoId={detailsTarget?.cadet.cadetInfoId ?? null}
        initialMode={detailsTarget?.mode ?? "view"}
        open={!!detailsTarget}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
        intakeOptions={intakeDialogOptions}
      />
    </>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (parts[0]?.slice(0, 2) ?? "");
  return initials.toUpperCase();
}
