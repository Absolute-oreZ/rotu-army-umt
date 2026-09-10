import { accommodations, CADET_RANKS, intakes, members } from "@/db/schema";
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

const TYPE_OPTIONS: FilterColumn = {
  key: "type",
  label: "Accommodation Type",
  type: "enum",
  options: [
    { value: "HOSTEL", label: "Hostel" },
    { value: "RENTAL", label: "Rental" },
  ],
};

export function buildAccommodationsTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [RANK_OPTIONS];
  if (intakeOptions && intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: intakeOptions,
    });
  }
  filterColumns.push(TYPE_OPTIONS);

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "rank", direction: "asc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "name", "intakeNo", "type"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      name: "Name",
      intakeNo: "Intake",
      type: "Accommodation Type",
    },
    filterColumns,
    copyableColumns: ["armyNo", "name", "address"],
    pageSizeOptions: [25, 50, 100],
    editMode: "INLINE",
  };
}

export const ACCOMMODATIONS_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  name: members.name,
  intakeNo: intakes.intakeNo,
  type: accommodations.type,
} as const;