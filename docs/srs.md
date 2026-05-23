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

#### 3.3.3 Planned Public Pages
1. System shall provide intake detail page by slug.
2. System shall provide events/stories list and detail pages by slug.
3. System shall provide contact page with newsletter entry point.

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
   - SECRETARY -> `/admin/rank-holders`
   - TREASURER -> `/admin/collections`
   - MULTIMEDIA -> `/admin/portfolio`
   - SPORTS -> `/admin/activities`
   - WELFARE -> `/admin/health`
   - ACADEMIC -> `/admin/results`
4. OFFICER and INSTRUCTOR shall be separate roles with same highest permissions.

### 3.7 Admin Modules
1. System shall provide role-aware module access:
   - Secretary: rank holders, intakes, cadets, admin users.
   - Treasurer: collections, expenses.
   - Multimedia: portfolio, events/stories, newsletters.
   - Sports: activities, collaborations.
   - Welfare: health, accommodations, religion.
   - Academic: results, timetables.
2. Full-access roles shall access all modules.

### 3.8 Newsletter
1. System shall collect newsletter subscriptions from contact page.
2. Subscriber status shall support `PENDING`, `ACTIVE`, `UNSUBSCRIBED`.
3. Confirmation and unsubscribe tokens shall be unique and treated as sensitive.
4. Newsletter management shall be available to Multimedia role.

### 3.9 Intake/Application Flow (Planned)
1. System shall support seasonal intake application periods.
2. System shall collect biodata, required documents, and physical metrics.
3. System shall support post-submission messaging for physical assessment attendance.
4. Detailed workflow states shall be finalized before implementation.

## 4. Data Requirements

### 4.1 Core Entities
System data model shall include at minimum:
- Admin users and roles.
- Intakes and translations.
- Intake patch explanations and translations.
- Intake display photos.
- Programs/events and translations.
- Program tags and tag translations.
- Members and cadet information.
- Academic years, sessions, exams, results.
- Newsletter subscribers.
- Homepage managed content (FAQ, see-more links, testimonials).

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
2. System should include route-level error boundaries for public and admin surfaces.

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

## 7. Implementation Status Snapshot (from TASKS.md)
### 7.1 Completed
- Locale foundations and dictionary loading.
- Theme infrastructure.
- Public shell/header.
- Admin auth skeleton and server RBAC helpers.
- Baseline schema and migration structure.
- Landing page and intakes list page.
- Public content data access layer.

### 7.2 Pending
- Intake detail, events list/detail, contact page.
- Newsletter form and delivery flow.
- Public SEO completeness, sitemap, robots.
- Admin sidebar shell and role module pages.
- Seasonal intake application workflow.
- Resend integration for email features.

## 8. Assumptions and Open Items
1. ROTU factual/public copy, branding, and media assets will be supplied by stakeholders.
2. Detailed seasonal intake workflow states require stakeholder confirmation before schema/workflow lock.
3. Admin invitation lifecycle (beyond baseline auth mapping) remains to be finalized and implemented.
4. RAG requirement listed in tasks is out-of-scope for current baseline and needs separate requirements definition.
