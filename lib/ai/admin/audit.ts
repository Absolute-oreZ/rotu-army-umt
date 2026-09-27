import "server-only";
import { db } from "@/db";
import { aiToolExecutionLogs } from "@/db/schema";
import type { CurrentAdmin } from "@/lib/admin/rbac";
import type { AdminAICapability } from "@/lib/ai/admin/capabilities";
import type { AdminAIToolName } from "@/lib/ai/admin/tools/registry";

export async function logAdminToolExecution(input: {
  admin: CurrentAdmin;
  intakeId: number | null;
  toolName: AdminAIToolName;
  capability: AdminAICapability;
  requestHash: string;
  resultRowCount: number;
  durationMs: number;
  status: "SUCCESS" | "DENIED" | "FAILED";
}) {
  await db.insert(aiToolExecutionLogs).values({
    adminUserId: input.admin.id,
    role: input.admin.role,
    intakeId: input.intakeId,
    toolName: input.toolName,
    capability: input.capability,
    requestHash: input.requestHash,
    resultRowCount: input.resultRowCount,
    durationMs: input.durationMs,
    status: input.status,
  });
}
