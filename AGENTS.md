# AGENTS.md

## Project Context

This project is a **Next.js App Router web application** for **ROTU Army UMT (PALAPES Darat UMT)**.

It has two main surfaces:

1. **Public marketing website**
   - Attract UMT students to join ROTU Army UMT.
   - Communicate value, experience, benefits, culture, training, and activities.
   - Drive interest into engagement and application intent.

2. **Admin dashboard**
   - Restricted internal system for content, operations, role-based workflows, and reporting.
   - Access is controlled by Supabase Auth and server-enforced RBAC.

Do not fabricate ROTU-specific facts, historical data, people, ranks, event details, photos, colors, or copy. Use placeholders when needed and ask for real assets/content when accuracy matters.

---

## Tech Stack

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript `^5`
- Tailwind CSS `^4`
- lucide-react
- Supabase Auth, PostgreSQL, and Storage
- Drizzle ORM for schema, queries, and migrations

Next.js `16.2.6` may differ from older App Router knowledge. Before implementing framework-sensitive code, check the relevant local documentation in `node_modules/next/dist/docs/` and follow deprecation notices.

Use `npm` only.

Common commands:

```bash
npm run dev
npm run build
npm run lint
npm run db:generate   # generate Drizzle migrations
npm run db:migrate    # apply migrations
npm run db:seed       # seed database
npm run db:studio     # open Drizzle Studio
```

Do not run validation automatically after implementation unless the user asks for it or the change is high-risk. When validation is requested, prefer:

```bash
npm run lint
npm run build
```

**No test framework exists.** Do not invent tests or suggest adding one unless explicitly requested.

---

## Environment And Supabase

The project already has a Supabase project configured through `.env`.

**Security warning:** `.env` is currently committed to git despite `.gitignore` containing `.env*`. This contains live Supabase credentials and Resend API key. Do not expose these values in logs, error messages, or responses. Recommend moving to `.env.local` and adding a `.env.example` template.

Expected environment values include:

- Supabase URL
- Supabase publishable key
- Supabase secret/service key
- Supabase storage root path
- Resend API key, when email sending is implemented

Do not print secrets in logs or responses.

### Authentication

- Admin users are manually invited/added by Secretary as the normal owner of the workflow.
- Officer and Instructor can also invite/manage admins because they have full system access.
- Invited admins log in only through Google using their UMT account.
- Do not build public email/password registration for admins unless explicitly requested.
- When an invited user signs in via Google for the first time, the auth callback (`app/auth/callback/route.ts`) checks for a pending invitation matching the user's email. If found, it creates the `adminUsers` record, marks the invitation as accepted, and logs an `ACCEPTED` audit event — all within a single database transaction. If no invitation exists and the user is not already an admin, they are redirected to login with a `not-authorized` error.

### Authorization

- RBAC must be enforced on the server.
- A user must have exactly one admin role.
- `OFFICER` and `INSTRUCTOR` are separate roles but currently have identical highest-level permissions.
- Client-side hiding is only UX; it is not authorization.

#### Role Changes

- Admin roles can be changed after creation, but only by `OFFICER` or `INSTRUCTOR`.
- Role changes are performed as **direct update** to the role column.
- All admin management events must be logged/audited (INVITED, ACCEPTED, ROLE_CHANGED, DROPPED).
- Multi-role assignments are not allowed. One admin user = one role, strictly.

#### Full-Access Bypass

- `OFFICER` and `INSTRUCTOR` bypass module restrictions entirely and can access all admin routes and content.
- Other roles see only paths and content under their assigned module access.

#### Intake-Scoped Access Control

Some admin roles are restricted to managing data from their own intake only:

- **Intake-scoped roles:** `SECRETARY`, `TREASURER`, `WELFARE`, `ACADEMIC`
- **Unrestricted roles:** `OFFICER`, `INSTRUCTOR`, `MULTIMEDIA`, `SPORTS`

