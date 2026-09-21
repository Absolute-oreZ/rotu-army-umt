# TASKS.md

Living implementation tracker for the ROTU Army UMT web application.

Recommended direction: finish the shared foundation first, then build the public website before the full admin dashboard. The public site validates routing, i18n, theme, SEO, visual identity, and real content structure quickly. Admin should still get an early auth/RBAC/data skeleton so public content can later become admin-managed without a rewrite.

Updated implementation direction: public pages should be built against reusable Drizzle-backed content access where appropriate, with placeholder/empty states only when no published content exists. This keeps the public site useful now while allowing Multimedia and other admin roles to control content later without rewriting the page surfaces.

- [x] Initialized project collaboration instructions in `AGENTS.md`.
- [x] Added project decisions for Supabase, Google-only admin login, RBAC, i18n, public routes, admin modules, newsletter, and seasonal intake flow.
- [x] Clarified that Secretary normally owns admin invitations/user management, while Officer and Instructor can also access it through full permissions.
- [x] Selected Resend as the planned email provider for intake/newsletter email sending.
- [x] Verified current project structure, installed dependencies, and relevant local Next.js 16 documentation notes.
- [x] Chose Geist Sans and Geist Mono as the primary app fonts and aligned Tailwind CSS font tokens.
- [x] Set up foundational locale routing for `en`, `ms`, `zh`, and `ta`.
- [x] Add translation dictionary structure and helpers with English as the default locale.
- [x] Set up theme support for light/dark mode.
- [x] Build public layout shell with responsive top navigation, language switcher, and theme toggle.
- [x] Revisit Mandarin Chinese and Tamil font fallbacks during locale implementation.
- [x] Configure Supabase server/client helpers without exposing secrets.
- [x] Configure Drizzle ORM and baseline schema/migration structure.
- [x] Confirm final admin role enum and auth-linked admin user table.
- [x] Model admin users and roles separately from public member/cadet records.
- [x] Implement server-enforced RBAC helpers and role-aware admin redirects.
- [x] Build initial Google-only admin login with Supabase Auth.
- [x] Add public content data access layer for published intakes and stories.
- [x] Build landing page at `/[locale]/`.
- [x] Build intakes list page at `/[locale]/intakes`.
- [x] Build intake detail page at `/[locale]/intakes/[slug]`.
- [x] Build stories page at `/[locale]/stories`.
- [x] Build story detail page at `/[locale]/stories/[slug]`.
- [x] Build story tags page at `/[locale]/stories/tags/[slug]`.
- [x] Build contact page at `/[locale]/contact`.
- [x] Add newsletter subscription form on Contact page.
- [x] Add localized public `not-found.tsx` handling for missing pages/resources.
- [x] Add global error boundaries for public surfaces (`app/error.tsx`).
- [x] Add SEO metadata, canonical URLs, and locale alternates for public pages.
- [x] Add `sitemap.xml` and `robots.txt`.
- [x] Draft Drizzle schema for intakes, members, cadets, stories, newsletters, and academic results.
- [x] Use translation tables for managed localized content.
- [x] Store Supabase Storage paths/keys for managed files and images.
- [x] Build admin layout shell with responsive left sidebar navigation.
- [x] Build Secretary modules: Rank Holders, Intakes, Cadets.
- [x] Build admin invitation acceptance flow in auth callback (first Google login creates admin record atomically).
- [x] Build admin role audit logging (INVITED, ACCEPTED, ROLE_CHANGED, DROPPED events).
- [x] Build admin management emails via Resend (invitation, role change, removal notifications).
- [x] Add Resend configuration for admin and newsletter email sending.
- [x] Build shared data-table infrastructure (filter/sort components, search params parser, URL state hook).
- [x] Extend schema: cadet physical metrics (height, weight, BMI, CGPA), member fields (birthdate, age, regiment), officers and instructors table.
- [x] Create newsletter confirmation email template.
- [x] Create unsubscribe flow and email handling.
- [x] Implement intake-scoped RBAC: add intakeId to adminUsers and adminInvitations, intake scope helpers, and Secretary module enforcement (reads + writes).
- [x] Update auth callback to propagate intakeId from invitation to adminUsers on acceptance.
- [x] Update documentation (AGENTS.md, architecture.md, srs.md) for intake-scoped access control.
- [x] Build Treasurer modules:
- [x] Treasury account management (`/admin/treasurer/accounts`)
- [x] Collection creation and management (`/admin/treasurer/collections`)
- [x] Payment ledger and detailed records (`/admin/treasurer/payments`)
- [x] Expenses management (`/admin/treasurer/expenses`)
- [x] Cadet self-service payment page (`/cadet/collections/[slug]`)
- [x] Cadet authentication via Google OAuth (`/cadet/login`, `lib/auth/cadet.ts`)
- [x] Treasurer lifecycle cleanup: delete treasury accounts when role changes away from Treasurer
- [x] Build Multimedia modules: Portfolio, stories, Newsletters.
- [x] Build Sports module: Metrics (health records with per-cadet metrics, inline table editing on desktop with unsaved-changes guard).
- [x] Build Sports modules: UKA/APFA assessment records + Assessments per-cadet result entry (env-based passing thresholds with defaults).
- [x] Add platoon support with nullable cadet-to-platoon assignment.
- [x] Build Welfare modules: Attend (absence records, env-based sources) + Accommodations (auto-created on cadet creation, gender-scoped for intake admins).
- [x] Build Welfare module: Religious Activities (env-based types, autogenerated type-date titles with unique guard, photo gallery via view-only carousel).
- [x] Build Academic modules: Courses (cadet course assignment + course management), Results (per-session GPA/CGPA with tier pills, result slips), Timetables (60-min slot editor with locked lunch break, PDF uploads).
## Audit Phase 1

