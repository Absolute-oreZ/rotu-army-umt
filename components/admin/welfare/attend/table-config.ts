import { attendRecords, CADET_RANKS, intakes, members } from "@/db/schema";
import type { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";

const RANK_OPTIONS: FilterColumn = {
  key: "rank",
  label: "Rank",
  type: "enum",
  options: CADET_RANKS.map((r) => ({
    value: r,
    label: r.replace(/_/g, " "),
  })),
};

const ATTEND_TYPE_OPTIONS: FilterColumn = {
  key: "attendType",
  label: "Attend Type",
  type: "enum",
  options: [
    { value: "B", label: "Attend B" },
    { value: "C", label: "Attend C" },
  ],
};

const DATE_FILTER: FilterColumn = { key: "date", label: "Date", type: "date" };

export function buildAttendTableConfig(
  sourceOptions: { value: string; label: string }[],
  intakeOptions?: IntakeOption[],
): TableConfig {
  const filterColumns: FilterColumn[] = [RANK_OPTIONS];
  if (intakeOptions && intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: intakeOptions,
    });
  }
  filterColumns.push(DATE_FILTER, ATTEND_TYPE_OPTIONS, {
    key: "source",
    label: "Source",
    type: "enum",
    options: sourceOptions,
  });

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "recordDate", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "name", "intakeNo", "recordDate", "attendType", "source"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      name: "Name",
      intakeNo: "Intake",
      recordDate: "Date",
      attendType: "Attend Type",
      source: "Source",
    },
    filterColumns,
    copyableColumns: ["armyNo", "name", "source"],
    pageSizeOptions: [10, 25, 50],
  };
}

export const ATTEND_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  name: members.name,
  intakeNo: intakes.intakeNo,
  recordDate: attendRecords.recordDate,
  attendType: attendRecords.attendType,
  source: attendRecords.source,
} as const;