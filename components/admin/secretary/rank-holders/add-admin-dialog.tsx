"use client";

import { useState, useTransition, useRef, useEffect, useMemo, type ReactNode } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import type { AdminRole } from "@/lib/admin/roles";
import { ADMIN_ROLES } from "@/lib/admin/roles";
import type { EligibleMember } from "@/components/admin/secretary/rank-holders/rank-holders-page-client";
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
import { addAdminUser } from "@/app/admin/secretary/rank-holders/actions";
import { Field } from "@/components/ui/field";

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

export function AddAdminDialog({
  eligibleMembers,
  trigger,
}: {
  eligibleMembers: EligibleMember[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const memberSearchRef = useRef<HTMLInputElement>(null);
  const roleSearchRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return eligibleMembers;
    const query = memberSearch.toLowerCase();
    return eligibleMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.personalEmail?.toLowerCase().includes(query) ||
        (m.eduEmail?.toLowerCase().includes(query) ?? false),
    );
  }, [eligibleMembers, memberSearch]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return ADMIN_ROLES;
    const query = roleSearch.toLowerCase();
    return ADMIN_ROLES.filter(
      (r) =>
        ROLE_LABELS[r].toLowerCase().includes(query) ||
        r.toLowerCase().includes(query),
    );
  }, [roleSearch]);

  const selectedMember = eligibleMembers.find((m) => m.id === selectedMemberId);

  function handleOpen() {
    setSelectedMemberId(null);
    setSelectedRole(null);
    setMemberSearch("");
    setRoleSearch("");
    setMemberDropdownOpen(false);
    setRoleDropdownOpen(false);
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setMemberDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit() {
    if (!selectedMemberId) {
      setError("Please select a member.");
      return;
    }
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("memberId", String(selectedMemberId));
      formData.append("role", selectedRole);

      const result = await addAdminUser(formData);

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to add admin user.");
      }
    });
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpen();
        }}
        className="inline-flex"
      >
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Select a member and assign a role. The person must have signed in via Google with their UMT account first.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <Field label="Member" required>
              <div className="relative" ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMemberDropdownOpen((v) => !v);
                    if (!memberDropdownOpen) {
                      setTimeout(() => memberSearchRef.current?.focus(), 50);
                    }
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedMember ? (
                      <>
                        <MemberAvatar
                          avatarUrl={selectedMember.avatarUrl}
                          name={selectedMember.name}
                          size={20}
                          textSize="text-[8px]"
                        />
                        <span className="truncate">{selectedMember.name}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Select member</span>
                    )}
                  </span>
                  <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>

                {memberDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg z-50">
                    <div className="border-b border-border p-2">
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2">
                        <SearchIcon className="size-3.5 text-muted-foreground" />
                        <input
                          ref={memberSearchRef}
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search by name or email..."
                          className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No members found
                        </div>
                      ) : (
                        filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setMemberDropdownOpen(false);
                              setMemberSearch("");
                              setError(null);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                              selectedMemberId === member.id && "bg-muted font-medium",
                            )}
                          >
                            <MemberAvatar
                              avatarUrl={member.avatarUrl}
                              name={member.name}
                              size={28}
                              textSize="text-[9px]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{member.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {member.eduEmail ?? member.personalEmail}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Role" required>
              <div className="relative" ref={roleDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen((v) => !v);
                    if (!roleDropdownOpen) {
                      setTimeout(() => roleSearchRef.current?.focus(), 50);
                    }
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className={cn(!selectedRole && "text-muted-foreground")}>
                    {selectedRole ? ROLE_LABELS[selectedRole] : "Select role"}
                  </span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg z-50">
                    <div className="border-b border-border p-2">
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2">
                        <SearchIcon className="size-3.5 text-muted-foreground" />
                        <input
                          ref={roleSearchRef}
                          type="text"
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                          placeholder="Search roles..."
                          className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredRoles.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No roles found
                        </div>
                      ) : (
                        filteredRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setSelectedRole(role);
                              setRoleDropdownOpen(false);
                              setRoleSearch("");
                              setError(null);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                              selectedRole === role && "bg-muted font-medium",
                            )}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </div>

          {error ? (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !selectedMemberId || !selectedRole}>
              {isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MemberAvatar({
  avatarUrl,
  name,
  size,
  textSize,
}: {
  avatarUrl: string | null;
  name: string;
  size: number;
  textSize: string;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-muted"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center font-semibold uppercase text-muted-foreground",
            textSize,
          )}
        >
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (parts[0]?.slice(0, 2) ?? "");
  return initials.toUpperCase();
}
