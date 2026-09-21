# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This SRS defines functional and non-functional requirements for the ROTU Army UMT web application, covering the public marketing site and the admin dashboard.

### 1.2 Scope
The product provides:
- A multilingual public-facing site to present ROTU Army UMT and drive student interest.
- A protected admin system for role-based operations, content management, and reporting.

### 1.3 Definitions
- ROTU/PALAPES: Reserve Officer Training Unit context for UMT.
- RBAC: Role-Based Access Control.
- Locale: Language route prefix (`en`, `ms`, `zh`, `ta`).
- Full-access roles: `OFFICER`, `INSTRUCTOR`.

## 2. Overall Description
### 2.1 Product Perspective
Web app built on Next.js App Router with Supabase Auth and PostgreSQL (Drizzle ORM). Public and admin surfaces share a single codebase.

### 2.2 User Classes
- Public visitor: browses marketing pages and stories, may subscribe to newsletter.
- Admin users (one role each):
  - OFFICER
  - INSTRUCTOR
  - SECRETARY
  - TREASURER
  - MULTIMEDIA
  - SPORTS
  - WELFARE
  - ACADEMIC

### 2.3 Operating Environment
- Modern desktop/mobile browsers.
- Node.js runtime for Next.js server rendering/actions.
- Supabase project for Auth and Storage (public and private buckets).
- PostgreSQL database.

### 2.4 Constraints
- Must use `npm`.
- Must keep server-side RBAC enforcement.
- Must not expose secrets.
- Must avoid unverified/fabricated ROTU-specific facts.
- Public routes must be locale-prefixed.

## 3. Functional Requirements

### 3.1 Localization and Routing
1. System shall support locales `en`, `ms`, `zh`, `ta`.
2. System shall serve public pages under `/<locale>/...`.
3. System shall default root `/` redirect to `/en`.
4. System shall expose localized UI strings via translation dictionaries.
5. System shall provide language switcher in public navigation.

### 3.2 Public Navigation and Layout
1. System shall provide a shared public layout with top navigation.
2. Navigation shall include About Us, Our Intakes, Our Stories, Contact Us.
3. Public header shall include language switcher and light/dark theme toggle.
4. Navigation shall support responsive mobile menu.

### 3.3 Public Pages
#### 3.3.1 Landing Page
1. System shall render localized hero, statistics, FAQ, testimonials, and related links.
2. System shall read content from DB-backed services with fallback values when data is unavailable.

#### 3.3.2 Intakes List Page
1. System shall render published intakes from database.
2. System shall show placeholder empty state when no published intakes exist.

#### 3.3.3 Intake Detail Page
1. System shall render intake detail by slug with patch explanations, gallery, cadet list, and uniform visuals.
2. System shall provide tabbed navigation between summary, patch, and uniform sections.

#### 3.3.4 Stories Pages
1. System shall render stories list grouped by year.
2. System shall render story detail by slug with photo gallery, tags, and similar stories.
3. System shall render stories filtered by tag with tag archive view.

#### 3.3.5 Contact Page
1. System shall render contact page with contact reasons, social links, map embed, and newsletter subscription form.
2. System shall support newsletter double opt-in confirmation and unsubscribe flows.

### 3.4 SEO and Discoverability
1. System shall use Next.js Metadata API for public pages.
2. Each public page shall have title and description.
3. System shall provide Open Graph metadata for public pages.
4. System shall provide canonical URLs and locale alternates (`hreflang`) for public pages.
5. System shall provide `sitemap.xml` and `robots.txt`.

### 3.5 Authentication
1. System shall support admin sign-in using Google OAuth via Supabase Auth.
2. System shall process OAuth callback and establish server session.
3. System shall deny admin access when session is absent.
4. System shall check for a pending invitation on first Google login. If a matching invitation exists, the system shall atomically create the admin record, accept the invitation, and log the event. Uninvited users shall be redirected with an authorization error.
5. System shall deny admin access to admins whose cadet record is inactive.

