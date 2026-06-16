"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntakesTable, type IntakeRow } from "./intakes-table";
import { AddIntakeDialog } from "./add-intake-dialog";

type IntakesPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  intakes: IntakeRow[];
  totalCount: number;
};

export function IntakesPageClient({
  searchParams,
  intakes,
  totalCount,
}: IntakesPageClientProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Intakes</h1>
        <AddIntakeDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" />
              Add Intake
            </Button>
          }
        />
      </div>
      <IntakesTable
        intakes={intakes}
        searchParams={searchParams}
        totalCount={totalCount}
      />
    </>
  );
}
