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
- [ ] Build Sports modules: Activities, Collaborations.
- [ ] Build Welfare modules: Health, Accommodations, Religion.
- [ ] Build Academic modules: Results, Timetables.
- [ ] Build Officer and Instructor bento dashboard.
- [ ] Add route-level error boundaries for admin surfaces.
- [ ] Confirm required documents and fields for seasonal intake applications.
- [ ] Build seasonal intake application form and submission flow.
- [ ] Create intake physical assessment email template.
- [ ] Create application confirmation email template.
- [ ] Create application status update email template.
- [ ] Audit per-page canonical URLs and hreflang alternates across all public routes.
- [ ] Develop Retrieval-Augmented Generation (RAG).
