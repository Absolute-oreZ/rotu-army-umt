# Public Website UI/UX Overhaul Implementation Plan

**Status:** Approved implementation plan  
**Scope:** `app/[locale]/**` and the shared public presentation layer  
**Primary audience:** UMT students considering ROTU Army UMT, prospective members, parents/visitors, alumni, and the public  
**Technical stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Drizzle, Supabase Storage, Geist/Noto fonts

## 1. Executive Summary

This plan replaces the current public-site composition with a cohesive, data-led experience while preserving the site's routes, SEO strategy, CMS-managed content, real ROTU assets, and existing functional requirements.

The selected design direction is **Operational Field Record**: a disciplined editorial interface that combines military-inspired structure with authentic documentary photography. It should feel authoritative, modern, restrained, and human—not like a generic AI-generated marketing template.

The overhaul will:

- give every route a composition based on the shape, density, and media characteristics of its data;
- establish the approved public design-token layer from the supplied ROTU assets;
- preserve the four-locale architecture (`en`, `ms`, `zh`, `ta`);
- reduce unnecessary client-side JavaScript and remove interaction patterns that impede accessibility;
- improve responsive behaviour, metadata, image handling, and content hierarchy;
- retain all required home, intake, story, contact, and newsletter functions;
- control application-oriented Join the Ranks content with `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE`.

No ROTU-specific rank, history, benefit, event, or Best Cadet record will be invented. The palette and visual direction in this document are approved for implementation.

## 2. Project Alignment

### 2.1 Primary goals

1. Attract UMT students by communicating the existing approved value proposition: leadership, service, resilience, discipline, and field experience.
2. Help visitors understand ROTU Army UMT before prompting them to explore intakes or make contact.
3. Present published intakes and stories as credible, organized records rather than generic content cards.
4. Support fast scanning on mobile and immersive documentary storytelling on large screens.
5. Preserve server-side data access, localization, storage safety, and SEO.
6. Make CMS editors able to supply content without requiring a redesign when list lengths or media availability change.

### 2.2 Required routes

- `/<locale>/` — About Us / landing page
- `/<locale>/intakes` — intake archive
- `/<locale>/intakes/<slug>` — intake profile
- `/<locale>/stories` — story archive
- `/<locale>/stories/<slug>` — story detail
- `/<locale>/stories/tags/<slug>` — tag archive
- `/<locale>/contact` — contact and newsletter hub
- `/<locale>/newsletter/confirm/<token>` — confirmation utility page
- `/<locale>/newsletter/unsubscribe/<token>` — unsubscribe utility page

### 2.3 Non-goals

- No public application workflow is introduced by this redesign.
- No admin dashboard, cadet portal, finance, academic, welfare, or sports UI is changed.
- No new public entity or workflow is created beyond the approved Best Cadet honours records already defined in this change.
- No route, slug, metadata, storage, newsletter, or RBAC contract is redesigned.
- No landing-page claim, intake fact, story, Best Cadet record, rank, or historical statement is generated.

## 3. Design Decision

### 3.1 Chosen direction: Operational Field Record

“Operational Field Record” combines three qualities required by the project brief:

- **Structured:** clear grids, rules, labels, numbering, and predictable navigation.
- **Disciplined:** limited accents, restrained radius, strong hierarchy, and functional whitespace.
- **Documentary:** real field photography, chronological records, intake identity, and event archives.

The metaphor is functional rather than literal. It must not use camouflage textures, fake classified markings, weapon silhouettes, excessive badges, or theatrical military styling.

### 3.2 Visual character

- Editorial rather than dashboard-like
- Sharp and architectural rather than soft and consumer-like
- Photographic rather than illustration-led
- Modular without repeating the same card grid
- Authoritative without shouting
- Motion-led only when motion clarifies state or hierarchy

### 3.3 Anti-template guardrails

To avoid an AI-generated appearance:

- do not give every route the same full-screen hero;
- do not centre every heading and paragraph;
- do not repeat groups of three or four rounded feature cards;
- do not use gradient blobs, glass panels, neon glows, or excessive backdrop blur;
- do not add icons to every label;
- do not use oversized typography on utility pages;
- do not fill space with generated copy when CMS data is absent;
- do not hide important content behind animation;
- do not use decorative tactical motifs without organizational meaning;
- do not create fake “trusted by” metrics, rankings, or honours records;
- use the actual data density, image ratio, chronology, and available media to determine each composition;
- preserve visual rhythm through media, rules, scale, and spacing rather than decorative effects.

## 4. Verified Asset Direction

### 4.1 Supplied assets to preserve

- `public/icons/logo.png` — 587 × 587, square ROTU Army UMT mark
- `public/images/default-hero-image.jpg` — 1280 × 1024, 5:4 documentary group image
- `public/images/join-the-ranks-step-1.svg` through `step-4.svg` — approved process illustrations
- `public/images/see-also-*` — approved external-reference media
- newsletter confirmation/unsubscription illustrations
- existing social icons and `not-found.png`

The project guidance explicitly identifies the default hero and join-the-ranks illustrations as real ROTU assets. They must not be replaced with generic stock media.

### 4.2 Approved asset-derived palette

A coarse read-only sample of the supplied logo established these anchor colours:

- beret/field green: `#305020`
- deep plum: `#400050`
- orange: `#FF6000`
- red: `#B02020`
- yellow/gold: `#FFF000`

These anchors are approved for the public interface. Implementation should expose them through semantic tokens so contrast-safe light and dark values remain easy to tune centrally.

### 4.3 Public semantic palette

Use warm neutral surfaces with green as the stable field colour. Plum and orange should be selective identity accents; yellow and red should not become general-purpose backgrounds.

| Semantic role | Light value | Dark value | Intended use |
|---|---:|---:|---|
| Canvas | `#F4F2EA` | `#10140F` | Page background |
| Surface | `#FBFAF6` | `#171D16` | Reading panels and forms |
| Raised surface | `#FFFFFF` | `#20291F` | Dialogs and menus |
| Ink | `#172016` | `#F2F1E8` | Primary text |
| Muted ink | `#596357` | `#BAC2B5` | Supporting text |
| Field green / primary | `#305020` | `#9BC58F` | Primary action and active state |
| Plum / accent | `#4A175F` | `#D4A7DD` | Editorial marker and secondary emphasis |
| Orange signal | `#8A3B00` | `#FF9A52` | Text-safe accent and focus detail |
| Gold marker | `#7A6500` | `#E3CF5A` | Small index/detail marker |
| Danger red | `#A32020` | `#FF8A80` | Destructive/status state only |
| Rule | `#C9C6BA` | `#3A4636` | Borders and separators |