### 3.6 Authorization (RBAC)
1. System shall assign exactly one admin role per admin user.
2. System shall enforce RBAC checks on the server.
3. System shall map `/admin` default routing by role:
   - OFFICER -> `/admin`
   - INSTRUCTOR -> `/admin`
   - SECRETARY -> `/admin/secretary/rank-holders`
   - TREASURER -> `/admin/treasurer/collections`
   - MULTIMEDIA -> `/admin/multimedia/portfolio`
   - SPORTS -> `/admin/sports/metrics`
   - WELFARE -> `/admin/welfare/health`
   - ACADEMIC -> `/admin/academic/results`
4. OFFICER and INSTRUCTOR shall be separate roles with same highest permissions.
5. OFFICER and INSTRUCTOR shall bypass module restrictions entirely and access all admin routes and content.
6. Other roles shall see only paths and content under their assigned module access.
7. Admin roles can be changed after creation, but only by OFFICER or INSTRUCTOR.
8. Adding an admin shall create an invitation and send an email. The admin record is created when the invitee signs in via Google.
9. System shall log all admin management events (INVITED, ACCEPTED, ROLE_CHANGED, DROPPED) with actor, target, roles, and timestamp.
10. Multi-role assignments are not allowed. One admin user = one role, strictly.
11. System shall support intake-scoped access control for Secretary, Treasurer, Sports, Welfare, and Academic roles.
12. Intake-scoped admins shall only read and write data belonging to their assigned intake.
13. Officer and Instructor shall bypass intake restrictions and access all intakes.
14. Multimedia role shall remain unrestricted across all intakes.
15. System shall validate intake ownership on all write operations in intake-scoped modules.
16. Secretary may invite an admin with any role.
17. The Intakes module shall be global (not intake-scoped) for all roles that can access it.
18. Intake-scoped admins shall always be assigned an intake; an unassigned scoped admin shall be denied access.

### 3.7 Admin Modules
1. System shall provide role-aware module access:
   - Secretary: rank holders (cadet admin users only), intakes (global), cadets (cadet management), admin invitations (cadets only).
   - Treasurer: account management (bank/QR), collection creation and management, payment ledger, expenses.
   - Multimedia: portfolio, stories (full CRUD), newsletters, `webapp_contents` (hero text, stats, FAQs, testimonials, see-more links, social links, map embed), application deadline configuration.
   - Sports: metrics (cadet health metric records), UKA records, APFA records, assessments (per-cadet UKA/APFA result entry).
   - Welfare: attend (cadet absence records, Attend B/C with env-based sources (`NEXT_PUBLIC_WELFARE_ATTEND_SOURCES`)), accommodations (gender-scoped for intake-scoped admins), religious activities (env-based types (`NEXT_PUBLIC_WELFARE_REGLIGIOUS_ACTIVITIES_TYPES`), photo gallery).
   - Academic: results, timetables.
2. Full-access roles (OFFICER, INSTRUCTOR) shall access all modules.
3. System shall support inline row editing in the Sports metrics table on desktop, fall back to dialog editing on mobile, and confirm with the user before discarding an unsaved row edit when the table state or selected record changes.
4. System shall support UKA and APFA assessment records — one record per intake per session per year, auto-numbered and labeled `UKA-1-2026` style — with per-cadet results per assessment item (UKA: push-up, sit-up, 2.4km run; APFA: 1.6km run, pull-up, swimming, floating), gender-based passing thresholds read from environment variables (`NEXT_PUBLIC_SPORTS_*`) with hardcoded defaults, per-item pass evaluation, and an overall PASS/FAIL result finalized only when all items are recorded.

### 3.8 Newsletter
1. System shall collect newsletter subscriptions from contact page.
2. Subscriber status shall support `PENDING`, `ACTIVE`, `UNSUBSCRIBED`.
3. Confirmation and unsubscribe tokens shall be unique and treated as sensitive.
4. Newsletter management shall be available to Multimedia role.

