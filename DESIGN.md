# Design System — Greenlight

Dark-first editorial aesthetic with a light mode variant. Port of the peec.ai visual language (see `DESIGN-PEEC.md`) into a dark-first filmmaker's tool. Warm canvas, quiet chrome, media-forward — generated images and TMDB posters pop against the background.

## Atmosphere
Dark, cinematic, editorial. Warm undertones, not pure black. Feels like reading a deliberately set magazine, not operating a dashboard. Every surface is a layered paper card (`shadow-paper`), not a bordered box. Generated images and posters drive the visual interest; chrome is quiet and gets out of the way.

## Colors (OKLCH)
- **Background:** `oklch(0.13 0.005 270)` dark / `oklch(1 0 0)` light — near-black with cool undertone in dark, pure white in light
- **Card:** `oklch(0.17 0.005 270)` / `oklch(0.98 0 0)`
- **Muted:** `oklch(0.20 0.005 270)` / `oklch(0.96 0 0)`
- **Primary:** `oklch(0.65 0.2 280)` — violet accent, stays consistent across themes
- **Foreground:** `oklch(0.95 0 0)` dark / `oklch(0.13 0 0)` light
- **Muted foreground:** `oklch(0.55 0.01 270)` / `oklch(0.45 0 0)`
- **Border:** `oklch(1 0 0 / 8%)` / `oklch(0 0 0 / 8%)` — barely-there

### Badge colors (dark-safe pattern)
All status badges use `bg-{color}-500/15 text-{color}-400` — transparent background with bright text. Works across themes.
- **INT scenes:** amber-500/15, amber-400
- **EXT scenes:** sky-500/15, sky-400
- **Success:** emerald-500/15, emerald-400
- **VFX/primary:** violet-500/15, violet-400
- **Destructive:** red-500/15, red-400
- **Hero prop:** amber-500/10, amber-500/90 (with fill-current star icon)

## Typography
- **Sans:** Space Grotesk (`--font-space-grotesk`) — geometric with personality
- **Mono:** Space Mono (`--font-space-mono`) — JSON input, prompts, metadata labels, timestamps
- **Title treatment:** full Google Fonts catalog (1929 families) via dynamic `<link>` — selected display + secondary pair persists to localStorage
- **Weight discipline:** display titles are `font-light` (300), body is default (400), only uppercase meta labels use `font-semibold`/`font-medium`. The peec.ai move is thin display weights with tight tracking — not bold headlines.
- **Display tracking:** `-0.03em` for 44px hero titles, `-0.025em` for 32px viewer titles, `-0.02em` for h2-scale, `-0.015em` for h3. Handled in `@layer base`.
- **Body copy:** 80% foreground opacity (`text-foreground/80`) for prose — never full-opacity body text on paper cards. Headings stay at full opacity.
- **Scale:**
  - 9-10px — uppercase metadata labels with 0.15em tracking (mono)
  - 11-12px — chips, footnotes, secondary metadata
  - 13px — body copy (most prose)
  - 14-15px — card titles, key descriptions
  - 17-20px — logline, taglines, section intros
  - 32px — viewer titles (`font-light`)
  - 44px — hero titles (`font-light`)
  - 2rem-6rem — `/share` page hero titles
- **Section labels (legacy):** `text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground`
- **Section label pill (peec.ai):** `<SectionLabelPill icon={<Icon />}>Label</SectionLabelPill>` — preferred pattern for viewer eyebrows. Small rounded pill with icon, mono caps.
- **Prose line length:** hero-constrained elements cap at `max-w-[60ch]`. Full-width sections have no cap (section dividers span container width, so prose must too).

