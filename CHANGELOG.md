# Changelog

All notable shipped features and changes, organized by date.
Updated every session via `/save-session`.

---

## 2026-04-16 (session 7 — audit + wave 1 landing fix)

Five-agent deep-refactor audit. Wave 1 Phase 1.1 (landing hierarchy) shipped here; Wave 2 structural work moved to parallel `greenlight-refactor` folder.

### Features
- **Landing hierarchy inverted** (`step-instructions.tsx`) — demo cards are now the hero instead of buried below an "or" divider. Two cards: Night of the Living Dead (finished deck, links to `/demo`) + Everything Everywhere All At Once (live walkthrough via cached-JSON submission). Upload/Paste drops to secondary affordance under a "Or bring your own" divider.
- **Deep-refactor audit** — `deep-refactor-report.md` from 5 parallel agents (Architect / Optimizer / Pragmatist / Domain Expert / Outsider). 11/20 health score, two-wave migration blueprint.

### Deferred to Wave 1 (pre-interview, still to do)
- Phase 1.2 — wardrobe matcher bug (`production-viewer.tsx` substring collision on character names)
- Phase 1.3 — shuffle/regenerate optimistic feedback (mood, overview, identity viewers)

### Deferred to Wave 2 (post-interview, tracked in `greenlight-refactor` folder)
- Markdown → JSON migration (the "Big Idea" 3/5 agents independently named)
- `shareable-view.tsx` unification (`variant="print"` on viewers, delete 1060-line duplicate)
- Zustand store (full Phase 2.3)

### Status: committed to main, not yet deployed to greenlight-app-red

---

## 2026-04-12 (session 6)

Audit-driven copy overhaul, PDF upload, EEAAO images, parallel image generation.

### Features
- **PDF screenplay upload** — new `/api/extract-screenplay` route + drag-and-drop UI tab. Claude Sonnet 4.6 extracts structured JSON from PDF.
- **Two-tab home screen** — "Upload PDF" and "Paste JSON" modes side by side
- **EEAAO cached images** — 67 images (storyboards, portraits, props, posters) committed to `public/demo-images/eeaao/`
- **Fake image generation** — cached projects load pre-committed images with staggered delays instead of calling fal.ai
- **EEAAO PDF auto-detection** — dropping the EEAAO PDF triggers fake extraction + cached flow, zero API cost
- **Parallel image generation** — staggered 500ms starts instead of sequential, ~5-10x faster
- **Cancel + payment error detection** — stop button works mid-flight, 402 errors shown clearly
- **Copy overhaul** — "pre-production bible" → "vision deck" across all surfaces, tabs renamed, subtitles rewritten
- **Production executive audit** — full 10-point domain audit saved as `audit-review.md`

### Fixes
- README rewritten with "vision deck" framing, accurate tab names, Gemini recommendation
- About dialog updated to match new tab names and language
- Generation screen title → "Building your vision deck"
- Wizard stepper: "Extract" → "Start", "Results" → "Review"

### Status: committed locally, needs Vercel deploy

---

## 2026-04-12 (session 5)

Vercel deployment, UI polish pass, and consistency audit across all viewers.

### Features
- **Vercel deployment** — live at `greenlight-app-red.vercel.app` with password gate, all API keys as env vars
- **Password gate** — `components/password-gate.tsx` + `/api/verify-access`, sessionStorage-based, skips when no `ACCESS_PASSWORD` env var
- **Image routes Vercel-compatible** — removed filesystem caching, return fal.ai CDN URLs directly
- **`acceleration: "regular"`** on all image routes (~40% faster generation)
- **Home NUX redesign** — 3-step vertical card flow (Upload to Gemini → Copy JSON → Paste here), inline JSON textarea, demo card with poster thumbnail, eliminated separate Paste JSON wizard step
- **Pill-style tabs with icons** — replaced underline tabs across all document viewers
- **Poster prompt controls** — regenerate, rewrite, edit, copy, show/hide prompt on each poster card (matching scene storyboard controls)
- **Start Over confirmation** — styled AlertDialog instead of browser confirm()
- **Theme toggle in main nav** — icon-only HeaderButton, removed from More menu
- **Share in main nav** — moved from More menu to header
- **Stop button on generation** — cancel document generation mid-flight to save credits
- **Collapsible prose** — Atmosphere and Music sections show 3 sentences with "Read more" toggle
- **Poster placeholder in Overview** — dashed card that navigates to Posters tab when no posters exist
- **About dialog redesign** — clean numbered document list, no rainbow colors, updated tech stack references
- **Cached project timing** — varied per-document (18s total with ±20% jitter) instead of flat 2.2s each
- **A24 poster prompt** — new default poster style prefix with risograph/arthouse aesthetic
- **Expand/Collapse toggle** — merged into single button across scenes, posters, locations

