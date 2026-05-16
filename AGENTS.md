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

Do not fabricate ROTU-specific facts, historical data, people, ranks, program details, photos, colors, or copy. Use placeholders when needed and ask for real assets/content when accuracy matters.

---

## Tech Stack

- Next.js `16.2.4`
- React `19.2.4`
- TypeScript `^5`
- Tailwind CSS `^4`
- lucide-react
- Supabase Auth, PostgreSQL, and Storage
- Drizzle ORM for schema, queries, and migrations

Next.js `16.2.4` may differ from older App Router knowledge. Before implementing framework-sensitive code, check the relevant local documentation in `node_modules/next/dist/docs/` and follow deprecation notices.

Use `npm` only.

Common commands:

```bash
npm run dev
npm run lint
npm run build
```

Do not run validation automatically after implementation unless the user asks for it or the change is high-risk. When validation is requested, prefer:

```bash
npm run lint
npm run build
```

---

## Environment And Supabase

The project already has a Supabase project configured through `.env`.

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

### Authorization

- RBAC must be enforced on the server.
- A user must have exactly one admin role.
- `OFFICER` and `INSTRUCTOR` are separate roles but currently have identical highest-level permissions.
- Client-side hiding is only UX; it is not authorization.

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

For database content that needs translation, prefer translation tables when content is user-managed or can vary by locale. Examples include program summaries, intake explanations, page sections, SEO titles/descriptions, and future marketing content. Static UI labels should stay in locale dictionaries.

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

- Events page
  - Navigation label: **Our Stories**
  - Route: `/[locale]/events`

- Event detail page
  - Route: `/[locale]/events/[slug]`

- Contact page
  - Navigation label: **Contact Us**
  - Route: `/[locale]/contact`
  - Includes newsletter subscription.

### URLs And SEO

- Use slugs instead of IDs for all public content routes.
- Slugs must be human-readable, lowercase, hyphen-separated, and SEO-oriented.
- Example: `/en/events/field-training-camp-2025`

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
- Internal links between related intakes, events, stories, and application/contact paths.

Performance:

- Use `next/image` for images.
- Lazy-load non-critical sections where appropriate.
- Generate `sitemap.xml` and `robots.txt`.

---

## Public Content Strategy

Some public content may start as static placeholders, but the system should be designed so Multimedia can manage public content later where appropriate.

Likely Multimedia-managed public content:

- Events/stories
- Portfolio/media highlights
- Newsletters
- Selected landing/contact page content

Use real provided assets when available. The user has logos, colors, information, photos, and other ROTU assets, but do not invent missing assets.

---

## Intake/Application Flow

The application/intake collection flow is seasonal, usually around October during the new academic year. It is not open all year.

Expected flow:

- Collect student biodata.
- Collect required documents.
- Collect physical information such as height, weight, and BMI-related data.
- After submission or review, send an email instructing the student to attend physical assessment.

Ask before finalizing detailed intake workflow states, required documents, email templates, approval steps, or schemas beyond the agreed baseline.

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
- `SECRETARY` -> `/admin/rank-holders`
- `TREASURER` -> `/admin/collections`
- `MULTIMEDIA` -> `/admin/portfolio`
- `SPORTS` -> `/admin/activities`
- `WELFARE` -> `/admin/health`
- `ACADEMIC` -> `/admin/results`

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
  - Rank Holders
  - Intakes
  - Cadets
  - Admin invitations/user management

### Treasurer

- Default: Collections.
- Access:
  - Collections
  - Expenses

### Multimedia

- Default: Portfolio.
- Access:
  - Portfolio
  - Events/stories
  - Newsletters
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
  - Events/stories
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
- Cadet info
- Newsletter subscriber
- Program/event
- Program summaries
- Program tags
- Program keywords
- Program display photos
- Many-to-many relations for program tags/keywords

Enums discussed:

- Intake explanation keys: `ANIMAL`, `COLOR`, `PHILOSOPHY`
- Subscription status: `PENDING`, `ACTIVE`, `UNSUBSCRIBED`
- Gender: `MALE`, `FEMALE`
- Member role: `OFFICER`, `INSTRUCTOR`, `CADET`
- Member rank: `PK`, `PKW`, `KPL_CADET`, `SJN_CADET`, `KPL`, `SJN`
- Study programs matching UMT program names

Important modeling notes:

- Keep auth/admin roles separate from public/member/cadet concepts if that produces cleaner RBAC.
- Use Drizzle schema as the source of truth for application data.
- Use Supabase Auth user IDs for authenticated admins.
- Prefer UUIDs for auth-linked/admin records and serial or UUID IDs for domain records based on project consistency.
- Store file paths/storage keys where possible, not only public URLs, especially for Supabase Storage-managed assets.
- Add translation tables for managed localized content rather than stuffing multiple language fields into primary tables.
- Ask before making major schema/workflow decisions.

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

1. Build the public site with localized routes, SEO metadata, top navigation, language switcher, and theme toggle.
2. Build admin with Supabase Auth, Google login, server-enforced RBAC, and role-aware sidebar navigation.
3. Keep Officer and Instructor as separate roles with the same highest-level permissions.
4. Treat user-managed localized content with translation tables where appropriate.
5. Keep public slugs SEO-first.
6. Use real ROTU assets/content only when supplied.
7. Ask before introducing complex architecture, workflow, or schema changes.
