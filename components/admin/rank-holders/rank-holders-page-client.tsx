"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon, HistoryIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/rank-holders/admin-users-table";
import { AuditLogTable, type AuditLogRow } from "@/components/admin/rank-holders/audit-log-table";
import { AddAdminDialog } from "@/components/admin/rank-holders/add-admin-dialog";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";
import type { IntakeOption } from "@/components/admin/rank-holders/table-config";

export type EligibleMember = {
  id: number;
  name: string;
  personalEmail: string | null;
  eduEmail: string | null;
  avatarUrl: string | null;
};

type RankHoldersPageClientProps = {
  tab: string;
  searchParams: Record<string, string | string[] | undefined>;
  admins: AdminUserRow[];
  adminTotalCount: number;
  currentAdminId: string;
  eligibleMembers: EligibleMember[];
  intakeOptions: IntakeOption[];
  auditLogs: AuditLogRow[];
  auditTotalCount: number;
};

export function RankHoldersPageClient({
  tab,
  searchParams,
  admins,
  adminTotalCount,
  currentAdminId,
  eligibleMembers,
  intakeOptions,
  auditLogs,
  auditTotalCount,
}: RankHoldersPageClientProps) {
  const router = useRouter();

  const handleTabChange = useCallback(
    (value: string) => {
      const currentUrl = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();

      for (const [key, value_] of currentUrl) {
        nextParams.set(key, value_);
      }

      if (value === "admins") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", value);
      }

      const qs = nextParams.toString();
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const addButton = (
    <Button size="sm">
      <UserPlusIcon className="size-4" />
      Add Admin
    </Button>
  );

  return (
    <Tabs defaultValue="admins" value={tab} onValueChange={handleTabChange}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rank Holders</h1>
        {tab === "admins" && (
          <AddAdminDialog eligibleMembers={eligibleMembers} trigger={addButton} />
        )}
      </div>

      <TabsList className="mb-4">
        <TabsTrigger value="admins">
          <UsersIcon className="mr-1.5 size-3.5" />
          Admin Users
        </TabsTrigger>
        <TabsTrigger value="audit">
          <HistoryIcon className="mr-1.5 size-3.5" />
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="admins">
        <AdminUsersTable
          admins={admins}
          currentAdminId={currentAdminId}
          searchParams={searchParams}
          totalCount={adminTotalCount}
          intakeOptions={intakeOptions}
        />
      </TabsContent>

      <TabsContent value="audit">
        <AuditLogTable
          logs={auditLogs}
          searchParams={searchParams}
          totalCount={auditTotalCount}
        />
      </TabsContent>
    </Tabs>
  );
}
