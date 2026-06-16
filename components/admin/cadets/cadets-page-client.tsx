"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon, UserMinusIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CadetsTable, type CadetRow } from "./cadets-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddCadetDialog } from "./add-cadet-dialog";
import type { IntakeOption } from "./table-config";

type CadetsPageClientProps = {
  tab: string;
  searchParams: Record<string, string | string[] | undefined>;
  cadets: CadetRow[];
  totalCount: number;
  intakeOptions: IntakeOption[];
  intakeDialogOptions: { id: number; intakeNo: string }[];
};

export function CadetsPageClient({
  tab,
  searchParams,
  cadets,
  totalCount,
  intakeOptions,
  intakeDialogOptions,
}: CadetsPageClientProps) {
  const router = useRouter();

  const handleTabChange = useCallback(
    (value: string) => {
      const currentUrl = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();

      for (const [key, value_] of currentUrl) {
        nextParams.set(key, value_);
      }

      if (value === "active") {
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
    <AddCadetDialog
      trigger={
        <Button size="sm">
          <PlusIcon className="size-4" />
          Add Cadet
        </Button>
      }
      intakeOptions={intakeDialogOptions}
    />
  );

  return (
    <Tabs defaultValue="active" value={tab} onValueChange={handleTabChange}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cadets</h1>
        {tab === "active" && addButton}
      </div>

      <TabsList className="mb-4">
        <TabsTrigger value="active">
          <UsersIcon className="mr-1.5 size-3.5" />
          Active
        </TabsTrigger>
        <TabsTrigger value="inactive">
          <UserMinusIcon className="mr-1.5 size-3.5" />
          Inactive
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <CadetsTable
          cadets={cadets}
          searchParams={searchParams}
          totalCount={totalCount}
          intakeOptions={intakeOptions}
          intakeDialogOptions={intakeDialogOptions}
          prefix="a_"
        />
      </TabsContent>

      <TabsContent value="inactive">
        <CadetsTable
          cadets={cadets}
          searchParams={searchParams}
          totalCount={totalCount}
          intakeOptions={intakeOptions}
          intakeDialogOptions={intakeDialogOptions}
          prefix="i_"
        />
      </TabsContent>
    </Tabs>
  );
}
