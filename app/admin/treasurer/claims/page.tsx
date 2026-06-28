import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { claims, cadets, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import { signedStorageUrl } from "@/lib/supabase/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  buildEnumFilterClause,
  buildNumberFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildClaimsTableConfig,
  CLAIMS_SORT_FIELD_MAP,
} from "@/components/admin/treasurer/claims/table-config";
import { ClaimsPageClient } from "@/components/admin/treasurer/claims/claims-page-client";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(members.name, contains),
      ilike(claims.title, contains),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, claims.status));
  clauses.push(...buildNumberFilterClause(state.filters.amount, claims.amount));

  if (intakeScope !== null) {
    clauses.push(eq(claims.intakeId, intakeScope));
  }

  return clauses;
}

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "claims")) {
    notFound();
  }

  const raw = await searchParams;
  const config = buildClaimsTableConfig();
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, CLAIMS_SORT_FIELD_MAP);
  if (orderBy.length === 0) {
    orderBy.push(desc(claims.createdAt));
  }
  orderBy.push(desc(claims.id));

  const [countRow, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(claims)
      .innerJoin(members, eq(members.id, claims.memberId))
      .where(where),
    db
      .select({
        id: claims.id,
        title: claims.title,
        amount: claims.amount,
        receiptPath: claims.receiptPath,
        qrCodePath: claims.qrCodePath,
        description: claims.description,
        status: claims.status,
        fulfilledAt: claims.fulfilledAt,
        rejectedAt: claims.rejectedAt,
        createdAt: claims.createdAt,
        memberId: members.id,
        memberName: members.name,
        rank: members.rank,
        armyNo: members.armyNo,
        avatarPath: cadets.displayPhotoPath,
      })
      .from(claims)
      .innerJoin(members, eq(members.id, claims.memberId))
      .leftJoin(cadets, eq(cadets.memberId, claims.memberId))
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  const supabase = createSupabaseAdminClient();
  const claimsWithUrls = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      avatarUrl: r.avatarPath,
      receiptUrl: await signedStorageUrl(supabase, r.receiptPath),
      qrCodeUrl: await signedStorageUrl(supabase, r.qrCodePath),
      fulfilledAt: r.fulfilledAt ? r.fulfilledAt.toISOString() : null,
      rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  );

  return (
    <ClaimsPageClient
      searchParams={raw}
      claims={claimsWithUrls}
      totalCount={totalCount}
    />
  );
}
