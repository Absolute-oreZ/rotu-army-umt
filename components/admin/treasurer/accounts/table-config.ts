import { bankEnum, intakes, members, treasuryAccounts } from "@/db/schema";
import { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";

const BANK_OPTIONS = bankEnum.enumValues.map((b) => ({
  value: b,
  label: formatBank(b),
}));

export const ACCOUNTS_SORT_FIELD_MAP = {
  intakeNo: intakes.intakeNo,
  treasurerName: members.name,
  bankName: treasuryAccounts.bankName,
  accountNumber: treasuryAccounts.accountNumber,
} as const;

export function formatBank(bank: string) {
  return bank.split("_").join(" ");
}

export function buildAccountsTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [
    { key: "bankName", label: "Bank", type: "enum", options: BANK_OPTIONS },
  ];
  if (intakeOptions) {
    filterColumns.push({ key: "intakeNo", label: "Intake", type: "enum", options: intakeOptions });
  }

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "intakeNo", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["intakeNo", "treasurerName", "bankName", "accountNumber"],
    sortLabels: { treasurerName: "Account Holder", accountNumber: "Account No" },
    filterColumns,
    copyableColumns: ["treasurerName", "accountNumber", "duitNowId"],
    pageSizeOptions: [10, 25, 50],
  };
}