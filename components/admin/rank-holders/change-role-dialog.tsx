"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { AdminRole } from "@/lib/admin/roles";
import { ADMIN_ROLES } from "@/lib/admin/roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { changeAdminRole } from "@/app/admin/secretary/rank-holders/actions";

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

type AdminUser = {
  id: string;
  memberName: string;
  role: AdminRole;
};

export function ChangeRoleDialog({
  admin: target,
  open,
  onOpenChange,
}: {
  admin: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ChangeRoleFormContent
          key={target.id}
          admin={target}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function ChangeRoleFormContent({
  admin: target,
  onClose,
}: {
  admin: AdminUser;
  onClose: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableRoles = ADMIN_ROLES.filter((r) => r !== target.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit() {
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("adminUserId", target.id);
      formData.append("newRole", selectedRole);

      const result = await changeAdminRole(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to change role.");
      }
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change Role</DialogTitle>
        <DialogDescription>
          Change {target.memberName}&apos;s role from {ROLE_LABELS[target.role]} to a new role.
          This will recreate the admin record.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            New Role
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <span className={cn(!selectedRole && "text-muted-foreground")}>
                {selectedRole ? ROLE_LABELS[selectedRole] : "Select role"}
              </span>
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg z-50">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setDropdownOpen(false);
                      setError(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      selectedRole === role && "bg-muted font-medium",
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
            {error}
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !selectedRole}>
          {isPending ? "Changing..." : "Change Role"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