- [x] Environment schema, validation script and `.env.example` (Task 1.1).
- [x] Storage service with private-bucket routing and object migration script (Task 1.2).
- [x] Fail-closed intake scope and identity invariant (Task 1.3).
- [x] Inactive cadets blocked from cadet portal and admin (Task 1.3).
- [x] Secretary pages guarded with requireAdminModule (Task 1.3).
- [x] Seed script safety guard (Task 1.4).
- [X] Delete migrated sources from the public bucket after production verification.
- [X] Set canonical env vars in Vercel (Production and Preview), remove old `SPORTS_*`/`WELFARE_*` names, and run the migration copy once more after deploy.

- [ ] Build Officer and Instructor bento dashboard.
- [ ] Add route-level error boundaries for admin surfaces.
- [ ] Confirm required documents and fields for seasonal intake applications.
- [ ] Build seasonal intake application form and submission flow.
- [ ] Create intake physical assessment email template.
- [ ] Create application confirmation email template.
- [ ] Create application status update email template.
- [ ] Audit per-page canonical URLs and hreflang alternates across all public routes.
- [ ] Develop Retrieval-Augmented Generation (RAG).

## Phase 2 Hardening

- [x] Fix `escapeCsvField` placement in newsletter actions (moved above `exportSubscribers`).
- [x] Reconcile upload kinds: `"document"` pseudo-kind removed; receipts and attachments validate as `image`/`pdf` content (`lib/storage/files.ts`).
- [x] Fix Turnstile widget render race on the newsletter form (explicit render on script ready, dev fail-open, token reset path).
- [x] Add `https://challenges.cloudflare.com` to CSP `script-src` and `frame-src` in `next.config.ts`.
- [x] Derive cadet-search intake scope server-side in `app/admin/welfare/attend/search-actions.ts` (client-supplied scope removed).
- [x] Story video direct upload: signed upload tickets (`lib/storage/uploads.ts`), `requestStoryVideoUpload`/`finalizeStoryVideo` actions, create/edit client flows with retry; video never travels through a Server Action; legacy `uploadToStorage()` removed.
- [x] Story create no longer aborts photo writes or orphans cover uploads when no video is attached.
- [x] B25: shared `ReceiptThumbnail` component with sized containers, PDF link tile, and `unoptimized` signed images (expenses, claims, payments, QR previews).
- [x] P1: request-local admin auth caching via `cache()` in `lib/admin/rbac.ts`; dead `lib/admin/cached-rbac.ts` removed.
- [x] P8: cadet claim + account write wrapped in one transaction; storage ordering rules documented (§14.2).
- [x] P9: all signed-URL `next/image` sites render `unoptimized`; PDFs never rendered as images.
- [x] P10: `bulkUpdateDeliveries` set-based SQL with chunking; retry worker uses bulk updates; `FAILED` campaigns allowed into the sending lease; cron processes failed campaigns via `getFailedNewsletterCampaignIds`.
- [x] Robots: `/cadet/` and `/auth/` disallowed in `app/robots.ts`.
- [x] Dead code cleanup: `generateThumbnail` stub, numeric finance-identifier locals in actions, unused imports; tsc and eslint pass with zero errors/warnings.
