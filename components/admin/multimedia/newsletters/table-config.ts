import { newsletterCampaigns, newsletterSubscribers } from "@/db/schema";
import { FilterColumn, TableConfig } from "@/lib/admin/table-search-params";

export const NEWSLETTERS_SORT_FIELD_MAP = {
  subject: newsletterCampaigns.subject,
  status: newsletterCampaigns.status,
  scheduledAt: newsletterCampaigns.scheduledAt,
  sentAt: newsletterCampaigns.sentAt,
  createdAt: newsletterCampaigns.createdAt,
} as const;

export type NewslettersSortKey = keyof typeof NEWSLETTERS_SORT_FIELD_MAP;

export const SUBSCRIBERS_SORT_FIELD_MAP = {
  email: newsletterSubscribers.email,
  preferredLocale: newsletterSubscribers.preferredLocale,
  status: newsletterSubscribers.status,
  createdAt: newsletterSubscribers.createdAt,
} as const;

export type SubscribersSortKey = keyof typeof SUBSCRIBERS_SORT_FIELD_MAP;

export function buildNewslettersTableConfig(): TableConfig {
  const statusOptions: FilterColumn = {
    key: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "SENT", label: "Sent" },
      { value: "SENDING", label: "Sending" },
      { value: "FAILED", label: "Failed" },
    ],
  };

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "createdAt", direction: "desc" }],
      page: 1,
      pageSize: 10,
      filters: {},
    },
    sortKeys: ["subject", "status", "scheduledAt", "sentAt", "createdAt"],
    sortLabels: {
      subject: "Subject",
      status: "Status",
      scheduledAt: "Scheduled",
      sentAt: "Sent",
      createdAt: "Created",
    },
    filterColumns: [statusOptions],
    copyableColumns: ["subject"],
    pageSizeOptions: [10, 25, 50],
  };
}

export function buildSubscribersTableConfig(): TableConfig {
  const statusOptions: FilterColumn = {
    key: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "PENDING", label: "Pending" },
      { value: "ACTIVE", label: "Active" },
      { value: "UNSUBSCRIBED", label: "Unsubscribed" },
    ],
  };

  const localeOptions: FilterColumn = {
    key: "locale",
    label: "Locale",
    type: "enum",
    options: [
      { value: "en", label: "English" },
      { value: "ms", label: "Malay" },
      { value: "zh", label: "Chinese" },
      { value: "ta", label: "Tamil" },
    ],
  };

  return {
    defaults: {
      q: "",
      sortRules: [{ columnKey: "createdAt", direction: "desc" }],
      page: 1,
      pageSize: 25,
      filters: {},
    },
    sortKeys: ["email", "preferredLocale", "status", "createdAt"],
    sortLabels: {
      email: "Email",
      preferredLocale: "Locale",
      status: "Status",
      createdAt: "Subscribed",
    },
    filterColumns: [statusOptions, localeOptions],
    copyableColumns: ["email"],
    pageSizeOptions: [25, 50, 100],
  };
}

export function formatCampaignStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function campaignStatusClass(status: string) {
  return status === "SENT"
    ? "bg-emerald-100 text-emerald-800"
    : status === "SCHEDULED"
    ? "bg-amber-100 text-amber-800"
    : status === "FAILED"
    ? "bg-red-100 text-red-800"
    : status === "SENDING"
    ? "bg-sky-100 text-sky-800"
    : "bg-gray-100 text-gray-800";
}

export function formatSubscriberStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
