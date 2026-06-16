"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dropAdminUser } from "@/app/admin/secretary/rank-holders/actions";

export function DropAdminDialog({
  adminUserId,
  adminName,
  open,
  onOpenChange,
}: {
  adminUserId: string;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DropAdminFormContent
          key={adminUserId}
          adminUserId={adminUserId}
          adminName={adminName}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function DropAdminFormContent({
  adminUserId,
  adminName,
  onClose,
}: {
  adminUserId: string;
  adminName: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("adminUserId", adminUserId);

      const result = await dropAdminUser(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to remove admin user.");
      }
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Remove Admin</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove {adminName} as an admin? They will
          lose all admin access immediately. This action can be reversed by
          adding them back later.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
          {error}
        </div>
      ) : null}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Removing..." : "Remove Admin"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