The listed foreground/background combinations were checked for strong contrast during planning, but implementation must still run a complete contrast audit against every final token pair.

### 4.4 Token scope

Do not globally replace the admin theme merely to redesign the public site.

- Add a `.public-site` token scope in `app/globals.css`.
- Override existing semantic variables such as `--background`, `--foreground`, `--primary`, `--accent`, `--border`, and `--ring` only inside `.public-site`.
- Define `.dark .public-site` separately.
- Add the scope to the root element rendered by `components/public/public-shell.tsx`.
- Keep admin and cadet token values unchanged.


## 5. Design System

### 5.1 Typography

Retain the current font infrastructure in `components/root-document.tsx`:

- Geist Sans for Latin interface and editorial copy
- Geist Mono for record numbers, dates, counts, short status labels, and technical metadata
- Noto Sans SC for `zh`
- Noto Sans Tamil for `ta`
- system fallbacks for resilience

Do not add a decorative serif or a new font dependency. Visual authority should come from hierarchy and spacing rather than novelty typography.

Recommended scale:

| Role | Mobile | Desktop | Notes |
|---|---:|---:|---|
| Home H1 | `clamp(2.75rem, 12vw, 5.5rem)` | same | Tight leading; not used on other routes |
| Page H1 | `clamp(2.25rem, 6vw, 4.5rem)` | same | Intake/story archive and contact |
| Feature H1 | `clamp(2.5rem, 7vw, 5rem)` | same | Story and intake detail |
| Section H2 | `clamp(1.75rem, 4vw, 2.75rem)` | same | Sentence case |
| Body lead | `1rem` | `1.125rem` | Maximum 65–72 characters |
| Body | `0.9375rem` | `1rem` | 1.6–1.75 line height |
| Record label | `0.6875rem` | `0.75rem` | Mono, restrained uppercase tracking |
| Utility | `0.8125rem` | `0.875rem` | Metadata and controls |

Locale rules:

- do not apply negative letter spacing to Chinese or Tamil;
- avoid uppercase transformation for Chinese and Tamil labels;
- allow headings and navigation labels to wrap;
- verify line breaks and control heights at 320px and 400% zoom;
- use locale-aware date and number formatting from existing helpers.

### 5.2 Spacing and grid

Use a mobile-first 4-column grid, expanding to 8 columns at tablet and 12 columns at desktop.

- outer gutter: 20px mobile, 32px tablet, 40–48px desktop;
- maximum content width: 1280px, with occasional 1440px full-bleed media;
- reading width: 65–72 characters;
- section spacing: 64–80px mobile, 96–128px desktop;
- dense metadata sections may use 48–64px;
- use 8px spacing increments, with 4px only for compact internal control gaps.

### 5.3 Shape, borders, and elevation

- default radius: 2–6px;
- small controls: 4px;
- media frames: 0–4px;
- dialogs and forms may use 8px;
- avoid pills except compact status tags;
- use 1px rules and restrained shadows;
- shadow is reserved for menus, dialogs, and media overlays;
- avoid stacking a border, rounded card, shadow, blur, and gradient on every section.

### 5.4 Imagery

- home hero: documentary 5:4 source, displayed in an editorial crop rather than a generic full-screen wash;
- Best Cadet portraits use face-safe crops; other cadet portraits use the same safe-crop rule.
- intake patches and uniform items: `object-contain`, never cropped;
- story covers: preserve meaningful aspect ratio while avoiding unstable masonry;
- display photos: use natural editorial grids or a controlled lightbox, not a forced square crop;
- remote public media remains restricted to paths accepted by `storageUrl()`;
- meaningful images receive localized alt text; decorative images use empty alt text;
- never use a private storage path in a public component.

### 5.5 Motion

Motion supports orientation and feedback, not atmosphere.

- 150–220ms for hover, focus, disclosure, and menu transitions;
- one short entrance transition per major section, not every nested element;
- no autoplay testimonial rotation; use the static Best Cadet honours register instead;
- no rotating page headings;
- no wheel hijacking;
- no fixed-height internal page scrollers;
- no continuous marquee;
- no parallax;
- `prefers-reduced-motion` removes non-essential movement;
- content is visible before JavaScript runs.

## 6. Shared Shell

### 6.1 Header

Retain a sticky top header, but simplify it into an identity bar and primary navigation.

Desktop:

- square ROTU logo at 36–40px;
- `ROTU Army UMT` wordmark from the verified brand name;
- About Us, Our Intakes, Our Stories, Contact Us;
- locale switcher using a compact menu or text links;
- theme control using a labelled icon button;
- active route indicated by a 2px field/plum rule and `aria-current="page"`;
- header background transitions to an opaque surface after scrolling if needed.

Mobile:

- logo and compact organization name;
- 44px menu trigger;
- navigation opens in a full-height or near-full-height sheet;
- language and theme controls appear inside the sheet and remain keyboard accessible;
- close the sheet on route selection and restore focus to the trigger;
- prevent background scrolling while open;
- do not squeeze four locale buttons and the wordmark into one row.

Implementation changes:

- split the current 230-line client component into small components if useful:
  - `components/public/shell/public-header.tsx`
  - `components/public/shell/public-mobile-nav.tsx`
  - `components/public/shell/locale-switcher.tsx`
  - `components/public/shell/theme-toggle.tsx`
- localize the current hard-coded theme button label;
- preserve URL-segment locale switching, including dynamic story/intake slugs;
- do not access the database in the shell.

### 6.2 Footer

The current public shell has no footer. Add one as a shared, server-rendered component with only verified information:

- logo and organization name;
- the four localized primary links;
- a concise existing metadata description or approved static statement;
- current year;
- no fabricated address, office hours, accreditation claim, legal status, or social account.

If contact/social data is later placed in the footer, source it from a cached public read model rather than querying on every page layout.

### 6.3 Skip link and focus

- add a localized “skip to content” link as the first focusable shell element;
- main content receives a stable `id="main-content"`;
- visible focus uses a two-colour ring so it works on photography and coloured surfaces;
- focus styles must not be removed.


## 7. Data-to-Interface Matrix