## Shape language
- **Border radius:** `rounded-[12px]` on cards, `rounded-[10px]` on inner surfaces, `rounded-[6px]` on chips and small containers
- **Borders:** Minimal. Borders are the fallback; `shadow-paper` is the primary card surface treatment. Exceptions: tab underline (`border-b border-border/60`), divider rules.
- **Elevation via `shadow-paper`:** layered inset ring + tiny drop shadow = "paper sitting on darker paper". See `app/globals.css @layer utilities`. Hover variant is `shadow-paper-hover`.
- **Pill elevation (`shadow-pill`):** used on `SectionLabelPill` and the header logo tile — a slightly stronger drop for things that float above the baseline.

## Spacing
- **Section gaps:** `mb-6` to `space-y-14` depending on content density
- **Card padding:** `p-4` standard, `p-5` for rich content, `px-3 py-2.5` for compact
- **Chip padding:** `px-1.5 py-0.5` or `px-2 py-0.5`
- **Grid gaps:** `gap-2` tight, `gap-3` standard, `gap-5` breathing

## Image generation style
All AI-generated images share a single visual language:
- **Style:** Black felt-tip marker on white paper, loose confident linework, crosshatching for shadows
- **Storyboards:** Landscape 16:9, inside rectangular panel borders
- **Posters:** Portrait 5:7 (720×1008), no text/lettering
- **Character portraits:** Square, head and shoulders, centered
- **Prop references:** Square, isolated object, no background detail, no people
- **Rules:** Strictly B&W, no color, no text, no signatures, no watermarks

## Patterns

### Peec.ai patterns (current)
- **Section label pill:** `<SectionLabelPill icon={<Icon size={10} />}>Label</SectionLabelPill>` above every viewer title. Rendered floating above an h1 as an "eyebrow". Set at the top of each viewer and as headers for numbered sections via `SectionHead`.
- **Shadow-paper cards:** every card surface is a `rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover` container. No borders, no heavy backgrounds.
- **`font-light` viewer titles:** 32-44px display titles with tight tracking and leading. Never `font-semibold` on titles.
- **80% body opacity:** prose inside cards uses `text-foreground/80`, not full-opacity white. Creates editorial hierarchy.
- **Inline-grid stat grids:** stats use `inline-grid grid-cols-[repeat(N,Xpx)]` (not `grid-cols-N` with `1fr`) so cells hug content instead of stretching. Labels wrap uniformly via `max-w-[11ch]`.
- **Flat underline tabs:** `border-b border-border/60` container, each tab is a button with an `absolute -bottom-px` underline when active. No pills, no background.

### General
- **Tabbed navigation:** Horizontal tabs with underline indicator. 7 top-level tabs: Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, Posters
- **Sub-tabs:** Same flat underline pattern, used inside Production Design (Props/Wardrobe) and Cast & Crew (Cast/Insights)
- **Collapsible scene cards:** Chevron + scene number chip + INT/EXT badge + slug + time-of-day badge + page range, click row to expand
- **Expand/Collapse all:** text-link pair with separator (`|`) in section headers
- **Batch actions:** "Generate all X" in section header, flips to progress + cancel during run
- **Inline editing:** Pencil icon per card, toggles to textarea with Save/Cancel
- **Hover-reveal actions:** Disable toggle on cast/crew cards, regenerate overlay on portraits/prop images
- **Shuffle buttons:** Consistent icon + label pattern for regeneration (`RefreshCw` + "Shuffle" / "Reshuffle")
- **Header More menu:** Single 3-dot button, opens popover with all secondary actions grouped with dividers
- **Print-friendly:** `.no-print` class + `@media print` resets on `/share` for clean PDF output via browser print

