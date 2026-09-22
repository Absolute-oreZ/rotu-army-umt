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
- [x] Build Secretary admin module:
- [x] Secretary rank holders (`/admin/secretary/rank-holders`)
- [x] Secretary intakes (`/admin/secretary/intakes`)
- [x] Secretary cadets (`/admin/secretary/cadets`)
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
- [x] Build Treasurer admin module:
- [x] Treasury account management (`/admin/treasurer/accounts`)
- [x] Collection creation and management (`/admin/treasurer/collections`)
- [x] Payment ledger and detailed records (`/admin/treasurer/payments`)
- [x] Expenses management (`/admin/treasurer/expenses`)
- [x] Cadet self-service payment page (`/cadet/collections/[slug]`)
- [x] Cadet collections portal (`/cadet/collections`)
- [x] Cadet claims portal (`/cadet/claims`)
- [x] Cadet authentication via Google OAuth (`/cadet/login`, `lib/auth/cadet.ts`)
- [x] Treasurer lifecycle cleanup: delete treasury accounts when role changes away from Treasurer
- [x] Build Multimedia admin module:
- [x] Multimedia portfolio (`/admin/multimedia/portfolio`)
- [x] Multimedia stories (`/admin/multimedia/stories`)
- [x] Multimedia newsletters (`/admin/multimedia/newsletters`)
- [x] Build Sports admin module:
- [x] Sports metrics (`/admin/sports/metrics`) with per-cadet metrics and inline editing guard.
- [x] Sports UKA records (`/admin/sports/uka`)
- [x] Sports APFA records (`/admin/sports/apfa`)
- [x] Sports assessments (`/admin/sports/assessments`)
- [x] Add platoon support with nullable cadet-to-platoon assignment.
- [x] Build Welfare admin module:
- [x] Welfare Attend (`/admin/welfare/attend`)
- [x] Welfare accommodations (`/admin/welfare/accommodations`)
- [x] Welfare religious activities (`/admin/welfare/religious-activities`)
- [x] Build Academic admin module:
- [x] Academic courses (`/admin/academic/courses`)
- [x] Academic results (`/admin/academic/results`)
- [x] Academic timetables (`/admin/academic/timetables`)
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
- [x] Finance identifier migration finalized: numeric `account_number`/`duitnow_id` columns dropped from `cadetAccounts` and `treasuryAccounts` in `db/schema.ts`; migration history squashed into a single `0000` migration containing text-only columns; `backfill-finance-identifiers.ts`/`switch-finance-identifiers.ts` removed (no production data exists, so no backfill is required); seed data uses string identifiers; `db:generate` reports no schema drift.
- [x] Treasurer Accounts/Collections runtime queries use text columns only; numeric `AccountDetails` fields removed.
- [x] Treasurer Payments: no implicit initial collection selection — initial entry shows no selection; explicit `collectionId` loads only when accessible; invalid/inaccessible IDs select nothing.
- [x] Welfare Attend: details sheet removed; inline row editing with Save/Cancel is the only edit path.
- [x] Sports Assessments: edit state preloads current row values (`0` stays `0`, `null` stays blank) via `getInitialAssessmentValues`.
- [x] Newsletter HTML safety: sanitizer hardening (whitespace-obfuscated `javascript:`/`data:` payloads and scheme-relative URLs rejected), sanitize-on-read for admin preview/edit, and sanitize-before-send (`sanitizeHtmlForEmail`) on both deliver and retry paths.
- [x] Newsletter delivery: Resend batch `Idempotency-Key` header (`newsletter-batch-<campaignId>-<first-delivery-key>`) added on both send paths; `recipientCount` accumulates across chunked invocations; raw provider error text replaced with generic `Newsletter delivery failed.` (details logged server-side only).
- [x] Cron auth: real `crypto.timingSafeEqual` with byte-length comparison in `app/api/cron/newsletters/route.ts`; `NEWSLETTER_UNSUBSCRIBE_SECRET` no longer falls back to `CRON_SECRET`.
- [x] Newsletter confirm/unsubscribe: GET is read-only status preview; mutation happens only via Server Action form posts.
- [x] Auth callbacks: admin `not-authorized` and cadet `member-not-found`/`not-a-cadet` rejections now sign out the session before redirecting; Supabase Auth users are never deleted on rejection.
- [x] Rate limiter: atomic `INSERT ... ON CONFLICT DO UPDATE` with `count+1` in `lib/rate-limit.ts`; unique-violation and fallback paths fail closed.
- [x] URL validation: scheme-relative URLs (`//evil.example`) rejected by `validateUrl`; relative-path helper cannot produce external redirects.
- [x] Stable pagination: PK tiebreaker appended unconditionally to Attend, Religious Activities, Academic Courses (cadet + course queries), and newsletter list ordering; all other shared data-table pages verified to already include one.
- [x] Newsletter list payload: `getNewsletterCampaigns` slimmed to metadata (heavy `contentHtml`/`contentText` only in details/send paths); unused `CampaignRow` type removed from actions.
- [x] Added canonical `typecheck` script (`tsc --noEmit`) to `package.json`.