| Route/query | Returned data characteristics | Interface consequence |
|---|---|---|
| Home / `getHomePageContent` | One optional hero; four scalar counts; variable FAQ array; variable links with optional images; variable Best Cadet records with dedicated portraits, award dates, inferred intake, localized summaries, and optional quotes | Narrative landing page with conditional modules and count-aware layouts |
| Intake archive / `getPublishedIntakeList` | Array of published intakes; optional cover, patch, and summary; ordered newest first | Chronological intake register, not a generic card wall |
| Intake profile / `getPublishedIntakeDetail` | Identity fields; four independent media slots; up to three patch meanings; variable gallery; variable cadet roster | Tabbed or anchored profile with count-aware panels |
| Story archive / `getPublishedStoriesByYear` | Descending year list plus grouped story cards; cover required by query; intrinsic dimensions supplied | Year navigation and stable editorial cover layouts |
| Story profile / `getPublishedStoryDetail` | Title, optional summary, dates, location, optional participant count, optional cover/video, tags, variable gallery; zero to four related stories | Photo-led feature with metadata rail and conditional media |
| Tag archive / `getPublishedStoriesByTag` | One tag plus the same year-grouped story structure | Reuse archive engine with a compact tag context header |
| Contact / `getContactPageContent` | Ordered contact reasons; official email; up to five social URLs; map URL | Non-clickable task directory plus separate actionable channels |
| Newsletter status queries | Four status variants each; pending states require a form action | Focused utility state with one primary action |

All modules must support zero, one, and many states. Actual database cardinalities and media ratios should be profiled before final layout tuning, without logging personal data.

## 8. Shared Content Primitives

Create small, reusable public components rather than another monolithic client component:

- `components/public/shared/public-section.tsx` — semantic section and constrained container
- `components/public/shared/public-section-heading.tsx` — eyebrow, heading, introduction, optional action
- `components/public/shared/public-empty-state.tsx` — route-specific empty states
- `components/public/shared/public-media-frame.tsx` — ratio, priority, fallback, and safe rendering rules
- `components/public/shared/public-metadata-list.tsx` — definition-list metadata
- `components/public/shared/public-link-row.tsx` — text-first internal/external link
- `components/public/shared/public-status.tsx` — semantic status presentation
- `components/public/shared/public-lightbox.tsx` — accessible image viewing
- `components/public/shared/public-reveal.tsx` — progressive enhancement only; visible by default

Reuse `Button`, `Input`, `Accordion`, `Dialog`, `Sheet`, `Empty`, and `cn()` where their semantics fit. Shared primitives must not encode public content or route-specific copy.

## 9. Landing Page

### 9.1 Data inputs to preserve

- `home.heroImagePath`
- `home.stats` with four counts
- `home.faqs`
- `home.bestCadets`
- `home.seeAlsoLinks`
- localized title, introduction, CTAs, section introductions, and four join-process steps

The landing page is considered content-complete. This overhaul changes presentation and interaction, not its factual message.

### 9.2 Page composition

#### A. Hero

Use an asymmetric editorial opening rather than a generic full-screen text overlay.

Desktop:

- 5-column copy region and 7-column media region inside the content grid;
- title, introduction, and actions left-aligned;
- small “About Us” record marker and issue/record-style line;
- documentary image in a stable 5:4 or cropped 4:3 frame;
- a restrained field-green edge or plum index line, not a coloured blur;
- optional dark image treatment only where copy overlays media.

Mobile:

- copy first, image second;
- image uses the verified 5:4 source with a deliberate crop and focal position;
- minimum 44px CTA height;
- the hero must not force the entire first page into an opaque fixed-height scroller.

Always use `/images/default-hero-image.jpg` when `heroImagePath` is absent or fails. The existing `HeroImage` client fallback can be simplified if a server-safe media primitive can provide equivalent behaviour.

#### B. Strength at a glance

Replace four independent statistic cards with one “strength ledger”:

- four values on a shared ruled grid;
- number in Geist Mono with tabular figures;
- label in small text below or beside;
- desktop: four columns; tablet: two; mobile: two or one according to label length;
- no count-up animation;
- if every value is zero because the query falls back, omit the section rather than presenting absence as an achievement.


#### C. Join the Ranks

Retain all four supplied illustrations and localized process copy. The entire section is controlled by the build-time boolean `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE`.

- when the value is exactly `true`, render the Join the Ranks section and its application-oriented process copy;
- when the value is `false`, omit the entire section rather than leaving an empty placeholder;
- when the variable is missing or invalid, treat it as `false` and report an environment validation issue;
- changing the value requires rebuilding/redeploying because `NEXT_PUBLIC_*` variables are inlined at build time;
- do not send the raw environment value to the browser or display it in the UI;
- use a numbered horizontal sequence on wide screens and a vertical sequence on mobile;
- illustrations sit in consistent square or 4:3 frames with `object-contain`;
- the illustration colours remain visible, while decorative circles, coloured shadows, and independent neon-like step colours are removed;
- the sequence communicates progression only while the feature flag is enabled.

#### D. Best Cadet

Replace the retired testimonial carousel with a static honours register:

- one lead recipient with a dedicated portrait;
- award year and inferred intake as compact metadata;
- localized summary as the primary body copy;
- optional localized quote beneath the summary;
- remaining recipients in a chronological editorial register;
- portraits are required for published records and use face-safe `4/5` crops;
- show recipient name and award year exactly as recorded;
- do not show rank, army number, matric number, or other administrative fields;
- no autoplay, carousel controls, gradient blobs, quote icon badge, or hidden recipients;
- omit the complete section when no published Best Cadet records exist.

#### E. FAQ

- use the existing accessible accordion primitive;
- place the section heading and introduction in a narrow left column and answers in a wider right column on desktop;
- one column on mobile;
- no nested animation or custom state when the primitive already provides the interaction.

#### F. See also

- treat links as an external-reference register;
- use a static responsive grid or list with thumbnails where available;
- no infinite flowing marquee;
- external links open safely and identify themselves in accessible text;
- text-only items remain valid without empty image boxes.

### 9.3 Landing-page files

- keep `app/[locale]/page.tsx` as the server entry point;
- add focused components under `components/public/best-cadets/`, including the honours section, lead recipient, chronological register, portrait, metadata, and quote components;
- retire or stop using `FlowingMenu`, `CountUp`, and the retired testimonial carousel after their replacements are verified;
- preserve lazy loading for below-the-fold images.

## 10. Intake Archive

### 10.1 Design intent

The route should feel like a maintained register of intake identities, not a timeline forced by unverified years. The query provides `intakeNo`, name, slug, optional cover/patch, and optional summary, ordered by `startYear` descending but not returning the year.

### 10.2 Composition

Desktop:

- compact sticky index of published intake names/numbers;
- main column with large alternating editorial entries;
- intake number as a prominent mono record marker;
- cover as the primary image; patch as a smaller identity inset;
- title and summary share a consistent reading measure;
- the whole entry is not a floating rounded card.

Mobile:

- one linear column;
- intake number, image, name, summary, and explicit detail link;
- no alternating layout;
- no horizontal timeline that requires precise tapping.

Empty state:

- use the existing route-specific dictionary copy;
- link back to About Us;
- do not show sample intakes or fabricated archive entries.

### 10.3 Implementation

- replace `components/public/intakes-timeline.tsx` with a server-rendered archive plus a small client index if sticky active state is necessary;
- remove scroll progress calculation and wheel behaviour;
- do not parse or display a year unless the query explicitly returns a safe year field;
- use `storageUrl()` only for public intake paths;
- keep metadata and empty-state behaviour in the page.


## 11. Intake Detail

### 11.1 Design intent

This is an identity profile, not a long-form article. The data supports four media roles, three possible patch meanings, a gallery, and a public cadet roster. Each must be independently optional.

### 11.2 Page header

Desktop:

- back link and intake number in a compact record bar;
- large cover image on one side;
- display name, tagline, and summary on the other;
- patch displayed as a contained identity object, not cropped into a circle;
- no rotating title and no full-viewport locked experience.

Mobile:

- back link, intake number, name, and summary first;
- cover and patch follow in source-aware order;
- media never pushes the H1 or primary identity below an opaque overlay.

Fallback order remains explicit: cover → patch → first gallery photo for the lead image; patch → cover → first gallery photo for the identity image.

### 11.3 Section navigation

The Summary / Patch / Uniform tabbed navigation is a confirmed requirement and must remain in the redesign.

- retain accessible tabs using the shared primitive;
- use URL-independent in-page tabs;
- each tab label is localized;
- tabs do not hide the page H1;
- use `aria-controls`, visible focus, and correct orientation;
- avoid mounting four independent heavy media experiences at once;
- on mobile, allow the tab list to wrap or scroll without forcing the viewport wider;
- do not replace the tabs with anchored document sections.

Suggested panel ownership:

- Summary panel: resolved summary and intake gallery;
- Patch panel: patch media and up to three Animal/Colour/Philosophy explanations;
- Uniform panel: inner and T-shirt visuals.

### 11.4 Gallery

- no duplicate desktop/mobile galleries;
- no arbitrary four-photo truncation;
- no four-card `Stack` animation;
- use all returned display photos;
- layouts adapt to count: one wide frame, two-column pair, lead-plus-supporting, or controlled editorial grid;
- lightbox must trap focus, close on Escape, restore focus, support previous/next controls, and expose localized labels;
- mobile may use swipe as an enhancement, not as the only way to access all media.

### 11.5 Cadet roster

The redesigned roster presents the active cadet records already returned by `getPublishedIntakeDetail`.

- use a structured roll call, not a wall of floating cards;
- display only the existing public fields: display name, display photo, and quote;
- omit the quote when it is null rather than fabricating replacement content;
- lazy-load portraits;
- use face-safe image crops;
- if the roster is large, profile and use progressive disclosure or pagination rather than an unbounded animated list.

### 11.6 Component decomposition

Replace the current 608-line `IntakeDetailClient` with:

- `components/public/intakes/intake-profile.tsx` — server composition
- `components/public/intakes/intake-profile-header.tsx`
- `components/public/intakes/intake-tabs.tsx` — small client boundary
- `components/public/intakes/intake-summary-panel.tsx`
- `components/public/intakes/intake-patch-panel.tsx`
- `components/public/intakes/intake-uniform-panel.tsx`
- `components/public/intakes/intake-gallery.tsx`
- `components/public/intakes/cadet-roster.tsx`

Only the tab state and lightbox require client JavaScript. Media, headings, summaries, and static panels should remain server-rendered.


## 12. Story Archive and Tag Archive

### 12.1 Design intent

Stories are visual records. The query guarantees a cover for archive entries and provides intrinsic width and height, making a stable, image-led archive preferable to the current internal wheel-controlled masonry viewport.

### 12.2 Shared archive engine

Build one archive component used by:

- `/<locale>/stories`
- `/<locale>/stories/tags/<slug>`

Inputs:

- localized route slug;
- descending `years` array;
- `byYear` story groups;
- optional tag name for the filtered view.

Desktop:

- compact sticky year rail;
- normal document scrolling;
- active year highlighted through scroll position or explicit selection;
- one or more year sections remain linkable with stable anchors;
- story entries use supplied intrinsic dimensions to avoid layout shift;
- count-aware editorial arrangements rather than one universal square card.

Mobile:

- horizontal year selector with visible overflow affordance;
- one-column or two-column entries based on available width and orientation;
- normal page scrolling;
- no wheel interception and no nested full-height scroller.

The current `StoriesBrowser` intercepts wheel events and hides the rest of the document inside a fixed-height container. Replace this pattern. It harms discoverability, trackpad behaviour, zoom, mobile browser chrome, and accessibility.

### 12.3 Story entries

Each entry contains only:

- cover path and dimensions;
- title;
- year;
- slug.

Therefore the entry must not imply that a summary, location, or participant count is available. Use image, title, and year only. Add richer fields to the public read model only if the CMS already supplies them safely; do not fabricate them in the component.

### 12.4 Tag context

The tag route adds:

- localized back link;
- tag name as H1;
- localized archive description;
- same year navigation and story grid;
- a valid-tag/no-stories state distinct from an invalid tag/404.

### 12.5 Components

- `components/public/stories/story-archive.tsx` — server-rendered sections
- `components/public/stories/story-year-navigation.tsx` — small client island if active tracking is required
- `components/public/stories/story-entry.tsx`
- `components/public/stories/story-archive-empty.tsx`

Retire the current wheel-controlled `StoriesBrowser` after replacement verification. Reuse `StoryPhotoCarousel` only if its behaviour is redesigned; do not carry its 3D drag interaction into the archive.

## 13. Story Detail

### 13.1 Design intent

The story query does not return a long article body. The page should therefore behave as a photo-led feature or event record, not mimic a text article with absent paragraphs.

### 13.2 Composition

Opening:

- back link and detail marker;
- localized title as H1;
- tags as text links above or below the title;
- summary in a 65–72 character reading column;
- metadata as a semantic definition list: date range, location, and participant count only when present.

Lead media:

- feature cover when present, using its intrinsic ratio;
- video feature when present, with a poster/cover treatment and explicit play action;
- if both cover and video exist, do not autoplay either;
- do not display raw storage URLs as user-facing text.

Gallery:

- all display photos in a count-aware editorial layout;
- no forced square crop;
- lightbox rather than a 3D carousel;
- localized image position and control labels;
- keyboard and touch alternatives to swipe.

Related stories:

- omit the section for zero;
- one item uses a compact feature link;
- two to four use a stable list or grid;
- no unsupported summary text;
- retain the current shared-tag query and four-item limit.

### 13.3 Components

