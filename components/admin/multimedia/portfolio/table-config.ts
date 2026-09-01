import { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";
import {
  frequentlyAskedQuestions,
  members,
  seeMoreLinks,
  testimonials,
} from "@/db/schema";

export interface FAQRow {
  id: number;
  webappContentId: number;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  translations: Record<string, { question: string; answer: string }>;
}

export interface SeeMoreRow {
  id: number;
  webappContentId: number;
  title: string;
  link: string;
  imagePath: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialRow {
  id: number;
  memberId: number;
  memberName: string;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  translations: Record<string, { content: string }>;
}

export const FAQ_SORT_FIELD_MAP = {
  sortOrder: frequentlyAskedQuestions.sortOrder,
  status: frequentlyAskedQuestions.status,
  createdAt: frequentlyAskedQuestions.createdAt,
} as const;

export const SEE_MORE_SORT_FIELD_MAP = {
  sortOrder: seeMoreLinks.sortOrder,
  status: seeMoreLinks.status,
  createdAt: seeMoreLinks.createdAt,
} as const;

export const TESTIMONIAL_SORT_FIELD_MAP = {
  sortOrder: testimonials.sortOrder,
  status: testimonials.status,
  createdAt: testimonials.createdAt,
  memberName: members.displayName,
} as const;

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

function statusFilter(): FilterColumn {
  return {
    key: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
    ],
  };
}

export function buildFAQTableConfig(): TableConfig {
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "sortOrder", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["sortOrder", "status", "createdAt"] as const,
    sortLabels: {
      sortOrder: "Sort Order",
      status: "Status",
      createdAt: "Created",
    },
    filterColumns: [statusFilter(), { key: "createdAt", label: "Created", type: "date" }],
    pageSizeOptions: [10, 25, 50],
    prefix: "faq_",
  };
}

export function buildSeeMoreTableConfig(): TableConfig {
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "sortOrder", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["sortOrder", "status", "createdAt"] as const,
    sortLabels: {
      sortOrder: "Sort Order",
      status: "Status",
      createdAt: "Created",
    },
    filterColumns: [statusFilter(), { key: "createdAt", label: "Created", type: "date" }],
    pageSizeOptions: [10, 25, 50],
    prefix: "sm_",
  };
}

export function buildTestimonialTableConfig(): TableConfig {
  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "sortOrder", direction: "asc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["sortOrder", "status", "createdAt", "memberName"] as const,
    sortLabels: {
      sortOrder: "Sort Order",
      status: "Status",
      createdAt: "Created",
      memberName: "Member",
    },
    filterColumns: [statusFilter(), { key: "createdAt", label: "Created", type: "date" }],
    pageSizeOptions: [10, 25, 50],
    prefix: "test_",
  };
}
