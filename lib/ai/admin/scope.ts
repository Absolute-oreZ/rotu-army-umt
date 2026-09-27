import { isIntakeScopedRole, type AdminRole } from "@/lib/admin/roles";

export function resolveToolScope(admin: {
  id: string;
  role: AdminRole;
  intakeId: number | null;
}) {
  if (!isIntakeScopedRole(admin.role)) return null;
  if (admin.intakeId === null)
    throw new Error(
      `Invariant violated: intake-scoped admin ${admin.id} has no intake assignment.`,
    );
  return admin.intakeId;
}