- keep `app/[locale]/stories/[slug]/page.tsx` as the server entry;
- `components/public/stories/story-profile.tsx`
- `components/public/stories/story-profile-header.tsx`
- `components/public/stories/story-media-gallery.tsx`
- `components/public/stories/story-video.tsx`
- `components/public/stories/related-stories.tsx`

Replace or refactor `StoryPhotoCarousel`, `VideoPreview`, and `SimilarStories` to match the new interaction and accessibility requirements.


## 14. Contact Page

### 14.1 Data inputs and limitations

Available data:

- ordered contact reasons with icon key, localized title, and localized description;
- official email;
- Facebook, Instagram, YouTube, TikTok, and X URLs;
- Google Maps location URL.

Contact reasons are informational content. Render each reason as a non-clickable directory row with no link, button, hover action, destination URL, or pointer cursor. Keep official email, social URLs, and the map as the page’s separate actionable channels. Any future application CTA must use the same `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` condition; the existing Explore Intakes and Contact Us hero CTAs remain independent.

### 14.2 Composition

Page header:

- left-aligned eyebrow, H1, and introduction;
- no full-screen map hero;
- maintain a direct path to official email.

Contact directory:

- ordered semantic list;
- icon is secondary and uses a small approved icon map with a safe fallback;
- title and description share a readable grid;
- subtle dividers rather than repeated floating spotlight cards;
- on narrow screens, icon, title, and description stack without truncating text.

Primary channels:

- official email as a clearly labelled `mailto:` action;
- social links as labelled rows or icon-and-label controls;
- do not render an empty icon container when a URL is absent;
- external links use safe `target`/`rel` behaviour and localized indication where needed.

Map:

- place after the task-oriented contact directory on mobile;
- use a stable aspect ratio and bounded height;
- lazy-load the iframe;
- provide an accessible title and an external “open map” fallback if the embed fails;
- do not infer a human-readable address from the URL.

Newsletter:

- use the existing double-opt-in form, Turnstile, rate limiting, and success/error contracts;
- visually distinguish the form as an “official updates” module, not another contact card;
- preserve pending/confirmation language;
- ensure errors are associated with the relevant fields and announced without moving focus unexpectedly;
- avoid custom dropdown interactions if the shared `Select` primitive satisfies the locale and touch requirements.

### 14.3 Components

- keep `app/[locale]/contact/page.tsx` as the server entry;
- `components/public/contact/contact-directory.tsx`
- `components/public/contact/contact-channel-list.tsx`
- `components/public/contact/contact-map.tsx`
- `components/public/contact/newsletter-panel.tsx`

Retire `SpotlightCard` from this route; it adds cursor-following decoration without improving the contact task.

## 15. Newsletter Status Pages

### 15.1 Purpose

Confirmation and unsubscription are utility states. They should be calmer and smaller than marketing pages while still feeling part of the public identity.

### 15.2 Behaviour to preserve

Confirmation states:

- confirmed
- already confirmed
- pending confirmation
- invalid/expired

Unsubscribe states:

- unsubscribed
- already unsubscribed
- pending unsubscription
- invalid/expired

Pending states submit the existing server action with a hidden token. Non-pending states return to the localized site. Token pages remain `noindex` and `nofollow`.

### 15.3 Composition

- narrow status page centred in the normal document flow;
- status marker, H1, concise explanation, and one primary action;
- use the supplied square illustration as a secondary visual, not a mandatory split-screen;
- use semantic success, warning, neutral, and error styling without relying on colour alone;
- keep the existing action visible at 320px and under 400% zoom;
- do not add testimonials, statistics, related stories, or a second CTA;
- never expose or print the raw token in visible content;
- localize all pending-state copy, action labels, and image alt text—the current pages contain hard-coded English pending copy and alt text.

### 15.4 Component

Refactor `components/public/newsletter-status-page.tsx` into a status-specific view that receives a discriminated state rather than a collection of loosely related optional props. Keep route files responsible for mapping query status to localized content.


## 16. Localization Plan

### 16.1 Dictionary structure

Extend `Dictionary` deliberately; do not pass raw English defaults into client components.

Likely new common/shared keys:

- skip to content
- open menu / close menu (reuse after audit)
- switch to light/dark theme (reuse existing keys)
- external link
- open image / close image / previous image / next image / image position
- open map
- loading and retry labels where needed
- back to top only if used

Likely route keys:

- archive count/record labels;
- section introductions introduced by the new hierarchy;
- intake profile record labels;
- story media controls;
- newsletter pending states and action labels;
- contact channel and map labels.

### 16.2 Translation process

For every new key:

1. define the English source string;
2. provide intentional Malay, Mandarin, and Tamil translations;
3. review Chinese and Tamil wrapping rather than machine-translating and accepting line breaks;
4. keep placeholders such as counts and names intact;
5. avoid English uppercase styling assumptions in Chinese and Tamil;
6. verify that the dictionary type remains exhaustive in all four locale files.

Do not hard-code new English strings in components or route files. Do not replace database-managed localized copy with static dictionary copy.

## 17. Accessibility Requirements

The overhaul must meet WCAG 2.2 AA expectations for the redesigned surfaces.

### 17.1 Structure and semantics

- one H1 per route;
- logical H2/H3 hierarchy;
- `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>` used where semantically appropriate;
- icon-only controls have localized accessible names;
- external and internal links have descriptive labels;
- definition-list markup for event/intake metadata;
- decorative rules and images are hidden from assistive technology.

### 17.2 Keyboard and focus

- all navigation, tabs, accordions, dialogs, lightboxes, language controls, theme controls, and forms are keyboard operable;
- no positive `tabindex` values;
- no keyboard trap outside an intentionally modal component;
- dialogs close on Escape and restore trigger focus;
- focus indicators meet contrast requirements on every background;
- mobile sheet and menu close on route change.

### 17.3 Media

- meaningful alternative text is localized and content-specific;
- video controls are keyboard accessible;
- no autoplay with sound;
- any autoplay video must be muted, optional, and disabled under reduced-motion preferences;
- lightbox announces current image position and total;
- portrait and patch alternatives do not repeat nearby visible text unnecessarily.

### 17.4 Motion and zoom

- all functionality works with `prefers-reduced-motion: reduce`;
- no information exists only in hover state;
- layouts work at 400% zoom and 320 CSS pixels;
- sticky headers do not consume excessive viewport height;
- no horizontal page overflow at any supported width.

## 18. Responsive Behaviour

### 18.1 Breakpoints

Use mobile-first behaviour with content-driven adjustments at approximately:

- base: 320–639px
- small tablet: 640–767px
- tablet: 768–1023px
- desktop: 1024–1279px
- wide: 1280px and above

