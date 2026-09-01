import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, adminInvitations, adminRoleAuditLogs, cadets, intakes, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildSortOrderBy,
  IntakeOption,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildRankHoldersTableConfig,
  RANK_HOLDERS_SORT_FIELD_MAP,
} from "@/components/admin/secretary/rank-holders/table-config";
import {
  AUDIT_LOG_TABLE_CONFIG,
  AUDIT_LOG_SORT_FIELD_MAP,
} from "@/components/admin/secretary/rank-holders/audit-log-config";
import { RankHoldersPageClient, type EligibleMember } from "@/components/admin/secretary/rank-holders/rank-holders-page-client";
import { CADET_RANKS } from "@/db/schema";

function buildAdminFilters(state: { q: string; filters: Record<string, FilterCondition[]> }, intakeScope: number | null): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(members.name, contains),
      ilike(adminUsers.email, contains),
      sql`${members.armyNo}::text ILIKE ${prefix}`,
      sql`${intakes.intakeNo}::text ILIKE ${prefix}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.role, adminUsers.role));
  clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

  if (intakeScope !== null) {
    clauses.push(eq(adminUsers.intakeId, intakeScope));
  }

  return clauses;
}

function buildAdminsBaseQuery() {
  return db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      role: adminUsers.role,
      memberName: members.name,
      memberRank: members.rank,
      memberArmyNo: members.armyNo,
      memberAvatarPath: members.redBgPhotoPath,
      intakeNo: intakes.intakeNo,
    })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .innerJoin(cadets, eq(cadets.memberId, members.id))
    .leftJoin(intakes, eq(intakes.id, cadets.intakeId));
}

function buildAdminsCountQuery() {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .innerJoin(cadets, eq(cadets.memberId, members.id))
    .leftJoin(intakes, eq(intakes.id, cadets.intakeId));
}

const changerAdminUsers = alias(adminUsers, "changer_admin_users");
const changerMembers = alias(members, "changer_members");
function buildAuditLogBaseQuery() {
  return db
    .select({
      id: adminRoleAuditLogs.id,
      action: adminRoleAuditLogs.action,
      changedByName: changerMembers.name,
      targetName: adminRoleAuditLogs.targetMemberName,
      oldRole: adminRoleAuditLogs.oldRole,
      newRole: adminRoleAuditLogs.newRole,
      createdAt: adminRoleAuditLogs.createdAt,
    })
    .from(adminRoleAuditLogs)
    .leftJoin(changerAdminUsers, eq(changerAdminUsers.authUserId, adminRoleAuditLogs.changedByAdminUserId))
    .leftJoin(changerMembers, eq(changerMembers.id, changerAdminUsers.memberId));
}

function buildAuditLogCountQuery() {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminRoleAuditLogs)
    .leftJoin(changerAdminUsers, eq(changerAdminUsers.authUserId, adminRoleAuditLogs.changedByAdminUserId))
    .leftJoin(changerMembers, eq(changerMembers.id, changerAdminUsers.memberId));
}

function buildAuditLogFilters(state: { q: string; filters: Record<string, FilterCondition[]> }): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(changerMembers.name, contains),
      ilike(adminRoleAuditLogs.targetMemberName, contains),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildDateFilterClause(state.filters.date, adminRoleAuditLogs.createdAt));

  return clauses;
}

export default async function RankHoldersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const tab = takeString(raw.tab) === "audit" ? "audit" : "admins";

  const intakeRows = await db
    .select({ intakeNo: intakes.intakeNo, startYear: intakes.startYear })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeOptions: IntakeOption[] = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const config = buildRankHoldersTableConfig(intakeOptions);
  const adminState = parseTableSearchParams(raw, config);
  const auditState = parseTableSearchParams(raw, AUDIT_LOG_TABLE_CONFIG);

  const adminFilterClauses = buildAdminFilters(adminState, intakeScope);
  const adminWhere = adminFilterClauses.length > 0 ? and(...adminFilterClauses) : undefined;

  const rankValues = CADET_RANKS;
  const whenClauses = rankValues.map((r, i) => sql`WHEN ${r} THEN ${i}`);
  const adminRankOrder = sql`CASE ${members.rank}::text ${sql.join(whenClauses, sql` `)} ELSE 999 END`;

  const adminOrderBy = buildSortOrderBy(adminState.sortRules, RANK_HOLDERS_SORT_FIELD_MAP);

  if (adminOrderBy.length === 0) {
    adminOrderBy.push(asc(adminRankOrder));
  }
  adminOrderBy.push(asc(adminUsers.id));

  const auditFilterClauses = buildAuditLogFilters(auditState);
  const auditOrderBy = buildSortOrderBy(auditState.sortRules, AUDIT_LOG_SORT_FIELD_MAP);

  if (auditOrderBy.length === 0) {
    auditOrderBy.push(desc(adminRoleAuditLogs.createdAt));
  }
  auditOrderBy.push(asc(adminRoleAuditLogs.id));

  const auditWhere = auditFilterClauses.length > 0 ? and(...auditFilterClauses) : undefined;

  let admins: Awaited<ReturnType<typeof buildAdminsBaseQuery>> = [];
  let adminTotalCount = 0;
  let auditLogs: Awaited<ReturnType<typeof buildAuditLogBaseQuery>> = [];
  let auditTotalCount = 0;
  let eligibleMembers: EligibleMember[] = [];

  if (tab === "admins") {
    const [adminCountRow, adminsRows, eligibleRows] = await Promise.all([
      buildAdminsCountQuery().where(adminWhere),
      buildAdminsBaseQuery()
        .where(adminWhere)
        .orderBy(...adminOrderBy)
        .limit(adminState.pageSize)
        .offset((adminState.page - 1) * adminState.pageSize),
      db
        .select({
          id: members.id,
          name: members.name,
          personalEmail: members.personalEmail,
          eduEmail: members.eduEmail,
          avatarPath: members.redBgPhotoPath,
        })
        .from(members)
        .innerJoin(cadets, eq(cadets.memberId, members.id))
        .leftJoin(adminUsers, eq(members.id, adminUsers.memberId))
        .leftJoin(
          adminInvitations,
          and(
            eq(members.id, adminInvitations.memberId),
            isNull(adminInvitations.acceptedAt),
          ),
        )
        .where(
          and(
            isNull(adminUsers.id),
            isNull(adminInvitations.id),
            intakeScope !== null ? eq(cadets.intakeId, intakeScope) : undefined,
          ),
        )
        .orderBy(members.name)
        .limit(500),
    ]);
    adminTotalCount = adminCountRow[0]?.count ?? 0;
    admins = adminsRows;
    eligibleMembers = eligibleRows;
  } else {
    const [auditCountRow, auditLogRows] = await Promise.all([
      buildAuditLogCountQuery().where(auditWhere),
      buildAuditLogBaseQuery()
        .where(auditWhere)
        .orderBy(...auditOrderBy)
        .limit(auditState.pageSize)
        .offset((auditState.page - 1) * auditState.pageSize),
    ]);
    auditLogs = auditLogRows;
    auditTotalCount = auditCountRow[0]?.count ?? 0;
  }

  return (
    <RankHoldersPageClient
      tab={tab}
      searchParams={raw}
      admins={admins}
      adminTotalCount={adminTotalCount}
      currentAdminId={admin.id}
      eligibleMembers={eligibleMembers}
      intakeOptions={intakeOptions}
      auditLogs={auditLogs.map((log) => ({
        ...log,
        changedByName: log.changedByName ?? "Unknown",
        oldRole: log.oldRole ?? null,
        newRole: log.newRole ?? null,
        createdAt: log.createdAt.toISOString(),
      }))}
      auditTotalCount={auditTotalCount}
    />
  );
}
