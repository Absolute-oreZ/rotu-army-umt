"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsTable, type Account } from "@/components/admin/treasurer/accounts/accounts-table";
import { AddAccountDialog } from "@/components/admin/treasurer/accounts/add-account-dialog";
import { AccountDetailsSheet } from "@/components/admin/treasurer/accounts/account-details-sheet";
import { DeleteAccountDialog } from "@/components/admin/treasurer/accounts/delete-account-dialog";
import { QrPreviewDialog } from "@/components/admin/treasurer/accounts/qr-preview-dialog";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

type AccountsPageClientPros = {
  searchParams: Record<string, string | string[] | undefined>;
  accounts: Account[];
  totalCount: number;
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
};

export function AccountsPageClient({
  searchParams,
  accounts,
  totalCount,
  intakeOptions,
  isAdminIntakeScoped,
}: AccountsPageClientPros) {
  const [detailTarget, setDetailTarget] = useState<{ account: Account | null; mode: "view" | "edit" }>({
    account: null,
    mode: "view",
  });
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Treasury Accounts</h1>
        <AddAccountDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              Add Account
            </Button>
          }
          intakeOptions={intakeOptions}
          isAdminIntakeScoped={isAdminIntakeScoped}
        />
      </div>

      <AccountsTable
        accounts={accounts}
        searchParams={searchParams}
        totalCount={totalCount}
        intakeOptions={intakeOptions}
        isAdminIntakeScoped={isAdminIntakeScoped}
        onView={(account) => {
          setError(null);
          setDetailTarget({ account, mode: "view" });
        }}
        onEdit={(account) => {
          setError(null);
          setDetailTarget({ account, mode: "edit" });
        }}
        onDelete={(account) => {
          setError(null);
          setDeleteTarget(account);
        }}
        onQrPreview={setQrPreview}
      />

      <AccountDetailsSheet
        key={detailTarget.account?.id ?? "none"}
        accountId={detailTarget.account?.id ?? null}
        initialMode={detailTarget.mode}
        open={!!detailTarget.account}
        onOpenChange={(open) => {
          if (!open) setDetailTarget({ account: null, mode: "view" });
        }}
      />

      <DeleteAccountDialog
        account={deleteTarget}
        error={error}
        onError={setError}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />

      <QrPreviewDialog
        url={qrPreview}
        onOpenChange={(open) => {
          if (!open) setQrPreview(null);
        }}
      />
    </>
  );
}