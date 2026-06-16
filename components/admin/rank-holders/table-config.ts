import { adminRoleEnum, adminUsers, CADET_RANKS, intakes, members } from "@/db/schema";
import type { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

export type IntakeOption = { value: string; label: string };

export const RANK_HOLDERS_ROLE_FILTER_OPTIONS: { value: string; label: string }[] =
  adminRoleEnum.enumValues.map((r) => ({
    value: r,
    label: r.charAt(0) + r.slice(1).toLowerCase().replace(/_/g, " "),
  }));

export const RANK_HOLDERS_RANK_FILTER_OPTIONS: { value: string; label: string }[] =
  CADET_RANKS.map((r) => ({
    value: r,
    label: r.replace(/_/g, " "),
  }));

export function buildRankHoldersTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const intakeColumn: FilterColumn = intakeOptions
    ? { key: "intakeNo", label: "Intake", type: "enum", options: intakeOptions }
    : { key: "intakeNo", label: "Intake", type: "string" };

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "rank", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["rank", "name", "armyNo", "intakeNo", "role"],
    sortLabels: { name: "Name", armyNo: "Army No" },
    filterColumns: [
      {
        key: "role",
        label: "Role",
        type: "enum",
        options: RANK_HOLDERS_ROLE_FILTER_OPTIONS,
      },
      {
        key: "rank",
        label: "Rank",
        type: "enum",
        options: RANK_HOLDERS_RANK_FILTER_OPTIONS,
      },
      intakeColumn,
    ],
    pageSizeOptions: [10, 25, 50],
  };
}

export const RANK_HOLDERS_TABLE_CONFIG: TableConfig = buildRankHoldersTableConfig();

export const RANK_HOLDERS_SORT_FIELD_MAP = {
  name: members.name,
  armyNo: members.armyNo,
  intakeNo: intakes.intakeNo,
  role: adminUsers.role,
} as const;

export type RankHoldersSortKey = keyof typeof RANK_HOLDERS_SORT_FIELD_MAP;
