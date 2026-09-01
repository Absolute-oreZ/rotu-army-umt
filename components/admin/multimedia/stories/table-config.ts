import { events } from "@/db/schema";
import { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

export const STORIES_SORT_FIELD_MAP = {
  name: events.name,
  startDate: events.startDate,
  status: events.status,
  location: events.location,
} as const;

export type StoriesSortKey = keyof typeof STORIES_SORT_FIELD_MAP;

export function buildStoriesTableConfig(): TableConfig {
  const statusOptions: FilterColumn = {
    key: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
    ],
  };

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "startDate", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["name", "startDate", "status", "location"],
    sortLabels: { name: "Title", startDate: "Start Date", location: "Location" },
    filterColumns: [statusOptions, { key: "startDate", label: "Start Date", type: "date" }],
    copyableColumns: ["name", "location"],
    pageSizeOptions: [10, 25, 50],
  };
}

export function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