## Shared components
- `components/ui/inline-chip.tsx` — `InlineChip` (inline prose chip for nouns), `SectionLabelPill` (floating eyebrow label used at the top of every viewer)
- `components/ui/section-head.tsx` — `SectionHead` with optional `label` + `labelIcon` props that render a `SectionLabelPill` above the numbered section title
- `components/wizard/header-menu.tsx` — `HeaderButton`, `MoreMenu` (used by both wizard and `/demo`)
- `components/wizard/about-dialog.tsx` — `AboutDialog` (shared between wizard and `/demo`)
- `components/viewers/poster-carousel.tsx` — `PosterCarousel` (used in Overview hero)
- `components/viewers/title-treatment.tsx` — `TitleTreatment` (used in Identity tab)
- `lib/markdown-utils.ts` — `replaceMarkdownSection` (used by every section regenerate handler)
- `lib/image-prompts.ts` — `getStylePrefix`, `loadImagePrompts`, `saveImagePrompts` — user-editable image generation prompts persisted to localStorage
- `lib/cached-projects.ts` — `findCachedProject`, `normalizeTitle`
- `components/share/shareable-view.tsx` — full-bible print view (reuses parsers from every viewer)

## Decisions
- **Dark mode default + light mode toggle** — dark matches A24's aesthetic instinct but light is available via More menu. Inline script in `layout.tsx` prevents FOUC. (2026-04-11)
- **Single-project architecture** — no sidebar, one active project in localStorage (key: `greenlight-project`). (2026-04-10)
- **Consistent B&W sketch style for ALL generated images** — portraits, storyboards, posters, prop refs all share the same marker-on-paper prompt style. (2026-04-10)
- **Violet primary accent** — distinguishes from blue SaaS tools, feels creative/cinematic. (2026-04-10)
- **TMDB for film references** — Similar Moods and Soundtrack References fetch real posters at runtime via `/api/tmdb-search`. (2026-04-11)
- **Prose width caps removed on full-width sections** — section dividers span container width, prose must too. Max-w-[60ch] constraints remain on hero-column content only. (2026-04-11)
- **Fake-gen cache path** — title-matched pre-cached projects skip real generation and show a fake 11-second progression. Deliberately no cached images so the demo stays honest. (2026-04-11)
- **Storyboards live inside Scenes, not a separate tab** — fully inline in each expanded scene card. (2026-04-11)
- **Production Design = props + wardrobe only** — VFX/stunts moved to Insights in Cast & Crew. (2026-04-11)
- **Peec.ai aesthetic port** — dark-first translation of peec.ai's editorial language. Warm canvas, `shadow-paper` elevation, `font-light` display titles, 80% body opacity, section label pills. See `DESIGN-PEEC.md` for the research doc. (2026-04-11)
- **Key Art split into Identity + Posters** — two top-level tabs instead of one tab with sub-tabs. Flatter navigation. (2026-04-11)
- **Crew → Insights** — replaced generic crew list (director, DP, producer, etc.) with situational production Insights that only surface specialty hires the script implies (stunts, VFX, weapons, intimacy, etc.). Baseline roles are assumed, not listed. (2026-04-11)
- **User-editable image prompts** — storyboard/portrait/prop/poster style prompts exposed in Settings, overrides persist to localStorage. API routes accept `stylePrefix` in body. (2026-04-11)
- **Stat grids hug content** — `inline-grid grid-cols-[repeat(N,Xpx)]` instead of stretching `1fr` columns. Fixes "5 unique locations" width overflow. (2026-04-11)

## Anti-patterns
- Light-mode color classes (bg-sky-50, text-amber-700) — always use `/15` opacity + `400` shade pattern for theme safety
- "Regenerate" buttons that rewrite the entire document — always scope regen to a single markdown section via `/api/regenerate-section`
- Text in FLUX-generated images — always suppress with "No text, no labels, no watermarks" in the style prefix
- Symmetric grid layouts for cards when content weights are unequal — prefer asymmetric editorial moves (seen in UX audit feedback)
- Hardcoding font families in title treatment — always go through `pickRandomDisplay` / `pickRandomSecondary` so the full catalog is in play
- Splitting a single regenerate intent across two UI elements (preview + button) — make the entire surface the target
- Stacking context pitfalls — header needs its own `relative z-50` so dropdowns don't get occluded by content below
