"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRightLeftIcon, Trash2Icon, SearchIcon } from "lucide-react";
import type { AdminRole } from "@/lib/admin/roles";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/admin/rank-holders/role-badge";
import { ChangeRoleDialog } from "@/components/admin/rank-holders/change-role-dialog";
import { DropAdminDialog } from "@/components/admin/rank-holders/drop-admin-dialog";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  buildRankHoldersTableConfig,
  type IntakeOption,
} from "@/components/admin/rank-holders/table-config";

export type AdminUserRow = {
  id: string;
  email: string;
  role: AdminRole;
  memberName: string;
  memberRank: string;
  memberArmyNo: number;
  memberAvatarUrl: string | null;
  intakeNo: string | null;
};

type AdminUsersTableProps = {
  admins: AdminUserRow[];
  currentAdminId: string;
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  intakeOptions: IntakeOption[];
};

export function AdminUsersTable({
  admins,
  currentAdminId,
  searchParams,
  totalCount,
  intakeOptions,
}: AdminUsersTableProps) {
  const config = useMemo(
    () => buildRankHoldersTableConfig(intakeOptions),
    [intakeOptions],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const [changeRoleTarget, setChangeRoleTarget] = useState<AdminUserRow | null>(null);
  const [dropTarget, setDropTarget] = useState<AdminUserRow | null>(null);

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name, army no, email, or intake…"
        totalCount={totalCount}
        shownCount={admins.length}
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

      {admins.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No admin users yet."
              : "No admins match the current filters. Try clearing some."
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
                  <SortableHead
                    columnKey="role"
                    label="Role"
                    state={state}
                    onChange={update}
                  />
                  <TableHead className="pr-5 text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const isSelf = admin.id === currentAdminId;
                  return (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {admin.memberAvatarUrl ? (
                            <Image
                              src={admin.memberAvatarUrl}
                              alt=""
                              width={36}
                              height={36}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-[11px] font-semibold uppercase text-muted-foreground">
                              {getInitials(admin.memberName)}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {admin.memberArmyNo}
                      </TableCell>
                      <TableCell>{formatRank(admin.memberRank)}</TableCell>
                      <TableCell className="font-medium">
                        {admin.memberName}
                      </TableCell>
                      <TableCell>{admin.intakeNo ?? "-"}</TableCell>
                      <TableCell>
                        <RoleBadge role={admin.role} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-1">
                          {!isSelf && (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="hover:text-sky-600"
                                    onClick={() => setChangeRoleTarget(admin)}
                                    aria-label={`Change role for ${admin.memberName}`}
                                  >
                                    <ArrowRightLeftIcon className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Change role</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="hover:text-destructive"
                                    onClick={() => setDropTarget(admin)}
                                    aria-label={`Remove ${admin.memberName}`}
                                  >
                                    <Trash2Icon className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Remove admin</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {admins.map((admin) => {
              const isSelf = admin.id === currentAdminId;
              return (
                <div
                  key={admin.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="relative inline-flex size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {admin.memberAvatarUrl ? (
                        <Image
                          src={admin.memberAvatarUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs font-semibold uppercase text-muted-foreground">
                          {getInitials(admin.memberName)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {admin.memberName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatRank(admin.memberRank)} &middot; #{admin.memberArmyNo}{" "}
                        &middot; {admin.intakeNo ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <RoleBadge role={admin.role} />
                    {!isSelf && (
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-sky-600"
                              onClick={() => setChangeRoleTarget(admin)}
                              aria-label={`Change role for ${admin.memberName}`}
                            >
                              <ArrowRightLeftIcon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Change role</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-destructive"
                              onClick={() => setDropTarget(admin)}
                              aria-label={`Remove ${admin.memberName}`}
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Remove admin</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
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

      <ChangeRoleDialog
        admin={
          changeRoleTarget
            ? {
                id: changeRoleTarget.id,
                memberName: changeRoleTarget.memberName,
                role: changeRoleTarget.role,
              }
            : { id: "", memberName: "", role: "SECRETARY" }
        }
        open={!!changeRoleTarget}
        onOpenChange={(open) => {
          if (!open) setChangeRoleTarget(null);
        }}
      />

      <DropAdminDialog
        adminUserId={dropTarget?.id ?? ""}
        adminName={dropTarget?.memberName ?? ""}
        open={!!dropTarget}
        onOpenChange={(open) => {
          if (!open) setDropTarget(null);
        }}
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

function formatRank(rank: string) {
  return rank.replace(/_/g, " ");
}
