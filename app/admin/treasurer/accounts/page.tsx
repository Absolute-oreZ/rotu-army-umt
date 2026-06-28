import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { treasuryAccounts, intakes, adminUsers, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  IntakeOption,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildAccountsTableConfig,
  ACCOUNTS_SORT_FIELD_MAP,
} from "@/components/admin/treasurer/accounts/table-config";
import { AccountsPageClient } from "@/components/admin/treasurer/accounts/accounts-page-client";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(members.name, contains),
      sql`${treasuryAccounts.accountNumber}::text ILIKE ${prefix}`,
      sql`${treasuryAccounts.duitNowId}::text ILIKE ${prefix}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.bankName, treasuryAccounts.bankName));
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

  if (intakeScope !== null) {
    clauses.push(eq(treasuryAccounts.intakeId, intakeScope));
  }

  return clauses;
}

function buildBaseQuery() {
  return db
    .select({
      id: treasuryAccounts.id,
      intakeId: treasuryAccounts.intakeId,
      intakeNo: intakes.intakeNo,
      bankName: treasuryAccounts.bankName,
      accountNumber: treasuryAccounts.accountNumber,
      qrCodePath: treasuryAccounts.qrCodePath,
      duitNowId: treasuryAccounts.duitNowId,
      treasurerName: members.name,
      createdAt: treasuryAccounts.createdAt,
    })
    .from(treasuryAccounts)
    .innerJoin(intakes, eq(intakes.id, treasuryAccounts.intakeId))
    .innerJoin(adminUsers, eq(adminUsers.id, treasuryAccounts.treasurerId))
    .innerJoin(members, eq(members.id, adminUsers.memberId));
}

function buildCountQuery() {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(treasuryAccounts)
    .innerJoin(intakes, eq(intakes.id, treasuryAccounts.intakeId))
    .innerJoin(adminUsers, eq(adminUsers.id, treasuryAccounts.treasurerId))
    .innerJoin(members, eq(members.id, adminUsers.memberId));
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accounts")) {
    notFound();
  }

  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo, startYear: intakes.startYear })
    .from(intakes)
    .orderBy(sql`${intakes.startYear} DESC`);

  const intakeOptions: IntakeOption[] = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const intakeDialogOptions = intakeRows.map((i) => ({
    id: i.id,
    intakeNo: i.intakeNo,
  }));

  const config = buildAccountsTableConfig(
    intakeScope !== null ? undefined : intakeOptions,
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, ACCOUNTS_SORT_FIELD_MAP);
  orderBy.push(sql`${treasuryAccounts.id} ASC`);

  const [countRow, accountRows] = await Promise.all([
    buildCountQuery().where(where),
    buildBaseQuery()
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  return (
    <AccountsPageClient
      searchParams={raw}
      accounts={accountRows.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      totalCount={totalCount}
      intakeOptions={intakeDialogOptions}
      isAdminIntakeScoped={intakeScope !== null}
    />
  );
}
