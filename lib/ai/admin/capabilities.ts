import type { CurrentAdmin } from "@/lib/admin/rbac";
import {
  canAccessAdminModule,
  type AdminModule,
  type AdminRole,
} from "@/lib/admin/roles";

export const ADMIN_AI_CAPABILITIES = {
  ADMIN_CADET_READ: "cadets",
  ADMIN_ACADEMIC_READ: "results",
  ADMIN_INTAKE_READ: "intakes",
  ADMIN_SPORTS_READ: "metrics",
  ADMIN_WELFARE_READ: "attend",
  ADMIN_TREASURY_READ: "payments",
  ADMIN_OFFICER_READ: "dashboard",
} as const satisfies Record<string, AdminModule>;

export type AdminAICapability = keyof typeof ADMIN_AI_CAPABILITIES;

export function adminAICapabilitiesForRole(role: AdminRole) {
  return (Object.keys(ADMIN_AI_CAPABILITIES) as AdminAICapability[]).filter(
    (capability) =>
      canAccessAdminModule(role, ADMIN_AI_CAPABILITIES[capability]),
  );
}

// Roles with no readable capability (currently MULTIMEDIA) must not be shown an
// assistant that could only ever answer "your role does not have access".
export function hasAdminAICapability(role: AdminRole) {
  return adminAICapabilitiesForRole(role).length > 0;
}

export function resolveAdminAICapability(
  admin: CurrentAdmin,
  capability: AdminAICapability,
) {
  const adminModule = ADMIN_AI_CAPABILITIES[capability];
  return canAccessAdminModule(admin.role, adminModule)
    ? { allowed: true as const, module: adminModule }
    : { allowed: false as const, module: adminModule };
}
