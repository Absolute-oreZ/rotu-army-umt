"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";
import { deleteTreasuryAccount } from "@/app/admin/treasurer/accounts/actions";
import { formatBank } from "@/components/admin/treasurer/accounts/table-config";
import type { Account } from "@/components/admin/treasurer/accounts/accounts-table";

export function DeleteAccountDialog({
  account,
  error,
  onError,
  onOpenChange,
}: {
  account: Account | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!account) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("accountId", String(account.id));
      const result = await deleteTreasuryAccount(fd);
      if (result?.error) {
        onError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Treasury Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {account ? formatBank(account.bankName) : ""} account ({account?.accountNumber})? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && account && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
