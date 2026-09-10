import { religiousActivities } from "@/db/schema";
import type { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

export const RELIGIOUS_ACTIVITIES_SORT_FIELD_MAP = {
  title: religiousActivities.title,
  type: religiousActivities.type,
  date: religiousActivities.recordDate,
} as const;

export type ReligiousActivitySortKey =
  keyof typeof RELIGIOUS_ACTIVITIES_SORT_FIELD_MAP;

export function buildReligiousActivitiesTableConfig(
  typeOptions: { value: string; label: string }[],
): TableConfig {
  const typeFilter: FilterColumn = {
    key: "type",
    label: "Type",
    type: "enum",
    options: typeOptions,
  };

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "date", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["title", "type", "date"],
    sortLabels: { title: "Title", type: "Type", date: "Date" },
    filterColumns: [
      typeFilter,
      { key: "date", label: "Date", type: "date" },
    ],
    copyableColumns: ["title", "location", "meetingLink"],
    pageSizeOptions: [10, 25, 50],
    editMode: "INLINE",
  };
}