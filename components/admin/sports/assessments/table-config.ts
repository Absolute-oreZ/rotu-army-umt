import {
  CADET_RANKS,
  apfaRecordAssessments,
  members,
  platoons,
  ukaRecordAssessments,
} from "@/db/schema";
import { digitsOnly } from "@/lib/admin/form-helpers";
import type { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";
import type { AssessmentRecordType } from "@/lib/assessment/types";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { formatDuration } from "@/lib/utils";

export type AssessmentItemColumn = {
  key: string;
  label: string;
  unit: "count" | "metres" | "seconds";
};

export type AssessmentItemStandard = {
  unit: "count" | "metres" | "seconds";
  direction: "min" | "max";
  threshold: number;
};

const RANK_OPTIONS: FilterColumn = {
  key: "rank",
  label: "Rank",
  type: "enum",
  options: CADET_RANKS.map((r) => ({
    value: r,
    label: r.replace(/_/g, " "),
  })),
};

const RESULT_OPTIONS: FilterColumn = {
  key: "result",
  label: "Result",
  type: "enum",
  options: [
    { value: "PASS", label: "Pass" },
    { value: "FAIL", label: "Fail" },
  ],
};

export function getAssessmentItems(recordType: AssessmentRecordType): AssessmentItemColumn[] {
  if (recordType === "UKA") {
    return [
      { key: "pushUp", label: "Push-up", unit: "count" },
      { key: "sitUp", label: "Sit-up", unit: "count" },
      { key: "run", label: "2.4km Run", unit: "seconds" },
    ];
  }
  return [
    { key: "run", label: "1.6km Run", unit: "seconds" },
    { key: "pullUp", label: "Pull-up", unit: "count" },
    { key: "swimming", label: "Swimming", unit: "metres" },
    { key: "floating", label: "Floating", unit: "seconds" },
  ];
}

export function buildAssessmentsTableConfig(
  recordType: AssessmentRecordType,
  intakeOptions?: IntakeOption[],
  platoonOptions?: IntakeOption[],
): TableConfig {
  const items = getAssessmentItems(recordType);
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
  filterColumns.push(RANK_OPTIONS, RESULT_OPTIONS);
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "rank", direction: "asc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "name", "platoon", ...items.map((i) => i.key), "result"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      name: "Name",
      platoon: "Platoon",
      ...Object.fromEntries(items.map((i) => [i.key, i.label])),
      result: "Result",
    },
    filterColumns,
    copyableColumns: ["armyNo", "name"],
    pageSizeOptions: [25, 50, 100],
    editMode: "INLINE",
  };
}

export const UKA_ASSESSMENT_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  name: members.name,
  platoon: platoons.displayName,
  pushUp: ukaRecordAssessments.pushUp,
  sitUp: ukaRecordAssessments.sitUp,
  run: ukaRecordAssessments.runSeconds,
  result: ukaRecordAssessments.result,
} as const;

export const APFA_ASSESSMENT_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  name: members.name,
  platoon: platoons.displayName,
  run: apfaRecordAssessments.runSeconds,
  pullUp: apfaRecordAssessments.pullUp,
  swimming: apfaRecordAssessments.swimmingMetres,
  floating: apfaRecordAssessments.floatingSeconds,
  result: apfaRecordAssessments.result,
} as const;

export function itemPlaceholder(standard: AssessmentItemStandard | undefined): string {
  if (!standard) return "";
  const isTime = standard.unit === "seconds";
  const threshold = isTime ? formatDuration(standard.threshold) : String(standard.threshold);
  const sign = standard.direction === "min" ? "≥" : "≤";
  return `${sign} ${threshold}`;
}

export function sanitizeItemValue(unit: AssessmentItemColumn["unit"], value: string): string {
  return unit === "seconds" ? value.replace(/[^\d:]/g, "") : digitsOnly(value);
}

export function getInitialAssessmentValues(
  rowItems: Record<string, { value: number | null; pass: boolean | null }>,
  columns: AssessmentItemColumn[],
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const col of columns) {
    const item = rowItems[col.key];
    if (item && item.value !== null && item.value !== undefined) {
      initial[col.key] =
        col.unit === "seconds" ? formatDuration(item.value) : String(item.value);
    } else {
      initial[col.key] = "";
    }
  }
  return initial;
}