import { FilterColumn, IntakeOption, TableConfig } from "@/lib/admin/table-search-params";
import { collectionPurposeEnum, collections, intakes, publicationStatusEnum } from "@/db/schema";

const PURPOSE_OPTIONS = collectionPurposeEnum.enumValues.map((p) => ({
  value: p,
  label: formatPurpose(p),
}));

const STATUS_OPTIONS = publicationStatusEnum.enumValues.map((s) => ({
  value: s,
  label: s.charAt(0) + s.slice(1).toLowerCase(),
}));

export const COLLECTIONS_SORT_FIELD_MAP = {
  intakeNo: intakes.intakeNo,
  title: collections.title,
  purpose: collections.purpose,
  status: collections.status,
} as const;

export function formatPurpose(purpose: string) {
  return purpose.split("_").join(" ");
}

export function formatBank(bank: string) {
  return bank.split("_").join(" ");
}

export function buildCollectionsTableConfig(intakeOptions?: IntakeOption[]): TableConfig {
  const filterColumns: FilterColumn[] = [
    { key: "purpose", label: "Purpose", type: "enum", options: PURPOSE_OPTIONS },
    { key: "status", label: "Status", type: "enum", options: STATUS_OPTIONS },
    { key: "amount", label: "Amount", type: "number" },
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
    sortKeys: ["intakeNo", "title", "purpose", "status", "paymentCount", "totalCollected"],
    sortLabels: {
      title: "Title",
      paymentCount: "Payments",
      totalCollected: "Collected",
    },
    filterColumns,
    copyableColumns: ["title"],
    pageSizeOptions: [10, 25, 50],
  };
}