"use client";

import { ArrowRightIcon, SearchIcon, UserPlusIcon, UserCheckIcon, UserMinusIcon } from "lucide-react";
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
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { AUDIT_LOG_TABLE_CONFIG } from "@/components/admin/rank-holders/audit-log-config";

type AuditAction = "ROLE_CHANGED" | "INVITED" | "ACCEPTED" | "DROPPED";

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  changedByName: string;
  targetName: string;
  oldRole: AdminRole | null;
  newRole: AdminRole | null;
  createdAt: string;
};

type AuditLogTableProps = {
  logs: AuditLogRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
};

export function AuditLogTable({
  logs,
  searchParams,
  totalCount,
}: AuditLogTableProps) {
  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config: AUDIT_LOG_TABLE_CONFIG,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, AUDIT_LOG_TABLE_CONFIG);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name..."
        totalCount={totalCount}
        shownCount={logs.length}
        state={state}
        onChange={update}
        onReset={reset}
        isDefault={isDefault}
      />

      {logs.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No audit events have been recorded yet."
              : "No logs match your search. Try clearing it."
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
                  <SortableHead
                    columnKey="date"
                    label="Date"
                    state={state}
                    onChange={update}
                  />
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.changedByName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.targetName}
                    </TableCell>
                    <TableCell>
                      <AuditEvent action={log.action} oldRole={log.oldRole} newRole={log.newRole} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt)}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-medium">{log.changedByName}</span>
                  {" "}
                  <AuditEventDescription action={log.action} targetName={log.targetName} />
                </p>
                <div className="mt-2">
                  <AuditEvent action={log.action} oldRole={log.oldRole} newRole={log.newRole} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={AUDIT_LOG_TABLE_CONFIG.pageSizeOptions}
        onChange={update}
      />
    </>
  );
}

function AuditEvent({
  action,
  oldRole,
  newRole,
}: {
  action: AuditAction;
  oldRole: AdminRole | null;
  newRole: AdminRole | null;
}) {
  switch (action) {
    case "ROLE_CHANGED":
      return (
        <div className="flex items-center gap-2">
          {oldRole && <RoleBadge role={oldRole} />}
          <ArrowRightIcon className="size-3.5 text-muted-foreground" />
          {newRole && <RoleBadge role={newRole} />}
        </div>
      );
    case "INVITED":
      return (
        <div className="flex items-center gap-2">
          <UserPlusIcon className="size-3.5 text-blue-500" />
          <span className="text-xs text-muted-foreground">Invited{newRole ? " as" : ""}</span>
          {newRole && <RoleBadge role={newRole} />}
        </div>
      );
    case "ACCEPTED":
      return (
        <div className="flex items-center gap-2">
          <UserCheckIcon className="size-3.5 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Accepted{newRole ? " as" : ""}</span>
          {newRole && <RoleBadge role={newRole} />}
        </div>
      );
    case "DROPPED":
      return (
        <div className="flex items-center gap-2">
          <UserMinusIcon className="size-3.5 text-red-500" />
          <span className="text-xs text-muted-foreground">Removed{oldRole ? " (was" : ""}</span>
          {oldRole && <RoleBadge role={oldRole} />}
          {oldRole && <span className="text-xs text-muted-foreground">)</span>}
        </div>
      );
  }
}

function AuditEventDescription({
  action,
  targetName,
}: {
  action: AuditAction;
  targetName: string;
}) {
  switch (action) {
    case "ROLE_CHANGED":
      return <>changed <span className="font-medium">{targetName}</span>&apos;s role</>;
    case "INVITED":
      return <>invited <span className="font-medium">{targetName}</span></>;
    case "ACCEPTED":
      return <><span className="font-medium">{targetName}</span> accepted invitation</>;
    case "DROPPED":
      return <>removed <span className="font-medium">{targetName}</span></>;
  }
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
