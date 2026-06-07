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
- Supabase project for Auth and Storage.
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

### 3.6 Authorization (RBAC)
1. System shall assign exactly one admin role per admin user.
2. System shall enforce RBAC checks on the server.
3. System shall map `/admin` default routing by role:
   - OFFICER -> `/admin`
   - INSTRUCTOR -> `/admin`
   - SECRETARY -> `/admin/secretary/rank-holders`
   - TREASURER -> `/admin/treasurer/collections`
   - MULTIMEDIA -> `/admin/multimedia/portfolio`
   - SPORTS -> `/admin/sports/activities`
   - WELFARE -> `/admin/welfare/health`
   - ACADEMIC -> `/admin/academic/results`
4. OFFICER and INSTRUCTOR shall be separate roles with same highest permissions.
5. OFFICER and INSTRUCTOR shall bypass module restrictions entirely and access all admin routes and content.
6. Other roles shall see only paths and content under their assigned module access.
7. Admin roles can be changed after creation, but only by OFFICER or INSTRUCTOR.
8. Role changes shall be performed as delete + recreate (not direct update).
9. System shall log all role changes (who, when, old role, new role, target admin user).
10. Multi-role assignments are not allowed. One admin user = one role, strictly.

### 3.7 Admin Modules
1. System shall provide role-aware module access:
   - Secretary: rank holders, intakes, cadets, admin users.
   - Treasurer: collections, expenses.
   - Multimedia: portfolio, stories (full CRUD), newsletters, `webapp_contents` (hero text, stats, FAQs, testimonials, see-more links, social links, map embed), application deadline configuration.
   - Sports: activities, collaborations.
   - Welfare: health, accommodations, religion.
   - Academic: results, timetables.
2. Full-access roles (OFFICER, INSTRUCTOR) shall access all modules.

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

## 4. Data Requirements

### 4.1 Core Entities
System data model shall include at minimum:
- Admin users and roles.
- Intakes and translations.
- Intake patch explanations and translations.
- Intake display photos.
- Stories (events) and translations.
- Events tags and tag translations.
- Members and cadet information.
- Academic years, sessions, exams, results.
- Newsletter subscribers.
- Homepage managed content (FAQ, see-more links, testimonials, webapp_contents).
- Application status enum: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.
- Role audit log table for tracking role changes.
- Admin-cadet linking: nullable FK from `adminUsers` to `cadetInfos`.

### 4.2 Localization Data
1. Managed content shall use translation tables where content varies by locale.
2. Static UI labels shall remain in locale dictionaries.

### 4.3 Media Storage
1. System shall store file paths/storage keys or URLs for managed assets.
2. Images on public pages shall use `next/image` with allowed remote host rules.

## 5. Non-Functional Requirements

### 5.1 Security
1. System shall never expose server secrets to client.
2. Authorization shall not rely solely on client-side hiding.
3. Sensitive tokens shall be stored as hashes where applicable.

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

### 5.5 Reliability
1. System should provide localized not-found behavior for missing resources.
2. System should include route-level error boundaries for public surfaces. Public error boundaries are implemented with localized strings for all 4 locales. Admin error boundaries are deferred.

## 6. External Interface Requirements

### 6.1 User Interface
- Public:
  - Sticky header, locale switcher, theme toggle.
  - Military-inspired, professional visual tone.
- Admin:
  - Left sidebar, role-aware navigation, active route highlighting.

### 6.2 Software Interfaces
- Supabase Auth for Google login.
- Supabase Storage for hosted media.
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
- Placeholder pages for all 15 admin modules across 6 role groups.

### 7.2 Pending
- Per-page canonical/hreflang audit.
- Route-level error boundaries for admin surfaces.
- Officer/Instructor bento dashboard with cross-system statistics.
- Admin CMS: Multimedia for `webapp_contents`, stories CRUD, newsletter management, application deadline config.
- Secretary admin user management with delete+recreate role changes and audit logging.
- Schema additions: application status enum, role audit log table, `adminUsers.cadetInfoId` nullable FK.
- Seasonal intake application workflow: form, document upload, status state machine, Secretary review UI, physical assessment email trigger.
- Email templates: application confirmation, application status update.

## 8. Assumptions and Open Items
### 8.1 Confirmed Decisions
1. Intake application workflow states: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `AWAITING_PHYSICAL_ASSESSMENT`, `PASSED`.
2. Required documents: IC copy, blue-background passport photo, SPM transcripts.
3. Physical assessment email: manual trigger by Secretary after review.
4. Application deadline: admin-configurable (not hardcoded).
5. Role changes: delete + recreate pattern with audit logging, only by OFFICER/INSTRUCTOR.
6. Member-admin linking: `adminUsers` can link to `cadetInfos.id` when a cadet becomes admin.
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
