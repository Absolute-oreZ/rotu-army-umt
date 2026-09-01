import { asc, desc, inArray, notInArray, sql } from "drizzle-orm";
import type { Column, SQL, SQLWrapper } from "drizzle-orm";

export type FilterCondition = { operator: string; value: string };

export type SortRule = { columnKey: string; direction: "asc" | "desc" };

export type IntakeOption = { value: string; label: string };

export type FilterColumn =
  | { key: string; label: string; type: "enum"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "number" }
  | { key: string; label: string; type: "string" }
  | { key: string; label: string; type: "date" }
  | { key: string; label: string; type: "time" };

export type TableState = {
  q: string;
  sortRules: SortRule[];
  page: number;
  pageSize: number;
  filters: Record<string, FilterCondition[]>;
};

export type TableConfig = {
  defaults: TableState;
  sortKeys: string[];
  sortLabels?: Record<string, string>;
  filterColumns: FilterColumn[];
  copyableColumns?: string[];
  pageSizeOptions?: number[];
  prefix?: string;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

const DEFAULT_OPS: Record<FilterColumn["type"], string> = {
  enum: "in",
  number: "eq",
  string: "contains",
  date: "eq",
  time: "eq",
};

const VALID_OPS: Record<FilterColumn["type"], string[]> = {
  enum: ["in", "notIn"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte"],
  string: ["contains", "startsWith", "endsWith"],
  date: ["eq", "gt", "gte", "lt", "lte"],
  time: ["eq", "gt", "gte", "lt", "lte"],
};

export function takeString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function takeAll(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

export function buildEnumFilterClause(
  conditions: FilterCondition[] | undefined,
  column: Column,
): SQL[] {
  if (!conditions?.length) return [];
  const clauses: SQL[] = [];
  const inValues = conditions.filter((c) => c.operator === "in").map((c) => c.value);
  const notInValues = conditions.filter((c) => c.operator === "notIn").map((c) => c.value);
  if (inValues.length > 0) clauses.push(inArray(column, inValues));
  if (notInValues.length > 0) clauses.push(notInArray(column, notInValues));
  return clauses;
}

export function buildNumberFilterClause(
  conditions: FilterCondition[] | undefined,
  column: Column,
): SQL[] {
  if (!conditions?.length) return [];
  const clauses: SQL[] = [];

  for (const condition of conditions) {
    const value = Number(condition.value);
    if (!Number.isFinite(value)) continue;

    switch (condition.operator) {
      case "eq":
        clauses.push(sql`${column} = ${value}`);
        break;
      case "neq":
        clauses.push(sql`${column} != ${value}`);
        break;
      case "gt":
        clauses.push(sql`${column} > ${value}`);
        break;
      case "gte":
        clauses.push(sql`${column} >= ${value}`);
        break;
      case "lt":
        clauses.push(sql`${column} < ${value}`);
        break;
      case "lte":
        clauses.push(sql`${column} <= ${value}`);
        break;
    }
  }

  return clauses;
}

export function buildDateFilterClause(
  conditions: FilterCondition[] | undefined,
  column: Column,
): SQL[] {
  if (!conditions?.length) return [];
  const clauses: SQL[] = [];
  for (const condition of conditions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(condition.value)) continue;
    const value = condition.value;
    switch (condition.operator) {
      case "eq":
        clauses.push(sql`${column} >= ${value}::date AND ${column} < (${value}::date + interval '1 day')`);
        break;
      case "gt":
        clauses.push(sql`${column} >= (${value}::date + interval '1 day')`);
        break;
      case "gte":
        clauses.push(sql`${column} >= ${value}::date`);
        break;
      case "lt":
        clauses.push(sql`${column} < ${value}::date`);
        break;
      case "lte":
        clauses.push(sql`${column} < (${value}::date + interval '1 day')`);
        break;
    }
  }
  return clauses;
}

export function buildTimeFilterClause(
  conditions: FilterCondition[] | undefined,
  column: SQLWrapper,
): SQL[] {
  if (!conditions?.length) return [];
  const clauses: SQL[] = [];
  for (const condition of conditions) {
    const seconds = parseTimeFilterValue(condition.value);
    if (seconds == null) continue;
    const value = seconds;
    switch (condition.operator) {
      case "eq":
        clauses.push(sql`${column} = ${value}`);
        break;
      case "gt":
        clauses.push(sql`${column} > ${value}`);
        break;
      case "gte":
        clauses.push(sql`${column} >= ${value}`);
        break;
      case "lt":
        clauses.push(sql`${column} < ${value}`);
        break;
      case "lte":
        clauses.push(sql`${column} <= ${value}`);
        break;
    }
  }
  return clauses;
}

export function parseTimeFilterValue(value: string): number | null {
  const match = /^(\d+)m(\d+(\.\d+)?)s$/.exec(value.trim());
  if (match) {
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) return minutes * 60 + seconds;
  }
  const plain = Number(value);
  return Number.isFinite(plain) ? plain : null;
}

export function formatTimeFilterValue(value: string): string {
  const seconds = parseTimeFilterValue(value);
  if (seconds == null) return value;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m${remaining.toString().padStart(2, "0")}s`;
}

export function buildSortOrderBy<K extends string>(
  sortRules: SortRule[],
  fieldMap: Record<K, Column>,
): ReturnType<typeof asc>[] {
  return sortRules
    .map((rule) => {
      const field = fieldMap[rule.columnKey as K];
      const orderFn = rule.direction === "desc" ? desc : asc;
      return field ? orderFn(field) : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function parseTableSearchParams(
  raw: RawSearchParams,
  config: TableConfig,
): TableState {
  const { defaults, sortKeys, filterColumns } = config;
  const p = config.prefix ?? "";

  const qRaw = takeString(raw[`${p}q`])?.trim() ?? "";

  const sortRules: SortRule[] = [];
  const sortRaw = takeAll(raw[`${p}sort`]);
  for (const s of sortRaw) {
    const dotIndex = s.lastIndexOf(".");
    if (dotIndex === -1) continue;
    const columnKey = s.slice(0, dotIndex);
    const dir = s.slice(dotIndex + 1);
    if (!sortKeys.includes(columnKey)) continue;
    if (dir !== "asc" && dir !== "desc") continue;
    sortRules.push({ columnKey, direction: dir });
  }
  if (sortRules.length === 0) {
    sortRules.push(...defaults.sortRules);
  }

  const page = parsePositiveInt(takeString(raw[`${p}page`]), defaults.page);
  const pageSizeOptions = config.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const pageSizeRaw = parsePositiveInt(takeString(raw[`${p}pageSize`]), defaults.pageSize);
  const pageSize = pageSizeOptions.includes(pageSizeRaw)
    ? pageSizeRaw
    : defaults.pageSize;

  const filters: Record<string, FilterCondition[]> = {};

  for (const col of filterColumns) {
    const conditions: FilterCondition[] = [];
    const defaultOp = DEFAULT_OPS[col.type];
    const validOps = VALID_OPS[col.type];

    const defaultValues = takeAll(raw[`${p}${col.key}`]);
    for (const v of defaultValues) {
      if (col.type === "enum" && !col.options.some((o) => o.value === v)) continue;
      conditions.push({ operator: defaultOp, value: v });
    }

    for (const op of validOps) {
      if (op === defaultOp) continue;
      const values = takeAll(raw[`${p}${col.key}.${op}`]);
      for (const v of values) {
        if (col.type === "enum" && !col.options.some((o) => o.value === v)) continue;
        conditions.push({ operator: op, value: v });
      }
    }

    if (conditions.length > 0) {
      filters[col.key] = conditions;
    }
  }

  return { q: qRaw, sortRules, page, pageSize, filters };
}

export function tableStateToQueryString(state: TableState, config: TableConfig): string {
  const params = new URLSearchParams();
  const { defaults, filterColumns } = config;
  const p = config.prefix ?? "";

  if (state.q && state.q !== defaults.q) params.set(`${p}q`, state.q);

  const defaultRulesKey = JSON.stringify(defaults.sortRules);
  const currentRulesKey = JSON.stringify(state.sortRules);
  if (currentRulesKey !== defaultRulesKey) {
    for (const rule of state.sortRules) {
      params.append(`${p}sort`, `${rule.columnKey}.${rule.direction}`);
    }
  }

  if (state.page !== defaults.page) params.set(`${p}page`, String(state.page));
  if (state.pageSize !== defaults.pageSize)
    params.set(`${p}pageSize`, String(state.pageSize));

  for (const col of filterColumns) {
    const conditions = state.filters[col.key];
    if (!conditions?.length) continue;

    const defaultOp = DEFAULT_OPS[col.type];
    for (const cond of conditions) {
      const paramKey =
        cond.operator === defaultOp
          ? `${p}${col.key}`
          : `${p}${col.key}.${cond.operator}`;
      params.append(paramKey, cond.value);
    }
  }

  const str = params.toString();
  return str ? `?${str}` : "";
}

export function isTableStateDefault(state: TableState, config: TableConfig): boolean {
  if (state.q !== config.defaults.q) return false;
  if (JSON.stringify(state.sortRules) !== JSON.stringify(config.defaults.sortRules)) return false;
  if (state.page !== config.defaults.page) return false;
  if (state.pageSize !== config.defaults.pageSize) return false;
  for (const col of config.filterColumns) {
    const conds = state.filters[col.key];
    if (conds && conds.length > 0) return false;
  }
  return true;
}

export function escapeLikeWildcards(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export function wrapLikePattern(input: string, mode: "contains" | "prefix" = "contains"): string {
  const escaped = escapeLikeWildcards(input);
  return mode === "contains" ? `%${escaped}%` : `${escaped}%`;
}
