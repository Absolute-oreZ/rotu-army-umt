import { claims, members } from "@/db/schema";
import type { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "REJECTED", label: "Rejected" },
];

export function buildClaimsTableConfig(): TableConfig {
  const filterColumns: FilterColumn[] = [
    { key: "createdAt", label: "Created", type: "date" },
    { key: "status", label: "Status", type: "enum", options: STATUS_OPTIONS },
    { key: "amount", label: "Amount", type: "number" },
  ];

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "createdAt", direction: "desc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "memberName", "title", "amount", "status", "createdAt"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      memberName: "Cadet",
      title: "Title",
      amount: "Amount",
      status: "Status",
      createdAt: "Created",
    },
    filterColumns,
    copyableColumns: ["armyNo", "memberName", "title", "description"],
    pageSizeOptions: [25, 50, 100],
  };
}

export const CLAIMS_SORT_FIELD_MAP = {
  armyNo: members.armyNo,
  rank: members.rank,
  memberName: members.name,
  title: claims.title,
  amount: claims.amount,
  status: claims.status,
  createdAt: claims.createdAt,
} as const;
