"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseTableSearchParams,
  tableStateToQueryString,
  type RawSearchParams,
  type TableConfig,
  type TableState,
} from "@/lib/admin/table-search-params";

type UseTableURLOptions = {
  searchParams: RawSearchParams;
  config: TableConfig;
  totalCount: number;
};

type UseTableURLResult = {
  state: TableState;
  update: (patch: Partial<TableState>) => void;
  reset: () => void;
  isPending: boolean;
  totalPages: number;
};

function deriveKey(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(raw).sort()) {
    const v = raw[key];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(key, item);
    } else {
      params.append(key, v);
    }
  }
  return params.toString();
}

export function useTableURL({
  searchParams,
  config,
  totalCount,
}: UseTableURLOptions): UseTableURLResult {
  const router = useRouter();
  const p = config.prefix ?? "";
  const managedKeys = useMemo(() => {
    const keys = new Set([`${p}q`, `${p}sort`, `${p}page`, `${p}pageSize`]);
    for (const col of config.filterColumns) {
      keys.add(`${p}${col.key}`);
    }
    for (const key of Object.keys(searchParams)) {
      if (key.startsWith(p)) {
        for (const col of config.filterColumns) {
          if (key === `${p}${col.key}` || key.startsWith(`${p}${col.key}.`)) {
            keys.add(key);
          }
        }
      }
    }
    return keys;
  }, [p, config.filterColumns, searchParams]);

  const baseState = useMemo(
    () => parseTableSearchParams(searchParams, config),
    [searchParams, config],
  );

  const [optimistic, setOptimistic] = useState<TableState | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const current = optimistic ?? baseState;

  const totalPages = Math.max(1, Math.ceil(totalCount / current.pageSize));

  const state: TableState = useMemo(() => {
    if (current.page > totalPages && totalCount > 0) {
      return { ...current, page: totalPages };
    }
    return current;
  }, [current, totalPages, totalCount]);

  const baseKey = useMemo(() => deriveKey(searchParams), [searchParams]);

  if (pendingKey && baseKey === pendingKey) {
    setOptimistic(null);
    setPendingKey(null);
  }

  const update = useCallback(
    (patch: Partial<TableState>) => {
      const base = optimistic ?? baseState;
      const next: TableState = { ...base, ...patch };

      if (patch.filters !== undefined) {
        next.filters = { ...patch.filters };
      }

      if (patch.sortRules !== undefined) {
        next.page = 1;
      }

      if ("pageSize" in patch && patch.pageSize !== base.pageSize) {
        next.page = 1;
      }

      const currentUrl = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();

      for (const [key, value] of currentUrl) {
        if (!managedKeys.has(key)) nextParams.append(key, value);
      }

      const tableQs = tableStateToQueryString(next, config);
      if (tableQs) {
        const tableParams = new URLSearchParams(tableQs.slice(1));
        for (const [key, value] of tableParams) {
          nextParams.append(key, value);
        }
      }

      const qs = nextParams.toString();
      const target = qs ? `?${qs}` : "";
      const targetKey = qs ? qs.slice(1) : "";

      if (targetKey !== baseKey) {
        router.push(`${window.location.pathname}${target}`, { scroll: false });
      }

      setOptimistic(next);
      setPendingKey(targetKey);
    },
    [optimistic, baseState, baseKey, config, managedKeys, router],
  );

  const reset = useCallback(() => {
    update({ ...config.defaults, filters: {} });
  }, [config.defaults, update]);

  return {
    state,
    update,
    reset,
    isPending: pendingKey !== null && baseKey !== pendingKey,
    totalPages,
  };
}
