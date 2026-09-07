import { CADET_RANKS, healthRecordMetrics, members, platoons } from "@/db/schema";
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

const BMI_RESULT_OPTIONS: FilterColumn = {
  key: "bmiResult",
  label: "BMI Result",
  type: "enum",
  options: [
    { value: "UNDERWEIGHT", label: "Underweight" },
    { value: "NORMAL", label: "Normal" },
    { value: "OVERWEIGHT", label: "Overweight" },
    { value: "OBESE", label: "Obese" },
  ],
};

export function buildMetricsTableConfig(
  intakeOptions?: IntakeOption[],
  platoonOptions?: IntakeOption[],
): TableConfig {
  const filterColumns: FilterColumn[] = [];
  if (intakeOptions && intakeOptions.length > 0) {
    filterColumns.push({
      key: "intakeNo",
      label: "Intake",
      type: "enum",
      options: intakeOptions,
    });
  }
  if (platoonOptions && platoonOptions.length > 0) {
    filterColumns.push({
      key: "platoon",
      label: "Platoon",
      type: "enum",
      options: platoonOptions,
    });
  }
  filterColumns.push(RANK_OPTIONS, BMI_RESULT_OPTIONS);
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "rank", direction: "asc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "name", "platoon", "age", "weight", "height", "bmi"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      name: "Name",
      platoon: "Platoon",
      age: "Age",
      weight: "Weight",
      height: "Height",
      bmi: "BMI",
    },
    filterColumns,
    copyableColumns: ["armyNo", "name"],
    pageSizeOptions: [25, 50, 100],
    editMode: "INLINE",
  };
}

export const METRICS_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  name: members.name,
  platoon: platoons.displayName,
  age: healthRecordMetrics.age,
  weight: healthRecordMetrics.weight,
  height: healthRecordMetrics.height,
  bmi: healthRecordMetrics.bmi,
} as const;