### 3.9 Intake/Application Flow
1. System shall support seasonal intake application periods with admin-configurable deadlines.
2. System shall collect biodata, required documents (IC copy, blue-background passport photo, SPM transcripts), and physical metrics (height, weight, BMI-related data).
3. Application status shall progress through: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.
4. System shall send application confirmation email upon successful submission.
5. System shall send application status update email when status changes (e.g., `UNDER_REVIEW` -> `APPROVED`).
6. System shall allow Secretary to manually trigger physical assessment email after review (not automatic).
7. System shall use Resend for all email delivery.

### 3.10 Email Templates
1. Newsletter confirmation (already implemented).
2. Application confirmation - sent to applicant after successful submission.
3. Application status update - sent to applicant when status changes.

### 3.11 Sitemap and Robots
1. System shall generate `sitemap.xml` dynamically from database (published intakes, stories, contact page per locale).
2. Dynamic sitemap shall use 1-hour revalidation cache.
3. System shall generate `robots.txt` as a static file.
4. System shall exclude from sitemap: `/admin/*`, `/newsletter/confirm/*`, `/newsletter/unsubscribe/*`.

### 3.12 Cadet Authentication
1. System shall support cadet sign-in using Google OAuth via the same Supabase project.
2. System shall verify the cadet's email ends with `@ocean.umt.edu.my`.
3. System shall look up the cadet's member record by `eduEmail` matching the authenticated email.
4. System shall verify the member role is `CADET` and a cadet record exists.
5. System shall redirect unauthorized users to the cadet login page with an appropriate error message.
6. System shall enforce cadet auth per-page (not in the layout) to avoid redirect loops.
7. System shall deny cadet sign-in and portal access when the cadet record is inactive.

### 3.13 Treasurer Payment System
1. System shall allow Treasurers to manage treasury accounts (bank name, account number, QR code, DuitNow ID) scoped to their intake.
2. System shall allow Treasurers to create collections with title, purpose, description, amount (fixed or flexible), receipt requirement, and linked payment account.
3. Collections shall follow a DRAFT ↔ PUBLISHED → ARCHIVED lifecycle.
4. System shall generate a unique slug for each collection for cadet-facing URLs.
5. System shall provide a cadet self-service payment page at `/cadet/collections/[slug]` showing collection details, payment account info, and QR code.
6. System shall allow cadets to record payments with amount (if flexible) and receipt upload (if required).
7. System shall prevent duplicate payments per cadet per collection via a unique constraint.
8. System shall store payment receipts in the private storage bucket and serve them only through short-lived signed URLs.
9. System shall provide a payments ledger for Treasurers showing all payments across collections, filterable by collection.
10. System shall show summary statistics (total collected, paid count vs. expected count) for selected collections.
11. System shall track and display unpaid cadets for each collection.
12. System shall allow Treasurers to delete payment records for corrections.
13. System shall delete a Treasurer's treasury accounts when their role is changed to non-Treasurer.
14. Collections shall survive treasury account deletion but lose the payment account link (`onDelete: set null`).
15. Payment records shall never be deleted through cascade.

### 3.13.1 Finance Identifier Migration (account_number → text)
1. System shall store finance identifiers (account numbers, DuitNow IDs) as text columns (`account_number_text`, `duitnow_id_text`) alongside existing numeric columns in `cadet_accounts` and `treasury_accounts`.
2. System shall provide a migration to backfill text columns from numeric columns (preserving leading zeros and non-numeric characters).
3. Application code shall read and write text columns exclusively after migration verification.
4. Numeric columns shall be retained temporarily for rollback safety, then dropped after production verification.

### 3.13.2 Direct Upload for Large Files
1. System shall support direct-to-Supabase uploads for files exceeding Server Action body limits (e.g., story videos >5MB).
2. Server shall create signed upload tickets with server-derived storage paths; client PUTs directly to Supabase Storage.
3. Server shall verify uploaded object existence before updating database records.
4. Failed uploads shall be cleaned up automatically.
5. Legacy routed upload helper removed; story video uses the ticket-based flow end-to-end, and receipts/attachments validate as `image` or `pdf` content kinds.

