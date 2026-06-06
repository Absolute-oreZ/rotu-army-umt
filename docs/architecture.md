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
  - `app/(root)` redirects `/` to default locale `/en`.
  - `app/[locale]` provides locale-aware root document, metadata base, and hosts all public pages directly (no intermediate `(public)` route group).
  - `app/admin` hosts admin pages and admin shell.
- UI components:
  - Public components under `components/public`.
  - Shared primitives under `components/ui`.
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

### 3.3 Data Layer
- Drizzle database client in `db/index.ts`.
- Schema definitions in `db/schema.ts`.
- SQL migrations under `db/migrations`.
- Seed tooling in `db/seed.ts` using curated default content from `lib/data.ts`.

### 3.4 External Services
- Supabase:
  - Browser/server/admin clients in `lib/supabase/*`.
  - Auth callback route at `app/auth/callback/route.ts`.
- PostgreSQL:
  - Accessed through `postgres` driver + Drizzle.

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

### 4.2 Admin Routes (Non-localized)
Current implemented routes:
- `/admin/login` (Google OAuth start)
- `/admin` (role-aware root behavior; full-access roles see dashboard shell)
- `/auth/callback` (OAuth code exchange)

Planned role module routes exist in RBAC mapping but most pages are not yet implemented.

## 5. Localization Architecture
- Supported locales: `en` (default), `ms`, `zh`, `ta`.
- Locale validation and fallback typing via `isLocale` and `Locale` union.
- Dictionary-per-locale loading with dynamic imports.
- Public header includes language switching by URL segment replacement.
- Locale-aware metadata baseline generated in `app/[locale]/layout.tsx`.

## 6. Authentication and Authorization
### 6.1 Authentication
- Admin login uses Supabase OAuth provider `google` (`app/admin/login/actions.ts`).
- Callback exchanges auth code for session (`app/auth/callback/route.ts`).
- Session is read server-side via Supabase SSR client.

### 6.2 Authorization (RBAC)
- `admin_users` table links Supabase auth user to exactly one app role.
- `requireCurrentAdmin()` enforces admin session.
- `requireAdminModule(module)` enforces module-level access on server.
- Full-access roles: `OFFICER`, `INSTRUCTOR`.
- Role default route map is centralized in `lib/admin/roles.ts`.

## 7. Data Model Architecture
Primary schema domains in `db/schema.ts`:
- Admin identity and role mapping: `admin_users`.
- Public intakes and translations:
  - `intakes`, `intake_translations`, `intake_patch_explanations`, `intake_patch_explanation_translations`, `intake_display_photos`.
- Academic structure:
  - `academic_years`, `sessions`, `exams`, `academic_exam_results`.
- Members and cadet data:
  - `members`, `cadet_infos`, `study_programs`.
- Newsletter:
  - `newsletter_subscribers` with status and token hash fields.
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
- Role changes: delete + recreate pattern (not direct update).
- Only `OFFICER` or `INSTRUCTOR` can change roles.
- Role audit log table tracks: who changed it, when, old role, new role, target admin user.
- Member-admin linking: `adminUsers` can have nullable FK to `cadetInfos.id` when a cadet becomes an admin.

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
- �See also� fallback links.

This supports early public page delivery while admin-managed content modules are still in progress.

## 10. Runtime, Build, and Operations
- Package manager: `npm`.
- Scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed`
- Environment separation:
  - Public env validation in `lib/env/public.ts`.
  - Server env validation in `lib/env/server.ts`.
- Remote images currently allow Supabase storage host via `next.config.ts`.

## 11. Current Gaps vs Target Architecture
Based on `TASKS.md` and codebase review:

### Completed
- Public pages: landing, intakes list, intake detail, stories list, stories detail, stories by tag, contact page.
- Newsletter: subscription form, double opt-in confirmation, unsubscribe flow (Resend integration complete).
- Localization: all 4 locales (en, ms, zh, ta) with dictionaries.
- Root not-found page for invalid locales (hardcoded English, acceptable).

### Pending
- Public SEO completeness: dynamic `sitemap.xml` from DB, static `robots.txt`, per-page canonical/hreflang audit.
- Error handling: localized page-level `not-found`, route-level error boundaries.
- Admin shell: role-aware sidebar, all role module pages (rank-holders, intakes, cadets, collections, expenses, portfolio, stories, newsletters, activities, collaborations, health, accommodations, religion, results, timetables).
- Admin CMS: Multimedia-managed `webapp_contents`, stories CRUD, newsletter management, application deadline config.
- Secretary admin user management with role change (delete + recreate) and audit logging.
- Seasonal intake application workflow: form, document upload, status transitions, physical assessment email trigger.
- Email templates: application confirmation, application status update.
- Schema additions: application status enum, role audit log table, admin-cadet linking FK.

## 12. Key Risks and Considerations
- AGENTS constraints require avoiding fabricated ROTU-specific facts; seeded/demo content should be treated as placeholder until confirmed.
- Public pages must remain fully translatable; avoid introducing hardcoded UI strings in new components.
- RBAC must remain server-enforced; client-side checks are convenience only.
- Next.js version drift: framework-sensitive updates should be validated against local Next.js docs in `node_modules/next/dist/docs`.

## 13. Recommended Next Architectural Steps
1. Implement admin shell with role-aware sidebar navigation and module routing guards.
2. Build schema additions: application status enum, role audit log table, `adminUsers.cadetInfoId` nullable FK.
3. Build intake application workflow: form, document upload, status state machine, Secretary review UI, physical assessment email trigger.
4. Build email templates for application confirmation and status update notifications.
5. Implement admin CMS modules: Multimedia for `webapp_contents`, stories CRUD, newsletter management; Secretary for admin user management with delete+recreate role changes and audit logging.
6. Add dynamic `sitemap.xml` route (DB-driven, 1-hour cache) and static `robots.txt`.
7. Add localized page-level `not-found` and route-level error boundaries.
8. Audit per-page canonical URLs and `hreflang` alternates across all public routes.