Do not encode every page around the existing `sm`, `md`, and `lg` names alone; compose layouts from the shared grid primitives.

### 18.2 Page rules

Landing:

- hero becomes copy-over-image or stacked copy/image depending on verified crop quality;
- ledger and process sequence stack;
- Best Cadet records remain readable without horizontal overflow.

Intakes:

- index rail becomes a normal list or disclosure;
- entries stack in source order;
- tabs wrap or scroll locally.

Intake detail:

- header stacks identity before media;
- panel contents reflow;
- gallery becomes one column where needed;
- roster uses a single readable column.

Stories:

- year rail becomes a local horizontal scroller;
- archive uses document scroll;
- story metadata becomes a two-column definition list or stacked rows;
- gallery and video never exceed viewport width.

Contact:

- directory, official channels, newsletter, map, and social links follow the mobile order in the plan;
- map has a bounded aspect ratio;
- form controls stack below narrow widths.

Newsletter status:

- status content remains centred but never wider than the reading column;
- illustration may move below copy on small screens.


## 19. Performance and Bundle Boundaries

### 19.1 Server-first rule

- route pages and static content modules remain Server Components;
- database reads stay in `lib/public/content.ts` and route server files;
- client components receive only serializable view models required for interaction;
- no Drizzle or Supabase database client in a client component;
- independent dictionary and content reads continue to use `Promise.all`;
- avoid adding a layout-level database query unless its result is cached and justified.

### 19.2 Client islands

Limit client JavaScript to:

- mobile navigation and theme control;
- tab state;
- lightbox/dialog state;
- year navigation if active-section tracking is necessary;
- newsletter form and Turnstile;
- video play state.

Remove or stop using public components whose sole purpose is decorative motion:

- rotating intake headings;
- wheel-controlled archive containers;
- 3D drag photo carousel;
- autoplay Best Cadet content;
- continuous flowing menu;
- count-up animation;
- pointer-tracking spotlight cards.

### 19.3 Images and embeds

- use `next/image` for all raster public media;
- set accurate `sizes` for split heroes, archive grids, portraits, and galleries;
- prioritize only the home lead image and small header logo;
- lazy-load below-the-fold images;
- do not mark every gallery image as high priority;
- use intrinsic story cover dimensions to prevent layout shift;
- use a poster or cover frame for video instead of loading video bytes on page render;
- lazy-load maps;
- avoid large base64 placeholders and runtime image inspection libraries in the client bundle.

### 19.4 Caching

Before adding cache directives, verify existing Next.js 16 behaviour against `node_modules/next/dist/docs/`. Public content can be cached or revalidated only with a clear invalidation path after Multimedia edits. Do not introduce stale public content merely to improve a synthetic benchmark.

## 20. Metadata and SEO

The redesign must not regress discoverability.

For each indexable public route:

- localized title and description;
- absolute canonical URL based on the configured site URL;
- `hreflang` alternates for `en`, `ms`, `zh`, and `ta`;
- Open Graph title, description, URL, type, and appropriate image when a safe public image exists;
- Twitter metadata where useful;
- one H1;
- descriptive internal links;
- stable slug URLs.

Dynamic route requirements:

- intake detail title/description comes from approved intake content;
- story detail title/description comes from translated title/summary;
- invalid or unpublished slugs return 404;
- tag pages use the localized tag name and approved archive description;
- token pages remain excluded from indexing and sitemap generation;
- newsletter and unsubscribe URLs never enter analytics or visible metadata.

Open Graph images must use public storage paths or bundled assets only. Do not pass private objects to `next/image`.

Review the existing sitemap implementation against this redesign and ensure all published localized intake, story, and tag routes remain discoverable according to current requirements.

## 21. Content and CMS Behaviour

### 21.1 Existing managed content

The following remain CMS/data driven:

- home hero image, counts, FAQs, Best Cadet honours, and related links;
- intake identity, media, explanations, and active cadet roster;
- story title, summary, dates, location, participants, tags, media, and publication;
- contact channels, social URLs, and map URL.

Static interface labels, accessibility text, empty states, and status descriptions remain dictionary driven unless they are user-managed public content under an existing translation table.

### 21.2 Missing-content policy

- omit absent optional modules rather than inventing filler;
- use a localized empty state only when the absence itself is useful to the visitor;
- use the existing verified default hero where the project explicitly provides one;
- do not repeat “coming soon” copy across multiple cards;
- do not parse intake numbers to infer unsupported dates or meanings;
- do not infer story summaries from titles.

### 21.3 Content review

Before launch, review:

- landing page title, introduction, CTAs, and process steps;
- strength-ledger labels and whether all-zero data may be shown;
- intake and story section labels;
- contact wording;
- any new footer statement;
- localized translations for all four languages.

Application-oriented Join the Ranks copy is controlled by `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE`; it is rendered only when the flag is `true` and omitted completely when the flag is `false`.

## 22. Data and Query Changes

The UI overhaul uses the existing public route contracts. The Best Cadet section is backed by the dedicated `best_cadets` and `best_cadet_translations` read model, with a forward migration removing obsolete consent-timestamp and sort-order fields. Any additional read-model change must be justified by a concrete UI or accessibility need.

### 22.1 Existing read models to retain

- `HomePageContent`
- `PublicBestCadet`
- `PublicIntake`
- `PublicIntakeDetail` and nested public types
- `PublicStoryProgram`
- `PublicStoriesByYear`
- `PublicStoryTag` / `PublicStoryTagArchive`
- `PublicStoryDetail`
- `PublicContactReason` / `ContactPageContent`

### 22.2 Optional read-model improvements

Consider only when they remove a concrete UI or accessibility problem:

- return a safe, display-ready intake start year if the archive design needs it;
- expose whether statistics represent real zero values or unavailable fallback data;
- include story cover alt text if the CMS can manage it meaningfully;
- add a video poster path if large-video performance requires one.

Each addition should preserve locale fallback, public-storage safety, and stable pagination/order semantics.

### 22.3 Environment flag

`NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` is the only required feature-flag change for this overhaul.

- keep its canonical definition in `.env.example`;
- validate it through `collectEnvIssues()` in `lib/env/schema.ts`;
- accept only the literal strings `true` and `false`;
- treat missing or invalid values as disabled in page rendering while reporting an environment issue;
- expose a small shared environment accessor rather than duplicating string comparison across components;
- read the literal `process.env.NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` path so Next.js can inline the public build-time value correctly;
- document the build/redeploy requirement in `.env.example` and relevant environment documentation.

No additional database change is required for the rest of this overhaul. The Best Cadet cleanup is captured by `db/migrations/0005_giant_reptil.sql`.

