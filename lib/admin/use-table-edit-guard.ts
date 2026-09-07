"use client";

import { useCallback, useState } from "react";
import type { TableState } from "@/lib/admin/table-search-params";

type UseTableEditGuardOptions = {
  update: (patch: Partial<TableState>) => void;
  hasUnsavedEdit: boolean;
  onDiscard: () => void;
};

export function useTableEditGuard({
  update,
  hasUnsavedEdit,
  onDiscard,
}: UseTableEditGuardOptions) {
  const [stashedUpdate, setStashedUpdate] = useState<Partial<TableState> | null>(null);

  const guardedUpdate = useCallback(
    (patch: Partial<TableState>) => {
      if (hasUnsavedEdit) {
        setStashedUpdate(patch);
        return;
      }
      update(patch);
    },
    [hasUnsavedEdit, update],
  );

  const confirmDiscard = useCallback(() => {
    onDiscard();
    if (stashedUpdate) update(stashedUpdate);
    setStashedUpdate(null);
  }, [onDiscard, stashedUpdate, update]);

  const dismissConfirm = useCallback(() => setStashedUpdate(null), []);

  return {
    guardedUpdate,
    confirmOpen: stashedUpdate !== null,
    confirmDiscard,
    dismissConfirm,
  };
}