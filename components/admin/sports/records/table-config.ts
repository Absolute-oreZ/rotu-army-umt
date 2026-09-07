import { apfaRecords, ukaRecords } from "@/db/schema";
import type { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";

const YEAR_FILTER: FilterColumn = { key: "year", label: "Year", type: "number" };

export function buildRecordsTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [YEAR_FILTER];
  if (intakeOptions && intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: intakeOptions,
    });
  }

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "recordDate", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["recordDate", "session", "year"],
    sortLabels: { recordDate: "Record Date", session: "Session", year: "Year" },
    filterColumns,
    pageSizeOptions: [10, 25, 50],
  };
}

export const RECORDS_SORT_FIELD_MAPS = {
  UKA: {
    recordDate: ukaRecords.recordDate,
    session: ukaRecords.session,
    year: ukaRecords.year,
  },
  APFA: {
    recordDate: apfaRecords.recordDate,
    session: apfaRecords.session,
    year: apfaRecords.year,
  },
} as const;