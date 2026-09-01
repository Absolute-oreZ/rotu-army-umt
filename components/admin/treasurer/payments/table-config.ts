import { collectionPayments, collections, members } from "@/db/schema";
import { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";

export function buildPaymentsTableConfig(collectionOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [
    { key: "paidAt", label: "Paid At", type: "date" },
    { key: "status", label: "Status", type: "enum", options: [
      { value: "PAID", label: "Paid" },
      { value: "UNPAID", label: "Unpaid" },
    ] },
    { key: "amountPaid", label: "Amount", type: "number" },
  ];
  if (collectionOptions) {
    filterColumns.push({ key: "collectionTitle", label: "Collection", type: "enum", options: collectionOptions });
  }

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "paidAt", direction: "desc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["armyNo", "rank", "memberName", "collectionTitle", "amountPaid", "paidAt"],
    sortLabels: {
      armyNo: "Army No",
      rank: "Rank",
      memberName: "Name",
      collectionTitle: "Collection",
      amountPaid: "Amount",
      paidAt: "Paid At",
    },
    filterColumns,
    copyableColumns: ["armyNo", "memberName"],
    pageSizeOptions: [25, 50, 100],
  };
}

export const PAYMENTS_SORT_FIELD_MAP = {
  memberName: members.name,
  armyNo: members.armyNo,
  rank: members.rank,
  collectionTitle: collections.title,
  amountPaid: collectionPayments.amountPaid,
  paidAt: collectionPayments.paidAt,
} as const;
