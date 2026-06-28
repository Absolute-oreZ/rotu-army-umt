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
import { toggleCadetActive } from "@/app/admin/secretary/cadets/actions";

export function ToggleCadetActiveDialog({
  cadetInfoId,
  cadetName,
  isActive,
  open,
  onOpenChange,
}: {
  cadetInfoId: number;
  cadetName: string;
  isActive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ToggleCadetActiveFormContent
          key={cadetInfoId}
          cadetInfoId={cadetInfoId}
          cadetName={cadetName}
          isActive={isActive}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function ToggleCadetActiveFormContent({
  cadetInfoId,
  cadetName,
  isActive,
  onClose,
}: {
  cadetInfoId: number;
  cadetName: string;
  isActive: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const desiredState = !isActive;

  function handleSubmit() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("cadetInfoId", String(cadetInfoId));
      formData.append("isActive", String(desiredState));

      const result = await toggleCadetActive(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update status.");
      }
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {desiredState ? "Activate" : "Deactivate"} Cadet
        </DialogTitle>
        <DialogDescription>
          {desiredState
            ? `Are you sure you want to activate ${cadetName}? They will be marked as an active cadet.`
            : `Are you sure you want to deactivate ${cadetName}? They will be marked as inactive.`}
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
        <Button
          variant={desiredState ? "default" : "destructive"}
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? desiredState
              ? "Activating..."
              : "Deactivating..."
            : desiredState
              ? "Activate"
              : "Deactivate"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
