# TASKS.md

Living implementation tracker for the ROTU Army UMT web application.

Recommended direction: finish the shared foundation first, then build the public website before the full admin dashboard. The public site validates routing, i18n, theme, SEO, visual identity, and real content structure quickly. Admin should still get an early auth/RBAC/data skeleton so public content can later become admin-managed without a rewrite.

- [x] Initialized project collaboration instructions in `AGENTS.md`.
- [x] Added project decisions for Supabase, Google-only admin login, RBAC, i18n, public routes, admin modules, newsletter, and seasonal intake flow.
- [x] Clarified that Secretary normally owns admin invitations/user management, while Officer and Instructor can also access it through full permissions.
- [x] Selected Resend as the planned email provider for intake/newsletter email sending.
- [x] Verified current project structure, installed dependencies, and relevant local Next.js 16 documentation notes.
- [x] Chose Geist Sans and Geist Mono as the primary app fonts and aligned Tailwind CSS font tokens.
- [ ] Set up foundational locale routing for `en`, `ms`, `zh`, and `ta`.
- [ ] Add translation dictionary structure and helpers with English as the default locale.
- [ ] Set up theme support for light/dark mode.
- [ ] Build public layout shell with responsive top navigation, language switcher, and theme toggle.
- [ ] Revisit Mandarin Chinese and Tamil font fallbacks during locale implementation.
- [ ] Configure Supabase server/client helpers without exposing secrets.
- [ ] Configure Drizzle ORM and baseline schema/migration structure.
- [ ] Confirm final admin role enum and auth-linked admin user table.
- [ ] Model admin users and roles separately from public member/cadet records.
- [ ] Implement server-enforced RBAC helpers and role-aware admin redirects.
- [ ] Build initial Google-only admin login with Supabase Auth.
- [ ] Build landing page at `/[locale]/`.
- [ ] Build intakes list page at `/[locale]/intakes`.
- [ ] Build intake detail page at `/[locale]/intakes/[slug]`.
- [ ] Build events/stories page at `/[locale]/events`.
- [ ] Build event detail page at `/[locale]/events/[slug]`.
- [ ] Build contact page at `/[locale]/contact`.
- [ ] Add newsletter subscription form on Contact page.
- [ ] Add SEO metadata, canonical URLs, and locale alternates for public pages.
- [ ] Add `sitemap.xml` and `robots.txt`.
- [ ] Draft Drizzle schema for intakes, members, cadets, programs/events, newsletters, and academic results.
- [ ] Use translation tables for managed localized content.
- [ ] Store Supabase Storage paths/keys for managed files and images.
- [ ] Build admin layout shell with responsive left sidebar navigation.
- [ ] Build Secretary-owned admin invitations/user management.
- [ ] Build Officer and Instructor bento dashboard.
- [ ] Build Secretary modules: Rank Holders, Intakes, Cadets.
- [ ] Build Treasurer modules: Collections, Expenses.
- [ ] Build Multimedia modules: Portfolio, Events/stories, Newsletters.
- [ ] Build Sports modules: Activities, Collaborations.
- [ ] Build Welfare modules: Health, Accommodations, Religion.
- [ ] Build Academic modules: Results, Timetables.
- [ ] Confirm required documents and fields for seasonal intake applications.
- [ ] Build seasonal intake application form and submission flow.
- [ ] Add Resend configuration when email sending is implemented.
- [ ] Create intake physical assessment email template.
- [ ] Create newsletter confirmation email template.
- [ ] Create unsubscribe flow and email handling.
