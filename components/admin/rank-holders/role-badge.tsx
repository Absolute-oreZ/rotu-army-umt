import type { AdminRole } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<AdminRole, string> = {
  OFFICER: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  INSTRUCTOR: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  SECRETARY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  TREASURER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  MULTIMEDIA: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  SPORTS: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  WELFARE: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  ACADEMIC: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

const ROLE_LABELS: Record<AdminRole, string> = {
  OFFICER: "Officer",
  INSTRUCTOR: "Instructor",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  MULTIMEDIA: "Multimedia",
  SPORTS: "Sports",
  WELFARE: "Welfare",
  ACADEMIC: "Academic",
};

export function RoleBadge({
  role,
  className,
}: {
  role: AdminRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
