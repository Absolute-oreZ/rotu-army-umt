"use client";

import { useMemo } from "react";
import { EyeIcon, PencilIcon, Trash2Icon, WalletIcon } from "lucide-react";
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
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { storageUrl } from "@/lib/supabase/storage-client";
import {
  buildAccountsTableConfig,
  formatBank,
} from "@/components/admin/treasurer/accounts/table-config";

export type Account = {
  id: number;
  intakeId: number;
  intakeNo: string;
  bankName: string;
  accountNumber: number;
  qrCodePath: string | null;
  duitNowId: number | null;
  treasurerName: string;
  createdAt: string;
};

type AccountsTableProps = {
  accounts: Account[];
  searchParams: RawSearchParams;
  totalCount: number;
  intakeOptions: Array<{ id: number; intakeNo: string }>;
  isAdminIntakeScoped: boolean;
  onView: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onQrPreview: (url: string) => void;
};

export function AccountsTable({
  accounts,
  searchParams,
  totalCount,
  intakeOptions,
  isAdminIntakeScoped,
  onView,
  onEdit,
  onDelete,
  onQrPreview,
}: AccountsTableProps) {
  const config = useMemo(
    () => buildAccountsTableConfig(isAdminIntakeScoped ? undefined : intakeOptions.map((i) => ({ value: i.intakeNo, label: i.intakeNo }))),
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
        searchPlaceholder="Search accounts..."
        totalCount={totalCount}
        shownCount={accounts.length}
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

      {accounts.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No accounts yet. Add one to start collecting payments."
              : "No accounts match the current filters. Try clearing some."
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
              <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={update} />
              <SortableHead columnKey="treasurerName" label="Account Holder" state={state} onChange={update} />
              <SortableHead columnKey="bankName" label="Bank" state={state} onChange={update} />
              <SortableHead columnKey="accountNumber" label="Account No" state={state} onChange={update} />
              <TableHead>DuitNow</TableHead>
              <TableHead>QR</TableHead>
              <TableHead className="pr-5 text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.intakeNo}</TableCell>
                <TableCell>
                  <CopyableValue value={account.treasurerName} valueClassName="font-medium">
                    {account.treasurerName}
                  </CopyableValue>
                </TableCell>
                <TableCell className="font-medium">{formatBank(account.bankName)}</TableCell>
                <TableCell className="font-mono tabular-nums">
                  <CopyableValue value={account.accountNumber} valueClassName="font-mono tabular-nums">
                    {account.accountNumber}
                  </CopyableValue>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  <CopyableValue value={account.duitNowId} valueClassName="font-mono tabular-nums">
                    {account.duitNowId ?? "—"}
                  </CopyableValue>
                </TableCell>
                <TableCell>
                  {account.qrCodePath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={storageUrl(account.qrCodePath)!}
                      alt="QR code"
                      className="size-10 rounded border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onQrPreview(storageUrl(account.qrCodePath)!)}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-emerald-600"
                          onClick={() => onView(account)}
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
                          onClick={() => onEdit(account)}
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
                          className="hover:text-destructive"
                          onClick={() => onDelete(account)}
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
