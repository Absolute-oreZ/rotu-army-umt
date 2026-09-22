# ROTU Army UMT Web Application Architecture

## 1. Purpose
This document describes the current and target technical architecture for the ROTU Army UMT web application.

It reflects:
- Current implementation in the repository.
- Project constraints and direction in `AGENTS.md`.
- Delivery status and roadmap in `TASKS.md`.

## 2. Architecture Summary
The system is a Next.js App Router application with two major surfaces:
- Public localized marketing website (`/[locale]/...`).
- Internal admin dashboard (`/admin/...`) with Supabase authentication and server-enforced RBAC.

Core platform choices:
- Framework: Next.js 16 App Router, React 19, TypeScript.
- Styling: Tailwind CSS 4, hand-built UI primitives in `components/ui`.
- Data access: Drizzle ORM + PostgreSQL.
- Identity: Supabase Auth (Google OAuth for admin sign-in).
- Storage: Supabase Storage paths/URLs for media assets.

## 3. High-Level Component View
### 3.1 Presentation Layer
- Route groups and layouts:
  - `app/page.tsx` and `app/layout.tsx` handle root-level redirect to default locale `/en`.
  - `app/[locale]` provides locale-aware root document, metadata base, and hosts all public pages directly (no intermediate `(public)` route group).
  - `app/admin` hosts admin pages with conditional sidebar shell (renders when authenticated, bare layout for login).
  - `app/admin/[role-group]` provides per-group RBAC-enforced layouts (secretary, treasurer, multimedia, sports, welfare, academic).
  - `app/cadet` hosts cadet pages with conditional sidebar shell (`CadetShell`). Login page renders bare; all other cadet routes get the authenticated shell with sidebar navigation and breadcrumbs.
- UI components:
  - Public components under `components/public`.
  - Shared primitives under `components/ui` (button, tabs, accordion, breadcrumb, separator, sheet, tooltip, sidebar).
  - Admin components under `components/admin` (admin-shell, admin-sidebar, admin-sidebar-nav, access-denied).
  - Cadet components under `components/cadet` (cadet-shell, cadet-sidebar, cadet-user-menu, claim-form, claims-list, payment-form).
  - Root theme/font document in `components/root-document.tsx`.

### 3.2 Application Layer
- i18n:
  - Locale config and type guards in `lib/i18n/config.ts`.
  - Dictionary loader in `lib/i18n/dictionaries.ts`.
  - Locale dictionaries in `lib/i18n/dictionaries/*`.
- Public content services:
  - `lib/public/content.ts` contains server-side read models for published intakes, events, and homepage content.
- Admin access control:
  - Role definitions and module maps in `lib/admin/roles.ts`.
  - Auth + admin identity + module authorization helpers in `lib/admin/rbac.ts`.
  - Navigation configuration and role-filtered menu items in `lib/admin/nav-config.ts`.

### 3.3 Data Layer
- Drizzle database client in `db/index.ts`.
- Schema definitions in `db/schema.ts`.
- SQL migrations under `db/migrations`.
- Seed tooling in `db/seed.ts` using curated default content from `lib/data.ts`.

### 3.4 External Services
- Supabase:
  - Browser/server/admin clients in `lib/supabase/*`.
  - Auth callback routes at `app/auth/callback/route.ts` (admin) and `app/auth/callback/cadet/route.ts` (cadet).
  - Storage uses two buckets: public (`NEXT_PUBLIC_SUPABASE_STORAGE_ROOT_PATH`) and private (`NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH`). Bucket routing is by first path segment via `resolveVisibility()`; every prefix not in `PUBLIC_STORAGE_PREFIXES` is private (fail-closed).
- PostgreSQL:
  - Accessed through `postgres` driver + Drizzle.

### 3.5 Admin Data-Table Infrastructure
A shared component system for admin list/table pages with server-side filtering, sorting, copy support and pagination.

