import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  collections,
  collectionPayments,
  members,
  cadets,
} from "@/db/schema";
import { getIntakeScope, requireAdminModule } from "@/lib/admin/rbac";
import { batchSignedStorageUrls } from "@/lib/supabase/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildSortOrderBy,
  IntakeOption,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
  type SortRule,
} from "@/lib/admin/table-search-params";
import {
  buildPaymentsTableConfig,
  PAYMENTS_SORT_FIELD_MAP,
} from "@/components/admin/treasurer/payments/table-config";
import { PaymentsPageClient } from "@/components/admin/treasurer/payments/payments-page-client";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
  collectionId: number | null,
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(members.name, contains),
      sql`${members.armyNo}::text ILIKE ${prefix}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.collectionTitle, collections.title));
  clauses.push(...buildDateFilterClause(state.filters.paidAt, collectionPayments.paidAt));

  const statusConditions = state.filters.status;
  if (statusConditions && statusConditions.length > 0) {
    const paidOnly = statusConditions.every((c) => c.value === "PAID");
    const unpaidOnly = statusConditions.every((c) => c.value === "UNPAID");
    if (paidOnly) clauses.push(sql`${collectionPayments.id} IS NOT NULL`);
    else if (unpaidOnly) clauses.push(sql`${collectionPayments.id} IS NULL`);
  }

  if (intakeScope !== null) {
    clauses.push(eq(cadets.intakeId, intakeScope));
  }

  clauses.push(eq(cadets.isActive, true));

  if (collectionId !== null) {
    clauses.push(eq(collections.id, collectionId));
  }

  return clauses;
}

function buildSort(sortRules: SortRule[]) {
  const mapped = {
    ...PAYMENTS_SORT_FIELD_MAP,
    rank: members.rank,
  } as const;

  const orderBy = buildSortOrderBy(sortRules, mapped);
  orderBy.push(asc(sql`${collectionPayments.id} IS NULL`));

  if (orderBy.length === 1) {
    orderBy.push(desc(collectionPayments.paidAt));
  }
  orderBy.push(desc(members.id));
  return orderBy;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("payments");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const rawCollectionId = takeString(raw.collectionId);
  const parsedCollectionId = rawCollectionId ? Number(rawCollectionId) : null;
  const collectionId =
    parsedCollectionId && Number.isInteger(parsedCollectionId) && parsedCollectionId > 0
      ? parsedCollectionId
      : null;

  // Get all collections visible to this admin (respecting intake scope)
  const intakeCollections = await db
    .select({
      id: collections.id,
      title: collections.title,
      amount: collections.amount,
      isFixedAmount: collections.isFixedAmount,
      intakeId: collections.intakeId,
    })
    .from(collections)
    .where(
      intakeScope !== null
        ? eq(collections.intakeId, intakeScope)
        : undefined,
    )
    .orderBy(desc(collections.createdAt));

  // Determine effective collection and validate intake ownership
  let effectiveCollectionId: number | null = null;
  let collectionIntakeId: number | null = null;

  if (collectionId !== null) {
    const selectedCollection = intakeCollections.find((c) => c.id === collectionId);
    if (selectedCollection) {
      effectiveCollectionId = selectedCollection.id;
      collectionIntakeId = selectedCollection.intakeId;
    }
  }

  const collectionOptions: IntakeOption[] = intakeCollections.map((c) => ({
    value: c.title,
    label: c.title,
  }));

  const config = buildPaymentsTableConfig(
    intakeCollections.length > 1 ? collectionOptions : undefined,
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope, effectiveCollectionId);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  let payments: {
    paymentId: number | null;
    collectionId: number;
    collectionTitle: string;
    memberId: number;
    memberName: string;
    armyNo: number;
    rank: string;
    displayPhotoPath: string | null;
    amountPaid: string | null;
    receiptPath: string | null;
    paidAt: Date | null;
  }[] = [];
  let totalCount = 0;

  if (effectiveCollectionId !== null) {
    const orderBy = buildSort(state.sortRules);

    const [countRow, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(cadets)
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(collections, eq(collections.id, effectiveCollectionId))
        .leftJoin(
          collectionPayments,
          and(
            eq(collectionPayments.memberId, members.id),
            eq(collectionPayments.collectionId, effectiveCollectionId),
          ),
        )
        .where(where),
      db
        .select({
          paymentId: collectionPayments.id,
          collectionId: collections.id,
          collectionTitle: collections.title,
          memberId: members.id,
          memberName: members.name,
          armyNo: members.armyNo,
          rank: members.rank,
          displayPhotoPath: cadets.displayPhotoPath,
          amountPaid: collectionPayments.amountPaid,
          receiptPath: collectionPayments.receiptPath,
          paidAt: collectionPayments.paidAt,
        })
        .from(cadets)
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(collections, eq(collections.id, effectiveCollectionId))
        .leftJoin(
          collectionPayments,
          and(
            eq(collectionPayments.memberId, members.id),
            eq(collectionPayments.collectionId, effectiveCollectionId),
          ),
        )
        .where(where)
        .orderBy(...orderBy)
        .limit(state.pageSize)
        .offset((state.page - 1) * state.pageSize),
    ]);

    totalCount = countRow[0]?.count ?? 0;
    payments = rows;
  }

  let summary: {
    total: number;
    paidCount: number;
    expectedCount: number;
    targetAmount: number | null;
    collectionTitle: string;
  } | null = null;

  if (effectiveCollectionId !== null) {
    const col = intakeCollections.find((c) => c.id === effectiveCollectionId);
    if (col) {
      const [summaryRow, cadetCountRow] = await Promise.all([
        db
          .select({
            total: sql<string>`coalesce(sum(${collectionPayments.amountPaid}), '0')`,
            paidCount: sql<number>`count(*)::int`,
          })
          .from(collectionPayments)
          .where(eq(collectionPayments.collectionId, effectiveCollectionId)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(cadets)
          .where(and(eq(cadets.intakeId, collectionIntakeId!), eq(cadets.isActive, true))),
      ]);
      const expectedCount = cadetCountRow[0]?.count ?? 0;
      summary = {
        total: Number(summaryRow[0]?.total ?? "0"),
        paidCount: summaryRow[0]?.paidCount ?? 0,
        expectedCount,
        targetAmount:
          col.isFixedAmount && col.amount
            ? Number(col.amount) * expectedCount
            : null,
        collectionTitle: col.title,
      };
    }
  }

  return (
    <PaymentsPageClient
      searchParams={raw}
      collectionId={effectiveCollectionId}
      collections={intakeCollections.map((c) => ({
        ...c,
        amount: c.amount ?? null,
      }))}
      payments={await mapPaymentsWithSignedReceipts(payments)}
      totalCount={totalCount}
      summary={summary}
    />
  );
}

async function mapPaymentsWithSignedReceipts(
  payments: {
    paymentId: number | null;
    collectionId: number;
    collectionTitle: string;
    memberId: number;
    memberName: string;
    armyNo: number;
    rank: string;
    displayPhotoPath: string | null;
    amountPaid: string | null;
    receiptPath: string | null;
    paidAt: Date | null;
  }[],
) {
  const supabase = createSupabaseAdminClient();
  
  // Batch sign all receipt URLs
  const receiptPaths = payments.map((p) => p.receiptPath);
  const receiptUrls = await batchSignedStorageUrls(supabase, receiptPaths, "document");

  return payments.map((p, index) => ({
    ...p,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    receiptUrl: receiptUrls[index],
  }));
}
