import { academicResults, intakes, members } from "@/db/schema";
import { CADET_RANK_FILTER_OPTIONS, type FilterColumn, type IntakeOption, type TableConfig } from "@/lib/admin/table-search-params";

export function buildResultsTableConfig(options?: {
  intakeOptions?: IntakeOption[];
  prefix?: string;
}): TableConfig {
  const filterColumns: FilterColumn[] = [
    CADET_RANK_FILTER_OPTIONS,
    {
      key: "gpa",
      label: "GPA",
      type: "number",
    },
    {
      key: "cgpa",
      label: "CGPA",
      type: "number",
    },
  ];

  if (options?.intakeOptions && options.intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: options.intakeOptions,
    });
  }

  return {
    prefix: options?.prefix,
    defaults: {
      q: "",
      sortRules: [{ columnKey: "name", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["name", "armyNo", "rank", "gpa", "cgpa", "intakeNo"],
    sortLabels: {
      name: "Name",
      armyNo: "Army No",
      rank: "Rank",
      gpa: "GPA",
      cgpa: "CGPA",
      intakeNo: "Intake",
    },
    filterColumns,
    copyableColumns: ["armyNo", "name"],
    pageSizeOptions: [10, 25, 50],
  };
}

export const RESULTS_SORT_FIELD_MAP = {
  name: members.name,
  armyNo: members.armyNo,
  rank: members.rank,
  gpa: academicResults.gpa,
  cgpa: academicResults.cgpa,
  intakeNo: intakes.intakeNo,
} as const;
