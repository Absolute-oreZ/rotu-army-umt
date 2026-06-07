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
  SECRETARY: "/admin/secretary/rank-holders",
  TREASURER: "/admin/treasurer/collections",
  MULTIMEDIA: "/admin/multimedia/portfolio",
  SPORTS: "/admin/sports/activities",
  WELFARE: "/admin/welfare/health",
  ACADEMIC: "/admin/academic/results",
} satisfies Record<AdminRole, string>;

export const ROLE_ROUTE_SEGMENTS: Record<
  Exclude<AdminRole, "OFFICER" | "INSTRUCTOR">,
  string
> = {
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  MULTIMEDIA: "multimedia",
  SPORTS: "sports",
  WELFARE: "welfare",
  ACADEMIC: "academic",
};

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

export function getAdminNotFoundBackLabel(role: AdminRole) {
  if (isFullAccessAdminRole(role)) {
    return "Back to dashboard";
  }

  return `Back to ${role.charAt(0)}${role.slice(1).toLowerCase()} dashboard`;
}

export function canAccessAdminModule(role: AdminRole, module: AdminModule) {
  if (isFullAccessAdminRole(role)) {
    return true;
  }

  return ROLE_MODULES[role].includes(module);
}

export function canAccessRoleGroup(role: AdminRole, group: string) {
  if (isFullAccessAdminRole(role)) {
    return true;
  }

  const segment = ROLE_ROUTE_SEGMENTS[role as keyof typeof ROLE_ROUTE_SEGMENTS];
  return segment === group;
}
