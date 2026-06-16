import { intakes } from "@/db/schema";
import type { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

const STATUS_OPTIONS: FilterColumn = {
  key: "status",
  label: "Status",
  type: "enum",
  options: [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
  ],
};

export function buildIntakesTableConfig(): TableConfig {
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "startYear", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["intakeNo", "displayName", "startYear"],
    sortLabels: { intakeNo: "Intake No", displayName: "Name", startYear: "Start Year" },
    filterColumns: [STATUS_OPTIONS],
    pageSizeOptions: [10, 25, 50],
  };
}

export const INTAKES_SORT_FIELD_MAP = {
  intakeNo: intakes.intakeNo,
  displayName: intakes.displayName,
  startYear: intakes.startYear,
} as const;

export type IntakesSortKey = keyof typeof INTAKES_SORT_FIELD_MAP;

export function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
