import "server-only";
import { createHash } from "node:crypto";
import type { CurrentAdmin } from "@/lib/admin/rbac";
import type { AdminAICapability } from "@/lib/ai/admin/capabilities";
import { resolveAdminAICapability } from "@/lib/ai/admin/capabilities";
import { logAdminToolExecution } from "@/lib/ai/admin/audit";
import { executeCadetTool } from "@/lib/ai/admin/tools/cadets";
import { executeAcademicTool } from "@/lib/ai/admin/tools/academics";
import { executeIntakeTool } from "@/lib/ai/admin/tools/intakes";
import { executeSportsTool } from "@/lib/ai/admin/tools/sports";
import { executeWelfareTool } from "@/lib/ai/admin/tools/welfare";
import { executeTreasuryTool } from "@/lib/ai/admin/tools/treasurer";
import { executeOfficerTool } from "@/lib/ai/admin/tools/officers";
import { selectBestAdminTool } from "@/lib/ai/admin/tools/selection";

export type AdminAIToolName =
  | "get_cadet_statistics"
  | "get_academic_statistics"
  | "get_intake_statistics"
  | "get_sports_statistics"
  | "get_welfare_statistics"
  | "get_treasury_statistics"
  | "search_cadets"
  | "get_gpa_rankings"
  | "search_officers";

type ToolDefinition = {
  capability: AdminAICapability;
  name: AdminAIToolName;
  detect: RegExp;
  label: string;
};

const TOOLS: ToolDefinition[] = [
  {
    name: "search_cadets",
    capability: "ADMIN_CADET_READ",
    detect:
      /\b(search|find|lookup|list|show)\b.{0,35}\b(cadets?|members?|kadet)\b/i,
    label: "cadet search",
  },
  {
    name: "get_gpa_rankings",
    capability: "ADMIN_ACADEMIC_READ",
    detect:
      /\b(rankings?|top)\b.{0,30}\b(gpa|cgpa|students?|cadets?)\b|\b(gpa|cgpa)\b.{0,30}\b(rankings?|top)\b/i,
    label: "GPA rankings",
  },
  {
    name: "search_officers",
    capability: "ADMIN_OFFICER_READ",
    detect:
      /\b(search|find|lookup|list|show)\b.{0,35}\b(officers?|instructors?)\b/i,
    label: "officer search",
  },
  {
    name: "get_academic_statistics",
    capability: "ADMIN_ACADEMIC_READ",
    detect:
      /\b(gpa|cgpa|academic|academics|results?|grades?|keputusan|akademik)\b/i,
    label: "academic statistics",
  },
  {
    name: "get_sports_statistics",
    capability: "ADMIN_SPORTS_READ",
    detect: /\b(sports?|metrics?|uka|apfa|fitness|health metrics?)\b/i,
    label: "sports statistics",
  },
  {
    name: "get_welfare_statistics",
    capability: "ADMIN_WELFARE_READ",
    detect:
      /\b(welfare|attend(?:ance)?|absence|accommodation|kebajikan|kehadiran)\b/i,
    label: "welfare statistics",
  },
  {
    name: "get_treasury_statistics",
    capability: "ADMIN_TREASURY_READ",
    detect:
      /\b(treasury|finance|payments?|collections?|amount collected|kutipan|kewangan)\b/i,
    label: "treasury statistics",
  },
  {
    name: "get_intake_statistics",
    capability: "ADMIN_INTAKE_READ",
    detect: /\b(intakes?|ambilan)\b/i,
    label: "intake statistics",
  },
  {
    name: "get_cadet_statistics",
    capability: "ADMIN_CADET_READ",
    detect:
      /\b(how many|count|statistics|stats|total|active|inactive|jumlah|statistik|aktif)\b.{0,35}\b(cadets?|members?|kadet)\b|\b(cadets?|members?|kadet)\b.{0,35}\b(count|statistics|stats|total|active|inactive)\b/i,
    label: "cadet statistics",
  },
];

export function selectAdminTool(question: string) {
  if (
    /\b(profile|individual record|details)\b/i.test(question) &&
    !/\b(search|find|lookup|list|named|called)\b/i.test(question)
  )
    return null;
  return selectBestAdminTool(question, TOOLS);
}

