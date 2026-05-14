# Greenlight Cinemateca Visual QA

## References Checked

- Greenlight current UI: `http://localhost:3000/demo`
- Cinemateca reference UI: `http://localhost:5174/`, `http://localhost:5174/movie/550`
- Cinemateca `/about` source: `src/app/about/page.tsx`, `src/app/LandingClient.tsx`
- Cinemateca design system: `/Users/san/Projects/cinemateca/DESIGN.md`
- Greenlight design system: `/Users/san/Projects/greenlight/DESIGN.md`
- Current screenshots: `prompt-tests/runs/cinemateca-qa-current-greenlight/`
- Cinemateca reference screenshots: `prompt-tests/runs/cinemateca-reference/`

Note: automated headless capture of Cinemateca `/about` hits a Three.js WebGL context error in `PosterHero`. The movie detail page and homepage captured correctly, and the about page source still provides useful structure and treatment.

## Target Direction

Greenlight should feel like a sister product to Cinemateca, not a separate Peec-style report tool. That means:

- true black canvas
- DM Sans for body/UI
- Instrument Serif only for page-scale titles and cinematic entity names
- restrained borders instead of paper shadows
- neutral pills, no violet-tinted metadata language
- film material provides the color
- reports read like an archive/craft dossier, not like a deck of AI-generated cards
- section rhythm follows Cinemateca detail pages: uppercase label, thin rule, content below

## Main Visual Gap

The current Greenlight report has stronger information architecture than before, but it still carries the old Greenlight/Peec styling:

- Space Grotesk gives it a tech/editorial product voice, while Cinemateca uses DM Sans plus restrained serif titles.
- `shadow-paper` is everywhere, making panels feel floated and soft. Cinemateca is flatter: subtle `--t-bg-card`, `1px` borders, almost no drop shadow.
- The sidebar active state is too loud. The white filled row feels like a selected SaaS nav item, not Cinemateca chrome.
- `DepartmentLens` makes each tab feel like a generated presentation section. Cinemateca detail pages do not explain the lens so heavily; the content carries the section.
- Many labels are 8-9px with low opacity. That works badly in a long reading surface and is below the project accessibility floor unless contrast is very high.
- Several grids are still two-column where the content wants one-column reading rows.
- Light mode now fights the sister-product premise. Cinemateca is dark-first and true black.

## Product-Level Fixes

### 1. Replace Greenlight tokens with a Cinemateca bridge

Move Greenlight from the warm OKLCH paper system to `--t-*` tokens that map closely to Cinemateca:

- `--t-bg: #000`
- `--t-bg-card: rgba(255,255,255,0.03)`
- `--t-bg-card-hover: rgba(255,255,255,0.05)`
- `--t-border: rgba(255,255,255,0.06)`
- `--t-border-medium: rgba(255,255,255,0.08)`
- `--t-border-strong: rgba(255,255,255,0.12)`
- `--t-text`, `--t-text-2`, `--t-text-3`, `--t-text-4`, `--t-text-5`
- `--t-space-*`, `--t-radius-*`, `--t-font-*`

Keep shadcn compatibility variables, but make them aliases to the Cinemateca-like tokens.

### 2. Swap typography

Use Cinemateca's font pairing:

- DM Sans for report UI and body copy.
- Instrument Serif for report title moments only.
- Remove the global `Space Grotesk` voice from the core app.
- Keep Space Mono only where screenplay data genuinely benefits from monospaced numerals, scene IDs, page ranges, and JSON.

### 3. Redesign report shell

The current app header can move closer to Cinemateca:

- smaller fixed top header
- wordmark-style Greenlight mark
- center or left nav only if needed
- command buttons as neutral bordered pills
- no paper elevation in header

The report sidebar should become a Cinemateca-style side nav:

- transparent or barely-carded container
- active state as text brighten plus left rule or subtle inset underline
- role labels readable at 10-11px, not 8px
- no white filled active pill
- optional current tab URL hash/query support

### 4. Replace `DepartmentLens`

`DepartmentLens` should be retired or heavily reduced. Use a shared report header closer to Cinemateca `ArchiveHeader` / movie-detail rhythm:

- small uppercase eyebrow
- large title
- short description
- optional metric cards in a restrained row
- no "Department Lens" explainer box

The role/persona can stay in the sidebar and a small metadata row, but it should not dominate every tab.

### 5. Replace report cards with Cinemateca primitives

Create Greenlight-local equivalents inspired by Cinemateca:

- `ReportHeader`
- `ReportSection`
- `ReportCard`
- `ReportMetric`
- `ReportTag`
- `ReportDefinitionList`
- `ReportMediaRow`

These should consume tokens and avoid raw Tailwind color/size sprawl.

## Tab-by-Tab QA

### Overview

Current strengths:

- Good first impression with poster imagery.
- The content is readable and already content-forward.

Needed changes:

- Use Instrument Serif for the film title, closer to movie detail pages.
- Reduce the poster carousel chrome and align it to Cinemateca poster treatment.
- Move identity facts into `DetailStat`-style cells or a definition list.
- Replace tagline card with a quieter text list.

### Mood & Tone

Current strengths:

- The vertical reading flow works.
- Tonal tags and references are good content types.

Needed changes:

- Replace pill-eyebrow labels with Cinemateca `Section` headers.
- Soundtrack references and similar moods should be one item per row, fixed poster ratio, with poster, title, year, composer/source, and note.
- Remove paper shadows from reference cards.
- Keep descriptors, but use neutral `Tag` treatment.

### Scenes

Current strengths:

- This is the most useful operational tab.
- Expanded scene cards expose actual script evidence.

Needed changes:

- Make the top stats a Cinemateca metric strip, not a centered card.
- Scene cards should feel like rows in a production breakdown, flatter, with cleaner dividers.
- Move action controls into one compact toolbar.
- Reduce visual noise from many small chips.
- Keep expanded details, but use a definition-list layout for props, wardrobe, VFX/stunts, notes.

### Locations

Current strengths:

- The new scout read is useful.
- Full-width rows fixed the earlier readability issue.

Needed changes:

- Remove the large Department Lens hero treatment.
- Keep the scout read as a single full-width section with rows.
- Convert risk metrics to `MetricCard` style.
- Use neutral tags for `INT/EXT`, dawn/dusk/night. Remove violet fills.
- Location cards should mirror a movie-detail section list: label, description, requirements, visual moments.

### Cast & Crew

Current strengths:

- Casting lens is the right role.
- Specialty hire logic is useful.

Needed changes:

- Separate casting energy from production insights. Right now "Cast & Crew" risks feeling like mixed responsibilities.
- Character cards should read closer to Cinemateca `PersonCard`: portrait, name, role burden, scenes, notes.
- Specialty hires should become a compact list of operational flags, not another set of heavy cards.

### Production Design

Current strengths:

- Props and wardrobe are the right buckets.
- Hero props are valuable for visual development.

Needed changes:

- Replace sub-tab style with Cinemateca `DetailTabs` treatment.
- Prop cards should be a tighter artifact list: object, scenes, why it matters, visual note, image slot.
- Wardrobe should become a character-by-character continuity table.
- Remove amber/violet status tints unless they are true semantic alerts.

### Title & Palette

Current strengths:

- Palette extraction is one of the more demo-friendly areas.
- Title preview is useful.

Needed changes:

- This tab currently diverges most from Cinemateca because it pulls in arbitrary Google font choices.
- Keep generated type exploration, but frame it as "directions" rather than letting one giant preview dominate.
- Use Cinemateca-like palette rows: swatch, name, hex, evidence, scene/moment.
- Title treatment should use restrained typography unless the report explicitly calls for a bolder direction.

### Poster Concepts

Current strengths:

- Strongest fit with Cinemateca because it is poster/media-led.
- Good candidate for image-first treatment.

Needed changes:

- Poster concept cards should align to poster gallery conventions: poster frame first, text below or beside.
- Add one-line thumbnail read and one-line avoid note as explicit scan fields.
- Keep campaign logic, but reduce long prose walls.
- Make generated poster images follow fixed aspect ratio and avoid layout shifts.

## Implementation Plan

1. Token and type migration
   - Add Cinemateca-style tokens to Greenlight `app/globals.css`.
   - Swap fonts in `app/layout.tsx`.
   - Keep compatibility variables so existing shadcn components do not break.

2. Report primitives
   - Add shared Greenlight report primitives inspired by Cinemateca, not copied blindly.
   - Replace `DepartmentLens`, `ReportPanel`, `EvidencePill`, and `SectionHead` usage in report tabs.

3. Shell and navigation
   - Redesign demo header and sidebar.
   - Make active state quieter.
   - Consider URL-backed tab state.

4. High-value tab rewrite
   - Start with Overview, Mood & Tone, Locations, Scenes.
   - These are the surfaces the user scans first and the ones with obvious readability wins.

5. Craft tabs
   - Production Design, Cast & Crew, Title & Palette, Poster Concepts.
   - These need more content-shaping decisions, so do them after primitives are stable.

6. Visual QA
   - Screenshot every tab at desktop width.
   - Check one narrower desktop width even though the product is desktop-only.
   - Run build and targeted lint.

## Open Questions

1. Should Greenlight become dark-only for now, matching Cinemateca, or should light mode stay as an unsupported secondary option?
2. Should the logo remain the current Greenlight icon, or should the header move to a simple wordmark treatment like Cinemateca?
3. Should the visible product name stay "Greenlight", or should the UI imply "Cinemateca Greenlight" as a suite/sister-product relationship?
4. Should the report keep the film-role labels visible in the sidebar, or should those become secondary metadata inside each tab?