### Fixes
- **INT/EXT and time-of-day badge contrast** in light mode (darker text colors)
- **Segmented control** (Sequence/Location) — solid `bg-foreground` active state visible in both modes
- **UI consistency audit** — all viewer H1 titles → 32px, subtitles → 13px foreground/60, SectionLabelPill margins → mb-3
- **Scene title** changed from movie name (redundant) to "Scene-by-scene map of the film"
- **Tagline** updated to "Script to pre-production bible in minutes." across header, demo, about
- **Response cache** silently skips on read-only filesystems (Vercel)
- **Removed dead UI** — per-document Download button, fal.ai Settings field, Add Scene button, Download JSON menu item
- **Global zoom 1.1** — 10% font size bump via CSS zoom
- **Gemini recommended** for extraction (was Claude/ChatGPT)
- **Sample data** switched from NotLD to EEAAO for "try with" link

### Status: committed locally, needs Vercel redeploy

---

## 2026-04-12 (session 4)

Image generation overhaul. Switched from FLUX Schnell to FLUX dev + Gesture Draw LoRA for B&W gesture sketch output across all image types.

### Features
- **Gesture Draw LoRA integration** — all 4 image routes (`generate-image`, `generate-portrait`, `generate-prop`, `generate-poster-image`) switched from `fal-ai/flux/schnell` to `fal-ai/flux-lora` with [glif/Gesture-Draw](https://huggingface.co/glif/Gesture-Draw) LoRA. Black ink on white paper, rough expressive lines, negative prompt blocks color/photorealism.
- **Per-kind style prefixes** — storyboards/portraits/posters use "rough lines, minimal background"; props use "bold linework, close-up filling the frame" for visibility.
- **Negative prompt support** — all routes now send `negative_prompt` to block color, sepia, warm tint, photorealism. Eliminates color leakage from AI-generated subject prose without prompt sandwich gymnastics.
- **Crew → Insights** — replaced generic crew list (Writer, Director, Producer, etc.) with 15 situational production insights that only fire when the script justifies them (stunts, VFX, weapons, pyro, night shoots, etc.).

### Data
- **42 demo images regenerated** — all storyboards (13), portraits (8), props (6), and posters (15) in `public/demo-images/` now use Gesture Draw B&W sketch style. Cost: ~$1.47.
- **A24 bonus-round samples removed from backlog** — already completed.

### Fixes
- Props visibility — Gesture Draw LoRA rendered isolated objects as near-invisible sparse lines. Fixed with "bold linework, close-up filling the frame" in the prop style prefix only.

### Status: committed (via auto-hook), demo images committed

---

## 2026-04-11 (session 3)

Peec.ai aesthetic port across every viewer. The app went from "well-structured dark dashboard" to "editorial dark mode that feels cinematic and deliberate."

### Features

#### Visual system
- **peec.ai-inspired design language** — warm canvas tokens, inset-ring `shadow-paper` elevation (no borders), 80% body copy opacity, `font-light` display weights, tight `-0.025em` tracking. Dark-first translation of a light-mode reference.
- **`SectionLabelPill` + `InlineChip`** — new reusable components (`components/ui/inline-chip.tsx`) for eyebrow labels and inline prose chips. Used on every viewer as the signature peec.ai label pattern.
- **`SectionHead` with optional label pill** — extended (`components/ui/section-head.tsx`) to render floating `SectionLabelPill` above numbered section titles.
- **`DESIGN-PEEC.md`** — deep peec.ai design reference (tokens, patterns, component recipes, phased redesign plan) committed as part of the visual system docs.

#### Every viewer rebuilt
- Overview / Mood & Tone / Scenes / Locations / Cast & Crew / Production Design — each got its own label pill eyebrow, `font-light` title, section pills, and `shadow-paper` cards.
- **Key Art split into 2 tabs** — `Identity` (color palette + title treatment) and `Posters` (AI poster concepts). Deleted `key-art-viewer.tsx`, added `identity-viewer.tsx` + `posters-viewer.tsx`.

#### Stat grid shrink
- Stat grids switched from `grid-cols-6` (stretching `1fr`) to `inline-grid grid-cols-[repeat(N,Xpx)]` so cells hug content instead of the container.
- Leading-number parsing (`/^(\d[\d.,]*)/`) so "5 unique locations" displays as "5" + label instead of overflowing.
- Labels wrap to 2 lines uniformly via `max-w-[11ch]` for consistent cell heights.
- Applied to: Overview (6 × 120px), Scenes (3 × 140px), Production Design (3 × 160px).

#### Image prompt customization
- **`lib/image-prompts.ts`** — shared module with `ImagePromptKind`, `DEFAULT_IMAGE_PROMPTS`, `getStylePrefix()`. Overrides persist to localStorage.
- **Settings dialog expanded** with 4 textareas (storyboard / portrait / prop / poster) with per-field Reset buttons.
- **All 4 image API routes** now accept `stylePrefix` in body and fall back to defaults. Bulk generate loop in `wizard-shell.tsx` threads `getStylePrefix(kind)` through every call.

#### Loading UI
- **`step-generating.tsx` fully rewritten** — call-sheet pattern with `[◉ PRE-PRODUCTION BIBLE]` label, film-strip segmented progress bar, per-document elapsed time tracking via `docTimesRef`, cinema vocabulary (Queued / Rolling / In the can), shimmer sweep animation on the active row.

#### Logo & favicon
- New logo: 4 black corner triangles forming diamond negative space on a white tile.
- `public/logo.svg` with `fill="currentColor"` + white tile wrapper in header/demo/about.
- `app/icon.svg` favicon with baked-in white background (replaced `app/icon.png`).

#### Crew → Insights
- **`suggestCrewRoles()` → `computeInsights()`** in `cast-and-crew-viewer.tsx`. Dropped 8 generic baseline roles entirely. Replaced with 15 situational heuristics that only fire when the script justifies them: stunts, VFX, practical makeup, weapons, pyro, water, intimacy, animals, picture cars, night shoots, exteriors, location density, large ensemble, minors, movement/music, period piece.
- Each insight card: lightbulb icon, title, mono signal chip with real counts, recommendation in line-producer voice.
- Empty state for scripts with no specialty needs.
- Demo screenplay fires 9 insights on first render.

### Fixes
- Stat value overflow — leading-number regex extract so numeric stat values render cleanly alongside wrapping labels.
- Playwright `getByText("Settings")` strict-mode violation — switched to `getByRole` with `exact: true` in QA scripts.

### Status: committed (modifications via auto-hook), untracked new files pending single checkpoint commit

---

## 2026-04-11 (session 2)

Massive iteration session. Full tab restructure, new routes, visual content generation, layout exploration. Net result: the app became a real portfolio piece instead of a wizard demo.

### Features

#### New tabs and major restructures
- **Key Art** replaces Visuals — sub-tabs: Identity (color palette + title treatment) and Posters
- **Production Design** replaces Production — props + wardrobe only, VFX/stunts moved into scene cards + Crew heuristic
- **Storyboards merged into Scenes** — inline in each expanded scene card with image + metadata + actions
- **6 tabs total:** Overview / Mood & Tone / Scenes / Locations / Cast & Crew / Production Design / Key Art

#### Overview
- **Hero restructure** — title + logline + taglines + Film Identity (left column, max 60ch) + PosterCarousel (right column, cycles through generated posters)
- **Taglines** card with Shuffle button (regenerates 3 new via `/api/regenerate-section`)
- **Writer credit** rendered in Film Identity, pulled from new JSON field

#### Mood & Tone
- **Similar Moods** — 4 TMDB posters with descriptions (replaces text-only Comparable Films)
- **Soundtrack References** — 4 film scores with TMDB posters + composer credits, horizontal 2-col grid
- **Color palette** compact 2-col with Reshuffle button (moved to Key Art)
- **Section reorder:** Atmosphere → Tonal Descriptors → Reference Points → Music & Sound → Similar Moods
- **Music shuffle button** regenerates prose + soundtracks via `/api/regenerate-section`

#### Key Art
- **Title Treatment** with full 1929-font Google Fonts catalog (category-filtered), per-slot shuffle + shuffle-both
- Selected font pair persists to localStorage across sessions
- **Color Palette** rendered as Identity sub-tab's first section
- **Poster Concepts** as second sub-tab with expand/collapse all

#### Scenes
- **Storyboard frames inline** — full-width in each expanded scene card, with camera/lighting/mood metadata and 4 action buttons (Regenerate / Rewrite prompt / Edit prompt / Copy)
- **Sequence/Location toggle** — Location mode groups scenes by location ordered by first appearance
- **Generate all frames** header button

#### Locations
- Expand/collapse all header controls
- First location expanded by default

#### Cast & Crew
- **Disable toggle** on every card (hover-reveals eye icon, 40% opacity when disabled, persists to SavedProject)
- **Writer** surfaced as a crew role from JSON field
- **Stunt Coordinator** added to crew heuristic when script has combat/stunt beats

#### Production Design
- **Prop reference image generation** — `/api/generate-prop` (sketch-style, matching portrait aesthetic), per-prop + bulk generate, `propImages` on SavedProject
- **Removed VFX sub-tab** — props + wardrobe only

#### Header and navigation
- **Consolidated to Start Over + 3-dot More menu** (all other actions live in the menu)
- **Generate all images** in More menu — parses current project for missing images across portraits/props/storyboards/posters, runs them sequentially with live progress pill next to Start Over (click to cancel)
- **Header progress pill** shows done/total while generate-all is running
- **Theme toggle** (dark/light) in More menu, persists via localStorage with inline init script
- **Custom logo** — pinwheel SVG/PNG replacing the document icon, also favicon via `app/icon.png`
- **Tagline** updated to "A 1st AD's first pass." across header/About/metadata
- **About dialog** extracted to shared component, content updated to current tabs

#### /share route
- **Full-bible print-friendly page** — rewritten from one-pager. Every tab's content rendered flat: Taglines, Synopsis, Film Identity, Themes, Scope, Atmosphere, Tonal Descriptors, Reference Points, Music & Sound + Soundtracks, Color Palette, Similar Moods, Scenes (with inline storyboards), Locations, Cast, Production Design · Props, Poster Concepts
- **Table of contents** after hero, dynamic based on what's populated
- **Writer credit** under title
- `break-inside: avoid` on every card for clean PDF page breaks
- Parsers shared across viewers (no duplication)

#### /demo route
- **Committed snapshot** system — `lib/demo-project.ts` backed by `/api/save-demo` (dev-only)
- Full Greenlight header on the demo page (logo + title + tagline + Start Over + More menu with theme toggle + About)
- Image URLs rewritten to `/demo-images/` on save, committed to git

#### Fake-generation cache
- **`lib/cached-projects.ts`** — Record of pre-cached projects keyed by normalized title
- **`/api/save-cached`** — dev-only endpoint, upserts current project text-only (no images) into the cache file
- **Title-match on JSON submit** — `findCachedProject()` checks the title, returns cached documents if found
- **StepGenerating fake mode** — `prefilledDocs` prop triggers a 2.2s-per-step fake progression instead of real Claude calls (~11s total vs 3 min)
- **EEAAO cached** as the first entry via "Save to cache (dev)" menu item

### Data
- **1929 Google Fonts** added via static `lib/google-fonts-catalog.json` from the public fonts.google.com metadata endpoint
- **NotLD JSON sample** updated with `writer` and `based_on` fields

### Routes added
- `/api/generate-prop`
- `/api/regenerate-section`
- `/api/save-cached`
- `/api/save-demo`
- `/api/tmdb-search`
- `/demo`
- `/share`

### Fixes
- Prose width caps removed on Mood & Tone atmosphere/music, Overview synopsis/themes/complexity, Scenes expanded cards (was max-w-[68ch], now fills container to match section divider width)
- Z-index of header + More menu bumped above poster carousel (was getting occluded)
- Duplicate React key warning on descriptors fixed (use `${i}-${d}`)
- `trimForOverview` now includes `writer` and `based_on` fields (was silently stripping them before Claude saw them)
- Unused imports cleaned from shareable-view and wizard-shell
- Scene-breakdown viewer now supports location grouping without duplicating the per-scene render code (extracted to inline renderScene function)
- Storyboard prompt text now collapsed by default with expand toggle
- Title treatment secondary font bumped from 15px to 20px
- Header demoted from the main wizard to share across wizard-shell + /demo page (HeaderButton + MoreMenu + AboutDialog extracted)

### Layout exploration
- Ran `/explore` skill on Home / Extract Screenplay Data page with Shuffle Layout mode
- Generated 4 standalone HTML variants in `/tmp/explore-home/`: Asymmetric Editorial, Dense Grid, Single-Column Narrative, Sidebar Driven
- User hasn't picked a direction yet

### Status: mostly uncommitted (many auto-checkpoints captured tracked files; ~32 new files still untracked including all new viewers, routes, libs, docs)

---

## 2026-04-10 (session 1)

### Features
- **Greenlight** — full app built from scratch (renamed from "Script to Production")
- **5-document generation** — Scene Breakdown, Production, Marketing Brief, Storyboard, Posters from screenplay JSON
- **Storyboard image generation** — B&W felt-tip marker sketch style via FLUX Schnell (fal.ai), per-scene or batch
- **Poster concept sketches** — portrait aspect ratio poster sketches, per-concept or batch
- **Character portraits** — AI-generated B&W portraits replacing initials on character cards, batch generation
- **Inline editing** — edit scenes (add/remove/modify), marketing brief sections, storyboard prompts
- **Prompt rewriting** — AI rewrites storyboard prompts for alternative visual interpretations
- **On-demand marketing sections** — Festival Strategy, Distribution Positioning, Pitch Deck, Social Hooks, Casting Wishlist, Music Direction
- **Production department tabs** — Characters, Locations, Production Design, Technical (replaced single long scroll)
- **Project management** — sidebar with rename, duplicate, delete projects
- **Full state persistence** — all images, edits, prompt overrides saved to localStorage + disk
- **Sample data** — Jaws and Ex Machina pre-loaded as demo projects
- **Settings dialog** — Claude API key + fal.ai key management in browser
- **About dialog** — feature overview with colored icons, how-it-works steps, credits
- **Dark mode** — Runway-inspired aesthetic with violet accent, Space Grotesk + Space Mono fonts
- **Input hash caching** — API responses cached per-input so same screenplay data returns instant results

### Fixes
- Fixed cache keying (was slug-only, now slug + input hash — different screenplays get different results)
- Fixed document content persistence (edits to Marketing Brief and Scene Breakdown now survive reload)
- Fixed storyboard act parser (non-act headings like "Prompt Modifiers" no longer break scene grouping)
- Fixed scene number comparison in act grouping (now uses array indices, works with non-sequential numbering)
- Fixed duplicate React key warning for characters with same name
- Merged Primary/Secondary Audience into single Target Audience section
- Removed broken "Regenerate" button from color palette (was rewriting entire document)

### Status: committed
