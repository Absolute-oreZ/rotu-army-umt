"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateAccommodation } from "@/app/admin/welfare/accommodations/actions";
import type { AccommodationRow } from "./accommodations-table";

export function EditAccommodationDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AccommodationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<"HOSTEL" | "RENTAL" | "">(row.type ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = type !== "";

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    const fd = new FormData();
    fd.set("cadetId", String(row.cadetId));
    fd.set("type", type);
    fd.set("address", address);

    startTransition(async () => {
      const result = await updateAccommodation(fd);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error ?? "Failed to save accommodation.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Accommodation</DialogTitle>
          <DialogDescription>
            {row.name} · #{row.armyNo}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Accommodation Type" required>
            <Select value={type} onValueChange={(v) => setType(v as "HOSTEL" | "RENTAL")}>
              <SelectTrigger>
                {type === "" ? "Select type" : type === "HOSTEL" ? "Hostel" : "Rental"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOSTEL">Hostel</SelectItem>
                <SelectItem value="RENTAL">Rental</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              placeholder="Address"
              disabled={isPending}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !formValid}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}