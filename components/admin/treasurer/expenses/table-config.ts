import { expenses, intakes } from "@/db/schema";
import type { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";

export const EXPENSES_SORT_FIELD_MAP = {
  intakeNo: intakes.intakeNo,
  title: expenses.title,
  amount: expenses.amount,
  createdAt: expenses.createdAt,
} as const;

export function buildExpensesTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [
    { key: "createdAt", label: "Created", type: "date" },
    { key: "amount", label: "Amount", type: "number" },
  ];

  if (intakeOptions) {
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
      sortRules: [{ columnKey: "createdAt", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["intakeNo", "title", "amount", "createdAt"],
    sortLabels: {
      intakeNo: "Intake",
      title: "Title",
      amount: "Amount",
      createdAt: "Created",
    },
    filterColumns,
    copyableColumns: ["title", "description"],
    pageSizeOptions: [10, 25, 50],
    prefix: "exp",
  };
}
