import { adminRoleAuditLogs } from "@/db/schema";
import type { TableConfig } from "@/lib/admin/table-search-params";

export const AUDIT_LOG_TABLE_CONFIG: TableConfig = {
  prefix: "l_",
  defaults: {
    q: "",
    sortRules: [{ columnKey: "date", direction: "desc" }],
    page: 1,
    pageSize: 25,
    filters: {},
  },
  sortKeys: ["date"],
  sortLabels: { date: "Date" },
  filterColumns: [{ key: "date", label: "Date", type: "date" }],
  pageSizeOptions: [10, 25, 50],
};

export const AUDIT_LOG_SORT_FIELD_MAP = {
  date: adminRoleAuditLogs.createdAt,
} as const;

export type AuditLogSortKey = keyof typeof AUDIT_LOG_SORT_FIELD_MAP;
