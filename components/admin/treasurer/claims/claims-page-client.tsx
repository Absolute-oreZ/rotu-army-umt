"use client";

import { useState } from "react";
import { ClaimsTable, type Claim } from "@/components/admin/treasurer/claims/claims-table";
import { ClaimDetailSheet } from "@/components/admin/treasurer/claims/claim-detail-sheet";

type ClaimsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  claims: Claim[];
  totalCount: number;
};

export function ClaimsPageClient({
  searchParams,
  claims,
  totalCount,
}: ClaimsPageClientProps) {
  const [detail, setDetail] = useState<Claim | null>(null);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Claims</h1>
      </div>

      <ClaimsTable
        claims={claims}
        searchParams={searchParams}
        totalCount={totalCount}
        onView={(claim) => setDetail(claim)}
      />

      <ClaimDetailSheet
        claim={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </>
  );
}