`.env.example` is the canonical variable list. Update `AGENTS.md` and the environment section of `docs/architecture.md` when the accessor is implemented so the documented contract and helper catalog remain synchronized.

## 23. File-Level Implementation Map

The following is the intended target organization. Exact filenames may be adjusted to match local conventions, but responsibilities should remain separated.

```text
app/[locale]/
  layout.tsx                       # locale validation, dictionary, shell
  page.tsx                         # landing server composition
  intakes/page.tsx                 # intake archive server entry
  intakes/[slug]/page.tsx          # intake profile server entry
  stories/page.tsx                 # story archive server entry
  stories/[slug]/page.tsx          # story profile server entry
  stories/tags/[slug]/page.tsx     # tag archive server entry
  contact/page.tsx                 # contact server entry
  newsletter/confirm/[token]/page.tsx
  newsletter/unsubscribe/[token]/page.tsx

lib/env/
  public.ts                         # isJoinTheRankEnabled() accessor
  schema.ts                        # boolean environment validation

docs/
  architecture.md                   # environment/helper catalog updates

components/public/
  shell/
    public-shell.tsx
    public-header.tsx
    public-mobile-nav.tsx
    locale-switcher.tsx
    theme-toggle.tsx
    public-footer.tsx
  shared/
    public-section.tsx
    public-section-heading.tsx
    public-empty-state.tsx
    public-media-frame.tsx
    public-metadata-list.tsx
    public-link-row.tsx
    public-status.tsx
    public-lightbox.tsx
    public-reveal.tsx
  home/
    home-hero.tsx
    strength-ledger.tsx
    join-sequence.tsx
    home-faq.tsx
    external-reference-list.tsx
  best-cadets/
    best-cadet-section.tsx
    best-cadet-lead.tsx
    best-cadet-register.tsx
    best-cadet-portrait.tsx
    best-cadet-meta.tsx
    best-cadet-quote.tsx
  intakes/
    intake-archive.tsx
    intake-entry.tsx
    intake-profile.tsx
    intake-profile-header.tsx
    intake-tabs.tsx
    intake-summary-panel.tsx
    intake-patch-panel.tsx
    intake-uniform-panel.tsx
    intake-gallery.tsx
    cadet-roster.tsx
  stories/
    story-archive.tsx
    story-year-navigation.tsx
    story-entry.tsx
    story-archive-empty.tsx
    story-profile.tsx
    story-profile-header.tsx
    story-media-gallery.tsx
    story-video.tsx
    related-stories.tsx
  contact/
    contact-directory.tsx
    contact-channel-list.tsx
    contact-map.tsx
    newsletter-panel.tsx
  newsletter/
    newsletter-status-page.tsx
```

### 23.1 Existing components to replace or retire after migration

- `components/public/flowing-menu.tsx`
- `components/public/count-up.tsx` if no other surface uses it
- `components/public/scroll-reveal.tsx` or replace it with a visible-by-default variant
- `components/public/stat-card.tsx`
- `components/public/see-also.tsx`
- `components/public/join-the-ranks.tsx`
- `components/public/intakes-timeline.tsx`
- `components/public/stories-browser.tsx`
- `components/public/intake-detail-client.tsx`
- `components/public/testimonials.tsx` (retired; use `components/public/best-cadets/`)
- `components/public/story-photo-carousel.tsx`
- `components/public/video-preview.tsx`
- `components/public/similar-stories.tsx`
- `components/public/newsletter-status-page.tsx`

Before deleting any component, search all routes for remaining imports. A component may be shared outside `app/[locale]` even when its primary public use is being replaced.


## 24. Phased Implementation Plan

### Phase 0 — Baseline and profiling

1. Review the supplied hero and logo at target crops in light and dark contexts.
2. Profile public data cardinality and media dimensions without exposing personal data.
3. Verify the current values of `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` in development and deployment environments.
4. Record baseline screenshots for all routes, themes, and four locales.

Exit criteria: baseline visual/data evidence and the current application-feature flag state are recorded.

### Phase 1 — Foundation

1. Add `.public-site` tokens to `app/globals.css` without changing admin/cadet themes.
2. Update `PublicShell` with the public scope, skip link, and footer.
3. Split and redesign header, mobile navigation, locale switcher, and theme toggle.
4. Add shared public layout, section, media, metadata, empty-state, and status primitives.
5. Add `isJoinTheRankEnabled()` to `lib/env/public.ts`, validate the boolean in `lib/env/schema.ts`, and document the environment contract.
6. Add new dictionary keys to all four locale dictionaries and the `Dictionary` type.

Exit criteria: shell works at mobile/tablet/desktop, keyboard-only, all themes/locales, with no new database query.

### Phase 2 — Landing page

1. Build the asymmetric hero and verified fallback image.
2. Replace statistic cards with the strength ledger.
3. Build the Join the Ranks sequence and render it only when `isJoinTheRankEnabled()` returns `true`.
4. Build the static Best Cadet honours register from dedicated portrait, award-date, inferred-intake, and localized summary/quote records.
5. Rebuild FAQ and external-reference sections.
6. Remove unused decorative client components after import verification.

Exit criteria: home page retains all existing data modules, the application section has correct enabled/disabled states, and the page works with zero Best Cadet records/related links without autoplay or generated filler.

### Phase 3 — Intakes

1. Build the server-first intake archive.
2. Build the intake profile header and fallback media chain.
3. Retain accessible Summary / Patch / Uniform tabbed panels.
4. Build the count-aware gallery and lightbox.
5. Build the roster from the active public fields returned by the existing query.
6. Remove wheel interception, rotating headings, duplicate galleries, and unbounded animated lists.

Exit criteria: published and empty intake states render correctly, the three required tabs remain available, and the roster uses the existing public read model.

### Phase 4 — Stories

1. Build the shared year-grouped archive and tag context.
2. Remove fixed-height internal scrolling and wheel interception.
3. Build the story profile metadata and media composition.
4. Replace the 3D carousel with an accessible gallery/lightbox.
5. Replace the raw-URL video preview with an explicit play feature.
6. Rebuild related stories for zero-to-four results.

Exit criteria: story and tag pages work with one, many, and no related items; no nested page scroller remains.

### Phase 5 — Contact and utility states

1. Build the contact directory and channel list.
2. Replace pointer spotlight cards with semantic rows.
3. Add bounded lazy map and external fallback.
4. Align newsletter form errors, labels, Turnstile, and responsive layout.
5. Rebuild confirmation/unsubscription status views and localize pending states.
6. Verify token secrecy, noindex, and sitemap exclusions.

Exit criteria: contact tasks are obvious on mobile; newsletter mutation behaviour is unchanged; utility states are focused and localized.