### 3.14 Newsletter Reliability
1. System shall use a SENDING lease mechanism (2-minute TTL, 30-second heartbeat) to prevent concurrent newsletter sends.
2. Each delivery shall have a stable idempotency key (`campaignId-subscriberId-updatedAt`) with unique index to prevent duplicate sends on retry.
3. Sent/failed counts shall be cumulative (not overwritten per cron run); `recipientCount` tracks total sent.
4. Cron worker shall process deliveries in batches of 50 with up to 3 retries per batch.
5. Resend batch API idempotency keys shall be used for email-level deduplication.
6. Editing campaigns with status `SENT` or `SENDING` shall be blocked.
7. Cron shall process scheduled campaigns, recover stuck SENDING campaigns (expired leases), and retry failed deliveries.

### 3.15 Server-Backed Search
1. System shall replace client-side loading of large dropdowns (500+ cadets/members) with server-side search APIs.
2. Search shall support filtering by name, army number, and matric number (minimum 2 characters).
3. Results limited to 20 entries, ordered alphabetically by name.
4. Search shall respect intake scope for intake-scoped admin roles (Secretary, Treasurer, Sports, Welfare, Academic).
5. Full-access roles (Officer, Instructor, Multimedia) shall search across all intakes.
6. Client shall use debounced input with results dropdown; no full list loaded on page load.