Intake-scoped admins have an `intakeId` on their `adminUsers` record (set from the cadet's intake at invitation acceptance time). This restricts both reads (filtered queries) and writes (ownership validation) to their intake's data.

Officer and Instructor bypass intake restrictions entirely and can access and manage data across all intakes.

**Intake-scoped data:**
- Cadets and admin users (Secretary module)
- Treasury accounts, collections, payments (Treasurer module)
- Health, accommodations (Welfare module — future)
- Results, timetables (Academic module — future)

**Non-intake-scoped data:**
- Newsletter, stories, portfolio, `webapp_contents` (Multimedia)
- Activities, collaborations (Sports)

Helper functions in `lib/admin/rbac.ts`:
- `isIntakeScopedRole(role)` — checks if a role is intake-scoped
- `getIntakeScope(admin)` — returns `null` (no restriction) or the `intakeId` to filter by

#### Cadet Authentication

Cadets authenticate separately from admins using the same Supabase project:

- Login page at `/cadet/login` with Google OAuth.
- OAuth callback at `/auth/callback/cadet` — verifies `@ocean.umt.edu.my` email, looks up `members` by `eduEmail`, checks role is `CADET`, verifies `cadets` record exists.
- Auth helper at `lib/auth/cadet.ts` provides `getCurrentCadet()` and `requireCurrentCadet()`.
- Cadet pages enforce auth per-page (not in the layout, to avoid redirect loops with `/cadet/login`).
- Cadets access their intake's published collections at `/cadet/collections/[slug]`.
- Payment recording: cadets submit amount (if flexible) and receipt (if required), stored via Supabase Storage. Duplicate payments prevented by unique constraint on `(collectionId, memberId)`.

#### Treasurer Payment System

Trust-based payment recording system:

- **Treasury Accounts** (`/admin/treasurer/accounts`): Treasurers manage bank accounts with optional QR code upload to Supabase Storage. Intake-scoped.
- **Collections** (`/admin/treasurer/collections`): Treasurers create collection events with purpose, amount (fixed/flexible), receipt requirement, and linked payment account. Lifecycle: DRAFT ↔ PUBLISHED → ARCHIVED.
- **Cadet Payment Page** (`/cadet/collections/[slug]`): Cadets view collection details, bank info, QR code, and submit payment with optional receipt upload.
- **Payments Ledger** (`/admin/treasurer/payments`): Treasurers view all payments across collections, filter by collection, see summary stats, and track unpaid cadets.
- **Lifecycle cleanup**: When a Treasurer's role is changed to non-Treasurer, their `treasury_accounts` are deleted. Collections with `onDelete: "set null"` on `paymentAccountId` survive but lose the account link. Payment records are never deleted through cascade.
- Schema: `treasury_accounts`, `collections`, `collection_payments` tables with `bank` and `collection_purpose` enums.
- Storage: QR codes at `treasury/{intakeId}/accounts/{accountId}/qr.{ext}`, receipts at `payments/{collectionId}/{memberId}/receipt.{ext}`.

---

## Localization (i18n)

The application must support these locales:

- English (`en`) - default
- Malay (`ms`)
- Mandarin Chinese (`zh`)
- Tamil (`ta`)

Routing must be locale-prefixed:

```txt
/en/...
/ms/...
/zh/...
/ta/...
```

Rules:

- All user-facing UI text must be translatable.
- Do not hardcode UI strings in components.
- Use translation keys.
- Public pages must be independently indexable per locale.
- Use localized metadata, canonical URLs, and `hreflang` alternates.

For database content that needs translation, prefer translation tables when content is user-managed or can vary by locale. Examples include event summaries, intake explanations, page sections, SEO titles/descriptions, and future marketing content. Static UI labels should stay in locale dictionaries.

---

## Public Website

Public routes live under the localized marketing surface.

### Pages

- Landing page
  - Navigation label: **About Us**
  - Route: `/[locale]/`

- Intakes page
  - Navigation label: **Our Intakes**
  - Route: `/[locale]/intakes`

- Intake detail page
  - Route: `/[locale]/intakes/[slug]`

- stories page
  - Navigation label: **Our Stories**
  - Route: `/[locale]/stories`

- Event detail page
  - Route: `/[locale]/stories/[slug]`

- Contact page
  - Navigation label: **Contact Us**
  - Route: `/[locale]/contact`
  - Includes newsletter subscription.

### URLs And SEO

- Use slugs instead of IDs for all public content routes.
- Slugs must be human-readable, lowercase, hyphen-separated, and SEO-oriented.
- Example: `/en/stories/field-training-camp-2025`

Every public page should use the Next.js Metadata API and include:

- `title`
- `description`
- Open Graph metadata
- Twitter metadata when useful
- Canonical URL
- Locale alternates / `hreflang`

Use semantic HTML:

- One `<h1>` per page.
- Proper heading hierarchy.
- Internal links between related intakes, stories, stories, and application/contact paths.

Performance:

- Use `next/image` for images.
- Lazy-load non-critical sections where appropriate.
- Generate `sitemap.xml` dynamically from database (published intakes, stories, contact page per locale) with 1-hour revalidation cache.
- Generate `robots.txt` as a static file.
- Exclude from sitemap: `/admin/*`, `/newsletter/confirm/*`, `/newsletter/unsubscribe/*`.

---

## Public Content Strategy

The landing page is complete with sufficient content. Other public content is designed for Multimedia management via the admin dashboard.

### Multimedia-Managed Public Content

Multimedia role can manage the following via admin CMS:

- **`webapp_contents`**: Hero text, statistics, FAQs, testimonials, see-more links, social media links, map embed (contact page).
- **Stories**: Full CRUD (create, read, update, delete) for event/story content.
- **Newsletters**: Subscriber management and email campaigns.
- **Application deadline**: Configurable seasonal intake deadline.

### Static/Non-Managed Content

- Landing page structure and layout (complete, no further content changes needed).
- Navigation labels and UI strings (managed via i18n dictionaries).
- Intake-specific content (managed via `intakes` and `intakeTranslations` tables).

Use real provided assets when available. The user has logos, colors, information, photos, and other ROTU assets, but do not invent missing assets. Current placeholder images (`default-hero-image.jpg`, `join-the-ranks-step-*.svg`) are real ROTU assets and should be kept as-is.

---

## Intake/Application Flow

The application/intake collection flow is seasonal, usually around October during the new academic year. It is not open all year.

### Application Workflow States

Applications progress through these statuses:

1. `DRAFT` - Applicant has started but not submitted.
2. `SUBMITTED` - Applicant has submitted the form.
3. `UNDER_REVIEW` - Secretary is reviewing the application.
4. `APPROVED` - Application passed review (may transition to `AWAITING_PHYSICAL_ASSESSMENT`).
5. `REJECTED` - Application did not pass review.
6. `AWAITING_PHYSICAL_ASSESSMENT` - Secretary has triggered the physical assessment email; applicant is expected to attend.
7. `PASSED` - Applicant completed physical assessment and is accepted.

### Required Documents

- IC copy (identity card).
- Blue-background passport photo.
- SPM transcripts.

### Physical Information

Collect height, weight, and BMI-related data as part of the application form.

### Physical Assessment Email

- Triggered **manually** by the Secretary after review.
- Not sent automatically on submission.
- Use Resend for email delivery.

### Application Deadline

- Admin-configurable (not hardcoded to October).
- Stored in `webapp_contents` or a similar configuration table.
- Multimedia role can update the deadline via admin dashboard.

### Email Templates

Three email templates are required:

1. **Newsletter confirmation** (already implemented).
2. **Application confirmation** - sent to applicant after successful submission.
3. **Application status update** - sent to applicant when status changes (e.g., `UNDER_REVIEW` -> `APPROVED`).

---

## Admin Dashboard

Admin routes are non-localized unless explicitly changed later.

### Layout

- Admin uses a comprehensive left sidebar.
- Sidebar is persistent on desktop.
- Sidebar is collapsible or drawer-based on smaller screens.
- Navigation is role-aware.
- Active route must be highlighted.
- Use lucide-react icons for navigation items.

### Admin Routing

`/admin` should route by role:

- `OFFICER` -> bento dashboard
- `INSTRUCTOR` -> bento dashboard
- `SECRETARY` -> `/admin/secretary/rank-holders`
- `TREASURER` -> `/admin/treasurer/collections`
- `MULTIMEDIA` -> `/admin/multimedia/portfolio`
- `SPORTS` -> `/admin/sports/activities`
- `WELFARE` -> `/admin/welfare/health`
- `ACADEMIC` -> `/admin/academic/results`

### Admin Data-Table Infrastructure

Admin list pages (cadets, rank-holders, intakes, accounts, collections, payments) share a server-side filtering, sorting, and pagination system with URL-based state.

**Shared components** (`components/admin/data-table/`):
- `TableToolbar` — search input, result count, optional actions slot, reset button.
- `GlobalFilterBar` — active filter pills + `FilterBuilder` ("Add filter" button) + `SortControl` popover.
- `SortableHead` — clickable column header with sort direction indicator and multi-sort priority number.
- `Pagination` — page size selector and prev/next navigation.
- `FilterBuilder` — stepped UI for adding column/operator/value filters.
- `FilterPill` — removable badge showing an active filter condition.
- `SortControl` — popover for managing multi-column sort rules with drag reorder.

**Server-side helpers** (`lib/admin/table-search-params.ts`):
- `parseTableSearchParams(raw, config)` — parses URL search params into `TableState` (q, sortRules, page, pageSize, filters).
- `buildEnumFilterClause(conditions, column)` — builds Drizzle SQL `inArray`/`notInArray` from filter conditions.
- `buildSortOrderBy(sortRules, fieldMap)` — builds Drizzle `asc`/`desc` order-by array from sort rules and a column map.
- `tableStateToQueryString(state, config)` — serializes `TableState` back to URL query string.
- `isTableStateDefault(state, config)` — checks if state matches config defaults (for showing reset button).
- `wrapLikePattern(input, mode)` — wraps search input for ILIKE queries (`%contains%` or `prefix%`).

**Client-side hook** (`lib/admin/use-table-url.ts`):
- `useTableURL({ searchParams, config, totalCount })` — manages URL-based table state with optimistic updates. Returns `{ state, update, reset, totalPages }`.

**Table config pattern**:
Each module defines a `TableConfig` with:
- `defaults` — initial `TableState` (q, sortRules, page, pageSize, filters).
- `sortKeys` — allowed sort column keys.
- `sortLabels` — display labels for sort keys.
- `filterColumns` — array of `FilterColumn` (enum with options, number, or string).
- `pageSizeOptions` — allowed page sizes.
- `prefix` — URL param prefix for pages with multiple tables.

A companion `SORT_FIELD_MAP` maps sort keys to Drizzle column references for `buildSortOrderBy`.

**When to use**: Any admin list/table page with filtering, sorting, and pagination. The pattern is: server page parses params → builds SQL → queries with WHERE/ORDER BY/LIMIT/OFFSET → passes rows + searchParams + totalCount to client → client renders with shared components.

---

## RBAC Roles And Modules

Each admin user has exactly one role.

### Officer

- Full access.
- Default: bento dashboard.

### Instructor

- Full access.
- Default: bento dashboard.

### Secretary

- Default: Rank Holders.
- Access:
  - Rank Holders (cadet admin users only)
  - Intakes
  - Cadets
  - Admin invitations/user management (cadets only)

### Treasurer

- Default: Collections.
- Access:
  - Accounts (treasury bank account & QR management)
  - Collections (create, publish, archive collection events)
  - Payments (payment ledger, receipt review, unpaid tracking)
  - Expenses

### Multimedia

- Default: Portfolio.
- Access:
  - Portfolio
  - stories/stories (full CRUD)
  - Newsletters
  - Public content management:
    - `webapp_contents` (hero text, stats, FAQs, testimonials, see-more links, social links, map embed)
    - Application deadline configuration
  - Public content/media areas as approved

### Sports

- Default: Activities.
- Access:
  - Activities
  - Collaborations

### Welfare

- Default: Health.
- Access:
  - Health
  - Accommodations
  - Religion

### Academic

- Default: Results.
- Access:
  - Results
  - Timetables

### Officer/Instructor Bento Dashboard

The global dashboard should include:

- Cross-system statistics.
- Quick access tiles.
- Summary cards for modules such as:
  - Intakes
  - stories/stories
  - Cadets
  - Finance, if applicable
  - Activities overview
  - Newsletter/public engagement, if applicable

---

## Data Model Direction

The starting schema may evolve as implementation needs become clearer.

Baseline entities discussed:

- Intake
- Intake display photos
- Intake patch explanations
- Academic year
- Session
- Exam
- Academic exam result
- Member
- Cadet
- Officers and instructors
- Admin invitation
- Admin role audit log
- Newsletter subscriber
- Event
- Event summaries
- Event tags
- Event keywords
- Event display photos
- Many-to-many relations for event tags/keywords

Enums discussed:

- Intake explanation keys: `ANIMAL`, `COLOR`, `PHILOSOPHY`
- Subscription status: `PENDING`, `ACTIVE`, `UNSUBSCRIBED`
- Application status: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`
- Gender: `MALE`, `FEMALE`
- Member role: `OFFICER`, `INSTRUCTOR`, `CADET`
- Member rank: `MAJOR`, `CAPTAIN`, `LIEUTENANT`, `SECOND_LIEUTENANT`, `WARRANT_OFFICER`, `SERGEANT`, `KOPERAL`, `LANS_KOPERAL`, `SENIOR_UNDER_OFFICER`, `JUNIOR_UNDER_OFFICER`, `SERGEANT_CADET`, `KOPERAL_CADET`, `PK`, `PKW`
- Cadet rank (subset of member rank, used for cadet filtering/sorting): `SENIOR_UNDER_OFFICER`, `JUNIOR_UNDER_OFFICER`, `SERGEANT_CADET`, `KOPERAL_CADET`, `PK`, `PKW`
- Admin audit action: `ROLE_CHANGED`, `INVITED`, `ACCEPTED`, `DROPPED`
- BMI classification: `UNDERWEIGHT`, `NORMAL`, `OVERWEIGHT`, `OBESE`
- Rejimen and Kor: Malaysian Army regiment and corps names
- Study events matching UMT event names

Important modeling notes:

- Keep auth/admin roles separate from public/member/cadet concepts if that produces cleaner RBAC.
- Use Drizzle schema as the source of truth for application data.
- Use Supabase Auth user IDs for authenticated admins.
- Prefer UUIDs for auth-linked/admin records and serial or UUID IDs for domain records based on project consistency.
- Store file paths/storage keys where possible, not only public URLs, especially for Supabase Storage-managed assets.
- Add translation tables for managed localized content rather than stuffing multiple language fields into primary tables.
- Ask before making major schema/workflow decisions.

#### Member-Admin Linking

- When a cadet becomes an admin (e.g., assigned Multimedia role), the admin identity is linked through the shared `memberId` — `adminUsers.memberId` references `members.id`, and `cadets.memberId` also references `members.id`. No separate FK is needed.
- Only cadets can be invited as admin users. The Secretary module (rank-holders, cadets page) operates exclusively on cadets, not officers or instructors.

#### Role Audit Log

- The audit log table (`adminRoleAuditLogs`) tracks all admin management events:
  - Action type: `INVITED`, `ACCEPTED`, `ROLE_CHANGED`, `DROPPED`.
  - Who performed the action (auth user ID).
  - Target member name (snapshot at event time).
  - Old role and new role (nullable depending on event type).
  - When the event occurred.
- Pending invitations are tracked in `adminInvitations` with `acceptedAt` marking acceptance.

---

## Newsletter

- Newsletter subscription appears on the Contact page.
- Newsletter management belongs to Multimedia.
- Use Resend for application/newsletter email sending when email functionality is implemented, unless this changes later.
- Subscriber states should support at least:
  - Pending confirmation
  - Active
  - Unsubscribed
- Confirmation and unsubscribe tokens must be unique and treated as sensitive.

---

## Architecture And Code Conventions

Preferred route groups:

```txt
app/[locale]/(marketing)
app/admin/(admin)
```

Preferred component organization:

```txt
components/ui/
components/marketing/
components/admin/
```

Conventions:

- Prefer Server Components.
- Use `"use client"` only when interactivity requires it.
- Use `@/*` imports.
- Use `cn()` for class merging.
- Use Server Components and Drizzle for reads.
- Use Server Actions or route handlers for mutations.
- Do not access the database directly from client components.
- Keep modules small and scalable.
- Build UI primitives by hand in `components/ui/` when shared controls are useful.

**Admin module structure and shared helpers (must-read before editing admin pages):**

- Admin list/entity pages must be split into small components under `components/admin/<entity>/` — never place a monolithic `client.tsx` under `app/admin/.../`. See `docs/architecture.md` §3.6 for the canonical file layout, responsibility boundaries, and anti-patterns.
- Before writing inline logic, check `lib/admin/*` and `lib/utils.ts` — the helper you need may already exist (e.g., `digitsOnly`, `takeNumber`, `isValidEduEmail`, `cn`). See `docs/architecture.md` §3.7 for the full catalog.
- When adding a new helper to `lib/`, run the `update-helpers-doc` skill to refresh the §3.7 catalog in `docs/architecture.md`.


---

## UI/UX Requirements

All interfaces must be fully responsive across:

- Mobile
- Tablet
- Desktop
- Large screens

No layout may break, overflow horizontally, or become unusable.

Responsive rules:

- Mobile-first.
- Use Flexbox/Grid.
- Avoid fixed widths where possible.
- Maintain readable typography.
- Use touch-friendly spacing.
- Ensure clean layout reflow.

### Visual Identity

The design should feel modern, military-inspired, and professional:

- Structured
- Disciplined
- Tactical
- Minimal
- Authoritative
- Functional over decorative

Allowed:

- Neutral/dark palettes with controlled accents
- Subtle non-decorative gradients
- Sharp UI elements
- Lucide icons
- Clear grid alignment
- Strong hierarchy

Avoid:

- Overly playful UI
- Excessive animation
- Clutter
- Soft consumer-style visuals
- Decorative effects that reduce clarity

Motion should be subtle and support usability.

### Typography

- Primary UI font: Geist Sans via `next/font/google`.
- Monospace/code font: Geist Mono via `next/font/google`.
- Keep system fallbacks in CSS for resilience.
- Revisit locale-specific fallbacks for Mandarin Chinese and Tamil during i18n implementation if glyph coverage or visual consistency is not strong enough.

### Public Navigation

Public pages must use a top navigation bar with:

- Primary navigation links
- Language switcher: EN / MS / ZH / TA
- Theme toggle: light/dark

Behavior:

- Responsive mobile menu.
- Sticky on scroll is preferred.
- Available across all public pages.

### Admin Navigation

Admin pages must use the left sidebar described in the Admin Dashboard section.

---

## Git Safety

- Keep changes scoped.
- Do not overwrite unrelated work.
- Do not commit build artifacts.
- Do not run destructive git commands unless explicitly requested.
- Preserve user changes in the working tree.
- When finishing a task, ask the user whether to commit.
- When committing, use Conventional Commit style prefixes such as `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, and `perf:`.

---

## Implementation Guidance

1. Public site is built — landing page, intakes, stories, contact pages are complete. Focus on maintenance and new features.
2. Admin dashboard surface is established with Supabase Auth, Google login, server-enforced RBAC, and role-aware sidebar navigation.
3. Keep Officer and Instructor as separate roles with the same highest-level permissions.
4. Treat user-managed localized content with translation tables where appropriate.
5. Keep public slugs SEO-first.
6. Use real ROTU assets/content only when supplied. Do not invent missing assets.
7. Ask before introducing complex architecture, workflow, or schema changes.
8. The `crypto` npm package is a deprecated shim — use Node.js built-in `node:crypto` instead.
9. The Secretary module manages cadets only — rank-holders shows cadet admin users, and the cadets page queries from the `cadets` table. Officers and instructors are not managed through Secretary.

---

## Documentation

- Keep architecture documentation in `docs/architecture.md`.
- Keep requirements documentation in `docs/srs.md`.

---

## Agent Workflow Preferences

- Do not write comments during code generation unless explicitly requested by the user.
- For complex tasks:
  1. Start in `/plan` mode with high reasoning to produce a high-level solution.
  2. Switch to or use a medium model to implement the plan.
  3. Use a low-reasoning, cost-effective model for translations and review of the changes made.