### Phase 6 — SEO, accessibility, and performance hardening

1. Audit metadata, canonical URLs, and hreflang on every route.
2. Add safe Open Graph image handling where content permits.
3. Run keyboard, screen-reader, zoom, reduced-motion, and contrast checks.
4. Inspect image `sizes`, intrinsic dimensions, lazy loading, and map/video loading.
5. Inspect client bundle boundaries and remove unused public animation dependencies from route bundles.
6. Check public output for private fields, private storage paths, and raw tokens.

Exit criteria: SEO and privacy requirements pass without changing the route contract.

### Phase 7 — Validation and handoff

Run the project-approved validation commands after implementation:

```bash
npm run lint
npm run typecheck
npm run build
```

Because this is a high-risk public redesign, validation is required even though routine small changes may not automatically run it. Do not add a new test framework; use the existing project workflow and manual route/theme/locale review unless the user explicitly requests automated tests.

## 25. Manual QA Matrix

For every route, test:

- `en`, `ms`, `zh`, and `ta`;
- light and dark themes;
- 320px, 390px, 768px, 1024px, 1440px, and large desktop widths;
- keyboard-only navigation;
- screen-reader labels for controls and status pages;
- `prefers-reduced-motion`;
- 200% and 400% zoom;
- no horizontal overflow;
- no content hidden behind a failed client script;
- valid and empty data states;
- valid, invalid, and unpublished dynamic slugs;
- token states for newsletter pages where safe to simulate;
- metadata and noindex behaviour;
- `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE=true` renders the Join the Ranks section;
- `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE=false` omits the section and all application-oriented process copy;
- missing or invalid flag values fail closed and are reported by environment validation.

Specific route checks:

- home fallback hero when CMS image is absent;
- home with zero Best Cadet records and zero related links;
- intake archive with zero published intakes;
- intake detail with only one media asset;
- intake gallery with one, two, and many images;
- story archive with one year and many years;
- story detail with no cover, no video, no gallery, and no related stories;
- contact with missing social URLs and an invalid map URL;
- newsletter pending, success, already-completed, and invalid states.


## 26. Acceptance Criteria

The overhaul is ready for review when:

### Design

- the site reads as one “Operational Field Record” system across all routes;
- palette, typography, spacing, border, and motion tokens are centralized;
- no route relies on a generic AI-template hero/card/gradient pattern;
- supplied ROTU assets remain the visual source of truth;
- the approved Operational Field Record palette is implemented consistently.

### UX and content

- each route has a composition justified by its data shape;
- optional data produces intentional omission or a useful empty state;
- primary visitor tasks are obvious on mobile and desktop;
- CTA labels describe destinations rather than repeating vague “learn more” language;
- no content is invented to fill layout gaps;
- Join the Ranks content is rendered only when `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` is `true`;
- contact reasons remain informational and non-clickable.

### Technical

- route URLs, slugs, metadata, storage visibility, and newsletter mutation contracts remain intact;
- server components own database reads;
- client boundaries are limited to interaction;
- `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` is validated and consumed through a shared accessor;
- no new animation, UI, or test dependency is introduced unnecessarily;
- Next.js 16-specific implementation choices are checked against local documentation.

### Accessibility and localization

- one H1 and correct heading order per page;
- all new text is translated in all four locales;
- Chinese and Tamil wrapping is reviewed;
- controls meet touch-target and keyboard requirements;
- dialogs, tabs, accordions, lightboxes, and forms are accessible;
- Summary / Patch / Uniform tabs remain present on intake detail;
- reduced-motion and zoom behaviour are correct.

### Privacy and SEO

- no private cadet fields or private storage paths reach public output;
- canonical, hreflang, Open Graph, and sitemap behaviour remain correct;
- newsletter token pages remain unindexed and excluded from the sitemap.

### Performance

- no wheel hijacking, fixed viewport archive, or unnecessary full-page client wrapper remains;
- below-the-fold media is lazy-loaded;
- story dimensions reduce layout shift;
- map and video do not eagerly consume excessive bandwidth;
- no decorative autoplay or continuous animation remains.

## 27. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Invalid or missing `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE` value | Application content appears in the wrong state | Accept only `true`/`false`, fail closed in rendering, and report the issue through `npm run env:check` |
| Flag changed without rebuilding the Next.js app | Deployed output keeps the previous value | Document that `NEXT_PUBLIC_*` values require rebuild/redeploy |
| Contact reasons are accidentally made interactive | Visitors expect unavailable actions | Render them as non-link semantic rows and keep real channels separate |
| Required intake tabs are replaced during refactoring | Functional requirement regression | Keep Summary / Patch / Uniform tabs and include them in acceptance QA |
| Current data cardinality differs from assumed layouts | Clipping or excessive whitespace | Profile data and test zero/one/many states before final tuning |
| Fallback images crop faces or identity marks | Poor representation and accessibility | Use face-safe/object-contain rules and test with real assets |
| Story masonry creates layout shift or inaccessible reading order | Poor usability/performance | Use intrinsic dimensions and document-order editorial grids |
| Header locale/theme controls become crowded | Mobile failure | Put controls in a proper mobile sheet; test 320px and zoom |
| All new strings are added only to English | Incomplete localization | Make `Dictionary` exhaustive and review all four locale files before build |
| Decorative client effects remain in the bundle | Slower public site | Audit route bundles and delete unused public components only after import search |
| New footer invents organizational information | Trust/compliance problem | Limit footer to verified name, navigation, and approved copy |
| SEO metadata is preserved structurally but becomes non-canonical | Discoverability regression | Audit absolute URLs, hreflang, OG images, and sitemap in Phase 6 |

## 28. Confirmed Implementation Directives

The following decisions are fixed and are not implementation questions:

1. Use the approved Operational Field Record direction and semantic palette.
2. Render contact reasons as non-clickable informational rows.
3. Control Join the Ranks and any application-oriented CTA with `NEXT_PUBLIC_JOIN_THE_RANK_ENABLE`.
4. Accept only literal `true` or `false` for the environment flag; fail closed for missing/invalid values.
5. Keep the Summary / Patch / Uniform tabs; do not replace them with anchored sections.
6. Use the existing active public cadet read model without adding a schema or query change for this overhaul.
7. Keep the landing-page data modules and supplied real ROTU assets.

## 29. Definition of Done

The implementation phase is complete when the plan above has been implemented, the public shell and all nine route types use the new system, the environment flag has verified enabled/disabled behaviour, the required intake tabs remain available, and the required validation/manual QA passes have been completed. The final implementation summary should list changed files, removed client interactions, the feature-flag contract, and any deferred optional enhancements.