### 3.16 Cadet Portal and Claims
1. System shall provide a mobile-first responsive cadet portal with sidebar navigation and authenticated layout shell.
2. Cadet portal shall include collections view (card grid of published collections for the cadet's intake) and claims management.
3. System shall allow cadets to submit reimbursement claims via dialog-based form from the claims list page.
4. Claims shall include title, amount, description, receipt upload, and QR code upload.
5. System shall pre-fill bank details from the cadet's saved account (`cadet_accounts`) when creating a claim.
6. System shall allow cadets to save bank details for future claims (auto-save via `cadet_accounts` upsert during claim submission).
7. Claim status shall progress through: `PENDING`, `FULFILLED`, `REJECTED`.
8. System shall display claims list with status badges and empty state.
9. System shall scope claims to the cadet's intake via `intakeId`.

## 4. Data Requirements

### 4.1 Core Entities
System data model shall include at minimum:
- Admin users and roles (with nullable `intake_id` for intake-scoped roles).
- Admin invitations (pending invitations with acceptance tracking, nullable `intake_id`).
- Admin role audit logs (INVITED, ACCEPTED, ROLE_CHANGED, DROPPED events).
- Intakes and translations.
- Intake patch explanations and translations.
- Intake display photos.
- Stories (events) and translations.
- Events tags and tag translations.
- Members (with birthdate, age, regiment/kor) and cadet information (with physical metrics: height, weight, BMI, CGPA).
- Platoons (normalized platoon records) with nullable cadet-to-platoon assignment.
- Officers and instructors.
- Academic years, sessions, exams, results.
- Newsletter subscribers.
- Homepage managed content (FAQ, see-more links, testimonials, webapp_contents).
- Treasury accounts, collections, collection payments (Treasurer module).
- Cadet accounts (one-to-one by memberId: bank name, account number, DuitNow ID, QR code path) for pre-filling claim bank details.
- Claims (reimbursement claims: title, amount, description, receipt path, QR code path, status, intake-scoped).
- Claim status enum: `PENDING`, `FULFILLED`, `REJECTED`.
- Attend records (per cadet: date, Attend B / Attend C, source from env `NEXT_PUBLIC_WELFARE_ATTEND_SOURCES`) and accommodations (one per cadet: HOSTEL / RENTAL type, address).
- Religious activities (Welfare module, not intake-scoped: type from env `NEXT_PUBLIC_WELFARE_REGLIGIOUS_ACTIVITIES_TYPES`, record date, autogenerated `{TYPE}-{YYYY-MM-DD}` title with unique guard, remarks, location, nullable meeting link) with per-activity display photos (upload at creation only, view-only carousel afterwards).
- Health records (one per intake per day) and per-cadet health metrics (age at record date, height, weight, BMI, BMI classification).
- UKA/APFA assessment records (intake, session number, year, record date) and per-cadet assessment results (item values, stored pass flags, overall PASS/FAIL).
- Application status enum: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.

### 4.2 Localization Data
1. Managed content shall use translation tables where content varies by locale.
2. Static UI labels shall remain in locale dictionaries.

### 4.3 Media Storage
1. System shall store file paths/storage keys or URLs for managed assets.
2. Sensitive documents (payment receipts, treasury and cadet bank QR codes, claim documents, result slips, timetables, expense receipts, newsletter attachments) shall be stored in a private bucket.
3. Images on public pages shall use `next/image` with allowed remote host rules.

## 5. Non-Functional Requirements

### 5.1 Security
1. System shall never expose server secrets to client.
2. Authorization shall not rely solely on client-side hiding.
3. Sensitive tokens shall be stored as hashes where applicable.
4. Deployment configuration shall be validated against a documented schema; production shall not fall back to localhost URLs.
5. Uploaded files shall be validated by content signature, size and type on the server.
6. System shall enforce rate limiting on public endpoints (e.g., newsletter subscription: 5 requests per IP per 15 minutes) using a DB-backed store with unique (identifier, action) index.
7. System shall serve security headers including `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a Content Security Policy (initially in report-only mode) restricting scripts, styles, fonts, images, connections, frames, and forms to approved origins.
8. System shall prevent open redirects by validating `next`/`redirect` parameters against an allow-list of safe internal paths.

### 5.2 Performance
1. Public pages should prefer Server Components and server-side data reads.
2. Non-critical visual sections should support lazy loading where needed.
3. Images shall be optimized via `next/image`.

### 5.3 Usability and Accessibility
1. UI shall be responsive across mobile, tablet, desktop, and large screens.
2. Pages shall use semantic HTML structure with one `<h1>` per page.
3. Navigation and controls shall remain usable on touch devices.

### 5.4 Maintainability
1. Code shall be modular by surface (`components/public`, `components/admin`, `components/ui`).
2. Database schema shall remain source of truth in Drizzle.
3. New server mutations shall use Server Actions or route handlers.

### 5.6 Consent and Data Display
1. System shall document the approved basis for public cadet data display before expanding exposure.
2. Public cadet data display shall require explicit consent for: display names, photos, quotes.
3. Inactive cadet data shall not be exposed publicly without explicit consent review.
4. Administrative status changes shall not implicitly re-enable marketing consent (newsletter unsubscribe remains respected).

## 6. External Interface Requirements

### 6.1 User Interface
- Public:
  - Sticky header, locale switcher, theme toggle.
  - Military-inspired, professional visual tone.
- Admin:
  - Left sidebar, role-aware navigation, active route highlighting.

### 6.2 Software Interfaces
- Supabase Auth for Google login.
- Supabase Storage for hosted media (public and private buckets).
- PostgreSQL via Drizzle ORM.
- Planned: Resend for email sending.

## 7. Implementation Status Snapshot
### 7.1 Completed
- Locale foundations and dictionary loading (4 locales: en, ms, zh, ta).
- Theme infrastructure (light/dark/system).
- Public shell/header with language switcher and theme toggle.
- Admin auth skeleton and server RBAC helpers.
- Baseline schema and migration structure (6 migrations).
- Landing page with hero, stats, FAQ, testimonials, see-more links.
- Intakes list and detail pages.
- Stories list, detail, and tag pages.
- Contact page with newsletter subscription.
- Newsletter double opt-in flow (subscription, confirmation, unsubscribe) with Resend integration.
- Public content data access layer with DB fallbacks.
- Root not-found page for invalid locales.
- Admin sidebar shell with responsive navigation (collapsible to icons on desktop, drawer on mobile).
- Module-scoped admin routes with per-group RBAC layouts and 403 Access Denied for unauthorized access.
- Secretary rank-holders: cadet admin user management with role changes, drop, audit logging, cadet-only filtering.
- Secretary cadets: cadet management page with rank-based sorting, active/inactive toggle, filtering.
- Intake-scoped RBAC: intakeId on adminUsers/adminInvitations, scope helpers, Secretary module enforcement (reads + writes).
- Treasurer payment system: treasury accounts, collections (DRAFT ↔ PUBLISHED/ARCHIVED lifecycle), cadet self-service payment page, and payments ledger.
- Cadet authentication: separate Google OAuth flow with `@ocean.umt.edu.my` domain verification and member/cadet record lookup.
- Cadet portal shell: mobile-first responsive sidebar layout with collections and claims navigation, breadcrumbs, user menu, and theme switcher.
- Cadet collections: card-based grid of published collections scoped to the cadet's intake, with detail/payment pages.
- Cadet claims system: dialog-based reimbursement claim creation with receipt and QR upload, bank detail pre-fill from `cadet_accounts`, and claim list with status badges.
- Treasurer lifecycle cleanup: treasury accounts deleted when role changes away from Treasurer.
- Sports Metrics module: health record sessions with per-cadet metrics (age, height, weight, BMI + classification), intake-scoped with record selection, inline table editing on desktop (dialog on mobile) with unsaved-changes confirmation.
- Sports assessments: UKA/APFA record lists with auto session numbering and combined per-cadet result entry page (inline editing, env-based thresholds with defaults).
- Welfare module: Attend (cadet absence records with env-based sources), Accommodations (auto-created on cadet creation, gender-scoped for intake-scoped admins), and Religious Activities (env-based types, autogenerated type-date titles with unique guard, photo upload at creation, view-only photo carousel).
- Phase 1 hardening: environment schema and validation script, private-bucket storage routing with object migration, fail-closed intake scope with inactive-cadet blocking, and seed script safety guard.
- Academic modules: Courses (cadet course assignment + course/program management with completion years, supported flags, and enrolled-count deletion guard), Results (per-session GPA/CGPA with tier-colored pills, inline row editing synced to `cadets.cgpa`, PDF result slips), Timetables (per-cadet 60-minute slot editor for Sunday–Thursday 8:00 AM–6:00 PM with locked 1:00–2:00 PM lunch break, drag-range selection, timetable PDFs). Session provisioning via pg_cron function, sessions trigger, seed script, and on-demand sync.
- Placeholder pages for remaining admin modules across other role groups (Academic placeholders replaced by real modules).

### 7.2 Pending
- Per-page canonical/hreflang audit.
- Route-level error boundaries for admin surfaces.
- Officer/Instructor bento dashboard with cross-system statistics.
- Admin CMS: Multimedia for `webapp_contents`, stories CRUD, newsletter management, application deadline config.
- Schema additions: application status enum, role audit log table.
- Seasonal intake application workflow: form, document upload, status state machine, Secretary review UI, physical assessment email trigger.
- Email templates: application confirmation, application status update.

## 8. Assumptions and Open Items
### 8.1 Confirmed Decisions
1. Intake application workflow states: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.
2. Required documents: IC copy, blue-background passport photo, SPM transcripts.
3. Physical assessment email: manual trigger by Secretary after review.
4. Application deadline: admin-configurable (not hardcoded).
5. Admin management: invitation-based flow with email, direct role updates, drop deletes record. All events audited (INVITED, ACCEPTED, ROLE_CHANGED, DROPPED).
6. Member-admin linking: `adminUsers` and `cadets` both link to `members.id` — no separate FK needed. Only cadets can be invited as admin users.
7. Sitemap: dynamic from DB with 1-hour cache; robots.txt: static file.
8. Branding assets: current placeholder images are real ROTU assets and should be kept.
9. Root not-found page: hardcoded English is acceptable (invalid locale case).
10. No separate `intakeApplications` table needed; intake status workflow is sufficient.

### 8.2 Remaining Open Items
1. Detailed document upload implementation (file size limits, formats, storage paths).
2. Email template copy/design for application confirmation and status update.
3. Admin invitation lifecycle details beyond baseline auth mapping.
4. RAG requirement (listed in tasks) is out-of-scope for current baseline and needs separate requirements definition.
5. Locale-specific font fallbacks for Mandarin Chinese (Noto Sans SC) and Tamil (Noto Sans Tamil) may need review for glyph coverage and visual consistency.