async function executeTool(
  name: AdminAIToolName,
  intakeId: number | null,
  question: string,
): Promise<Record<string, number | string | null>> {
  const result =
    (await executeCadetTool(name, intakeId, question)) ??
    (await executeAcademicTool(name, intakeId)) ??
    (await executeIntakeTool(name, intakeId)) ??
    (await executeSportsTool(name, intakeId)) ??
    (await executeWelfareTool(name, intakeId)) ??
    (await executeTreasuryTool(name, intakeId)) ??
    (await executeOfficerTool(name, question));
  if (!result) throw new Error("Unknown admin AI tool");
  return result;
}

const TOOL_RESULT_FIELDS: Record<AdminAIToolName, readonly string[]> = {
  get_cadet_statistics: ["totalCadets", "activeCadets"],
  get_academic_statistics: ["resultRecords", "averageGpa", "averageCgpa"],
  get_intake_statistics: ["intakeCount", "activeCadetCounts"],
  get_sports_statistics: [
    "metricRecords",
    "averageBmi",
    "ukaSessions",
    "apfaSessions",
  ],
  get_welfare_statistics: ["attendanceRecords"],
  get_treasury_statistics: ["paymentRecords", "totalRecorded"],
  search_cadets: ["matches"],
  get_gpa_rankings: ["rankings"],
  search_officers: ["matches"],
};
const SAFE_ROW_FIELDS = new Set([
  "displayName",
  "name",
  "rank",
  "intake",
  "active",
  "role",
  "cgpa",
]);

function projectToolResult(
  name: AdminAIToolName,
  data: Record<string, number | string | null>,
) {
  const result: Record<string, number | string | null> = {};
  for (const field of TOOL_RESULT_FIELDS[name]) {
    const value = data[field];
    if (value === undefined) continue;
    if (
      (field === "matches" || field === "rankings") &&
      typeof value === "string" &&
      value.startsWith("[")
    ) {
      try {
        const rows = JSON.parse(value) as unknown;
        if (Array.isArray(rows)) {
          result[field] = JSON.stringify(
            rows.map((row) => {
              if (!row || typeof row !== "object" || Array.isArray(row))
                return {};
              return Object.fromEntries(
                Object.entries(row).filter(
                  ([key, entry]) =>
                    SAFE_ROW_FIELDS.has(key) &&
                    (typeof entry === "string" ||
                      typeof entry === "number" ||
                      typeof entry === "boolean" ||
                      entry === null),
                ),
              );
            }),
          );
          continue;
        }
      } catch {
        result[field] = "[]";
        continue;
      }
    }
    result[field] = value;
  }
  return result;
}

export async function runAdminTool(
  admin: CurrentAdmin,
  tool: ToolDefinition,
  intakeId: number | null,
  question: string,
) {
  const startedAt = Date.now();
  const capability = resolveAdminAICapability(admin, tool.capability);
  const requestHash = createHash("sha256")
    .update(`${tool.name}:${question.trim()}:${intakeId ?? "all"}`)
    .digest("hex");
  if (!capability.allowed) {
    await logAdminToolExecution({
      admin,
      intakeId,
      toolName: tool.name,
      capability: tool.capability,
      requestHash,
      resultRowCount: 0,
      durationMs: Date.now() - startedAt,
      status: "DENIED",
    });
    return { allowed: false as const, data: null };
  }
  try {
    const data = projectToolResult(
      tool.name,
      await executeTool(tool.name, intakeId, question),
    );
    const resultRowCount = Object.values(data).reduce<number>((max, value) => {
      if (typeof value === "string" && value.startsWith("[")) {
        try {
          return Math.max(max, (JSON.parse(value) as unknown[]).length);
        } catch {
          return max;
        }
      }
      return Math.max(max, 1);
    }, 0);
    await logAdminToolExecution({
      admin,
      intakeId,
      toolName: tool.name,
      capability: tool.capability,
      requestHash,
      resultRowCount,
      durationMs: Date.now() - startedAt,
      status: "SUCCESS",
    });
    return { allowed: true as const, data };
  } catch {
    await logAdminToolExecution({
      admin,
      intakeId,
      toolName: tool.name,
      capability: tool.capability,
      requestHash,
      resultRowCount: 0,
      durationMs: Date.now() - startedAt,
      status: "FAILED",
    });
    throw new Error("Admin AI tool failed");
  }
}

export function getAdminToolLabel(tool: ToolDefinition) {
  return tool.label;
}