**Server-side helpers** (`lib/admin/table-search-params.ts`):
- `parseTableSearchParams(raw, config)` — parses URL search params into a typed `TableState` (query, sort rules, page, page size, filter conditions).
- `buildEnumFilterClause(conditions, column)` — converts filter conditions to Drizzle `inArray`/`notInArray` SQL clauses.
- `buildNumberFilterClause(conditions, column)` — converts numeric conditions (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`) to SQL clauses.
- `buildDateFilterClause(conditions, column)` — converts date conditions (`eq`, `gt`, `gte`, `lt`, `lte`) to day-aware SQL clauses.
- `buildTimeFilterClause(conditions, column)` — converts time conditions (`eq`, `gt`, `gte`, `lt`, `lte`) to second-based SQL clauses; values accept `XmYs` or plain seconds.
- `parseTimeFilterValue(value)` — parses a time filter value (`"12m20s"` or `"690"`) into total seconds.
- `formatTimeFilterValue(value)` — formats a time filter value as `XmYs` for display in filter pills.
- `buildSortOrderBy(sortRules, fieldMap)` — maps sort rules to Drizzle `asc`/`desc` order-by expressions using a field map.
- `wrapLikePattern(input, mode)` / `escapeLikeWildcards(input)` — safe ILIKE pattern builders.
- `isTableStateDefault(state, config)` — checks if current state matches defaults (for reset button visibility).
- Config types: `TableConfig`, `TableState`, `SortRule`, `FilterColumn`, `FilterCondition`, `RawSearchParams`.

**Client-side hook** (`lib/admin/use-table-url.ts`):
- `useTableURL({ searchParams, config, totalCount })` — manages table state via URL params with optimistic updates. Returns `{ state, update, reset, isPending, totalPages }`.
- Preserves non-table URL params (e.g., `tab`, `collectionId`) when updating table state.
- Uses a `prefix` from `TableConfig` to namespace params (e.g., `p_q`, `p_sort` for payments tab).

**UI components** (`components/admin/data-table/*`):
- `TableToolbar` — search input with debounce, shown/total count, actions slot, reset button.
- `GlobalFilterBar` — active filter pills, filter builder trigger, sort control trigger.
- `FilterBuilder` — stepped UI for adding column/operator/value filter conditions.
- `FilterPill` — removable badge showing active filter with operator and values.
- `SortControl` — popover for managing multi-column sort rules with drag-reorder.
- `SortableHead` — table header cell with click-to-sort, direction indicator, and priority number.
- `CopyableValue` — inline value cell with hover-revealed click-to-copy button.
- `Pagination` — page size selector and prev/next navigation.

**Config pattern**: Each table page defines a `buildXTableConfig(options?)` function returning a `TableConfig` with defaults, sort keys, filter columns, page size options, and optional prefix. A companion `X_SORT_FIELD_MAP` maps sort keys to Drizzle column references. Tables may declare an optional `editMode` (`DIALOG` | `SHEET` | `INLINE`): `INLINE` tables render single-row inline editing on desktop (dialog fallback on mobile) and wrap every table-state change in an unsaved-changes confirmation while a row edit is active.

**Data flow**: Server page reads `searchParams` → `parseTableSearchParams` → SQL WHERE/ORDER BY/LIMIT/OFFSET → passes rows + `RawSearchParams` + `totalCount` to client. Client uses `useTableURL` for URL-driven state and shared components for UI.

**Usage**: Secretary rank-holders (admin users + audit log tabs), Secretary cadets, Treasurer accounts, Treasurer collections, Treasurer payments, Sports metrics, Sports assessment records, Sports assessments (UKA/APFA result entry), Academic courses (cadet courses + course management tabs), Academic results.

### 3.6 Admin Module Component Structure Convention
Admin list/entity pages must be split into small, single-purpose components under `components/admin/<module>/`. **Never** place a monolithic `client.tsx` directly under `app/admin/<role>/<page>/` — the server `page.tsx` is the only file that belongs there.

**Why this exists:** Earlier sessions created monolithic `client.tsx` files under `app/admin/treasurer/<page>/client.tsx` bundling the table, every dialog, every sheet, and state orchestration into one 500+ line component. That pattern was rejected and refactored to match the Secretary module structure below. Do not repeat the monolithic pattern.

**Canonical file layout per module** (every admin entity module follows this):

```
app/admin/<role>/<entity>/
  page.tsx                      # Server Component ONLY. Queries, auth, SQL, passes props.
  actions.ts                    # Server Actions (create/update/delete). Server-side only.

components/admin/<role>/<entity>/
  <entity>-page-client.tsx      # Orchestrator: manages dialog/sheet targets, error, etc.
  <entity>-table.tsx            # Data table with TableToolbar/GlobalFilterBar/SortableHead/CopyableColumn/Pagination.
  add-<entity>-dialog.tsx       # Self-contained create dialog (opens via trigger prop).
  <entity>-details-sheet.tsx    # Self-contained view & edit sheet (form state initialized from prop).
  delete-<entity>-dialog.tsx    # Self-contained delete confirmation dialog.
  <optional extras>.tsx         # e.g. qr-preview-dialog, change-role-dialog, toggle-active-dialog.
  table-config.ts               # buildXTableConfig() + X_SORT_FIELD_MAP for that entity's table.
```

**Responsibility boundaries:**

1. **`page.tsx` (Server Component)**
   - Calls `requireCurrentAdmin()`, `getIntakeScope()`, `canAccessAdminModule()`.
   - Builds filter/sort SQL with helpers from `lib/admin/table-search-params.ts`.
   - Runs count + paginated data query + any auxiliary queries (e.g., intake options) in `Promise.all`.
   - Serializes non-JSON-safe values (Date → ISO string) and passes them as props to the page-client.
   - Does **not** import React hooks, dialogs, or any `"use client"` code except the page-client.

2. **`<entity>-page-client.tsx` (Client Orchestrator)**
   - Owns all interactive state: `editTarget`, `deleteTarget`, other dialog targets, `error`.
   - Renders the table, all dialogs/sheets, and the page header with the "Add" button.
   - Uses **key-based remounting** for edit sheets: `<EditSheet key={target?.id ?? "none"} account={target} />`. This forces form state to reset when the target changes — do not use `useEffect` (triggers `react-hooks/set-state-in-effect` lint error) or `useRef` during render (triggers `react-hooks/refs` lint error).
   - Passes `onError={setError}` to delete dialogs so server errors propagate to the page-level error banner.

3. **`<entity>-table.tsx` (Client)**
   - Receives `accounts: Account[]`, `searchParams: RawSearchParams`, `totalCount: number`, and callback props (`onEdit`, `onDelete`, etc.).
   - Exports the row type (e.g., `export type Account = {...}`) used by sibling components.
   - Uses `useMemo(() => buildXTableConfig(...), [...deps])` + `useTableURL({ searchParams, config, totalCount })`.
   - Renders `TableToolbar`, `GlobalFilterBar`, `<Table>` with `SortableHead` headers, and `Pagination`.

4. **`add-<entity>-dialog.tsx` (Client, self-contained)**
   - Takes a `trigger: ReactNode` prop, renders `<div onClick={() => setOpen(true)}>{trigger}</div>`.
   - Owns its own form state, validation, `useTransition` for the server action call, and error display.
   - Calls the server action from `actions.ts` directly via `FormData`.
   - Resets form on close; does not lift state to the parent.

5. **`edit-<entity>-sheet.tsx` (Client, self-contained)**
   - Receives the entity as a prop (or `null` when closed) and an `onOpenChange` callback.
   - Form state is initialized with `useState(entity?.field ?? "")` — works correctly because the parent uses `key={entity?.id ?? "none"}` to remount.
   - Owns validation, transition, and error display.

6. **`delete-<entity>-dialog.tsx` (Client, self-contained)**
   - Receives the entity (or `null`), an `error` string for parent-managed error display, an `onError` callback, and `onOpenChange`.
   - Calls `onError(result.error)` when the server action fails — never silently drops errors.
   - Owns its own `useTransition`; the parent does not need to know about pending state.

7. **`table-config.ts`**
   - Exports `buildXTableConfig(options?): TableConfig` and `X_SORT_FIELD_MAP` (maps sort keys to Drizzle columns).
   - Exports any format helpers specific to the module (e.g., `formatBank`).
   - Uses a `prefix` (e.g., `p_`) when the page has multiple tables sharing URL params.

**Server actions (`app/admin/<role>/<entity>/actions.ts`)** live next to the page, not in `components/`. They are `"use server"` and return `{ success: true } | { success: false; error: string }` so callers can branch on success/failure.

**Shared form primitives** used across admin modules:
- `components/admin/cadets/cadet-form-fields.tsx` — exports `Field`, `Input` (custom wrapper with `onChange: (v: string) => void`), `Dropdown`, `FileField`, and constants (`RANK_OPTIONS`, `GENDER_OPTIONS`, `RELIGION_OPTIONS`, `RACE_OPTIONS`, `MIN_AGE`, `MAX_AGE`, `formatLabel`). Despite the path name, this is used by **multiple modules** (cadets, treasurer accounts, intakes) — do not duplicate these primitives.
- `components/ui/input.tsx` — the native `<input>` wrapper. Its `onChange` signature is the standard `React.ChangeEvent<HTMLInputElement>` (event-based, not string-based). When passing sanitizers like `digitsOnly` to this Input, wrap them: `onChange={(e) => setX(digitsOnly(e.target.value))}`. When passing to the custom `Input` from `cadet-form-fields`, pass directly: `onChange={(v) => setX(digitsOnly(v))}`.

**Anti-patterns to avoid:**
- Do not create `app/admin/<role>/<page>/client.tsx` monoliths.
- Do not lift dialog/sheet form state into the page-client — keep it self-contained in the dialog.
- Do not use `useEffect` to sync edit form state from props — use the key-remount pattern instead.
- Do not use `useRef` to adjust state during render.
- Do not silently drop `result.error` from server actions — always propagate via `onError` callback.
- Do not duplicate `Field`/`Input`/`Dropdown`/`FileField` — reuse from `cadet-form-fields.tsx`.

### 3.7 Shared Helper Functions (lib/)
Helper functions are organized by domain. **Always check here before writing inline logic** — the pattern may already exist. When adding a new helper, also update this section and the registry below (or run the `update-helpers-doc` skill).

**`lib/admin/form-helpers.ts`** — Form data extraction and input sanitization:
- `takeString(value)` — extracts a trimmed string from `FormDataEntryValue`, or `null` if empty/missing.
- `takeNumber(value)` — extracts a finite `number` from `FormDataEntryValue`, or `null`.
- `takeFile(value)` — extracts a non-empty `File` from `FormDataEntryValue`, or `null`.
- `getFileExtension(file)` — returns the lowercase extension (defaults to `"jpg"`).
- `digitsOnly(value)` — strips every non-digit character. Use as an `onChange` sanitizer for numeric-only fields (army no, account no, DuitNow ID).
- `currencyOnly(value)` — keeps digits and at most one decimal point, stripping everything else and dropping leading zeros (e.g. `"007.5"` → `"7.5"`). Use as an `onChange` sanitizer for money/price fields instead of `digitsOnly`, which would strip the decimal and prevent entering cents.

**`lib/admin/table-search-params.ts`** — Server-side table state parsing (see §3.5).

**`lib/admin/use-table-url.ts`** — Client-side URL-state hook (see §3.5).

**`lib/hooks/use-mobile.ts`** — Client hook:
- `useIsMobile()` — subscribes to `matchMedia("(max-width: 767px)")`, matching the admin sidebar breakpoint; use for responsive behavior decisions such as inline vs dialog table editing.

**`lib/assessment/standards.ts`** — UKA/APFA passing standards (reads env at call time; no `server-only` guard so the seed script can import it):
- `getAssessmentStandards(recordType, gender)` — per-item thresholds read from env (e.g. `NEXT_PUBLIC_SPORTS_UKA_RUN_MALE`, `NEXT_PUBLIC_SPORTS_APFA_SWIMMING_FEMALE`) with hardcoded fallbacks; returns `{ key, label, unit, direction, threshold }` (run thresholds converted to seconds; direction `max` = ≤ passes, `min` = ≥ passes).
- `evaluatePass(value, standard)` — threshold comparison for server-side pass/fail evaluation.

**`lib/admin/use-table-edit-guard.ts`** — Client hook wrapping table-state updates:
- `useTableEditGuard({ update, hasUnsavedEdit, onDiscard })` — stashes state patches while a row edit is active and exposes confirm/discard state for the unsaved-changes dialog. Used by the metrics and assessments tables.

**`lib/admin/rbac.ts`** — Auth + authorization:
- `CurrentAdmin` type — the shape returned by `getCurrentAdmin` / `requireCurrentAdmin`; includes `gender` (used for accommodations gender scoping).
- `AdminAccess` — discriminated result of `resolveAdminAccess` / `getCurrentAdminAccess`: `ok`, `not-admin`, `inactive-cadet` or `missing-intake`.
- `resolveAdminAccess(authUserId)` — single identity loader joining `adminUsers`, `members` and `cadets`; blocks admins whose cadet record is inactive, denies intake-scoped roles without an intake, and normalises `intakeId` to `null` for non-scoped roles.
- `getCurrentAdminAccess()` — resolves access for the current Supabase session.
- `getCurrentAdmin()` — non-throwing; returns `CurrentAdmin | null`.
- `requireCurrentAdmin()` — returns `CurrentAdmin` or redirects to `/admin/login?error=inactive-cadet|missing-intake`.
- `requireAdminModule(module)` — enforces module-level access; calls `notFound()` if denied.
- `requireRoleGroup(group)` — enforces role-group-level access (used by layout shells).
- `redirectAdminRoot()` — redirects to the current admin's default route.
- `getIntakeScope(admin)` — returns `null` (unrestricted) or the `intakeId` filter for intake-scoped roles; throws if the invariant (scoped admin without intake) is violated.

**`lib/welfare/attend-sources.ts`** — Server-only Attend source options:
- `getAttendSources()` — reads `NEXT_PUBLIC_WELFARE_ATTEND_SOURCES` (comma-separated) with fallback `RSAK, PKU, HOSPITAL, OTHER`.

**`lib/welfare/religious-activity-types.ts`** — Server-only Religious Activities type options:
- `getReligiousActivityTypes()` — reads `NEXT_PUBLIC_WELFARE_REGLIGIOUS_ACTIVITIES_TYPES` (comma-separated, uppercased) with fallback `YASIN, TAHLIL`.

**`lib/academic/helpers.ts`** — Academic module helpers (framework-agnostic, importable by client components):
- `calculateCadetCurrentYear(intakeStartYear, asOf?)` — cadet's current academic year with the October 1 academic-year boundary.
- `formatCadetYearRatio(currentYear, completionYear)` — progress ratio string (`2/3`).
- `isCadetCourseCompleted(currentYear, completionYear)` — true when `currentYear > completionYear`.
- `formatAcademicSessionTitle(intakeNo, calendarYear, sessionNumber)` — session label `[intakeNo]-[calendarYear]-[sessionNumber]` (e.g. `2/44-2026-1`).
- `getGpaTier(score)` / `GPA_TIER_CLASSES` — GPA/CGPA color tiers (danger ≤ 2.50, success ≤ 3.00, warning ≤ 3.50, primary > 3.50, muted for null).
- `TIMETABLE_DAYS` / `TIMETABLE_SLOT_TIMES` / `LUNCH_BREAK_SLOTS` / `isLunchBreakSlot(time)` — UMT schedule grid (Sunday–Thursday, 8:00 AM–6:00 PM, locked 1:00–2:00 PM lunch).
- `makeSlotKey(day, time)` / `parseSlotKey(slotKey)` — slot key serialization (`SUN_0800`).
- `formatSlotTime(time)` / `formatSlotRange(startTime, durationUnits)` — 12-hour slot label helpers.
- `isAcademicManualProvisionEnabled()` — reads `ACADEMIC_MANUAL_PROVISION` (default false).

**`lib/academic/sync.ts`** — Server-only on-demand provisioning sync:
- `ensureCadetSessionRecords(sessionId)` — idempotently inserts missing `academic_results` / `academic_timetables` rows (`ON CONFLICT DO NOTHING`) for active, uncompleted cadets of the session's intake. Called when the Results or Timetables page opens and by `provisionSessionAction`.

**`lib/admin/roles.ts`** — Role definitions:
- `ADMIN_ROLES` array and `AdminRole` union type.
- `FULL_ACCESS_ADMIN_ROLES` — `["OFFICER", "INSTRUCTOR"]`.
- `INTAKE_SCOPED_ROLES` — Secretary, Treasurer, Welfare, Academic.
- `AdminModule` union type and `ADMIN_DEFAULT_ROUTES` / `ROLE_ROUTE_SEGMENTS` / `ROLE_MODULES` maps.
- `canAccessAdminModule(role, module)` / `canAccessRoleGroup(role, group)` — access checks.
- `isIntakeScopedRole(role)` / `isFullAccessAdminRole(role)` / `isAdminRole(value)` — type guards.
- `getDefaultAdminRoute(role)` / `getAdminNotFoundBackLabel(role)` — per-role routing helpers.

**`lib/admin/nav-config.ts`** — Sidebar navigation configuration, role-filtered menu items.

**`lib/admin/email.ts`** — Resend email helpers.

**`lib/auth/cadet.ts`** — Cadet auth:
- `getCurrentCadet()` / `requireCurrentCadet()` — session helpers for the cadet surface.

**`lib/cadet/collections.ts`** — Read model for published collections scoped to the current cadet's intake.

**`lib/cadet/account-types.ts`** — TypeScript type `CadetAccountRecord` for serialized cadet account data.

**`lib/cadet/accounts.ts`** — Server-only helper: `getCadetAccountByMemberId(memberId)` queries `cadetAccounts` by memberId, returns a `CadetAccountRecord` (with `qrCodeUrl` and ISO dates) or null.

**`lib/utils.ts`** — General-purpose utilities:
- `cn(...inputs)` — Tailwind class merge (clsx + tailwind-merge).
- `utcDate(year, month, day)` — builds a UTC `Date`.
- `computeAcademicSchedule(startYear)` — returns the academic year's session/exam date ranges.
- `formatDate(date, locale)` / `formatDateRange(start, end, locale)` — locale-aware date formatters.
- `escapeHtml(str)` — HTML-entity escape for server-rendered strings.
- `calculateBMI(heightM, weightKg)` / `getBMIClassification(bmi)` — BMI math and `BMIClassification` tagger.
- `calculateAge(birthdate)` — years-from-birthdate calculation.
- `calculateAgeAt(birthdate, asOf)` — age as of a specific date (used for age-at-record-time health metrics).
- `parseDuration(value)` / `formatDuration(seconds)` — `mm:ss` ⇄ seconds helpers for assessment time entries (accepts plain seconds input; caps below 2 hours).
- `isValidPersonalEmail(email)` — personal email validation (rejects `@ocean.umt.edu.my`).
- `isValidEduEmail(email)` — validates `@ocean.umt.edu.my` domain.

**`lib/time/malaysia.ts`** — Malaysia timezone helpers:
- `getMalaysiaDateISO(date?)` — returns the calendar date in `Asia/Kuala_Lumpur` as `YYYY-MM-DD`.
- `formatMalaysiaDateTimeLocal(date)` — formats a Date for a `datetime-local` input.
- `parseMalaysiaDateTimeLocal(value)` — parses a Malaysia wall-clock `datetime-local` value.
- `parseMalaysiaDate(value)` — parses a Malaysia calendar date into a Date.

**`lib/env/schema.ts`** — Env validation schema (no `server-only`, importable by scripts):
- `collectEnvIssues(env, { production })` — validates required/production keys, URL shapes, bucket-name divergence, secret lengths and uniqueness, `NEXT_PUBLIC_SPORTS_*` thresholds (positive numbers) and `NEXT_PUBLIC_WELFARE_*` lists (at least one value).
- `REQUIRED_ENV_KEYS`, `PRODUCTION_REQUIRED_ENV_KEYS`, `THRESHOLD_ENV_KEYS`, `LIST_ENV_KEYS`.
- Validated by `scripts/check-env.ts` (`npm run env:check`; add `--production` for production rules).

**`lib/env/public.ts`** — Public env (client-safe):
- `getPublicEnv()` — throws when `NEXT_PUBLIC_SUPABASE_*` keys are missing.
- `getSiteUrl()` — trimmed `NEXT_PUBLIC_SITE_URL` without trailing slashes; throws in production when missing; falls back to `http://localhost:3000` only in development.

**`lib/env/server.ts`** — Server-only env:
- `getServerEnv()` — returns `databaseUrl`, `supabaseSecretKey`, `supabasePrivateStorageRootPath` plus public env; throws when any server key is missing (`directUrl` removed).

**`lib/storage/visibility.ts`** — Client-safe, pure storage routing:
- `StorageVisibility`, `PUBLIC_STORAGE_PREFIXES` (`events`, `hero-images`, `images`, `intakes`, `placeholder`, `religious-activities`, `webapp`).
- `assertSafeStoragePath(path)` — rejects empty/oversized/absolute/backslash/traversal paths.
- `resolveVisibility(path)` — public when the first segment is in `PUBLIC_STORAGE_PREFIXES`, private otherwise (fail-closed).

**`lib/storage/files.ts`** — Client-safe, pure upload validation:
- `detectFileKind(bytes)` — sniffs magic bytes; returns kind (`image` | `pdf` | `video`), extension and content type derived from content, never from the client.
- `describeAllowedKinds(kinds)`, `formatMegabytes(bytes)` — user-facing error strings.
- `MAX_IMAGE_BYTES`, `MAX_VIDEO_BYTES`, `MAX_BYTES_BY_KIND` (kinds are content types, not signing purposes).

### `lib/supabase/storage-public.ts` — Client-safe public storage URL helpers:
- `storageUrl(path)` —  always rejects private paths.
- `extractStoragePath(publicUrl)` — reverse-engineers a storage path from a public URL.

### `lib/supabase/storage.ts` — Server-only Supabase Storage helpers:
- `bucketFor(visibility)` — maps `public`/`private` to the configured bucket names.
- `signedStorageUrl(supabase, path, expiresIn)` — signs an object in the bucket chosen by the path's visibility; logs and returns `null` when signing fails (e.g., object missing). `DEFAULT_SIGNED_URL_TTL_SECONDS` = 60.
- `deleteFromStorage(supabase, path)` / `deleteManyFromStorage(supabase, paths)` — deletes objects, grouped by bucket; logs failures.
- `saveUpload({ supabase, file, prefix, stem, kinds, maxBytes })` — validates size and content signature, derives extension/content type from detected content, generates a unique `{prefix}/{stem}-{uuid}.{ext}` key, uploads with `upsert: false`; returns `{ ok, path, contentType, size }` or `{ ok: false, error }`.
- `saveImage(input)` / `saveDocument(input)` — `saveUpload` restricted to images / PDFs.

**`lib/slugify.ts`** — URL-slug generator.

**`lib/server-utils.ts`** — Server-only utilities.

**`lib/public/content.ts`** — Server-side read models for public pages (published intakes, events, homepage content) with fallback chains.

**`lib/i18n/*`** — Locale configuration, dictionary loader, per-locale dictionaries, and error strings (see §5).

**`lib/rate-limit.ts`** — DB-backed rate limiting:
- `checkRateLimit(identifier, action, config?)` — returns `{ allowed, remaining, resetAt }`; uses `rate_limit_entries` table with unique index on (identifier, action); default 5 req/IP/15min.
- `cleanupRateLimitEntries()` — deletes expired entries; intended for periodic cron.

**`lib/newsletter/sanitize-html.ts`** — HTML sanitizer for newsletter content:
- `sanitizeHtml(html)` — allow-list based sanitization (tags: a, b, strong, i, em, u, p, br, ul, ol, li, h1-h6, blockquote, img; attributes: href, src, alt, style); strips scripts, event handlers, unsafe URLs.

**`lib/storage/uploads.ts`** — Direct upload tickets for large files, story video flow (server-only module, not `"use server"` — expose authorized thin actions per feature instead):
- `createUploadTicket({ supabase, prefix, filename, kinds, maxBytes, expiresIn })` — validates kinds, derives a `randomUUID` name with an allow-listed extension (client cannot choose arbitrary paths), creates the object with `upsert: false`, returns `{ signedUrl, path, bucket, maxBytes, contentType }`.
- `verifyUpload(supabase, { bucket, path, kinds, maxBytes })` — confirms via Storage `list()` that the object exists, matches the allowed kinds, and is within `maxBytes`.
- `deleteUpload(supabase, path)` — cleanup on failed finalize; server-side only after auth/ownership checks.

**`app/admin/welfare/attend/search-actions.ts`** — Server-backed cadet search:
- `searchCadets(query, limit?)` — searches active cadets by name, armyNo, or matricNo (min 2 chars, max 20 results); intake scope is derived server-side from `requireCurrentAdmin()` + `getIntakeScope()`, never accepted from the client.

**`lib/actions/result.ts`** — Canonical action result type:
- `ActionResult<T>` — discriminated union `{ success: true; data: T } | { success: false; error: string }` for consistent Server Action responses.

**`lib/admin/cleanup.ts`** — Multi-step upload cleanup/rollback:
- `withCleanup(fn)` — wraps async fn; tracks uploads; auto-deletes on throw.
- `saveImageWithCleanup(input)`, `saveDocumentWithCleanup(input)`, `saveUploadWithCleanup(input)` — tracked versions of storage helpers.

**Adding a new helper**: create it in the most specific file that fits its domain, then either (a) run the `update-helpers-doc` skill to refresh this catalog, or (b) manually add a one-line bullet here with signature and purpose.

## 4. Route Architecture
### 4.1 Public Routes (Localized)
Current implemented routes:
- `/<locale>/` (landing page)
- `/<locale>/intakes` (intakes list)
- `/<locale>/intakes/[slug]` (intake detail)
- `/<locale>/stories` (stories list)
- `/<locale>/stories/[slug]` (story detail)
- `/<locale>/stories/tags/[slug]` (stories by tag)
- `/<locale>/contact` (contact page with newsletter subscription)
- `/<locale>/newsletter/confirm/[token]` (newsletter confirmation)
- `/<locale>/newsletter/unsubscribe/[token]` (newsletter unsubscribe)

### 4.2 Admin Routes (Non-localized, Module-Scoped)
Current implemented routes:
- `/admin` (role-aware root; full-access roles see dashboard, others redirect to their default module)
- `/admin/login` (Google OAuth start, no sidebar shell)
- `/admin/secretary/rank-holders` (Secretary: cadet admin user management)
- `/admin/secretary/intakes` (Secretary: intake management)
- `/admin/secretary/cadets` (Secretary: cadet management)
- `/admin/treasurer/accounts` (Treasurer: bank account & QR management)
- `/admin/treasurer/collections` (Treasurer: collection event management)
- `/admin/treasurer/payments` (Treasurer: payment ledger and records)
- `/admin/treasurer/expenses` (Treasurer: expenses)
- `/admin/multimedia/portfolio` (Multimedia: portfolio)
- `/admin/multimedia/stories` (Multimedia: stories CRUD)
- `/admin/multimedia/newsletters` (Multimedia: newsletter management)
- `/admin/sports/metrics` (Sports: cadet health metric records)
- `/admin/sports/uka` (Sports: UKA assessment record list)
- `/admin/sports/apfa` (Sports: APFA assessment record list)
- `/admin/sports/assessments` (Sports: per-cadet UKA/APFA result entry)
- `/admin/welfare/attend` (Welfare: cadet attend records)
- `/admin/welfare/accommodations` (Welfare: cadet accommodation records, gender-scoped for intake admins)
- `/admin/welfare/religious-activities` (Welfare: religious activities records with display photos)
- `/admin/academic/courses` (Academic: cadet course assignments + course/program management)
- `/admin/academic/results` (Academic: per-session cadet GPA/CGPA results with result slips)
- `/admin/academic/timetables` (Academic: per-cadet session timetables with slot editor and PDF)
- `/auth/callback` (OAuth code exchange)

### 4.3 Cadet Routes (Non-localized, Auth-Guarded)
- `/cadet` (index; redirects to `/cadet/collections`)
- `/cadet/login` (Google OAuth start for cadets)
- `/cadet/collections` (card grid of published collections for the cadet's intake)
- `/cadet/collections/[slug]` (collection detail and payment form)
- `/cadet/claims` (list of cadet's claims with dialog-based new claim creation)
- `/auth/callback/cadet` (OAuth code exchange for cadet auth)

Routes are organized by role group (e.g., `/admin/secretary/*`, `/admin/treasurer/*`). Each role group has its own layout that enforces RBAC via `requireRoleGroup()`. Unauthorized access returns a 403 Access Denied page. Officer and Instructor bypass all group restrictions.

## 5. Localization Architecture
- Supported locales: `en` (default), `ms`, `zh`, `ta`.
- Locale validation and fallback typing via `isLocale` and `Locale` union.
- Dictionary-per-locale loading with dynamic imports.
- Public header includes language switching by URL segment replacement.
- Locale-aware metadata baseline generated in `app/[locale]/layout.tsx`.

## 5.5 Error Handling Architecture
- Route-level error boundaries for public surfaces:
  - `app/[locale]/error.tsx` — catches errors in all public pages under a locale, localized error strings, provides "Try again" (reset) and "Go home" navigation.
  - `app/error.tsx` — root fallback for errors outside locale context (e.g., invalid locale), defaults to English.
- Error UI strings are maintained in `lib/i18n/error-strings.ts` — separate from full dictionary, minimal set for error pages.
- Locale detection in error boundaries uses `localeFromPathname()` on `window.location.pathname` (client-side only, safe after hydration).
- Admin error boundaries are not yet implemented — deferred pending admin UI completion.

## 6. Authentication and Authorization
### 6.1 Authentication
- Admin login uses Supabase OAuth provider `google` (`app/admin/login/actions.ts`).
- Callback exchanges auth code for session (`app/auth/callback/route.ts`).
- Session is read server-side via Supabase SSR client.
- Invitation acceptance: on first Google login, the callback checks for a pending `adminInvitations` row matching the user's email. If found, it atomically (within a transaction) creates the `adminUsers` record, marks the invitation as accepted, and inserts an `ACCEPTED` audit log entry. Uninvited users are redirected to login with a `not-authorized` error.
- The callback resolves admin access first: existing admins whose cadet record is inactive or who are intake-scoped without an intake are signed out and redirected with `?error=inactive-cadet|missing-intake`. Invitation acceptance is refused for inactive cadets, and `intakeId` is normalised at acceptance (scoped roles get the invitation's or cadet's intake; other roles get `null`).

### 6.2 Authorization (RBAC)
- `admin_users` table links Supabase auth user to exactly one app role.
- `requireCurrentAdmin()` enforces admin session.
- `requireAdminModule(module)` enforces module-level access on server.
- Full-access roles: `OFFICER`, `INSTRUCTOR`.
- Role default route map is centralized in `lib/admin/roles.ts`.

### 6.3 Intake Scope Mechanism
Certain roles are intake-scoped, meaning they can only read and write data belonging to their assigned intake.

- **Intake-scoped roles:** `SECRETARY`, `TREASURER`, `SPORTS`, `WELFARE`, `ACADEMIC`
- **Unrestricted roles:** `OFFICER`, `INSTRUCTOR`, `MULTIMEDIA`

The `admin_users` table has a nullable `intake_id` column. Officer/Instructor have `null`; intake-scoped roles have their specific intake ID. The value is normalised on invite (`isIntakeScopedRole(role) ? cadet.intakeId : null`), on role change (same normalisation, using the admin's cadet record), and when a cadet is transferred to another intake (scoped admin rows and pending scoped invitations are synced inside the `updateCadet` transaction).

The `admin_invitations` table also has a nullable `intake_id` column, which is set when the invitation is created and normalised again during the auth callback.

`resolveAdminAccess()` enforces the invariant fail-closed: a scoped role with `intake_id = null` is denied (`missing-intake`), and non-scoped roles are always presented with `intakeId = null` even if a stale value exists. The Intakes module is global and never intake-scoped.

Helper functions:
- `isIntakeScopedRole(role)` in `lib/admin/roles.ts` — checks if a role is intake-scoped
- `getIntakeScope(admin)` in `lib/admin/rbac.ts` — returns `null` (no restriction) or the `intakeId` to filter by; throws if a scoped admin has no intake

All queries and mutations in intake-scoped modules apply the intake filter:
- **Reads:** Filter queries by `intakeId` when scoped
- **Writes:** Validate ownership before mutation; prevent cross-intake operations

### 6.4 Cadet Authentication
Cadets authenticate separately from admins using the same Supabase project:

- Login page at `/cadet/login` with Google OAuth (`app/cadet/login/actions.ts`).
- OAuth callback at `app/auth/callback/cadet/route.ts` — verifies `@ocean.umt.edu.my` email domain, looks up member by `eduEmail`, checks role is `CADET`, verifies cadet record exists.
- Auth helper at `lib/auth/cadet.ts` provides `getCurrentCadet()` and `requireCurrentCadet()`. Both deny access when the cadet record is inactive.
- `CurrentCadet` type includes `authUserId`, `email`, `memberId`, `name`, and `intakeId` (from `cadets` table).
- Auth is enforced per-page (not in the cadet layout) to avoid redirect loops with `/cadet/login`.

### 6.5 Treasurer Payment System
Trust-based payment recording system with four components:

- **Treasury Accounts** (`/admin/treasurer/accounts`): Bank account management with optional QR code upload. Intake-scoped.
- **Collections** (`/admin/treasurer/collections`): Collection event management with DRAFT ↔ PUBLISHED → ARCHIVED lifecycle. Linked to a treasury account for payment details.
- **Cadet Payment Page** (`/cadet/collections/[slug]`): Slug-based public-facing payment page where cadets view collection details, submit payment amount (if flexible), and upload receipt (if required).
- **Payments Ledger** (`/admin/treasurer/payments`): Cross-collection payment view with filtering, summary stats, and unpaid cadet tracking.

Key design decisions:
- Duplicate payment prevention via unique constraint on `collection_payments(collection_id, member_id)`.
- `collections.paymentAccountId` uses `onDelete: "set null"` — collections survive account deletion but lose the payment link.
- `collection_payments.collectionId` uses `onDelete: "cascade"` — payment records follow collection deletion.
- `treasury_accounts.treasurerId` uses `onDelete: "cascade"` — accounts are deleted when the admin user is dropped.
- Role change cleanup: when a Treasurer's role is changed to non-Treasurer, their `treasury_accounts` are deleted in the same transaction.
- Storage paths: QR codes at `treasury/{intakeId}/accounts/{accountId}/qr.{ext}`, receipts at `payments/{collectionId}/{memberId}/receipt.{ext}`. Both prefixes are private; objects live in the private bucket and are read through signed URLs.
- Read model at `lib/cadet/collections.ts` fetches published collections with treasury account details, intake-scoped to the cadet's intake.

## 7. Data Model Architecture
Primary schema domains in `db/schema.ts`:
- Admin identity and role mapping: `admin_users` (with nullable `intake_id` for intake-scoped roles), `admin_invitations` (with nullable `intake_id`), `admin_role_audit_logs`.
- Public intakes and translations:
  - `intakes`, `intake_translations`, `intake_patch_explanations`, `intake_patch_explanation_translations`, `intake_display_photos`.
- Academic structure:
  - `academic_years` (per intake, year number + calendar year), `sessions` (per academic year, session number), `exams`, `academic_exam_results`.
  - `academic_results` (per session+cadet: GPA, CGPA, result slip path; unique per session+cadet). Saving scores syncs `cadets.cgpa`.
  - `academic_timetables` (per session+cadet: `occupied_slots` jsonb string array of hourly slot keys like `SUN_0800`, timetable PDF path; unique per session+cadet). The Sunday-Thursday schedule runs from 08:00 through 18:00, and the 13:00-14:00 lunch slot (`1300`) is never occupied.
  - Session provisioning: `public.provision_next_sessions()` (pg_cron Oct 1 / Apr 1), an after-insert trigger on `sessions`, the seed script, and `ensureCadetSessionRecords()` all insert initial result/timetable rows for active cadets whose `calendarYear - intakeStartYear + 1 <= completionYear`.
- Members and cadet data:
  - `members` (with birthdate, age, kor/regiment fields), `cadets` (with physical metrics: height, weight, BMI, CGPA), `study_programs` (with `completion_year` default 3 and `is_supported` flag; `is_active` removed), `officers_and_instructors`.
  - `platoons` (normalized platoon entity) with nullable `cadets.platoon_id` assignment.
  - Secretary module operates exclusively on cadets; rank-holders filters admin users to cadets only.
- Newsletter:
  - `newsletter_subscribers` with status and token hash fields.
- Treasurer payment system:
  - `treasury_accounts` (bank name, account number, QR code path, DuitNow ID, intake-scoped).
  - `collections` (title, slug, purpose, amount, fixed/flexible, receipt required, payment account link, publication status).
  - `collection_payments` (amount paid, receipt path, paid timestamp, unique per collection+member).
  - Enums: `bank` (Malaysian banks), `collection_purpose` (MONTHLY, WELFARE, GOODS, FEAST, OTHERS).
- Cadet portal data:
  - `cadet_accounts` (one-to-one by memberId: bank name, account number, DuitNow ID, QR code path). Auto-saved during claim submission if cadet opts in.
  - `claims` (reimbursement claims: title, amount, description, receipt path, QR code path, status PENDING/FULFILLED/REJECTED, intake-scoped).
  - Claims are created via dialog from the claims list page (`/cadet/claims`), not a separate form page.
  - Enum: `claim_status` (PENDING, FULFILLED, REJECTED).
- Welfare:
  - `attend_records` (cadet absence records: date, Attend B / Attend C, source from env `NEXT_PUBLIC_WELFARE_ATTEND_SOURCES` with defaults).
  - `accommodations` (one per cadet: HOSTEL / RENTAL type + address; auto-created on cadet creation; rows are gender-scoped for intake-scoped welfare admins).
  - `religious_activities` (Welfare module, not intake-scoped: type from env `NEXT_PUBLIC_WELFARE_REGLIGIOUS_ACTIVITIES_TYPES` with defaults YASIN/TAHLIL, record date, autogenerated title `{TYPE}-{YYYY-MM-DD}` with a unique index and friendly duplicate error, remarks, location, nullable meeting link).
  - `religious_activity_photos` (display photos per activity, cascade-deleted with the activity; storage path `religious-activities/{activityId}/photos/{n}.{ext}`; photos upload only at creation and are view-only afterwards via a carousel dialog).
- Sports health metrics:
  - `health_records` (assessment sessions: intake, record date set to the creation day; one record per intake per day, enforced by a unique index with a friendly duplicate error in the create action).
  - `health_record_metrics` (per-cadet metrics per record: age at record date, height, weight, BMI, BMI classification; unique per record+cadet; rows are created only when a cadet's metrics are saved — unfilled cadets render as dashes in the UI).
- Sports assessments (UKA/APFA):
  - `uka_records` / `apfa_records` (intake-scoped assessment sessions; `session` auto-numbered per intake per year, unique per intake+session+year; label `{type}-{session}-{year}`, e.g. `UKA-1-2026`).
  - `uka_record_assessments` / `apfa_record_assessments` (per-cadet item values + stored pass flags + nullable overall `assessment_result`; unique per record+cadet; rows created only when a cadet's first item is saved).
  - Passing thresholds come from env (`NEXT_PUBLIC_SPORTS_UKA_*` / `NEXT_PUBLIC_SPORTS_APFA_*`, run in minutes converted to seconds) with hardcoded defaults; per-item pass flags and overall results are frozen at write time (editing a value re-evaluates with current thresholds).
- Stories and metadata:
  - `events`, `event_translations`, `event_tags`, `event_tag_translations`, `events_to_tags`, `event_display_photos`.
- Homepage-managed content:
  - `webapp_contents`, `frequently_asked_questions`, `frequently_asked_question_translations`, `see_more_links`, `testimonials`, `testimonial_translations`.

### 7.1 Intake Application Data Model (Planned)
- Application status enum: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.
- Required documents: IC copy, blue-background passport photo, SPM transcripts.
- Physical metrics: height, weight, BMI-related data.
- Admin-configurable deadline stored in `webapp_contents` or similar.
- No separate `intakeApplications` table needed; intake status workflow is sufficient.

### 7.2 Role Management Architecture
- Adding an admin creates an invitation (`adminInvitations` table) and sends an email. The `adminUsers` record is created when the invitee signs in via Google.
- Role changes: direct update to the role column. Only `OFFICER` or `INSTRUCTOR` can change roles.
- Dropping an admin deletes the `adminUsers` record and the Supabase auth user.
- Audit log (`adminRoleAuditLogs`) tracks all events: `INVITED`, `ACCEPTED`, `ROLE_CHANGED`, `DROPPED` — with actor, target name, roles, and timestamp.
- Member-admin linking: `adminUsers` and `cadets` both reference `members.id` — no separate FK needed. Only cadets can be invited as admin users.

### 7.3 CMS Architecture (Planned)
Multimedia role manages public content via admin dashboard:
- `webapp_contents`: hero text, stats, FAQs, testimonials, see-more links, social links, map embed.
- Stories: full CRUD for event/story content.
- Newsletters: subscriber management and email campaigns.
- Application deadline: configurable seasonal intake deadline.

Landing page structure is complete; no further content changes needed.

Design patterns:
- Translation tables per locale for managed localized content.
- Publication status enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`) for publish workflows.
- Indexed slug fields for SEO routes.
- Token storage for newsletter as hash fields.

## 8. UI and Theming Architecture
- Theme handled by custom `ThemeProvider` with cookie-backed initial theme (`light`/`dark`/`system`).
- `RootDocument` composes font variables and server-resolved theme class.
- Font stack:
  - Geist Sans + Geist Mono.
  - Locale support additions: Noto Sans SC and Noto Sans Tamil.
- Public shell:
  - Sticky top header.
  - Primary nav links.
  - Language switcher and theme toggle.
  - Mobile menu with responsive behavior.

## 9. Content Delivery and Fallback Strategy
`lib/public/content.ts` applies graceful fallbacks when DB content is absent:
- Hero image fallback.
- Stats fallbacks.
- FAQ fallback entries by locale.
- "See also" fallback links.

This supports early public page delivery while admin-managed content modules are still in progress.

## 10. Runtime, Build, and Operations
- Package manager: `npm`.
- Scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed` (requires `ALLOW_SEED=1` in the shell; refuses production and non-local `NEXT_PUBLIC_SITE_URL`; truncates every table)
  - `npm run env:check` (`scripts/check-env.ts`; add `--production` for production rules)
  - `npm run storage:migrate-private` (`scripts/migrate-private-objects.ts`; add `--apply` to copy, `--delete-source` after production verification)
- Environment separation:
  - Env rules live in `lib/env/schema.ts`; `scripts/check-env.ts` validates them (`npm run env:check`; add `--production` for production rules).
  - `lib/env/public.ts` exposes `getPublicEnv()` and `getSiteUrl()`; `lib/env/server.ts` exposes `getServerEnv()` (requires `NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH`).
- Remote images currently allow Supabase storage host via `next.config.ts`.
- Database connection pool: `postgres` driver with `max: 20` connections (supports concurrent queries via `Promise.all` in admin pages). Uses Supabase transaction-mode pooler. Lower to `max: 5` if deploying to serverless (Vercel/Lambda).
- Server Actions body size limit: configured to `5mb` in `next.config.ts` for document uploads.

## 11. Current Gaps vs Target Architecture
Based on `TASKS.md` and codebase review:

### Completed
- Public pages: landing, intakes list, intake detail, stories list, stories detail, stories by tag, contact page.
- Newsletter: subscription form, double opt-in confirmation, unsubscribe flow (Resend integration complete).
- Localization: all 4 locales (en, ms, zh, ta) with dictionaries.
- Root not-found page for invalid locales (hardcoded English, acceptable).
- Route-level error boundaries for public surfaces (localized for all 4 locales).
- Admin shell: responsive sidebar with collapsible icon mode (desktop) and drawer (mobile), role-aware navigation, active route highlighting.
- Admin route structure: module-scoped routes under role groups (e.g., `/admin/secretary/rank-holders`), per-group RBAC layouts with 403 Access Denied for unauthorized access.
- Secretary rank-holders: cadet admin user management with role changes, drop, audit logging, and cadet-only filtering.
- Secretary cadets page: cadet management with rank-based sorting, active/inactive toggle, and filtering.
- Intake-scoped RBAC: Secretary, Treasurer, Sports, Welfare, and Academic roles restricted to their intake's data for reads and writes. Officer, Instructor, and Multimedia remain unrestricted.
- Treasurer payment system: treasury accounts, collections (DRAFT ↔ PUBLISHED/ARCHIVED lifecycle), cadet self-service payment page, and payments ledger with filtering and unpaid tracking.
- Cadet authentication: separate Google OAuth flow at `/cadet/login` with `@ocean.umt.edu.my` domain verification and member/cadet record lookup.
- Cadet portal shell: mobile-first responsive sidebar layout (`CadetShell`) with collections and claims navigation, breadcrumbs, user menu, theme switcher, and sign-out.
- Cadet collections page: card-based grid of published collections scoped to the cadet's intake, with detail/payment pages.
- Cadet claims system: dialog-based reimbursement claim creation with receipt and QR upload, bank detail pre-fill from `cadet_accounts`, and claim list with status badges.
- Treasurer lifecycle cleanup: treasury accounts deleted when role changes away from Treasurer.
- Sports Metrics module: health record sessions with per-cadet metrics (age at record date, height, weight, BMI + classification), intake-scoped, record selector above the table (Officer/Instructor select intake; Sport role scope inferred).
- Sports assessments: UKA/APFA record lists with auto session numbering (`UKA-1-2026`), combined Assessments entry page with inline per-cadet result editing (desktop) and dialog fallback (mobile), gender-based env thresholds with defaults, and per-item/overall pass evaluation stored at write time.
- Academic modules: Courses (cadet course assignment tab + course/program management tab with enrolled-count deletion guard), Results (per-session GPA/CGPA with tier-colored pills, inline row editing synced to `cadets.cgpa`, PDF result slips), Timetables (per-cadet 60-minute slot editor with locked lunch break, drag-range selection, timetable PDFs), intake-scoped record selection with `ACADEMIC_MANUAL_PROVISION` provisioning dialog.
- Placeholder pages for remaining admin modules across other role groups (Academic placeholders replaced by real modules).

### Pending
- Public SEO completeness: per-page canonical/hreflang audit.
- Error handling: route-level error boundaries for admin surfaces.
- Admin CMS: Multimedia-managed `webapp_contents`, stories CRUD, newsletter management, application deadline config.
- Seasonal intake application workflow: form, document upload, status transitions, physical assessment email trigger.
- Email templates: application confirmation, application status update.
- Schema additions: application status enum.
- Officer/Instructor bento dashboard with cross-system statistics.

## 12. Key Risks and Considerations
- AGENTS constraints require avoiding fabricated ROTU-specific facts; seeded/demo content should be treated as placeholder until confirmed.
- Public pages must remain fully translatable; avoid introducing hardcoded UI strings in new components.
- RBAC must remain server-enforced; client-side checks are convenience only.
- Next.js version drift: framework-sensitive updates should be validated against local Next.js docs in `node_modules/next/dist/docs`.

## 13. Recommended Next Architectural Steps
1. Build Officer/Instructor bento dashboard with cross-system statistics and summary cards.
2. Build schema additions: application status enum.
3. Build intake application workflow: form, document upload, status state machine, Secretary review UI, physical assessment email trigger.
4. Build email templates for application confirmation and status update notifications.
5. Implement admin CMS modules: Multimedia for `webapp_contents`, stories CRUD, newsletter management.
6. Add route-level error boundaries for admin surfaces.
7. Audit per-page canonical URLs and `hreflang` alternates across all public routes.

## 14. Admin Module Consistency Contract

Secretary, Treasurer, Multimedia, Sports, Welfare, and Academic admin modules may have different domain workflows, but they must share the following interaction and implementation behavior.

### 14.1 Authorization and ownership

- Every admin route is protected by its module layout and server-side RBAC.
- Every admin page calls `requireAdminModule(module)`; layout gates are UX only.
- Every Server Action authenticates with `requireCurrentAdmin()` and checks `canAccessAdminModule()`.
- Intake-scoped modules enforce intake ownership in both reads and writes.
- Client-side hiding is UX only and never replaces server authorization.
- Related entities must be re-queried and validated by the server before mutation.

### 14.2 Server Action contract

Actions should return a discriminated result:

```ts
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

- Validation failures are returned as `success: false`; they should not be silently swallowed.
- Mutations should use transactions when they write multiple related tables.
- Domain services own domain validation and transactional writes; actions own authentication, form parsing, and cache invalidation.
- File uploads must validate file type and size before storage, and remove an uploaded file if the database write fails.
- Delete operations must validate the parent entity and ownership before removing database or storage records.
- Storage and network I/O never run inside a DB transaction: uploads happen before the transaction, and superseded objects are deleted only after the write commits.
- Large files (e.g., story videos) bypass the 5 MB Server Action body limit via the ticket flow in `lib/storage/uploads.ts`: create entity → `requestStoryVideoUpload` ticket → client PUT → `finalizeStoryVideo` (verify + set path + delete previous object post-commit). The video itself never travels through a Server Action.
- Signed (private-bucket) URLs are short-lived and always rendered with `unoptimized` `next/image` or as direct links; PDFs are never passed to `next/image`.
- Admin identity lookups are request-cached (`cache()` inside `lib/admin/rbac.ts`), so layout + page + action share one auth resolution per request.

### 14.3 Cache and navigation behavior

- Successful in-place mutations call `router.refresh()` from client components.
- `window.location.reload()` and `window.location.href` must not be used for admin mutation completion.
- `router.push()` is used only when the mutation intentionally leaves the current route, such as deleting the entity currently being viewed.
- Server Actions revalidate the affected list route and the affected detail route when applicable.

### 14.4 Dialog and form behavior

- Dialogs use `DialogHeader`, `DialogDescription`, and `DialogFooter` consistently.
- Dialog state is reset when the dialog closes and after successful creation.
- Inputs use shared UI primitives from `components/ui/`: `Input`, `Select`, `DatePicker`, `Textarea`, and `Field`.
- Required fields use both UI required indicators and server-side validation.
- Pending states disable submit/destructive controls and show a clear loading label.
- Action failures remain visible in the dialog or page until corrected or dismissed.
- Date and time controls match the domain: date-only records use `type="date"`; event ranges or scheduled operations may use date-time controls.

### 14.5 List and table behavior

- Admin list pages use the shared data-table infrastructure with URL-based search, filtering, sorting, and pagination.
- Intake columns, intake filters, and intake-bearing record selector labels are shown only to full-access roles; intake-scoped roles have them hidden because all of their rows belong to one intake. Platoon columns and filters are available to every role on cadet tables (metrics, assessments). Rows themselves are always server-filtered by intake scope.
- Empty states distinguish between no records and no records matching active filters.
- Filtered empty states provide a reset action.
- Date, currency, status, and result values use shared formatters or module-level helpers rather than ad hoc formatting in table cells.
- Add actions use consistent placement, spacing, labels, and icons.

### 14.6 Data fetching and client boundaries

- Server Components fetch database data and pass only the required serialized view model to client components.
- Independent server queries should run in parallel with `Promise.all()`.
- Client components must not access Drizzle or Supabase database clients directly.
- Large searchable populations should use server-backed search instead of loading an unbounded dataset into the browser.
- Components should be split by responsibility: page client, table, form/dialog, detail view, and mutation controls.

### 14.7 Code quality

- Avoid dense one-line pages, actions, and JSX blocks.
- Top-level functions should have explicit prop and return types where practical.
- Shared helpers in `lib/admin` and `lib/utils` must be preferred over duplicated validation, formatting, and parsing logic.
- Dead branches, unused lookup fields, obsolete routes, and compatibility wrappers must be removed after route migrations.
- Changes to shared helpers require updating the architecture helper catalog as required by `AGENTS.md`.
