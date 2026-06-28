import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  collections,
  collectionPayments,
  treasuryAccounts,
  intakes,
  adminUsers,
  members,
} from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import {
  buildEnumFilterClause,
  buildNumberFilterClause,
  IntakeOption,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
  type SortRule,
} from "@/lib/admin/table-search-params";
import {
  buildCollectionsTableConfig,
  COLLECTIONS_SORT_FIELD_MAP,
} from "@/components/admin/treasurer/collections/table-config";
import { CollectionsPageClient } from "@/components/admin/treasurer/collections/collections-page-client";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(collections.title, contains),
      ilike(collections.description, contains),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.purpose, collections.purpose));
  clauses.push(...buildEnumFilterClause(state.filters.status, collections.status));
  clauses.push(...buildNumberFilterClause(state.filters.amount, collections.amount));
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

  if (intakeScope !== null) {
    clauses.push(eq(collections.intakeId, intakeScope));
  }

  return clauses;
}

function buildOrderBy(sortRules: SortRule[]): SQL[] {
  const orderBy: SQL[] = [];
  for (const rule of sortRules) {
    const dirFn = rule.direction === "desc" ? desc : asc;
    switch (rule.columnKey) {
      case "paymentCount":
        orderBy.push(dirFn(sql`count(${collectionPayments.id})`));
        break;
      case "totalCollected":
        orderBy.push(dirFn(sql`coalesce(sum(${collectionPayments.amountPaid}), '0')::numeric`));
        break;
      default: {
        const field = COLLECTIONS_SORT_FIELD_MAP[rule.columnKey as keyof typeof COLLECTIONS_SORT_FIELD_MAP];
        if (field) orderBy.push(dirFn(field));
        break;
      }
    }
  }
  orderBy.push(desc(collections.id));
  return orderBy;
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    notFound();
  }

  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeOptions: IntakeOption[] = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const intakeDialogOptions = intakeRows.map((i) => ({
    id: i.id,
    intakeNo: i.intakeNo,
  }));

  const config = buildCollectionsTableConfig(
    intakeScope !== null ? undefined : intakeOptions,
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildOrderBy(state.sortRules);

  const [countRow, collectionRows, accounts] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(collections)
      .where(where),
    db
      .select({
        id: collections.id,
        title: collections.title,
        slug: collections.slug,
        purpose: collections.purpose,
        description: collections.description,
        amount: collections.amount,
        isFixedAmount: collections.isFixedAmount,
        isReceiptRequired: collections.isReceiptRequired,
        status: collections.status,
        paymentAccountId: collections.paymentAccountId,
        intakeId: collections.intakeId,
        intakeNo: intakes.intakeNo,
        paymentBankName: treasuryAccounts.bankName,
        paymentAccountNumber: treasuryAccounts.accountNumber,
        paymentCount: sql<number>`coalesce(count(${collectionPayments.id}), 0)::int`.as("payment_count"),
        totalCollected: sql<string>`coalesce(sum(${collectionPayments.amountPaid}), '0')`.as("total_collected"),
        createdAt: collections.createdAt,
      })
      .from(collections)
      .innerJoin(intakes, eq(intakes.id, collections.intakeId))
      .leftJoin(treasuryAccounts, eq(treasuryAccounts.id, collections.paymentAccountId))
      .leftJoin(collectionPayments, eq(collectionPayments.collectionId, collections.id))
      .where(where)
      .groupBy(collections.id, intakes.intakeNo, treasuryAccounts.bankName, treasuryAccounts.accountNumber)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db
      .select({
        id: treasuryAccounts.id,
        intakeId: treasuryAccounts.intakeId,
        bankName: treasuryAccounts.bankName,
        accountNumber: treasuryAccounts.accountNumber,
        treasurerName: members.name,
      })
      .from(treasuryAccounts)
      .innerJoin(adminUsers, eq(adminUsers.id, treasuryAccounts.treasurerId))
      .innerJoin(members, eq(members.id, adminUsers.memberId))
      .where(
        intakeScope !== null
          ? eq(treasuryAccounts.intakeId, intakeScope)
          : undefined,
      )
      .orderBy(desc(treasuryAccounts.createdAt)),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  return (
    <CollectionsPageClient
      searchParams={raw}
      collections={collectionRows.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
      totalCount={totalCount}
      accounts={accounts}
      intakeOptions={intakeDialogOptions}
      isAdminIntakeScoped={intakeScope !== null}
    />
  );
}
