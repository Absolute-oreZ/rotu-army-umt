export const ADMIN_ROLES = [
  "OFFICER",
  "INSTRUCTOR",
  "SECRETARY",
  "TREASURER",
  "MULTIMEDIA",
  "SPORTS",
  "WELFARE",
  "ACADEMIC",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const FULL_ACCESS_ADMIN_ROLES = ["OFFICER", "INSTRUCTOR"] as const;

export type AdminModule =
  | "dashboard"
  | "rank-holders"
  | "intakes"
  | "cadets"
  | "admin-users"
  | "collections"
  | "expenses"
  | "portfolio"
  | "stories"
  | "newsletters"
  | "activities"
  | "collaborations"
  | "health"
  | "accommodations"
  | "religion"
  | "results"
  | "timetables";

export const ADMIN_DEFAULT_ROUTES = {
  OFFICER: "/admin",
  INSTRUCTOR: "/admin",
  SECRETARY: "/admin/rank-holders",
  TREASURER: "/admin/collections",
  MULTIMEDIA: "/admin/portfolio",
  SPORTS: "/admin/activities",
  WELFARE: "/admin/health",
  ACADEMIC: "/admin/results",
} satisfies Record<AdminRole, string>;

const roleModules = {
  OFFICER: ["dashboard"],
  INSTRUCTOR: ["dashboard"],
  SECRETARY: ["rank-holders", "intakes", "cadets", "admin-users"],
  TREASURER: ["collections", "expenses"],
  MULTIMEDIA: ["portfolio", "stories", "newsletters"],
  SPORTS: ["activities", "collaborations"],
  WELFARE: ["health", "accommodations", "religion"],
  ACADEMIC: ["results", "timetables"],
} satisfies Record<AdminRole, AdminModule[]>;

export const ROLE_MODULES: Record<AdminRole, AdminModule[]> = roleModules;

export function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function isFullAccessAdminRole(role: AdminRole) {
  return FULL_ACCESS_ADMIN_ROLES.includes(role as (typeof FULL_ACCESS_ADMIN_ROLES)[number]);
}

export function getDefaultAdminRoute(role: AdminRole) {
  return ADMIN_DEFAULT_ROUTES[role];
}

export function canAccessAdminModule(role: AdminRole, module: AdminModule) {
  if (isFullAccessAdminRole(role)) {
    return true;
  }

  return ROLE_MODULES[role].includes(module);
}
