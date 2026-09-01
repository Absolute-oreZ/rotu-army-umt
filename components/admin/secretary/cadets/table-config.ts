import { CADET_RANKS, intakes, members, platoons } from "@/db/schema";
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

export function buildCadetsTableConfig(intakeOptions?: IntakeOption[], prefix?: string): TableConfig {
  const intakeColumn: FilterColumn = intakeOptions
    ? { key: "intakeNo", label: "Intake", type: "enum", options: intakeOptions }
    : { key: "intakeNo", label: "Intake", type: "string" };

  return {
    prefix,
    defaults: {
      q: "",
      sortRules: [{ columnKey: "rank", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["name", "armyNo", "rank", "intakeNo", "platoon"],
    sortLabels: { name: "Name", armyNo: "Army No", platoon: "Platoon" },
    filterColumns: [RANK_OPTIONS, intakeColumn],
    copyableColumns: ["armyNo", "name"],
    pageSizeOptions: [10, 25, 50],
  };
}

export const CADETS_TABLE_CONFIG: TableConfig = buildCadetsTableConfig();

export const CADETS_SORT_FIELD_MAP = {
  name: members.name,
  armyNo: members.armyNo,
  rank: members.rank,
  intakeNo: intakes.intakeNo,
  platoon: platoons.displayName,
} as const;

export type CadetsSortKey = keyof typeof CADETS_SORT_FIELD_MAP;

export const CADETS_RANK_FILTER_OPTIONS = RANK_OPTIONS.type === "enum"
  ? RANK_OPTIONS.options
  : [];

export function formatRank(rank: string) {
  return rank.replace(/_/g, " ");
}
