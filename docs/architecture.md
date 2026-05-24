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
  - `app/[locale]` provides locale-aware root document and metadata base.
  - `app/[locale]/(public)` hosts public pages and shared public shell/header.
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
  - `lib/public/content.ts` contains server-side read models for published intakes, programs, and homepage content.
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

Target routes (planned in `TASKS.md`):
- `/<locale>/intakes/[slug]`
- `/<locale>/stories`
- `/<locale>/stories/[slug]`
- `/<locale>/contact`

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
- stories and metadata:
  - `programs`, `program_translations`, `program_tags`, `program_tag_translations`, `programs_to_tags`, `program_display_photos`.
- Homepage-managed content:
  - `webapp_contents`, `frequently_asked_questions`, `frequently_asked_question_translations`, `see_more_links`, `testimonials`, `testimonial_translations`.

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
Based on `TASKS.md`, pending major items include:
- Public pages: intake detail, stories list/detail, contact page.
- Public SEO completeness: per-page canonical/hreflang, sitemap, robots.
- Error handling: localized `not-found`, route-level error boundaries.
- Newsletter submission and confirmation flow.
- Admin shell with role-aware sidebar and role module pages.
- Seasonal intake application workflow and email templates.

## 12. Key Risks and Considerations
- AGENTS constraints require avoiding fabricated ROTU-specific facts; seeded/demo content should be treated as placeholder until confirmed.
- Public pages must remain fully translatable; avoid introducing hardcoded UI strings in new components.
- RBAC must remain server-enforced; client-side checks are convenience only.
- Next.js version drift: framework-sensitive updates should be validated against local Next.js docs in `node_modules/next/dist/docs`.

## 13. Recommended Next Architectural Steps
1. Complete public route surface (`intake detail`, `stories`, `contact`) using existing content service pattern.
2. Add shared SEO utilities for canonical + alternates to avoid repeated metadata logic.
3. Introduce admin shell and module route scaffolding with `requireAdminModule` guard usage.
4. Implement newsletter mutation endpoints with token hashing and status transitions.
5. Add sitemap and robots generation routes once public content routes are complete.
